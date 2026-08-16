/**
 * packages/engine/src/rules/index.ts
 *
 * Resolves the rule set in force for a given as-of date. Every rule file
 * carries effectiveFrom / effectiveTo / citations[] — see CLAUDE.md
 * invariant 3. When rules change, add a new dated file here; never edit
 * a rate into a .ts plan file.
 */

import type { RuleCitation } from "../types";

import rapRules20260701 from "./rap.2026-07-01.json";
import povertyGuidelines2026 from "./poverty-guidelines.2026.json";
import tieredStandardTerms20260701 from "./tiered-standard-terms.2026-07-01.json";
import tax2026 from "./tax.2026.json";
import planTerms20260701 from "./plan-terms.2026-07-01.json";

export interface RapRules {
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  citations: RuleCitation[];
  minimumMonthlyPaymentCents: number;
  lowIncomeThresholdCents: number;
  lowIncomeAnnualBaseCents: number;
  bracketStepCents: number;
  bracketStartPct: number;
  bracketMaxPct: number;
  dependentReductionCents: number;
  forgivenessAfterPayments: number;
  pslfPayments: number;
  interestWaiver: boolean;
  principalMatchCents: number;
  paymentCappedAtStandard: boolean;
  eligibleLoanTypes: string[];
  excludedLoanTypes: string[];
  parentPlusConsolidationTaint: boolean;
  /**
   * § 685.209(b)(6)(ii). A tainted consolidation repaid under ICR/PAYE/IBR at
   * any point inside the window is not an excepted consolidation loan, so it
   * keeps RAP. `enabled: false` would restore the unconditional taint.
   */
  parentPlusConsolidationTaintException: {
    enabled: boolean;
    windowFrom: string;
    windowThrough: string;
    qualifyingPlans: string[];
  };
}

export interface PovertyGuidelineRules {
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  citations: RuleCitation[];
  guidelines: Record<
    "CONTIGUOUS_48" | "ALASKA" | "HAWAII",
    { firstPersonCents: number; additionalPersonCents: number }
  >;
}

export interface TieredStandardRules {
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  citations: RuleCitation[];
  tiers: { maxBalanceCents: number | null; termMonths: number }[];
  excludedLoanTypes: string[];
}

export interface TaxRules {
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  citations: RuleCitation[];
  nonPslfForgivenessTaxable: boolean;
  pslfForgivenessTaxable: boolean;
  assumedMarginalRatePct: number;
  stateTreatmentModelled: boolean;
}

export interface IdrTerms {
  discretionaryPct: number;
  povertyMultiplierPct: number;
  forgivenessAfterPayments: number;
  paymentCappedAtStandard: boolean;
}

export interface PlanTermsRules {
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  citations: RuleCitation[];
  ibrOld: IdrTerms;
  ibrNew: IdrTerms & { firstLoanOnOrAfter: string };
  paye: IdrTerms & { newBorrowerProxyDate: string; sunsetDate: string };
  icr: {
    discretionaryPct: number;
    povertyMultiplierPct: number;
    forgivenessAfterPayments: number;
    alternativeAmortisationMonths: number;
    sunsetDate: string;
  };
  standard10: { termMonths: number };
  graduated: { termMonths: number; stepMonths: number; maxFinalToFirstRatio: number };
  extended: { termMonths: number; minimumBalanceCents: number };
  pslfPayments: number;
  post2026RestrictionDate: string;
}

export interface ResolvedRules {
  rap: RapRules;
  poverty: PovertyGuidelineRules;
  tieredStandard: TieredStandardRules;
  tax: TaxRules;
  planTerms: PlanTermsRules;
  /** Composite version string for SimulationResult.meta. */
  ruleSetVersion: string;
}

interface DatedRule {
  effectiveFrom: string;
  effectiveTo: string | null;
  ruleSetVersion: string;
}

/** All known versions of each rule family, newest last. */
const RAP_VERSIONS: RapRules[] = [rapRules20260701 as RapRules];
const POVERTY_VERSIONS: PovertyGuidelineRules[] = [
  povertyGuidelines2026 as PovertyGuidelineRules,
];
const TIERED_VERSIONS: TieredStandardRules[] = [
  tieredStandardTerms20260701 as TieredStandardRules,
];
const TAX_VERSIONS: TaxRules[] = [tax2026 as TaxRules];
const PLAN_TERMS_VERSIONS: PlanTermsRules[] = [planTerms20260701 as PlanTermsRules];

function inForce<T extends DatedRule>(versions: T[], asOfIso: string): T {
  const match = [...versions]
    .filter((v) => v.effectiveFrom <= asOfIso && (v.effectiveTo === null || asOfIso < v.effectiveTo))
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1))
    .pop();
  if (!match) {
    throw new Error(
      `No rule set in force on ${asOfIso}. Earliest known effectiveFrom is ${versions[0]?.effectiveFrom ?? "none"}.`,
    );
  }
  return match;
}

/** Resolve every rule family for the given as-of date (ISO yyyy-mm-dd). */
export function resolveRules(asOfIso: string): ResolvedRules {
  const rap = inForce(RAP_VERSIONS, asOfIso);
  const poverty = inForce(POVERTY_VERSIONS, asOfIso);
  const tieredStandard = inForce(TIERED_VERSIONS, asOfIso);
  const tax = inForce(TAX_VERSIONS, asOfIso);
  const planTerms = inForce(PLAN_TERMS_VERSIONS, asOfIso);
  return {
    rap,
    poverty,
    tieredStandard,
    tax,
    planTerms,
    ruleSetVersion: [
      rap.ruleSetVersion,
      planTerms.ruleSetVersion,
      poverty.ruleSetVersion,
      tax.ruleSetVersion,
    ].join("+"),
  };
}

/** Every citation across every rule family in force — for /sources and traces. */
export function listRuleCitations(asOfIso: string): { ruleSet: string; citations: RuleCitation[] }[] {
  const r = resolveRules(asOfIso);
  return [
    { ruleSet: r.rap.ruleSetVersion, citations: r.rap.citations },
    { ruleSet: r.planTerms.ruleSetVersion, citations: r.planTerms.citations },
    { ruleSet: r.tieredStandard.ruleSetVersion, citations: r.tieredStandard.citations },
    { ruleSet: r.poverty.ruleSetVersion, citations: r.poverty.citations },
    { ruleSet: r.tax.ruleSetVersion, citations: r.tax.citations },
  ];
}
