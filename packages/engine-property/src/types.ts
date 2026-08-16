/**
 * Core types for the FairParcel over-assessment detection engine.
 *
 * INVARIANTS (see CLAUDE 2.md, portfolio invariants 1–3):
 * - Money is ALWAYS integer cents (`Cents`). Rates are basis points.
 * - No AI, no network, no dependencies anywhere in this package.
 * - Every rate/threshold/deadline lives in versioned, cited JSON under rules/.
 */

/** Always an integer number of US cents. Never a float dollar amount. */
export type Cents = number;

/** Basis points: 2.30% → 230. */
export type Bps = number;

export type PropertyClass =
  | "RESIDENTIAL"
  | "CONDO"
  | "TWO_TO_SIX_UNIT"
  | "VACANT_LAND";

/**
 * Which legal argument the analysis supports. Set per state/county in rules JSON.
 * - MARKET_VALUE: "my home is assessed above its market value" — ratios are
 *   assessedValue / recent sale price; requires comps with recent sales.
 * - UNIFORMITY: "my home is assessed unequally versus comparable homes" —
 *   ratios are assessedValue / sqft; compares assessments directly.
 */
export type ArgumentType = "MARKET_VALUE" | "UNIFORMITY";

/**
 * Which statutory model decides whether relief is available, and how much.
 *
 * Set per county in rules JSON — never branched on state code in engine code.
 * This is the same per-jurisdiction flag mechanism as `primaryArgument`.
 *
 * - GAP: relief tracks the gap between the assessment and what comparable
 *   homes imply. No statutory corridor constrains the board.
 * - COMMON_LEVEL_RANGE: a statutory ratio corridor governs. Relief is available
 *   only when the subject's assessment-to-true-value ratio falls OUTSIDE the
 *   corridor, and the relieved assessment is fixed by statute rather than by
 *   the comparables. New Jersey's Chapter 123 (N.J.S.A. 54:1-35a, 54:3-22(c),
 *   54:51A-6). Requires a `commonLevelRange` block on the county rules.
 */
export type ReliefModel = "GAP" | "COMMON_LEVEL_RANGE";

export interface Property {
  id: string;
  address: string;
  /** Neighborhood/assessment-area identifier. Comp selection requires a match
   * unless both parcels carry lat/lng and a radius is given. */
  neighborhoodId: string;
  /**
   * Taxing district the parcel sits in. Required by COMMON_LEVEL_RANGE
   * counties: New Jersey's Director's Ratio is struck per municipality, not
   * per county, so a county-level assessment level cannot stand in for it.
   * Absent → the corridor test returns CANNOT_DETERMINE.
   */
  municipalityId?: string;
  class: PropertyClass;
  sqft: number;
  beds: number;
  baths: number;
  lotSqft: number;
  yearBuilt: number;
  assessedValueCents: Cents;
  /** ISO date the current assessed value was set. */
  assessmentDate: string;
  lastSalePriceCents?: Cents;
  /** ISO date of the last arm's-length sale. */
  lastSaleDate?: string;
  lat?: number;
  lng?: number;
  /** Demo-map grid coordinates (synthetic dataset only). */
  gridX?: number;
  gridY?: number;
}

// ---------------------------------------------------------------------------
// Comp selection

export interface CompCriteria {
  /** Size window around the subject, in percent. Spec default: 20 (±20%). */
  sizeTolerancePct: number;
  /** How far back a sale (MARKET_VALUE) or assessment (UNIFORMITY) may be. */
  windowMonths: number;
  /** Keep at most this many of the most-similar candidates. */
  maxComps: number;
  /** MARKET_VALUE analysis needs a recent arm's-length sale on every comp. */
  requireSale: boolean;
  /** Optional distance filter; used only when subject and candidate both have lat/lng. */
  radiusMiles?: number;
}

export type CompRejectionReason =
  | "IS_SUBJECT"
  | "DIFFERENT_CLASS"
  | "OUTSIDE_AREA"
  | "SIZE_OUT_OF_RANGE"
  | "NO_SALE"
  | "DATA_TOO_OLD";

export interface CompRejection {
  property: Property;
  reason: CompRejectionReason;
  detail: string;
}

export interface CompSelection {
  selected: Property[];
  rejected: CompRejection[];
  criteria: CompCriteria;
}

// ---------------------------------------------------------------------------
// Ratio analysis

export interface CompRatio {
  property: Property;
  /**
   * MARKET_VALUE: assessedValueCents / lastSalePriceCents (dimensionless, ~1.0).
   * UNIFORMITY:  assessedValueCents / sqft (cents per square foot).
   */
  ratio: number;
  /** Days between the comp's evidence date (sale or assessment) and `asOf`. */
  dataAgeDays: number;
  /** True when this comp's ratio sits below the subject's — it argues the subject is over-assessed. */
  supportsCase: boolean;
}

export interface RatioAnalysis {
  argumentType: ArgumentType;
  comps: CompRatio[];
  compCount: number;
  medianRatio: number;
  /** Coefficient of dispersion of the comp ratios, in percent (IAAO ratio-study statistic). */
  cod: number;
  medianDataAgeDays: number;
  /**
   * MARKET_VALUE: the subject's estimated market value in cents
   * (median comp $/sqft × subject sqft).
   * UNIFORMITY: the subject's sqft.
   */
  subjectMarketIndicator: number;
  subjectRatio: number;
  impliedFairAssessmentCents: Cents;
  /** assessedValue − impliedFair. Negative means assessed BELOW what comps suggest. */
  overAssessmentCents: Cents;
  /** overAssessmentCents as a percent of the implied fair assessment. */
  overAssessmentPct: number;
}

// ---------------------------------------------------------------------------
// Confidence

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface Confidence {
  /** 0–100. Components: comp count (0–40), dispersion/COD (0–40), recency (0–20). */
  score: number;
  level: ConfidenceLevel;
  compCountScore: number;
  dispersionScore: number;
  recencyScore: number;
  /** Plain-English notes for the UI, one per component. */
  factors: string[];
}

// ---------------------------------------------------------------------------
// Common level range (New Jersey Chapter 123)

export type CommonLevelRangeOutcome =
  /** Ratio inside the corridor — the board may grant nothing, however large the raw gap. */
  | "NO_RELIEF"
  /** Ratio above the corridor (or above the county percentage level) — a reduction is due. */
  | "REDUCTION"
  /** Ratio below the corridor — the statute RAISES the assessment. Filing actively harms. */
  | "INCREASE"
  /** A required input is missing. The engine refuses to guess. */
  | "CANNOT_DETERMINE";

export interface CommonLevelRangeResult {
  outcome: CommonLevelRangeOutcome;
  /** The handbook clause the outcome follows from, e.g. "§1105.20(2)". */
  clause: string;
  /** Plain-English statement of why, rendered to the user verbatim. */
  explanation: string;
  municipalityId: string | null;
  municipalityName: string | null;
  /** The Director's Ratio for the district, in basis points. 78.00% → 7800. */
  averageRatioBps: Bps | null;
  lowerLimitBps: Bps | null;
  upperLimitBps: Bps | null;
  /** assessed value ÷ true value, in basis points. */
  subjectRatioBps: Bps | null;
  trueValueCents: Cents | null;
  currentAssessmentCents: Cents | null;
  /**
   * The assessment the statute produces: Average Ratio × true value (or, under
   * clause (4), County Percentage Level × true value). NOT the engine's
   * `impliedFairAssessmentCents`. Null when the test cannot run.
   */
  statutoryAssessmentCents: Cents | null;
  /**
   * currentAssessment − statutoryAssessment. Positive = reduction due,
   * NEGATIVE = statutory increase, zero = nothing changes.
   */
  reliefCents: Cents | null;
}

// ---------------------------------------------------------------------------
// Verdict

export type VerdictKind =
  | "STRONG_CASE"
  | "WORTH_FILING"
  | "NOT_WORTH_IT"
  /**
   * A statutory input the jurisdiction's relief model requires is missing. The
   * engine will not fall back to a generic threshold that bears no relation to
   * the test the board actually applies.
   */
  | "CANNOT_DETERMINE";

export interface Verdict {
  kind: VerdictKind;
  /** One-sentence plain-English headline for the verdict block. */
  headline: string;
  /** Plain-English supporting reasons, in display order. */
  reasons: string[];
  /**
   * The amount at stake under the county's relief model.
   * - GAP: the comparables gap (`analysis.overAssessmentCents`).
   * - COMMON_LEVEL_RANGE: the STATUTORY relief, current assessment −
   *   (Average Ratio × true value). Negative means the statute raises it.
   *   Zero when the ratio sits inside the corridor.
   */
  overAssessmentCents: Cents;
  overAssessmentPct: number;
  /** Estimated first-year tax overpayment: relief × county estimated rate. */
  estimatedAnnualOverpaymentCents: Cents;
  filingFeeCents: Cents;
  confidence: Confidence;
  /** The Chapter 123 working, for COMMON_LEVEL_RANGE counties. Null elsewhere. */
  commonLevelRange: CommonLevelRangeResult | null;
}

// ---------------------------------------------------------------------------
// County rules (shape per spec 04-property-tax-appeal.md §1.2)

export interface Citation {
  label: string;
  url: string;
  lastVerified: string;
  /** False until the value has been confirmed against the primary source.
   * Unverified entries are listed in VERIFICATION-NEEDED.md. */
  verified: boolean;
}

export type DeadlineKind = "FIXED_ANNUAL" | "NOTICE_RELATIVE";

/**
 * What actually satisfies the deadline.
 * - RECEIVED_BY: the petition must be in the board's hands. Posting it on the
 *   deadline loses the year (New Jersey: "A postmark of a mailed petition is
 *   not sufficient" — Assessors Handbook §1105.01).
 * - POSTMARK: mailing by the deadline is enough.
 * Omitted where the distinction has not been verified from a primary source.
 */
export type FilingCutoff = "RECEIVED_BY" | "POSTMARK";

export interface AppealWindow {
  opens: string;
  /** "YYYY-MM-DD or rule" per spec — human-readable. */
  deadline: string;
  deadlineRule: string;
  /** Machine-readable variant driving the countdown. */
  deadlineKind: DeadlineKind;
  /** FIXED_ANNUAL only: recurring deadline month/day. */
  fixedMonth?: number;
  fixedDay?: number;
  /** NOTICE_RELATIVE only: days after the assessment notice mails. */
  daysAfterNotice?: number;
  /** Delivery vs postmark. Omit when unverified — the UI then says nothing. */
  filingCutoff?: FilingCutoff;
  /** One sentence stating the cutoff, shown to the user verbatim. */
  filingCutoffNote?: string;
}

// ---------------------------------------------------------------------------
// Filing fee schedule

/**
 * One band of a statutory fee schedule. Bands are ordered ascending and
 * contiguous: `min` is inclusive, `maxExclusive` is exclusive, and the last
 * band carries `maxExclusive: null`.
 */
export interface FilingFeeBand {
  minAssessedValueCents: Cents;
  maxAssessedValueCentsExclusive: Cents | null;
  amountCents: Cents;
  /** Human-readable band label, e.g. "$500,000 to under $1,000,000". */
  label: string;
}

// ---------------------------------------------------------------------------
// Common level range rules (New Jersey Chapter 123)

/**
 * A single taxing district's Average Ratio (Director's Ratio).
 *
 * Republished by the Director, Division of Taxation on 1 April every year, per
 * municipality — so it is dated, versioned, cited data like every other rule,
 * never a constant.
 */
export interface MunicipalityAverageRatio {
  municipalityId: string;
  name: string;
  /** Director's Ratio in basis points. 78.00% → 7800. */
  averageRatioBps: Bps;
  /** The tax year this ratio governs. */
  taxYear: number;
  effectiveFrom: string;
  effectiveTo: string;
  citations: Citation[];
}

export interface CommonLevelRangeRules {
  statute: string;
  /**
   * Corridor half-width applied MULTIPLICATIVELY to the average ratio, in basis
   * points. 15% → 1500. Lower limit = avg × (1 − 0.15); upper = avg × (1 + 0.15).
   * NOT 15 percentage points: handbook §1105.19 works 78.00% → 66.30% / 89.70%.
   */
  corridorBps: Bps;
  /** County Percentage Level, in basis points. 100% → 10000. */
  countyPercentageLevelBps: Bps;
  /** Month-day the table is republished, "MM-DD". */
  republishedOn: string;
  /** Where to re-fetch the table each year. */
  sourceUrl: string;
  /** Per-municipality ratios. EMPTY until real values are fetched and verified. */
  municipalities: MunicipalityAverageRatio[];
  /** Why the table may be empty. Shown to the user when it is. */
  unpopulatedNote: string;
}

export interface CountyForm {
  id: string;
  name: string;
  pdfUrl: string;
  fillable: boolean;
}

export interface CountyRules {
  countyId: string;
  state: string;
  stateName: string;
  countyName: string;
  ruleSetVersion: string;
  citations: Citation[];
  appealWindow: AppealWindow;
  filingFee: {
    /**
     * The fee when assessed value is unknown, and the whole fee where the
     * county charges a flat one. Where `bands` is present it is the schedule
     * that governs — always read the fee through `filingFeeFor()`.
     */
    amountCents: Cents;
    /** Statutory schedule banded by assessed value. Absent → flat fee. */
    bands?: FilingFeeBand[];
    waiverConditions: string;
  };
  appealBody: string;
  levels: string[];
  forms: CountyForm[];
  evidenceStandard: string;
  argumentTypes: ArgumentType[];
  /** Which analysis the engine runs for this county. */
  primaryArgument: ArgumentType;
  /**
   * Which statutory relief model decides the verdict. The per-jurisdiction
   * flag that keeps `verdict.ts` free of "if NJ" branches.
   */
  reliefModel: ReliefModel;
  /** Required when reliefModel is COMMON_LEVEL_RANGE; absent otherwise. */
  commonLevelRange?: CommonLevelRangeRules;
  /** Comp sale/assessment recency window used for selection. */
  compsWindowMonths: number;
  /** Statutory assessment level as % of market value (informational). */
  assessmentLevelPctOfMarket: number;
  /**
   * Estimated effective tax rate applied to ASSESSED value, in basis points.
   * Drives the "estimated annual overpayment" figure. An estimate — marked
   * UNVERIFIED in VERIFICATION-NEEDED.md until confirmed from primary sources.
   */
  estimatedTaxRateOnAssessedBps: Bps;
  successRateNote: { value: string; source: string } | null;
}

// ---------------------------------------------------------------------------
// Deadline

export interface DeadlineInfo {
  kind: DeadlineKind;
  /** ISO date of the next deadline, when computable; null for notice-relative rules. */
  isoDate: string | null;
  /** Whole days from `asOf` to the deadline; null when not computable. */
  daysAway: number | null;
  /** Always present: the human-readable rule. */
  ruleText: string;
  /** Delivery vs postmark, or UNSPECIFIED where the county rules do not say. */
  filingCutoff: FilingCutoff | "UNSPECIFIED";
  /** The cutoff sentence to show the user; null when UNSPECIFIED. */
  filingCutoffNote: string | null;
}

// ---------------------------------------------------------------------------
// Full check result — the one object the app renders

export interface AssessmentCheck {
  subject: Property;
  county: CountyRules;
  selection: CompSelection;
  analysis: RatioAnalysis;
  confidence: Confidence;
  verdict: Verdict;
  deadline: DeadlineInfo;
  meta: {
    engineVersion: string;
    ruleSetVersion: string;
    asOfDate: string;
  };
}
