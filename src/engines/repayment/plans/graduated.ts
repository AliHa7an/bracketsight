/**
 * Graduated — 10-year term, payments step up every 24 months. Modelled
 * per 34 C.F.R. § 685.208: no payment below interest-only, final payment
 * no more than 3× the first. The engine solves for the lowest starting
 * payment (integer-cent binary search over the real schedule arithmetic)
 * whose stepped schedule retires the loan within the term. The step
 * ratio (final = 3 × first, geometric steps) is a documented modelling
 * choice — servicers vary; see VERIFICATION-NEEDED.md.
 */

import type { Cents, PlanResult } from "../types";
import { levelPayment, monthlyInterest, roundToCents } from "../money";
import { checkGraduated } from "../eligibility";
import { ineligibleResult, runPlan, type SimContext } from "./shared";

interface GraduatedTerms {
  termMonths: number;
  stepMonths: number;
  maxFinalToFirstRatio: number;
}

export function graduatedTierPayments(firstPayment: Cents, terms: GraduatedTerms): Cents[] {
  const tiers = Math.ceil(terms.termMonths / terms.stepMonths);
  const g = Math.pow(terms.maxFinalToFirstRatio, 1 / Math.max(1, tiers - 1));
  const payments: Cents[] = [];
  for (let t = 0; t < tiers; t++) {
    payments.push(roundToCents(firstPayment * Math.pow(g, t)));
  }
  return payments;
}

/** True if a schedule starting at `firstPayment` retires the loan in term. */
function paysOff(
  firstPayment: Cents,
  balance: Cents,
  rateBps: number,
  terms: GraduatedTerms,
): boolean {
  const tiers = graduatedTierPayments(firstPayment, terms);
  let principal = balance;
  let unpaid = 0;
  for (let m = 0; m < terms.termMonths; m++) {
    const interest = monthlyInterest(principal, rateBps);
    const payment = Math.min(tiers[Math.floor(m / terms.stepMonths)] ?? 0, principal + unpaid + interest);
    const towardUnpaid = Math.min(payment, unpaid);
    unpaid -= towardUnpaid;
    const towardCurrent = Math.min(payment - towardUnpaid, interest);
    unpaid += interest - towardCurrent;
    principal -= payment - towardUnpaid - towardCurrent;
    if (principal + unpaid <= 0) return true;
  }
  return false;
}

/** Lowest integer-cent first payment that retires the loan within term. */
export function solveGraduatedFirstPayment(
  balance: Cents,
  rateBps: number,
  terms: GraduatedTerms,
): Cents {
  const interestOnly = monthlyInterest(balance, rateBps);
  let lo = 1;
  let hi = levelPayment(balance, rateBps, terms.termMonths);
  // The level payment always pays off; it is a valid upper bound.
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (paysOff(mid, balance, rateBps, terms)) hi = mid;
    else lo = mid + 1;
  }
  // Regulation floor: the payment must at least cover accruing interest.
  return Math.max(lo, interestOnly);
}

export function simulateGraduated(ctx: SimContext): PlanResult {
  const check = checkGraduated(ctx.loans, ctx.rules);
  if (!check.eligible) return ineligibleResult("GRADUATED", check.reasons);

  const terms = ctx.rules.planTerms.graduated;
  const first = solveGraduatedFirstPayment(
    ctx.aggregate.balance,
    ctx.aggregate.weightedRateBps,
    terms,
  );
  const tiers = graduatedTierPayments(first, terms);

  return runPlan({
    ctx,
    planId: "GRADUATED",
    paymentForMonth: (m) => tiers[Math.floor(m / terms.stepMonths)] ?? tiers[tiers.length - 1] ?? first,
    forgivenessAfterPayments: null,
    isPslfTrack: false,
  });
}
