import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { counties } from "@/engines/property";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/property/sources");

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        Sources
      </h1>
      <p>
        Every deadline, fee, form, and evidence standard in Bracketsight lives in
        versioned data files with citations — nothing is hard-coded, and
        nothing is encoded from a blog post. When a rule changes, the data
        file changes, the{" "}
        <Link href="/property/changelog" className="underline underline-offset-2">
          changelog
        </Link>{" "}
        records it, and every page that uses the rule updates.
      </p>
      <p className="hairline-all rounded-atlas px-4 py-3" style={{ background: "var(--paper-raised)", fontSize: "var(--text-step--1)" }}>
        <strong>Verification status:</strong> citations marked
        &ldquo;awaiting primary-source verification&rdquo; were drafted from
        general knowledge of each county&apos;s process and have not yet been
        confirmed against the county authority. They are tracked in the
        project&apos;s verification log and must be confirmed before any
        county page is treated as filing-ready.
      </p>

      <section className="space-y-2">
        <h2>
          What makes a source primary for a county question?
        </h2>
        <p className="text-sm">
          The body with authority over the specific question, not the most
          official-looking page about the topic. A county board&apos;s own rules
          are primary for its filing calendar, its fee and its evidence
          requirements, because the board is the thing that decides them. A
          state statute or the state tax division is primary for a statutory
          test that binds every county. A state-level summary of county practice
          is neither: it describes what counties do, and it is out of date the
          session a county changes its calendar.
        </p>
        <p className="text-sm">
          Cook County is the clean illustration. Its filing deadline is not an
          interval anyone can compute — it is a close date the Board of Review
          publishes for each of its <span className="num">38</span> townships,
          every session. The Board&apos;s FAQ says townships are open a{" "}
          <em>minimum</em> of <span className="num">30</span> days, which is a
          floor rather than the rule: in <span className="num">2026</span> the
          first group opened <span className="num">3 August</span> and closed{" "}
          <span className="num">1 September</span>, a span of{" "}
          <span className="num">29</span> days, and that same group had a
          separate evidence-submission deadline of{" "}
          <span className="num">11 September</span>. No state page can tell you
          any of that. Read your township&apos;s published dates.
        </p>
        <p className="text-sm">
          The rule cuts the other way too. A county page is not automatically
          right about a state statute: Bergen County&apos;s FAQ gives{" "}
          <span className="num">$750,000</span> as the threshold for filing
          directly with the Tax Court, but that figure is the separate
          added-and-omitted assessment threshold — the regular valuation
          threshold in the Division of Taxation&apos;s handbook is{" "}
          <span className="num">$1,000,000</span>, and that is what the engine
          carries.
        </p>
      </section>

      {counties.map((c) => (
        <section key={c.countyId} className="space-y-2">
          <h2>
            {c.countyName}, {c.stateName}
          </h2>
          <p className="text-sm text-dim num">Ruleset {c.ruleSetVersion}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            {c.citations.map((cite) => (
              <li key={cite.url + cite.label}>
                <a href={cite.url} className="underline underline-offset-2" rel="noopener noreferrer">
                  {cite.label}
                </a>{" "}
                — last verified <span className="num">{cite.lastVerified}</span>
                {cite.verified ? "" : " · awaiting primary-source verification"}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-2">
        <h2>
          Why are some of those links flagged?
        </h2>
        <p className="text-sm">
          Because a citation nobody could open is not a citation, and saying so
          is cheaper than pretending otherwise. Three cases are live here. The
          Cook County Assessor&apos;s domain has migrated, and the current host
          returns a bot block, so no Assessor-side value has been read from the
          Assessor. The Illinois Property Tax Appeal Board link did not resolve
          from the verification environment — unreachable, not confirmed dead.
          And the citation for the New Jersey deadline statute points at a bare
          site root rather than a deep link to the section, on a host that
          refuses connections; the deadline itself is verified from the Division
          of Taxation&apos;s assessors&apos; handbook, so no date on this site is
          wrong. The citation is.
        </p>
      </section>

      <section className="space-y-2">
        <h2>
          What is the Director&apos;s Ratio, and why is a New Jersey verdict withheld without it?
        </h2>
        <p className="text-sm">
          The Director of the Division of Taxation publishes an average ratio of
          assessed to true value for every municipality, every{" "}
          <span className="num">1 April</span>. Chapter{" "}
          <span className="num">123</span> — N.J.S.A. <span className="num">54:1-35a</span>,{" "}
          <span className="num">54:3-22(c)</span> and{" "}
          <span className="num">54:51A-6</span>, set out at handbook
          §§<span className="num">1105.19</span>–<span className="num">1105.20</span> —
          builds a corridor of <span className="num">15%</span> either side of
          that ratio, multiplied rather than added: an average ratio of{" "}
          <span className="num">78.00%</span> gives{" "}
          <span className="num">66.30%</span> to <span className="num">89.70%</span>.
          Your assessment divided by your home&apos;s true value is compared
          against it. Inside the corridor the board may grant no reduction at
          all. Above it, the assessment is reset to average ratio × true value.
          Below it, the assessment is raised to the same figure.
        </p>
        <p className="text-sm">
          Every part of that rule is implemented. None of the ratios are
          encoded: not one municipal figure has been read from a primary source,
          and none is invented, so the table sits empty and every Bergen County
          check returns &ldquo;cannot determine&rdquo; naming the missing input.
          The alternative would be to fall back on the generic gap thresholds
          described on the{" "}
          <Link href="/property/methodology" className="underline underline-offset-2">
            methodology page
          </Link>
          , which bear no relationship to the test the board applies — and would
          tell a homeowner inside the corridor they have a strong case on an
          appeal the board is required by statute to deny. Bergen contains
          roughly <span className="num">70</span> municipalities, each with its
          own ratio and its own citation requirement before the engine will
          accept it.
        </p>
      </section>

      <section className="space-y-2">
        <h2>
          How often is each source re-checked?
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>
            <strong>Every <span className="num">1 April</span>:</strong> the New
            Jersey Chapter <span className="num">123</span> average ratios,
            republished annually per municipality.
          </li>
          <li>
            <strong>Every session:</strong> Cook County&apos;s township open and
            close calendar and its evidence deadlines, which are re-published
            each year and are the reason a deadline verified last year proves
            nothing about this one.
          </li>
          <li>
            <strong>Annually:</strong> the New Jersey appeal form PDFs. Form
            revision codes change without notice, and two of these links were
            already dead when they were last checked.
          </li>
          <li>
            <strong>Only on statutory change:</strong> New Jersey&apos;s filing
            fee tiers and the direct-to-Tax-Court threshold.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>
          Statistical method
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>
            IAAO, <em>Standard on Ratio Studies</em> — the source of the
            median-ratio approach and the coefficient of dispersion, including
            the COD ≤ 15 residential uniformity benchmark. See the{" "}
            <Link href="/property/methodology" className="underline underline-offset-2">
              methodology page
            </Link>{" "}
            for how each statistic is applied.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>
          What if your county is not listed?
        </h2>
        <p className="text-sm">
          Then Bracketsight has no rules for it, and the honest answer is that
          this site cannot help you file yet. Only the counties above ship. The
          statistical method travels — comparable homes, a median assessment
          ratio, a dispersion check — but the parts that decide whether an
          appeal is possible do not: the filing window, the fee, the evidence
          standard, the body you file with, and whether your state applies a
          statutory relief test that overrides the comparison entirely. Start at
          your county assessor&apos;s or board of review&apos;s own appeal page
          for the calendar and the fee, and check whether your state has a
          corridor test of its own before you read any gap figure as a case.
        </p>
      </section>

      <section className="space-y-2">
        <h2>
          Demo data
        </h2>
        <p className="text-sm">
          The sample neighborhood (&ldquo;Maplewood Heights&rdquo;) is a
          synthetic dataset generated for demonstration. It is labelled as
          such everywhere it appears and is not derived from any county
          record. No sample parcel carries a real New Jersey municipality
          either, because attaching one to a fictional parcel would imply a
          real place.
        </p>
      </section>
    </div>
  );
}
