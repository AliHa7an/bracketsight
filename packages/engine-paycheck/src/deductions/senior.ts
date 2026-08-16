/**
 * Additional senior deduction (65+) — P.L. 119-21 § 70103, IRC § 151(d)(5)(C).
 * Parameters from rules/senior.<year>.json.
 *
 * ORDER OF OPERATIONS (Schedule 1-A, Part V, lines 33–37):
 *   line 34 = 6% of MAGI over the threshold
 *   line 35 = $6,000 − line 34        ← the reduction hits the PER-PERSON amount
 *   lines 36a/36b each enter line 35  ← once per qualifying spouse
 *   line 37 = 36a + 36b
 * So a two-senior joint return loses 2 × 6% of the excess, not 6%. Applying
 * the reduction once against the doubled $12,000 overstates the deduction —
 * at $200,000 joint MAGI it returns $9,000 where the form returns $6,000.
 */

import { subFloorZero } from "../money";
import { phaseOutStatus } from "../phase-out";
import type { Cents, DeductionResult, HouseholdInput, SeniorRules } from "../types";

export function computeSeniorDeduction(
  input: HouseholdInput,
  magiCents: Cents,
  rules: SeniorRules,
): DeductionResult {
  const selfQualifies = input.age >= rules.qualifyingAge;
  const spouseQualifies =
    input.filingStatus === "MARRIED_JOINT" &&
    input.spouseAge !== undefined &&
    input.spouseAge >= rules.qualifyingAge;
  const qualifyingPersons = (selfQualifies ? 1 : 0) + (spouseQualifies ? 1 : 0);
  const perPersonAmount: Cents = rules.amountPerQualifyingPersonCents;
  const amount: Cents = qualifyingPersons * perPersonAmount;

  const base: DeductionResult = {
    id: "SENIOR",
    label: "Senior deduction (65+)",
    claimed: qualifyingPersons > 0,
    eligible: false,
    reasons: [],
    qualifiedAmountCents: amount,
    capCents: amount,
    cappedAmountCents: amount,
    phaseOut: null,
    deductionCents: 0,
    notes: [],
    citations: rules.citations,
  };

  if (qualifyingPersons === 0) {
    base.reasons.push(
      `Available at age ${String(rules.qualifyingAge)} or older (each spouse 65+ adds another deduction on a joint return).`,
    );
    return base;
  }

  // IRC § 151(d)(5)(C)(v): a married taxpayer claims this only on a joint return.
  if (rules.requireJointIfMarried && input.filingStatus === "MARRIED_SEPARATE") {
    base.reasons.push(
      "Married filing separately can't claim the senior deduction — the law requires a joint return for married filers.",
    );
    return base;
  }

  base.eligible = true;
  base.notes.push(
    qualifyingPersons === 2
      ? "Both spouses are 65 or older — two senior deductions on your joint return."
      : "One qualifying person aged 65 or older.",
  );
  base.notes.push(
    "This is in addition to the regular standard deduction and the pre-existing extra standard deduction for 65+.",
  );

  // Phase out the PER-PERSON $6,000 first (Schedule 1-A line 35), then sum
  // across qualifying persons (lines 36a/36b → 37). Passing the per-person
  // amount also makes `fullyPhasedOutAtCents` right: each person's share is
  // gone at the same MAGI regardless of how many spouses qualify.
  const perPerson = phaseOutStatus(
    magiCents,
    input.filingStatus,
    rules.phaseOut,
    perPersonAmount,
  );
  const perPersonAfterPhaseOut = subFloorZero(perPersonAmount, perPerson.reductionCents);
  base.phaseOut = {
    ...perPerson,
    // Reported as the household total so that cappedAmount − reduction = deduction.
    reductionCents: qualifyingPersons * perPerson.reductionCents,
  };
  base.deductionCents = qualifyingPersons * perPersonAfterPhaseOut;
  if (base.phaseOut.reductionCents > 0 && base.deductionCents > 0) {
    base.reasons.push("Reduced by the MAGI phase-out.");
  }
  if (base.deductionCents === 0 && base.phaseOut.reductionCents > 0) {
    base.reasons.push("Fully phased out at your MAGI.");
  }
  return base;
}
