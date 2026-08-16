/**
 * packages/engine/src/index.ts
 *
 * Public API: simulateAllPlans(loans, household, strategy, asOf?).
 * Pure, deterministic, dependency-free. No AI, no network, no React —
 * see CLAUDE.md invariant 1 (CI-enforced).
 */

import type {
  Cents,
  Household,
  Loan,
  PlanId,
  PlanResult,
  SimulationResult,
  Strategy,
} from "./types";
import { ALL_PLAN_IDS } from "./types";
import { assertCents, levelPayment, roundToCents } from "./money";
import { isoToYm, addMonths } from "./amortise";
import { resolveRules } from "./rules/index";
import { deriveWarnings } from "./warnings";
import type { SimContext } from "./plans/shared";
import { simulateRap } from "./plans/rap";
import { simulateIbrOld } from "./plans/ibr-old";
import { simulateIbrNew } from "./plans/ibr-new";
import { simulatePaye } from "./plans/paye";
import { simulateIcr } from "./plans/icr";
import { simulateStandard10 } from "./plans/standard-10";
import { simulateTieredStandard } from "./plans/tiered-standard";
import { simulateGraduated } from "./plans/graduated";
import { simulateExtended } from "./plans/extended";

export const ENGINE_VERSION = "1.0.0";

export * from "./types";
export { roundToCents, monthlyInterest, levelPayment, percentOf, sumCents } from "./money";
export { rapMonthlyPayment, rapBracketPct } from "./plans/rap";
export { tieredTermMonths } from "./plans/tiered-standard";
export { idrMonthlyPayment, fplCents, householdAgi } from "./plans/shared";
export { resolveRules, listRuleCitations } from "./rules/index";
export type { ResolvedRules, RapRules, TaxRules } from "./rules/index";
export {
  checkPlan,
  hasParentPlusExposure,
  hasLegacyLoans,
  anyLoanOnOrAfter,
} from "./eligibility";
export { estimateTaxOnForgiveness } from "./tax";
export { PLAN_NAMES } from "./plan-names";

const SIMULATORS: Record<PlanId, (ctx: SimContext) => PlanResult> = {
  RAP: simulateRap,
  IBR_OLD: simulateIbrOld,
  IBR_NEW: simulateIbrNew,
  PAYE: simulatePaye,
  ICR: simulateIcr,
  STANDARD_10: simulateStandard10,
  TIERED_STANDARD: simulateTieredStandard,
  GRADUATED: simulateGraduated,
  EXTENDED: simulateExtended,
};

function validateInputs(loans: Loan[], household: Household, strategy: Strategy): void {
  if (loans.length === 0) {
    throw new Error("At least one loan is required to run a simulation.");
  }
  for (const loan of loans) {
    assertCents(loan.balance, `loan ${loan.id} balance`);
    if (loan.balance <= 0) throw new Error(`loan ${loan.id} balance must be positive cents`);
    if (!Number.isInteger(loan.annualRateBps) || loan.annualRateBps < 0 || loan.annualRateBps > 3000) {
      throw new Error(`loan ${loan.id} annualRateBps must be integer basis points in [0, 3000]`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(loan.firstDisbursement)) {
      throw new Error(`loan ${loan.id} firstDisbursement must be an ISO date (yyyy-mm-dd)`);
    }
  }
  assertCents(household.agi, "household.agi");
  if (household.agi < 0) throw new Error("household.agi cannot be negative");
  if (household.spouseAgi !== undefined) assertCents(household.spouseAgi, "household.spouseAgi");
  if (household.spouseFederalLoanBalance !== undefined) {
    assertCents(household.spouseFederalLoanBalance, "household.spouseFederalLoanBalance");
  }
  if (!Number.isInteger(household.familySize) || household.familySize < 1) {
    throw new Error("household.familySize must be an integer ≥ 1");
  }
  if (!Number.isInteger(household.dependentsClaimed) || household.dependentsClaimed < 0) {
    throw new Error("household.dependentsClaimed must be an integer ≥ 0");
  }
  if (strategy.priorQualifyingPayments < 0) {
    throw new Error("strategy.priorQualifyingPayments cannot be negative");
  }
}

/** Aggregate the loan mix: total balance + balance-weighted rate (bps). */
export function aggregateLoans(loans: Loan[]): { balance: Cents; weightedRateBps: number } {
  const balance = loans.reduce((sum, l) => sum + l.balance, 0);
  if (balance <= 0) return { balance: 0, weightedRateBps: 0 };
  const weighted = loans.reduce((sum, l) => sum + l.balance * l.annualRateBps, 0);
  return { balance, weightedRateBps: roundToCents(weighted / balance) };
}

export function simulateAllPlans(
  loans: Loan[],
  household: Household,
  strategy: Strategy,
  asOf?: Date,
): SimulationResult {
  validateInputs(loans, household, strategy);

  const asOfDate = asOf ?? new Date();
  const asOfIso = asOfDate.toISOString().slice(0, 10);
  const rules = resolveRules(asOfIso);
  const aggregate = aggregateLoans(loans);

  const ctx: SimContext = {
    loans,
    household,
    strategy,
    rules,
    start: addMonths(isoToYm(`${asOfIso.slice(0, 7)}-01`), 1),
    asOfIso,
    aggregate,
    pursuingPSLF: strategy.pursuingPSLF === true,
    standardCapMonthly: levelPayment(
      aggregate.balance,
      aggregate.weightedRateBps,
      rules.planTerms.standard10.termMonths,
    ),
  };

  const results = new Map<PlanId, PlanResult>();
  for (const planId of ALL_PLAN_IDS) {
    const simulate = SIMULATORS[planId];
    results.set(planId, simulate(ctx));
  }

  const { global, perPlan } = deriveWarnings(loans, household, strategy, rules, results);
  const plans = ALL_PLAN_IDS.map((planId) => {
    const result = results.get(planId);
    if (!result) throw new Error(`missing result for ${planId}`);
    return { ...result, warnings: perPlan[planId] ?? [] };
  });

  const eligible = plans.filter((p) => p.eligible);
  if (eligible.length === 0) {
    throw new Error(
      "No plan is available for this loan mix. Check the loan types entered — every mix should at least have a Standard schedule.",
    );
  }

  const lowestTotalCost = eligible.reduce((a, b) =>
    b.totalLifetimeCost < a.totalLifetimeCost ? b : a,
  );
  const lowestMonthlyPayment = eligible.reduce((a, b) =>
    b.firstMonthlyPayment < a.firstMonthlyPayment ||
    (b.firstMonthlyPayment === a.firstMonthlyPayment && b.totalLifetimeCost < a.totalLifetimeCost)
      ? b
      : a,
  );

  return {
    plans,
    recommendation: {
      lowestTotalCost: lowestTotalCost.planId,
      lowestMonthlyPayment: lowestMonthlyPayment.planId,
      theyDisagree: lowestTotalCost.planId !== lowestMonthlyPayment.planId,
    },
    globalWarnings: global,
    meta: {
      engineVersion: ENGINE_VERSION,
      ruleSetVersion: rules.ruleSetVersion,
      computedAt: new Date().toISOString(),
      asOfDate: asOfIso,
    },
  };
}
