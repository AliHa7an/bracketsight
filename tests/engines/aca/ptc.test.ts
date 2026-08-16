import { describe, expect, it } from "vitest";
import {
  applicablePercentageBps,
  benchmarkAnnualPremium,
  buildMagi,
  computePtc,
  getRules,
} from "@/engines/aca";
import type { Household } from "@/engines/aca";

const rules = getRules();

const magiOf = (cents: number) =>
  buildMagi({
    agi: cents,
    taxExemptInterest: 0,
    excludedForeignIncome: 0,
    nonTaxableSocialSecurity: 0,
  });

const single60Travis: Household = {
  filingStatus: "SINGLE",
  familySize: 1,
  stateCode: "TX",
  countyId: "travis-tx",
  coveredMemberAges: [60],
};

describe("applicable percentage — band lookup and interpolation", () => {
  it("is flat 2.10% below 133%", () => {
    expect(applicablePercentageBps(100, rules)).toBe(210);
    expect(applicablePercentageBps(132, rules)).toBe(210);
  });

  it("interpolates linearly inside a band, rounding to whole bps", () => {
    expect(applicablePercentageBps(133, rules)).toBe(314);
    // 175%: 419 + (25/50)×(660−419) = 419 + 120.5 → 419 + 121 = 540
    expect(applicablePercentageBps(175, rules)).toBe(540);
    // 149%: 314 + (16/17)×105 = 314 + 98.8 → 413
    expect(applicablePercentageBps(149, rules)).toBe(413);
  });

  it("hits band boundaries exactly", () => {
    expect(applicablePercentageBps(150, rules)).toBe(419);
    expect(applicablePercentageBps(200, rules)).toBe(660);
    expect(applicablePercentageBps(250, rules)).toBe(844);
  });

  it("caps at 9.96% for the 300–400 band, inclusive of 400", () => {
    expect(applicablePercentageBps(300, rules)).toBe(996);
    expect(applicablePercentageBps(400, rules)).toBe(996);
  });
});

describe("benchmark premium — SLCSP sample table with federal age curve", () => {
  it("prices a 60-year-old in Travis County", () => {
    // $460.00 × 2.714 = $1,248.44/mo → $14,981.28/yr
    expect(benchmarkAnnualPremium("travis-tx", [60], rules)).toBe(1_498_128);
  });

  it("sums per-member premiums for a couple", () => {
    // 60 → 124,844; 58 → 46,000 × 2.548 = 117,208; total 242,052/mo
    expect(benchmarkAnnualPremium("travis-tx", [60, 58], rules)).toBe(
      242_052 * 12,
    );
  });

  it("refuses unknown counties instead of guessing", () => {
    expect(() => benchmarkAnnualPremium("nowhere-zz", [40], rules)).toThrow(
      /sample SLCSP/,
    );
  });
});

describe("computePtc — §36B", () => {
  it("computes the credit for an eligible household", () => {
    const r = computePtc(magiOf(6_250_000), single60Travis, rules);
    expect(r.status).toBe("ELIGIBLE");
    expect(r.fplPctForm).toBe(399);
    expect(r.applicableBps).toBe(996);
    expect(r.expectedAnnualContribution).toBe(622_500);
    expect(r.annualPtc).toBe(1_498_128 - 622_500); // $8,756.28
  });

  it("never pays a negative credit when the contribution exceeds the premium", () => {
    // Young enrollee, cheap benchmark, income near 400% → contribution wins.
    const young: Household = { ...single60Travis, coveredMemberAges: [26] };
    const r = computePtc(magiOf(6_250_000), young, rules);
    expect(r.status).toBe("ELIGIBLE");
    expect(r.annualPtc).toBe(0);
  });

  it("bars married-filing-separately with a note, not silence", () => {
    const r = computePtc(
      magiOf(4_000_000),
      { ...single60Travis, filingStatus: "MARRIED_SEPARATE", familySize: 2 },
      rules,
    );
    expect(r.status).toBe("FILING_STATUS_INELIGIBLE");
    expect(r.annualPtc).toBe(0);
    expect(r.notes[0]).toMatch(/36B/);
  });
});
