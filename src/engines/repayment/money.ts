/**
 * packages/engine/src/money.ts
 *
 * Integer-cent arithmetic. Every money value in the engine is an integer
 * number of cents (`Cents`). Interest rates are integer basis points
 * (6.39% → 639). No floats are ever stored for currency.
 *
 * ── Rounding rules (the documented, single source of truth) ──────────────
 *
 * 1. ROUND HALF AWAY FROM ZERO ("commercial rounding"). $0.005 → $0.01.
 *    Applied by `roundToCents` at every point where a fractional
 *    intermediate (rate math, division) must become cents.
 * 2. Rounding happens ONCE per derived figure. Intermediates within a
 *    single formula are computed in floating point, then rounded exactly
 *    once at the end. Rounded values are never re-derived from other
 *    rounded values inside the same formula.
 * 3. Monthly interest = round(balance × annualRateBps / 10 000 / 12).
 *    Computed fresh each month from the integer balance, so float error
 *    cannot accumulate across 360 iterations — each month's inputs and
 *    outputs are exact integers.
 * 4. Level (annuity) payments are computed once and rounded UP to the
 *    next cent, then held constant. Rounding up guarantees the loan
 *    retires within its stated term (rounding down would leave a residual
 *    121st month); the final scheduled payment is smaller, absorbing the
 *    difference, and the schedule lands exactly at zero.
 */

import type { Cents } from "./types";

/** Throws if a value that must be integer cents is not. */
export function assertCents(value: number, label = "amount"): void {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be integer cents, got ${value}`);
  }
}

/** Round half away from zero. The engine's only rounding function. */
export function roundToCents(value: number): Cents {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot round non-finite value ${value}`);
  }
  return value >= 0 ? Math.floor(value + 0.5) : -Math.floor(-value + 0.5);
}

/** One month of simple interest on a balance, in cents. Rule 3 above. */
export function monthlyInterest(balance: Cents, annualRateBps: number): Cents {
  assertCents(balance, "balance");
  if (balance <= 0) return 0;
  return roundToCents((balance * annualRateBps) / 10_000 / 12);
}

/** percent (e.g. 5 = 5%) of an amount, rounded once. */
export function percentOf(amount: Cents, percent: number): Cents {
  assertCents(amount, "amount");
  return roundToCents((amount * percent) / 100);
}

/**
 * Level monthly payment that amortises `balance` at `annualRateBps` over
 * `months` payments (standard annuity formula), rounded UP once so the
 * loan retires within the stated term. Rule 4.
 */
export function levelPayment(balance: Cents, annualRateBps: number, months: number): Cents {
  assertCents(balance, "balance");
  if (months <= 0) throw new Error(`months must be positive, got ${months}`);
  if (balance <= 0) return 0;
  const r = annualRateBps / 10_000 / 12; // monthly rate, float — rounded once below
  if (r === 0) return Math.ceil(balance / months);
  const payment = (balance * r) / (1 - Math.pow(1 + r, -months));
  return Math.ceil(payment);
}

/** Sum of integer-cent values, asserting integrality of each. */
export function sumCents(values: readonly Cents[]): Cents {
  let total = 0;
  for (const v of values) {
    assertCents(v, "summand");
    total += v;
  }
  return total;
}
