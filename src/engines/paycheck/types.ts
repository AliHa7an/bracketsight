/**
 * ClearPaycheck engine — shared types.
 *
 * INVARIANTS (portfolio invariants 1–3 in the repo-root instructions):
 * - Zero dependencies, zero AI, zero network. Pure deterministic TypeScript.
 * - Money is ALWAYS integer cents (`Cents`). Rates are basis points (`Bps`).
 * - No rate, cap, threshold, or bracket is hard-coded here — they live in
 *   versioned, cited JSON under `rules/`.
 */

/** Integer cents. 1234 === $12.34. Never a float. */
export type Cents = number;

/** Basis points. 1200 === 12.00%. */
export type Bps = number;

export type FilingStatus =
  | "SINGLE"
  | "MARRIED_JOINT"
  | "MARRIED_SEPARATE"
  | "HEAD_OF_HOUSEHOLD";

export type DeductionId = "TIPS" | "OVERTIME" | "SENIOR" | "CAR_LOAN";

// ---------------------------------------------------------------------------
// Rules JSON shapes
// ---------------------------------------------------------------------------

export interface Citation {
  label: string;
  url: string;
  lastVerified: string; // ISO date
  /** Free-text caveat. "UNVERIFIED — DO NOT SHIP" flags placeholder values. */
  note?: string;
}

export interface RuleEnvelope {
  ruleSetVersion: string;
  taxYear: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  /** false ⇒ contains placeholder values that MUST be verified against IRS primary sources before launch. */
  verified: boolean;
  citations: Citation[];
}

/**
 * Two statutory phase-out models appear in OBBBA:
 * - PER_1000_STEP: reduced by $X for each $1,000 (or fraction thereof) of
 *   MAGI over the threshold (tips, overtime, car-loan interest).
 * - PERCENT_OF_EXCESS: reduced by N% of MAGI over the threshold (senior).
 */
export type PhaseOutRule =
  | {
      model: "PER_1000_STEP";
      thresholdSingleCents: Cents;
      thresholdJointCents: Cents;
      reductionPer1000Cents: Cents;
      /** true ⇒ a fraction of $1,000 counts as a full step (round excess up). */
      fractionCountsAsFullStep: boolean;
    }
  | {
      model: "PERCENT_OF_EXCESS";
      thresholdSingleCents: Cents;
      thresholdJointCents: Cents;
      percentOfExcessBps: Bps;
    };

export interface TipsRules extends RuleEnvelope {
  capCents: Cents;
  phaseOut: PhaseOutRule;
  /** Married taxpayers must file jointly to claim (statute). */
  requireJointIfMarried: boolean;
}

export interface OvertimeRules extends RuleEnvelope {
  capSingleCents: Cents;
  capJointCents: Cents;
  /** The deductible share of the overtime hour: FLSA premium = 0.5× regular rate → 5000 bps. */
  premiumShareOfRegularRateBps: Bps;
  /** The assumed pay multiplier for time-and-a-half input mode → 15000 bps (1.5×). */
  payMultiplierBps: Bps;
  phaseOut: PhaseOutRule;
  requireJointIfMarried: boolean;
}

export interface SeniorRules extends RuleEnvelope {
  qualifyingAge: number;
  /**
   * Per-qualified-individual amount. The phase-out reduces THIS figure, and
   * the reduced figure is then entered once per qualifying spouse
   * (Schedule 1-A lines 33–37) — never once against the doubled amount.
   */
  amountPerQualifyingPersonCents: Cents;
  phaseOut: PhaseOutRule;
  /** IRC § 151(d)(5)(C)(v): married taxpayers must file jointly to claim. */
  requireJointIfMarried: boolean;
}

export interface CarLoanRules extends RuleEnvelope {
  capCents: Cents;
  phaseOut: PhaseOutRule;
  /** Loan must originate on or after this ISO date. */
  loanOriginatedOnOrAfter: string;
  requiresNewVehicle: boolean;
  requiresFinalAssemblyInUS: boolean;
  requiresPersonalUse: boolean;
}

export interface TaxBracket {
  /** Upper bound of the bracket in cents; null = no upper bound. */
  upToCents: Cents | null;
  rateBps: Bps;
}

export interface BracketRules extends RuleEnvelope {
  standardDeductionCents: Record<FilingStatus, Cents>;
  brackets: Record<FilingStatus, TaxBracket[]>;
}

export interface Occupation {
  /** Treasury Tipped Occupation Code (TTOC)-style code, e.g. "101". */
  code: string;
  title: string;
  category: string;
  qualified: boolean;
  keywords: string[];
}

export interface OccupationRules extends RuleEnvelope {
  occupations: Occupation[];
}

export interface RuleSet {
  tips: TipsRules;
  overtime: OvertimeRules;
  senior: SeniorRules;
  carLoan: CarLoanRules;
  brackets: BracketRules;
  occupations: OccupationRules;
}

// ---------------------------------------------------------------------------
// Engine input
// ---------------------------------------------------------------------------

export interface TipsInput {
  /** Total qualified tips reported for the year. */
  amountCents: Cents;
  /** Occupation code from the qualified-occupation list, or null if unknown. */
  occupationCode: string | null;
  /** Self-employed (1099 / gig) rather than W-2 employee. */
  selfEmployed: boolean;
  /** Tips properly reported (W-2 Box 7, Form 4070, Form 4137, or 1099/Schedule C). */
  properlyReported: boolean;
}

export type OvertimeInput =
  | {
      /** Engine reconstructs the FLSA premium from hours and regular rate. */
      mode: "HOURS_RATE";
      overtimeHours: number;
      regularHourlyRateCents: Cents;
    }
  | {
      /** Total overtime pay received at time-and-a-half. Premium = total / 3. */
      mode: "TOTAL_OT_PAY";
      totalOvertimePayCents: Cents;
    };

export interface CarLoanInput {
  interestPaidCents: Cents;
  isNewVehicle: boolean;
  finalAssemblyInUS: boolean;
  /** ISO date the loan originated. */
  loanOriginationDate: string;
  personalUse: boolean;
}

export interface HouseholdInput {
  taxYear: number;
  filingStatus: FilingStatus;
  /** Base W-2 wages, EXCLUDING tips and excluding overtime pay (entered separately). */
  wagesCents: Cents;
  /** All other MAGI income: spouse wages, self-employment net income, pensions, interest, etc. */
  otherIncomeCents: Cents;
  age: number;
  spouseAge?: number;
  tips?: TipsInput;
  overtime?: OvertimeInput;
  carLoan?: CarLoanInput;
}

// ---------------------------------------------------------------------------
// Engine output
// ---------------------------------------------------------------------------

export interface PhaseOutStatus {
  thresholdCents: Cents;
  magiCents: Cents;
  /** max(0, magi − threshold) */
  excessCents: Cents;
  reductionCents: Cents;
  /** MAGI at which this deduction reaches $0 for the capped amount claimed. */
  fullyPhasedOutAtCents: Cents;
}

export interface DeductionResult {
  id: DeductionId;
  label: string;
  /** true if the user supplied inputs for this deduction. */
  claimed: boolean;
  eligible: boolean;
  /** Plain-English reasons the deduction is unavailable or reduced. */
  reasons: string[];
  /** Computed base amount before cap and phase-out (e.g. the overtime premium). */
  qualifiedAmountCents: Cents;
  capCents: Cents;
  cappedAmountCents: Cents;
  phaseOut: PhaseOutStatus | null;
  /** Final deduction after cap and phase-out. */
  deductionCents: Cents;
  notes: string[];
  citations: Citation[];
}

export interface TaxEffect {
  standardDeductionCents: Cents;
  taxableBeforeCents: Cents;
  taxableAfterCents: Cents;
  taxBeforeCents: Cents;
  taxAfterCents: Cents;
  /** taxBefore − taxAfter: the headline number. Never present the deduction amount alone. */
  estimatedTaxSavedCents: Cents;
  marginalRateBps: Bps;
}

export interface MarginalNext1000 {
  /** OBBBA deductions lost if MAGI rises by $1,000. */
  deductionsLostCents: Cents;
  /** Extra federal income tax owed on the next $1,000 (bracket + phase-out combined). */
  extraFederalTaxCents: Cents;
  /** extraFederalTax / $1,000, in bps. Can exceed the statutory bracket near a phase-out. */
  effectiveMarginalRateBps: Bps;
}

export interface EngineResult {
  taxYear: number;
  filingStatus: FilingStatus;
  magiCents: Cents;
  deductions: DeductionResult[];
  totalDeductionCents: Cents;
  tax: TaxEffect;
  marginalNext1000: MarginalNext1000;
  /** The shared $150k/$300k meter for tips/overtime (the headline phase-out). */
  primaryPhaseOut: {
    thresholdCents: Cents;
    magiCents: Cents;
    distanceToThresholdCents: Cents; // negative when over
  };
  /** Always present: tips/overtime remain subject to FICA and possibly state tax. */
  ficaNote: string;
  meta: {
    engineVersion: string;
    ruleSetVersion: string;
    computedAt: string;
    /** ruleSetVersions with verified=false — MUST be empty before launch. */
    unverifiedRuleSets: string[];
    assumptions: string[];
  };
}
