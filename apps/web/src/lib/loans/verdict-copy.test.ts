import { describe, expect, it } from "vitest";
import type { PlanResult, SimulationResult } from "@fineprint/engine-repayment";
import {
  forgivenessSentence,
  monthSentence,
  paymentVsCostSentence,
  planCostSentence,
  verdict,
  verdictHeadline,
} from "./verdict-copy";

function plan(p: Partial<PlanResult> & { planId: PlanResult["planId"] }): PlanResult {
  return {
    eligible: true,
    ineligibilityReasons: [],
    firstMonthlyPayment: 0,
    schedule: [],
    monthsToResolution: 240,
    totalPaid: 0,
    totalForgiven: 0,
    estimatedTaxOnForgiveness: 0,
    totalLifetimeCost: 0,
    forgivenessDate: null,
    warnings: [],
    ...p,
  };
}

const result: SimulationResult = {
  plans: [
    plan({
      planId: "IBR_NEW",
      firstMonthlyPayment: 41200,
      totalLifetimeCost: 12_840_400,
      totalForgiven: 4_120_300,
      estimatedTaxOnForgiveness: 987_600,
      forgivenessDate: "2046-08-01",
      monthsToResolution: 240,
      schedule: [
        {
          month: 1,
          date: "2026-09-01",
          payment: 41200,
          interestAccrued: 50000,
          interestPaid: 41200,
          interestWaived: 0,
          principalPaid: 0,
          principalMatch: 0,
          endingBalance: 10_300_000,
        },
      ],
    }),
    plan({ planId: "RAP", firstMonthlyPayment: 21400, totalLifetimeCost: 15_680_800 }),
    plan({
      planId: "TIERED_STANDARD",
      eligible: false,
      ineligibilityReasons: ["Perkins loans cannot use Tiered Standard."],
    }),
  ],
  recommendation: {
    lowestTotalCost: "IBR_NEW",
    lowestMonthlyPayment: "RAP",
    theyDisagree: true,
  },
  globalWarnings: [
    {
      id: "RAP_ONE_WAY_DOOR",
      severity: "IRREVERSIBLE",
      message: "Switching to RAP forfeits your 34 qualifying payments. This cannot be undone.",
    },
  ],
  meta: {
    engineVersion: "1.0.0",
    ruleSetVersion: "2026.07",
    computedAt: "2026-08-14T00:00:00.000Z",
    asOfDate: "2026-08-14",
  },
};

describe("verdict-copy", () => {
  it("states the delta between the two cheapest eligible plans", () => {
    expect(verdictHeadline(result)).toBe(
      "New IBR costs you $28,404 less than RAP over the life of your loans.",
    );
  });

  it("states the payment-versus-cost trade-off only when the two disagree", () => {
    expect(paymentVsCostSentence(result)).toBe(
      "RAP starts $198 a month cheaper than New IBR, and ends up $28,404 more expensive.",
    );
    expect(
      paymentVsCostSentence({
        ...result,
        recommendation: { ...result.recommendation, theyDisagree: false },
      }),
    ).toBeNull();
  });

  it("never separates forgiveness from its tax bill", () => {
    expect(forgivenessSentence(result, "IBR_NEW")).toBe(
      "New IBR forgives $41,203 in Aug 2046. That forgiven balance is taxable — about $9,876 owed in the year it lands.",
    );
    expect(forgivenessSentence(result, "RAP")).toBeNull();
  });

  it("gives an ineligible plan a reason, never a bare N/A", () => {
    expect(planCostSentence(result, "TIERED_STANDARD")).toBe(
      "Tiered Standard is not available to you: Perkins loans cannot use Tiered Standard.",
    );
    expect(planCostSentence(result, "RAP")).toBe(
      "RAP starts at $214 a month and costs $156,808 over 20 yr.",
    );
  });

  it("describes a scrubbed month from engine rows only", () => {
    const first = result.plans[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(monthSentence(first, 1)).toBe("Month 1 (Sep 2026): you pay $412 and owe $103,000.");
    expect(monthSentence(first, 99)).toContain("is finished by month 99");
  });

  it("surfaces the first irreversible fact verbatim from the engine", () => {
    const v = verdict(result);
    expect(v.winner).toBe("IBR_NEW");
    expect(v.irreversible).toBe(
      "Switching to RAP forfeits your 34 qualifying payments. This cannot be undone.",
    );
  });

  it("handles a single eligible plan without inventing a comparison", () => {
    const only: SimulationResult = {
      ...result,
      plans: [plan({ planId: "RAP", totalLifetimeCost: 9_900_000, monthsToResolution: 300 })],
    };
    expect(verdictHeadline(only)).toBe(
      "RAP is the only plan your loans qualify for. It costs $99,000 over 25 yr.",
    );
  });
});
