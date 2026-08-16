import { describe, expect, it } from "vitest";
import { simulateAllPlans } from "@/engines/repayment/index";
import { rapMonthlyPayment, rapBracketPct } from "@/engines/repayment/plans/rap";
import { resolveRules } from "@/engines/repayment/rules/index";
import { amortise } from "@/engines/repayment/amortise";
import { monthlyInterest } from "@/engines/repayment/money";
import goldenCases from "./golden/rap-cases.json";
import { AS_OF, makeHousehold, makeLoan, makeStrategy } from "./helpers";

const rules = resolveRules("2026-08-08");

describe("RAP golden cases — PRODUCT-SPEC §11.5 worked examples (all eight)", () => {
  for (const c of goldenCases.cases) {
    it(`${c.name} → $${(c.expectedMonthlyCents / 100).toFixed(2)}/month [${c.source}]`, () => {
      expect(rapMonthlyPayment(c.agiCents, c.dependents, rules.rap)).toBe(
        c.expectedMonthlyCents,
      );
    });
  }
});

describe("RAP bracket function — statutory boundaries", () => {
  it("uses bracket-table boundaries: exactly $20,000 is still the 1% bracket", () => {
    expect(rapBracketPct(2_000_000, rules.rap)).toBe(1);
    expect(rapBracketPct(2_000_100, rules.rap)).toBe(2);
  });

  it("caps at 10% above $100,000 (exactly $100,000 sits in the 9% bracket)", () => {
    // Same boundary rule the $60,000 golden case forces: an exact multiple
    // belongs to the bracket it closes. Flagged in VERIFICATION-NEEDED.md.
    expect(rapBracketPct(10_000_000, rules.rap)).toBe(9);
    expect(rapBracketPct(10_000_100, rules.rap)).toBe(10);
    expect(rapBracketPct(50_000_000, rules.rap)).toBe(10);
  });
});

describe("RAP mechanics", () => {
  it("interest waiver: the balance can never grow, and waived interest is recorded", () => {
    // $10 floor payment against a large balance — interest far exceeds payment.
    const result = simulateAllPlans(
      [makeLoan({ balance: 8_000_000 })],
      makeHousehold({ agi: 2_500_000, dependentsClaimed: 2, familySize: 3 }),
      makeStrategy(),
      AS_OF,
    );
    const rap = result.plans.find((p) => p.planId === "RAP");
    expect(rap?.eligible).toBe(true);
    expect(rap?.firstMonthlyPayment).toBe(1_000); // $10 floor
    let prevBalance = 8_000_000;
    for (const row of rap?.schedule ?? []) {
      expect(row.endingBalance).toBeLessThanOrEqual(prevBalance); // never grows
      prevBalance = row.endingBalance;
    }
    expect(rap?.schedule[0]?.interestWaived).toBeGreaterThan(0);
  });

  it("$50 principal match: a $10 payment still reduces principal by $10 (match covers it)", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 8_000_000 })],
      makeHousehold({ agi: 2_500_000, dependentsClaimed: 2, familySize: 3 }),
      makeStrategy(),
      AS_OF,
    );
    const row = result.plans.find((p) => p.planId === "RAP")?.schedule[0];
    // Payment $10 < interest: all $10 goes to interest, match reduces principal $10.
    expect(row?.payment).toBe(1_000);
    expect(row?.principalPaid).toBe(0);
    expect(row?.principalMatch).toBe(1_000);
    expect(row?.endingBalance).toBe(8_000_000 - 1_000);
  });

  it("$50 principal match tops up partial principal reduction to exactly $50", () => {
    // Direct amortise test: payment $250, interest $216.67 → borrower principal
    // $33.33 → match adds $16.67 to reach the $50 minimum reduction.
    const interest = monthlyInterest(4_000_000, 650); // 21,667
    const res = amortise({
      startBalance: 4_000_000,
      annualRateBps: 650,
      start: { year: 2026, month: 9 },
      paymentForMonth: () => 25_000,
      interestWaiver: true,
      principalMatchCents: 5_000,
      forgivenessAfterPayments: 360,
      maxMonths: 1,
    });
    const row = res.schedule[0];
    expect(row?.interestPaid).toBe(interest);
    expect(row?.principalPaid).toBe(25_000 - interest); // 3,333
    expect(row?.principalMatch).toBe(5_000 - (25_000 - interest)); // 1,667
    expect(row?.endingBalance).toBe(4_000_000 - 5_000);
  });

  it("no payment cap: high income makes RAP exceed the 10-year Standard payment", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 3_000_000 })], // $30k balance
      makeHousehold({ agi: 12_000_000, dependentsClaimed: 1, familySize: 2 }), // $120k AGI
      makeStrategy(),
      AS_OF,
    );
    const rap = result.plans.find((p) => p.planId === "RAP");
    const std = result.plans.find((p) => p.planId === "STANDARD_10");
    expect(rap?.firstMonthlyPayment).toBe(95_000); // golden: $950
    expect(rap!.firstMonthlyPayment).toBeGreaterThan(std!.firstMonthlyPayment);
    expect(result.globalWarnings.some((w) => w.id === "RAP_EXCEEDS_STANDARD")).toBe(true);
  });

  it("forgiveness at 360 payments (30 years) with remaining balance forgiven", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 12_000_000 })], // $120k balance
      makeHousehold({ agi: 3_500_000 }), // $35k AGI → payment far below interest
      makeStrategy(),
      AS_OF,
    );
    const rap = result.plans.find((p) => p.planId === "RAP");
    expect(rap?.monthsToResolution).toBe(360);
    expect(rap?.totalForgiven).toBeGreaterThan(0);
    expect(rap?.forgivenessDate).toBe("2056-08-01"); // Sept 2026 + 359 months
  });

  it("PSLF track forgives at 120 payments, tax-free, with prior payments credited", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 12_000_000 })],
      makeHousehold({ agi: 3_500_000 }),
      makeStrategy({ pursuingPSLF: true, priorQualifyingPayments: 20 }),
      AS_OF,
    );
    const rap = result.plans.find((p) => p.planId === "RAP");
    expect(rap?.monthsToResolution).toBe(100); // 120 − 20
    expect(rap?.totalForgiven).toBeGreaterThan(0);
    expect(rap?.estimatedTaxOnForgiveness).toBe(0); // PSLF is tax-free
  });

  it("one-way door: prior qualifying payments are forfeited for RAP but credited for IBR", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 12_000_000, firstDisbursement: "2016-09-01" })],
      makeHousehold({ agi: 2_000_000 }), // below 150% FPL → $0 IBR payment
      makeStrategy({ priorQualifyingPayments: 34 }),
      AS_OF,
    );
    const rap = result.plans.find((p) => p.planId === "RAP");
    const ibrOld = result.plans.find((p) => p.planId === "IBR_OLD");
    expect(rap?.monthsToResolution).toBe(360); // full clock — 34 payments forfeited
    expect(ibrOld?.monthsToResolution).toBe(300 - 34); // credit carries within IBR
    const door = result.globalWarnings.find((w) => w.id === "RAP_ONE_WAY_DOOR");
    expect(door?.severity).toBe("IRREVERSIBLE");
    expect(door?.message).toContain("34");
  });

  it("spousal income: included filing jointly, excluded filing separately", () => {
    const joint = simulateAllPlans(
      [makeLoan()],
      makeHousehold({
        agi: 4_000_000,
        spouseAgi: 3_500_000,
        filingStatus: "MARRIED_JOINT",
        dependentsClaimed: 2,
        familySize: 4,
      }),
      makeStrategy(),
      AS_OF,
    );
    // $40k + $35k = $75k joint, 2 dependents → golden case $337.50
    expect(joint.plans.find((p) => p.planId === "RAP")?.firstMonthlyPayment).toBe(33_750);

    const separate = simulateAllPlans(
      [makeLoan()],
      makeHousehold({
        agi: 4_000_000,
        spouseAgi: 3_500_000,
        filingStatus: "MARRIED_SEPARATE",
        dependentsClaimed: 2,
        familySize: 4,
      }),
      makeStrategy(),
      AS_OF,
    );
    // $40k alone, 3% bracket → $100 − $100 → $10 floor... ($40k → 3% = $1,200/yr = $100/mo, −2×$50)
    expect(separate.plans.find((p) => p.planId === "RAP")?.firstMonthlyPayment).toBe(1_000);
  });

  it("payment is prorated when the spouse also holds federal loans (joint filers)", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 4_000_000 })],
      makeHousehold({
        agi: 5_500_000,
        spouseAgi: 0,
        spouseFederalLoanBalance: 4_000_000, // equal debt → 50% share
        filingStatus: "MARRIED_JOINT",
      }),
      makeStrategy(),
      AS_OF,
    );
    // $55k joint AGI → $229.17 base × 0.5 = $114.585 → $114.59 (rounded once)
    expect(result.plans.find((p) => p.planId === "RAP")?.firstMonthlyPayment).toBe(11_459);
  });

  it("extra-payment backfire warning is attached to every eligible RAP result", () => {
    const result = simulateAllPlans([makeLoan()], makeHousehold(), makeStrategy(), AS_OF);
    const rap = result.plans.find((p) => p.planId === "RAP");
    expect(rap?.warnings.some((w) => w.id === "RAP_EXTRA_PAYMENT_BACKFIRE")).toBe(true);
  });
});
