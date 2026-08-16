/**
 * packages/engine — CliffCheck ACA engine.
 *
 * INVARIANTS (see CLAUDE.md — build-breaking if violated):
 *  - Zero dependencies, zero AI, zero network. Pure deterministic TypeScript.
 *  - Money is integer cents. Rates and percentages are integer basis points.
 *  - Every rate/threshold/bracket lives in versioned, cited JSON under ./rules.
 */

/** Always an integer number of cents. Never a float dollar amount. */
export type Cents = number;

/** Always an integer number of basis points. 9.96% → 996. 400% FPL → 40000. */
export type BasisPoints = number;

export type FilingStatus =
  | "SINGLE"
  | "MARRIED_JOINT"
  | "MARRIED_SEPARATE"
  | "HEAD_OF_HOUSEHOLD";

export type StateGroup = "CONTIGUOUS_48" | "ALASKA" | "HAWAII";

/** Two-letter USPS state code, e.g. "TX". */
export type StateCode = string;

// ---------------------------------------------------------------------------
// MAGI
// ---------------------------------------------------------------------------

/**
 * MAGI for §36B premium tax credit purposes =
 *   AGI
 * + tax-exempt interest (Form 1040 line 2a)
 * + excluded foreign earned income (§911)
 * + non-taxable Social Security benefits.
 * This is NOT the same MAGI used for IRA deductibility — a common user error.
 */
export interface MagiComponents {
  agi: Cents;
  taxExemptInterest: Cents;
  excludedForeignIncome: Cents;
  nonTaxableSocialSecurity: Cents;
}

export interface MagiBreakdown extends MagiComponents {
  magi: Cents;
}

// ---------------------------------------------------------------------------
// Household / PTC
// ---------------------------------------------------------------------------

export interface Household {
  filingStatus: FilingStatus;
  /** Tax family size (you + spouse + dependents) — drives the FPL line. */
  familySize: number;
  /** USPS state code — drives Medicaid-expansion logic and the FPL state group. */
  stateCode: StateCode;
  /** Key into the SLCSP sample table (v1 ships sample counties only). */
  countyId: string;
  /** Ages of the household members enrolling in marketplace coverage. */
  coveredMemberAges: number[];
}

export type PtcStatus =
  /** MAGI ≤ 400% FPL and ≥ 100% (or 138% floor handled by Medicaid referral). */
  | "ELIGIBLE"
  /** MAGI over 400% FPL — the cliff. PTC is $0. */
  | "CLIFF"
  /** Expansion state below 138% FPL — Medicaid, not marketplace credit. */
  | "MEDICAID_REFERRAL"
  /** Non-expansion state below 100% FPL — the coverage gap. */
  | "COVERAGE_GAP"
  /** Married filing separately is generally ineligible for the PTC. */
  | "FILING_STATUS_INELIGIBLE";

export interface PtcResult {
  status: PtcStatus;
  magi: Cents;
  /** The applicable poverty line for this family size and state group. */
  fpl: Cents;
  /** Precise FPL percentage in basis points (401.37% → 40137). */
  fplBps: BasisPoints;
  /**
   * FPL percentage as Form 8962 line 5 carries it, via Worksheet 2: 401 when
   * household income is more than 4.0 × FPL (ineligible), otherwise the ratio
   * truncated to a whole percent ("drop any numbers after the decimal point").
   * The ceiling test runs BEFORE truncation, so this is never 400 for a
   * household above the line. Eligibility and the applicable-percentage
   * lookup use THIS number.
   */
  fplPctForm: number;
  /** Applicable percentage in basis points, or null when no credit applies. */
  applicableBps: BasisPoints | null;
  /** MAGI × applicable percentage — the household's expected annual share. */
  expectedAnnualContribution: Cents;
  /** Annual second-lowest-cost Silver plan premium for the covered members. */
  benchmarkAnnualPremium: Cents;
  annualPtc: Cents;
  monthlyPtc: Cents;
  notes: string[];
}

// ---------------------------------------------------------------------------
// CSR — cost-sharing reductions (the second, smaller cliff at 250%)
// ---------------------------------------------------------------------------

export type CsrBand = "94" | "87" | "73" | null;

export interface CsrResult {
  /** Actuarial-value band: 94/87/73, or null above 250% FPL. */
  band: CsrBand;
  /** Actuarial value in basis points (94% → 9400), null when no CSR. */
  actuarialValueBps: BasisPoints | null;
  /** True when the household sits within $ steps of losing a band. */
  notes: string[];
}

// ---------------------------------------------------------------------------
// Advance-credit reconciliation (Form 8962)
// ---------------------------------------------------------------------------

export interface ClawbackInput {
  /** Advance PTC actually paid to the insurer during the year. */
  aptcAnnual: Cents;
  /** Final PTC per the year-end MAGI. */
  finalPtcAnnual: Cents;
  fplPctForm: number;
  filingStatus: FilingStatus;
}

export interface ClawbackResult {
  /** APTC minus final PTC (positive = you owe). */
  excessAdvance: Cents;
  /** What you actually repay after any repayment limitation. */
  repaymentDue: Cents;
  /** Additional credit refunded when the final PTC exceeds the advance. */
  additionalCredit: Cents;
  /** The statutory repayment cap that applied, or null when uncapped. */
  capApplied: Cents | null;
  /**
   * True when no repayment limitation applies and the whole excess is repaid.
   * For 2026 this is true at EVERY income level: OBBBA §71305 struck IRC
   * §36B(f)(2)(B) for tax years beginning after 2025.
   */
  uncapped: boolean;
  notes: string[];
}

// ---------------------------------------------------------------------------
// Levers — the product
// ---------------------------------------------------------------------------

export type LeverId =
  | "TRADITIONAL_401K"
  | "HSA"
  | "TRADITIONAL_IRA"
  | "SEP_SOLO_401K"
  | "SE_HEALTH_INSURANCE"
  | "INCOME_TIMING";

export type HdhpCoverage = "NONE" | "SELF" | "FAMILY";

/** Facts the lever engine needs beyond the PTC inputs. All optional-by-zero. */
export interface LeverContext {
  /** Primary taxpayer's age at year end (drives 50+/55+ catch-ups). */
  age: number;
  /** W-2 wages — elective deferrals can't exceed compensation. */
  wagesW2: Cents;
  /** Net self-employment profit (Schedule C) — drives SEP/Solo-401(k)/SEHI. */
  selfEmploymentNetProfit: Cents;
  /** High-deductible health plan enrollment — HSA eligibility gate. */
  hdhpCoverage: HdhpCoverage;
  /** Active participant in an employer retirement plan (IRA deductibility). */
  coveredByEmployerPlan: boolean;
  /** Spouse is an active participant (raises a different IRA phase-out). */
  spouseCoveredByEmployerPlan: boolean;
  /** Already contributed this year — the engine ranks *remaining* room. */
  ytd401k: Cents;
  ytdHsa: Cents;
  ytdIra: Cents;
  ytdSep: Cents;
  /** Annual marketplace premium actually paid — needed for the SEHI lever. */
  annualHealthPremium: Cents;
}

export interface LeverResult {
  id: LeverId;
  label: string;
  eligible: boolean;
  ineligibilityReasons: string[];
  /** Remaining legal room in this lever for this household, this year. */
  maxAvailable: Cents;
  /**
   * Smallest contribution that brings the Form-8962 FPL% back to ≤400.
   * Null when the household is not over the cliff, or when this lever
   * alone cannot reach it.
   */
  amountToClearCliff: Cents | null;
  /** The contribution the engine actually simulated for this ranking. */
  modeledAmount: Cents;
  magiAfter: Cents;
  fplBpsAfter: BasisPoints;
  fplPctFormAfter: number;
  ptcBefore: Cents;
  ptcAfter: Cents;
  creditRecovered: Cents;
  /**
   * Dollars of credit recovered per dollar committed, in basis points
   * (14200 = $1.42 recovered per $1.00 committed). Null when nothing
   * was modeled or the lever is advisory-only.
   */
  recoveredPerDollarBps: BasisPoints | null;
  /** True for income timing — never auto-advised, no amounts computed. */
  advisoryOnly: boolean;
  warnings: string[];
  /** The marketing sentence, engine-generated so every number is computed. */
  sentence: string;
}

// ---------------------------------------------------------------------------
// Top-level analysis
// ---------------------------------------------------------------------------

export interface CliffAnalysisInput {
  household: Household;
  income: MagiComponents;
  levers?: Partial<LeverContext>;
  /** Monthly advance credit currently being paid to the insurer, if any. */
  aptcMonthly?: Cents;
}

export interface CliffGeometry {
  /** True when Form-8962 FPL% exceeds 400. */
  overCliff: boolean;
  /** Highest MAGI that still truncates to ≤400% FPL. */
  cliffEdgeMagi: Cents;
  /**
   * Under the cliff: dollars of additional income before falling off.
   * Over the cliff: dollars of MAGI reduction needed to climb back.
   */
  distanceToEdge: Cents;
  /** The annual PTC at stake at the edge — what one extra dollar can cost. */
  creditAtStake: Cents;
  /** The 250% CSR ledge, same geometry. */
  csrEdgeMagi: Cents;
  distanceToCsrEdge: Cents;
}

export interface CliffAnalysis {
  magi: MagiBreakdown;
  ptc: PtcResult;
  csr: CsrResult;
  cliff: CliffGeometry;
  clawback: ClawbackResult | null;
  levers: LeverResult[];
  meta: {
    engineVersion: string;
    ruleSetVersion: string;
    computedAt: string;
  };
}
