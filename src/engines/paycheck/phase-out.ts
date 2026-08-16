/**
 * MAGI phase-out arithmetic for the two statutory models in OBBBA.
 * All parameters come from rules JSON — nothing is hard-coded here.
 */

import { EngineInputError, assertCents, mulBps, roundHalfUpToCent } from "./money";
import type { Cents, FilingStatus, PhaseOutRule, PhaseOutStatus } from "./types";

/** Joint filers use the joint threshold; everyone else uses the single one. */
export function thresholdFor(rule: PhaseOutRule, filingStatus: FilingStatus): Cents {
  return filingStatus === "MARRIED_JOINT"
    ? rule.thresholdJointCents
    : rule.thresholdSingleCents;
}

/** Reduction (in cents) the phase-out applies at this MAGI. Never negative. */
export function phaseOutReduction(
  magiCents: Cents,
  filingStatus: FilingStatus,
  rule: PhaseOutRule,
): Cents {
  assertCents(magiCents, "phaseOutReduction.magiCents");
  const threshold = thresholdFor(rule, filingStatus);
  const excess = magiCents > threshold ? magiCents - threshold : 0;
  if (excess === 0) return 0;

  if (rule.model === "PER_1000_STEP") {
    const stepCents = 100_000; // $1,000 in cents — the statutory step unit
    // Two statutory roundings, and they genuinely differ:
    //   true  → round UP.   IRC § 163(h)(4)(C)(ii)(I) car-loan interest says
    //           "$200 for each $1,000 (or portion thereof)"; Schedule 1-A
    //           line 28: "increase the result to the next higher whole number".
    //   false → round DOWN (floor). IRC §§ 224(b)(2)(A) / 225(b)(2)(A) say
    //           "for each $1,000" with NO "or portion thereof"; Schedule 1-A
    //           lines 11 and 19: "decrease the result to the next lower whole
    //           number. (For example, decrease 1.5 to 1, and decrease 0.05
    //           to 0.)" This must be Math.floor — NOT half-up rounding, which
    //           would turn a $500.01 excess into a full step.
    const steps = rule.fractionCountsAsFullStep
      ? Math.ceil(excess / stepCents)
      : Math.floor(excess / stepCents);
    return steps * rule.reductionPer1000Cents;
  }

  // KNOWN-GAP GAP-036: the $1,000-STEP rounding above is verified in both
  // directions. The SUB-DOLLAR convention is not. No source fetched — Schedule
  // 1-A, its instructions, or the Form 1040 instructions — states whether cents
  // should be rounded, or at which line. The engine computes in integer cents
  // and rounds half-up, which is defensible but unstated. Worth about a dollar
  // on a result. Genuinely unsettled, not merely unchecked. See /KNOWN-GAPS.md.
  if (rule.model === "PERCENT_OF_EXCESS") {
    return mulBps(excess, rule.percentOfExcessBps);
  }

  throw new EngineInputError(`unknown phase-out model`);
}

/**
 * The MAGI at which a deduction of `cappedAmountCents` reaches $0.
 * Used by the phase-out meter ("fully phased out at $X").
 */
export function fullyPhasedOutAt(
  cappedAmountCents: Cents,
  filingStatus: FilingStatus,
  rule: PhaseOutRule,
): Cents {
  assertCents(cappedAmountCents, "fullyPhasedOutAt.cappedAmountCents");
  const threshold = thresholdFor(rule, filingStatus);
  if (cappedAmountCents <= 0) return threshold;

  if (rule.model === "PER_1000_STEP") {
    const steps = Math.ceil(cappedAmountCents / rule.reductionPer1000Cents);
    return threshold + steps * 100_000;
  }

  // PERCENT_OF_EXCESS: excess needed = amount / (bps/10000)
  const excessNeeded = roundHalfUpToCent(
    (cappedAmountCents * 10_000) / rule.percentOfExcessBps,
  );
  return threshold + excessNeeded;
}

export function phaseOutStatus(
  magiCents: Cents,
  filingStatus: FilingStatus,
  rule: PhaseOutRule,
  cappedAmountCents: Cents,
): PhaseOutStatus {
  const threshold = thresholdFor(rule, filingStatus);
  const excess = magiCents > threshold ? magiCents - threshold : 0;
  const rawReduction = phaseOutReduction(magiCents, filingStatus, rule);
  return {
    thresholdCents: threshold,
    magiCents,
    excessCents: excess,
    reductionCents: rawReduction > cappedAmountCents ? cappedAmountCents : rawReduction,
    fullyPhasedOutAtCents: fullyPhasedOutAt(cappedAmountCents, filingStatus, rule),
  };
}
