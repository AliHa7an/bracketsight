import { describe, expect, it } from "vitest";
import { decodeScenario, encodeScenario, scenarioUrl } from "./url-state";
import { defaultFormValues, type FormValues } from "./schema";

const values: FormValues = {
  loans: [
    {
      id: "loan-1",
      type: "DIRECT_GRAD_PLUS",
      balanceDollars: 82000,
      ratePct: 6.39,
      firstDisbursement: "2019-08-01",
      isConsolidation: false,
      underlyingHadParentPlus: false,
      repaidUnderIdrInWindow: false,
    },
    {
      id: "loan-2",
      type: "DIRECT_UNSUBSIDIZED",
      balanceDollars: 21500,
      ratePct: 4.53,
      firstDisbursement: "2013-09-01",
      isConsolidation: true,
      underlyingHadParentPlus: true,
      // The § 685.209(b)(6)(ii) carve-out rides in the same bitfield as the
      // other two loan flags, so the round trip has to carry all three.
      repaidUnderIdrInWindow: true,
    },
  ],
  household: {
    agiDollars: 96000,
    filingStatus: "MARRIED_JOINT",
    spouseAgiDollars: 41000,
    spouseFederalLoanBalanceDollars: 0,
    dependentsClaimed: 2,
    familySize: 4,
    stateGroup: "HAWAII",
  },
  goals: {
    pursuingPSLF: "UNSURE",
    priorQualifyingPayments: 34,
    expectedAnnualIncomeGrowthPct: 3,
  },
};

describe("url-state", () => {
  it("round-trips every field of a scenario", () => {
    const back = decodeScenario(encodeScenario(values));
    expect(back).not.toBeNull();
    expect(back?.loans).toHaveLength(2);
    expect(back?.loans[0]?.type).toBe("DIRECT_GRAD_PLUS");
    expect(back?.loans[0]?.balanceDollars).toBe(82000);
    expect(back?.loans[0]?.ratePct).toBe(6.39);
    expect(back?.loans[0]?.firstDisbursement).toBe("2019-08-01");
    expect(back?.loans[1]?.isConsolidation).toBe(true);
    expect(back?.loans[1]?.underlyingHadParentPlus).toBe(true);
    expect(back?.loans[1]?.repaidUnderIdrInWindow).toBe(true);
    expect(back?.loans[0]?.repaidUnderIdrInWindow).toBe(false);
    expect(back?.household.filingStatus).toBe("MARRIED_JOINT");
    expect(back?.household.stateGroup).toBe("HAWAII");
    expect(back?.household.dependentsClaimed).toBe(2);
    expect(back?.household.familySize).toBe(4);
    expect(back?.goals.pursuingPSLF).toBe("UNSURE");
    expect(back?.goals.priorQualifyingPayments).toBe(34);
  });

  it("is deterministic, url-safe, and smaller than the raw form", () => {
    const token = encodeScenario(values);
    expect(encodeScenario(values)).toBe(token);
    expect(token).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(token.length).toBeLessThan(JSON.stringify(values).length);
    expect(scenarioUrl(values, "/")).toContain("?s=");
  });

  it("returns null rather than a wrong scenario", () => {
    expect(decodeScenario("")).toBeNull();
    expect(decodeScenario("!!!!")).toBeNull();
    // a token from a future format version
    expect(decodeScenario(btoa("[9,[],[],[]]"))).toBeNull();
  });

  it("keeps an unfilled field unfilled instead of inventing a zero", () => {
    const partial = decodeScenario(encodeScenario(defaultFormValues));
    expect(partial?.loans[0]?.balanceDollars).toBeUndefined();
    expect(partial?.household.agiDollars).toBeUndefined();
    expect(partial?.household.familySize).toBe(1);
  });
});
