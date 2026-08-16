import { describe, expect, it } from "vitest";
import {
  counties,
  getCounty,
  getCountyBySlug,
  sampleParcels,
  SAMPLE_DATA_LABEL,
} from "@fairparcel/engine";

describe("county rules JSON — versioned, cited, integer cents", () => {
  it("both launch counties load", () => {
    expect(counties.map((c) => c.countyId).sort()).toEqual(["il-cook", "nj-bergen"]);
    expect(getCounty("il-cook")?.stateName).toBe("Illinois");
    expect(getCountyBySlug("NJ", "Bergen")?.countyName).toBe("Bergen County");
  });

  it("every county carries a ruleSetVersion and ≥1 citation with url + lastVerified", () => {
    for (const c of counties) {
      expect(c.ruleSetVersion).toMatch(/^\d{4}-\d{2}$/);
      expect(c.citations.length).toBeGreaterThanOrEqual(1);
      for (const cite of c.citations) {
        expect(cite.url).toMatch(/^https:\/\//);
        expect(cite.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof cite.verified).toBe("boolean");
      }
    }
  });

  it("fees are integer cents and primaryArgument is among argumentTypes", () => {
    for (const c of counties) {
      expect(Number.isInteger(c.filingFee.amountCents)).toBe(true);
      expect(c.argumentTypes).toContain(c.primaryArgument);
      expect(c.levels.length).toBeGreaterThanOrEqual(2);
      expect(c.forms.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("deadline rules are machine-readable", () => {
    const bergen = getCounty("nj-bergen");
    expect(bergen?.appealWindow.deadlineKind).toBe("FIXED_ANNUAL");
    expect(bergen?.appealWindow.fixedMonth).toBe(4);
    expect(bergen?.appealWindow.fixedDay).toBe(1);
    const cook = getCounty("il-cook");
    expect(cook?.appealWindow.deadlineKind).toBe("NOTICE_RELATIVE");
  });

  it("every county declares a relief model, and only corridor counties carry corridor data", () => {
    for (const c of counties) {
      expect(["GAP", "COMMON_LEVEL_RANGE"]).toContain(c.reliefModel);
      if (c.reliefModel === "COMMON_LEVEL_RANGE") {
        expect(c.commonLevelRange).toBeDefined();
      } else {
        expect(c.commonLevelRange).toBeUndefined();
      }
    }
  });

  it("Bergen's Chapter 123 corridor is encoded, and its ratio table is empty on purpose", () => {
    const clr = getCounty("nj-bergen")?.commonLevelRange;
    expect(clr?.corridorBps).toBe(1500); // ±15%, multiplicative
    expect(clr?.countyPercentageLevelBps).toBe(10_000); // 100%
    expect(clr?.republishedOn).toBe("04-01"); // republished every 1 April
    expect(clr?.sourceUrl).toMatch(/chapter123/);
    // No Director's Ratio has been read from a primary source. If this ever
    // fails, someone has added ratios — check each has a real citation and is
    // not invented. See VERIFICATION-STATUS.md.
    expect(clr?.municipalities).toEqual([]);
  });

  it("Bergen's filing fee is the statutory schedule, not a flat $25", () => {
    const fee = getCounty("nj-bergen")?.filingFee;
    expect(fee?.bands?.map((b) => b.amountCents)).toEqual([500, 2_500, 10_000, 15_000]);
    // Contiguous, ascending, open-ended at the top — the loader enforces this,
    // but a gap would silently fall back to the flat fee, so assert it here too.
    expect(fee?.bands?.[0]?.minAssessedValueCents).toBe(0);
    expect(fee?.bands?.at(-1)?.maxAssessedValueCentsExclusive).toBeNull();
  });

  it("Bergen's petition must be received, not postmarked", () => {
    const window = getCounty("nj-bergen")?.appealWindow;
    expect(window?.filingCutoff).toBe("RECEIVED_BY");
    expect(window?.filingCutoffNote).toMatch(/postmark does not count/i);
  });

  it("Bergen's form URLs are the live ones, not the 404s", () => {
    const forms = getCounty("nj-bergen")?.forms ?? [];
    const urls = forms.map((f) => f.pdfUrl);
    expect(urls).toContain("https://www.nj.gov/treasury/taxation/pdf/other_forms/lpt/petappl.pdf");
    expect(urls).toContain(
      "https://www.nj.gov/treasury/taxation/pdf/other_forms/lpt/a1compsales.pdf",
    );
    for (const url of urls) {
      expect(url).not.toMatch(/lpt\/a1\.pdf$/);
      expect(url).not.toMatch(/a1compsale\.pdf$/);
    }
  });
});

describe("synthetic demo dataset — clearly labelled, well-formed", () => {
  it("is labelled synthetic and has ~30 parcels", () => {
    expect(SAMPLE_DATA_LABEL).toMatch(/SYNTHETIC/i);
    expect(sampleParcels.length).toBeGreaterThanOrEqual(25);
  });

  it("every parcel has integer-cent money and complete attributes", () => {
    for (const p of sampleParcels) {
      expect(Number.isInteger(p.assessedValueCents)).toBe(true);
      if (p.lastSalePriceCents !== undefined) {
        expect(Number.isInteger(p.lastSalePriceCents)).toBe(true);
        expect(p.lastSaleDate).toBeDefined();
      }
      expect(p.sqft).toBeGreaterThan(0);
      expect(p.yearBuilt).toBeGreaterThan(1900);
    }
  });
});
