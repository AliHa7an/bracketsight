/**
 * Cost-sharing reductions — the second, smaller cliff at 250% FPL.
 *
 * Silver-plan-only. Bands (ACA §1402, 45 C.F.R. §156.420):
 *   100–150% FPL → 94% actuarial value
 *   151–200%     → 87% AV
 *   201–250%     → 73% AV
 *   >250%        → none (standard ~70% AV Silver)
 * One dollar over a band boundary drops the whole band — same shape as the
 * 400% cliff, smaller dollars, and worth its own ledge on the Cliff Meter.
 */

import type { RuleSet } from "./rules";
import type { CsrResult, PtcStatus } from "./types";

/**
 * The top of the cost-sharing ladder (250% FPL), read from the rules file so
 * the ledge on the Cliff Meter and the `distanceToCsrEdge` geometry never
 * hard-code it. Unlike the 400% ceiling this IS a truncation boundary: the
 * band is "not more than 250 percent" applied to the Form 8962 whole percent.
 */
export function csrTopPct(rules: RuleSet): number {
  const bands = rules.csrBands.bands;
  const last = bands[bands.length - 1];
  if (!last) throw new Error("csr-bands rules file has no bands");
  return last.toPct;
}

export function computeCsr(
  fplPctForm: number,
  ptcStatus: PtcStatus,
  rules: RuleSet,
): CsrResult {
  // CSR rides on PTC eligibility: no credit, no cost-sharing reduction.
  if (ptcStatus !== "ELIGIBLE") {
    return {
      band: null,
      actuarialValueBps: null,
      notes:
        ptcStatus === "CLIFF"
          ? ["Over 400% FPL there is no cost-sharing reduction either."]
          : [],
    };
  }

  for (const band of rules.csrBands.bands) {
    if (fplPctForm >= band.fromPct && fplPctForm <= band.toPct) {
      return {
        band: band.band,
        actuarialValueBps: band.actuarialValueBps,
        notes: [
          `Cost-sharing reductions apply only if you enroll in a Silver plan. At ${fplPctForm}% FPL your Silver plan covers about ${band.actuarialValueBps / 100}% of costs on average.`,
        ],
      };
    }
  }

  return {
    band: null,
    actuarialValueBps: null,
    notes: [
      "Above 250% FPL there is no cost-sharing reduction — a Silver plan covers about 70% of costs on average.",
    ],
  };
}
