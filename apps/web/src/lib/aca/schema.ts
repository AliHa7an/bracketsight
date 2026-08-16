/**
 * The planner's state, and the one place it becomes engine input.
 *
 * Money is held in **integer cents** end to end — the same unit the engine
 * speaks — because `<NumberInput unit="cents">` already emits cents and the
 * round-trip through float dollars is exactly the drift the engine invariant
 * exists to prevent. The only string in here is the list of ages, which is a
 * list the user edits as text.
 *
 * Zod is used for one job: validating whatever comes back out of
 * `localStorage`, which is untrusted input like any other. Live field
 * validation is the NumberInput's own clamp plus a constraint hint — the
 * interaction spec asks for the constraint, not a scolding.
 */

import { z } from "zod";
import type { Cents, CliffAnalysisInput, FilingStatus, HdhpCoverage } from "@fineprint/engine-aca";

export const COUNTY_STATE = {
  "travis-tx": "TX",
  "los-angeles-ca": "CA",
  "cook-il": "IL",
  "maricopa-az": "AZ",
  "miami-dade-fl": "FL",
  "denver-co": "CO",
} as const;

export type CountyId = keyof typeof COUNTY_STATE;

/** Every detail the ConfidenceMeter counts, in the order it asks for them. */
export const DETAIL_KEYS = [
  "county",
  "familySize",
  "coveredAges",
  "agi",
  "addBacks",
  "earnedIncome",
  "aptcMonthly",
] as const;
export type DetailKey = (typeof DETAIL_KEYS)[number];

export interface PlannerState {
  // Household
  countyId: CountyId;
  filingStatus: FilingStatus;
  familySize: number;
  /** Ages enrolling in marketplace coverage, as the user types them. */
  coveredAges: string;

  // MAGI builder — cents
  agi: Cents;
  taxExemptInterest: Cents;
  excludedForeignIncome: Cents;
  nonTaxableSocialSecurity: Cents;

  // Lever context
  age: number;
  wagesW2: Cents;
  selfEmploymentNetProfit: Cents;
  hdhpCoverage: HdhpCoverage;
  coveredByEmployerPlan: boolean;
  spouseCoveredByEmployerPlan: boolean;
  ytd401k: Cents;
  ytdHsa: Cents;
  ytdIra: Cents;
  ytdSep: Cents;
  annualHealthPremium: Cents;

  // Advance credit
  aptcMonthly: Cents;

  /** Which details the reader has actually confirmed. Drives ConfidenceMeter. */
  confirmed: DetailKey[];
}

const cents = z.number().int().min(0).max(1_000_000_00);

export const plannerSchema = z.object({
  countyId: z.enum(Object.keys(COUNTY_STATE) as [CountyId, ...CountyId[]]),
  filingStatus: z.enum(["SINGLE", "MARRIED_JOINT", "MARRIED_SEPARATE", "HEAD_OF_HOUSEHOLD"]),
  familySize: z.number().int().min(1).max(12),
  coveredAges: z.string(),
  agi: cents,
  taxExemptInterest: cents,
  excludedForeignIncome: cents,
  nonTaxableSocialSecurity: cents,
  age: z.number().int().min(18).max(120),
  wagesW2: cents,
  selfEmploymentNetProfit: cents,
  hdhpCoverage: z.enum(["NONE", "SELF", "FAMILY"]),
  coveredByEmployerPlan: z.boolean(),
  spouseCoveredByEmployerPlan: z.boolean(),
  ytd401k: cents,
  ytdHsa: cents,
  ytdIra: cents,
  ytdSep: cents,
  annualHealthPremium: cents,
  aptcMonthly: cents,
  confirmed: z.array(z.enum(DETAIL_KEYS)),
});

/**
 * Smart defaults, never empty fields: a reader who abandons at 60% still
 * leaves with a real answer. This household is deliberately the one the
 * product exists for — a self-employed 60-year-old sitting just under the
 * edge, where a single invoice decides thousands of dollars.
 */
export const plannerDefaults: PlannerState = {
  countyId: "travis-tx",
  filingStatus: "SINGLE",
  familySize: 1,
  coveredAges: "60",
  agi: 6_250_000,
  taxExemptInterest: 0,
  excludedForeignIncome: 0,
  nonTaxableSocialSecurity: 0,
  age: 60,
  wagesW2: 0,
  selfEmploymentNetProfit: 6_250_000,
  hdhpCoverage: "NONE",
  coveredByEmployerPlan: false,
  spouseCoveredByEmployerPlan: false,
  ytd401k: 0,
  ytdHsa: 0,
  ytdIra: 0,
  ytdSep: 0,
  annualHealthPremium: 0,
  aptcMonthly: 0,
  confirmed: [],
};

/** Ages, parsed. Invalid entries are dropped rather than guessed at. */
export function parseAges(input: string): number[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{1,3}$/.test(part))
    .map((part) => Math.min(Number(part), 64))
    .filter((n) => n > 0);
}

/** The constraint, stated as guidance. Null when the field is fine. */
export function agesError(input: string): string | null {
  const parts = input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "Enter at least one age — premiums are age-rated.";
  if (!parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 120)) {
    return "Ages are whole numbers separated by commas, like 60, 58.";
  }
  return null;
}

export function toEngineInput(v: PlannerState): CliffAnalysisInput {
  const ages = parseAges(v.coveredAges);
  return {
    household: {
      filingStatus: v.filingStatus,
      familySize: v.familySize,
      stateCode: COUNTY_STATE[v.countyId],
      countyId: v.countyId,
      // An empty or half-typed ages field never produces a silent $0 premium:
      // the engine is given the one age we already know.
      coveredMemberAges: ages.length > 0 ? ages : [Math.min(v.age, 64)],
    },
    income: {
      agi: v.agi,
      taxExemptInterest: v.taxExemptInterest,
      excludedForeignIncome: v.excludedForeignIncome,
      nonTaxableSocialSecurity: v.nonTaxableSocialSecurity,
    },
    levers: {
      age: v.age,
      wagesW2: v.wagesW2,
      selfEmploymentNetProfit: v.selfEmploymentNetProfit,
      hdhpCoverage: v.hdhpCoverage,
      coveredByEmployerPlan: v.coveredByEmployerPlan,
      spouseCoveredByEmployerPlan: v.spouseCoveredByEmployerPlan,
      ytd401k: v.ytd401k,
      ytdHsa: v.ytdHsa,
      ytdIra: v.ytdIra,
      ytdSep: v.ytdSep,
      annualHealthPremium: v.annualHealthPremium,
    },
    aptcMonthly: v.aptcMonthly,
  };
}

/** How many of the seven details the engine actually has, and what's next. */
export function completeness(v: PlannerState): {
  filled: number;
  total: number;
  next: string | null;
} {
  const has: Record<DetailKey, boolean> = {
    county: v.confirmed.includes("county"),
    familySize: v.confirmed.includes("familySize"),
    coveredAges: v.confirmed.includes("coveredAges") || parseAges(v.coveredAges).length > 0,
    agi: v.confirmed.includes("agi") || v.agi > 0,
    addBacks:
      v.confirmed.includes("addBacks") ||
      v.taxExemptInterest + v.excludedForeignIncome + v.nonTaxableSocialSecurity > 0,
    earnedIncome:
      v.confirmed.includes("earnedIncome") || v.wagesW2 + v.selfEmploymentNetProfit > 0,
    aptcMonthly: v.confirmed.includes("aptcMonthly") || v.aptcMonthly > 0,
  };

  const prompts: Record<DetailKey, string> = {
    county: "confirm your county for a real benchmark premium",
    familySize: "confirm your tax family size — it sets your poverty line",
    coveredAges: "add the ages enrolling for an exact premium",
    agi: "add your AGI for an exact position",
    addBacks: "check the three MAGI add-backs — they are how people cross by accident",
    earnedIncome: "say where the income comes from to unlock the right levers",
    aptcMonthly: "add the advance credit you already take to see your repayment risk",
  };

  const missing = DETAIL_KEYS.filter((k) => !has[k]);
  const firstMissing = missing[0];
  return {
    filled: DETAIL_KEYS.length - missing.length,
    total: DETAIL_KEYS.length,
    next: firstMissing ? prompts[firstMissing] : null,
  };
}
