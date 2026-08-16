/**
 * Extended — fixed level payment over 25 years (300 months). Requires
 * more than $30,000 in eligible loans (34 C.F.R. § 685.208); not
 * available for loans first disbursed on/after 1 Jul 2026.
 * Terms from rules/plan-terms.2026-07-01.json.
 */

import type { PlanResult } from "../types";
import { levelPayment } from "../money";
import { checkExtended } from "../eligibility";
import { ineligibleResult, runPlan, type SimContext } from "./shared";

export function simulateExtended(ctx: SimContext): PlanResult {
  const check = checkExtended(ctx.loans, ctx.rules, ctx.aggregate.balance);
  if (!check.eligible) return ineligibleResult("EXTENDED", check.reasons);

  const months = ctx.rules.planTerms.extended.termMonths;
  const payment = levelPayment(ctx.aggregate.balance, ctx.aggregate.weightedRateBps, months);

  return runPlan({
    ctx,
    planId: "EXTENDED",
    paymentForMonth: () => payment,
    forgivenessAfterPayments: null,
    isPslfTrack: false,
  });
}
