/**
 * Rules resolver — returns the versioned, cited rule set for a tax year.
 * JSON imports are relative and bundled; zero network, zero dependencies.
 */

import type {
  BracketRules,
  CarLoanRules,
  OccupationRules,
  OvertimeRules,
  RuleSet,
  SeniorRules,
  TipsRules,
} from "../types";

import tips2026 from "./tips.2026.json";
import overtime2026 from "./overtime.2026.json";
import senior2026 from "./senior.2026.json";
import carLoan2026 from "./car-loan.2026.json";
import brackets2026 from "./brackets.2026.json";
import occupations2026 from "./occupations.2026.json";

const RULE_SETS: Record<number, RuleSet> = {
  2026: {
    tips: tips2026 as TipsRules,
    overtime: overtime2026 as OvertimeRules,
    senior: senior2026 as SeniorRules,
    carLoan: carLoan2026 as CarLoanRules,
    brackets: brackets2026 as BracketRules,
    occupations: occupations2026 as OccupationRules,
  },
};

export const SUPPORTED_TAX_YEARS: number[] = Object.keys(RULE_SETS)
  .map(Number)
  .sort();

export function resolveRules(taxYear: number): RuleSet {
  const rules = RULE_SETS[taxYear];
  if (!rules) {
    throw new Error(
      `No rule set for tax year ${String(taxYear)}. Supported: ${SUPPORTED_TAX_YEARS.join(", ")}`,
    );
  }
  return rules;
}

/** ruleSetVersions in this bundle that still carry verified=false. */
export function unverifiedRuleSets(rules: RuleSet): string[] {
  return [rules.tips, rules.overtime, rules.senior, rules.carLoan, rules.brackets, rules.occupations]
    .filter((r) => !r.verified)
    .map((r) => r.ruleSetVersion);
}

/** Combined ruleset identifier for result metadata. */
export function ruleSetVersion(rules: RuleSet): string {
  return [
    rules.tips.ruleSetVersion,
    rules.overtime.ruleSetVersion,
    rules.senior.ruleSetVersion,
    rules.carLoan.ruleSetVersion,
    rules.brackets.ruleSetVersion,
    rules.occupations.ruleSetVersion,
  ].join("+");
}
