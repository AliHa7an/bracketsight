/**
 * The common level range test — New Jersey's "Chapter 123".
 *
 * KNOWN-GAP GAP-041 — the RULE below is implemented and verified; the DATA it
 * needs is missing. `commonLevelRange.municipalities` in nj-bergen.json is
 * deliberately empty: no municipal Director's Ratio has been read from a
 * primary source, and FairParcel does not invent ratios. So this module returns
 * CANNOT_DETERMINE for every New Jersey parcel and `decideVerdict` surfaces
 * that, naming the missing input — it does NOT fall back to the generic
 * over-assessment threshold, which would tell a homeowner inside the corridor
 * they have a STRONG_CASE on an appeal the county board is required by statute
 * to deny. Populate from the Division of Taxation's Chapter 123 table
 * (republished every 1 April, per municipality; each entry needs its own
 * citation or the rules loader rejects it). See /KNOWN-GAPS.md.
 *
 * PRIMARY SOURCE: NJ Division of Taxation, *Handbook for New Jersey Assessors*,
 * ch. 11 (Tax Appeals), §§1105.19–1105.20. Statutes: N.J.S.A. 54:1-35a (the
 * average ratio), 54:3-22(c) (limits the relief a county board may grant),
 * 54:51A-6 (the same limit on the Tax Court).
 *
 * §1105.19 — the corridor:
 *   "The 'Common Level Range' for a taxing district is that range which is
 *    calculated to be 15% plus and minus the Average Ratio. For example, where
 *    the average ratio is found to be 78.00%, the Common Level Range would be:
 *    Lower Limit — 66.30%, Upper Limit — 89.70%."
 *
 *   The ±15% is MULTIPLICATIVE ON THE RATIO, not 15 percentage points:
 *   78.00 × 0.85 = 66.30 and 78.00 × 1.15 = 89.70. Encoding it as 78 − 15 and
 *   78 + 15 would widen the corridor and hand out relief the statute denies.
 *
 * §1105.20 — the relief calculation. A ratio is struck by dividing the assessed
 * value under appeal by the true value found by the hearing body (the "Subject
 * Property Ratio"), then:
 *   (1) inside the Common Level Range → NO reduction, subject to (3) and (4);
 *   (2) above the Upper Limit OR below the Lower Limit → the assessment is
 *       Average Ratio × true value, subject to (3) and (4);
 *   (3) Subject Ratio above the County Percentage Level (100%) and the
 *       district Average Ratio below it → Average Ratio × true value;
 *   (4) Subject Ratio above the County Percentage Level and the district
 *       Average Ratio also above it → County Percentage Level × true value.
 *
 * Three consequences the generic over-assessment threshold cannot express, and
 * the reason this module exists:
 *
 *   1. A gap can be real and still non-actionable. Inside the corridor the
 *      board grants nothing, however large the comparables gap looks.
 *   2. When relief IS due the new assessment is Average Ratio × true value —
 *      not the comparables' implied fair assessment.
 *   3. Clause (2) is symmetric. Below the lower limit the assessment goes UP.
 *      That is the statutory outcome, not a review risk: filing harms.
 *
 * Ratios are basis points throughout (78.00% → 7800) so the arithmetic stays
 * integer and a hearing officer can re-run it by hand.
 */

import { applyBps, assertCents, roundHalfAwayFromZero } from "./money";
import type {
  Bps,
  Cents,
  CommonLevelRangeResult,
  CommonLevelRangeRules,
  MunicipalityAverageRatio,
} from "./types";

/** One whole unit in basis points: 100.00% → 10000. */
export const BPS_ONE = 10_000;

export interface CommonLevelRangeLimits {
  lowerLimitBps: Bps;
  upperLimitBps: Bps;
}

/**
 * The corridor. Multiplicative, per §1105.19.
 *
 *   lower = averageRatio × (1 − corridor)
 *   upper = averageRatio × (1 + corridor)
 *
 * Handbook worked example: 7800 bps with a 1500 bps corridor →
 *   7800 × 8500 / 10000 = 6630 (66.30%)
 *   7800 × 11500 / 10000 = 8970 (89.70%)
 *
 * Limits are rounded half away from zero to whole basis points, matching the
 * two-decimal percentages the Director publishes.
 */
export function commonLevelRangeLimits(
  averageRatioBps: Bps,
  corridorBps: Bps,
): CommonLevelRangeLimits {
  if (!Number.isInteger(averageRatioBps) || averageRatioBps <= 0) {
    throw new Error(`average ratio must be positive integer basis points, got ${averageRatioBps}`);
  }
  if (!Number.isInteger(corridorBps) || corridorBps < 0 || corridorBps >= BPS_ONE) {
    throw new Error(`corridor must be integer basis points in [0, ${BPS_ONE}), got ${corridorBps}`);
  }
  return {
    lowerLimitBps: roundHalfAwayFromZero((averageRatioBps * (BPS_ONE - corridorBps)) / BPS_ONE),
    upperLimitBps: roundHalfAwayFromZero((averageRatioBps * (BPS_ONE + corridorBps)) / BPS_ONE),
  };
}

/** Subject Property Ratio: assessed value ÷ true value, in basis points (§1105.20). */
export function subjectPropertyRatioBps(
  assessedValueCents: Cents,
  trueValueCents: Cents,
): Bps {
  assertCents(assessedValueCents, "assessed value");
  assertCents(trueValueCents, "true value");
  if (trueValueCents <= 0) {
    throw new Error("subject property ratio needs a positive true value");
  }
  return roundHalfAwayFromZero((assessedValueCents * BPS_ONE) / trueValueCents);
}

/**
 * The Director's Ratio in force for a district on `asOfIso`.
 *
 * Ratios are dated because the Director republishes them every 1 April; the
 * ratio that governs an appeal is the one in force for that tax year.
 */
export function findAverageRatio(
  rules: CommonLevelRangeRules,
  municipalityId: string,
  asOfIso: string,
): MunicipalityAverageRatio | undefined {
  return rules.municipalities.find(
    (m) =>
      m.municipalityId === municipalityId &&
      m.effectiveFrom <= asOfIso &&
      asOfIso <= m.effectiveTo,
  );
}

export interface CommonLevelRangeInput {
  rules: CommonLevelRangeRules;
  /** The taxing district. Undefined → CANNOT_DETERMINE; Chapter 123 is per-district. */
  municipalityId: string | undefined;
  assessedValueCents: Cents;
  /** True (market) value as the hearing body would find it. Null → CANNOT_DETERMINE. */
  trueValueCents: Cents | null;
  /**
   * The date the check is run for. Selects which annual ratio governs.
   * Undefined → CANNOT_DETERMINE; the engine never reads the wall clock.
   */
  asOfIso: string | undefined;
  /** Named in the user-facing explanations, e.g. "Bergen County". */
  countyName: string;
}

function cannotDetermine(
  explanation: string,
  input: CommonLevelRangeInput,
): CommonLevelRangeResult {
  return {
    outcome: "CANNOT_DETERMINE",
    clause: "§1105.20",
    explanation,
    municipalityId: input.municipalityId ?? null,
    municipalityName: null,
    averageRatioBps: null,
    lowerLimitBps: null,
    upperLimitBps: null,
    subjectRatioBps: null,
    trueValueCents: input.trueValueCents,
    currentAssessmentCents: input.assessedValueCents,
    statutoryAssessmentCents: null,
    reliefCents: null,
  };
}

/** "78.00%" from 7800 bps. Two decimals, matching the published tables. */
export function formatRatioBps(bps: Bps): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Run the whole test. Returns CANNOT_DETERMINE rather than guessing whenever a
 * statutory input is missing — the engine never falls back to a generic
 * over-assessment threshold in a corridor jurisdiction.
 */
export function applyCommonLevelRange(
  input: CommonLevelRangeInput,
): CommonLevelRangeResult {
  const { rules, municipalityId, assessedValueCents, trueValueCents, asOfIso, countyName } = input;

  assertCents(assessedValueCents, "assessed value");

  if (trueValueCents === null || trueValueCents <= 0) {
    return cannotDetermine(
      "Chapter 123 compares your assessment against your home's true market value, and this analysis does not produce one. Run a market-value comparison to apply the test.",
      input,
    );
  }

  if (rules.municipalities.length === 0) {
    return cannotDetermine(
      `${rules.unpopulatedNote} Until it is, no ${countyName} result can be presented as filing guidance.`,
      input,
    );
  }

  if (municipalityId === undefined || municipalityId.length === 0) {
    return cannotDetermine(
      "Chapter 123 is applied municipality by municipality — each taxing district has its own Director's Ratio. Tell us which municipality your home is in and the test can run.",
      input,
    );
  }

  if (asOfIso === undefined) {
    return cannotDetermine(
      "The Director's Ratio is republished every 1 April, so the test needs the tax year you are appealing. Supply the date the check is being run for.",
      input,
    );
  }

  const average = findAverageRatio(rules, municipalityId, asOfIso);
  if (average === undefined) {
    return cannotDetermine(
      `No Director's Ratio is on file for ${municipalityId} as of ${asOfIso}. The Director republishes the table every ${rules.republishedOn === "04-01" ? "1 April" : rules.republishedOn}; it must be re-fetched from ${rules.sourceUrl} before this municipality can be checked.`,
      input,
    );
  }

  const { lowerLimitBps, upperLimitBps } = commonLevelRangeLimits(
    average.averageRatioBps,
    rules.corridorBps,
  );
  const subjectRatioBps = subjectPropertyRatioBps(assessedValueCents, trueValueCents);
  const countyLevelBps = rules.countyPercentageLevelBps;

  let clause: string;
  let statutoryAssessmentCents: Cents;

  // Clauses (3) and (4) are stated to govern over (1) and (2), so they are
  // tested first. Both fire only when the subject ratio exceeds the County
  // Percentage Level, which is where an assessment above full true value sits.
  if (subjectRatioBps > countyLevelBps) {
    if (average.averageRatioBps < countyLevelBps) {
      clause = "§1105.20(3)";
      statutoryAssessmentCents = applyBps(trueValueCents, average.averageRatioBps);
    } else {
      clause = "§1105.20(4)";
      statutoryAssessmentCents = applyBps(trueValueCents, countyLevelBps);
    }
  } else if (subjectRatioBps > upperLimitBps) {
    clause = "§1105.20(2)";
    statutoryAssessmentCents = applyBps(trueValueCents, average.averageRatioBps);
  } else if (subjectRatioBps < lowerLimitBps) {
    clause = "§1105.20(2)";
    statutoryAssessmentCents = applyBps(trueValueCents, average.averageRatioBps);
  } else {
    clause = "§1105.20(1)";
    statutoryAssessmentCents = assessedValueCents;
  }

  const reliefCents = assessedValueCents - statutoryAssessmentCents;
  const outcome =
    reliefCents > 0 ? "REDUCTION" : reliefCents < 0 ? "INCREASE" : "NO_RELIEF";

  const corridor = `${formatRatioBps(lowerLimitBps)} to ${formatRatioBps(upperLimitBps)}`;
  const yours = formatRatioBps(subjectRatioBps);
  const avg = formatRatioBps(average.averageRatioBps);

  let explanation: string;
  if (outcome === "NO_RELIEF") {
    explanation = `Your assessment is ${yours} of your home's true value. ${average.name}'s common level range is ${corridor} — 15% either side of its ${avg} average ratio. Your ratio sits inside that range, so under N.J.S.A. 54:3-22(c) the county board may not reduce your assessment, however large the gap against comparable homes looks.`;
  } else if (outcome === "INCREASE") {
    explanation = `Your assessment is ${yours} of your home's true value — below the ${formatRatioBps(lowerLimitBps)} lower limit of ${average.name}'s common level range (${corridor}). Chapter 123 is symmetric: a ratio below the range resets the assessment UP to the average ratio × true value. Filing would raise your assessment, not lower it.`;
  } else if (clause === "§1105.20(4)") {
    explanation = `Your assessment is ${yours} of your home's true value, above the ${formatRatioBps(countyLevelBps)} county percentage level. ${average.name}'s average ratio (${avg}) is also at or above that level, so the assessment is reset to the county percentage level × true value.`;
  } else if (clause === "§1105.20(3)") {
    explanation = `Your assessment is ${yours} of your home's true value, above the ${formatRatioBps(countyLevelBps)} county percentage level, while ${average.name}'s average ratio is ${avg}. The assessment is reset to the average ratio × true value.`;
  } else {
    explanation = `Your assessment is ${yours} of your home's true value — above the ${formatRatioBps(upperLimitBps)} upper limit of ${average.name}'s common level range (${corridor}). The assessment is reset to ${avg} × true value.`;
  }

  return {
    outcome,
    clause,
    explanation,
    municipalityId: average.municipalityId,
    municipalityName: average.name,
    averageRatioBps: average.averageRatioBps,
    lowerLimitBps,
    upperLimitBps,
    subjectRatioBps,
    trueValueCents,
    currentAssessmentCents: assessedValueCents,
    statutoryAssessmentCents,
    reliefCents,
  };
}
