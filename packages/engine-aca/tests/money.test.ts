import { describe, expect, it } from "vitest";
import {
  assertCents,
  clampCents,
  formatUsd,
  mulBps,
  mulPermille,
  roundHalf,
  sumCents,
} from "@engine";

describe("money — integer-cent arithmetic", () => {
  it("rounds half away from zero, both signs", () => {
    expect(roundHalf(2.5)).toBe(3);
    expect(roundHalf(-2.5)).toBe(-3);
    expect(roundHalf(2.4)).toBe(2);
    expect(roundHalf(-2.4)).toBe(-2);
  });

  it("rejects non-integer cents", () => {
    expect(() => assertCents(10.5)).toThrow(/integer cents/);
    expect(() => assertCents(Number.NaN)).toThrow();
    expect(assertCents(1234)).toBe(1234);
  });

  it("multiplies cents by basis points with half-up rounding", () => {
    // $1,000.00 × 9.96% = $99.60
    expect(mulBps(100_000, 996)).toBe(9_960);
    // 6,250,000 cents × 996 bps = 622,500 (golden-1 expected contribution)
    expect(mulBps(6_250_000, 996)).toBe(622_500);
  });

  it("applies permille age factors exactly", () => {
    // $460.00 × 2.714 (age-60 factor) = $1,248.44
    expect(mulPermille(46_000, 2_714)).toBe(124_844);
  });

  it("sums and clamps integer cents", () => {
    expect(sumCents([100, 200, 300])).toBe(600);
    expect(clampCents(500, 0, 400)).toBe(400);
    expect(clampCents(-5, 0, 400)).toBe(0);
  });

  it("formats USD without Intl, deterministically", () => {
    expect(formatUsd(612_000)).toBe("$6,120");
    expect(formatUsd(612_050, true)).toBe("$6,120.50");
    expect(formatUsd(-5, true)).toBe("−$0.05");
    expect(formatUsd(123_456_789)).toBe("$1,234,567");
  });
});
