/**
 * Integer-cent arithmetic. THE rounding rules for the whole engine live here.
 *
 * Rules (documented per portfolio invariant 2):
 * - All currency values are integer cents. Floats never represent money.
 * - Any float produced by a ratio multiplication is rounded HALF-AWAY-FROM-ZERO
 *   to the nearest cent at the moment it becomes money, and never before.
 * - Rates are basis points (2.30% → 230) and applied with a single rounding step.
 */

import type { Bps, Cents } from "./types";

/** Throws if `value` is not an integer number of cents. */
export function assertCents(value: number, label = "amount"): Cents {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be integer cents, got ${value}`);
  }
  return value;
}

/**
 * Round a float to an integer, half away from zero (so -0.5 → -1, 0.5 → 1).
 *
 * THE engine's only rounding rule. Cents use it via `roundToCents`; basis-point
 * quantities (ratios, common level range limits) use it directly. Keeping one
 * implementation is what makes a hearing officer's hand-arithmetic match ours.
 */
export function roundHalfAwayFromZero(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`cannot round non-finite value ${value}`);
  }
  const sign = value < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(value));
}

/** Round a float to integer cents, half away from zero (so -0.5 → -1, 0.5 → 1). */
export function roundToCents(value: number): Cents {
  return roundHalfAwayFromZero(value);
}

/** Multiply integer cents by a dimensionless ratio, rounding once at the end. */
export function mulCentsByRatio(cents: Cents, ratio: number): Cents {
  assertCents(cents, "mulCentsByRatio input");
  return roundToCents(cents * ratio);
}

/** Apply a basis-point rate to cents: applyBps(10000, 230) = 230 ($100 × 2.30% = $2.30). */
export function applyBps(cents: Cents, bps: Bps): Cents {
  assertCents(cents, "applyBps input");
  return roundToCents((cents * bps) / 10_000);
}

const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const exactDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$1,180" — whole dollars, for verdicts and page copy. */
export function formatCents(cents: Cents): string {
  assertCents(cents, "formatCents input");
  return wholeDollars.format(cents / 100);
}

/** "$1,180.42" — exact, for tables and traces. */
export function formatCentsExact(cents: Cents): string {
  assertCents(cents, "formatCentsExact input");
  return exactDollars.format(cents / 100);
}
