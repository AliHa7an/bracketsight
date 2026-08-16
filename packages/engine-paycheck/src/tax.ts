/**
 * Federal income tax bracket math. Brackets and standard deductions come from
 * rules/brackets.<year>.json — never hard-coded.
 *
 * Used ONLY to translate "deduction amount" into "estimated federal tax
 * saved". The engine never presents a deduction amount alone (spec §1.2).
 */

import { EngineInputError, assertNonNegativeCents, mulBps, subFloorZero } from "./money";
import type { BracketRules, Bps, Cents, FilingStatus, TaxBracket } from "./types";

function bracketsFor(rules: BracketRules, filingStatus: FilingStatus): TaxBracket[] {
  const brackets = rules.brackets[filingStatus];
  if (!brackets || brackets.length === 0) {
    throw new EngineInputError(`no brackets for filing status ${filingStatus}`);
  }
  return brackets;
}

/** Progressive tax on `taxableCents`, rounded half-up per bracket slice. */
export function taxOn(
  taxableCents: Cents,
  filingStatus: FilingStatus,
  rules: BracketRules,
): Cents {
  assertNonNegativeCents(taxableCents, "taxOn.taxableCents");
  let tax = 0;
  let lower = 0;
  for (const bracket of bracketsFor(rules, filingStatus)) {
    const upper = bracket.upToCents ?? Number.MAX_SAFE_INTEGER;
    if (taxableCents <= lower) break;
    const sliceUpper = taxableCents < upper ? taxableCents : upper;
    tax += mulBps(sliceUpper - lower, bracket.rateBps);
    lower = upper;
  }
  return tax;
}

/** Statutory marginal rate at this taxable income. */
export function marginalRateBps(
  taxableCents: Cents,
  filingStatus: FilingStatus,
  rules: BracketRules,
): Bps {
  assertNonNegativeCents(taxableCents, "marginalRateBps.taxableCents");
  let lower = 0;
  const brackets = bracketsFor(rules, filingStatus);
  for (const bracket of brackets) {
    const upper = bracket.upToCents ?? Number.MAX_SAFE_INTEGER;
    if (taxableCents <= upper) return bracket.rateBps;
    lower = upper;
  }
  const last = brackets[brackets.length - 1];
  return last ? last.rateBps : 0;
}

export interface TaxSavings {
  standardDeductionCents: Cents;
  taxableBeforeCents: Cents;
  taxableAfterCents: Cents;
  taxBeforeCents: Cents;
  taxAfterCents: Cents;
  estimatedTaxSavedCents: Cents;
  marginalRateBps: Bps;
}

/**
 * Exact bracket-table savings from applying `deductionCents` on top of the
 * standard deduction. This is deliberately exact (not marginal-rate ×
 * deduction) so savings that straddle a bracket boundary come out right.
 */
export function taxSavings(
  magiCents: Cents,
  deductionCents: Cents,
  filingStatus: FilingStatus,
  rules: BracketRules,
): TaxSavings {
  assertNonNegativeCents(magiCents, "taxSavings.magiCents");
  assertNonNegativeCents(deductionCents, "taxSavings.deductionCents");
  const standardDeduction = rules.standardDeductionCents[filingStatus];
  const taxableBefore = subFloorZero(magiCents, standardDeduction);
  const taxableAfter = subFloorZero(taxableBefore, deductionCents);
  const taxBefore = taxOn(taxableBefore, filingStatus, rules);
  const taxAfter = taxOn(taxableAfter, filingStatus, rules);
  return {
    standardDeductionCents: standardDeduction,
    taxableBeforeCents: taxableBefore,
    taxableAfterCents: taxableAfter,
    taxBeforeCents: taxBefore,
    taxAfterCents: taxAfter,
    estimatedTaxSavedCents: taxBefore - taxAfter,
    marginalRateBps: marginalRateBps(taxableBefore, filingStatus, rules),
  };
}
