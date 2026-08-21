import type { Metadata } from "next";
import Link from "next/link";
import { resolveRules } from "@/engines/paycheck";
import type { RuleEnvelope } from "@/engines/paycheck";
import { formatDate } from "@/lib/paycheck/format";
import { TAX_YEAR } from "@/lib/paycheck/rules-meta";
import { ErrorState } from "@/components/ui";
import { ContentsRail } from "@/components/content";

export const metadata: Metadata = {
  title: "OBBBA Deduction Sources — IRS Citations, Dated",
  description:
    "Every OBBBA deduction rule traced to its primary source: P.L. 119-21, IRS guidance and the FLSA, with last-verified dates and open items named.",
  alternates: { canonical: "/paycheck/sources" },
};

const link =
  "text-ink underline decoration-rule underline-offset-4 hover:decoration-current";

/**
 * Documents read in full during the primary-source verification pass and
 * recorded in the engine's own verification file, VERIFICATION-STATUS.md.
 * These are NOT yet the citation entries inside the rule files — that
 * discrepancy is exactly why every rule set below still reads unverified.
 */
const DOCUMENTS_READ: { label: string; url: string; role: string }[] = [
  {
    label: "P.L. 119-21 as enacted (govinfo)",
    url: "https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf",
    role: "The operative text of all four deductions, read from the enrolled public law rather than a code mirror.",
  },
  {
    label: "Schedule 1-A (Form 1040), Additional Deductions",
    url: "https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf",
    role: "The computation of record. Part II tips, Part III overtime, Part IV car-loan interest, Part V seniors, all reading one MAGI figure from Part I.",
  },
  {
    label: "Instructions for Form 1040, including Schedule 1-A",
    url: "https://www.irs.gov/pub/irs-pdf/i1040gi.pdf",
    role: "The line-by-line rounding instructions, and the statement that these deductions are available whether or not you itemise.",
  },
  {
    label: "Rev. Proc. 2025-32",
    url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
    role: "The published 2026 bracket tables and standard deduction amounts, and the absence of any inflation section for the four OBBBA deductions.",
  },
  {
    label: "TD 10044, final regulations under 26 CFR § 1.224-1",
    url: "https://public-inspection.federalregister.gov/2026-07104.pdf",
    role: "The tips rulemaking: the occupation table, the phase-out ordering, and the confirmation that the cap is per return rather than per spouse.",
  },
  {
    label: "Notice 2025-69",
    url: "https://www.irs.gov/pub/irs-drop/n-25-69.pdf",
    role: "The definition of the FLSA overtime premium, and the exclusions for above-premium pay and for overtime owed only under state law or a bargaining agreement.",
  },
  {
    label: "Fact sheet FS-2026-13",
    url: "https://www.irs.gov/pub/taxpros/fs-2026-13.pdf",
    role: "The current IRS question-and-answer guidance on the overtime deduction.",
  },
  {
    label: "Occupations that customarily and regularly received tips on or before 31 Dec 2024",
    url: "https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024",
    role: "The published occupation list, enumerated code by code against the regulation's own table.",
  },
  {
    label: "2026 General Instructions for Forms W-2 and W-3",
    url: "https://www.irs.gov/pub/irs-pdf/iw2w3.pdf",
    role: "Where an employer reports these amounts, which is what makes a figure checkable against your own paperwork.",
  },
];

export default function SourcesPage() {
  const rules = resolveRules(TAX_YEAR);
  const envelopes: [string, RuleEnvelope][] = [
    ["Qualified tips deduction", rules.tips],
    ["Qualified overtime deduction", rules.overtime],
    ["Senior deduction", rules.senior],
    ["Car-loan interest deduction", rules.carLoan],
    ["Federal brackets and standard deduction", rules.brackets],
    ["Qualified occupation list", rules.occupations],
  ];
  const unverified = envelopes.filter(([, envelope]) => !envelope.verified);
  const citationCount = envelopes.reduce(
    (total, [, envelope]) => total + envelope.citations.length,
    0,
  );

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1>Sources</h1>
        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          Rules are encoded from primary sources only — statute, regulation, published IRS
          guidance — never from secondary coverage. Each rule set is versioned; when a rule
          moves we edit one file, log it on the changelog, and every page updates together.
        </p>
      </header>

      <ContentsRail />

      {unverified.length > 0 ? (
        <ErrorState
          cause={
            <>
              <span className="num">{unverified.length}</span> of{" "}
              <span className="num">{envelopes.length}</span> rule sets still carry
              pre-launch placeholder values.
            </>
          }
          fix="This build does not launch until every rule set below reads verified. Each rule set's own status and citations are listed below, and the open items across all five tools are summarised on the about page."
        />
      ) : null}

      <section className="density-reading">
        <h2>How to read an entry</h2>
        <p>
          Each block below is one rule file. The version string names the rule set and the tax
          year it applies to, so <span className="num">tips-2026.1</span> is the first revision
          of the tips rules for tax year <span className="num">{TAX_YEAR}</span>. The effective
          window is the period the file governs, not the period it was written in: a change for
          a later year produces a new file rather than an edit to this one, which is what makes
          an old result reproducible.
        </p>
        <p>
          The status word is the launch gate, and it is deliberately blunt. Verified means every
          figure in the file has been read from a primary source and the citation beside it
          points at the document that was actually opened. Unverified means at least one of
          those two things is not yet true — it does not distinguish a wrong number from a
          right number with a placeholder address, so both hold the gate shut until they are
          fixed.
        </p>
        <p>
          The date on a citation is the date that citation was last checked, not the date the
          rule last changed. Those diverge, and the distinction matters: a rule can go years
          without moving while the address you would use to confirm it goes stale. The
          verification date in this section&apos;s footer, and the one beside the rule version
          on the tool itself, is the oldest of the{" "}
          <span className="num">{citationCount}</span> dates below rather than the newest, so
          what you see is the weakest link and not the flattering one.
        </p>
      </section>

      <div className="flex flex-col gap-6">
        {envelopes.map(([label, envelope]) => (
          <section
            key={envelope.ruleSetVersion}
            className="rounded-atlas hairline-all px-4 py-3"
            style={{ borderRadius: "var(--radius-atlas)" }}
          >
            <h2 style={{ fontSize: "var(--text-step-1)" }}>{label}</h2>

            <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              <span className="num">{envelope.ruleSetVersion}</span> · effective{" "}
              <span className="num">{formatDate(envelope.effectiveFrom)}</span> →{" "}
              <span className="num">
                {envelope.effectiveTo ? formatDate(envelope.effectiveTo) : "open"}
              </span>{" "}
              ·{" "}
              {envelope.verified ? (
                <span className="text-signal" style={{ fontWeight: 600 }}>
                  verified
                </span>
              ) : (
                <span className="text-ink" style={{ fontWeight: 600 }}>
                  unverified — pre-launch placeholder
                </span>
              )}
            </p>

            <ul className="mt-2 flex list-none flex-col gap-2 p-0">
              {/*
               * REMOVED: a [1] superscript beside every entry. An inline
               * <SourceCitation> earns its place next to a CLAIM in prose,
               * where the reader needs to know what backs the sentence they
               * are reading. On the source list itself the anchor already is
               * the citation, and the marker was a badge labelling nothing.
               */}
              {envelope.citations.map((citation) => {
                return (
                  <li
                    key={citation.label}
                    className="hairline-b pb-2 last:border-b-0"
                    style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
                  >
                    <a
                      href={citation.url}
                      rel="noopener"
                      className="text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
                    >
                      {citation.label}
                    </a>
                    <span className="text-dim">
                      {" "}
                      · last verified{" "}
                      <span className="num">{formatDate(citation.lastVerified)}</span>
                      {citation.note ? <> · {citation.note}</> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="density-reading">
        <h2>When two sources disagree, the form is what a return is filled against</h2>
        <p>
          Four kinds of document sit behind these rules and they do different jobs. The statute
          is the authority and settles what the law says. A Treasury regulation implements it
          and can narrow it — the tips deduction has one, and the overtime deduction, as far as
          could be established, does not. Sub-regulatory guidance, meaning a notice or a fact
          sheet, states the IRS position without the force of a regulation. And the form plus
          its instructions is the arithmetic a return is actually completed against.
        </p>
        <p>
          Where they appear to differ, the engine follows the form for computation and the
          statute for eligibility, and records both. The clearest case is rounding: two of the
          three <span className="num">$1,000</span>-step phase-outs drop a partial step and one
          counts it as a whole step, and it is the form&apos;s line instructions that say so in
          each direction. The{" "}
          <Link href="/paycheck/methodology" className={link}>
            methodology page
          </Link>{" "}
          works that arithmetic through with the engine&apos;s own output.
        </p>
      </section>

      <section className="density-reading">
        <h2>Documents read in the verification pass, not yet written into the files</h2>
        <p>
          The citation entries above are what the engine ships. They are not the same as what
          has been read. A primary-source pass on <span className="num">15 Aug 2026</span> went
          through the documents below in full and recorded every figure it checked, but the
          addresses inside several rule files still point at a newsroom index or a bare host
          rather than at the document actually opened. Until each figure&apos;s own citation
          names the document a reader could follow, the file stays unverified, however sound
          the number turned out to be.
        </p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          {DOCUMENTS_READ.map((document) => (
            <li
              key={document.url}
              className="hairline-b pb-2"
              style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
            >
              <a href={document.url} rel="noopener" className={link}>
                {document.label}
              </a>
              <span className="text-dim"> · {document.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          Several official hosts refuse automated requests, and the list above reflects the
          route taken around each. The Code of Federal Regulations site and the Federal
          Register&apos;s document pages both redirect to a bot block, so the tips regulation
          was read from the Federal Register&apos;s public-inspection copy of the same
          document. The congressional site returns an error and the House&apos;s U.S. Code
          service times out, so every statutory quotation comes from the enrolled public law on
          govinfo instead of a code section. One consequence is worth naming rather than
          burying: because the Federal Register could not be searched, no Treasury regulation
          implementing the overtime deduction was located and its absence is not established.
        </p>
      </section>

      <section className="density-reading">
        <h2>Two of these files change every year and four of them do not</h2>
        <p>
          The bracket table and the standard deduction are inflation-adjusted and are reissued
          by the IRS each autumn for the following year, so that file is re-cut annually and
          the whole section moves with it. The four deduction files do not work that way.
          Neither the tips section nor the overtime section contains an inflation-adjustment
          clause, and the revenue procedure carrying the{" "}
          <span className="num">{TAX_YEAR}</span> adjustments has no entry for either, which is
          the positive confirmation that the caps and thresholds are fixed statutory figures
          rather than values awaiting an update. The senior and car-loan figures are fixed for
          the same reason.
        </p>
        <p>
          The occupation list is fixed by a different mechanism again: it is defined by
          reference to occupations that customarily and regularly received tips on or before{" "}
          <span className="num">31 Dec 2024</span>, so it is not an annually indexed table.
          What can move it is an amendment to the regulation that carries it, which is a
          Federal Register event rather than a filing-season one.
        </p>
        <p>
          All four deduction files carry a sunset. The statutes allow nothing for a taxable year
          beginning after <span className="num">31 Dec 2028</span>, so these files must not be
          cloned forward past tax year <span className="num">2028</span>. A rule file that
          outlived its statute produces confident arithmetic for a deduction that no longer
          exists, which is a worse failure than a missing file. Every change to any of them is
          dated on the{" "}
          <Link href="/paycheck/changelog" className={link}>
            changelog
          </Link>
          , and the standard a change has to meet is set out in the{" "}
          <Link href="/paycheck/editorial-policy" className={link}>
            editorial policy
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
