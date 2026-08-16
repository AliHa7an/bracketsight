/**
 * Ratio analysis — spec §1.1 steps 3–5.
 *
 * MARKET_VALUE argument:
 *   ratio_i          = comp assessedValue / comp sale price
 *   subject market   = median(comp sale $/sqft) × subject sqft
 *   implied fair     = median(ratio_i) × subject market value
 *
 * UNIFORMITY argument (unequal treatment vs comparable ASSESSMENTS):
 *   ratio_i          = comp assessedValue / comp sqft (assessed ¢/sqft)
 *   implied fair     = median(ratio_i) × subject sqft
 *
 * over-assessment = subject assessed − implied fair. Negative means the home
 * is assessed BELOW what its comps suggest — the honest answer is "don't file."
 */

import { daysBetween, evidenceDate } from "./comps";
import { assertCents, roundToCents } from "./money";
import { cod, median } from "./stats";
import type {
  ArgumentType,
  CompRatio,
  Property,
  RatioAnalysis,
} from "./types";

/** Minimum comps for any analysis. Below this the engine refuses to produce a number. */
export const MIN_COMPS = 3;

export function analyzeRatios(
  subject: Property,
  comps: Property[],
  argumentType: ArgumentType,
  asOfIso: string,
): RatioAnalysis {
  assertCents(subject.assessedValueCents, "subject assessedValue");
  if (comps.length < MIN_COMPS) {
    throw new Error(
      `ratio analysis needs at least ${MIN_COMPS} comps, got ${comps.length}`,
    );
  }

  const requireSale = argumentType === "MARKET_VALUE";

  let subjectMarketIndicator: number;
  let subjectRatio: number;
  const rawRatios: number[] = [];
  const ages: number[] = [];

  if (argumentType === "MARKET_VALUE") {
    const pricePerSqft: number[] = [];
    for (const comp of comps) {
      if (comp.lastSalePriceCents === undefined || comp.lastSaleDate === undefined) {
        throw new Error(`comp ${comp.id} has no sale — invalid for MARKET_VALUE analysis`);
      }
      assertCents(comp.lastSalePriceCents, `comp ${comp.id} sale price`);
      rawRatios.push(comp.assessedValueCents / comp.lastSalePriceCents);
      pricePerSqft.push(comp.lastSalePriceCents / comp.sqft);
    }
    // Subject's market indicator: estimated market value in cents.
    subjectMarketIndicator = roundToCents(median(pricePerSqft) * subject.sqft);
    subjectRatio = subject.assessedValueCents / subjectMarketIndicator;
  } else {
    for (const comp of comps) {
      rawRatios.push(comp.assessedValueCents / comp.sqft);
    }
    // Subject's market indicator for uniformity: its square footage.
    subjectMarketIndicator = subject.sqft;
    subjectRatio = subject.assessedValueCents / subject.sqft;
  }

  for (const comp of comps) {
    const evidence = evidenceDate(comp, requireSale);
    ages.push(evidence === undefined ? Number.MAX_SAFE_INTEGER : daysBetween(evidence, asOfIso));
  }

  const medianRatio = median(rawRatios);
  const dispersion = cod(rawRatios);
  const impliedFairAssessmentCents = roundToCents(medianRatio * subjectMarketIndicator);
  const overAssessmentCents = subject.assessedValueCents - impliedFairAssessmentCents;
  const overAssessmentPct =
    impliedFairAssessmentCents === 0
      ? 0
      : (overAssessmentCents / impliedFairAssessmentCents) * 100;

  const compRatios: CompRatio[] = comps.map((property, i) => ({
    property,
    ratio: rawRatios[i] as number,
    dataAgeDays: ages[i] as number,
    supportsCase: (rawRatios[i] as number) < subjectRatio,
  }));

  return {
    argumentType,
    comps: compRatios,
    compCount: comps.length,
    medianRatio,
    cod: dispersion,
    medianDataAgeDays: median(ages),
    subjectMarketIndicator,
    subjectRatio,
    impliedFairAssessmentCents,
    overAssessmentCents,
    overAssessmentPct,
  };
}
