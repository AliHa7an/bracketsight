import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/property/changelog" },
  title: "Property Tax Changelog — Rule Changes, Dated",
  description:
    "A dated record of every county rules change, methodology change and correction to the assessment check, each carrying its citation.",
};

const ENTRIES = [
  {
    date: "2026-08-15",
    title: "New Jersey Chapter 123 implemented; Bergen fee, forms and deadline corrected",
    items: [
      "Chapter 123 common level range modelled (N.J.S.A. 54:1-35a, 54:3-22(c), 54:51A-6, per NJ Assessors Handbook §§1105.19–1105.20). The ±15% corridor is multiplicative on the average ratio, not 15 percentage points: 78.00% gives 66.30%–89.70%. Inside the corridor no reduction is available; above it relief is average ratio × true value; below it the statute raises the assessment. Counties now carry a `reliefModel` flag, so the statutory test is chosen by rules data rather than by state code.",
      "No Bergen County municipality's Director's Ratio is encoded — none has been read from a primary source, and we do not invent ratios. Every New Jersey check therefore returns an explicit \"cannot determine — Director's Ratio required\" verdict instead of falling back to a generic over-assessment threshold that has no relationship to the statutory test.",
      "Bergen filing fee corrected from a flat $25 to the statutory schedule banded by assessed value — $5 / $25 / $100 / $150 (N.J.S.A. 54:3-21.3; N.J.A.C. 18:12A-1.6(d) and 1.7). A home assessed over $1,000,000 was being quoted a fee six times too low, and the fee gates the \"not worth it\" verdict.",
      "Both Bergen form URLs were dead (HTTP 404). Petition of Appeal now points at petappl.pdf and the comparable-sales attachment at a1compsales.pdf, both confirmed live. The county board citation moved from the timed-out co.bergen.nj.us to bergencountynj.gov.",
      "New Jersey's deadline is received-by, not postmark — \"A postmark of a mailed petition is not sufficient\" (Handbook §1105.01). Encoded as a machine-readable filing cutoff and stated on the verdict block and the evidence summary rather than left implicit.",
      "Still unresolved and unchanged: Cook County's residential assessment level, its Assessor-side fee, its per-township deadline calendar, and its separate evidence deadline. The Assessor's site is bot-blocked and none of it could be verified.",
    ],
  },
  {
    date: "2026-08-08",
    title: "Initial build: engine, two county rulesets, demo neighborhood",
    items: [
      "Over-assessment engine v0.1.0: comparable selection (class / area / ±20% size / recency window), median assessment ratios, IAAO coefficient of dispersion, confidence scoring, verdict thresholds.",
      "County rules encoded: Cook County IL (uniformity-first, ruleset 2026-08) and Bergen County NJ (market-value, ruleset 2026-08). Several values await primary-source verification and are flagged on each page and in the project verification log.",
      "Synthetic demo neighborhood (Maplewood Heights, fictional) so the check runs end-to-end before real county data lands.",
    ],
  },
] as const;

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        Changelog
      </h1>
      <p>
        Every change to a rule, a formula, or a correction is recorded here
        with its date. Rules live in versioned data files — see{" "}
        <Link href="/property/sources" className="underline underline-offset-2">
          sources
        </Link>{" "}
        for citations.
      </p>
      <ol className="space-y-8 list-none">
        {ENTRIES.map((entry) => (
          <li key={entry.date} className="border-l-2 border-rule pl-5">
            <p className="num text-sm text-dim">{entry.date}</p>
            <h2 className="font-semibold text-lg mt-1">{entry.title}</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-sm">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
