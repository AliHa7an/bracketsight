/**
 * Integer-cent arithmetic. THE rounding rules for the whole engine live here.
 *
 * Conventions (documented once, applied everywhere):
 *  - All currency is `Cents` — integer cents. 1234 = $12.34.
 *  - All rates are `BasisPoints` — integer basis points. 996 = 9.96%.
 *  - Division rounds HALF-AWAY-FROM-ZERO ("half up" for positive values),
 *    matching everyday tax-form arithmetic. `Math.round` rounds half toward
 *    +∞ for negatives, so we implement it explicitly.
 *  - Form 8962's FPL percentage is TRUNCATED, not rounded — that special
 *    case lives in fpl.ts, not here.
 */

import type { BasisPoints, Cents } from "./types";

/** Throws if a value that must be integer cents is not. */
export function assertCents(value: number, label = "amount"): Cents {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(
      `${label} must be integer cents, got ${value}. Floats are never money.`,
    );
  }
  return value;
}

/** Round half away from zero. roundHalf(2.5) = 3, roundHalf(-2.5) = -3. */
export function roundHalf(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** cents × basis points → cents. mulBps(1_000_00, 996) = $99.60 = 9960. */
export function mulBps(cents: Cents, bps: BasisPoints): Cents {
  assertCents(cents, "mulBps cents");
  return roundHalf((cents * bps) / 10_000);
}

/** cents × permille factor → cents (used by the SLCSP age curve, ×1000). */
export function mulPermille(cents: Cents, permille: number): Cents {
  assertCents(cents, "mulPermille cents");
  return roundHalf((cents * permille) / 1_000);
}

/** Integer-safe sum of cent amounts. */
export function sumCents(values: Cents[]): Cents {
  return values.reduce<Cents>((acc, v) => acc + assertCents(v), 0);
}

export function clampCents(value: Cents, min: Cents, max: Cents): Cents {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format integer cents as US dollars. Hand-rolled (no Intl) so the engine's
 * output is identical on every runtime — determinism is an invariant.
 * formatUsd(612000) = "$6,120" · formatUsd(612050, true) = "$6,120.50"
 */
export function formatUsd(cents: Cents, showCents = false): string {
  assertCents(cents, "formatUsd cents");
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  const grouped = dollars
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = showCents
    ? `${grouped}.${rem.toString().padStart(2, "0")}`
    : grouped;
  return `${negative ? "−$" : "$"}${body}`;
}
