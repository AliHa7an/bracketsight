import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { formatDate } from "@/lib/paycheck/format";
import { rulesMeta } from "@/lib/paycheck/rules-meta";
import { ErrorState } from "@/components/ui";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/paycheck/changelog");

const link =
  "text-ink underline decoration-rule underline-offset-4 hover:decoration-current";

const entries = [
  {
    date: "2026-08-08",
    title: "Initial engine build (pre-launch)",
    items: [
      "Encoded all four OBBBA deductions — tips, overtime premium, senior, car-loan interest — with the shared-MAGI phase-out interaction and the marginal next-$1,000 analysis.",
      "Encoded a representative qualified-occupation list of roughly 65 occupations with TTOC-style codes, pending reconciliation with the final IRS publication.",
      "Money math is integer cents throughout; rates are basis points. 52 engine tests cover the caps, both phase-out models, and the bracket table.",
    ],
  },
];

export default function ChangelogPage() {
  const meta = rulesMeta();

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1>Changelog</h1>
        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          When a rule changes we change one versioned file and log it here within 48 hours.
          Current rule bundle: <span className="num">{meta.version}</span>.
        </p>
      </header>

      {meta.unverified.length > 0 ? (
        <ErrorState
          cause="Not launch-ready."
          fix={
            <>
              <span className="num">{meta.unverified.length}</span> rule sets still read
              unverified. The values were checked against IRS primary sources on{" "}
              <span className="num">15 Aug 2026</span>, but the citation entries inside the files
              still point at placeholder addresses rather than the documents actually read, and
              several rules — the pre-existing <span className="num">65+</span> standard
              deduction and most car-loan eligibility conditions — are described but not
              encoded. Tracked in VERIFICATION-STATUS.md.
            </>
          }
        />
      ) : null}

      <div className="flex flex-col gap-6">
        {entries.map((entry) => (
          <section
            key={entry.date}
            className="rounded-atlas hairline-all px-4 py-3"
            style={{ borderRadius: "var(--radius-atlas)" }}
          >
            <p className="micro-label num">
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            </p>
            <h2 className="mt-1" style={{ fontSize: "var(--text-step-1)" }}>
              {entry.title}
            </h2>
            <ul className="mt-2 flex list-none flex-col gap-2 p-0">
              {entry.items.map((item) => (
                <li
                  key={item}
                  className="hairline-b pb-2 text-dim last:border-b-0"
                  style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="density-reading">
        <h2>What has to be in an entry?</h2>
        <p>
          Five things, and an entry missing any of them is not finished. The date. The rule file
          and version string that changed. The primary source it was changed against, named
          specifically enough to re-read — a form line or a code subsection, not a homepage. What
          the change does to a computed deduction, in the direction it moves it. And confirmation
          that the test suite was re-run, with a regression test added where a value moved.
        </p>
        <p>
          The fourth is the one that matters to a household. &ldquo;Corrected the phase-out
          rounding&rdquo; says nothing useful; &ldquo;the step is now rounded down, which raises
          the tips and overtime deductions by up to <span className="num">$100</span> each for
          anyone above the threshold&rdquo; tells you whether your own figure moved and which way.
        </p>
      </section>

      <section className="density-reading">
        <h2>What triggers an entry?</h2>
        <p>
          Any edit to a rule file. That includes the obvious cases — a cap, threshold, rate or
          eligibility date — and three quieter ones that count just as much: a rounding
          convention applied in the wrong direction, a citation URL or label that turns out to be
          wrong, and an occupation code whose title does not match the official list. The last of
          those is not cosmetic. A code read off a W-2 that this site labels with the wrong
          occupation is a wrong answer, however tidy the arithmetic beneath it.
        </p>
        <p>
          Rewriting how a deduction is explained does not get an entry. Changing what it computes
          always does, even when the visible effect is a few cents, because the point of the
          record is that no number moves silently.
        </p>
      </section>

      <section className="density-reading">
        <h2>How are the rule files versioned?</h2>
        <p>
          Six files back this section, one per rule set, each named{" "}
          <span className="num">rule-set-taxyear.revision</span>:
        </p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          <li className="hairline-b pb-2">
            <span className="num">tips-2026.1</span> — the{" "}
            <span className="num">$25,000</span> cap, thresholds, and the floored{" "}
            <span className="num">$1,000</span> step.
          </li>
          <li className="hairline-b pb-2">
            <span className="num">overtime-2026.1</span> — the split single and joint caps, and
            the share of the overtime hour that qualifies.
          </li>
          <li className="hairline-b pb-2">
            <span className="num">senior-2026.1</span> — the per-person amount, the qualifying
            age, and the percentage-of-excess phase-out.
          </li>
          <li className="hairline-b pb-2">
            <span className="num">car-loan-2026.1</span> — the cap, the vehicle conditions, and
            the step that deliberately rounds up.
          </li>
          <li className="hairline-b pb-2">
            <span className="num">brackets-2026.1</span> — the four bracket tables and the
            standard deduction.
          </li>
          <li className="hairline-b pb-2">
            <span className="num">occupations-2026.1</span> — all{" "}
            <span className="num">71</span> Treasury Tipped Occupation Codes.
          </li>
        </ul>
        <p>
          The tax year is in the filename because these rules are annual, not perpetual. Each
          file carries an <span className="num">effectiveFrom</span> of{" "}
          <span className="num">1 Jan 2026</span> and an{" "}
          <span className="num">effectiveTo</span> of{" "}
          <span className="num">31 Dec 2026</span>, so a change for a later year creates a new
          file rather than editing this one — and the bundle identifier above is assembled from
          the files themselves, so it cannot claim a version the engine did not run. These files
          must not be cloned past tax year <span className="num">2028</span>, where the statutes
          sunset.
        </p>
      </section>

      <section className="density-reading">
        <h2>What is pending verification right now?</h2>
        <p>
          Every rule set still carries an unverified flag, which is why the banner above is on
          the page. The values themselves were checked against primary sources on{" "}
          <span className="num">15 Aug 2026</span> — the enrolled public law, the{" "}
          <span className="num">2026</span> inflation-adjustment revenue procedure, the tips final
          regulation, Schedule 1-A and its instructions, and the official occupation list — and
          the great majority held. Four things keep the gate shut.
        </p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          <li className="hairline-b pb-2">
            <strong>Placeholder citations.</strong> Several rule files still cite a newsroom index
            or a bare irs.gov address rather than the document that was actually read. A figure
            whose citation nobody can follow is not verified, whatever its value.
          </li>
          <li className="hairline-b pb-2">
            <strong>Sub-dollar rounding is unresolved.</strong> No source states a cents
            convention for these four computations. The engine rounds half-up to the cent, which
            is defensible and unstated by the IRS, and can move a result by about a dollar.
          </li>
          <li className="hairline-b pb-2">
            <strong>Rules described but not encoded.</strong> The pre-existing extra standard
            deduction for people <span className="num">65</span> and over is not modelled and
            stacks with the <span className="num">$6,000</span> senior deduction; most of the
            car-loan eligibility conditions are documented but not enforced by the engine.
          </li>
          <li className="hairline-b pb-2">
            <strong>The overtime rulemaking is unsettled.</strong> No Treasury regulation
            implementing the overtime section could be located, and because the Federal
            Register&apos;s search could not be browsed, its absence is not established. If a
            final regulation exists it may narrow qualified overtime further than the current
            guidance does.
          </li>
        </ul>
      </section>

      <section className="density-reading">
        <h2>What gets re-checked, and when?</h2>
        <p>
          Each year&apos;s IRS inflation-adjustment revenue procedure, to refresh the bracket
          table and to check whether a section for the tips deduction has appeared — none had as
          of the <span className="num">2026</span> procedure, which is what establishes that the
          caps and thresholds are fixed statutory figures rather than indexed ones. Schedule 1-A
          and its instructions each filing season, since they are the computation of record and
          are where the rounding conventions live. And the tips final regulation and the
          occupation list, because a code or title that shifts changes what a user is told about
          their own W-2.
        </p>
        <p>
          The standards behind all of this are on the{" "}
          <Link href="/paycheck/editorial-policy" className={link}>
            editorial policy
          </Link>{" "}
          page, and every citation with its last-verified date is on{" "}
          <Link href="/paycheck/sources" className={link}>
            Sources
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
