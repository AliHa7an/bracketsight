/**
 * Golden cases from the ClearPaycheck spec §1.4.
 *
 * NOTE: expected values are computed against the 2026 PLACEHOLDER rules JSON
 * (brackets, phase-out rates, senior and car-loan parameters are UNVERIFIED —
 * see VERIFICATION-NEEDED.md). When the rules files are re-verified against
 * IRS primary sources, re-derive these expectations by hand and update.
 */

import { describe, expect, it } from "vitest";
import { EngineInputError, computeDeductions } from "@/engines/paycheck";
import type { DeductionResult, EngineResult, HouseholdInput } from "@/engines/paycheck";

function deduction(result: EngineResult, id: DeductionResult["id"]): DeductionResult {
  const d = result.deductions.find((x) => x.id === id);
  if (!d) throw new Error(`missing deduction ${id}`);
  return d;
}

describe("golden — spec §1.4 worked cases", () => {
  it("server: $30k wages + $8k tips, single → full deduction, $960 saved at 12%", () => {
    const input: HouseholdInput = {
      taxYear: 2026,
      filingStatus: "SINGLE",
      wagesCents: 3_000_000,
      otherIncomeCents: 0,
      age: 28,
      tips: { amountCents: 800_000, occupationCode: "102", selfEmployed: false, properlyReported: true },
    };
    const result = computeDeductions(input);
    expect(result.magiCents).toBe(3_800_000);
    const tips = deduction(result, "TIPS");
    expect(tips.eligible).toBe(true);
    expect(tips.deductionCents).toBe(800_000); // full $8,000 — no cap, no phase-out
    expect(result.tax.marginalRateBps).toBe(1200);
    expect(result.tax.estimatedTaxSavedCents).toBe(96_000); // $8,000 × 12% = $960
  });

  it("nurse: $95k wages + $14k OT pay at 1.5× → premium $4,666.67, fully deductible", () => {
    const input: HouseholdInput = {
      taxYear: 2026,
      filingStatus: "SINGLE",
      wagesCents: 9_500_000,
      otherIncomeCents: 0,
      age: 41,
      overtime: { mode: "TOTAL_OT_PAY", totalOvertimePayCents: 1_400_000 },
    };
    const result = computeDeductions(input);
    expect(result.magiCents).toBe(10_900_000); // $95k + $14k gross OT
    const ot = deduction(result, "OVERTIME");
    expect(ot.eligible).toBe(true);
    expect(ot.qualifiedAmountCents).toBe(466_667); // $14,000 / 3 — only the 0.5× premium
    expect(ot.deductionCents).toBe(466_667); // under the $12,500 cap, under the $150k threshold
    expect(ot.phaseOut?.reductionCents).toBe(0);
  });

  it("engineer: $160k MAGI single with overtime → phase-out applied", () => {
    const input: HouseholdInput = {
      taxYear: 2026,
      filingStatus: "SINGLE",
      wagesCents: 14_500_000, // $145k base
      otherIncomeCents: 0,
      age: 35,
      // 200 OT hours at $50/hr → $15,000 gross OT pay → MAGI $160,000
      overtime: { mode: "HOURS_RATE", overtimeHours: 200, regularHourlyRateCents: 5_000 },
    };
    const result = computeDeductions(input);
    expect(result.magiCents).toBe(16_000_000);
    const ot = deduction(result, "OVERTIME");
    expect(ot.qualifiedAmountCents).toBe(500_000); // premium = 200 × $50 × 0.5 = $5,000
    expect(ot.phaseOut?.excessCents).toBe(1_000_000); // $10k over $150k
    expect(ot.phaseOut?.reductionCents).toBe(100_000); // $100 per $1,000 over → $1,000
    expect(ot.deductionCents).toBe(400_000); // $4,000
    expect(result.primaryPhaseOut.distanceToThresholdCents).toBe(-1_000_000);
  });

  it("joint $310k: modest tips + overtime + car loan → everything phased out to $0", () => {
    const input: HouseholdInput = {
      taxYear: 2026,
      filingStatus: "MARRIED_JOINT",
      wagesCents: 24_000_000, // $240k
      otherIncomeCents: 6_670_000, // $66,700
      age: 45,
      spouseAge: 44,
      tips: { amountCents: 90_000, occupationCode: "101", selfEmployed: false, properlyReported: true }, // $900
      overtime: { mode: "TOTAL_OT_PAY", totalOvertimePayCents: 240_000 }, // $2,400 → $800 premium
      carLoan: {
        interestPaidCents: 400_000, // $4,000
        isNewVehicle: true,
        finalAssemblyInUS: true,
        loanOriginationDate: "2026-03-01",
        personalUse: true,
      },
    };
    const result = computeDeductions(input);
    expect(result.magiCents).toBe(31_000_000); // $310,000
    expect(deduction(result, "TIPS").deductionCents).toBe(0); // $900 − $1,000 reduction → 0
    expect(deduction(result, "OVERTIME").deductionCents).toBe(0); // $800 − $1,000 → 0
    expect(deduction(result, "CAR_LOAN").deductionCents).toBe(0); // $110k over $200k → gone
    expect(result.totalDeductionCents).toBe(0);
    expect(result.tax.estimatedTaxSavedCents).toBe(0);
  });

  it("self-employed gig driver with reported tips → eligible", () => {
    const input: HouseholdInput = {
      taxYear: 2026,
      filingStatus: "SINGLE",
      wagesCents: 0,
      otherIncomeCents: 4_200_000, // $42,000 net self-employment income
      age: 33,
      tips: { amountCents: 650_000, occupationCode: "802", selfEmployed: true, properlyReported: true },
    };
    const result = computeDeductions(input);
    const tips = deduction(result, "TIPS");
    expect(tips.eligible).toBe(true);
    expect(tips.deductionCents).toBe(650_000); // $6,500
    expect(result.tax.estimatedTaxSavedCents).toBe(78_000); // $6,500 × 12% = $780
    expect(tips.notes.join(" ")).toMatch(/net income/i); // self-employed limit surfaced
  });

  it("65+ retiree: $80k MAGI single → senior deduction with MAGI phase-out applied", () => {
    const input: HouseholdInput = {
      taxYear: 2026,
      filingStatus: "SINGLE",
      wagesCents: 0,
      otherIncomeCents: 8_000_000, // $80,000 pension + withdrawals
      age: 68,
    };
    const result = computeDeductions(input);
    const senior = deduction(result, "SENIOR");
    expect(senior.eligible).toBe(true);
    expect(senior.qualifiedAmountCents).toBe(600_000); // $6,000 placeholder amount
    expect(senior.phaseOut?.reductionCents).toBe(30_000); // 6% × $5,000 excess = $300
    expect(senior.deductionCents).toBe(570_000); // $5,700
  });
});

describe("engine result contract", () => {
  const input: HouseholdInput = {
    taxYear: 2026,
    filingStatus: "MARRIED_JOINT",
    wagesCents: 29_500_000,
    otherIncomeCents: 0,
    age: 40,
    tips: { amountCents: 500_000, occupationCode: "101", selfEmployed: false, properlyReported: true },
  };

  it("the next $1,000 of income can cost more than its bracket — the phase-out cliff", () => {
    // MAGI exactly $300,000 joint (wages $295k + $5k tips). One more $1,000 of
    // income triggers one phase-out step: the tips deduction shrinks by $100,
    // so taxable income rises $1,100, not $1,000 — an effective marginal rate
    // above the statutory 24% bracket.
    const result = computeDeductions(input);
    expect(result.magiCents).toBe(30_000_000);
    expect(result.totalDeductionCents).toBe(500_000); // untouched at the threshold
    // +$1,000 income → 1 step → $100 of deduction lost
    expect(result.marginalNext1000.deductionsLostCents).toBe(10_000);
    // effective marginal rate must exceed the statutory 24% bracket
    expect(result.marginalNext1000.effectiveMarginalRateBps).toBeGreaterThan(2400);
  });

  it("always surfaces the FICA caveat and rule-set metadata", () => {
    const result = computeDeductions(input);
    expect(result.ficaNote).toMatch(/FICA/);
    expect(result.meta.ruleSetVersion).toContain("tips-2026");
    // Placeholder rules are still unverified — the build must know it.
    expect(result.meta.unverifiedRuleSets.length).toBeGreaterThan(0);
  });

  it("rejects float cents loudly", () => {
    expect(() =>
      computeDeductions({ ...input, wagesCents: 100.5 }),
    ).toThrow(EngineInputError);
  });

  it("rejects unsupported tax years", () => {
    expect(() => computeDeductions({ ...input, taxYear: 2031 })).toThrow(/tax year/i);
  });
});
