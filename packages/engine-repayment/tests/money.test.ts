import { describe, expect, it } from "vitest";
import {
  assertCents,
  levelPayment,
  monthlyInterest,
  percentOf,
  roundToCents,
  sumCents,
} from "../src/money";

describe("money.ts — rounding rules", () => {
  it("rounds half away from zero (positive)", () => {
    expect(roundToCents(0.5)).toBe(1);
    expect(roundToCents(1.4)).toBe(1);
    expect(roundToCents(1.5)).toBe(2);
    expect(roundToCents(2.5)).toBe(3);
  });

  it("rounds half away from zero (negative)", () => {
    expect(roundToCents(-1.5)).toBe(-2);
    expect(roundToCents(-1.4)).toBe(-1);
  });

  it("assertCents rejects floats and non-finite values", () => {
    expect(() => assertCents(100.5)).toThrow(/integer cents/);
    expect(() => assertCents(Number.NaN)).toThrow(/integer cents/);
    expect(() => assertCents(100)).not.toThrow();
  });

  it("monthlyInterest: $10,000 at 6.00% accrues exactly $50.00/month", () => {
    expect(monthlyInterest(1_000_000, 600)).toBe(5_000);
  });

  it("monthlyInterest rounds once from integer inputs (no drift)", () => {
    // $40,000 at 6.39%: 4,000,000 × 639 / 120,000 = 21,300 exactly
    expect(monthlyInterest(4_000_000, 639)).toBe(21_300);
    // $33,333.33 at 5.55%: fractional result rounds half away from zero
    expect(monthlyInterest(3_333_333, 555)).toBe(roundToCents((3_333_333 * 555) / 120_000));
  });

  it("levelPayment: zero-rate loans divide evenly", () => {
    expect(levelPayment(1_200_000, 0, 12)).toBe(100_000);
  });

  it("levelPayment: $10,000 at 6.00% over 120 months is $111.03 (rounded up to honour the term)", () => {
    // Exact annuity value is $111.0205…; rounding down would leave a
    // residual 121st payment, so level payments round UP (money.ts rule 4).
    expect(levelPayment(1_000_000, 600, 120)).toBe(11_103);
  });

  it("percentOf rounds once", () => {
    expect(percentOf(1_000_000, 22)).toBe(220_000);
    expect(percentOf(101, 50)).toBe(51); // 50.5 → half away from zero
  });

  it("sumCents totals integers and rejects floats", () => {
    expect(sumCents([1, 2, 3])).toBe(6);
    expect(() => sumCents([1.5])).toThrow();
  });
});
