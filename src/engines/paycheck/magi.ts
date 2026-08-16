/**
 * MAGI model.
 *
 * v1 approximation, documented on /methodology: MAGI = base wages + tips +
 * gross overtime pay + all other income. The OBBBA deductions themselves do
 * NOT reduce MAGI (they are below-the-line-but-available-to-non-itemizers),
 * so a raise can phase out several deductions at once — that interaction is
 * the product's core insight.
 */

import { EngineInputError, assertNonNegativeCents, mulBps, roundHalfUpToCent } from "./money";
import type { Cents, HouseholdInput, OvertimeRules } from "./types";

/** Gross overtime pay (at the full multiplier) implied by the overtime input. */
export function grossOvertimePayCents(
  input: HouseholdInput,
  overtimeRules: OvertimeRules,
): Cents {
  const ot = input.overtime;
  if (!ot) return 0;
  if (ot.mode === "TOTAL_OT_PAY") {
    assertNonNegativeCents(ot.totalOvertimePayCents, "overtime.totalOvertimePayCents");
    return ot.totalOvertimePayCents;
  }
  assertNonNegativeCents(ot.regularHourlyRateCents, "overtime.regularHourlyRateCents");
  if (!Number.isFinite(ot.overtimeHours) || ot.overtimeHours < 0) {
    throw new EngineInputError(
      `overtime.overtimeHours must be >= 0; received ${String(ot.overtimeHours)}`,
    );
  }
  // hours × rate × 1.5 (multiplier from rules, in bps)
  const straightPay = roundHalfUpToCent(ot.overtimeHours * ot.regularHourlyRateCents);
  return mulBps(straightPay, overtimeRules.payMultiplierBps);
}

/**
 * KNOWN-GAP GAP-047: this is an income PROXY with no subtraction term.
 * Statutory MAGI is AGI + the §§ 911/931/933 exclusions, and AGI is gross
 * income LESS above-the-line adjustments (HSA contributions, deductible SE tax,
 * self-employed health insurance, traditional IRA and SEP/SIMPLE contributions,
 * student-loan interest, educator expenses...). Nothing here subtracts those,
 * so this OVERSTATES MAGI for anyone who has them and can therefore understate
 * their deduction near a phase-out edge. A documented v1 approximation, not a
 * wrong constant, and unverifiable as a figure because it is a scope choice.
 *
 * What is NOT a gap: the four OBBBA deductions genuinely do not reduce MAGI,
 * for their own phase-outs or each other's. Schedule 1-A computes MAGI once at
 * line 3 and Parts II-V all read that one line. Verified. See /KNOWN-GAPS.md.
 */
export function computeMagiCents(
  input: HouseholdInput,
  overtimeRules: OvertimeRules,
): Cents {
  assertNonNegativeCents(input.wagesCents, "wagesCents");
  assertNonNegativeCents(input.otherIncomeCents, "otherIncomeCents");
  const tips = input.tips ? input.tips.amountCents : 0;
  if (input.tips) assertNonNegativeCents(input.tips.amountCents, "tips.amountCents");
  return (
    input.wagesCents +
    input.otherIncomeCents +
    tips +
    grossOvertimePayCents(input, overtimeRules)
  );
}
