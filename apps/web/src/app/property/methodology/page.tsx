import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/property/methodology" },
  title: "Methodology — The Statistics Behind the Assessment Check",
  description:
    "Every formula: comparable selection filters, median assessment ratios, the IAAO coefficient of dispersion, confidence scoring, and the verdict thresholds.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        Methodology
      </h1>
      <p>
        Fineprint&apos;s check is statistics, not AI, and not an appraisal.
        Every number is deterministic: the same inputs always produce the same
        verdict, and a hearing officer could re-run the arithmetic by hand.
        This page documents each step.
      </p>

      <section className="space-y-3">
        <h2>
          How are comparables selected?
        </h2>
        <p>Four hard filters, applied in order, each rejection recorded:</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Same property class (a condo never comps a single-family home).</li>
          <li>
            Same neighborhood or assessment area (or within a radius when
            coordinates are available).
          </li>
          <li>
            Living area within ±20% of the subject&apos;s square footage.
          </li>
          <li>
            Sold — or assessed, for uniformity arguments — within the
            county&apos;s evidence window (18–24 months for the launch
            counties).
          </li>
        </ol>
        <p>
          Survivors are ranked by similarity (square footage first, then year
          built, beds, baths, lot) and the 8 most similar are kept. Fewer than
          3 survivors means no verdict: we refuse to compute a number from a
          sample that thin.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          What is an assessment ratio?
        </h2>
        <p>
          For a <strong>market-value argument</strong> (New Jersey&apos;s
          standard), each comparable&apos;s ratio is its assessed value ÷ its
          recent sale price. Your home&apos;s market value is estimated as the
          median comparable sale price per square foot × your square footage.
          The implied fair assessment is the median ratio × that market
          estimate.
        </p>
        <p>
          For a <strong>uniformity argument</strong> (common in Illinois),
          each comparable&apos;s ratio is its assessed value per square foot,
          and the implied fair assessment is the median of those × your square
          footage. No sales are needed — the claim is unequal treatment, not
          wrong market value.
        </p>
        <p>
          The over-assessment is your assessed value minus the implied fair
          assessment. Negative means you are assessed <em>below</em> what
          comparables suggest, and we tell you an appeal could backfire.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          What is the coefficient of dispersion (COD)?
        </h2>
        <p>
          COD = 100 × mean(|ratio − median ratio|) ÷ median ratio. It measures
          how much the comparables disagree with each other. It is the
          standard uniformity statistic in IAAO ratio studies, where COD ≤ 15
          is generally considered acceptable for single-family residential.
          High dispersion weakens any median, so it lowers the confidence
          score.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          How is confidence scored?
        </h2>
        <p>Three components, summing to 0–100:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Comparable count (0–40):</strong> 3 comps score 15, each
            additional comp adds 5, full marks at 8.
          </li>
          <li>
            <strong>Dispersion (0–40):</strong> COD ≤ 5% scores 40, minus 2.5
            points per COD point above 5, floor 0.
          </li>
          <li>
            <strong>Recency (0–20):</strong> median evidence age ≤ 180 days
            scores 20, tapering to 0 at the county&apos;s window edge.
          </li>
        </ul>
        <p>HIGH is 70+, MEDIUM 45–69, LOW below 45.</p>
      </section>

      <section className="space-y-3">
        <h2>
          When do we say &ldquo;not worth it&rdquo;?
        </h2>
        <p>
          A gap under 5% of the implied fair assessment is inside normal
          appraisal noise — boards rarely adjust it. LOW confidence blocks a
          filing recommendation no matter the gap. Estimated first-year
          savings that don&apos;t clear the filing fee block it too.
          &ldquo;Strong case&rdquo; requires all three: a gap of 10%+, HIGH
          confidence, and estimated annual overpayment of at least twice the
          filing fee (minimum $200).
        </p>
        <p>
          We expect most homes to come back &ldquo;looks fair.&rdquo; A tool
          that tells most users not to file is the tool worth believing when
          it says the opposite.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Where a statute overrides the gap: New Jersey&apos;s Chapter 123</h2>
        <p>
          Those thresholds are ours. New Jersey&apos;s are the
          legislature&apos;s, and they win. Under Chapter 123 (N.J.S.A.
          54:1-35a, 54:3-22(c), 54:51A-6) the Director of Taxation publishes an
          average ratio — the &ldquo;Director&apos;s Ratio&rdquo; — for every
          municipality on 1 April, and a common level range of{" "}
          <strong>15% either side of it, multiplied not added</strong>: an
          average ratio of 78.00% gives a range of 66.30% to 89.70%, because
          78 × 0.85 and 78 × 1.15.
        </p>
        <p>
          Your assessment is divided by your home&apos;s true value to give a
          subject property ratio, and where it lands is the whole answer:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Inside the range</strong> — the board may grant no
            reduction at all, however over-assessed the comparables make you
            look. A 13% gap can be entirely non-actionable.
          </li>
          <li>
            <strong>Above the range</strong> — a reduction is due, and it is{" "}
            <strong>average ratio × true value</strong>. Not the comparables&apos;
            implied fair assessment. That is the number we show.
          </li>
          <li>
            <strong>Below the range</strong> — the statute{" "}
            <strong>raises</strong> your assessment to the same figure. Filing
            actively harms you. This is the outcome, not a risk.
          </li>
        </ul>
        <p>
          We do not currently publish a New Jersey verdict, because no
          municipality&apos;s Director&apos;s Ratio has been read from a primary
          source and we will not invent one. Every Bergen County check returns
          &ldquo;cannot determine&rdquo; with the reason, rather than falling
          back to the 5%/10% thresholds above — thresholds that bear no
          relationship to the test the county board actually applies.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Known limitations
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            The estimated annual overpayment applies a county-level estimated
            effective tax rate — your actual levy varies by municipality,
            exemptions, and year.
          </li>
          <li>
            The current demo runs on a clearly labelled synthetic
            neighborhood; verdicts on your real parcel require your
            county&apos;s parcel data.
          </li>
          <li>
            Condition, renovations, and location factors inside a neighborhood
            are not modelled. A board may weigh them; bring photos.
          </li>
          <li>
            New Jersey&apos;s Chapter 123 corridor is modelled, but no
            municipality&apos;s Director&apos;s Ratio is encoded yet, so every
            New Jersey check returns &ldquo;cannot determine.&rdquo; Other
            states with their own statutory relief tests are not modelled at
            all — Cook County currently runs on the gap thresholds above.
          </li>
          <li>
            New Jersey&apos;s deadline can extend past 1 April when a
            municipality mails its notices late; we have no bulk-mailing date
            input and always show 1 April. Weekend and holiday rollover is not
            modelled either.
          </li>
        </ul>
        <p className="text-sm text-dim">
          The engine is open to inspection: pure TypeScript, zero
          dependencies, zero network calls, fully unit-tested. See{" "}
          <Link href="/property/sources" className="underline underline-offset-2">
            sources
          </Link>{" "}
          and the{" "}
          <Link href="/property/changelog" className="underline underline-offset-2">
            changelog
          </Link>
          . This methodology awaits review by a credentialed property-tax
          consultant before launch — a launch requirement, not an option.
        </p>
      </section>
    </div>
  );
}
