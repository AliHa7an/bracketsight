/**
 * The 1 Jul 2028 PAYE/ICR sunset.
 *
 * Two things were previously modelled wrong and are pinned here: where a
 * non-electing borrower is placed, and which payment credit survives the move.
 * Both come from 34 C.F.R. § 685.209 as revised by the RISE final rule,
 * 91 Fed. Reg. 23768.
 */

import { describe, expect, it } from "vitest";
import { simulateAllPlans } from "@/engines/repayment/index";
import { sunsetDestination } from "@/engines/repayment/eligibility";
import { idrCreditCarries } from "@/engines/repayment/plans/sunset";
import { resolveRules } from "@/engines/repayment/rules/index";
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

describe("sunset destination — § 685.209(c)(7)(iii)(A): RAP first, IBR second", () => {
  it("sends a RAP-eligible borrower to RAP", () => {
    expect(sunsetDestination([makeLoan()], rules)).toBe("RAP");
    expect(sunsetDestination([makeLoan({ type: "DIRECT_GRAD_PLUS" })], rules)).toBe("RAP");
  });

  it("sends a borrower RAP will not take to IBR — New IBR where they qualify", () => {
    // FFEL cannot use RAP at all, but IBR is open to it. First disbursement
    // 2018 is on/after 1 Jul 2014, so the borrower is an IBR new borrower.
    expect(sunsetDestination([makeLoan({ type: "FFEL" })], rules)).toBe("IBR_NEW");
  });

  it("falls back to Old IBR when the borrower is not an IBR new borrower", () => {
    expect(
      sunsetDestination([makeLoan({ type: "FFEL", firstDisbursement: "2013-09-01" })], rules),
    ).toBe("IBR_OLD");
  });

  it("has only a Standard schedule for the borrower neither plan will take", () => {
    // A Parent PLUS consolidation outside the § 685.209(b)(6)(ii) carve-out:
    // an excepted consolidation loan for RAP, and barred from IBR by
    // HEA § 493C. The regulation does not say where they go; the engine's
    // stated assumption is a Standard amortisation.
    const tainted = makeLoan({
      type: "DIRECT_CONSOLIDATION",
      isConsolidation: true,
      underlyingHadParentPlus: true,
    });
    expect(sunsetDestination([tainted], rules)).toBe("STANDARD_10");
  });

  it("routes the carve-out cohort to RAP, because RAP is open to them", () => {
    const rescued = makeLoan({
      type: "DIRECT_CONSOLIDATION",
      isConsolidation: true,
      underlyingHadParentPlus: true,
      repaidUnderIdrInWindow: true,
    });
    expect(sunsetDestination([rescued], rules)).toBe("RAP");
  });
});

describe("both sunsetting plans migrate to the same place", () => {
  // $40,000 at 6.50%, $55,000 AGI, family of 1, no dependents, 0% growth.
  // Migration is 22 payments after the Sept 2026 start (1 Jul 2028), so
  // schedule[22] is the first post-migration month for both plans.
  //
  // RAP at $55,000 with no dependents is the 5% bracket, § 685.209(b)(2)(vi):
  //   $55,000 × 5% = $2,750/yr ; ÷ 12 = 22,916.66…c → 22,917c.
  // The plans the engine used to migrate to would have charged something else
  // entirely — New IBR 25,883c and Old IBR 38,825c — so this one figure is
  // what separates the corrected destination from the wrong one.
  const result = run();

  it("moves a PAYE borrower onto the RAP payment", () => {
    expect(plan(result, "PAYE").schedule[22]?.payment).toBe(22_917);
  });

  it("moves an ICR borrower onto the same RAP payment", () => {
    expect(plan(result, "ICR").schedule[22]?.payment).toBe(22_917);
  });

  it("carries RAP's mechanics across with it, not just its payment", () => {
    for (const id of ["PAYE", "ICR"] as const) {
      const row = plan(result, id).schedule[22];
      // The $50 principal match is RAP-only and cannot appear under any IBR.
      expect(row?.principalMatch).toBeGreaterThan(0);
    }
  });
});

describe("payment credit across the migration is asymmetric, not a flat carry", () => {
  it("counts pre-2028 IDR payments toward RAP only when they met the required amount", () => {
    // § 685.209(k)(8)(i)(C)(5): payments before 1 Jul 2028 count toward RAP's
    // 360 only where each was "not less than the monthly payment required
    // under the applicable plan".
    expect(idrCreditCarries("PAYE", "RAP", true)).toBe(true);
    expect(idrCreditCarries("ICR", "RAP", true)).toBe(true);
    expect(idrCreditCarries("IBR_OLD", "RAP", true)).toBe(true);
    expect(idrCreditCarries("PAYE", "RAP", false)).toBe(false);
    expect(idrCreditCarries("ICR", "RAP", false)).toBe(false);
  });

  it("never counts RAP payments toward IBR, PAYE or ICR forgiveness", () => {
    // § 685.209(k)(4)(i)(A) credits payments made under an IDR plan "except
    // the Repayment Assistance Plan". This is the half that makes the rule
    // asymmetric: credit flows into RAP but never back out of it.
    for (const to of ["IBR_OLD", "IBR_NEW", "PAYE", "ICR"] as const) {
      expect(idrCreditCarries("RAP", to, true)).toBe(false);
    }
  });

  it("still carries credit between the non-RAP income-driven plans", () => {
    expect(idrCreditCarries("PAYE", "IBR_NEW", true)).toBe(true);
    expect(idrCreditCarries("ICR", "IBR_OLD", true)).toBe(true);
  });

  it("earns no income-driven credit from a fixed plan, and lands none on one", () => {
    expect(idrCreditCarries("STANDARD_10", "RAP", true)).toBe(false);
    expect(idrCreditCarries("GRADUATED", "IBR_NEW", true)).toBe(false);
    expect(idrCreditCarries("PAYE", "STANDARD_10", true)).toBe(false);
    expect(idrCreditCarries("PAYE", "TIERED_STANDARD", true)).toBe(false);
  });

  it("shows the carry in the schedule: forgiveness at 360, not 382", () => {
    // $120,000 at 6.50% on $55,000 — the payment never covers the interest, so
    // nothing retires and the plan runs to its forgiveness date.
    //   22 PAYE payments before the sunset, each at the required amount
    //   + 338 remaining on RAP's 360-payment clock
    //   = 360 payments to resolution.
    // A flat "no carry" rule would put it at 22 + 360 = 382; a flat "keep the
    // origin clock" rule (the engine's old behaviour) would put it at 240.
    const long = run([makeLoan({ balance: 12_000_000 })], makeHousehold());
    expect(plan(long, "PAYE").monthsToResolution).toBe(360);
  });
});
