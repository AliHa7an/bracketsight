import { describe, expect, it } from "vitest";
import { scoreConfidence } from "@fairparcel/engine";

const base = { compCount: 8, cod: 4, medianDataAgeDays: 120, windowMonths: 24 };

describe("confidence scoring — comp count, COD, recency", () => {
  it("full marks: 8 fresh, tight comps score ~100 and HIGH", () => {
    const c = scoreConfidence(base);
    expect(c.compCountScore).toBe(40);
    expect(c.dispersionScore).toBe(40);
    expect(c.recencyScore).toBe(20);
    expect(c.score).toBe(100);
    expect(c.level).toBe("HIGH");
  });

  it("comp count: below 3 scores zero; 3 scores 15; caps at 40", () => {
    expect(scoreConfidence({ ...base, compCount: 2 }).compCountScore).toBe(0);
    expect(scoreConfidence({ ...base, compCount: 3 }).compCountScore).toBe(15);
    expect(scoreConfidence({ ...base, compCount: 20 }).compCountScore).toBe(40);
  });

  it("dispersion: COD ≤ 5 is full marks; 15 scores 15; 21+ scores 0", () => {
    expect(scoreConfidence({ ...base, cod: 5 }).dispersionScore).toBe(40);
    expect(scoreConfidence({ ...base, cod: 15 }).dispersionScore).toBe(15);
    expect(scoreConfidence({ ...base, cod: 30 }).dispersionScore).toBe(0);
  });

  it("recency: fresh data scores 20, data at the window edge scores ~0, monotonic between", () => {
    expect(scoreConfidence({ ...base, medianDataAgeDays: 180 }).recencyScore).toBe(20);
    const mid = scoreConfidence({ ...base, medianDataAgeDays: 400 }).recencyScore;
    const old = scoreConfidence({ ...base, medianDataAgeDays: 700 }).recencyScore;
    expect(mid).toBeGreaterThan(old);
    expect(scoreConfidence({ ...base, medianDataAgeDays: 731 }).recencyScore).toBe(0);
  });

  it("levels: HIGH ≥ 70, MEDIUM ≥ 45, LOW below", () => {
    // 6 comps (30) + COD 10 (27.5) + fresh (20) = 78 → HIGH
    expect(scoreConfidence({ ...base, compCount: 6, cod: 10 }).level).toBe("HIGH");
    // 4 comps (20) + COD 14 (17.5) + 300-day-old data (~15.6) ≈ 53 → MEDIUM
    expect(
      scoreConfidence({ compCount: 4, cod: 14, medianDataAgeDays: 300, windowMonths: 24 }).level,
    ).toBe("MEDIUM");
  });

  it("weak everything is LOW, and every result carries three plain-English factors", () => {
    const weak = scoreConfidence({
      compCount: 3,
      cod: 22,
      medianDataAgeDays: 700,
      windowMonths: 24,
    });
    expect(weak.level).toBe("LOW");
    expect(weak.factors).toHaveLength(3);
    for (const f of weak.factors) expect(f.length).toBeGreaterThan(10);
  });
});
