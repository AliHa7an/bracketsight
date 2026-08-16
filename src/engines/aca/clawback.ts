/**
 * Advance-credit reconciliation (Form 8962, Part III).
 *
 * If advance payments (APTC) exceed the final credit, the excess is repaid
 * with the tax return.
 *
 * FOR 2026 THERE IS NO REPAYMENT CAP AT ANY INCOME LEVEL. OBBBA
 * (Pub. L. 119-21) §71305 struck IRC §36B(f)(2)(B) — the repayment limitation
 * that used to cap the damage below 400% FPL — effective for taxable years
 * beginning after 31 December 2025. A household at 250% of the poverty line
 * repays every excess dollar, exactly as one at 405% does. Nobody should
 * discover that in April; it is why the clawback warning exists.
 *
 * Whether a limitation exists is DATA, not logic: rules/repayment-limits
 * carries `limitation.inEffect` and its bands, so a future year that reinstates
 * a cap is expressed by shipping a new dated ruleset, not by editing this file.
 */

import { assertCents } from "./money";
import type { RuleSet } from "./rules";
import type { ClawbackInput, ClawbackResult } from "./types";

export function reconcileAdvanceCredit(
  input: ClawbackInput,
  rules: RuleSet,
): ClawbackResult {
  const aptc = assertCents(input.aptcAnnual, "aptcAnnual");
  const finalPtc = assertCents(input.finalPtcAnnual, "finalPtcAnnual");
  const excess = aptc - finalPtc;

  if (excess <= 0) {
    return {
      excessAdvance: excess,
      repaymentDue: 0,
      additionalCredit: -excess,
      capApplied: null,
      uncapped: false,
      notes:
        excess < 0
          ? [
              "Your final credit exceeds the advance payments — the difference is refunded on your return as net premium tax credit.",
            ]
          : [],
    };
  }

  const limitation = rules.repaymentLimits.limitation;

  // The repeal case, and the one that applies for 2026: no limitation exists,
  // so the full excess is repaid regardless of household income.
  if (!limitation.inEffect) {
    return {
      excessAdvance: excess,
      repaymentDue: excess,
      additionalCredit: 0,
      capApplied: null,
      uncapped: true,
      notes: [
        "There is no cap on repaying excess advance credit for this coverage year at any income level: the repayment limitation of IRC §36B(f)(2)(B) was struck by Pub. L. 119-21 §71305 for tax years beginning after 2025. The entire excess advance credit is repaid with your return.",
      ],
    };
  }

  // A limitation is declared in effect — it must come with bands. Fail loudly
  // rather than fall through to an uncapped answer that would be right only by
  // coincidence.
  if (limitation.bands.length === 0) {
    throw new Error(
      "repayment-limits rules file declares limitation.inEffect but encodes no bands — refusing to guess a repayment cap.",
    );
  }

  const band = limitation.bands.find(
    (b) => input.fplPctForm >= b.fromPct && input.fplPctForm < b.toPct,
  );

  // No band covers this income: above the top band the limitation has never
  // applied, so the full excess is repaid.
  if (!band) {
    return {
      excessAdvance: excess,
      repaymentDue: excess,
      additionalCredit: 0,
      capApplied: null,
      uncapped: true,
      notes: [
        "Household income finished above every band of the repayment limitation, so the entire excess advance credit is repaid with your return.",
      ],
    };
  }

  const cap =
    input.filingStatus === "SINGLE" ? band.singleCents : band.otherCents;
  const repaymentDue = Math.min(excess, cap);

  return {
    excessAdvance: excess,
    repaymentDue,
    additionalCredit: 0,
    capApplied: cap,
    uncapped: false,
    notes:
      repaymentDue < excess
        ? [
            "The statutory repayment limitation capped what you owe — available only because household income stayed inside a limitation band.",
          ]
        : [],
  };
}
