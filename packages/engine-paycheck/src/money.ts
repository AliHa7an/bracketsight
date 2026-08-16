/**
 * Integer-cent arithmetic. The ONLY place rounding rules live.
 *
 * Rules:
 * - All currency values are integer cents. Floats never represent money.
 * - Where a computation produces a fractional cent (rate multiplication,
 *   division), we round HALF UP to the nearest cent — the convention used on
 *   IRS worksheets ("round to the nearest dollar/cent, .5 rounds up").
 * - Every public function asserts its money inputs are integers and throws
 *   `EngineInputError` otherwise. Fail loudly, never coerce.
 */

import type { Bps, Cents } from "./types";

export class EngineInputError extends Error {
  override name = "EngineInputError";
}

export function assertCents(value: number, label: string): asserts value is Cents {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new EngineInputError(
      `${label} must be integer cents; received ${String(value)}`,
    );
  }
}

export function assertNonNegativeCents(value: number, label: string): asserts value is Cents {
  assertCents(value, label);
  if (value < 0) {
    throw new EngineInputError(`${label} must be >= 0 cents; received ${String(value)}`);
  }
}

/**
 * Round a (possibly fractional) cent value half-up to an integer cent.
 *
 * KNOWN-GAP GAP-036: half-up is this engine's chosen convention, not a sourced
 * one. Schedule 1-A prescribes the $1,000-step rounding and the 6% senior
 * multiplication; no fetched IRS source states a sub-dollar or whole-dollar
 * convention for these four deductions. Do not treat this as verified.
 * See /KNOWN-GAPS.md.
 */
export function roundHalfUpToCent(value: number): Cents {
  if (!Number.isFinite(value)) {
    throw new EngineInputError(`cannot round non-finite value ${String(value)}`);
  }
  // Math.round rounds half away from zero for positives, half toward +∞ for
  // negatives. Money in this engine is never negative at rounding sites, but
  // be explicit and correct anyway: implement true half-up.
  const floor = Math.floor(value);
  return value - floor >= 0.5 ? floor + 1 : floor;
}

/** amount × rate, rate in basis points. e.g. mulBps(100000, 1200) = 12000. */
export function mulBps(amountCents: Cents, rateBps: Bps): Cents {
  assertCents(amountCents, "mulBps.amountCents");
  if (!Number.isFinite(rateBps)) {
    throw new EngineInputError(`rateBps must be finite; received ${String(rateBps)}`);
  }
  return roundHalfUpToCent((amountCents * rateBps) / 10_000);
}

/** Integer division of cents with half-up rounding: divideCents(1400000, 3) = 466667. */
export function divideCents(amountCents: Cents, divisor: number): Cents {
  assertCents(amountCents, "divideCents.amountCents");
  if (!Number.isFinite(divisor) || divisor === 0) {
    throw new EngineInputError(`divisor must be finite and non-zero; received ${String(divisor)}`);
  }
  return roundHalfUpToCent(amountCents / divisor);
}

/** Convenience for tests and rules: whole dollars → cents. */
export function dollars(amount: number): Cents {
  const cents = roundHalfUpToCent(amount * 100);
  return cents;
}

/** max(0, a − b) — used everywhere a reduction may not go below zero. */
export function subFloorZero(a: Cents, b: Cents): Cents {
  assertCents(a, "subFloorZero.a");
  assertCents(b, "subFloorZero.b");
  return a > b ? a - b : 0;
}

export function minCents(a: Cents, b: Cents): Cents {
  assertCents(a, "minCents.a");
  assertCents(b, "minCents.b");
  return a < b ? a : b;
}
