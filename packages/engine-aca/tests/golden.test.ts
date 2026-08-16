/**
 * Golden tests — spec §1.3.
 *
 * Scenario shapes come from the tool spec (constructed to mirror the KFF
 * calculator and Form 8962 instruction examples). Because the 2026
 * applicable-percentage table, 2025 FPL guidelines, and SLCSP premiums are
 * placeholder/sample data (see VERIFICATION-NEEDED.md), the *expected values
 * below are derived from the encoded rules* — they lock the formula and the
 * rounding, and must be re-derived once primary-source values land.
 */

import { describe, expect, it } from "vitest";
import {
  analyzeHousehold,
  buildMagi,
  getRules,
  ptcAtMagi,
  sehiIterative,
} from "@engine";
import type { CliffAnalysisInput, Household } from "@engine";

const rules = getRules();

const income = (agi: number) => ({
  agi,
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

describe("GOLDEN 1 — single 60-year-old at 399% vs 401% FPL (the cliff delta)", () => {
  it("399%: full credit of $8,756.28", () => {
    const a = analyzeHousehold({
      household: single60Travis,
      income: income(6_250_000), // $62,500 → 399% of $15,650
    });
    expect(a.ptc.status).toBe("ELIGIBLE");
    expect(a.ptc.fplPctForm).toBe(399);
    expect(a.ptc.annualPtc).toBe(875_628);
    expect(a.cliff.overCliff).toBe(false);
    // CHANGED — was 25_649 ("$256.49 below the cliff"). Form 8962 Worksheet 2
    // step 4 tests "more than 4.0 × FPL" BEFORE truncating, so the edge is
    // 4 × $15,650 = $62,600, not $62,756.49. Room left:
    //   6_260_000 − 6_250_000 = 10_000 cents = $100.00.
    expect(a.cliff.cliffEdgeMagi).toBe(6_260_000);
    expect(a.cliff.distanceToEdge).toBe(10_000);
  });

  it("401%: $0 — one raise, entire credit gone", () => {
    const a = analyzeHousehold({
      household: single60Travis,
      income: income(6_290_000), // $62,900 → 401%
    });
    expect(a.ptc.status).toBe("CLIFF");
    expect(a.ptc.annualPtc).toBe(0);
    expect(a.cliff.overCliff).toBe(true);
    // CHANGED — was 14_351 ($143.51 over). Against the true edge of $62,600:
    //   6_290_000 − 6_260_000 = 30_000 cents = $300.00 over.
    expect(a.cliff.distanceToEdge).toBe(30_000);
    // CHANGED — was 873_073. The credit waiting at the corrected edge:
    //   benchmark $14,981.28 − 9.96% × $62,600
    //   = 1_498_128 − mulBps(6_260_000, 996)
    //   = 1_498_128 − 623_496 = 874_632 → $8,746.32.
    expect(a.cliff.creditAtStake).toBe(874_632);
  });

  it("400.9%: over the edge, credit gone — no sub-1% grace band", () => {
    // NEW TEST. 4.009 × $15,650 = $62,740.85. The engine used to truncate that
    // to 400 and report a full credit; Form 8962 Worksheet 2 enters 401 and
    // line 6 says "you are not eligible for the PTC". Distance over the edge:
    //   6_274_085 − 6_260_000 = 14_085 cents = $140.85.
    const a = analyzeHousehold({
      household: single60Travis,
      income: income(6_274_085),
    });
    expect(a.ptc.fplPctForm).toBe(401);
    expect(a.ptc.status).toBe("CLIFF");
    expect(a.ptc.annualPtc).toBe(0);
    expect(a.cliff.overCliff).toBe(true);
    expect(a.cliff.distanceToEdge).toBe(14_085);
  });

  it("the delta: $400 more income costs $8,756.28 of credit", () => {
    const under = analyzeHousehold({ household: single60Travis, income: income(6_250_000) });
    const over = analyzeHousehold({ household: single60Travis, income: income(6_290_000) });
    expect(under.ptc.annualPtc - over.ptc.annualPtc).toBe(875_628);
  });
});

describe("GOLDEN 2 — family of four at the 250% CSR boundary", () => {
  const family4Cook: Household = {
    filingStatus: "MARRIED_JOINT",
    familySize: 4,
    stateCode: "IL",
    countyId: "cook-il",
    coveredMemberAges: [45, 43, 12, 9],
  };

  it("exactly 250%: 73% AV Silver band and the credit", () => {
    const a = analyzeHousehold({
      household: family4Cook,
      income: income(8_037_500), // exactly 250% of $32,150
    });
    expect(a.ptc.fplPctForm).toBe(250);
    expect(a.csr.band).toBe("73");
    expect(a.csr.actuarialValueBps).toBe(7_300);
    expect(a.ptc.annualPtc).toBe(1_322_575);
  });

  it("one point over 250%: the whole CSR band drops, credit barely moves", () => {
    const a = analyzeHousehold({
      household: family4Cook,
      income: income(8_070_000), // 251%
    });
    expect(a.ptc.fplPctForm).toBe(251);
    expect(a.csr.band).toBeNull();
    expect(a.ptc.annualPtc).toBe(1_317_411);
    expect(a.cliff.distanceToCsrEdge).toBeLessThan(0); // past the ledge
  });
});

describe("GOLDEN 3 — self-employed circular case (Rev. Proc. 2014-41)", () => {
  const base = 6_400_000; // $64,000 MAGI before the SEHI deduction → 408% FPL
  const premium = 1_320_000; // $13,200/yr marketplace premium
  const seProfit = 9_000_000;

  it("the iteration converges within tolerance", () => {
    const r = sehiIterative(base, premium, 8_364_170, single60Travis, rules);
    expect(r.converged).toBe(true);
    expect(r.iterations).toBeLessThanOrEqual(50);
    // Self-consistency: deduction ≈ premium − PTC(magi − deduction), within $1.
    const ptc = ptcAtMagi(base - r.deduction, single60Travis, rules);
    expect(Math.abs(premium - ptc - r.deduction)).toBeLessThanOrEqual(100);
    // Analytical fixed point: d = (premium − benchmark + 9.96%·baseMagi) / 1.0996
    //   = (1,320,000 − 1,498,128 + 637,440) / 1.0996 ≈ 417,708 cents ($4,177.08).
    expect(Math.abs(r.deduction - 417_708)).toBeLessThanOrEqual(200);
  });

  it("the SEHI lever pulls the household back under the cliff", () => {
    const a = analyzeHousehold({
      household: single60Travis,
      income: income(base),
      levers: {
        age: 60,
        selfEmploymentNetProfit: seProfit,
        annualHealthPremium: premium,
      },
    });
    expect(a.ptc.status).toBe("CLIFF"); // before the deduction
    const sehi = a.levers.find((l) => l.id === "SE_HEALTH_INSURANCE");
    expect(sehi?.eligible).toBe(true);
    expect(sehi?.fplPctFormAfter).toBeLessThanOrEqual(400);
    expect(sehi?.creditRecovered).toBeGreaterThan(0);
    expect(sehi?.sentence).toMatch(/self-employed health insurance deduction/);
  });
});

describe("GOLDEN 4 — advance credit taken all year, income lands at 405%", () => {
  it("full clawback: every advance dollar is repaid, uncapped", () => {
    const a = analyzeHousehold({
      household: single60Travis,
      income: income(6_350_000), // 405% FPL
      aptcMonthly: 70_000, // $700/mo advance
    });
    expect(a.ptc.status).toBe("CLIFF");
    expect(a.clawback).not.toBeNull();
    expect(a.clawback?.excessAdvance).toBe(840_000);
    expect(a.clawback?.repaymentDue).toBe(840_000); // all $8,400
    expect(a.clawback?.uncapped).toBe(true);
    expect(a.clawback?.capApplied).toBeNull();
  });

  it("no contrast left: the same advance under 400% is repaid in full", () => {
    const a = analyzeHousehold({
      household: single60Travis,
      income: income(5_500_000), // 351% FPL
      aptcMonthly: 120_000, // $1,200/mo advance — deliberately oversized
    });
    // CHANGED — was uncapped false, repaymentDue 165_000 (the old 300–<400%
    // single cap). OBBBA (Pub. L. 119-21) §71305 struck IRC §36B(f)(2)(B) for
    // tax years beginning after 2025, so nothing caps this household:
    //   final credit at $55,000 MAGI: 55_000_00 × 9.96% = 547_800;
    //     benchmark 1_498_128 − 547_800 = 950_328
    //   excess: advance 120_000 × 12 = 1_440_000 − 950_328 = 489_672
    // $4,896.72 repaid, not $1,650.
    expect(a.clawback?.uncapped).toBe(true);
    expect(a.clawback?.excessAdvance).toBe(489_672);
    expect(a.clawback?.repaymentDue).toBe(489_672);
    expect(a.clawback?.capApplied).toBeNull();
  });
});

describe("GOLDEN 5 — below 138% FPL: expansion vs non-expansion state", () => {
  const base: Omit<CliffAnalysisInput, "household"> = {
    income: income(2_000_000), // $20,000 → 127% FPL (single)
  };

  it("expansion state (CA): Medicaid referral, no marketplace credit", () => {
    const a = analyzeHousehold({
      ...base,
      household: {
        filingStatus: "SINGLE",
        familySize: 1,
        stateCode: "CA",
        countyId: "los-angeles-ca",
        coveredMemberAges: [45],
      },
    });
    expect(a.ptc.status).toBe("MEDICAID_REFERRAL");
    expect(a.ptc.annualPtc).toBe(0);
    expect(a.ptc.notes[0]).toMatch(/Medicaid/);
  });

  it("non-expansion state (TX): PTC-eligible from 100% FPL", () => {
    const a = analyzeHousehold({
      ...base,
      household: {
        filingStatus: "SINGLE",
        familySize: 1,
        stateCode: "TX",
        countyId: "travis-tx",
        coveredMemberAges: [45],
      },
    });
    expect(a.ptc.status).toBe("ELIGIBLE");
    expect(a.ptc.fplPctForm).toBe(127);
    expect(a.ptc.annualPtc).toBe(755_088);
  });

  it("non-expansion below 100%: the coverage gap", () => {
    const a = analyzeHousehold({
      household: {
        filingStatus: "SINGLE",
        familySize: 1,
        stateCode: "TX",
        countyId: "travis-tx",
        coveredMemberAges: [45],
      },
      income: income(1_400_000), // 89% FPL
    });
    expect(a.ptc.status).toBe("COVERAGE_GAP");
    expect(a.ptc.annualPtc).toBe(0);
  });
});

describe("meta — every analysis is versioned and reproducible", () => {
  it("stamps engine and rule-set versions", () => {
    const a = analyzeHousehold(
      { household: single60Travis, income: income(6_250_000) },
      new Date("2026-08-08T00:00:00Z"),
    );
    expect(a.meta.engineVersion).toBe("0.1.0");
    expect(a.meta.ruleSetVersion).toBe("cliffcheck-rules-2026.draft-1");
    expect(a.meta.computedAt).toBe("2026-08-08T00:00:00.000Z");
  });

  it("buildMagi flows into the analysis unchanged", () => {
    const a = analyzeHousehold({
      household: single60Travis,
      income: {
        agi: 6_000_000,
        taxExemptInterest: 150_000,
        excludedForeignIncome: 0,
        nonTaxableSocialSecurity: 100_000,
      },
    });
    expect(a.magi.magi).toBe(6_250_000);
    expect(a.magi).toEqual(
      buildMagi({
        agi: 6_000_000,
        taxExemptInterest: 150_000,
        excludedForeignIncome: 0,
        nonTaxableSocialSecurity: 100_000,
      }),
    );
  });
});
