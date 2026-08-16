/**
 * Rules loader. Every rate, threshold, bracket, and limit the engine uses
 * comes through here from versioned, cited JSON. Nothing numeric is
 * hard-coded in .ts files (invariant #3).
 */

import type { Cents, StateGroup } from "../types";

import applicablePctJson from "./applicable-percentage.2026.json";
import fplJson from "./fpl.2025.json";
import contributionLimitsJson from "./contribution-limits.2026.json";
import medicaidExpansionJson from "./medicaid-expansion.2026.json";
import csrBandsJson from "./csr-bands.json";
import repaymentLimitsJson from "./repayment-limits.2026.json";
import slcspJson from "./slcsp-sample.2026.json";

export interface Citation {
  label: string;
  url: string;
  lastVerified: string | null;
}

export interface RuleFileMeta {
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  verificationStatus: string;
  citations: Citation[];
}

export interface ApplicablePctBand {
  fromPct: number;
  toPct: number;
  lowBps: number;
  highBps: number;
}

/**
 * The §36B(c)(1)(A) income ceiling, encoded the way Form 8962 Worksheet 2
 * applies it: a strict "more than FPL × multiple" test that runs BEFORE the
 * line 5 whole-percent truncation. Failing it puts `ineligibleSentinelPct`
 * (401) on line 5, which is why there is no grace band above 400%.
 */
export interface EligibilityCeiling {
  /** 4.0 × the poverty line, in basis points (40000 = 400%). */
  ceilingMultipleBps: number;
  /** What Worksheet 2 enters on line 5 when the ceiling test fails. */
  ineligibleSentinelPct: number;
}

export interface ApplicablePctRules extends RuleFileMeta {
  bands: ApplicablePctBand[];
  eligibilityCeiling: EligibilityCeiling;
}

export interface FplRules extends RuleFileMeta {
  groups: Record<StateGroup, { firstPersonCents: Cents; additionalPersonCents: Cents }>;
}

export interface ContributionLimits extends RuleFileMeta {
  elective401kCents: Cents;
  catchUp401k50Cents: Cents;
  hsaSelfOnlyCents: Cents;
  hsaFamilyCents: Cents;
  hsaCatchUp55Cents: Cents;
  iraCents: Cents;
  iraCatchUp50Cents: Cents;
  sepOverallCapCents: Cents;
  sepEmployerPctBps: number;
  ssWageBaseCents: Cents;
  seTaxSsRateBps: number;
  seTaxMedicareRateBps: number;
  seNetEarningsFactorBps: number;
  iraPhaseOut: {
    coveredSingleFromCents: Cents;
    coveredSingleToCents: Cents;
    coveredJointFromCents: Cents;
    coveredJointToCents: Cents;
    spouseCoveredJointFromCents: Cents;
    spouseCoveredJointToCents: Cents;
    marriedSeparateFromCents: Cents;
    marriedSeparateToCents: Cents;
  };
}

export interface CsrBandRule {
  fromPct: number;
  toPct: number;
  band: "94" | "87" | "73";
  actuarialValueBps: number;
}

export interface RepaymentBand {
  fromPct: number;
  toPct: number;
  singleCents: Cents;
  otherCents: Cents;
}

/**
 * Whether an advance-credit repayment limitation exists at all is data.
 * For 2026 it does not: OBBBA §71305 struck IRC §36B(f)(2)(B), so
 * `inEffect` is false and `bands` is empty — full clawback at every income.
 * A year that reinstates a cap sets `inEffect` and populates `bands`.
 */
export interface RepaymentLimitation {
  inEffect: boolean;
  bands: RepaymentBand[];
}

export interface RepaymentLimitRules extends RuleFileMeta {
  limitation: RepaymentLimitation;
}

export interface SlcspCounty {
  id: string;
  label: string;
  stateCode: string;
  age21BaseMonthlyCents: Cents;
}

export interface RuleSet {
  /** Version string surfaced in every analysis result and on every page. */
  ruleSetVersion: string;
  applicablePct: ApplicablePctRules;
  fpl: FplRules;
  contributionLimits: ContributionLimits;
  medicaidExpansion: RuleFileMeta & { states: Record<string, boolean> };
  csrBands: RuleFileMeta & { bands: CsrBandRule[] };
  repaymentLimits: RepaymentLimitRules;
  slcsp: RuleFileMeta & {
    counties: SlcspCounty[];
    ageFactorsPermille: Record<string, number>;
  };
}

const ruleSet: RuleSet = {
  ruleSetVersion: "cliffcheck-rules-2026.draft-1",
  applicablePct: applicablePctJson as ApplicablePctRules,
  fpl: fplJson as FplRules,
  contributionLimits: contributionLimitsJson as unknown as ContributionLimits,
  medicaidExpansion: medicaidExpansionJson as RuleFileMeta & {
    states: Record<string, boolean>;
  },
  csrBands: csrBandsJson as RuleFileMeta & { bands: CsrBandRule[] },
  repaymentLimits: repaymentLimitsJson as unknown as RepaymentLimitRules,
  slcsp: slcspJson as unknown as RuleFileMeta & {
    counties: SlcspCounty[];
    ageFactorsPermille: Record<string, number>;
  },
};

/** The active rule set for plan-year 2026. Date-resolved selection arrives
 *  with the first mid-year rules change (same pattern as Repayment Atlas). */
export function getRules(): RuleSet {
  return ruleSet;
}

/** Every citation across every rules file — feeds /sources. */
export function allCitations(): { file: string; version: string; status: string; citations: Citation[] }[] {
  const r = ruleSet;
  return [
    { file: "applicable-percentage.2026.json", version: r.applicablePct.ruleSetVersion, status: r.applicablePct.verificationStatus, citations: r.applicablePct.citations },
    { file: "fpl.2025.json", version: r.fpl.ruleSetVersion, status: r.fpl.verificationStatus, citations: r.fpl.citations },
    { file: "contribution-limits.2026.json", version: r.contributionLimits.ruleSetVersion, status: r.contributionLimits.verificationStatus, citations: r.contributionLimits.citations },
    { file: "medicaid-expansion.2026.json", version: r.medicaidExpansion.ruleSetVersion, status: r.medicaidExpansion.verificationStatus, citations: r.medicaidExpansion.citations },
    { file: "csr-bands.json", version: r.csrBands.ruleSetVersion, status: r.csrBands.verificationStatus, citations: r.csrBands.citations },
    { file: "repayment-limits.2026.json", version: r.repaymentLimits.ruleSetVersion, status: r.repaymentLimits.verificationStatus, citations: r.repaymentLimits.citations },
    { file: "slcsp-sample.2026.json", version: r.slcsp.ruleSetVersion, status: r.slcsp.verificationStatus, citations: r.slcsp.citations },
  ];
}
