import { describe, expect, it } from "vitest";
import { aggregateLoans, simulateAllPlans } from "@/engines/repayment/index";
import { AS_OF, makeHousehold, makeLoan, makeStrategy } from "./helpers";

describe("simulateAllPlans — public API", () => {
  it("returns all nine plans, always", () => {
    const result = simulateAllPlans([makeLoan()], makeHousehold(), makeStrategy(), AS_OF);
    expect(result.plans).toHaveLength(9);
    expect(new Set(result.plans.map((p) => p.planId)).size).toBe(9);
  });

  it("recommendation.lowestTotalCost is the eligible plan with the smallest lifetime cost", () => {
    const result = simulateAllPlans([makeLoan()], makeHousehold(), makeStrategy(), AS_OF);
    const eligible = result.plans.filter((p) => p.eligible);
    const min = Math.min(...eligible.map((p) => p.totalLifetimeCost));
    const winner = result.plans.find((p) => p.planId === result.recommendation.lowestTotalCost);
    expect(winner?.totalLifetimeCost).toBe(min);
  });

  it("theyDisagree is set when the cheapest month and the cheapest lifetime differ", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 12_000_000 })],
      makeHousehold({ agi: 4_500_000 }),
      makeStrategy({ expectedAnnualIncomeGrowthPct: 3 }),
      AS_OF,
    );
    const { lowestTotalCost, lowestMonthlyPayment, theyDisagree } = result.recommendation;
    expect(theyDisagree).toBe(lowestTotalCost !== lowestMonthlyPayment);
  });

  it("meta carries engine version, rule-set version, and the as-of date", () => {
    const result = simulateAllPlans([makeLoan()], makeHousehold(), makeStrategy(), AS_OF);
    expect(result.meta.engineVersion).toBe("1.0.0");
    expect(result.meta.ruleSetVersion).toContain("rap-2026-07-01");
    expect(result.meta.asOfDate).toBe("2026-08-08");
  });

  it("is deterministic: identical inputs produce identical results (excluding computedAt)", () => {
    const a = simulateAllPlans([makeLoan({ id: "x" })], makeHousehold(), makeStrategy(), AS_OF);
    const b = simulateAllPlans([makeLoan({ id: "x" })], makeHousehold(), makeStrategy(), AS_OF);
    expect({ ...a, meta: { ...a.meta, computedAt: "" } }).toEqual({
      ...b,
      meta: { ...b.meta, computedAt: "" },
    });
  });

  it("aggregates loans at a balance-weighted average rate in integer bps", () => {
    const agg = aggregateLoans([
      makeLoan({ balance: 1_000_000, annualRateBps: 500 }),
      makeLoan({ balance: 3_000_000, annualRateBps: 700 }),
    ]);
    expect(agg.balance).toBe(4_000_000);
    expect(agg.weightedRateBps).toBe(650);
  });

  it("rejects float cents, empty loan lists, and malformed dates — never coerces", () => {
    expect(() => simulateAllPlans([], makeHousehold(), makeStrategy(), AS_OF)).toThrow(
      /at least one loan/i,
    );
    expect(() =>
      simulateAllPlans([makeLoan({ balance: 100.5 })], makeHousehold(), makeStrategy(), AS_OF),
    ).toThrow(/integer cents/);
    expect(() =>
      simulateAllPlans(
        [makeLoan({ firstDisbursement: "09/01/2018" })],
        makeHousehold(),
        makeStrategy(),
        AS_OF,
      ),
    ).toThrow(/ISO date/);
    expect(() =>
      simulateAllPlans([makeLoan()], makeHousehold({ agi: 55_000.5 }), makeStrategy(), AS_OF),
    ).toThrow(/integer cents/);
  });

  it("income growth raises IDR payments at annual recertification", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 12_000_000 })],
      makeHousehold(),
      makeStrategy({ expectedAnnualIncomeGrowthPct: 5 }),
      AS_OF,
    );
    const rap = result.plans.find((p) => p.planId === "RAP");
    const year1 = rap?.schedule[0]?.payment ?? 0;
    const year3 = rap?.schedule[30]?.payment ?? 0;
    expect(year3).toBeGreaterThan(year1);
  });
});
