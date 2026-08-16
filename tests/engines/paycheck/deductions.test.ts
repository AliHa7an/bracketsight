import { describe, expect, it } from "vitest";
import {
  computeCarLoanDeduction,
  computeOvertimeDeduction,
  computeSeniorDeduction,
  computeTipsDeduction,
  overtimePremiumCents,
  resolveRules,
} from "@/engines/paycheck";
import type { HouseholdInput } from "@/engines/paycheck";

const rules = resolveRules(2026);

function base(over: Partial<HouseholdInput> = {}): HouseholdInput {
  return {
    taxYear: 2026,
    filingStatus: "SINGLE",
    wagesCents: 5_000_000,
    otherIncomeCents: 0,
    age: 30,
    ...over,
  };
}

describe("overtime premium computation", () => {
  it("HOURS_RATE: 100 hours at $50/hr → $2,500 premium (the 0.5×, not the 1.5×)", () => {
    const input = base({
      overtime: { mode: "HOURS_RATE", overtimeHours: 100, regularHourlyRateCents: 5_000 },
    });
    expect(overtimePremiumCents(input, rules.overtime)).toBe(250_000);
  });

  it("TOTAL_OT_PAY: $14,000 at time-and-a-half → $4,666.67 premium", () => {
    const input = base({
      overtime: { mode: "TOTAL_OT_PAY", totalOvertimePayCents: 1_400_000 },
    });
    expect(overtimePremiumCents(input, rules.overtime)).toBe(466_667);
  });

  it("caps at $12,500 single", () => {
    const input = base({
      wagesCents: 3_000_000,
      overtime: { mode: "TOTAL_OT_PAY", totalOvertimePayCents: 4_500_000 }, // $15k premium
    });
    const result = computeOvertimeDeduction(input, 7_500_000, rules.overtime);
    expect(result.qualifiedAmountCents).toBe(1_500_000);
    expect(result.deductionCents).toBe(1_250_000);
  });

  it("caps at $25,000 joint", () => {
    const input = base({
      filingStatus: "MARRIED_JOINT",
      overtime: { mode: "TOTAL_OT_PAY", totalOvertimePayCents: 9_000_000 }, // $30k premium
    });
    const result = computeOvertimeDeduction(input, 14_000_000, rules.overtime);
    expect(result.deductionCents).toBe(2_500_000);
  });

  it("married filing separately is ineligible", () => {
    const input = base({
      filingStatus: "MARRIED_SEPARATE",
      overtime: { mode: "TOTAL_OT_PAY", totalOvertimePayCents: 300_000 },
    });
    const result = computeOvertimeDeduction(input, 6_000_000, rules.overtime);
    expect(result.eligible).toBe(false);
    expect(result.deductionCents).toBe(0);
  });
});

describe("tips deduction eligibility", () => {
  it("requires a qualified occupation", () => {
    const input = base({
      tips: { amountCents: 500_000, occupationCode: "999", selfEmployed: false, properlyReported: true },
    });
    const result = computeTipsDeduction(input, 5_500_000, rules.tips, rules.occupations);
    expect(result.eligible).toBe(false);
    expect(result.deductionCents).toBe(0);
  });

  it("requires properly reported tips", () => {
    const input = base({
      tips: { amountCents: 500_000, occupationCode: "102", selfEmployed: false, properlyReported: false },
    });
    const result = computeTipsDeduction(input, 5_500_000, rules.tips, rules.occupations);
    expect(result.eligible).toBe(false);
  });

  it("caps at $25,000", () => {
    const input = base({
      tips: { amountCents: 3_000_000, occupationCode: "101", selfEmployed: false, properlyReported: true },
    });
    const result = computeTipsDeduction(input, 8_000_000, rules.tips, rules.occupations);
    expect(result.deductionCents).toBe(2_500_000);
  });

  it("married filing separately is ineligible", () => {
    const input = base({
      filingStatus: "MARRIED_SEPARATE",
      tips: { amountCents: 500_000, occupationCode: "102", selfEmployed: false, properlyReported: true },
    });
    const result = computeTipsDeduction(input, 5_500_000, rules.tips, rules.occupations);
    expect(result.eligible).toBe(false);
  });

  // Authority: Schedule 1-A (Form 1040) line 11 — a partial $1,000 step is
  // DECREASED to the next lower whole number. IRC § 224(b)(2)(A) has no "or
  // portion thereof". The engine previously rounded the step up, which
  // overstated the phase-out by $100 and understated the deduction.
  //
  // Derivation by hand:
  //   tips claimed  $5,000.00     = 500,000 cents (under the $25,000 cap)
  //   MAGI          $153,500.00   = 15,350,000 cents
  //   threshold     $150,000.00   = 15,000,000 cents  (single)
  //   line 10       excess = 15,350,000 − 15,000,000 = 350,000 cents = $3,500
  //   line 11       $3,500 ÷ $1,000 = 3.5 → decrease to 3
  //   line 12       3 × $100 = $300 = 30,000 cents
  //   line 13       $5,000 − $300 = $4,700 = 470,000 cents
  // Under the old round-up behaviour this was 4 steps → $400 → $4,600.
  it("a partial $1,000 step rounds DOWN: $153,500 MAGI on $5,000 tips → $4,700", () => {
    const input = base({
      tips: { amountCents: 500_000, occupationCode: "102", selfEmployed: false, properlyReported: true },
    });
    const result = computeTipsDeduction(input, 15_350_000, rules.tips, rules.occupations);
    expect(result.eligible).toBe(true);
    expect(result.phaseOut?.excessCents).toBe(350_000); // $3,500
    expect(result.phaseOut?.reductionCents).toBe(30_000); // 3 steps × $100
    expect(result.deductionCents).toBe(470_000); // $4,700
  });
});

describe("senior deduction", () => {
  it("not available under 65", () => {
    const result = computeSeniorDeduction(base({ age: 64 }), 5_000_000, rules.senior);
    expect(result.claimed).toBe(false);
    expect(result.deductionCents).toBe(0);
  });

  it("doubles when both joint spouses are 65+", () => {
    // Unchanged by the 2026-08-15 order-of-operations fix: MAGI $100,000 is
    // below the $150,000 joint threshold, so there is no excess to apportion.
    const input = base({ filingStatus: "MARRIED_JOINT", age: 66, spouseAge: 67 });
    const result = computeSeniorDeduction(input, 10_000_000, rules.senior);
    expect(result.qualifiedAmountCents).toBe(1_200_000);
    expect(result.deductionCents).toBe(1_200_000);
  });

  // Authority: IRC § 151(d)(5)(C)(iii)(I) reduces "the $6,000 amount in clause
  // (i)" — the PER-INDIVIDUAL amount — and Schedule 1-A lines 33-37 enter that
  // single reduced figure once per qualifying spouse. So a two-senior joint
  // return loses 2 × 6% of the excess, not 6%. The engine previously applied
  // the 6% once against the doubled $12,000 and returned $9,000.
  //
  // Derivation by hand (joint, both 65+, MAGI $200,000):
  //   line 31  MAGI            $200,000
  //   line 32  threshold       $150,000  (joint)
  //   line 33  excess          $200,000 − $150,000 = $50,000
  //   line 34  6% of excess    0.06 × $50,000 = $3,000
  //   line 35  $6,000 − $3,000 = $3,000        ← per person
  //   line 36a $3,000   line 36b $3,000        ← once per qualifying spouse
  //   line 37  $3,000 + $3,000 = $6,000 = 600,000 cents
  // Old (wrong): $12,000 − 0.06 × $50,000 = $12,000 − $3,000 = $9,000.
  it("two-senior joint return at $200,000 MAGI is $6,000, not $9,000", () => {
    const input = base({ filingStatus: "MARRIED_JOINT", age: 66, spouseAge: 67 });
    const result = computeSeniorDeduction(input, 20_000_000, rules.senior);
    expect(result.eligible).toBe(true);
    expect(result.qualifiedAmountCents).toBe(1_200_000); // $12,000 before phase-out
    expect(result.phaseOut?.excessCents).toBe(5_000_000); // $50,000
    expect(result.phaseOut?.reductionCents).toBe(600_000); // 2 × $3,000 household total
    expect(result.deductionCents).toBe(600_000); // $6,000
  });

  // One senior on the same $50,000 excess loses only 6% once — proving the
  // reduction scales with the number of qualifying persons rather than being
  // applied once to a doubled amount.
  //   $6,000 − 0.06 × $50,000 = $6,000 − $3,000 = $3,000 = 300,000 cents
  it("one senior on a joint return at $200,000 MAGI is $3,000", () => {
    const input = base({ filingStatus: "MARRIED_JOINT", age: 66, spouseAge: 60 });
    const result = computeSeniorDeduction(input, 20_000_000, rules.senior);
    expect(result.phaseOut?.reductionCents).toBe(300_000); // 1 × $3,000
    expect(result.deductionCents).toBe(300_000); // $3,000
  });

  // Authority: IRC § 151(d)(5)(C)(v) — "If the taxpayer is a married individual
  // (within the meaning of section 7703), this subparagraph shall apply only if
  // the taxpayer and the taxpayer's spouse file a joint return for the taxable
  // year." Schedule 1-A instructions, Part V: "If you are married, you must
  // file a joint return with your spouse to claim this deduction." The engine
  // previously granted the deduction to a MARRIED_SEPARATE filer.
  it("married filing separately is refused even at 65+", () => {
    const input = base({ filingStatus: "MARRIED_SEPARATE", age: 70 });
    const result = computeSeniorDeduction(input, 5_000_000, rules.senior);
    expect(result.eligible).toBe(false);
    expect(result.deductionCents).toBe(0);
    expect(result.reasons.join(" ")).toMatch(/joint return/i);
  });

  // fullyPhasedOutAt is a per-person figure: each $6,000 share is gone once 6%
  // of the excess reaches $6,000, i.e. excess $100,000 → joint MAGI $250,000.
  // It must not scale with the number of spouses.
  it("both spouses' shares are fully phased out at the same $250,000 joint MAGI", () => {
    const two = computeSeniorDeduction(
      base({ filingStatus: "MARRIED_JOINT", age: 66, spouseAge: 67 }),
      20_000_000,
      rules.senior,
    );
    const one = computeSeniorDeduction(
      base({ filingStatus: "MARRIED_JOINT", age: 66, spouseAge: 60 }),
      20_000_000,
      rules.senior,
    );
    expect(two.phaseOut?.fullyPhasedOutAtCents).toBe(25_000_000);
    expect(one.phaseOut?.fullyPhasedOutAtCents).toBe(25_000_000);
  });
});

describe("car-loan interest deduction", () => {
  it("used vehicles are ineligible", () => {
    const input = base({
      carLoan: {
        interestPaidCents: 300_000,
        isNewVehicle: false,
        finalAssemblyInUS: true,
        loanOriginationDate: "2026-02-01",
        personalUse: true,
      },
    });
    const result = computeCarLoanDeduction(input, 5_000_000, rules.carLoan);
    expect(result.eligible).toBe(false);
  });

  it("loans originated before the statute window are ineligible", () => {
    const input = base({
      carLoan: {
        interestPaidCents: 300_000,
        isNewVehicle: true,
        finalAssemblyInUS: true,
        loanOriginationDate: "2024-06-01",
        personalUse: true,
      },
    });
    const result = computeCarLoanDeduction(input, 5_000_000, rules.carLoan);
    expect(result.eligible).toBe(false);
  });

  it("qualifying loan deducts interest up to the cap", () => {
    const input = base({
      carLoan: {
        interestPaidCents: 1_200_000, // $12,000 interest, cap $10,000
        isNewVehicle: true,
        finalAssemblyInUS: true,
        loanOriginationDate: "2026-02-01",
        personalUse: true,
      },
    });
    const result = computeCarLoanDeduction(input, 5_000_000, rules.carLoan);
    expect(result.eligible).toBe(true);
    expect(result.deductionCents).toBe(1_000_000);
  });
});
