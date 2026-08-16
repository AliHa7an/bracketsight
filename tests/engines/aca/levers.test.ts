import { describe, expect, it } from "vitest";
import {
  buildMagi,
  computeLevers,
  deductibleIraLimit,
  DEFAULT_LEVER_CONTEXT,
  getRules,
  halfSeTax,
  sepMaxContribution,
} from "@/engines/aca";
import type { Household, LeverContext } from "@/engines/aca";

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

const ctx = (overrides: Partial<LeverContext>): Partial<LeverContext> => ({
  ...DEFAULT_LEVER_CONTEXT,
  ...overrides,
});

describe("lever constraints", () => {
  it("401(k): remaining limit plus 50+ catch-up, capped at wages", () => {
    const levers = computeLevers(
      magiOf(6_290_000),
      single60Travis,
      ctx({ age: 52, wagesW2: 8_000_000, ytd401k: 1_000_000 }),
      rules,
    );
    const k = levers.find((l) => l.id === "TRADITIONAL_401K");
    // (24,500 + 8,000 − 10,000) = $22,500 remaining
    expect(k?.maxAvailable).toBe(2_250_000);
    expect(k?.eligible).toBe(true);
  });

  it("HSA: hard-gated on HDHP enrollment", () => {
    const noHdhp = computeLevers(
      magiOf(6_290_000),
      single60Travis,
      ctx({ hdhpCoverage: "NONE" }),
      rules,
    ).find((l) => l.id === "HSA");
    expect(noHdhp?.eligible).toBe(false);
    expect(noHdhp?.ineligibilityReasons[0]).toMatch(/HDHP|high-deductible/);

    const family56 = computeLevers(
      magiOf(6_290_000),
      single60Travis,
      ctx({ hdhpCoverage: "FAMILY", age: 56 }),
      rules,
    ).find((l) => l.id === "HSA");
    // $8,750 family + $1,000 55+ catch-up
    expect(family56?.maxAvailable).toBe(975_000);
  });

  it("IRA: ratable phase-out when covered by an employer plan", () => {
    // CHANGED — was 375_000. The rules file held the 2025 phase-out range
    // ($79k–$89k); IRS Notice 2025-67 sets the 2026 range for a covered single
    // filer at $81,000–$91,000. At MAGI $84,000 the deduction is now
    // seven tenths available, not three eighths:
    //   $7,500 × ($91,000 − $84,000) / ($91,000 − $81,000)
    //   = 750_000 × 700_000 / 1_000_000 = 525_000 → nearest $10 = $5,250.
    const { limit, phasedOut } = deductibleIraLimit(
      8_400_000,
      single60Travis,
      { ...DEFAULT_LEVER_CONTEXT, age: 40, coveredByEmployerPlan: true },
      rules,
    );
    expect(phasedOut).toBe(true);
    expect(limit).toBe(525_000); // $5,250 of the $7,500 limit
  });

  it("IRA: the 2026 phase-out band is $81,000–$91,000, not $79,000–$89,000", () => {
    // NEW TEST. Source-confirmed swap (IRS Notice 2025-67): "the deduction ...
    // is phased out for single individuals and heads of household who are
    // active participants ... between $81,000 and $91,000, increased from
    // between $79,000 and $89,000."
    const p = rules.contributionLimits.iraPhaseOut;
    expect(p.coveredSingleFromCents).toBe(8_100_000);
    expect(p.coveredSingleToCents).toBe(9_100_000);

    const covered40 = {
      ...DEFAULT_LEVER_CONTEXT,
      age: 40,
      coveredByEmployerPlan: true,
    };
    // At $80,000 — inside the OLD band, below the real one — the full $7,500
    // deduction survives. The old values wrongly phased it down to $6,750
    // ($7,500 × ($89,000 − $80,000) / $10,000).
    expect(deductibleIraLimit(8_000_000, single60Travis, covered40, rules)).toEqual({
      limit: 750_000,
      phasedOut: false,
    });
    // At $90,000 the old values reported the deduction fully dead. It is not:
    //   $7,500 × ($91,000 − $90,000) / $10,000 = $750.
    expect(deductibleIraLimit(9_000_000, single60Travis, covered40, rules)).toEqual({
      limit: 75_000,
      phasedOut: true,
    });
    // $91,000 is the true end of the band.
    expect(deductibleIraLimit(9_100_000, single60Travis, covered40, rules).limit).toBe(0);
  });

  it("SEP: 25%-net-of-contribution ceiling from self-employment profit", () => {
    // $100,000 profit → ½ SE tax $7,064.78 → 20% of the rest = $18,587.04
    expect(halfSeTax(10_000_000, rules)).toBe(706_478);
    expect(sepMaxContribution(10_000_000, rules)).toBe(1_858_704);
  });
});

describe("lever ranking and output", () => {
  it("computes the exact dollars needed to clear the cliff", () => {
    // CHANGED — was 14_351. Form 8962 Worksheet 2 tests "more than 4.0 × FPL"
    // before truncating, so the edge is 4 × $15,650 = $62,600, not $62,756.49.
    // MAGI $62,900 vs edge $62,600 → 6_290_000 − 6_260_000 = 30_000 ($300.00).
    const levers = computeLevers(
      magiOf(6_290_000),
      single60Travis,
      ctx({ age: 60, wagesW2: 5_000_000, hdhpCoverage: "SELF" }),
      rules,
    );
    const k = levers.find((l) => l.id === "TRADITIONAL_401K");
    expect(k?.amountToClearCliff).toBe(30_000);
    expect(k?.warnings.join(" ")).toMatch(/buffer below 400%/);
  });

  it("ranks recovering levers first, advisory next, ineligible last", () => {
    const levers = computeLevers(
      magiOf(6_290_000),
      single60Travis,
      ctx({ age: 60, wagesW2: 5_000_000, hdhpCoverage: "SELF" }),
      rules,
    );
    const tiers = levers.map((l) =>
      !l.eligible ? 3 : l.advisoryOnly ? 2 : l.creditRecovered > 0 ? 0 : 1,
    );
    expect([...tiers].sort((a, b) => a - b)).toEqual(tiers);
    // Recovering levers are ordered by efficiency, descending.
    const recovering = levers.filter((l) => l.creditRecovered > 0 && !l.advisoryOnly);
    for (let i = 1; i < recovering.length; i++) {
      expect(recovering[i - 1]!.recoveredPerDollarBps!).toBeGreaterThanOrEqual(
        recovering[i]!.recoveredPerDollarBps!,
      );
    }
    expect(recovering.length).toBeGreaterThanOrEqual(2);
  });

  it("generates the marketing sentence with engine-computed numbers only", () => {
    const levers = computeLevers(
      magiOf(6_290_000),
      single60Travis,
      ctx({ age: 60, hdhpCoverage: "SELF" }),
      rules,
    );
    const hsa = levers.find((l) => l.id === "HSA");
    // $4,400 + $1,000 catch-up = $5,400 available at age 60
    expect(hsa?.maxAvailable).toBe(540_000);
    expect(hsa?.sentence).toMatch(
      /^Contributing \$5,400 to an HSA moves you from 401% to \d+% FPL and recovers \$[\d,]+(\.\d{2})? of premium tax credit/,
    );
    expect(hsa?.creditRecovered).toBeGreaterThan(0);
  });

  it("income timing is advisory-only: no amounts, no auto-advice", () => {
    const timing = computeLevers(
      magiOf(6_290_000),
      single60Travis,
      undefined,
      rules,
    ).find((l) => l.id === "INCOME_TIMING");
    expect(timing?.advisoryOnly).toBe(true);
    expect(timing?.modeledAmount).toBe(0);
    expect(timing?.recoveredPerDollarBps).toBeNull();
    expect(timing?.sentence).toMatch(/tax professional/);
  });

  it("warns when a lever alone cannot clear the cliff", () => {
    // CHANGED (comment only) — the required reduction moved with the edge:
    // MAGI $75,000 − edge $62,600 = $12,400 needed, not ~$12,243. HSA
    // self-only ($4,400 at age 45) still cannot do it on its own.
    const levers = computeLevers(
      magiOf(7_500_000),
      single60Travis,
      ctx({ age: 45, hdhpCoverage: "SELF" }),
      rules,
    );
    const hsa = levers.find((l) => l.id === "HSA");
    expect(hsa?.amountToClearCliff).toBeNull();
    expect(hsa?.warnings.join(" ")).toMatch(/cannot bring you under 400%/);
  });
});
