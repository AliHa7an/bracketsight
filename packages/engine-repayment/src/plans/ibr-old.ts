/**
 * Old IBR — 15% of discretionary income (AGI − 150% FPL), forgiveness at
 * 300 payments (25 years), payment capped at the 10-year Standard amount.
 * Parameters from rules/plan-terms.2026-07-01.json (34 C.F.R. § 685.209).
 */

import type { PlanResult } from "../types";
import { checkIbrOld } from "../eligibility";
import {
  agiForYear,
  forgivenessTarget,
  idrMonthlyPayment,
  ineligibleResult,
  runPlan,
  spouseProrationFactor,
  type SimContext,
} from "./shared";

export function simulateIbrOld(ctx: SimContext): PlanResult {
  const check = checkIbrOld(ctx.loans, ctx.rules);
  if (!check.eligible) return ineligibleResult("IBR_OLD", check.reasons);

  const terms = ctx.rules.planTerms.ibrOld;
  const proration = spouseProrationFactor(ctx);
  const target = forgivenessTarget(ctx, terms.forgivenessAfterPayments);

  return runPlan({
    ctx,
    planId: "IBR_OLD",
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
