import { describe, expect, it } from "vitest";
import { simulateAllPlans } from "../src/index";
import { AS_OF, makeHousehold, makeLoan, makeStrategy } from "./helpers";

function run(loans: Parameters<typeof simulateAllPlans>[0]) {
  return simulateAllPlans(loans, makeHousehold(), makeStrategy(), AS_OF);
}

function plan(result: ReturnType<typeof run>, id: string) {
  const p = result.plans.find((p) => p.planId === id);
  if (!p) throw new Error(`missing plan ${id}`);
  return p;
}

describe("eligibility — Parent PLUS", () => {
  it("a Parent PLUS loan is ineligible for RAP, IBR, and PAYE — and for ICR until consolidated", () => {
    const result = run([makeLoan({ type: "DIRECT_PARENT_PLUS" })]);
    expect(plan(result, "RAP").eligible).toBe(false);
    expect(plan(result, "RAP").ineligibilityReasons[0]).toContain("Parent PLUS");
    expect(plan(result, "IBR_OLD").eligible).toBe(false);
    expect(plan(result, "IBR_NEW").eligible).toBe(false);
    expect(plan(result, "PAYE").eligible).toBe(false);
    expect(plan(result, "ICR").eligible).toBe(false);
    expect(plan(result, "STANDARD_10").eligible).toBe(true);
    expect(plan(result, "TIERED_STANDARD").eligible).toBe(true);
  });

  it("a consolidation that repaid Parent PLUS is tainted for RAP but eligible for ICR", () => {
    const result = run([
      makeLoan({
        type: "DIRECT_CONSOLIDATION",
        isConsolidation: true,
        underlyingHadParentPlus: true,
      }),
    ]);
    expect(plan(result, "RAP").eligible).toBe(false);
    expect(plan(result, "RAP").ineligibilityReasons[0]).toContain("even after consolidation");
    expect(plan(result, "ICR").eligible).toBe(true);
  });

  it("Grad PLUS (the student's own loan) IS eligible for RAP", () => {
    const result = run([makeLoan({ type: "DIRECT_GRAD_PLUS" })]);
    expect(plan(result, "RAP").eligible).toBe(true);
  });
});

describe("eligibility — the § 685.209(b)(6)(ii) carve-out from the Parent PLUS taint", () => {
  /**
   * A consolidation that repaid a Parent PLUS loan is normally an "excepted
   * consolidation loan" and barred from RAP for good. It is NOT excepted — and
   * so IS RAP-eligible — where it "was being repaid under the ICR, PAYE, or IBR
   * plans on any date on or after July 4, 2025, through and including June 30,
   * 2028". The engine denied RAP to this cohort unconditionally.
   */
  const tainted = (overrides = {}) =>
    makeLoan({
      type: "DIRECT_CONSOLIDATION",
      isConsolidation: true,
      underlyingHadParentPlus: true,
      ...overrides,
    });

  it("a tainted consolidation repaid under an income-driven plan inside the window IS RAP-eligible", () => {
    const result = run([tainted({ repaidUnderIdrInWindow: true })]);
    expect(plan(result, "RAP").eligible).toBe(true);
    expect(plan(result, "RAP").ineligibilityReasons).toEqual([]);
  });

  it("the same loan outside the window is not — the taint still bites", () => {
    const result = run([tainted({ repaidUnderIdrInWindow: false })]);
    expect(plan(result, "RAP").eligible).toBe(false);
    expect(plan(result, "RAP").ineligibilityReasons[0]).toContain("even after consolidation");
  });

  it("defaults to the taint when the borrower has said nothing", () => {
    // The flag is optional on Loan. Absent means "not claimed", which must
    // read as ineligible — assuming a RAP the servicer will refuse is the
    // costlier error.
    const result = run([tainted()]);
    expect(plan(result, "RAP").eligible).toBe(false);
  });

  it("does not open IBR or PAYE — the carve-out is RAP-only", () => {
    // The IBR/PAYE bar on a Parent PLUS consolidation comes from HEA § 493C,
    // not from the excepted-consolidation-loan definition, so § 685.209(b)(6)(ii)
    // leaves it standing. ICR remains the one income-driven alternative.
    const result = run([tainted({ repaidUnderIdrInWindow: true })]);
    expect(plan(result, "IBR_OLD").eligible).toBe(false);
    expect(plan(result, "IBR_NEW").eligible).toBe(false);
    expect(plan(result, "PAYE").eligible).toBe(false);
    expect(plan(result, "ICR").eligible).toBe(true);
  });

  it("ignores the claim on a loan that was never tainted in the first place", () => {
    // Nothing to rescue: the flag must not become a back door for a direct
    // Parent PLUS loan, which is barred by loan type, not by the consolidation
    // definition.
    const result = run([
      makeLoan({ type: "DIRECT_PARENT_PLUS", repaidUnderIdrInWindow: true }),
    ]);
    expect(plan(result, "RAP").eligible).toBe(false);
    expect(plan(result, "RAP").ineligibilityReasons[0]).toContain("Parent PLUS");
  });

  it("shuts RAP for the whole mix if any one tainted loan is outside the window", () => {
    // v1 all-or-nothing policy: a plan is eligible only if every entered loan
    // can use it.
    const result = run([
      tainted({ repaidUnderIdrInWindow: true }),
      tainted({ repaidUnderIdrInWindow: false }),
    ]);
    expect(plan(result, "RAP").eligible).toBe(false);
  });
});

describe("eligibility — FFEL / Perkins / HEAL", () => {
  it("FFEL cannot use RAP or Tiered Standard, but can use Old IBR", () => {
    const result = run([makeLoan({ type: "FFEL" })]);
    expect(plan(result, "RAP").eligible).toBe(false);
    expect(plan(result, "TIERED_STANDARD").eligible).toBe(false);
    expect(plan(result, "PAYE").eligible).toBe(false);
    expect(plan(result, "ICR").eligible).toBe(false);
    expect(plan(result, "IBR_OLD").eligible).toBe(true);
  });

  it("Perkins and HEAL are excluded from RAP, Tiered Standard, and IDR", () => {
    for (const type of ["PERKINS", "HEAL"] as const) {
      const result = run([makeLoan({ type })]);
      expect(plan(result, "RAP").eligible).toBe(false);
      expect(plan(result, "TIERED_STANDARD").eligible).toBe(false);
      expect(plan(result, "IBR_OLD").eligible).toBe(false);
      expect(plan(result, "STANDARD_10").eligible).toBe(true);
    }
  });
});

describe("eligibility — post-1 Jul 2026 loans are restricted to RAP / Tiered Standard", () => {
  it("one post-2026 loan removes IBR, PAYE, ICR, Graduated, and Extended", () => {
    const result = run([
      makeLoan(),
      makeLoan({ firstDisbursement: "2026-08-01", balance: 1_000_000 }),
    ]);
    for (const id of ["IBR_OLD", "IBR_NEW", "PAYE", "ICR", "GRADUATED", "EXTENDED"]) {
      expect(plan(result, id).eligible).toBe(false);
      expect(plan(result, id).ineligibilityReasons.join(" ")).toContain("1 Jul 2026");
    }
    expect(plan(result, "RAP").eligible).toBe(true);
    expect(plan(result, "TIERED_STANDARD").eligible).toBe(true);
    expect(plan(result, "STANDARD_10").eligible).toBe(true);
  });
});

describe("eligibility — date-gated plans", () => {
  it("New IBR requires the first loan on/after 1 Jul 2014", () => {
    const result = run([makeLoan({ firstDisbursement: "2013-09-01" })]);
    expect(plan(result, "IBR_NEW").eligible).toBe(false);
    expect(plan(result, "IBR_OLD").eligible).toBe(true);
  });

  it("PAYE requires a new borrower with a disbursement on/after 1 Oct 2011", () => {
    const result = run([makeLoan({ firstDisbursement: "2010-01-01" })]);
    expect(plan(result, "PAYE").eligible).toBe(false);
    expect(plan(result, "IBR_OLD").eligible).toBe(true);
  });

  it("PAYE and ICR are gone entirely once the as-of date passes 1 Jul 2028", () => {
    const result = simulateAllPlans(
      [makeLoan()],
      makeHousehold(),
      makeStrategy(),
      new Date("2028-08-01T12:00:00Z"),
    );
    expect(plan(result, "PAYE").eligible).toBe(false);
    expect(plan(result, "PAYE").ineligibilityReasons[0]).toContain("sunset");
    expect(plan(result, "ICR").eligible).toBe(false);
  });
});
