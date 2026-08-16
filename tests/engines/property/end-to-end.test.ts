import { describe, expect, it } from "vitest";
import {
  getCounty,
  getSampleParcel,
  runAssessmentCheck,
  sampleParcels,
  type CountyRules,
  type Property,
} from "@/engines/property";

const AS_OF = "2026-08-08";

function county(id: string): CountyRules {
  const c = getCounty(id);
  if (!c) throw new Error(`county ${id} missing`);
  return c;
}

function parcel(id: string): Property {
  const p = getSampleParcel(id);
  if (!p) throw new Error(`parcel ${id} missing`);
  return p;
}

describe("end-to-end on the synthetic demo neighborhood (market-value, nj-bergen rules)", () => {
  /*
   * These three cases asserted STRONG_CASE / WORTH_FILING / NOT_WORTH_IT while
   * New Jersey ran on the generic 5%/10% ladder. It does not any more: Bergen
   * is a COMMON_LEVEL_RANGE county and no municipality's Director's Ratio has
   * been verified, so the Chapter 123 test cannot run and the engine says so
   * rather than guessing. The ratio analysis underneath is untouched, so the
   * gap percentages each case was really testing are asserted directly.
   */

  it("DEMO-001 (assessed ~14.5% over) cannot be ruled on without a Director's Ratio", () => {
    const check = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("nj-bergen"), AS_OF);
    expect(check.verdict.kind).toBe("CANNOT_DETERMINE");
    expect(check.verdict.commonLevelRange?.outcome).toBe("CANNOT_DETERMINE");
    expect(check.analysis.overAssessmentPct).toBeGreaterThan(10);
    expect(check.confidence.level).toBe("HIGH");
    expect(check.analysis.compCount).toBe(8);
    expect(check.analysis.cod).toBeLessThan(15);
    expect(Number.isInteger(check.verdict.estimatedAnnualOverpaymentCents)).toBe(true);
    expect(check.deadline.isoDate).toBe("2027-04-01");
  });

  it("DEMO-002 (assessed ~6.8% over) is likewise CANNOT_DETERMINE, gap intact", () => {
    const check = runAssessmentCheck(parcel("DEMO-002"), sampleParcels, county("nj-bergen"), AS_OF);
    expect(check.verdict.kind).toBe("CANNOT_DETERMINE");
    expect(check.analysis.overAssessmentPct).toBeGreaterThan(5);
    expect(check.analysis.overAssessmentPct).toBeLessThan(10);
  });

  it("DEMO-003 (assessed ~0.8% over) still gets reasons, not a bare refusal", () => {
    const check = runAssessmentCheck(parcel("DEMO-003"), sampleParcels, county("nj-bergen"), AS_OF);
    expect(check.verdict.kind).toBe("CANNOT_DETERMINE");
    expect(check.verdict.reasons.length).toBeGreaterThan(0);
    expect(check.verdict.reasons.join(" ")).toMatch(/Director's Ratio/);
  });

  it("the deadline is received-by, not postmark — a homeowner who posts on 1 April loses", () => {
    const check = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("nj-bergen"), AS_OF);
    expect(check.deadline.filingCutoff).toBe("RECEIVED_BY");
    expect(check.deadline.filingCutoffNote).toMatch(/postmark/i);
  });

  it("all money in the result is integer cents", () => {
    const check = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("nj-bergen"), AS_OF);
    expect(Number.isInteger(check.analysis.impliedFairAssessmentCents)).toBe(true);
    expect(Number.isInteger(check.analysis.overAssessmentCents)).toBe(true);
    expect(Number.isInteger(check.verdict.filingFeeCents)).toBe(true);
  });

  it("throws a plain-English error when too few comps survive (isolated subject)", () => {
    const stranded: Property = {
      ...parcel("DEMO-001"),
      id: "STRANDED",
      neighborhoodId: "nowhere",
    };
    expect(() =>
      runAssessmentCheck(stranded, sampleParcels, county("nj-bergen"), AS_OF),
    ).toThrow(/comparable/);
  });
});

describe("per-state argument flag changes which analysis runs", () => {
  it("il-cook runs UNIFORMITY (assessed ¢/sqft), nj-bergen runs MARKET_VALUE", () => {
    const cook = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("il-cook"), AS_OF);
    const bergen = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("nj-bergen"), AS_OF);
    expect(cook.analysis.argumentType).toBe("UNIFORMITY");
    expect(bergen.analysis.argumentType).toBe("MARKET_VALUE");
    // uniformity ratios are cents/sqft (tens of thousands), market ratios ~1.0
    expect(cook.analysis.medianRatio).toBeGreaterThan(1000);
    expect(bergen.analysis.medianRatio).toBeLessThan(2);
  });

  it("uniformity does not require sales, so the never-sold parcel can serve as a comp", () => {
    const cook = runAssessmentCheck(parcel("DEMO-002"), sampleParcels, county("il-cook"), AS_OF, {
      maxComps: 20,
    });
    const ids = cook.selection.selected.map((p) => p.id);
    expect(ids).toContain("DEMO-027");
  });

  it("the clearly over-assessed DEMO-001 still shows a strong uniformity gap under Cook rules", () => {
    const cook = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("il-cook"), AS_OF);
    expect(cook.analysis.overAssessmentPct).toBeGreaterThan(10);
  });
});

describe("per-state relief model changes which statutory test decides the verdict", () => {
  it("il-cook decides on the gap; nj-bergen decides on the Chapter 123 corridor", () => {
    const cook = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("il-cook"), AS_OF);
    const bergen = runAssessmentCheck(parcel("DEMO-001"), sampleParcels, county("nj-bergen"), AS_OF);
    // Same parcel, same over-assessment, different statutory test — and the
    // branch is the county's `reliefModel` flag, not its state code.
    expect(cook.verdict.commonLevelRange).toBeNull();
    expect(bergen.verdict.commonLevelRange).not.toBeNull();
    expect(cook.verdict.kind).not.toBe("CANNOT_DETERMINE");
    expect(bergen.verdict.kind).toBe("CANNOT_DETERMINE");
  });
});
