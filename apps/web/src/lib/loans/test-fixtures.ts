/**
 * Fixtures for the loans app-layer tests.
 *
 * A byte-for-byte copy of `packages/engine-repayment/tests/helpers.ts`, kept
 * here rather than imported across the package boundary: the engine's tests
 * are private to the engine (`exports` publishes `.` only), and reaching into
 * a sibling package's test directory would pull engine-internal paths into
 * this app's TypeScript program. The duplication is thirty lines and the
 * values are fixed by the golden cases, so it cannot drift silently — if the
 * engine's `Household`, `Loan` or `Strategy` shape changes, this file fails to
 * typecheck against the published types on the next run.
 *
 * All simulations run with a fixed asOf date so results are fully deterministic.
 */

import type { Household, Loan, Strategy } from "@fineprint/engine-repayment";

/** Fixed simulation date: 8 Aug 2026 (first payment month = Sept 2026). */
export const AS_OF = new Date("2026-08-08T12:00:00Z");

let nextId = 0;

export function makeLoan(overrides: Partial<Loan> = {}): Loan {
  nextId += 1;
  return {
    id: `loan-${nextId}`,
    type: "DIRECT_UNSUBSIDIZED",
    balance: 4_000_000, // $40,000
    annualRateBps: 650, // 6.50%
    firstDisbursement: "2018-09-01",
    isConsolidation: false,
    ...overrides,
  };
}

export function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    agi: 5_500_000, // $55,000
    filingStatus: "SINGLE",
    dependentsClaimed: 0,
    familySize: 1,
    stateGroup: "CONTIGUOUS_48",
    ...overrides,
  };
}

export function makeStrategy(overrides: Partial<Strategy> = {}): Strategy {
  return {
    pursuingPSLF: false,
    priorQualifyingPayments: 0,
    expectedAnnualIncomeGrowthPct: 0, // deterministic payments unless a test opts in
    ...overrides,
  };
}
