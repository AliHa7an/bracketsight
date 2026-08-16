/**
 * Qualified tips deduction — P.L. 119-21 § 70201 (IRC § 224).
 * Parameters from rules/tips.<year>.json.
 */

import { assertNonNegativeCents, minCents, subFloorZero } from "../money";
import { phaseOutStatus } from "../phase-out";
import { findOccupationByCode } from "../occupations";
import type {
  Cents,
  DeductionResult,
  HouseholdInput,
  OccupationRules,
  TipsRules,
} from "../types";

export function computeTipsDeduction(
  input: HouseholdInput,
  magiCents: Cents,
  rules: TipsRules,
  occupationRules: OccupationRules,
): DeductionResult {
  const base: DeductionResult = {
    id: "TIPS",
    label: "Qualified tips deduction",
    claimed: Boolean(input.tips),
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

  const tips = input.tips;
  if (!tips) {
    base.reasons.push("No tips entered.");
    return base;
  }
  assertNonNegativeCents(tips.amountCents, "tips.amountCents");
  base.qualifiedAmountCents = tips.amountCents;

  if (tips.amountCents === 0) {
    base.reasons.push("Tip amount is $0.");
    return base;
  }

  if (rules.requireJointIfMarried && input.filingStatus === "MARRIED_SEPARATE") {
    base.reasons.push(
      "Married filing separately can't claim the tips deduction — the law requires a joint return for married filers.",
    );
    return base;
  }

  if (!tips.occupationCode) {
    base.reasons.push(
      "Select your occupation — only occupations on the IRS qualified-tipped-occupation list count.",
    );
    return base;
  }

  const occupation = findOccupationByCode(tips.occupationCode, occupationRules);
  if (!occupation || !occupation.qualified) {
    base.reasons.push(
      `Occupation code ${tips.occupationCode} is not on the IRS qualified tipped occupation list, so these tips don't qualify.`,
    );
    return base;
  }

  if (!tips.properlyReported) {
    base.reasons.push(
      "Tips must be properly reported (W-2 Box 7, Form 4070, Form 4137, or a 1099/Schedule C for self-employment) to qualify.",
    );
    return base;
  }

  base.eligible = true;
  base.cappedAmountCents = minCents(tips.amountCents, rules.capCents);
  if (tips.amountCents > rules.capCents) {
    base.notes.push("Tips above the annual cap don't qualify; the deduction is capped.");
  }
  if (tips.selfEmployed) {
    base.notes.push(
      "Self-employed: the deduction can't exceed your net income from the business the tips came from. This engine assumes your entered tips are within that limit.",
    );
  }
  base.notes.push(
    `Matched occupation: ${occupation.code} — ${occupation.title} (qualified).`,
  );
  base.notes.push(
    "This reduces federal income tax only. Tips are still subject to Social Security and Medicare (FICA) tax, and possibly state income tax.",
  );

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
