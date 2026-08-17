import type { Metadata } from "next";
import Link from "next/link";
import { counties } from "@/engines/property";
import { formatDate } from "@/lib/property/format";

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

      <section className="space-y-2">
        <h2>Which files this log tracks</h2>
        <p className="text-sm">
          One JSON file per county, and nothing else. Each carries its own version string, its
          deadline rule, its fee schedule, its forms, its evidence standard, the argument the
          board decides on, the statutory relief model, and every citation with the date that
          citation was last opened:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          {counties.map((c) => (
            <li key={c.countyId}>
              <span className="num">{c.countyId}.json</span> — {c.countyName},{" "}
              {c.stateName}. Ruleset <span className="num">{c.ruleSetVersion}</span>,{" "}
              <span className="num">{c.citations.length}</span> citations, oldest last verified{" "}
              <span className="num">
                {formatDate(
                  c.citations
                    .map((cite) => cite.lastVerified)
                    .sort()[0] ?? c.ruleSetVersion,
                )}
              </span>
              , <span className="num">{c.citations.filter((cite) => !cite.verified).length}</span>{" "}
              still awaiting primary-source verification.{" "}
              <Link
                href={`/property/counties/${c.state.toLowerCase()}/${c.countyId.split("-")[1] ?? ""}`}
                className="underline underline-offset-2"
              >
                County page
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm">
          The version string is the month the ruleset was cut, not a release number. It appears
          under the answer on every county page beside the date its primary citation was last
          read, so the version you are looking at is the version that computed what you are
          looking at. If that string has not moved since you last checked, no rule behind that
          page has moved either.
        </p>
      </section>

      <section className="space-y-2">
        <h2>What earns an entry, and what does not</h2>
        <p className="text-sm">
          Any edit to a county rules file. That covers the obvious cases — a changed deadline,
          fee, form URL, evidence standard or appeal body — and three that are easier to let slip
          through: a citation that turns out to point somewhere wrong, a rule the engine was
          applying in the wrong direction, and a value promoted from an unsourced default to a
          verified figure or demoted from a stated fact to a documented assumption. The last of
          those changes no arithmetic at all and still gets an entry, because what a reader is
          entitled to rely on has changed.
        </p>
        <p className="text-sm">
          Rewriting an explanation does not earn one. Neither does adding a page. The log exists
          so that no <em>rule</em> moves silently, and padding it with editorial work would make
          the rule changes harder to find, which is the opposite of the point.
        </p>
        <p className="text-sm">
          Entries also record what did <em>not</em> change. The{" "}
          <span className="num">2026-08-15</span> entry above ends by listing four Cook County
          items that were left exactly as they were, because the Assessor&apos;s site could not be
          read. Silence there would have been the more flattering choice and the less useful one:
          a reader comparing the two counties needs to know that one of them got a remediation
          pass and the other got a shrug.
        </p>
      </section>

      <section className="space-y-2">
        <h2>How a correction becomes an entry</h2>
        <p className="text-sm">
          The order is fixed, and the first step is the one that takes the time. A suspected error
          is confirmed against a primary source — the body with authority over that specific
          question, fetched and read, not recalled and not summarised. If the source cannot be
          reached, the encoded value stays exactly as it is and the item is recorded as
          unresolved. Nothing is quietly improved into something more plausible.
        </p>
        <p className="text-sm">
          Once a source has actually been read, the JSON is edited, its{" "}
          <span className="num">lastVerified</span> date moves, and the file is re-validated on
          import: the loader rejects a county with no citations, a citation missing a URL or a
          date, a filing fee that is not integer cents, a fee schedule with a gap or an overlap
          between bands, a primary argument the county does not list among its permitted ones, and
          — in a corridor county — any municipal ratio that arrives without a citation of its own.
          A rule that cannot pass those checks does not ship, so a malformed correction fails
          loudly at build time rather than quietly in front of a homeowner.
        </p>
        <p className="text-sm">
          Then the entry is written: the date, what changed, the source it was changed against
          named precisely enough to re-read, and what it does to a result. &ldquo;Corrected the
          Bergen fee&rdquo; says nothing. &ldquo;A home assessed over{" "}
          <span className="num">$1,000,000</span> was being quoted a fee six times too low, and
          the fee gates the &lsquo;not worth it&rsquo; verdict&rdquo; tells you whether your own
          answer moved.
        </p>
      </section>

      <section className="space-y-2">
        <h2>How to check whether a figure you saw last month has moved</h2>
        <p className="text-sm">
          Three things to compare, in this order. The ruleset version on the county page: if it
          is unchanged, no rule in that file has been touched. The last-verified date beside it:
          if that has moved but the version has not, a source was re-read and confirmed the
          existing value — reassurance rather than change. And this page: every version bump has
          an entry here saying which direction the number went.
        </p>
        <p className="text-sm">
          Two dates are worth putting in your own calendar rather than waiting for an entry. New
          Jersey&apos;s Chapter <span className="num">123</span> average ratios are republished
          every <span className="num">1 April</span>, per municipality, and a ratio verified last
          April says nothing about this year&apos;s. Cook County&apos;s township open and close
          calendar is republished every session, which is why no deadline on the Cook page is
          computed forward from a notice date. The{" "}
          <Link href="/property/sources" className="underline underline-offset-2">
            sources page
          </Link>{" "}
          lists the full re-check cadence, and the{" "}
          <Link href="/property/methodology" className="underline underline-offset-2">
            methodology
          </Link>{" "}
          covers the statistics, which do not change on a calendar at all.
        </p>
      </section>
    </div>
  );
}
