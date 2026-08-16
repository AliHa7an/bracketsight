import { describe, expect, it } from "vitest";
import { cod, mean, median } from "@/engines/property";

describe("stats — median and IAAO coefficient of dispersion", () => {
  it("median of an odd-length array is the middle value", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([0.93, 1.04, 0.97, 0.95, 0.99])).toBe(0.97);
  });

  it("median of an even-length array averages the middle pair", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([0.9, 1.1])).toBe(1.0);
  });

  it("median of a single element is that element; empty throws", () => {
    expect(median([7])).toBe(7);
    expect(() => median([])).toThrow(/empty/);
  });

  it("mean computes the arithmetic mean and rejects empty input", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(() => mean([])).toThrow(/empty/);
  });

  it("COD matches a hand-computed IAAO example", () => {
    // ratios: 0.8, 0.9, 1.0, 1.1, 1.2 → median 1.0,
    // |dev| = 0.2, 0.1, 0, 0.1, 0.2 → mean 0.12 → COD = 12%
    expect(cod([0.8, 0.9, 1.0, 1.1, 1.2])).toBeCloseTo(12, 10);
  });

  it("COD of identical ratios is zero", () => {
    expect(cod([0.97, 0.97, 0.97])).toBe(0);
  });

  it("COD throws when the median is zero", () => {
    expect(() => cod([-1, 0, 1])).toThrow(/median ratio is zero/);
  });
});
