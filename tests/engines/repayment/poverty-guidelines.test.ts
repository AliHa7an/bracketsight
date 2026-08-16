/**
 * The 2026 HHS poverty guidelines.
 *
 * These six numbers move every IBR, PAYE and ICR payment the engine computes,
 * and they expire every January. The file previously held the 2025 table; the
 * values below are the 2026 table verified against ASPE on 2026-08-15
 * (published in the Federal Register 15 Jan 2026).
 *
 * Student-loan IDR uses the guidelines CURRENTLY IN EFFECT — 34 C.F.R.
 * § 685.209(b)(14), which points at the figures published annually under
 * 42 U.S.C. 9902(2). That is not the ACA rule, which uses the prior year's
 * table; do not "harmonise" the two.
 */

import { describe, expect, it } from "vitest";
import { fplCents, idrMonthlyPayment } from "@/engines/repayment/plans/shared";
import { resolveRules } from "@/engines/repayment/rules/index";
import { makeHousehold } from "./helpers";

const { poverty } = resolveRules("2026-08-08");

describe("2026 guideline values, as published", () => {
  it("48 contiguous states and DC: $15,960 first person, $5,680 each additional", () => {
    expect(poverty.guidelines.CONTIGUOUS_48.firstPersonCents).toBe(1_596_000);
    expect(poverty.guidelines.CONTIGUOUS_48.additionalPersonCents).toBe(568_000);
  });

  it("Alaska: $19,950 first person, $7,100 each additional", () => {
    expect(poverty.guidelines.ALASKA.firstPersonCents).toBe(1_995_000);
    expect(poverty.guidelines.ALASKA.additionalPersonCents).toBe(710_000);
  });

  it("Hawaii: $18,360 first person, $6,530 each additional", () => {
    expect(poverty.guidelines.HAWAII.firstPersonCents).toBe(1_836_000);
    expect(poverty.guidelines.HAWAII.additionalPersonCents).toBe(653_000);
  });

  it("is not the stale 2025 table it used to be", () => {
    // The exact wrong numbers, named so a future carry-forward is caught.
    expect(poverty.guidelines.CONTIGUOUS_48.firstPersonCents).not.toBe(1_565_000);
    expect(poverty.guidelines.ALASKA.firstPersonCents).not.toBe(1_955_000);
    expect(poverty.guidelines.HAWAII.firstPersonCents).not.toBe(1_799_000);
  });

  it("carries a citation and effective dating (invariant 3)", () => {
    expect(poverty.citations.length).toBeGreaterThan(0);
    expect(poverty.citations[0]?.url).toMatch(/^https:\/\/aspe\.hhs\.gov\//);
    expect(poverty.citations[0]?.lastVerified).toBe("2026-08-15");
  });
});

describe("fplCents — first person plus one increment per additional person", () => {
  it("scales the contiguous-48 figure with family size", () => {
    // family of 3 = $15,960 + 2 × $5,680 = $27,320.00
    expect(fplCents(poverty, "CONTIGUOUS_48", 1)).toBe(1_596_000);
    expect(fplCents(poverty, "CONTIGUOUS_48", 3)).toBe(2_732_000);
  });

  it("scales the Alaska figure with family size", () => {
    // family of 2 = $19,950 + $7,100 = $27,050.00
    expect(fplCents(poverty, "ALASKA", 2)).toBe(2_705_000);
  });

  it("scales the Hawaii figure with family size", () => {
    // family of 4 = $18,360 + 3 × $6,530 = $37,950.00
    expect(fplCents(poverty, "HAWAII", 4)).toBe(3_795_000);
  });
});

describe("the correction lowers every income-driven payment", () => {
  it("$55,000 single filer, Old IBR: $394.06 → $388.25", () => {
    //   protected     = 150% × $15,960    = $23,940.00 = 2,394,000c
    //   discretionary = $55,000 − $23,940 = $31,060.00 = 3,106,000c
    //   3,106,000 × 15% ÷ 12              = 38,825c exactly
    const household = makeHousehold();
    expect(idrMonthlyPayment(household.agi, household, poverty, 150, 15)).toBe(38_825);
  });

  it("$55,000 single filer, ICR at 100% of the guideline: $655.83 → $650.67", () => {
    //   discretionary = $55,000 − $15,960 = $39,040.00 = 3,904,000c
    //   3,904,000 × 20% ÷ 12              = 65,066.66…c → 65,067c
    const household = makeHousehold();
    expect(idrMonthlyPayment(household.agi, household, poverty, 100, 20)).toBe(65_067);
  });

  it("a Hawaii family of 4 on $55,000 pays less than the same family in Ohio", () => {
    //   Hawaii guideline = $18,360 + 3 × $6,530 = $37,950.00
    //          protected = 150% × $37,950       = $56,925.00, above the AGI,
    //          so discretionary clamps to $0 and the payment is $0.
    //   Ohio   guideline = $15,960 + 3 × $5,680 = $33,000.00
    //          protected = 150% × $33,000       = $49,500.00
    //          discretionary = $55,000 − $49,500 = $5,500.00 = 550,000c
    //          550,000 × 10% ÷ 12 = 4,583.33…c → 4,583c
    const hawaii = makeHousehold({ familySize: 4, stateGroup: "HAWAII" });
    const ohio = makeHousehold({ familySize: 4, stateGroup: "CONTIGUOUS_48" });
    expect(fplCents(poverty, "HAWAII", 4)).toBe(3_795_000);
    expect(fplCents(poverty, "CONTIGUOUS_48", 4)).toBe(3_300_000);
    expect(idrMonthlyPayment(hawaii.agi, hawaii, poverty, 150, 10)).toBe(0);
    expect(idrMonthlyPayment(ohio.agi, ohio, poverty, 150, 10)).toBe(4_583);
  });
});
