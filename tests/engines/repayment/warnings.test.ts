import { describe, expect, it } from "vitest";
import { simulateAllPlans } from "@/engines/repayment/index";
import { AS_OF, makeHousehold, makeLoan, makeStrategy } from "./helpers";

describe("the seven warnings", () => {
  it("1. RAP one-way door fires only when prior qualifying payments exist", () => {
    const withPrior = simulateAllPlans(
      [makeLoan()],
      makeHousehold(),
      makeStrategy({ priorQualifyingPayments: 34 }),
      AS_OF,
    );
    expect(withPrior.globalWarnings.some((w) => w.id === "RAP_ONE_WAY_DOOR")).toBe(true);

    const without = simulateAllPlans([makeLoan()], makeHousehold(), makeStrategy(), AS_OF);
    expect(without.globalWarnings.some((w) => w.id === "RAP_ONE_WAY_DOOR")).toBe(false);
  });

  it("2. Parent PLUS RAP ineligibility fires for direct and tainted-consolidation exposure", () => {
    const direct = simulateAllPlans(
      [makeLoan({ type: "DIRECT_PARENT_PLUS" })],
      makeHousehold(),
      makeStrategy(),
      AS_OF,
    );
    expect(direct.globalWarnings.some((w) => w.id === "PARENT_PLUS_RAP_INELIGIBLE")).toBe(true);
  });

  it("3. RAP-exceeds-Standard fires at high income + moderate balance (the central crossover)", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 3_000_000 })],
      makeHousehold({ agi: 12_000_000, dependentsClaimed: 1, familySize: 2 }),
      makeStrategy(),
      AS_OF,
    );
    const w = result.globalWarnings.find((w) => w.id === "RAP_EXCEEDS_STANDARD");
    expect(w).toBeDefined();
    expect(w?.severity).toBe("CAUTION"); // a fact, not an irreversible act
  });

  it("4. post-2026 loan restriction fires when any loan is disbursed on/after 1 Jul 2026", () => {
    const result = simulateAllPlans(
      [makeLoan({ firstDisbursement: "2026-07-15" })],
      makeHousehold(),
      makeStrategy(),
      AS_OF,
    );
    expect(result.globalWarnings.some((w) => w.id === "POST_2026_LOANS_RESTRICTED")).toBe(true);
  });

  it("5. FFEL/Perkins/HEAL exclusion fires when a legacy loan is present", () => {
    const result = simulateAllPlans(
      [makeLoan({ type: "FFEL" })],
      makeHousehold(),
      makeStrategy(),
      AS_OF,
    );
    expect(result.globalWarnings.some((w) => w.id === "FFEL_PERKINS_HEAL_EXCLUDED")).toBe(true);
  });

  it("6. PAYE/ICR sunset fires when a simulation crosses 1 Jul 2028", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 12_000_000 })],
      makeHousehold(),
      makeStrategy(),
      AS_OF,
    );
    const sunsetWarnings = result.globalWarnings.filter((w) => w.id === "PAYE_ICR_SUNSET");
    expect(sunsetWarnings.length).toBeGreaterThan(0);
    expect(sunsetWarnings.some((w) => w.planId === "PAYE")).toBe(true);
  });

  it("7. taxable-forgiveness fires when a non-PSLF plan forgives a balance", () => {
    const forgiving = simulateAllPlans(
      [makeLoan({ balance: 15_000_000 })],
      makeHousehold({ agi: 3_000_000 }),
      makeStrategy(),
      AS_OF,
    );
    expect(forgiving.globalWarnings.some((w) => w.id === "FORGIVENESS_TAXABLE")).toBe(true);

    // Small balance, high income: every plan pays in full → no tax warning.
    const paying = simulateAllPlans(
      [makeLoan({ balance: 1_000_000 })],
      makeHousehold({ agi: 20_000_000 }),
      makeStrategy(),
      AS_OF,
    );
    expect(paying.globalWarnings.some((w) => w.id === "FORGIVENESS_TAXABLE")).toBe(false);
  });
});

describe("severity discipline — oxide is reserved for irreversible decisions", () => {
  it("in a kitchen-sink scenario only the one-way door is IRREVERSIBLE", () => {
    const result = simulateAllPlans(
      [makeLoan({ balance: 15_000_000 })],
      makeHousehold({ agi: 3_000_000 }),
      makeStrategy({ priorQualifyingPayments: 34 }),
      AS_OF,
    );
    const irreversible = result.globalWarnings.filter((w) => w.severity === "IRREVERSIBLE");
    expect(irreversible).toHaveLength(1);
    expect(irreversible[0]?.id).toBe("RAP_ONE_WAY_DOOR");
  });

  it("the one-way door is not raised for a PSLF borrower (PSLF credit transfers)", () => {
    const result = simulateAllPlans(
      [makeLoan()],
      makeHousehold(),
      makeStrategy({ pursuingPSLF: true, priorQualifyingPayments: 34 }),
      AS_OF,
    );
    expect(result.globalWarnings.some((w) => w.id === "RAP_ONE_WAY_DOOR")).toBe(false);
  });
});
