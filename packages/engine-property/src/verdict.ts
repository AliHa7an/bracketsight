/**
 * Verdict thresholds — spec §1.1 step 7: "strong case" / "worth filing" /
 * "not worth it — here's why."
 *
 * Honest verdicts are the product. Most homes are assessed about right, and the
 * tool that says so is the one people believe when it says the opposite. Every
 * NOT_WORTH_IT verdict carries its reasons in plain English.
 *
 * KNOWN-GAP GAP-014 / GAP-043: the "estimated annual overpayment" this module
 * computes, and the filing-fee comparisons gated on it, multiply through
 * `county.estimatedTaxRateOnAssessedBps` — 2000 for Cook and 230 for Bergen,
 * both UNRESOLVED. Cook's real burden is assessment level × the Illinois state
 * equalization factor × the composite local rate; New Jersey's general tax
 * rates are struck per municipality per year. Neither is a single constant.
 * KNOWN-GAP GAP-007 additionally means the Cook filing fee those gates compare
 * against ($0) is verified for the Board of Review only. See /KNOWN-GAPS.md.
 *
 * TWO RELIEF MODELS, selected by `county.reliefModel` — never by state code.
 *
 * GAP (Cook County and any jurisdiction with no statutory corridor):
 *   NOT_WORTH_IT  over-assessment < 5% of implied fair value, OR confidence LOW,
 *                 OR estimated first-year savings don't clear the filing fee.
 *   STRONG_CASE   over-assessment ≥ 10%, confidence HIGH, and estimated annual
 *                 overpayment ≥ max(2 × filing fee, $200).
 *   WORTH_FILING  everything in between.
 *
 * COMMON_LEVEL_RANGE (New Jersey's Chapter 123, see common-level-range.ts):
 *   The statutory corridor decides FIRST, and the comparables gap never
 *   overrides it. Inside the corridor the board may grant nothing, so the
 *   verdict is NOT_WORTH_IT no matter how big the gap. Below the corridor the
 *   statute RAISES the assessment, so the verdict is NOT_WORTH_IT with a hard
 *   warning. Above it, relief is `Average Ratio × true value` — and only then
 *   do the economic gates below run, on that statutory relief figure.
 *
 *   The 5% noise floor is deliberately NOT applied on this path: the ±15%
 *   corridor IS New Jersey's tolerance band, and stacking a second invented
 *   tolerance on top of it would deny relief the statute grants.
 *
 *   With a statutory input missing the verdict is CANNOT_DETERMINE. Falling
 *   back to the generic threshold would recommend appeals the county board is
 *   required by statute to deny.
 *
 * Thresholds are documented on /methodology; change both places or neither.
 */

import { applyCommonLevelRange, formatRatioBps } from "./common-level-range";
import { filingFeeFor } from "./fees";
import { applyBps, formatCents } from "./money";
import type {
  Cents,
  CommonLevelRangeResult,
  Confidence,
  CountyRules,
  Property,
  RatioAnalysis,
  Verdict,
  VerdictKind,
} from "./types";

export const NOT_WORTH_IT_MAX_PCT = 5;
export const STRONG_CASE_MIN_PCT = 10;
export const STRONG_CASE_MIN_ANNUAL_OVERPAYMENT_CENTS: Cents = 20_000; // $200

/** What the corridor test needs from the subject parcel. */
export type VerdictSubject = Pick<Property, "municipalityId">;

export function decideVerdict(
  analysis: RatioAnalysis,
  confidence: Confidence,
  county: CountyRules,
  subject?: VerdictSubject,
  asOfIso?: string,
): Verdict {
  // ratio.ts defines overAssessment = assessed − impliedFair, so the subject's
  // assessed value is recoverable exactly. The fee schedule is banded on it.
  const assessedValueCents =
    analysis.impliedFairAssessmentCents + analysis.overAssessmentCents;
  const filingFeeCents = filingFeeFor(county, assessedValueCents);

  if (county.reliefModel === "COMMON_LEVEL_RANGE") {
    return commonLevelRangeVerdict(
      analysis,
      confidence,
      county,
      assessedValueCents,
      filingFeeCents,
      subject,
      asOfIso,
    );
  }
  return gapVerdict(analysis, confidence, county, filingFeeCents);
}

/* -------------------------------------------------------------------------- *
 * GAP model
 * -------------------------------------------------------------------------- */

function gapVerdict(
  analysis: RatioAnalysis,
  confidence: Confidence,
  county: CountyRules,
  filingFeeCents: Cents,
): Verdict {
  const overCents = analysis.overAssessmentCents;
  const overPct = analysis.overAssessmentPct;
  const estimatedAnnualOverpaymentCents =
    overCents > 0 ? applyBps(overCents, county.estimatedTaxRateOnAssessedBps) : 0;

  const reasons: string[] = [];
  let kind: VerdictKind;
  let headline: string;

  if (overCents <= 0) {
    kind = "NOT_WORTH_IT";
    headline = "Your assessment looks fair — comparable homes suggest it is not too high.";
    reasons.push(
      `Comparable homes imply a fair assessment of about ${formatCents(analysis.impliedFairAssessmentCents)}, which is at or above your current assessment.`,
      "Filing an appeal can prompt a full review of your parcel. When a home is assessed below what comparables suggest, a review can raise the assessment, not lower it.",
    );
  } else if (overPct < NOT_WORTH_IT_MAX_PCT) {
    kind = "NOT_WORTH_IT";
    headline = "Your assessment looks fair — the gap is inside normal appraisal noise.";
    reasons.push(
      `Your home is assessed ${formatCents(overCents)} (${overPct.toFixed(1)}%) above what comparables suggest — under the ${NOT_WORTH_IT_MAX_PCT}% line where appeal boards typically adjust.`,
      `Even if fully corrected, the estimated tax saving is about ${formatCents(estimatedAnnualOverpaymentCents)} a year${filingFeeCents > 0 ? `, against a ${formatCents(filingFeeCents)} filing fee` : ""}.`,
    );
  } else if (confidence.level === "LOW") {
    kind = "NOT_WORTH_IT";
    headline = "The gap looks real, but the evidence is too weak to file on.";
    reasons.push(
      `The comparables suggest you may be over-assessed by ${formatCents(overCents)} (${overPct.toFixed(1)}%), but the evidence behind that number is weak (confidence ${confidence.score}/100).`,
      ...confidence.factors,
      "A hearing officer will probe exactly these weaknesses. Consider gathering better comparables before filing.",
    );
  } else if (filingFeeCents > 0 && estimatedAnnualOverpaymentCents <= filingFeeCents) {
    kind = "NOT_WORTH_IT";
    headline = "The over-assessment is real but too small to be worth the filing fee.";
    reasons.push(
      `Estimated tax overpayment is about ${formatCents(estimatedAnnualOverpaymentCents)} a year, which does not clear the ${formatCents(filingFeeCents)} filing fee in year one.`,
    );
  } else if (
    overPct >= STRONG_CASE_MIN_PCT &&
    confidence.level === "HIGH" &&
    estimatedAnnualOverpaymentCents >=
      Math.max(2 * filingFeeCents, STRONG_CASE_MIN_ANNUAL_OVERPAYMENT_CENTS)
  ) {
    kind = "STRONG_CASE";
    headline = `Strong case: assessed ${formatCents(overCents)} (${overPct.toFixed(0)}%) above what comparable homes suggest.`;
    reasons.push(
      `${analysis.compCount} comparable homes put a fair assessment near ${formatCents(analysis.impliedFairAssessmentCents)}; yours is ${formatCents(overCents)} higher.`,
      `Estimated tax overpayment: about ${formatCents(estimatedAnnualOverpaymentCents)} per year until corrected.`,
      `Evidence quality is high (confidence ${confidence.score}/100).`,
    );
  } else {
    kind = "WORTH_FILING";
    headline = `Worth filing: assessed ${formatCents(overCents)} (${overPct.toFixed(1)}%) above what comparable homes suggest.`;
    reasons.push(
      `The gap clears the ${NOT_WORTH_IT_MAX_PCT}% line but is not a slam dunk — expect the ${county.appealBody} to scrutinize the comparables.`,
      `Estimated tax overpayment: about ${formatCents(estimatedAnnualOverpaymentCents)} per year.`,
      `Confidence ${confidence.score}/100 (${confidence.level.toLowerCase()}).`,
    );
  }

  return {
    kind,
    headline,
    reasons,
    overAssessmentCents: overCents,
    overAssessmentPct: overPct,
    estimatedAnnualOverpaymentCents,
    filingFeeCents,
    confidence,
    commonLevelRange: null,
  };
}

/* -------------------------------------------------------------------------- *
 * COMMON_LEVEL_RANGE model — New Jersey Chapter 123
 * -------------------------------------------------------------------------- */

function commonLevelRangeVerdict(
  analysis: RatioAnalysis,
  confidence: Confidence,
  county: CountyRules,
  assessedValueCents: Cents,
  filingFeeCents: Cents,
  subject: VerdictSubject | undefined,
  asOfIso: string | undefined,
): Verdict {
  const rules = county.commonLevelRange;

  const base = {
    filingFeeCents,
    confidence,
  };

  if (rules === undefined) {
    // The rules loader rejects this at import time; belt and braces.
    return {
      ...base,
      kind: "CANNOT_DETERMINE",
      headline: `${county.countyName} uses a statutory ratio corridor, and its rules file carries no corridor data.`,
      reasons: [
        "The engine will not substitute a generic over-assessment threshold for a statutory test.",
      ],
      overAssessmentCents: analysis.overAssessmentCents,
      overAssessmentPct: analysis.overAssessmentPct,
      estimatedAnnualOverpaymentCents: 0,
      commonLevelRange: null,
    };
  }

  // The corridor is struck against TRUE value. Only a market-value analysis
  // produces one — a uniformity analysis's indicator is square footage.
  const trueValueCents =
    analysis.argumentType === "MARKET_VALUE" ? analysis.subjectMarketIndicator : null;

  const clr = applyCommonLevelRange({
    rules,
    municipalityId: subject?.municipalityId,
    assessedValueCents,
    trueValueCents,
    asOfIso,
    countyName: county.countyName,
  });

  if (clr.outcome === "CANNOT_DETERMINE") {
    return {
      ...base,
      kind: "CANNOT_DETERMINE",
      headline: `Cannot determine — ${county.stateName} needs your municipality's Director's Ratio before any appeal advice is honest.`,
      reasons: [
        clr.explanation,
        `${county.stateName} decides appeals on Chapter 123: relief depends on where your assessment-to-value ratio falls against your municipality's average ratio, not on the gap against comparable homes. ${rules.statute}`,
        `For the record, comparable homes put a fair assessment near ${formatCents(analysis.impliedFairAssessmentCents)} against your ${formatCents(assessedValueCents)} — a ${formatCents(analysis.overAssessmentCents)} difference. That figure is not a basis for filing here, and the county board is not permitted to act on it.`,
        `Re-fetch the table from ${rules.sourceUrl}. It is republished every 1 April.`,
      ],
      overAssessmentCents: analysis.overAssessmentCents,
      overAssessmentPct: analysis.overAssessmentPct,
      estimatedAnnualOverpaymentCents: 0,
      commonLevelRange: clr,
    };
  }

  const reliefCents = clr.reliefCents ?? 0;
  const statutoryAssessmentCents = clr.statutoryAssessmentCents ?? assessedValueCents;
  const reliefPct =
    statutoryAssessmentCents === 0 ? 0 : (reliefCents / statutoryAssessmentCents) * 100;

  if (clr.outcome === "NO_RELIEF") {
    return {
      ...base,
      kind: "NOT_WORTH_IT",
      headline: `Chapter 123 blocks relief: your ratio sits inside ${clr.municipalityName}'s common level range.`,
      reasons: [
        clr.explanation,
        `Comparable homes put a fair assessment near ${formatCents(analysis.impliedFairAssessmentCents)}, ${formatCents(Math.abs(analysis.overAssessmentCents))} ${analysis.overAssessmentCents >= 0 ? "below" : "above"} your ${formatCents(assessedValueCents)}. That comparison does not survive the corridor test — the board would be required to deny it.`,
        `Filing costs ${formatCents(filingFeeCents)} and cannot win on these numbers. Your ratio would have to exceed ${formatRatioBps(clr.upperLimitBps ?? 0)} of true value before the board could reduce anything.`,
      ],
      overAssessmentCents: 0,
      overAssessmentPct: 0,
      estimatedAnnualOverpaymentCents: 0,
      commonLevelRange: clr,
    };
  }

  if (clr.outcome === "INCREASE") {
    const increaseCents = Math.abs(reliefCents);
    return {
      ...base,
      kind: "NOT_WORTH_IT",
      headline: `Do not file: Chapter 123 would raise your assessment by ${formatCents(increaseCents)}.`,
      reasons: [
        clr.explanation,
        `Your assessment is ${formatCents(assessedValueCents)}. Applying ${clr.municipalityName}'s average ratio to your true value gives ${formatCents(statutoryAssessmentCents)} — ${formatCents(increaseCents)} higher.`,
        `This is not a review risk. It is the statutory outcome: ${rules.statute} directs the hearing body to set the assessment at the average ratio × true value on either side of the range.`,
        `At ${county.countyName}'s estimated rate, that increase would add roughly ${formatCents(applyBps(increaseCents, county.estimatedTaxRateOnAssessedBps))} a year to your bill.`,
      ],
      overAssessmentCents: reliefCents,
      overAssessmentPct: reliefPct,
      estimatedAnnualOverpaymentCents: 0,
      commonLevelRange: clr,
    };
  }

  // REDUCTION — relief is due. Now, and only now, the economic gates.
  const estimatedAnnualOverpaymentCents = applyBps(
    reliefCents,
    county.estimatedTaxRateOnAssessedBps,
  );
  const statutoryLine = `Chapter 123 sets your assessment at ${formatCents(statutoryAssessmentCents)} — ${clr.municipalityName}'s ${formatRatioBps(clr.averageRatioBps ?? 0)} average ratio × your ${formatCents(clr.trueValueCents ?? 0)} true value. That is ${formatCents(reliefCents)} below your current ${formatCents(assessedValueCents)}, and it is the relief the board can grant, not the comparables gap.`;

  const reasons: string[] = [clr.explanation, statutoryLine];
  let kind: VerdictKind;
  let headline: string;

  if (confidence.level === "LOW") {
    kind = "NOT_WORTH_IT";
    headline = "You are outside the range, but the evidence behind your true value is too weak to file on.";
    reasons.push(
      `Chapter 123 turns entirely on the true value the hearing body finds. Yours rests on evidence scoring ${confidence.score}/100.`,
      ...confidence.factors,
      "Gather better comparable sales first — a weaker true value can move you back inside the range.",
    );
  } else if (filingFeeCents > 0 && estimatedAnnualOverpaymentCents <= filingFeeCents) {
    kind = "NOT_WORTH_IT";
    headline = "Relief is available, but it is too small to be worth the filing fee.";
    reasons.push(
      `Estimated tax saving is about ${formatCents(estimatedAnnualOverpaymentCents)} a year, which does not clear the ${formatCents(filingFeeCents)} filing fee in year one.`,
    );
  } else if (
    reliefPct >= STRONG_CASE_MIN_PCT &&
    confidence.level === "HIGH" &&
    estimatedAnnualOverpaymentCents >=
      Math.max(2 * filingFeeCents, STRONG_CASE_MIN_ANNUAL_OVERPAYMENT_CENTS)
  ) {
    kind = "STRONG_CASE";
    headline = `Strong case: Chapter 123 entitles you to a ${formatCents(reliefCents)} reduction.`;
    reasons.push(
      `Estimated tax saving: about ${formatCents(estimatedAnnualOverpaymentCents)} per year until corrected.`,
      `Evidence quality is high (confidence ${confidence.score}/100), which matters here — the whole test rests on the true value it supports.`,
    );
  } else {
    kind = "WORTH_FILING";
    headline = `Worth filing: Chapter 123 puts a ${formatCents(reliefCents)} reduction within reach.`;
    reasons.push(
      `Estimated tax saving: about ${formatCents(estimatedAnnualOverpaymentCents)} per year.`,
      `Confidence ${confidence.score}/100 (${confidence.level.toLowerCase()}) — expect the ${county.appealBody} to test your true value before it applies the ratio.`,
    );
  }

  return {
    ...base,
    kind,
    headline,
    reasons,
    overAssessmentCents: reliefCents,
    overAssessmentPct: reliefPct,
    estimatedAnnualOverpaymentCents,
    commonLevelRange: clr,
  };
}
