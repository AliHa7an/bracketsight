import { describe, expect, it } from "vitest";
import {
  applyBps,
  assertCents,
  formatCents,
  formatCentsExact,
  mulCentsByRatio,
  roundToCents,
} from "@/engines/property";

describe("money — integer cents, documented rounding", () => {
  it("assertCents accepts integers and rejects floats", () => {
    expect(assertCents(123_45)).toBe(12345);
    expect(() => assertCents(123.45)).toThrow(/integer cents/);
    expect(() => assertCents(Number.NaN)).toThrow(/integer cents/);
  });

  it("roundToCents rounds half away from zero, both signs", () => {
    expect(roundToCents(10.5)).toBe(11);
    expect(roundToCents(-10.5)).toBe(-11);
    expect(roundToCents(10.4)).toBe(10);
    expect(roundToCents(-10.4)).toBe(-10);
  });

  it("mulCentsByRatio rounds exactly once at the end", () => {
    // 55_601 cents × 0.9735 = 54127.5735 → 54128
    expect(mulCentsByRatio(55_601, 0.9735)).toBe(54_128);
    expect(() => mulCentsByRatio(55_601.5, 1)).toThrow(/integer cents/);
  });

  it("applyBps: $100 at 2.30% (230 bps) is $2.30", () => {
    expect(applyBps(10_000, 230)).toBe(230);
    // $82,970.00 over-assessment × 230 bps = $1,908.31
    expect(applyBps(8_297_000, 230)).toBe(190_831);
  });

  it("formats whole and exact dollars", () => {
    expect(formatCents(190_831)).toBe("$1,908");
    expect(formatCentsExact(190_831)).toBe("$1,908.31");
  });
});
