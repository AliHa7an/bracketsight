import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage, type PolicySection } from "@/components/layout/PolicyPage";
import { FactTable } from "@/components/ui";
import { CONTACT_EMAIL, MAINTAINER, SECTIONS, SITE_NAME, sectionHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Who writes and checks this — authorship, review and verification",
  description:
    "Who is accountable for every figure here, how a value is verified against a primary source, what 315 checked rows found, and which reviews are still outstanding.",
  alternates: { canonical: "/authors" },
};

/**
 * Authors and reviewers.
 *
 * The page a YMYL reader, and Google's quality guidance, and an ad network's
 * policy reviewer all look for: who produced this, what process stands behind
 * it, and who has checked it. It is deliberately built from `MAINTAINER` in
 * `src/lib/site.ts` — when that object is filled in, the attribution block
 * below renders and nothing else changes.
 *
 * While it is null this page states that plainly instead of inventing a byline.
 * A fabricated author on a site that tells people whether to forfeit their
 * repayment credit is a worse failure than an unfilled one, and the process
 * described here is real, checkable, and the actual reason to trust a figure.
 *
 * Every number on this page is transcribed from a repository document —
 * VERIFICATION-STATUS.md (compiled 15 Aug 2026) and KNOWN-GAPS.md (same date).
 * Nothing here is estimated or rounded up, and nothing was dropped or softened
 * when the page was re-laid-out. The "Not engaged" column in particular stays
 * exactly as it is until a reviewer is actually engaged.
 */
const UPDATED = "2026-08-19";

/* VERIFICATION-STATUS.md → "Totals". Rows are individual numeric constants and
   encoded legal rules; one row, one primary source or the word UNRESOLVED. */
const VERIFICATION_ROWS: readonly {
  engine: string;
  rows: number;
  verified: number;
  corrections: number;
  unresolved: number;
}[] = [
  { engine: "Student loan repayment", rows: 74, verified: 54, corrections: 9, unresolved: 10 },
  { engine: "Paycheck deductions", rows: 98, verified: 80, corrections: 17, unresolved: 1 },
  { engine: "ACA subsidy", rows: 56, verified: 41, corrections: 7, unresolved: 2 },
  { engine: "Property assessment", rows: 38, verified: 13, corrections: 13, unresolved: 12 },
  { engine: "Trades pricing and contracts", rows: 49, verified: 15, corrections: 23, unresolved: 11 },
];

const TOTALS = VERIFICATION_ROWS.reduce(
  (sum, row) => ({
    rows: sum.rows + row.rows,
    verified: sum.verified + row.verified,
    corrections: sum.corrections + row.corrections,
    unresolved: sum.unresolved + row.unresolved,
  }),
  { rows: 0, verified: 0, corrections: 0, unresolved: 0 },
);

/* Each section's editorial policy names the review it requires before launch.
   None has been completed; this table is the single place that says so. */
const REVIEW_GATES: readonly { section: string; reviewer: string; status: string }[] = [
  {
    section: "Student loan repayment",
    reviewer: "Student-aid or tax practitioner",
    status: "Not engaged",
  },
  { section: "Paycheck deductions", reviewer: "Enrolled agent or CPA", status: "Not engaged" },
  { section: "ACA subsidy", reviewer: "Enrolled agent or CPA", status: "Not engaged" },
  {
    section: "Property assessment",
    reviewer: "Licensed appraiser or appeal practitioner",
    status: "Not engaged",
  },
  {
    section: "Trades contracts",
    reviewer: "Construction attorney, per state",
    status: "Not engaged",
  },
  { section: "Trades pricing", reviewer: "Two working contractors per trade", status: "Not engaged" },
];

export default function AuthorsPage() {
  const sections: readonly PolicySection[] = [
    {
      id: "attribution",
      heading: "Attribution",
      children: MAINTAINER ? (
        <>
          <p>
            <strong>{MAINTAINER.name}</strong>
            {MAINTAINER.entity ? `, ${MAINTAINER.entity}` : null} — {MAINTAINER.role}. Responsible
            for every rule file, every engine and every word on this site.
          </p>
          <p>{MAINTAINER.background}</p>
          {MAINTAINER.profileUrl ? (
            <p>
              <a href={MAINTAINER.profileUrl} rel="me noopener">
                {MAINTAINER.profileUrl}
              </a>
            </p>
          ) : null}
        </>
      ) : (
        <p>
          One person maintains the rule files, the engines and the writing, and that person is not
          yet named here. Rather than publish a byline nobody can check, this page publishes the
          process instead, in enough detail that any figure on the site can be traced back to the
          document it came from and disproved if it is wrong. Corrections reach the same person, at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      ),
    },
    {
      id: "what-verification-means",
      heading: "What verification means here",
      children: (
        <>
          <p>
            A rate, threshold, bracket, deadline or statutory term is never written into the code
            that uses it. It lives in a versioned rule file with the date it takes effect, the date
            it stops, and at least one citation carrying a URL and a <code>lastVerified</code>{" "}
            date. Verification means one specific thing: somebody fetched that URL, read the value
            off the document that came back, and recorded the date. Not that the value looks right,
            and not that a secondary source agrees.
          </p>
          <p>
            The distinction between a primary and a secondary source is enforced rather than
            preferred. The statute, the regulation, the Federal Register notice, the IRS revenue
            procedure, the HHS guideline, the county assessor&rsquo;s own page — those close a
            question. A legal-information site, a policy explainer or a news write-up may
            cross-check a value and may never close it; rows resting on one are marked{" "}
            <code>[SECONDARY]</code> and stay open. Three states&rsquo; contract statutes are in
            that state today, because their legislature websites refuse automated requests.
          </p>
          <p>
            The rule exists because of something that happened during the pass. While checking the
            ACA applicable-percentage table, a summarising fetch layer reported the wrong revenue
            procedure number and returned a percentage table that did not exist in any document.
            The engine&rsquo;s own table was already correct; accepting the summary would have
            replaced a right answer with an invented one. Every figure since has been read from
            extracted statute or PDF text rather than from anything that summarises it.
          </p>
        </>
      ),
    },
    {
      id: "what-the-pass-found",
      heading: "What the pass found",
      children: (
        <>
          <p>
            Each row below is one numeric constant or one encoded legal rule.
            &ldquo;Corrected&rdquo; means the source said something different from the code and the
            code was wrong. &ldquo;Unresolved&rdquo; means the source could not be reached or did
            not answer the question, and the value was left alone and recorded rather than guessed.
            A property section with <strong className="num">13</strong> of <strong className="num">38</strong> rows confirmed is
            not a section to act on without checking your own county, and the section says so on
            every page.
          </p>

          <div className="hairline-all my-5 max-w-[var(--measure)] overflow-x-auto rounded-atlas">
            <table className="density-instrument w-full">
              <caption className="micro-label px-3 py-2 text-left">
                Primary-source verification, compiled 15 August 2026
              </caption>
              <thead>
                <tr className="hairline-b">
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Engine
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Rows
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Verified
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Corrected
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Unresolved
                  </th>
                </tr>
              </thead>
              <tbody>
                {VERIFICATION_ROWS.map((row) => (
                  <tr key={row.engine} className="hairline-b">
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      {row.engine}
                    </th>
                    <td className="num px-3 py-2 text-right">{row.rows}</td>
                    <td className="num px-3 py-2 text-right">{row.verified}</td>
                    <td className="num px-3 py-2 text-right">{row.corrections}</td>
                    <td className="num px-3 py-2 text-right">{row.unresolved}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-3 py-2 text-left font-semibold">
                    All engines
                  </th>
                  <td className="num px-3 py-2 text-right font-semibold">{TOTALS.rows}</td>
                  <td className="num px-3 py-2 text-right font-semibold">{TOTALS.verified}</td>
                  <td className="num px-3 py-2 text-right font-semibold">{TOTALS.corrections}</td>
                  <td className="num px-3 py-2 text-right font-semibold">{TOTALS.unresolved}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            The unresolved rows are published in full rather than summarised. Each one names the
            value, the document that would settle it, and what is stopping that document being read
            — a login, an untranscribed statutory notice, a commercial licence, an agency that has
            not published the figure yet, or a genuine ambiguity in the rule. Every gap that has a
            location in the code also has a marker at that location, so the register and the code
            cannot drift apart without one of them being obviously wrong.
          </p>
        </>
      ),
    },
    {
      id: "who-has-reviewed-it",
      heading: "Who has reviewed it: nobody, yet",
      children: (
        <>
          <p>
            Each section&rsquo;s editorial policy names the professional review it must pass before
            it can be described as finished. None of those reviews has happened. This is the table
            that says so in one place, and it stays on the site until the statuses change —
            dropping it to look more finished would be the single most dishonest thing this site
            could do.
          </p>

          <FactTable
            className="my-5 max-w-[var(--measure)]"
            caption="Review gates named by the section editorial policies"
            captionVisible
            rows={REVIEW_GATES.map((gate) => ({
              key: `${gate.section} — ${gate.reviewer}`,
              value: gate.status,
            }))}
          />

          <p>
            Until a gate is met, the affected pages carry the warning and the figures are
            illustrative. If you hold one of those credentials and want to review a section, the
            address at the bottom of this page reaches the person who would act on it.
          </p>
        </>
      ),
    },
    {
      id: "what-the-code-guarantees",
      heading: "What the code guarantees, independently of who wrote it",
      children: (
        <>
          <p>
            No language model computes, adjusts, estimates or sanity-checks any number shown to a
            reader. That is not a policy, it is a property of the build: the five engines have zero
            dependencies and no network access, so there is nothing for a model call to be made
            through. Money is held in integer cents and rates in basis points, because
            floating-point drift across three hundred and sixty monthly iterations produces a wrong
            total at the end of a thirty-year simulation.
          </p>
          <p>
            The engines carry <strong className="num">399</strong> tests between them and the application another{" "}
            <strong className="num">69</strong>. Where an agency has published its own worked examples, those
            examples are encoded as tests, so the engine has to reproduce the government&rsquo;s
            arithmetic before it can ship. Two tools refuse to answer rather than answer badly:
            contract generation is blocked for any state whose statutory notice has not been
            transcribed word for word, and a New Jersey assessment verdict is withheld when the
            ratio that governs the county is unavailable.
          </p>
        </>
      ),
    },
    {
      id: "how-a-correction-happens",
      heading: "How a correction actually happens",
      children: (
        <p>
          Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the figure and,
          ideally, the document that contradicts it. The report is checked against the primary
          source, not against the reporter&rsquo;s confidence. If it holds, the rule file is edited,
          the <code>lastVerified</code> date moves, every page that depends on the value recomputes
          on the next build, and the change is written into that section&rsquo;s changelog with the
          date and the source. If it does not hold, you get an answer saying which document was read
          and what it said.
        </p>
      ),
    },
    {
      id: "section-records",
      heading: "Where each section's own record lives",
      children: (
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <Link href={sectionHref(section)}>{section.name}</Link> — its own methodology, dated
              sources, editorial policy and changelog, reachable from the footer of every page in
              the section.
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Authorship and review"
      title="Who writes and checks this"
      standfirst={
        <>
          Every figure on {SITE_NAME} is produced by deterministic code from a rule file that
          carries a primary citation and the date somebody last opened it. A primary-source pass
          checked <strong className="num">{TOTALS.rows}</strong> individual values across the five engines:{" "}
          <strong className="num">{TOTALS.verified}</strong> confirmed, <strong className="num">{TOTALS.corrections}</strong>{" "}
          corrected, and <strong className="num">{TOTALS.unresolved}</strong> left unresolved rather than filled in.
          No credentialed reviewer has signed off on any section yet.
        </>
      }
      updated={UPDATED}
      stamps={[
        "Verification pass compiled 2026-08-15",
        `${TOTALS.rows} rows checked`,
        "No reviewer engaged",
      ]}
      sections={sections}
      footnote={
        <>
          This page describes how figures are produced and checked. It is not a claim that they are
          advice — see the <Link href="/terms">terms and disclaimer</Link>, and the wider account of
          what the site is on <Link href="/about">about</Link>.
        </>
      }
    />
  );
}
