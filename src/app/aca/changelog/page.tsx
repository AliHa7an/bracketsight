import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import {
  ENGINE_VERSION,
  allCitations,
  cliffEdgeMagi,
  formatUsd,
  fplFor,
  getRules,
} from "@/engines/aca";
import { FactTable } from "@/components/ui";
import { formatDate } from "@/components/ui/format";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/aca/changelog");

export default function ChangelogPage() {
  const rules = getRules();
  const files = allCitations();

  const meta: Record<string, { effectiveFrom: string; effectiveTo: string | null }> = {
    "applicable-percentage.2026.json": rules.applicablePct,
    "fpl.2025.json": rules.fpl,
    "contribution-limits.2026.json": rules.contributionLimits,
    "medicaid-expansion.2026.json": rules.medicaidExpansion,
    "csr-bands.json": rules.csrBands,
    "repayment-limits.2026.json": rules.repaymentLimits,
    "slcsp-sample.2026.json": rules.slcsp,
  };

  const fpl1 = fplFor(1, "CONTIGUOUS_48", rules);
  const fpl4 = fplFor(4, "CONTIGUOUS_48", rules);
  const phaseOut = rules.contributionLimits.iraPhaseOut;

  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Changelog</h1>
      <p className="text-ink">
        This page exists so that a figure you read here last month can be
        checked against the figure you read today, and so that any difference
        has a date and a reason attached to it. It carries the changes that
        actually happened. Nothing is listed to fill it out.
      </p>

      <section className="space-y-3">
        <h2>Every result is stamped with two versions, and both are on this page</h2>
        <p className="text-ink">
          Each analysis the engine returns carries an engine version —
          currently <span className="num">{ENGINE_VERSION}</span> — and a
          ruleset version, currently{" "}
          <span className="num">{rules.ruleSetVersion}</span>. The engine
          version moves when the arithmetic changes. The ruleset version moves
          when a rate, threshold, band or limit changes. Underneath the
          composite ruleset sit{" "}
          <span className="num">{files.length}</span> separately versioned files,
          each with its own effective range, so a rule that changes mid-year
          produces a new dated file rather than an edit to a formula.
        </p>
        <div className="hairline-all rounded-atlas">
          <FactTable
            caption="Rule files in the current ruleset, with their versions and effective ranges"
            captionVisible
            rows={files.map((f) => {
              const m = meta[f.file];
              const range = m
                ? m.effectiveTo
                  ? `${formatDate(m.effectiveFrom)} – ${formatDate(m.effectiveTo)}`
                  : `${formatDate(m.effectiveFrom)} onward`
                : "—";
              return { key: f.file, value: `${f.version} · ${range}` };
            })}
          />
        </div>
        <p className="text-ink">
          To check whether a number moved: compare the ruleset version stamped
          on your saved result against the one above. If they match, the figure
          did not change. If they differ, the entries below say what did, and{" "}
          <Link href="/aca/sources" className="underline underline-offset-4">
            sources
          </Link>{" "}
          carries the per-file citations and the date each was last read.
        </p>
      </section>

      <section className="space-y-3">
        <h2>What puts an entry on this page</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>A value changed in a rules file</strong> — a poverty line, a
            basis-point band, a contribution limit, a state flag, an actuarial
            value.
          </li>
          <li>
            <strong>A rule changed shape.</strong> A repeal, a new statutory
            test, or a threshold that stops being a threshold. These are the
            expensive ones: an indexed value drifts predictably, and statutory
            structure does not.
          </li>
          <li>
            <strong>A citation changed.</strong> A source replaced with a better
            one, a wrong document removed, or a URL repointed at an authenticated
            government text.
          </li>
          <li>
            <strong>A verification status changed</strong>, or a figure was read
            against its primary source for the first time.
          </li>
          <li>
            <strong>Engine code changed a user-visible number</strong> — a
            rounding convention, an order of operations, an eligibility test.
          </li>
          <li>
            <strong>A correction.</strong> Errors are corrected within 48 hours
            of confirmation and logged here with what changed and why; the
            process is set out in the{" "}
            <Link href="/aca/editorial-policy" className="underline underline-offset-4">
              editorial policy
            </Link>
            . A correction that moves a number also re-derives the affected tests
            by hand, from the authority, rather than snapshotting whatever the
            engine now prints.
          </li>
        </ul>
        <p className="text-ink">
          Rewording a page does not earn an entry. Neither does adding an
          explanation of a rule that has not moved.
        </p>
      </section>

      <section className="hairline-all rounded-atlas p-4">
        <h2>Watch item: the cliff is a live legislative question</h2>
        <p className="mt-2">
          The enhanced premium tax credits that removed the 400% cliff for
          2021&ndash;2025 have lapsed, and restoring them is a recurring proposal
          in Congress. This page will not tell you what any particular bill is
          doing, because a bill&apos;s status is not something this site can cite
          to a primary source it has read, and a half-remembered legislative
          position on a page people plan their income around is worse than no
          position. What it will do is record the change the day it takes effect:
          the rules are versioned by effective date, so a restored credit lands
          as a new ruleset and every page recomputes from that one file. Until
          then, the 2026 rules below are what the law provides, and a household
          one dollar over the line loses the whole credit.
        </p>
      </section>

      <section className="space-y-4">
        <article className="border-l-2 border-rule pl-4">
          <p className="micro-label">
            <time className="num" dateTime="2026-08-15">
              15 Aug 2026
            </time>
          </p>
          <h2 className="mt-1">Primary-source corrections</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>The advance-credit repayment cap is gone entirely.</strong>{" "}
              Pub. L. 119-21 §71305 struck IRC §36B(f)(2)(B) for tax years
              beginning after 31 December 2025, so for 2026 there is no cap at
              any income. Bracketsight previously told a household at{" "}
              <span className="num">250%</span> of the poverty line its clawback
              was capped at <span className="num">$1,000</span>. It is not — the
              whole excess is repaid. The three repayment bands were removed
              from the live rule and kept in the file under a provenance-only
              key the engine does not read, so a future reinstatement has a
              shape to copy. The citation to the wrong revenue procedure went
              with them, replaced by the public law itself, the revenue
              procedure that removes the repealed provision&apos;s inflation
              adjustment, and the post-repeal statutory text. The reconciliation
              code now throws rather than run at all if a ruleset ever declares
              a cap while shipping no bands.
            </li>
            <li>
              <strong>The 400% edge moved down.</strong> Form 8962 Worksheet 2
              tests &ldquo;more than 4.0 × the poverty line&rdquo; before it
              truncates anything, so the last eligible income is exactly four
              times the poverty line. The edge for one person is now{" "}
              <span className="num">{formatUsd(cliffEdgeMagi(fpl1, rules))}</span>{" "}
              (was $62,756.49) and for a family of four{" "}
              <span className="num">{formatUsd(cliffEdgeMagi(fpl4, rules))}</span>{" "}
              (was $128,921.49). The multiple and the ineligibility sentinel
              moved out of code and into the applicable-percentage rules file at
              the same time, so no TypeScript file now holds the threshold.
            </li>
            <li>
              Hawaii&apos;s poverty guideline increment corrected to{" "}
              <span className="num">
                {formatUsd(rules.fpl.groups.HAWAII.additionalPersonCents)}
              </span>{" "}
              per additional person (was $6,325; 90 Fed. Reg. 5917), and the
              2026 traditional-IRA deduction phase-out for a covered single
              filer corrected to{" "}
              <span className="num">{formatUsd(phaseOut.coveredSingleFromCents)}</span>–
              <span className="num">{formatUsd(phaseOut.coveredSingleToCents)}</span>{" "}
              (was $79,000–$89,000; IRS Notice 2025-67). The Hawaii error
              understated the poverty line for every multi-person household,
              which understated the credit and overstated how close the
              household was to the cliff, compounding with family size. The IRA
              error hid a live, legal deduction from single filers between
              $89,000 and $91,000 of income.
            </li>
            <li>
              A placeholder Federal Register citation pointing at a host that
              blocks automated requests was replaced with the durable
              government-printing URL for the same notice.
            </li>
            <li>
              The ACA engine&apos;s test count went from{" "}
              <span className="num">56</span> to <span className="num">67</span>:
              eleven tests added, ten existing expectations re-derived by hand
              from the authority rather than from engine output, and four
              re-commented without changing their numbers.
            </li>
          </ul>
          <p className="mt-3 text-ink">
            <strong>What the same audit did not change.</strong> Every band
            boundary and basis-point value in the applicable-percentage table
            matched its revenue procedure exactly. All 65 age-rating factors
            matched the federal curve with zero mismatches. All 51
            Medicaid-expansion flags matched a federal enrollment dataset. Nine
            of eleven contribution limits were already right, and the remaining
            five poverty-guideline values were correct as encoded. A file being
            called a placeholder turned out to be a poor predictor of whether it
            was wrong.
          </p>
        </article>

        <article className="border-l-2 border-rule pl-4">
          <p className="micro-label">
            <time className="num" dateTime="2026-08-08">
              8 Aug 2026
            </time>
          </p>
          <h2 className="mt-1">Initial engine build</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Ruleset <span className="num">{rules.ruleSetVersion}</span>:
              §36B credit with the restored 400% cliff, Form 8962 truncation,
              CSR bands, uncapped over-400% clawback, Medicaid-expansion flags
              for all states.
            </li>
            <li>
              Lever engine: 401(k)/403(b)/457, HSA, traditional IRA
              (phase-outs), SEP-IRA/Solo 401(k), and the iterative
              self-employed health insurance deduction (Rev. Proc. 2014-41
              method).
            </li>
            <li>
              Known limits: sample benchmark premiums (six counties);
              placeholder 2026 indexed figures pending Rev. Proc. and COLA
              verification — status per file on{" "}
              <Link href="/aca/sources" className="underline underline-offset-4">
                /sources
              </Link>
              .
            </li>
          </ul>
        </article>
      </section>

      <section className="space-y-3">
        <h2>Open items that will produce a future entry</h2>
        <p className="text-ink">
          These are recorded gaps, not changes. None of them has moved a number
          yet; each is expected to, and this is where it will be written down
          when it does.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>The 2026 Form 8962, due around January 2027.</strong> The
            cliff convention rests on the 2025 and 2020 editions of Worksheet 2,
            which agree word for word across the ARPA boundary. If the step
            order in the 2026 edition differs, both cliff edges above move, and
            that would be the largest single entry this page could carry.
          </li>
          <li>
            <strong>Real benchmark premiums.</strong> The six county base
            premiums are invented sample data and must be replaced from the CMS
            marketplace public use files, which publish around October and
            November for the following plan year. Those files cover only the
            states on the federal marketplace, so the states running their own
            need separate handling — including California, which is in the
            current sample list.
          </li>
          <li>
            <strong>State-specific age-rating curves.</strong> The encoded curve
            is the federal default and is verified exactly, but it is a default
            only. The federal summary of state variations was last updated in
            December 2021 and shows New York and Vermont with no age rating at
            all. Latent while no such county is in the sample table; live the
            moment real premiums land.
          </li>
          <li>
            <strong>The age 60–63 catch-up.</strong> Verified, in force for
            2026, and not yet modelled — described in the source audit as the
            single largest missed lever in the product, because it applies to
            exactly the pre-Medicare age group most likely to sit near the
            cliff. Adding it will change lever rankings, which is a numbers
            change and will be logged as one.
          </li>
          <li>
            <strong>The below-100% eligibility path.</strong> The same public
            law that repealed the repayment cap also struck the provision
            underlying one of the two routes to a credit below the poverty line.
            That branch needs re-derivation for 2026 and is recorded as open
            rather than quietly assumed.
          </li>
          <li>
            <strong>Credentialed review.</strong> No enrolled agent or CPA has
            reviewed this section&apos;s tax logic. That review is a launch gate,
            and its completion — with the reviewer&apos;s name and credential —
            will appear here and on the{" "}
            <Link href="/aca/editorial-policy" className="underline underline-offset-4">
              editorial policy
            </Link>{" "}
            page.
          </li>
        </ul>
        <p className="text-ink">
          The formulas these rules feed, and every simplification the engine
          currently makes, are set out on{" "}
          <Link href="/aca/methodology" className="underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
