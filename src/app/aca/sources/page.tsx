import type { Metadata } from "next";
import Link from "next/link";
import { allCitations, getRules } from "@/engines/aca";
import { formatDate } from "@/components/ui/format";
import { ContentsRail } from "@/components/content";

export const metadata: Metadata = {
  alternates: { canonical: "/aca/sources" },
  title: "ACA Sources — Every Threshold, Cited and Dated",
  description:
    "The primary sources behind every poverty line, applicable percentage and repayment rule in the subsidy engine, with verification status and the gaps still open.",
};

/** What each rules file is, in the reader's terms rather than the engine's. */
const TITLES: Record<string, string> = {
  "applicable-percentage.2026.json": "The applicable-percentage table",
  "fpl.2025.json": "The federal poverty guidelines",
  "contribution-limits.2026.json": "Retirement and HSA contribution limits",
  "medicaid-expansion.2026.json": "Medicaid expansion status by state",
  "csr-bands.json": "Cost-sharing reduction bands",
  "repayment-limits.2026.json":
    "Advance-credit repayment — the limitation, repealed for 2026",
  "slcsp-sample.2026.json": "Benchmark Silver premiums",
};

/** What each file actually decides, so a citation list reads as consequences. */
const ROLES: Record<string, string> = {
  "applicable-percentage.2026.json":
    "Sets the share of income a household is expected to pay toward the benchmark plan, band by band, and carries the 400% eligibility ceiling as a multiple and a sentinel rather than a hard-coded constant. Every credit figure on the site passes through this file twice — once for eligibility, once for the contribution.",
  "fpl.2025.json":
    "The poverty line for a family size in each of the three state groups. 2026 coverage deliberately uses the 2025 guidelines, because eligibility runs on the guidelines in effect when open enrollment began. Multiplied by four, this file is the cliff.",
  "contribution-limits.2026.json":
    "Every ceiling the lever engine ranks against: elective deferrals and catch-ups, HSA limits by coverage tier, the traditional-IRA limit and its phase-out ranges, the SEP percentage and overall cap, and the self-employment tax constants used to compute the SEP base.",
  "medicaid-expansion.2026.json":
    "One boolean per jurisdiction, deciding whether a household below the poverty line is routed to Medicaid or told it is in the coverage gap. The flag is right and it is also the least expressive value in the engine — three states it cannot describe properly are named on the methodology page.",
  "csr-bands.json":
    "The three Silver-only cost-sharing bands and the 250% ledge at the top of them. Statutory rather than indexed, unamended since 2014, and it inherits premium-credit eligibility: no credit, no reduction.",
  "repayment-limits.2026.json":
    "Whether a cap on repaying excess advance credit exists at all. For 2026 it does not, and the empty band array is the encoded rule rather than missing data. The reconciliation code throws if a future ruleset ever claims a cap while shipping no bands.",
  "slcsp-sample.2026.json":
    "Two different things: a verified federal age-rating curve, and six invented county base premiums. The curve was diffed factor by factor against the CMS guidance with no mismatches. The premiums are illustrative and must be replaced, not checked.",
};

/** What a status string means for the reader looking at it. */
const STATUS_MEANING: Record<string, string> = {
  VERIFIED_STATUTORY:
    "read verbatim against the statute or regulation itself, from an authenticated government text",
  UNVERIFIED:
    "the machine-readable field has not been advanced, which does not always mean the values are wrong — see the note below",
  SAMPLE_DATA:
    "illustrative figures written so the engine could be built and tested; there is nothing in them to verify",
};

export default function SourcesPage() {
  const rules = getRules();
  const files = allCitations();

  const META: Record<string, { effectiveFrom: string; effectiveTo: string | null }> = {
    "applicable-percentage.2026.json": rules.applicablePct,
    "fpl.2025.json": rules.fpl,
    "contribution-limits.2026.json": rules.contributionLimits,
    "medicaid-expansion.2026.json": rules.medicaidExpansion,
    "csr-bands.json": rules.csrBands,
    "repayment-limits.2026.json": rules.repaymentLimits,
    "slcsp-sample.2026.json": rules.slcsp,
  };

  const allCites = files.flatMap((f) => f.citations);
  const undated = allCites.filter((c) => !c.lastVerified).length;
  const statuses = [...new Set(files.map((f) => f.status))].sort();

  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Sources</h1>
      <p className="text-ink">
        Every rate, threshold and limit in the engine lives in a versioned JSON rules file with
        its citations. This page is generated from those files — if a figure appears anywhere on
        this site, its source is below. Ruleset{" "}
        <span className="num">{rules.ruleSetVersion}</span>:{" "}
        <span className="num">{files.length}</span> files carrying{" "}
        <span className="num">{allCites.length}</span> citations between them.
      </p>

      <ContentsRail />

      <section className="space-y-2">
        <h2>A rules file carries six things, and the citation is only one of them</h2>
        <p className="text-ink">
          Each file states a <strong>ruleset version</strong>, an{" "}
          <strong>effective range</strong> so a rule that changes mid-year is a new dated file
          rather than an edit to code, a <strong>verification status</strong>, a plain-language{" "}
          <strong>note</strong> describing how the values are meant to be read, the{" "}
          <strong>values</strong> themselves, and its <strong>citations</strong> — each with a
          URL and the date someone last opened it. Nothing numeric is written into a TypeScript
          file. The formulas that consume these values are set out on{" "}
          <Link href="/aca/methodology" className="underline underline-offset-4">
            methodology
          </Link>
          , and every change to any of them lands on the{" "}
          <Link href="/aca/changelog" className="underline underline-offset-4">
            changelog
          </Link>
          .
        </p>
        <p className="text-ink">
          Of the {allCites.length} citations below,{" "}
          <span className="num">{undated}</span> carry no verification date. That is not a
          formatting gap: it means the document at that URL has not been fetched and read by
          anyone here, so the citation records an intention rather than an act. Where a figure
          rests on a citation like that, the figure is verified elsewhere or it is not verified
          at all, and this page says which.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Only a primary source closes a gap</h2>
        <p className="text-ink">
          Statute, regulation, IRS guidance, a Federal Register notice, or a government dataset —
          those close a question. A secondary source may cross-check a value and may never close
          it, and a row resting on one stays labelled until the authoritative document has been
          read. Where a source could not be reached, the value is left exactly as it was and the
          gap is recorded rather than quietly improved. That discipline is why several citations
          below point at govinfo rather than the obvious host: the regulations site and the
          Federal Register site both redirect automated requests to a block page, so a successful
          response from either proves nothing, while govinfo serves authenticated GPO text.
        </p>
      </section>

      <section className="space-y-2">
        <h2>What each status means</h2>
        <ul className="list-disc space-y-2 pl-5">
          {statuses.map((status) => (
            <li key={status}>
              <span className="num">{status}</span> —{" "}
              {STATUS_MEANING[status] ?? "see the file's own verification note"}.
            </li>
          ))}
        </ul>
        <p className="text-ink">
          The <span className="num">UNVERIFIED</span> label deserves the qualification. A
          primary-source audit dated <span className="num">15 August 2026</span> read the
          applicable-percentage table against the controlling revenue procedure and found every
          band boundary and every basis-point value to match exactly, and it read nine of eleven
          contribution limits and all fifty-one Medicaid flags the same way. It recommended the
          status field move. The field has not been moved, so it still reads{" "}
          <span className="num">UNVERIFIED</span> here — this page publishes the machine-readable
          value rather than a friendlier summary of it. The figures that audit found wrong were
          corrected, and the repealed rule it found was removed; all of it is on the{" "}
          <Link href="/aca/changelog" className="underline underline-offset-4">
            changelog
          </Link>
          .
        </p>
      </section>

      <p className="hairline-all rounded-atlas p-4">
        <strong>Pre-launch status:</strong> files marked <span className="num">UNVERIFIED</span>{" "}
        or <span className="num">SAMPLE_DATA</span> carry placeholder or illustrative values
        pending primary-source verification. Bracketsight does not launch until every file reads
        verified. Benchmark Silver premiums are sample data for six counties today, so every
        premium, credit and clawback figure derived from them is illustrative rather than a
        quote — and no enrolled agent or CPA has yet reviewed the tax logic, which is a launch
        gate set out in the{" "}
        <Link href="/aca/editorial-policy" className="underline underline-offset-4">
          editorial policy
        </Link>
        .
      </p>

      {files.map((f) => {
        const meta = META[f.file];
        return (
          <section key={f.file}>
            <h2>{TITLES[f.file] ?? f.file}</h2>
            <p className="micro-label mt-1">
              <span className="num">{f.file}</span> · version{" "}
              <span className="num">{f.version}</span> · status{" "}
              <span className="num">{f.status}</span>
              {meta ? (
                <>
                  {" "}
                  · effective <span className="num">{formatDate(meta.effectiveFrom)}</span>
                  {meta.effectiveTo ? (
                    <>
                      {" "}
                      to <span className="num">{formatDate(meta.effectiveTo)}</span>
                    </>
                  ) : (
                    " onward"
                  )}
                </>
              ) : null}
            </p>
            {ROLES[f.file] ? (
              <p className="text-ink mt-2" style={{ fontSize: "var(--text-step--1)" }}>
                {ROLES[f.file]}
              </p>
            ) : null}
            <ul className="mt-3 space-y-2" style={{ fontSize: "var(--text-step--1)" }}>
              {f.citations.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.url}
                    className="underline underline-offset-4"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {c.label}
                  </a>{" "}
                  {c.lastVerified ? (
                    <span className="text-dim">
                      — last verified{" "}
                      <time className="num" dateTime={c.lastVerified}>
                        {formatDate(c.lastVerified)}
                      </time>
                    </span>
                  ) : (
                    <span className="text-dim">— not yet verified</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="space-y-2">
        <h2>Each of these is re-checked when its publisher publishes</h2>
        <p className="text-ink">
          The poverty guidelines arrive in mid-January and drive the <em>following</em> coverage
          year. HSA limits land around May. The §36B applicable-percentage table and the required
          contribution percentage arrive in mid-summer. Retirement and IRA cost-of-living figures
          come around October, the Social Security wage base around October and November, and the
          CMS marketplace public use files for the next plan year at roughly the same time.
          Medicaid expansion status is re-derived quarterly from the federal enrollment dataset
          rather than from a narrative page. Legislation amending §36B is watched continuously,
          because that is the failure mode this whole apparatus exists for: the audit above found
          a repayment cap that Congress had already repealed underneath a rules file nobody was
          watching. Indexed values drift on a schedule. Statutory structure does not.
        </p>
        <p className="text-ink">
          Two known gaps will not close on a schedule. The 2026 Form 8962 and its instructions
          are unpublished until roughly January 2027, so the cliff convention rests on the 2025
          and 2020 editions, which agree word for word across the ARPA boundary. And the federal
          list of state-specific age-rating variations was last updated in December 2021, with no
          newer version in existence. Both are described in full on{" "}
          <Link href="/aca/methodology" className="underline underline-offset-4">
            methodology
          </Link>{" "}
          and in the{" "}
          <Link href="/aca/about" className="underline underline-offset-4">
            about
          </Link>{" "}
          page&apos;s account of what is real data today and what is placeholder.
        </p>
      </section>
    </article>
  );
}
