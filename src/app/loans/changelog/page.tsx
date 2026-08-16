import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Student Loan Rule Changelog — Dated and Cited",
  description:
    "Dated record of every rule change, verification and correction in the federal repayment engine, each entry carrying its own primary citation.",
  alternates: { canonical: "/loans/changelog" },
};

interface Entry {
  date: string;
  title: string;
  body: React.ReactNode;
}

const entries: Entry[] = [
  {
    date: "2026-08-08",
    title: "Initial rule set encoded — RAP era, v1 engine",
    body: (
      <>
        <p>
          Engine v1.0.0 ships with rule sets{" "}
          <span className="font-data">rap-2026-07-01</span>,{" "}
          <span className="font-data">plan-terms-2026-07-01</span>,{" "}
          <span className="font-data">tiered-standard-2026-07-01</span>,{" "}
          <span className="font-data">poverty-guidelines-2026</span>, and{" "}
          <span className="font-data">tax-2026</span>. RAP encoded from 34 C.F.R. § 685.209 as
          amended by the RISE final rule (91 Fed. Reg. 23768), cross-checked against CRS
          IF13075, with all eight published worked examples encoded as golden tests. PAYE/ICR
          sunset (1 Jul 2028) and the post-1 Jul 2026 plan restriction encoded from P.L.
          119-21.
        </p>
        <p className="mt-2">
          Awaiting verification against live primary sources: 2026 HHS poverty guidelines
          (2025 values carried forward), exact Tiered Standard brackets, and RAP bracket
          behaviour at exact $10,000 multiples. Each is flagged in its rule file and on the{" "}
          <Link href="/loans/sources" className="underline underline-offset-4">sources page</Link>.
        </p>
      </>
    ),
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">Changelog</h1>
        <p className="text-dim mt-1">
          Repayment rules change — repeatedly, through 2028. Every change lands here within 48
          hours, dated and cited, and every affected page updates from the same rule files.
        </p>
      </header>

      <ol className="space-y-6">
        {entries.map((e) => (
          <li key={e.date + e.title} className="border border-rule rounded-atlas bg-white p-4">
            <h2>
              <time dateTime={e.date} className="font-data text-[0.85rem] text-dim block">
                {e.date}
              </time>
              {e.title}
            </h2>
            <div className="mt-2">{e.body}</div>
          </li>
        ))}
      </ol>

      <section aria-labelledby="cl-contains">
        <h2 id="cl-contains" className="mb-2">What has to be in an entry?</h2>
        <p>
          Five things, and an entry that cannot supply all five is not finished. The date the
          change was made. The rule file and version string that changed. The primary source it
          was changed against, named specifically enough to re-read — a section, not a homepage.
          What the change does to a computed result, in the direction it moves it. And
          confirmation that the test suite was re-run against the new values.
        </p>
        <p className="mt-2">
          The fourth of those is the one that matters to a borrower. &ldquo;Corrected the poverty
          guideline&rdquo; says nothing; &ldquo;raising the guideline raises protected income and
          therefore lowers every IBR, PAYE and ICR payment&rdquo; tells you whether your own
          result moved and which way. Entries are written to that standard.
        </p>
      </section>

      <section aria-labelledby="cl-triggers">
        <h2 id="cl-triggers" className="mb-2">What triggers an entry?</h2>
        <p>
          Any edit to a rule file. That covers the obvious cases — a changed rate, bracket,
          threshold, term or forgiveness count — and three less obvious ones that get an entry
          just the same: a citation URL or label that turns out to be wrong, a rule the engine
          was applying in the wrong direction, and a modelling assumption that gets promoted to
          a verified value or demoted to a documented simplification.
        </p>
        <p className="mt-2">
          A change to how a plan is explained does not get an entry. A change to what a plan
          computes always does, even when the visible effect is a rounding of a few cents,
          because the point of the record is that no number moved silently.
        </p>
      </section>

      <section aria-labelledby="cl-versions">
        <h2 id="cl-versions" className="mb-2">How are the rule files versioned?</h2>
        <p>
          Five rule sets back this section, and each is one dated JSON file carrying its own
          version string, an <span className="num">effectiveFrom</span> date, an optional{" "}
          <span className="num">effectiveTo</span>, and at least one citation with the date it
          was last verified:
        </p>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li>
            <span className="font-data">rap-2026-07-01</span> — the Repayment Assistance Plan:
            brackets, the dependent reduction, the interest waiver, the principal match, the
            forgiveness clock.
          </li>
          <li>
            <span className="font-data">plan-terms-2026-07-01</span> — IBR, PAYE, ICR and the
            fixed plans: percentages, poverty multipliers, terms, forgiveness counts, the{" "}
            <span className="num">2028</span> sunset.
          </li>
          <li>
            <span className="font-data">tiered-standard-2026-07-01</span> — the four balance
            tiers and the terms they map to.
          </li>
          <li>
            <span className="font-data">poverty-guidelines-2026</span> — the HHS table for the
            contiguous <span className="num">48</span> states, Alaska and Hawaii.
          </li>
          <li>
            <span className="font-data">tax-2026</span> — the taxability of forgiveness and the
            assumed marginal rate used to estimate it.
          </li>
        </ul>
        <p className="mt-2">
          The version string carries the date the rules take effect, not a release number. Three
          of the five end in <span className="num">2026-07-01</span> because that is the day the
          RISE final rule took effect; the other two carry a year, because they are annual
          tables. When an annual table is republished, a new dated file is created rather than
          the old one edited — so a scenario simulated under last year&apos;s guidelines still
          resolves to last year&apos;s guidelines, and the engine picks the file that applies
          from the simulation date rather than from today&apos;s.
        </p>
      </section>

      <section aria-labelledby="cl-pending">
        <h2 id="cl-pending" className="mb-2">What is pending verification right now?</h2>
        <p>
          A primary-source pass on <span className="num">15 Aug 2026</span> read the RISE final
          rule in full from govinfo.gov and settled the three items flagged in the entry above:
          the <span className="num">2026</span> HHS guidelines, all four Tiered Standard tiers,
          and RAP&apos;s behaviour at exact <span className="num">$10,000</span> multiples, where
          the regulation&apos;s &ldquo;more than $X and not more than $Y&rdquo; construction puts
          a boundary income in the lower band. Six items remain open, and none of them has been
          filled with an estimate.
        </p>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li>
            <strong>ICR&apos;s income-percentage factor</strong> is fixed at{" "}
            <span className="num">1.0</span>. The Department of Education sets it in a Federal
            Register notice published annually, and the{" "}
            <span className="num">2026</span> notice has not been located. This is the one figure
            in the plan terms needing a yearly re-check.
          </li>
          <li>
            <strong>Graduated repayment&apos;s <span className="num">24</span>-month step</strong>{" "}
            has no regulatory basis and never will —{" "}
            <span className="num">34 C.F.R. § 685.208(b)(6)(i)</span> prescribes only
            &ldquo;payments at two or more levels&rdquo;. It closes by being labelled a
            simplification, which it now is.
          </li>
          <li>
            <strong>The assumed <span className="num">22%</span> marginal rate</strong> on taxed
            forgiveness is a modelling estimate, not a regulatory figure, and cannot be verified
            as one.
          </li>
          <li>
            <strong><span className="num">26 U.S.C. § 108(f)</span></strong> was obtainable only
            in the <span className="num">2024</span> U.S. Code edition, so a later amendment
            cannot be ruled out from a primary source.
          </li>
          <li>
            <strong>Three citations</strong> point at congress.gov, which refuses automated
            requests. None has been read. Every figure they would support is independently
            verified against the RISE rule.
          </li>
          <li>
            <strong>The PAYE and IBR new-borrower tests</strong> each model one limb of a
            two-limb rule, which needs an input the form does not yet collect.
          </li>
        </ul>
      </section>

      <section aria-labelledby="cl-cadence">
        <h2 id="cl-cadence" className="mb-2">What gets re-checked, and when?</h2>
        <p>
          Three things on a calendar. The HHS poverty guidelines every January, because a new
          table is published each year and student loan repayment uses the guidelines currently
          in effect. The federal tax treatment of forgiveness every January, since the
          brackets behind the assumed rate are re-indexed annually and a lapsed exclusion can be
          restored. And the RISE rule and RAP each <span className="num">1 July</span>, the
          anniversary of the rule taking effect.
        </p>
        <p className="mt-2">
          Indexed values drift predictably; statutory structure does not. This verification
          programme found a repayment cap that Congress had repealed underneath a rules file
          nobody was watching — in another engine on this site, but the lesson is general. The
          law gets watched, not only the tables. Standards for all of this are on the{" "}
          <Link href="/loans/editorial-policy" className="underline underline-offset-4">
            editorial policy
          </Link>{" "}
          page; the citations themselves are on the{" "}
          <Link href="/loans/sources" className="underline underline-offset-4">
            sources page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
