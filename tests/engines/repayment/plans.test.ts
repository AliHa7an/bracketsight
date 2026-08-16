import { describe, expect, it } from "vitest";
import { simulateAllPlans } from "@/engines/repayment/index";
import { levelPayment, monthlyInterest } from "@/engines/repayment/money";
import { resolveRules } from "@/engines/repayment/rules/index";
import { tieredTermMonths } from "@/engines/repayment/plans/tiered-standard";
import { AS_OF, makeHousehold, makeLoan, makeStrategy } from "./helpers";

const rules = resolveRules("2026-08-08");

function run(
  loans = [makeLoan()],
  household = makeHousehold(),
  strategy = makeStrategy(),
) {
  return simulateAllPlans(loans, household, strategy, AS_OF);
}

function plan(result: ReturnType<typeof run>, id: string) {
  const p = result.plans.find((p) => p.planId === id);
  if (!p) throw new Error(`missing plan ${id}`);
  return p;
}

describe("Old IBR — 15% of discretionary, 25-year forgiveness, capped at Standard", () => {
  it("computes the exact first payment: $55k AGI, family of 1 → $388.25", () => {
    // CHANGED by the 2026 poverty-guideline correction. The file held the 2025
    // contiguous-48 figure ($15,650); the 2026 table (ASPE, published in the
    // Federal Register 15 Jan 2026) is $15,960. A higher guideline protects
    // more income, so every IBR/PAYE/ICR payment falls.
    //
    //   protected     = 150% × $15,960          = $23,940.00 = 2,394,000c
    //   discretionary = $55,000 − $23,940       = $31,060.00 = 3,106,000c
    //   annual share  = 3,106,000 × 15%         =   465,900c
    //   monthly       = 465,900 ÷ 12            =    38,825c exactly
    //
    // No rounding is involved — the division is exact. Was $394.06 on the
    // stale 2025 table, so this borrower pays $5.81/month less.
    expect(plan(run(), "IBR_OLD").firstMonthlyPayment).toBe(38_825);
  });

  it("caps the payment at the 10-year Standard amount for high incomes", () => {
    const result = run(
      [makeLoan({ balance: 2_000_000 })],
      makeHousehold({ agi: 20_000_000 }),
    );
    const cap = levelPayment(2_000_000, 650, 120);
    expect(plan(result, "IBR_OLD").firstMonthlyPayment).toBe(cap);
    expect(plan(result, "PAYE").firstMonthlyPayment).toBe(cap);
  });

  it("amortises to zero before 300 payments when the payment covers interest", () => {
    const ibr = plan(run(), "IBR_OLD");
    expect(ibr.totalForgiven).toBe(0);
    expect(ibr.monthsToResolution).toBeLessThan(300);
  });

  it("forgives at 300 payments with unpaid interest accrued but never compounded", () => {
    const result = run([makeLoan({ balance: 15_000_000 })], makeHousehold({ agi: 3_000_000 }));
    const ibr = plan(result, "IBR_OLD");
    expect(ibr.monthsToResolution).toBe(300);
    expect(ibr.totalForgiven).toBeGreaterThan(0);
    expect(ibr.estimatedTaxOnForgiveness).toBeGreaterThan(0); // non-PSLF → taxable
  });
});

describe("New IBR — 10% of discretionary, 20-year forgiveness", () => {
  it("computes the exact first payment: $55k AGI, family of 1 → $258.83", () => {
    // CHANGED by the 2026 poverty-guideline correction — same protected-income
    // figure as the Old IBR case above, at 10% instead of 15%.
    //
    //   discretionary = $55,000 − 150% × $15,960 = $31,060.00 = 3,106,000c
    //   annual share  = 3,106,000 × 10%          =   310,600c
    //   monthly       = 310,600 ÷ 12             = 25,883.33…c
    //                 → 25,883 (round half away from zero, money.ts rule 1)
    //
    // Was $262.71 on the stale 2025 table.
    expect(plan(run(), "IBR_NEW").firstMonthlyPayment).toBe(25_883);
  });

  it("forgives at 240 payments", () => {
    const result = run([makeLoan({ balance: 15_000_000 })], makeHousehold({ agi: 3_000_000 }));
    expect(plan(result, "IBR_NEW").monthsToResolution).toBe(240);
  });
});

describe("PAYE — sunsets 1 Jul 2028; never silently projected past it", () => {
  it("models the forced migration to RAP, not to New IBR", () => {
    // CHANGED: the destination was wrong. 34 C.F.R. § 685.209(c)(7)(iii)(A)
    // places a non-electing borrower in RAP for RAP-eligible loans and in IBR
    // only for loans RAP will not take. This borrower holds one plain Direct
    // Unsubsidized loan, so RAP takes it and the old "PAYE → New IBR" answer
    // was wrong on both the payment and the forgiveness date.
    //
    // $120,000 at 6.50%, $55,000 AGI, family of 1, no dependents, 0% growth.
    // Simulation starts Sept 2026; the sunset is 1 Jul 2028, which is
    // monthsBetween(Sep 2026, Jul 2028) = 22 payments later.
    //
    // Phase A — PAYE, payments 1–22:
    //   min(10% × ($55,000 − 150% × $15,960) ÷ 12, 10-yr Standard cap)
    //   = min(25,883c, levelPayment($120,000, 6.50%, 120) = 136,258c)
    //   = 25,883c
    //
    // Phase B — RAP, payment 23 on:
    //   $55,000 sits in the 5% bracket (b)(2)(vi): $2,750/yr ÷ 12
    //   = 22,916.66…c → 22,917c, no dependent reduction. New IBR would have
    //   charged 25,883c, so the figure below is what distinguishes the two.
    //
    // Forgiveness clock: RAP's own 360, not PAYE's 240. The 22 pre-sunset
    // payments carry into it under § 685.209(k)(8)(i)(C)(5) because each was
    // the amount PAYE required, leaving 338 — so resolution lands at
    // 22 + 338 = 360. Without the carry it would be 22 + 360 = 382.
    //
    // Nothing retires the balance first: PAYE's 25,883c never covers the
    // 65,000c of monthly interest, so the balance reaches
    // $120,000 + 22 × (65,000 − 25,883) = $128,605.74 at migration, and RAP's
    // 22,917c is below the interest on that too — principal then falls only by
    // the $50 match, 338 × $50 = $16,900, far short of the balance.
    const result = run([makeLoan({ balance: 12_000_000 })], makeHousehold());
    const paye = plan(result, "PAYE");
    expect(paye.eligible).toBe(true);
    expect(paye.schedule.some((r) => r.date >= "2028-07-01")).toBe(true);

    expect(paye.schedule[21]?.payment).toBe(25_883); // last PAYE payment
    expect(paye.schedule[21]?.date).toBe("2028-06-01");
    expect(paye.schedule[22]?.payment).toBe(22_917); // first RAP payment
    expect(paye.schedule[22]?.date).toBe("2028-07-01");
    // RAP's mechanics come with it: interest waived, $50 principal match.
    expect(paye.schedule[22]?.interestWaived).toBeGreaterThan(0);
    expect(paye.schedule[22]?.principalMatch).toBe(5_000);

    expect(paye.monthsToResolution).toBe(360);
    expect(paye.totalForgiven).toBeGreaterThan(0);
    expect(paye.warnings.some((w) => w.id === "PAYE_ICR_SUNSET")).toBe(true);
  });

  it("does not fire the sunset warning when the loan resolves before Jul 2028", () => {
    // PSLF borrower 110 payments in: forgiveness arrives 10 payments from
    // now (Jun 2027), before the sunset ever matters.
    const result = run(
      [makeLoan({ balance: 12_000_000 })],
      makeHousehold(),
      makeStrategy({ pursuingPSLF: true, priorQualifyingPayments: 110 }),
    );
    const paye = plan(result, "PAYE");
    expect(paye.monthsToResolution).toBe(10);
    expect(paye.estimatedTaxOnForgiveness).toBe(0);
    expect(paye.warnings.some((w) => w.id === "PAYE_ICR_SUNSET")).toBe(false);
  });
});

describe("ICR — lesser of 20% discretionary or 12-year amortisation; sunsets 1 Jul 2028", () => {
  it("takes the lesser of the two formulas", () => {
    // CHANGED by the 2026 poverty-guideline correction. ICR protects 100% of
    // the guideline (§ 685.209(b)(4)(iii)), not 150%:
    //   discretionary = $55,000 − $15,960 = $39,040.00 = 3,904,000c
    //   3,904,000 × 20% = 780,800 ; ÷ 12  = 65,066.66…c → 65,067c
    // Was 65,583c on the stale 2025 table ($15,650).
    //
    // The 12-year alternative on $40,000 at 6.50% is 40,077c, which is the
    // lesser of the two both before and after the correction — so the payment
    // the engine charges is unchanged here. The discretionary figure is stated
    // anyway, because it is what the "lesser of" is choosing between.
    const icr = plan(run(), "ICR");
    const alternative = levelPayment(4_000_000, 650, 144);
    expect(alternative).toBe(40_077);
    expect(icr.firstMonthlyPayment).toBe(Math.min(65_067, alternative));
  });

  it("is the only IDR plan for a Parent PLUS consolidation, and migrates to Standard at sunset", () => {
    const loans = [
      makeLoan({
        type: "DIRECT_CONSOLIDATION",
        isConsolidation: true,
        underlyingHadParentPlus: true,
        balance: 6_000_000,
      }),
    ];
    const result = run(loans, makeHousehold({ agi: 4_000_000 }));
    expect(plan(result, "ICR").eligible).toBe(true);
    expect(plan(result, "RAP").eligible).toBe(false);
    expect(plan(result, "IBR_OLD").eligible).toBe(false);
    // This borrower is the one cohort § 685.209(c)(7)(iii)(A) does not cover:
    // eligible for neither RAP (excepted consolidation loan, and no
    // § 685.209(b)(6)(ii) carve-out claimed) nor IBR. After the sunset
    // (22 payments in) the engine falls back to a 10-year Standard
    // amortisation of the remaining balance — a stated assumption, not a rule.
    const icr = plan(result, "ICR");
    const balanceAtMigration = icr.schedule[21]?.endingBalance;
    const migrated = icr.schedule[22];
    expect(balanceAtMigration).toBeDefined();
    expect(migrated?.payment).toBe(levelPayment(balanceAtMigration!, 650, 120));
  });
});

describe("Standard 10-year", () => {
  it("zero-rate loan divides exactly: $30,000 at 0% → $250.00 for 120 months", () => {
    const result = run([makeLoan({ balance: 3_000_000, annualRateBps: 0 })]);
    const std = plan(result, "STANDARD_10");
    expect(std.firstMonthlyPayment).toBe(25_000);
    expect(std.monthsToResolution).toBe(120);
    expect(std.totalPaid).toBe(3_000_000);
  });

  it("amortises exactly to zero in 120 months at a real rate", () => {
    const std = plan(run(), "STANDARD_10");
    expect(std.firstMonthlyPayment).toBe(levelPayment(4_000_000, 650, 120));
    expect(std.monthsToResolution).toBe(120);
    expect(std.totalForgiven).toBe(0);
    expect(std.schedule[std.schedule.length - 1]?.endingBalance).toBe(0);
  });
});

describe("Tiered Standard — term scales with balance", () => {
  it("selects the bracketed term: 10yr under $25k, 15yr to $50k, 20yr to $100k, 25yr above", () => {
    expect(tieredTermMonths(2_000_000, rules.tieredStandard)).toBe(120);
    expect(tieredTermMonths(2_500_000, rules.tieredStandard)).toBe(180); // $25k boundary
    expect(tieredTermMonths(6_000_000, rules.tieredStandard)).toBe(240);
    expect(tieredTermMonths(15_000_000, rules.tieredStandard)).toBe(300);
  });

  it("runs a level schedule over the tiered term", () => {
    const result = run([makeLoan({ balance: 6_000_000 })]);
    const tiered = plan(result, "TIERED_STANDARD");
    expect(tiered.firstMonthlyPayment).toBe(levelPayment(6_000_000, 650, 240));
    expect(tiered.monthsToResolution).toBe(240);
  });
});

describe("Graduated — steps up every 24 months, pays off within 10 years", () => {
  it("payments never decrease, start at ≥ interest-only, final ≤ 3× first", () => {
    const grad = plan(run(), "GRADUATED");
    expect(grad.eligible).toBe(true);
    const payments = grad.schedule.map((r) => r.payment);
    const first = payments[0]!;
    expect(first).toBeGreaterThanOrEqual(monthlyInterest(4_000_000, 650));
    for (let i = 1; i < payments.length - 1; i++) {
      expect(payments[i]!).toBeGreaterThanOrEqual(payments[i - 1]!);
    }
    // Final scheduled tier ≤ 3× first (allow 1 cent of rounding).
    expect(payments[payments.length - 2]!).toBeLessThanOrEqual(3 * first + 1);
    expect(grad.monthsToResolution).toBeLessThanOrEqual(121);
    expect(grad.totalForgiven).toBe(0);
  });

  it("costs more in total than Standard 10 (interest-heavy early years)", () => {
    const result = run();
    expect(plan(result, "GRADUATED").totalPaid).toBeGreaterThan(
      plan(result, "STANDARD_10").totalPaid,
    );
  });
});

describe("Extended — 25-year level payment, >$30k balance required", () => {
  it("is ineligible at or below $30,000", () => {
    const result = run([makeLoan({ balance: 2_500_000 })]);
    const ext = plan(result, "EXTENDED");
    expect(ext.eligible).toBe(false);
    expect(ext.ineligibilityReasons[0]).toContain("$30,000");
  });

  it("amortises over 300 months above the threshold", () => {
    const ext = plan(run(), "EXTENDED");
    expect(ext.firstMonthlyPayment).toBe(levelPayment(4_000_000, 650, 300));
    expect(ext.monthsToResolution).toBe(300);
  });
});
