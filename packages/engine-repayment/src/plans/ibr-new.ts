/**
 * New IBR — 10% of discretionary income (AGI − 150% FPL), forgiveness at
 * 240 payments (20 years), capped at the 10-year Standard amount.
 * Requires the borrower's first federal loan on/after 1 Jul 2014.
 * Post-OBBBA the partial-financial-hardship requirement is removed.
 * Parameters from rules/plan-terms.2026-07-01.json.
 */

import type { PlanResult } from "../types";
import { checkIbrNew } from "../eligibility";
import {
  agiForYear,
  forgivenessTarget,
  idrMonthlyPayment,
  ineligibleResult,
  runPlan,
  spouseProrationFactor,
  type SimContext,
} from "./shared";

export function simulateIbrNew(ctx: SimContext): PlanResult {
  const check = checkIbrNew(ctx.loans, ctx.rules);
  if (!check.eligible) return ineligibleResult("IBR_NEW", check.reasons);

  const terms = ctx.rules.planTerms.ibrNew;
  const proration = spouseProrationFactor(ctx);
  const target = forgivenessTarget(ctx, terms.forgivenessAfterPayments);

  return runPlan({
    ctx,
    planId: "IBR_NEW",
    paymentForMonth: (m) => {
      const idr = idrMonthlyPayment(
        agiForYear(ctx, Math.floor(m / 12)),
        ctx.household,
        ctx.rules.poverty,
        terms.povertyMultiplierPct,
        terms.discretionaryPct,
        proration,
      );
      return terms.paymentCappedAtStandard ? Math.min(idr, ctx.standardCapMonthly) : idr;
    },
    forgivenessAfterPayments: target.payments,
    isPslfTrack: target.isPslfTrack,
  });
}
