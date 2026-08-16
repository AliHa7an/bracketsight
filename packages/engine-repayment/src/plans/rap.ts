/**
 * packages/engine/src/plans/rap.ts
 *
 * Repayment Assistance Plan (RAP) — the reference plan.
 * Authority: 34 C.F.R. § 685.209 as amended by the RISE final rule,
 * 91 Fed. Reg. 23768, effective 1 Jul 2026 (P.L. 119-21). Cross-checked
 * against CRS IF13075. All parameters come from rules/rap.2026-07-01.json.
 *
 * Payment formula (statutory AGI brackets):
 *   AGI ≤ $10,000            → annual base $120 ($10/month)
 *   $10,000 < AGI ≤ $20,000  → 1% of AGI
 *   each further $10,000     → +1 percentage point
 *   AGI > $100,000           → 10% of AGI (cap)
 *   monthly = max(annualBase/12 − $50 × dependents, $10)
 *
 * NOTE on the bracket function: the product spec's pseudocode uses
 * floor((AGI − 10,000)/10,000), which mis-buckets exact multiples of
 * $10,000 (it gives $60,000 → 6% ⇒ $300/mo, but the statute's bracket
 * table and the spec's own golden test give $60,000 → 5% ⇒ $250/mo).
 * We implement the statutory bracket boundaries with ceil(), which
 * reproduces all eight golden cases. Recorded in VERIFICATION-NEEDED.md.
 *
 * Mechanics modelled here (all eight from the spec):
 *  1. interest waiver (never capitalised; balance cannot grow)
 *  2. $50/month principal match (or the payment amount if under $50)
 *  3. NO payment cap at the 10-year Standard amount
 *  4. forgiveness at 360 payments (PSLF still 120)
 *  5. spousal income in if filing jointly (out if separately); payment
 *     prorated when the spouse also holds federal loans
 *  6. extra-payment backfire — surfaced as a warning (engine simulates
 *     required payments; extra amounts would hit interest first and can
 *     cancel the waiver and match)
 *  7. Parent PLUS taint — in eligibility.ts
 *  8. one-way door — prior IBR/PAYE/ICR qualifying payments do NOT count
 *     toward RAP's 360 (they do still count toward PSLF's 120)
 */

import type { Cents, PlanResult } from "../types";
import type { RapRules } from "../rules/index";
import { roundToCents } from "../money";
import { checkRap } from "../eligibility";
import {
  agiForYear,
  ineligibleResult,
  runPlan,
  spouseProrationFactor,
  type SimContext,
} from "./shared";

/** The statutory bracket percentage for an AGI (integer percent, 1–10). */
export function rapBracketPct(agi: Cents, rules: RapRules): number {
  const steps = Math.ceil((agi - rules.lowIncomeThresholdCents) / rules.bracketStepCents);
  return Math.min(rules.bracketMaxPct, Math.max(rules.bracketStartPct, steps * rules.bracketStartPct));
}

/**
 * RAP monthly payment for one year's AGI. Rounded once per figure:
 * annual base → cents, monthly base → cents, proration applied once.
 */
export function rapMonthlyPayment(
  agi: Cents,
  dependentsClaimed: number,
  rules: RapRules,
  prorationFactor = 1,
): Cents {
  let monthlyBase: Cents;
  if (agi <= rules.lowIncomeThresholdCents) {
    monthlyBase = roundToCents(rules.lowIncomeAnnualBaseCents / 12);
  } else {
    const pct = rapBracketPct(agi, rules);
    const annualBase = roundToCents((agi * pct) / 100);
    monthlyBase = roundToCents(annualBase / 12);
  }
  const afterDependents = monthlyBase - rules.dependentReductionCents * Math.max(0, dependentsClaimed);
  const prorated = roundToCents(afterDependents * prorationFactor);
  return Math.max(rules.minimumMonthlyPaymentCents, prorated);
}

export function simulateRap(ctx: SimContext): PlanResult {
  const check = checkRap(ctx.loans, ctx.rules);
  if (!check.eligible) return ineligibleResult("RAP", check.reasons);

  const rules = ctx.rules.rap;
  const proration = spouseProrationFactor(ctx);
  const deps = ctx.household.dependentsClaimed;

  // One-way door: prior IDR qualifying payments are FORFEITED for RAP's
  // 360-payment clock. They still count toward PSLF's 120.
  const prior = Math.max(0, Math.floor(ctx.strategy.priorQualifyingPayments));
  const target = ctx.pursuingPSLF
    ? Math.max(1, rules.pslfPayments - prior)
    : rules.forgivenessAfterPayments;

  return runPlan({
    ctx,
    planId: "RAP",
    paymentForMonth: (m) =>
      rapMonthlyPayment(agiForYear(ctx, Math.floor(m / 12)), deps, rules, proration),
    interestWaiver: rules.interestWaiver,
    principalMatchCents: rules.principalMatchCents,
    forgivenessAfterPayments: target,
    isPslfTrack: ctx.pursuingPSLF,
  });
}
