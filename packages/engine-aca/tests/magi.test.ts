import { describe, expect, it } from "vitest";
import { buildMagi } from "@engine";

describe("magi — §36B modified adjusted gross income", () => {
  it("adds the three §36B add-backs to AGI", () => {
    const b = buildMagi({
      agi: 6_000_000,
      taxExemptInterest: 50_000,
      excludedForeignIncome: 0,
      nonTaxableSocialSecurity: 240_000,
    });
    expect(b.magi).toBe(6_290_000);
  });

  it("rejects float dollars — money is integer cents", () => {
    expect(() =>
      buildMagi({
        agi: 60_000.5,
        taxExemptInterest: 0,
        excludedForeignIncome: 0,
        nonTaxableSocialSecurity: 0,
      }),
    ).toThrow(/integer cents/);
  });

  it("rejects negative add-backs", () => {
    expect(() =>
      buildMagi({
        agi: 6_000_000,
        taxExemptInterest: -1,
        excludedForeignIncome: 0,
        nonTaxableSocialSecurity: 0,
      }),
    ).toThrow(/negative/);
  });
});
