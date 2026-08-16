/**
 * Qualified passenger-vehicle loan interest deduction — P.L. 119-21 § 70203.
 * ALL VALUES IN rules/car-loan.<year>.json ARE PLACEHOLDERS pending IRS
 * verification (see VERIFICATION-NEEDED.md).
 */

import { assertNonNegativeCents, minCents, subFloorZero } from "../money";
import { phaseOutStatus } from "../phase-out";
import type { CarLoanRules, Cents, DeductionResult, HouseholdInput } from "../types";

export function computeCarLoanDeduction(
  input: HouseholdInput,
  magiCents: Cents,
  rules: CarLoanRules,
): DeductionResult {
  const base: DeductionResult = {
    id: "CAR_LOAN",
    label: "Car-loan interest deduction",
    claimed: Boolean(input.carLoan),
    eligible: false,
    reasons: [],
    qualifiedAmountCents: 0,
    capCents: rules.capCents,
    cappedAmountCents: 0,
    phaseOut: null,
    deductionCents: 0,
    notes: [],
    citations: rules.citations,
  };

  const loan = input.carLoan;
  if (!loan) {
    base.reasons.push("No car-loan interest entered.");
    return base;
  }
  assertNonNegativeCents(loan.interestPaidCents, "carLoan.interestPaidCents");
  base.qualifiedAmountCents = loan.interestPaidCents;

  if (loan.interestPaidCents === 0) {
    base.reasons.push("Interest paid is $0.");
    return base;
  }
  if (rules.requiresNewVehicle && !loan.isNewVehicle) {
    base.reasons.push("Only loans on a new vehicle qualify — used-vehicle loans don't.");
  }
  if (rules.requiresFinalAssemblyInUS && !loan.finalAssemblyInUS) {
    base.reasons.push(
      "The vehicle's final assembly must be in the United States. Check the vehicle's window sticker or VIN decoder.",
    );
  }
  if (rules.requiresPersonalUse && !loan.personalUse) {
    base.reasons.push("Only personal-use vehicles qualify — business or fleet use doesn't.");
  }
  if (loan.loanOriginationDate < rules.loanOriginatedOnOrAfter) {
    base.reasons.push(
      `Only loans originated on or after ${rules.loanOriginatedOnOrAfter} qualify.`,
    );
  }
  if (base.reasons.length > 0) {
    return base;
  }

  base.eligible = true;
  base.cappedAmountCents = minCents(loan.interestPaidCents, rules.capCents);
  if (loan.interestPaidCents > rules.capCents) {
    base.notes.push("Interest above the annual cap doesn't qualify; the deduction is capped.");
  }
  base.notes.push("Lease payments don't qualify — the deduction is for loan interest only.");

  base.phaseOut = phaseOutStatus(
    magiCents,
    input.filingStatus,
    rules.phaseOut,
    base.cappedAmountCents,
  );
  base.deductionCents = subFloorZero(base.cappedAmountCents, base.phaseOut.reductionCents);
  if (base.phaseOut.reductionCents > 0 && base.deductionCents > 0) {
    base.reasons.push("Reduced by the MAGI phase-out.");
  }
  if (base.deductionCents === 0 && base.phaseOut.reductionCents > 0) {
    base.reasons.push("Fully phased out at your MAGI.");
  }
  return base;
}
