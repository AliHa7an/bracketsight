import { describe, expect, it } from "vitest";
import { analyzeRatios, type Property } from "@fairparcel/engine";

const AS_OF = "2026-08-08";

/** Hand-computed fixture. Subject: 2,000 sqft, assessed $500,000. */
const subject: Property = {
  id: "S",
  address: "1 Test Way",
  neighborhoodId: "fixture",
  class: "RESIDENTIAL",
  sqft: 2000,
  beds: 3,
  baths: 2,
  lotSqft: 7000,
  yearBuilt: 1965,
  assessedValueCents: 50_000_000,
  assessmentDate: "2026-01-15",
};

function comp(
  id: string,
  sqft: number,
  salePriceCents: number,
  assessedValueCents: number,
  saleDate: string,
): Property {
  return {
    id,
    address: `${id} Test Way`,
    neighborhoodId: "fixture",
    class: "RESIDENTIAL",
    sqft,
    beds: 3,
    baths: 2,
    lotSqft: 7000,
    yearBuilt: 1965,
    assessedValueCents,
    assessmentDate: "2026-01-15",
    lastSalePriceCents: salePriceCents,
    lastSaleDate: saleDate,
  };
}

// ratios: 0.95, 1.01, 0.96, 0.98, 0.97 → median 0.97
// sale $/sqft: $250, $250, $245, $255, $260 → median $250
const comps: Property[] = [
  comp("C1", 1900, 47_500_000, 45_125_000, "2025-06-01"), // 0.95, $250/sqft
  comp("C2", 2100, 52_500_000, 53_025_000, "2025-09-15"), // 1.01, $250/sqft
  comp("C3", 2000, 49_000_000, 47_040_000, "2026-02-20"), // 0.96, $245/sqft
  comp("C4", 1800, 45_900_000, 44_982_000, "2025-12-05"), // 0.98, $255/sqft
  comp("C5", 2200, 57_200_000, 55_484_000, "2025-03-10"), // 0.97, $260/sqft
];

describe("ratio analysis — MARKET_VALUE argument (hand-computed)", () => {
  const a = analyzeRatios(subject, comps, "MARKET_VALUE", AS_OF);

  it("median assessment ratio is 0.97", () => {
    expect(a.medianRatio).toBeCloseTo(0.97, 10);
  });

  it("subject market indicator: median $250/sqft × 2,000 sqft = $500,000", () => {
    expect(a.subjectMarketIndicator).toBe(50_000_000);
  });

  it("implied fair assessment = 0.97 × $500,000 = $485,000, in integer cents", () => {
    expect(a.impliedFairAssessmentCents).toBe(48_500_000);
    expect(Number.isInteger(a.impliedFairAssessmentCents)).toBe(true);
  });

  it("over-assessment = $15,000 = 3.09% of implied fair", () => {
    expect(a.overAssessmentCents).toBe(1_500_000);
    expect(a.overAssessmentPct).toBeCloseTo(3.0928, 3);
  });

  it("COD matches the hand computation (≈1.649%)", () => {
    // |dev| from 0.97: .02, .04, .01, .01, 0 → mean .016 → 100×.016/.97
    expect(a.cod).toBeCloseTo(1.6495, 3);
  });

  it("flags which comps support the case (ratio below subject's 1.00)", () => {
    const supporting = a.comps.filter((c) => c.supportsCase).map((c) => c.property.id);
    expect(supporting.sort()).toEqual(["C1", "C3", "C4", "C5"]);
  });

  it("throws below the 3-comp minimum", () => {
    expect(() => analyzeRatios(subject, comps.slice(0, 2), "MARKET_VALUE", AS_OF)).toThrow(
      /at least 3/,
    );
  });
});

describe("ratio analysis — UNIFORMITY argument (hand-computed)", () => {
  const a = analyzeRatios(subject, comps, "UNIFORMITY", AS_OF);

  it("ratios are assessed cents per sqft; median is 24,990 ¢/sqft", () => {
    // 23750, 25250, 23520, 24990, 25220 → median 24990
    expect(a.medianRatio).toBe(24_990);
  });

  it("implied fair = 24,990 ¢/sqft × 2,000 sqft = $499,800", () => {
    expect(a.impliedFairAssessmentCents).toBe(49_980_000);
    expect(a.overAssessmentCents).toBe(20_000); // $200 over — effectively fair
    expect(a.overAssessmentPct).toBeCloseTo(0.04, 3);
  });

  it("uniformity works without sale data on the subject", () => {
    expect(a.subjectMarketIndicator).toBe(2000); // the subject's sqft
    expect(a.subjectRatio).toBe(25_000); // 50,000,000 / 2,000
  });
});
