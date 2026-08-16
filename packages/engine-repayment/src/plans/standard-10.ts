/**
 * Standard 10-year — fixed level payment over 120 months
 * (34 C.F.R. § 685.208). Term from rules/plan-terms.2026-07-01.json.
 */

import type { PlanResult } from "../types";
import { levelPayment } from "../money";
import { checkStandard10 } from "../eligibility";
import { ineligibleResult, runPlan, type SimContext } from "./shared";

export function simulateStandard10(ctx: SimContext): PlanResult {
  const check = checkStandard10();
  if (!check.eligible) return ineligibleResult("STANDARD_10", check.reasons);

  const months = ctx.rules.planTerms.standard10.termMonths;
  const payment = levelPayment(ctx.aggregate.balance, ctx.aggregate.weightedRateBps, months);

  return runPlan({
    ctx,
    planId: "STANDARD_10",
    paymentForMonth: () => payment,
    forgivenessAfterPayments: null,
    isPslfTrack: false,
  });
}
