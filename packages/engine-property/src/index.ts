/**
 * @fairparcel/engine — over-assessment detection.
 *
 * Pure TypeScript. Zero dependencies, zero AI, zero network calls.
 * Statistics a hearing officer can re-run by hand: median assessment ratios,
 * IAAO coefficient of dispersion, documented thresholds. If a change makes a
 * number here non-reproducible, it is the wrong change.
 */

export * from "./types";
export * from "./money";
export * from "./stats";
export * from "./comps";
export * from "./ratio";
export * from "./confidence";
export * from "./common-level-range";
export * from "./fees";
export * from "./verdict";
export * from "./deadline";
export * from "./rules";
export * from "./data";

import { DEFAULT_CRITERIA, selectComps } from "./comps";
import { scoreConfidence } from "./confidence";
import { nextDeadline } from "./deadline";
import { MIN_COMPS, analyzeRatios } from "./ratio";
import { decideVerdict } from "./verdict";
import type {
  AssessmentCheck,
  CompCriteria,
  CountyRules,
  Property,
} from "./types";

export const ENGINE_VERSION = "0.1.0";

/**
 * The one call the app makes: select comps, run the county's primary argument
 * analysis, score confidence, decide the verdict, compute the deadline.
 *
 * Returns null-analysis failure as a thrown Error when fewer than MIN_COMPS
 * comps survive the filters — callers render the rejection reasons instead.
 */
export function runAssessmentCheck(
  subject: Property,
  candidates: Property[],
  county: CountyRules,
  asOfIso: string,
  criteriaOverrides?: Partial<CompCriteria>,
): AssessmentCheck {
  const argumentType = county.primaryArgument;
  const criteria: CompCriteria = {
    sizeTolerancePct: DEFAULT_CRITERIA.sizeTolerancePct,
    maxComps: DEFAULT_CRITERIA.maxComps,
    windowMonths: county.compsWindowMonths,
    requireSale: argumentType === "MARKET_VALUE",
    ...criteriaOverrides,
  };

  const selection = selectComps(subject, candidates, criteria, asOfIso);
  if (selection.selected.length < MIN_COMPS) {
    throw new Error(
      `Only ${selection.selected.length} comparable(s) passed the filters — at least ${MIN_COMPS} are needed for a reliable check.`,
    );
  }

  const analysis = analyzeRatios(subject, selection.selected, argumentType, asOfIso);
  const confidence = scoreConfidence({
    compCount: analysis.compCount,
    cod: analysis.cod,
    medianDataAgeDays: analysis.medianDataAgeDays,
    windowMonths: criteria.windowMonths,
  });
  // The subject and the date both matter to corridor jurisdictions: New
  // Jersey's Director's Ratio is per municipality and per tax year.
  const verdict = decideVerdict(analysis, confidence, county, subject, asOfIso);
  const deadline = nextDeadline(county, asOfIso);

  return {
    subject,
    county,
    selection,
    analysis,
    confidence,
    verdict,
    deadline,
    meta: {
      engineVersion: ENGINE_VERSION,
      ruleSetVersion: county.ruleSetVersion,
      asOfDate: asOfIso,
    },
  };
}
