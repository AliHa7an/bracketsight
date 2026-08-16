import { describe, expect, it } from "vitest";
import {
  daysBetween,
  distanceMiles,
  getSampleParcel,
  sampleParcels,
  selectComps,
  type CompCriteria,
  type Property,
} from "@fairparcel/engine";

const AS_OF = "2026-08-08";

const marketCriteria: CompCriteria = {
  sizeTolerancePct: 20,
  windowMonths: 24,
  maxComps: 8,
  requireSale: true,
};

function subject(): Property {
  const p = getSampleParcel("DEMO-001");
  if (!p) throw new Error("demo subject missing");
  return p;
}

describe("comp selection — spec §1.1 step 2 filters", () => {
  it("never selects the subject itself", () => {
    const result = selectComps(subject(), sampleParcels, marketCriteria, AS_OF);
    expect(result.selected.some((p) => p.id === "DEMO-001")).toBe(false);
    expect(result.rejected.some((r) => r.reason === "IS_SUBJECT")).toBe(true);
  });

  it("excludes a different property class (the condo)", () => {
    const result = selectComps(subject(), sampleParcels, marketCriteria, AS_OF);
    const condo = result.rejected.find((r) => r.property.id === "DEMO-028");
    expect(condo?.reason).toBe("DIFFERENT_CLASS");
  });

  it("excludes parcels outside the neighborhood", () => {
    const result = selectComps(subject(), sampleParcels, marketCriteria, AS_OF);
    const other = result.rejected.find((r) => r.property.id === "DEMO-031");
    expect(other?.reason).toBe("OUTSIDE_AREA");
  });

  it("excludes sizes outside ±20% of the subject", () => {
    const result = selectComps(subject(), sampleParcels, marketCriteria, AS_OF);
    const big = result.rejected.find((r) => r.property.id === "DEMO-029");
    expect(big?.reason).toBe("SIZE_OUT_OF_RANGE");
    for (const comp of result.selected) {
      expect(Math.abs(comp.sqft - 1850)).toBeLessThanOrEqual(1850 * 0.2);
    }
  });

  it("market-value analysis excludes parcels with no recorded sale", () => {
    const result = selectComps(subject(), sampleParcels, marketCriteria, AS_OF);
    const noSale = result.rejected.find((r) => r.property.id === "DEMO-027");
    expect(noSale?.reason).toBe("NO_SALE");
  });

  it("excludes sales older than the county window", () => {
    const result = selectComps(subject(), sampleParcels, marketCriteria, AS_OF);
    const stale = result.rejected.find((r) => r.property.id === "DEMO-030");
    expect(stale?.reason).toBe("DATA_TOO_OLD"); // sold 2022-05-26, window 24 months
  });

  it("caps the selection at maxComps, most similar first", () => {
    const result = selectComps(subject(), sampleParcels, marketCriteria, AS_OF);
    expect(result.selected.length).toBe(8);
    // the closest-sized parcel in the pool (11 Quarry Street, 1845 sqft) must be in
    expect(result.selected.some((p) => p.sqft === 1845)).toBe(true);
  });

  it("uniformity criteria (no sale required) admits the never-sold parcel", () => {
    const uniformity: CompCriteria = {
      ...marketCriteria,
      windowMonths: 18,
      requireSale: false,
      maxComps: 20,
    };
    const result = selectComps(subject(), sampleParcels, uniformity, AS_OF);
    expect(result.selected.some((p) => p.id === "DEMO-027")).toBe(true);
  });

  it("daysBetween and distanceMiles are sane", () => {
    expect(daysBetween("2026-01-01", "2026-08-08")).toBe(219);
    // NYC to Philadelphia ≈ 80 miles
    const d = distanceMiles(40.7128, -74.006, 39.9526, -75.1652);
    expect(d).toBeGreaterThan(75);
    expect(d).toBeLessThan(85);
  });
});
