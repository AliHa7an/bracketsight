/**
 * packages/engine/src/types.ts
 *
 * The engine contract. Matches PRODUCT-SPEC §11.4 exactly — do not deviate.
 * Pure types only: no imports, no runtime code beyond type-level constructs.
 */

export type Cents = number; // ALWAYS integer cents. Never floats.

export type LoanType =
  | "DIRECT_SUBSIDIZED"
  | "DIRECT_UNSUBSIDIZED"
  | "DIRECT_GRAD_PLUS"
  | "DIRECT_PARENT_PLUS"
  | "DIRECT_CONSOLIDATION"
  | "FFEL"
  | "PERKINS"
  | "HEAL";

export type PlanId =
  | "RAP"
  | "IBR_OLD"
  | "IBR_NEW"
  | "PAYE"
  | "ICR"
  | "STANDARD_10"
  | "TIERED_STANDARD"
  | "GRADUATED"
  | "EXTENDED";

export const ALL_PLAN_IDS: readonly PlanId[] = [
  "RAP",
  "IBR_OLD",
  "IBR_NEW",
  "PAYE",
  "ICR",
  "STANDARD_10",
  "TIERED_STANDARD",
  "GRADUATED",
  "EXTENDED",
] as const;

export interface Loan {
  id: string;
  type: LoanType;
  balance: Cents;
  annualRateBps: number; // basis points: 6.39% → 639
  firstDisbursement: string; // ISO date — drives eligibility
  isConsolidation: boolean;
  underlyingHadParentPlus?: boolean; // taints consolidation for RAP
  /**
   * The § 685.209(b)(6)(ii) carve-out from the Parent PLUS consolidation taint.
   *
   * A consolidation loan that repaid a Parent PLUS loan is normally an
   * "excepted consolidation loan" and permanently barred from RAP. It is NOT
   * excepted — and therefore IS RAP-eligible — if it "was being repaid under
   * the ICR, PAYE, or IBR plans on any date on or after July 4, 2025, through
   * and including June 30, 2028."
   *
   * The borrower asserts this per loan. It defaults to `false`/undefined, so
   * the taint applies unless the borrower affirms the condition — the
   * conservative direction, since wrongly claiming RAP eligibility would put a
   * borrower on a plan their servicer will refuse. Only meaningful when both
   * `isConsolidation` and `underlyingHadParentPlus` are true; ignored otherwise.
   *
   * Window dates live in rules/rap.*.json under
   * `parentPlusConsolidationTaintException`.
   */
  repaidUnderIdrInWindow?: boolean;
}

export interface Household {
  agi: Cents;
  filingStatus: "SINGLE" | "MARRIED_JOINT" | "MARRIED_SEPARATE" | "HEAD_OF_HOUSEHOLD";
  spouseAgi?: Cents;
  spouseFederalLoanBalance?: Cents;
  dependentsClaimed: number; // RAP: -$50 each
  familySize: number; // IBR/PAYE/ICR poverty guideline
  stateGroup: "CONTIGUOUS_48" | "ALASKA" | "HAWAII";
}

export interface Strategy {
  pursuingPSLF: boolean | "UNSURE";
  priorQualifyingPayments: number;
  currentPlan?: PlanId;
  expectedAnnualIncomeGrowthPct: number; // default 3
}

/** One simulated month. All money fields are integer cents. */
export interface MonthlyRow {
  /** 1-based payment number. */
  month: number;
  /** ISO date (first of month) the payment falls in. */
  date: string;
  payment: Cents;
  interestAccrued: Cents;
  interestPaid: Cents;
  /** RAP only: unpaid interest waived this month (never capitalised). */
  interestWaived: Cents;
  /** Principal paid by the borrower this month. */
  principalPaid: Cents;
  /** RAP only: government principal match applied this month. */
  principalMatch: Cents;
  /** Principal + outstanding unpaid interest at month end. */
  endingBalance: Cents;
}

export type WarningSeverity = "IRREVERSIBLE" | "CAUTION" | "INFO";

export type WarningId =
  | "RAP_ONE_WAY_DOOR"
  | "PARENT_PLUS_RAP_INELIGIBLE"
  | "PARENT_PLUS_CONSOLIDATION_RAP_EXCEPTION"
  | "RAP_EXCEEDS_STANDARD"
  | "POST_2026_LOANS_RESTRICTED"
  | "FFEL_PERKINS_HEAL_EXCLUDED"
  | "PAYE_ICR_SUNSET"
  | "FORGIVENESS_TAXABLE"
  | "RAP_EXTRA_PAYMENT_BACKFIRE";

export interface Warning {
  id: WarningId;
  severity: WarningSeverity;
  /** Plain-English, user-facing. Concrete, never vague. */
  message: string;
  /** Set when the warning is about one plan specifically. */
  planId?: PlanId;
}

export interface PlanResult {
  planId: PlanId;
  eligible: boolean;
  ineligibilityReasons: string[]; // plain English, user-facing
  firstMonthlyPayment: Cents;
  schedule: MonthlyRow[];
  monthsToResolution: number;
  totalPaid: Cents;
  totalForgiven: Cents;
  estimatedTaxOnForgiveness: Cents;
  totalLifetimeCost: Cents; // totalPaid + tax  ← ranking key
  forgivenessDate: string | null;
  warnings: Warning[];
}

export interface SimulationResult {
  plans: PlanResult[];
  recommendation: {
    lowestTotalCost: PlanId;
    lowestMonthlyPayment: PlanId;
    theyDisagree: boolean; // the interesting case
  };
  globalWarnings: Warning[];
  meta: {
    engineVersion: string;
    ruleSetVersion: string;
    computedAt: string;
    asOfDate: string;
  };
}

/** A single primary-source citation attached to a rule set. */
export interface RuleCitation {
  label: string;
  url: string;
  fedRegCite?: string;
  lastVerified: string;
}
