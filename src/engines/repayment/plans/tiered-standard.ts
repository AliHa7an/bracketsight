/**
 * Tiered Standard — the post-1 Jul 2026 standard plan. Fixed level
 * payment whose term scales with the balance at entry (10 years under
 * $25k up to 25 years at $100k+). Brackets from
 * rules/tiered-standard-terms.2026-07-01.json (P.L. 119-21; brackets
 * flagged for verification against StudentAid.gov). FFEL/Perkins/HEAL
 * cannot use this plan.
 */

import type { PlanResult } from "../types";
import type { Cents } from "../types";
import { levelPayment } from "../money";
import { checkTieredStandard } from "../eligibility";
import type { TieredStandardRules } from "../rules/index";
import { ineligibleResult, runPlan, type SimContext } from "./shared";

export function tieredTermMonths(balance: Cents, rules: TieredStandardRules): number {
  for (const tier of rules.tiers) {
    if (tier.maxBalanceCents === null || balance < tier.maxBalanceCents) {
      return tier.termMonths;
    }
  }
  const last = rules.tiers[rules.tiers.length - 1];
  if (!last) throw new Error("tiered-standard rules contain no tiers");
  return last.termMonths;
}

export function simulateTieredStandard(ctx: SimContext): PlanResult {
  const check = checkTieredStandard(ctx.loans, ctx.rules);
  if (!check.eligible) return ineligibleResult("TIERED_STANDARD", check.reasons);

  const months = tieredTermMonths(ctx.aggregate.balance, ctx.rules.tieredStandard);
  const payment = levelPayment(ctx.aggregate.balance, ctx.aggregate.weightedRateBps, months);

  return runPlan({
    ctx,
    planId: "TIERED_STANDARD",
    paymentForMonth: () => payment,
    forgivenessAfterPayments: null,
    isPslfTrack: false,
  });
}
