import { describe, expect, it } from "vitest";
import { cubicBezier, easeAtlas, prefersReducedMotion } from "@/components/ui/motion";

describe("motion", () => {
  it("matches cubic-bezier(0.2, 0, 0.13, 1) at the endpoints and stays monotonic", () => {
    expect(easeAtlas(0)).toBe(0);
    expect(easeAtlas(1)).toBe(1);
    expect(easeAtlas(-1)).toBe(0);
    expect(easeAtlas(2)).toBe(1);

    let previous = 0;
    for (let i = 1; i <= 40; i++) {
      const value = easeAtlas(i / 40);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });

  it("front-loads the movement, so a tween reads as decisive", () => {
    expect(easeAtlas(0.5)).toBeGreaterThan(0.5);
  });

  it("solves linear control points exactly", () => {
    const linear = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3);
    expect(linear(0.25)).toBeCloseTo(0.25, 5);
    expect(linear(0.8)).toBeCloseTo(0.8, 5);
  });

  it("reports no motion preference when matchMedia is unavailable", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
