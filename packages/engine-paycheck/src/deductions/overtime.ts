/**
 * Qualified overtime deduction — P.L. 119-21 § 70202 (IRC § 225).
 *
 * ONLY the FLSA § 7 overtime *premium* qualifies: the 0.5× in time-and-a-half,
 * not the whole 1.5×. This is the #1 user error the engine exists to prevent:
 *   premium = overtimeHours × regularRate × 0.5
 * or, from total time-and-a-half pay: premium = totalOvertimePay / 3.
 */

import {
  EngineInputError,
  assertNonNegativeCents,
  divideCents,
  minCents,
  mulBps,
  roundHalfUpToCent,
  subFloorZero,
} from "../money";
import { phaseOutStatus } from "../phase-out";
import type { Cents, DeductionResult, HouseholdInput, OvertimeRules } from "../types";

/** The deductible FLSA premium implied by the overtime input. */
export function overtimePremiumCents(
  input: HouseholdInput,
  rules: OvertimeRules,
): Cents {
  const ot = input.overtime;
  if (!ot) return 0;
  if (ot.mode === "HOURS_RATE") {
    assertNonNegativeCents(ot.regularHourlyRateCents, "overtime.regularHourlyRateCents");
    if (!Number.isFinite(ot.overtimeHours) || ot.overtimeHours < 0) {
      throw new EngineInputError(
        `overtime.overtimeHours must be >= 0; received ${String(ot.overtimeHours)}`,
      );
    }
    const straightPay = roundHalfUpToCent(ot.overtimeHours * ot.regularHourlyRateCents);
    return mulBps(straightPay, rules.premiumShareOfRegularRateBps);
  }
  assertNonNegativeCents(ot.totalOvertimePayCents, "overtime.totalOvertimePayCents");
  // total pay is at payMultiplier (1.5×); the premium share of it is
  // premiumShare / payMultiplier = 0.5 / 1.5 = 1/3.
  const divisor = rules.payMultiplierBps / rules.premiumShareOfRegularRateBps;
  return divideCents(ot.totalOvertimePayCents, divisor);
}

export function overtimeCapCents(
  filingStatus: HouseholdInput["filingStatus"],
  rules: OvertimeRules,
): Cents {
  return filingStatus === "MARRIED_JOINT" ? rules.capJointCents : rules.capSingleCents;
}

export function computeOvertimeDeduction(
  input: HouseholdInput,
  magiCents: Cents,
  rules: OvertimeRules,
): DeductionResult {
  const cap = overtimeCapCents(input.filingStatus, rules);
  const base: DeductionResult = {
    id: "OVERTIME",
    label: "Qualified overtime deduction",
    claimed: Boolean(input.overtime),
    eligible: false,
    reasons: [],
    qualifiedAmountCents: 0,
    capCents: cap,
    cappedAmountCents: 0,
    phaseOut: null,
    deductionCents: 0,
    notes: [],
    citations: rules.citations,
  };

  if (!input.overtime) {
    base.reasons.push("No overtime entered.");
    return base;
  }

  const premium = overtimePremiumCents(input, rules);
  base.qualifiedAmountCents = premium;
  if (premium === 0) {
    base.reasons.push("Overtime premium is $0.");
    return base;
  }

  if (rules.requireJointIfMarried && input.filingStatus === "MARRIED_SEPARATE") {
    base.reasons.push(
      "Married filing separately can't claim the overtime deduction — the law requires a joint return for married filers.",
    );
    return base;
  }

  base.eligible = true;
  base.cappedAmountCents = minCents(premium, cap);
  if (premium > cap) {
    base.notes.push("Premium above the annual cap doesn't qualify; the deduction is capped.");
  }
  base.notes.push(
    "Only the FLSA overtime premium is deductible — the extra half in time-and-a-half, not your whole overtime paycheck.",
  );
  base.notes.push(
    "This reduces federal income tax only. Overtime pay is still subject to FICA and possibly state income tax.",
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
