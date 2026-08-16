import type { Metadata } from "next";
import Link from "next/link";
import { counties } from "@/engines/property";

export const metadata: Metadata = {
  alternates: { canonical: "/property/sources" },
  title: "Property Tax Sources — County Rules, Cited and Dated",
  description:
    "The primary sources behind every county deadline, fee, form and evidence standard, with last-verified dates. Unverified values stay flagged until confirmed.",
};

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        Sources
      </h1>
      <p>
        Every deadline, fee, form, and evidence standard in Fineprint lives in
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
          Demo data
        </h2>
        <p className="text-sm">
          The sample neighborhood (&ldquo;Maplewood Heights&rdquo;) is a
          synthetic dataset generated for demonstration. It is labelled as
          such everywhere it appears and is not derived from any county
          record.
        </p>
      </section>
    </div>
  );
}
