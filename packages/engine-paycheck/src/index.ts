/**
 * ClearPaycheck engine — public API.
 *
 * `computeDeductions(input)` runs all four OBBBA deductions against one
 * household MAGI, converts the combined deduction into estimated federal tax
 * saved via the bracket table, and reports the marginal effect of the next
 * $1,000 of income (the phase-out interaction no single-deduction calculator
 * models).
 *
 * PURITY: zero dependencies, zero AI, zero network, fully deterministic.
 */

import { computeMagiCents } from "./magi";
import { EngineInputError } from "./money";
import { computeCarLoanDeduction } from "./deductions/car-loan";
import { computeOvertimeDeduction } from "./deductions/overtime";
import { computeSeniorDeduction } from "./deductions/senior";
import { computeTipsDeduction } from "./deductions/tips";
import { thresholdFor } from "./phase-out";
import { taxSavings } from "./tax";
import { resolveRules, ruleSetVersion, unverifiedRuleSets } from "./rules/index";
import type {
  Cents,
  DeductionResult,
  EngineResult,
  HouseholdInput,
  RuleSet,
} from "./types";

export const ENGINE_VERSION = "0.1.0";

const FICA_NOTE =
  "These deductions reduce federal income tax only. Tips and overtime are still subject to Social Security and Medicare (FICA) tax, and may be taxed by your state. “No tax on tips” does not mean tax-free tips.";

const ASSUMPTIONS = [
  "MAGI is approximated as wages + tips + gross overtime pay + other income; the OBBBA deductions do not reduce MAGI themselves.",
  "Federal tax saved is computed against the standard deduction and the ordinary bracket table; credits, itemized deductions, and the pre-existing 65+ extra standard deduction are not modeled in v1.",
  "Self-employed tip earners: the deduction is limited to net income from the tipped business; the engine assumes entered tips respect that limit.",
];

function validateInput(input: HouseholdInput): void {
  if (!Number.isFinite(input.age) || input.age < 0 || input.age > 130) {
    throw new EngineInputError(`age must be between 0 and 130; received ${String(input.age)}`);
  }
  if (
    input.spouseAge !== undefined &&
    (!Number.isFinite(input.spouseAge) || input.spouseAge < 0 || input.spouseAge > 130)
  ) {
    throw new EngineInputError(
      `spouseAge must be between 0 and 130; received ${String(input.spouseAge)}`,
    );
  }
}

interface CoreResult {
  magiCents: Cents;
  deductions: DeductionResult[];
  totalDeductionCents: Cents;
  taxAfterCents: Cents;
}

function computeCore(input: HouseholdInput, rules: RuleSet): CoreResult {
  const magiCents = computeMagiCents(input, rules.overtime);
  const deductions: DeductionResult[] = [
    computeTipsDeduction(input, magiCents, rules.tips, rules.occupations),
    computeOvertimeDeduction(input, magiCents, rules.overtime),
    computeSeniorDeduction(input, magiCents, rules.senior),
    computeCarLoanDeduction(input, magiCents, rules.carLoan),
  ];
  const totalDeductionCents = deductions.reduce((sum, d) => sum + d.deductionCents, 0);
  const savings = taxSavings(magiCents, totalDeductionCents, input.filingStatus, rules.brackets);
  return { magiCents, deductions, totalDeductionCents, taxAfterCents: savings.taxAfterCents };
}

export function computeDeductions(input: HouseholdInput): EngineResult {
  validateInput(input);
  const rules = resolveRules(input.taxYear);

  const core = computeCore(input, rules);
  const savings = taxSavings(
    core.magiCents,
    core.totalDeductionCents,
    input.filingStatus,
    rules.brackets,
  );

  // Marginal effect of the next $1,000 of income: rerun with +$1,000 of
  // other income and diff the after-deduction federal tax.
  const bumped = computeCore(
    { ...input, otherIncomeCents: input.otherIncomeCents + 100_000 },
    rules,
  );
  const deductionsLostCents = core.totalDeductionCents - bumped.totalDeductionCents;
  const extraFederalTaxCents = bumped.taxAfterCents - core.taxAfterCents;

  const primaryThreshold = thresholdFor(rules.tips.phaseOut, input.filingStatus);

  return {
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    magiCents: core.magiCents,
    deductions: core.deductions,
    totalDeductionCents: core.totalDeductionCents,
    tax: {
      standardDeductionCents: savings.standardDeductionCents,
      taxableBeforeCents: savings.taxableBeforeCents,
      taxableAfterCents: savings.taxableAfterCents,
      taxBeforeCents: savings.taxBeforeCents,
      taxAfterCents: savings.taxAfterCents,
      estimatedTaxSavedCents: savings.estimatedTaxSavedCents,
      marginalRateBps: savings.marginalRateBps,
    },
    marginalNext1000: {
      deductionsLostCents,
      extraFederalTaxCents,
      effectiveMarginalRateBps: Math.round((extraFederalTaxCents / 100_000) * 10_000),
    },
    primaryPhaseOut: {
      thresholdCents: primaryThreshold,
      magiCents: core.magiCents,
      distanceToThresholdCents: primaryThreshold - core.magiCents,
    },
    ficaNote: FICA_NOTE,
    meta: {
      engineVersion: ENGINE_VERSION,
      ruleSetVersion: ruleSetVersion(rules),
      computedAt: new Date().toISOString(),
      unverifiedRuleSets: unverifiedRuleSets(rules),
      assumptions: ASSUMPTIONS,
    },
  };
}

// ---------------------------------------------------------------------------
// Re-exports: everything the app or tests may need, from one entry point.
// ---------------------------------------------------------------------------

export * from "./types";
export {
  EngineInputError,
  assertCents,
  assertNonNegativeCents,
  roundHalfUpToCent,
  mulBps,
  divideCents,
  dollars,
  subFloorZero,
  minCents,
} from "./money";
export { phaseOutReduction, phaseOutStatus, fullyPhasedOutAt, thresholdFor } from "./phase-out";
export { computeMagiCents, grossOvertimePayCents } from "./magi";
export { taxOn, marginalRateBps, taxSavings } from "./tax";
export { overtimePremiumCents, overtimeCapCents } from "./deductions/overtime";
export { computeTipsDeduction } from "./deductions/tips";
export { computeOvertimeDeduction } from "./deductions/overtime";
export { computeSeniorDeduction } from "./deductions/senior";
export { computeCarLoanDeduction } from "./deductions/car-loan";
export { searchOccupations, findOccupationByCode } from "./occupations";
export type { OccupationMatch } from "./occupations";
export {
  resolveRules,
  ruleSetVersion,
  unverifiedRuleSets,
  SUPPORTED_TAX_YEARS,
} from "./rules/index";
