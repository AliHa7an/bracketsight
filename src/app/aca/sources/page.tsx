import type { Metadata } from "next";
import { allCitations } from "@/engines/aca";
import { formatDate } from "@/components/ui/format";

export const metadata: Metadata = {
  alternates: { canonical: "/aca/sources" },
  title: "ACA Sources — Every Threshold, Cited and Dated",
  description:
    "The primary sources behind every poverty line, applicable percentage and repayment rule in the subsidy engine, with verification status per rules file.",
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

export default function SourcesPage() {
  const files = allCitations();
  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Sources</h1>
      <p className="text-ink">
        Every rate, threshold and limit in the engine lives in a versioned JSON rules file with
        its citations. This page is generated from those files — if a figure appears anywhere on
        this site, its source is below.
      </p>
      <p className="hairline-all rounded-atlas p-4">
        <strong>Pre-launch status:</strong> files marked <span className="num">UNVERIFIED</span>{" "}
        or <span className="num">SAMPLE_DATA</span> carry placeholder or illustrative values
        pending primary-source verification. Bracketsight does not launch until every file reads
        verified.
      </p>

      {files.map((f) => (
        <section key={f.file}>
          <h2>{TITLES[f.file] ?? f.file}</h2>
          <p className="micro-label mt-1">
            <span className="num">{f.file}</span> · version{" "}
            <span className="num">{f.version}</span> · status{" "}
            <span className="num">{f.status}</span>
          </p>
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
      ))}
    </article>
  );
}
