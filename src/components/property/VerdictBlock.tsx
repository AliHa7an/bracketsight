"use client";

import type { AssessmentCheck } from "@/engines/property";
import { HeroNumber, LiveNumber, LiveWarnings, TraceDisclosure } from "@/components/ui";
import { ToolVerdict } from "@/components/tool/ToolVerdict";
import { formatCents, formatDateLong, formatNumber, formatPct, usd } from "@/lib/property/format";
import { useCountUp } from "@/lib/property/signature";

/**
 * The verdict — the answer, in the register the audience actually uses.
 *
 * Every figure gets a plain-English sentence beside it, because the reader is a
 * homeowner holding an assessment notice, not an analyst reading a ratio study.
 * One number is allowed to be large: the gap between what you are assessed and
 * what comparable homes suggest. Everything else supports it.
 *
 * THE FLAG LAW. Stamp red appears on exactly one kind of fact here — a filing
 * deadline close enough that missing it forfeits the year — and always with an
 * icon and the word. When the deadline is months away, nothing on this surface
 * is red, which is what makes it mean something when it is.
 *
 * The honest verdict is not buried. "Not worth it" gets the same hero, the same
 * reasons, the same trace as "strong case" — a tool that talks most people out
 * of filing is the tool the rest believe.
 */

const KIND_LABEL: Record<string, string> = {
  STRONG_CASE: "Strong case",
  WORTH_FILING: "Worth filing",
  NOT_WORTH_IT: "Not worth filing",
  CANNOT_DETERMINE: "Cannot determine",
};

/** A deadline this close is the one high-stakes fact on the page. */
const IMMINENT_DAYS = 45;

/** Sentence case, after the verdict label has been lifted off the front. */
function sentenceCase(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

/** "78.00%" from 7800 basis points. Two decimals, as the Director publishes them. */
function pctFromBps(bps: number | null): string {
  return bps === null ? "—" : `${(bps / 100).toFixed(2)}%`;
}

export function VerdictBlock({ check }: { check: AssessmentCheck }) {
  const { verdict, deadline, county, confidence, analysis, subject } = check;
  const over = verdict.overAssessmentCents;
  const isOver = over > 0;
  const isMarket = analysis.argumentType === "MARKET_VALUE";
  const clr = verdict.commonLevelRange;
  const undetermined = verdict.kind === "CANNOT_DETERMINE";
  const statutoryIncrease = clr?.outcome === "INCREASE";

  const imminent = deadline.daysAway !== null && deadline.daysAway <= IMMINENT_DAYS;

  const warnings = [
    ...(imminent && deadline.isoDate !== null && deadline.daysAway !== null
      ? [
          {
            id: "deadline",
            severity: "irreversible" as const,
            title: `${county.countyName}'s deadline is ${formatDateLong(deadline.isoDate)} — ${deadline.daysAway} ${deadline.daysAway === 1 ? "day" : "days"} away.`,
            body: "Miss it and this year's assessment stands. The next chance to challenge it is a year from now, and this year's bill cannot be reopened.",
          },
        ]
      : []),
    // Red is for the irreversible. A Chapter 123 increase qualifies: filing
    // hands the board a statutory instruction to raise the assessment, and the
    // homeowner cannot withdraw the finding once it is made.
    ...(statutoryIncrease && clr?.statutoryAssessmentCents !== null
      ? [
          {
            id: "chapter-123-increase",
            severity: "irreversible" as const,
            title: `Filing would raise your assessment to ${formatCents(clr?.statutoryAssessmentCents ?? 0)}.`,
            body: `Your ratio sits below ${clr?.municipalityName}'s common level range, and the statute is symmetric: the hearing body sets the assessment at the average ratio × true value on either side of the range. This is the outcome, not a risk.`,
          },
        ]
      : []),
    ...(undetermined
      ? [
          {
            id: "cannot-determine",
            severity: "caution" as const,
            title: `${county.stateName} decides appeals on a statutory ratio test this check cannot run yet.`,
            body: "Nothing below is filing guidance. The comparables arithmetic is sound; the rule that converts it into relief needs data Bracketsight does not have.",
          },
        ]
      : []),
    ...(!isOver && !undetermined && clr === null
      ? [
          {
            id: "review-risk",
            severity: "caution" as const,
            title: "Filing anyway can raise your assessment, not lower it.",
            body: `Your home is assessed below what comparable homes suggest. An appeal invites the ${county.appealBody} to review the parcel, and a review can correct it upward.`,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/*
       * THE VERDICT, ON INK. It used to be a paper-raised box with a 2px accent
       * on its left edge, a grotesk h2 carrying the label and the engine's
       * sentence set at `--text-step-1` — the size of a field hint. The answer
       * now leads on the section's ink ground in Instrument Serif, with the
       * three figures it rests on beneath it and the plat-book green as the
       * accent. Everything the block used to say, it still says.
       *
       * `--flag` on this surface means one thing and appears at most once: a
       * filing deadline close enough that missing it forfeits the year, or a
       * Chapter 123 increase, which is the one outcome a homeowner cannot
       * withdraw once the board has made the finding. Icon and word both.
       */}
      <ToolVerdict
        label="The verdict"
        status={KIND_LABEL[verdict.kind] ?? "Verdict"}
        as="h2"
        sentenceProps={{ id: "verdict-heading" }}
        flag={
          statutoryIncrease && clr?.statutoryAssessmentCents != null
            ? {
                word: "Filing raises it",
                text: `Your ratio sits below ${clr.municipalityName}'s common level range, and the statute is symmetric — filing sets the assessment at ${formatCents(clr.statutoryAssessmentCents)}. This is the outcome, not a risk.`,
              }
            : imminent && deadline.isoDate !== null && deadline.daysAway !== null
              ? {
                  word: "Deadline",
                  text: `${county.countyName}'s deadline is ${formatDateLong(deadline.isoDate)} — ${formatNumber(deadline.daysAway)} ${deadline.daysAway === 1 ? "day" : "days"} away. Miss it and this year's assessment stands.`,
                }
              : undefined
        }
        aside={<VerdictHero check={check} />}
        below={
          <div className="grid gap-6 sm:grid-cols-2">
            <Figure
              label="What that costs you a year"
              value={verdict.estimatedAnnualOverpaymentCents}
              sentence={
                verdict.estimatedAnnualOverpaymentCents > 0
                  ? `Roughly what you overpay in tax every year until the assessment is corrected, at ${county.countyName}'s estimated rate of ${formatPct(county.estimatedTaxRateOnAssessedBps / 100)} on assessed value.`
                  : undetermined
                    ? `Not calculable. In ${county.stateName} the recoverable amount is set by statute, not by the comparables, and the statutory input is missing.`
                    : statutoryIncrease
                      ? "There is nothing to recover. Filing would add to this year's bill, not reduce it."
                      : clr?.outcome === "NO_RELIEF"
                        ? "There is nothing to recover — the common level range bars a reduction on these numbers."
                        : "There is nothing to recover — your assessment is not above what comparable homes suggest."
              }
            />

            <div className="flex flex-col gap-1">
              <span className="micro-label">How good the evidence is</span>
              <span
                className="num text-ink"
                style={{ fontSize: "var(--text-step-2)", fontWeight: 500 }}
              >
                {confidence.score}
                <span className="text-dim">/100</span>
              </span>
              <p className="text-dim" style={{ fontSize: "var(--text-step--1)", lineHeight: 1.45 }}>
                {confidence.level === "HIGH"
                  ? "High. The comparables are numerous, close together, and recent — the kind of evidence a board takes seriously."
                  : confidence.level === "MEDIUM"
                    ? "Medium. The comparables support the number, but expect the board to push back on some of them."
                    : "Low. There is not enough agreement between the comparables to file on this alone."}
              </p>
            </div>
          </div>
        }
      >
        {/* The engine's own sentence, minus the label the status already
            carries. Never reworded, never re-rounded. */}
        {sentenceCase(
          verdict.headline.replace(/^(Strong case|Worth filing|Cannot determine —)\s*:?\s*/, ""),
        )}
      </ToolVerdict>

      {/* The evidence, on paper. The deadline, the reasons, the traces — the
          working behind the answer, which is a different register from it. */}
      <section aria-label="What the verdict rests on">
        {/* The deadline. Real dates, real countdown, never manufactured. */}
        <div>
        {deadline.isoDate !== null && deadline.daysAway !== null ? (
          <p className="max-w-[68ch]">
            {county.countyName}&apos;s deadline is{" "}
            <span className="num font-medium">{formatDateLong(deadline.isoDate)}</span> —{" "}
            <span className="num font-medium">{formatNumber(deadline.daysAway)}</span>{" "}
            {deadline.daysAway === 1 ? "day" : "days"} away.
          </p>
        ) : (
          <p className="max-w-[68ch]">
            {county.countyName} does not run on one fixed date: {deadline.ruleText.split(" [")[0]}{" "}
            Watch your mailbox — the notice starts your clock.
          </p>
        )}

        {/* Received-by vs postmark. A homeowner who posts on the deadline
            loses the year, so this is stated, not footnoted — and only where
            the rules JSON records that the distinction has been verified. */}
        {deadline.filingCutoff === "RECEIVED_BY" ? (
          <p className="mt-2 max-w-[68ch]">
            That is the date the {county.appealBody} must <strong>have</strong> your petition, not
            the date you post it. {deadline.filingCutoffNote?.split(" [")[0]}
          </p>
        ) : deadline.filingCutoff === "POSTMARK" ? (
          <p className="mt-2 max-w-[68ch]">{deadline.filingCutoffNote?.split(" [")[0]}</p>
        ) : null}

        {warnings.length > 0 ? <LiveWarnings warnings={warnings} className="mt-3" /> : null}
      </div>

      <div className="mt-5">
        <p className="micro-label">Why</p>
        <ul className="mt-1.5 flex list-none flex-col gap-1.5 p-0" style={{ maxWidth: "68ch" }}>
          {verdict.reasons.map((reason) => (
            // `min-w-0` + `break-words`: the engine writes primary-source URLs
            // into these reasons ("Re-fetch the table from https://…"), and a
            // 389px unbreakable token in a flex item put a horizontal
            // scrollbar on the whole page at 375.
            <li key={reason} className="flex min-w-0 gap-2.5">
              <span aria-hidden="true" className="mt-[0.55em] h-px w-3 shrink-0 bg-dim" />
              <span
                className="min-w-0 break-words"
                style={{ fontSize: "var(--text-step--1)", lineHeight: 1.5 }}
              >
                {reason}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* The statutory test, when one governs. Never a computed figure without
          its "how this was calculated" affordance — and in a corridor state the
          corridor IS the calculation. */}
      {clr !== null && clr.averageRatioBps !== null ? (
        <TraceDisclosure
          className="mt-4"
          summaryLabel={`How ${county.stateName}'s common level range was applied`}
          formula="lower = average ratio × 0.85 · upper = average ratio × 1.15 · your ratio = assessed ÷ true value · relief = assessed − (average ratio × true value)"
          inputs={[
            { label: "Municipality", value: clr.municipalityName ?? "—" },
            { label: "Average ratio (Director's Ratio)", value: pctFromBps(clr.averageRatioBps) },
            { label: "Common level range, lower limit", value: pctFromBps(clr.lowerLimitBps) },
            { label: "Common level range, upper limit", value: pctFromBps(clr.upperLimitBps) },
            { label: "Your assessment-to-value ratio", value: pctFromBps(clr.subjectRatioBps) },
            {
              label: "Your true value",
              value: clr.trueValueCents === null ? "—" : formatCents(clr.trueValueCents),
            },
            {
              label: "Assessment the statute produces",
              value:
                clr.statutoryAssessmentCents === null
                  ? "—"
                  : formatCents(clr.statutoryAssessmentCents),
            },
            {
              label: clr.outcome === "INCREASE" ? "Statutory increase" : "Relief available",
              value: clr.reliefCents === null ? "—" : formatCents(Math.abs(clr.reliefCents)),
            },
            { label: "Governing clause", value: clr.clause },
          ]}
          ruleVersion={`${check.meta.ruleSetVersion} · engine ${check.meta.engineVersion}`}
          citation={{
            label: "NJ Assessors Handbook ch. 11 §§1105.19–1105.20",
            url: county.citations[1]?.url ?? "/property/sources",
            lastVerified: county.citations[1]?.lastVerified ?? check.meta.asOfDate,
          }}
        />
      ) : null}

      <TraceDisclosure
        className="mt-4"
        summaryLabel="How the over-assessment figure was calculated"
        formula={
          isMarket
            ? "implied fair = median(assessed ÷ sale price) × (median sale $/sqft × your sqft)"
            : "implied fair = median(assessed ÷ sqft) × your sqft"
        }
        inputs={[
          { label: "Comparables used", value: formatNumber(analysis.compCount) },
          {
            label: isMarket ? "Median assessed-to-sale ratio" : "Median assessed value per sqft",
            value: isMarket
              ? analysis.medianRatio.toFixed(4)
              : formatCents(Math.round(analysis.medianRatio)),
          },
          {
            label: isMarket ? "Your estimated market value" : "Your living area",
            value: isMarket
              ? formatCents(analysis.subjectMarketIndicator)
              : `${formatNumber(subject.sqft)} sqft`,
          },
          {
            label: "Implied fair assessment",
            value: formatCents(analysis.impliedFairAssessmentCents),
          },
          { label: "Your assessment", value: formatCents(subject.assessedValueCents) },
          { label: "Difference", value: formatCents(over) },
          {
            label: "County effective rate on assessed value",
            value: formatPct(county.estimatedTaxRateOnAssessedBps / 100),
          },
          { label: "Dispersion of the comparables (COD)", value: formatPct(analysis.cod) },
        ]}
        ruleVersion={`${check.meta.ruleSetVersion} · engine ${check.meta.engineVersion}`}
        citation={{
          label: county.citations[0]?.label ?? county.appealBody,
          url: county.citations[0]?.url ?? "/property/sources",
          lastVerified: county.citations[0]?.lastVerified ?? check.meta.asOfDate,
        }}
      />
      </section>
    </div>
  );
}

/**
 * The one large number on the screen, and the second half of the signature —
 * it counts up as the last comparable lands on the Comp Map.
 *
 * Isolated into its own component so the count re-renders the figure and
 * nothing else.
 */
function VerdictHero({ check }: { check: AssessmentCheck }) {
  const clr = check.verdict.commonLevelRange;
  const undetermined = check.verdict.kind === "CANNOT_DETERMINE";

  // In a corridor state the hero is the STATUTORY figure, because that is the
  // only number the board can act on. Where the statute cannot be applied, the
  // hero falls back to the comparables gap — labelled as the measurement it is,
  // never as an amount recoverable.
  const showStatutory = clr !== null && !undetermined && clr.reliefCents !== null;
  const value = showStatutory
    ? (clr.reliefCents ?? 0)
    : check.verdict.overAssessmentCents;
  const isOver = value > 0;
  const shown = useCountUp(Math.abs(value));

  const label = showStatutory
    ? clr.outcome === "INCREASE"
      ? "Your assessment would go UP by"
      : clr.outcome === "NO_RELIEF"
        ? "Reduction the statute allows"
        : "Reduction the statute allows"
    : isOver
      ? "Above what comparable homes suggest"
      : "Below what comparable homes suggest";

  return (
    <div className="flex flex-col gap-1">
      <HeroNumber label={label} value={shown} format={usd} />
      <p className="text-dim" style={{ fontSize: "var(--text-step--1)", lineHeight: 1.45 }}>
        {showStatutory ? (
          <>
            {clr.outcome === "NO_RELIEF" ? (
              <>
                Your ratio sits inside {clr.municipalityName}&apos;s common level range, so the
                board may not reduce your assessment at all.
              </>
            ) : (
              <>
                {clr.municipalityName}&apos;s average ratio applied to your true value gives{" "}
                <span className="num text-ink">
                  {formatCents(clr.statutoryAssessmentCents ?? 0)}
                </span>{" "}
                against your <span className="num text-ink">{formatCents(check.subject.assessedValueCents)}</span>.
              </>
            )}
          </>
        ) : isOver ? (
          <>
            The {formatNumber(check.analysis.compCount)} homes most like yours put a fair
            assessment near{" "}
            <LiveNumber
              className="text-ink"
              value={check.analysis.impliedFairAssessmentCents}
              format={usd}
            />
            . Your notice says{" "}
            <span className="num text-ink">{formatCents(check.subject.assessedValueCents)}</span>.
            {undetermined ? " That is a measurement, not an amount you can recover." : null}
          </>
        ) : (
          <>
            Comparable homes put a fair assessment near{" "}
            <span className="num text-ink">
              {formatCents(check.analysis.impliedFairAssessmentCents)}
            </span>
            , which is above what you are assessed. There is no gap to appeal.
          </>
        )}
      </p>
    </div>
  );
}

/** A supporting figure: never `--step-4`, always with its sentence. */
function Figure({
  label,
  value,
  sentence,
}: {
  label: string;
  value: number;
  sentence: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="micro-label">{label}</span>
      {/* Large, but never the largest — only the hero gets --step-4. */}
      <span className="text-ink" style={{ fontSize: "var(--text-step-2)", fontWeight: 500 }}>
        <LiveNumber value={value} format={usd} />
      </span>
      <p className="text-dim" style={{ fontSize: "var(--text-step--1)", lineHeight: 1.45 }}>
        {sentence}
      </p>
    </div>
  );
}
