/**
 * Confidence scoring — spec §1.1 step 6: comp count, dispersion (COD), recency.
 *
 * Score is 0–100 from three documented components:
 *   comp count  0–40   3 comps = 15, +5 per extra comp, full marks at 8
 *   dispersion  0–40   COD ≤ 5% = 40, −2.5 points per COD point above 5, floor 0
 *                      (IAAO treats COD ≤ 15 as acceptable residential uniformity)
 *   recency     0–20   median evidence ≤ 180 days old = 20, tapering to 0 at the
 *                      county's comp window
 *
 * Levels: HIGH ≥ 70, MEDIUM ≥ 45, LOW below. Thresholds are also documented on
 * /methodology — change them in both places or not at all.
 */

import type { Confidence, ConfidenceLevel } from "./types";

export interface ConfidenceInput {
  compCount: number;
  /** Coefficient of dispersion of comp ratios, percent. */
  cod: number;
  /** Median age of the comps' evidence (sale or assessment), days. */
  medianDataAgeDays: number;
  /** The county's comp window, in months — recency is judged against it. */
  windowMonths: number;
}

export const CONFIDENCE_HIGH_MIN = 70;
export const CONFIDENCE_MEDIUM_MIN = 45;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function scoreConfidence(input: ConfidenceInput): Confidence {
  const { compCount, cod, medianDataAgeDays, windowMonths } = input;

  const compCountScore =
    compCount < 3 ? 0 : clamp(15 + (compCount - 3) * 5, 0, 40);

  const dispersionScore = clamp(40 - Math.max(0, cod - 5) * 2.5, 0, 40);

  const windowDays = Math.round(windowMonths * 30.44);
  let recencyScore: number;
  if (medianDataAgeDays <= 180) {
    recencyScore = 20;
  } else if (windowDays <= 180) {
    recencyScore = 0;
  } else {
    recencyScore = clamp(
      20 * (1 - (medianDataAgeDays - 180) / (windowDays - 180)),
      0,
      20,
    );
  }

  const score = Math.round(compCountScore + dispersionScore + recencyScore);
  const level: ConfidenceLevel =
    score >= CONFIDENCE_HIGH_MIN
      ? "HIGH"
      : score >= CONFIDENCE_MEDIUM_MIN
        ? "MEDIUM"
        : "LOW";

  const factors: string[] = [
    compCount < 3
      ? `Only ${compCount} usable comparable${compCount === 1 ? "" : "s"} — too few to trust a median.`
      : `${compCount} comparable homes${compCount >= 8 ? " — a solid sample" : compCount >= 5 ? " — a decent sample" : " — a thin sample"}.`,
    cod <= 15
      ? `Comparables agree with each other (dispersion ${cod.toFixed(1)}% — under the 15% uniformity benchmark).`
      : `Comparables disagree with each other (dispersion ${cod.toFixed(1)}% — above the 15% uniformity benchmark), which weakens any median.`,
    medianDataAgeDays <= 365
      ? `Evidence is recent (median ${Math.round(medianDataAgeDays / 30.44)} months old).`
      : `Evidence is aging (median ${Math.round(medianDataAgeDays / 30.44)} months old) — boards discount stale data.`,
  ];

  return { score, level, compCountScore, dispersionScore, recencyScore, factors };
}
