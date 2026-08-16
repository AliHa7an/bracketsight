import { describe, expect, it } from "vitest";
import {
  EngineInputError,
  assertCents,
  divideCents,
  dollars,
  mulBps,
  roundHalfUpToCent,
  subFloorZero,
} from "@engine";

describe("money — integer cents and rounding", () => {
  it("assertCents rejects floats", () => {
    expect(() => assertCents(1.5, "x")).toThrow(EngineInputError);
  });

  it("assertCents rejects NaN and Infinity", () => {
    expect(() => assertCents(Number.NaN, "x")).toThrow(EngineInputError);
    expect(() => assertCents(Number.POSITIVE_INFINITY, "x")).toThrow(EngineInputError);
  });

  it("roundHalfUpToCent rounds .5 up", () => {
    expect(roundHalfUpToCent(0.5)).toBe(1);
    expect(roundHalfUpToCent(2.5)).toBe(3);
    expect(roundHalfUpToCent(1.4)).toBe(1);
    expect(roundHalfUpToCent(1.6)).toBe(2);
  });

  it("mulBps computes 12% of $1,000 as $120.00", () => {
    expect(mulBps(100_000, 1200)).toBe(12_000);
  });

  it("mulBps rounds a half-cent up", () => {
    // 1 cent × 50% = 0.5 cents → 1 cent
    expect(mulBps(1, 5000)).toBe(1);
  });

  it("divideCents(1400000, 3) = 466667 — the $14,000 / 3 premium case", () => {
    expect(divideCents(1_400_000, 3)).toBe(466_667);
  });

  it("dollars() converts whole and fractional dollars", () => {
    expect(dollars(12.34)).toBe(1234);
    expect(dollars(25_000)).toBe(2_500_000);
  });

  it("subFloorZero never goes negative", () => {
    expect(subFloorZero(500, 1000)).toBe(0);
    expect(subFloorZero(1000, 400)).toBe(600);
  });
});
