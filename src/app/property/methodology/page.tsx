import type { Metadata } from "next";
import Link from "next/link";
import {
  CONFIDENCE_HIGH_MIN,
  CONFIDENCE_MEDIUM_MIN,
  DEFAULT_CRITERIA,
  MIN_COMPS,
  NOT_WORTH_IT_MAX_PCT,
  STRONG_CASE_MIN_ANNUAL_OVERPAYMENT_CENTS,
  STRONG_CASE_MIN_PCT,
  counties,
} from "@/engines/property";
import { formatCents, formatNumber, formatPct } from "@/lib/property/format";

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
        Bracketsight&apos;s check is statistics, not AI, and not an appraisal.
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
            Living area within ±
            <span className="num">{formatNumber(DEFAULT_CRITERIA.sizeTolerancePct)}%</span> of the
            subject&apos;s square footage.
          </li>
          <li>
            Sold — or assessed, for uniformity arguments — within the
            county&apos;s evidence window (
            {counties
              .map((c) => `${formatNumber(c.compsWindowMonths)}`)
              .sort()
              .join("–")}{" "}
            months for the launch counties).
          </li>
        </ol>
        <p>
          Survivors are ranked by similarity (square footage first, then year
          built, beds, baths, lot) and the{" "}
          <span className="num">{formatNumber(DEFAULT_CRITERIA.maxComps)}</span> most similar are
          kept. Fewer than <span className="num">{formatNumber(MIN_COMPS)}</span> survivors means
          no verdict: we refuse to compute a number from a sample that thin.
        </p>
        <p>
          A rejected comparable is not discarded quietly. Each one is returned with the reason it
          failed — it is the subject itself, a different property class, outside the area, outside
          the size window, no recorded sale where a sale was required, or evidence older than the
          window — and the check displays them. That list is the part a hearing officer will push
          on hardest, because the fastest way to attack a comparables set is to show which homes
          were left out of it. A list dominated by wrong-class rejections says something different
          about your sample than a list dominated by homes that missed the recency window by a
          month, and a bare median tells you neither.
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
            <strong>Comparable count (0–40):</strong>{" "}
            <span className="num">{formatNumber(MIN_COMPS)}</span> comps score 15, each
            additional comp adds 5, full marks at{" "}
            <span className="num">{formatNumber(DEFAULT_CRITERIA.maxComps)}</span>.
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
        <p>
          HIGH is <span className="num">{formatNumber(CONFIDENCE_HIGH_MIN)}</span>+, MEDIUM{" "}
          <span className="num">{formatNumber(CONFIDENCE_MEDIUM_MIN)}</span>–
          <span className="num">{formatNumber(CONFIDENCE_HIGH_MIN - 1)}</span>, LOW below{" "}
          <span className="num">{formatNumber(CONFIDENCE_MEDIUM_MIN)}</span>.
        </p>
        <p>
          The recency taper is scored against the county&apos;s own window rather than a fixed
          calendar, so the same eighteen-month-old sale is worth more in a county with a
          two-year window than in one with an eighteen-month window. That is deliberate: an
          evidence age only means something relative to what the jurisdiction will look at. It
          also means the confidence score inherits any weakness in the window itself, and the
          window is a modelling default in both launch counties rather than a published standard.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          When do we say &ldquo;not worth it&rdquo;?
        </h2>
        <p>
          A gap under <span className="num">{formatPct(NOT_WORTH_IT_MAX_PCT)}</span> of the
          implied fair assessment is inside normal appraisal noise — boards rarely adjust it. LOW
          confidence blocks a filing recommendation no matter the gap. Estimated first-year
          savings that don&apos;t clear the filing fee block it too. &ldquo;Strong case&rdquo;
          requires all three: a gap of{" "}
          <span className="num">{formatPct(STRONG_CASE_MIN_PCT)}</span> or more, HIGH confidence,
          and estimated annual overpayment of at least twice the filing fee (minimum{" "}
          <span className="num">{formatCents(STRONG_CASE_MIN_ANNUAL_OVERPAYMENT_CENTS)}</span>).
        </p>
        <p>
          The fee in that comparison is the fee <em>you</em> would pay, not a headline figure.
          Where a county charges a statutory schedule banded by assessed value, the band is
          selected from your assessment before the comparison runs — quoting a middle band as
          though it were the whole schedule understates the fee at the top of the range and lets
          through a recommendation the fee should have stopped. Each county&apos;s schedule is on
          its{" "}
          <Link href="/property/counties" className="underline underline-offset-2">
            county page
          </Link>
          .
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
        <h2>The dollar figure is the softest number on the page</h2>
        <p>
          Everything above produces an <em>assessment</em> gap. Turning that into the figure
          people actually care about — money off next year&apos;s bill — takes one more step, and
          it is the step with the least support behind it. The estimated annual overpayment is the
          relief multiplied by a single county-level effective rate applied to assessed value:
          {counties.map((c, i) => (
            <span key={c.countyId}>
              {i === 0 ? " " : ", "}
              <span className="num">{formatPct(c.estimatedTaxRateOnAssessedBps / 100)}</span> in{" "}
              {c.countyName}
            </span>
          ))}
          . Neither has been verified against a primary source, and neither is really one number.
        </p>
        <p>
          Cook County&apos;s burden is the assessment level multiplied by the state equalization
          factor the Illinois Department of Revenue re-strikes every year, multiplied again by
          the composite rate of every taxing district your parcel sits in. Three
          separately-published factors are collapsed into one constant here. New Jersey&apos;s
          general tax rates are struck per municipality, per year, and Bergen County contains
          roughly <span className="num">70</span> municipalities. Both figures are labelled
          unresolved in the rules files that carry them, and they are the direct multiplier
          behind the &ldquo;not worth it&rdquo; comparison against the filing fee. Read the dollar
          estimate as an order of magnitude. The gap itself, and the ratio arithmetic behind it,
          are exact.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Money is integer cents, and rounding happens once</h2>
        <p>
          Every currency value in the engine is an integer number of cents, and every rate is
          basis points — <span className="num">2.30%</span> is stored as{" "}
          <span className="num">230</span>, never as <span className="num">0.023</span>. A float
          multiplication is rounded to a whole cent at the moment it becomes money and never
          before, half away from zero, through a single shared rounding function. Ratios in basis
          points go through the same function, which is why the common level range limits come out
          as the two-decimal percentages the Director publishes rather than as something ending in
          a trail of digits. One rounding rule, applied once per derived figure, is what makes a
          hearing officer&apos;s hand-arithmetic agree with ours instead of landing a cent or two
          away and inviting an argument about which of you is wrong.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Four places the engine refuses to guess</h2>
        <p>
          A refusal is a result. Each of these returns nothing rather than something plausible:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Fewer than <span className="num">{formatNumber(MIN_COMPS)}</span> surviving
            comparables.</strong> The analysis throws rather than producing a median from one or
            two homes, and the page shows the rejections instead of a verdict.
          </li>
          <li>
            <strong>A missing Director&apos;s Ratio.</strong> In a county whose relief runs on a
            statutory corridor, no ratio means no verdict — not a fallback to the gap thresholds
            above, which would recommend appeals the board is required by statute to deny.
          </li>
          <li>
            <strong>A corridor test with no true value.</strong> A uniformity analysis compares
            assessments to floor area and never produces a market value, so it cannot feed a test
            that divides assessment by true value. Where the two are mismatched the answer is
            &ldquo;cannot determine&rdquo;, not an approximation.
          </li>
          <li>
            <strong>Today&apos;s date.</strong> The engine never reads the wall clock. The as-of
            date is passed in, which is what makes a check reproducible — the same inputs and the
            same date always produce the same verdict, including a year from now when the
            deadline countdown would otherwise have changed the answer.
          </li>
        </ul>
        <p>
          The engine has no dependencies and makes no network calls, so there is nowhere inside a
          calculation for a model, a service or an estimate to sit. You can re-run any of it by
          hand from the numbers shown on the{" "}
          <Link href="/property/check" className="underline underline-offset-2">
            check
          </Link>
          .
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
