/**
 * Static content for the three design-direction mockups.
 *
 * THESE ARE MOCKUPS. Nothing here is computed at render time and no engine is
 * imported — see the note in each page. Every figure below was produced once,
 * out of band, by running `simulateAllPlans` from `src/engines/repayment` on
 * the borrower described in `BORROWER`, then frozen as a string. Using real
 * engine output rather than invented numbers is the point: a design that has
 * to hold nine rows of genuinely uneven figures — a $1,659.14 next to a
 * $308.50, a 22 yr 2 mo next to a 10 yr — is being tested honestly. Invented
 * round numbers flatter a layout that will break on the real thing.
 *
 * Provenance of every figure here:
 *   engine    src/engines/repayment, version 1.0.0
 *   asOf      8 Aug 2026
 *   loans     $61,800 Direct Unsubsidised @ 6.54%, disbursed 1 Sep 2016
 *             $80,400 Grad PLUS @ 7.54%, disbursed 1 Sep 2019
 *   household AGI $78,000, married filing jointly, family of 3, 1 dependent
 *   strategy  not pursuing PSLF, currently on New IBR, 34 qualifying payments
 *             already credited, 3% expected annual income growth
 *
 * If any of these pages ships as the real design, this file is deleted and the
 * live components read the engine directly.
 */

export type PlanRow = {
  readonly rank: number;
  /** Engine plan id, shown verbatim in the terminal direction. */
  readonly id: string;
  /** The name a borrower uses. */
  readonly name: string;
  /** First monthly payment, dollars and cents. */
  readonly monthly: string;
  /** Payments simulated until the balance resolves. */
  readonly payments: number;
  /** Human term for those payments. */
  readonly term: string;
  /** Balance forgiven, or null where the plan amortises to zero. */
  readonly forgiven: string | null;
  /** Estimated tax on that forgiveness at an assumed 22% marginal rate. */
  readonly tax: string | null;
  /** Total lifetime cost = paid over the term + tax at forgiveness. */
  readonly total: string;
  /** The same figure as a number, for bar widths only. */
  readonly totalValue: number;
  /** Month forgiveness lands, where it does. */
  readonly resolves: string;
};

/** Ranked by 30-year total cost, cheapest first. */
export const PLANS: readonly PlanRow[] = [
  {
    rank: 1,
    id: "IBR_NEW",
    name: "New IBR",
    monthly: "308.50",
    payments: 206,
    term: "17 yr 2 mo",
    forgiven: "214,223",
    tax: "47,129",
    total: "148,669",
    totalValue: 148669,
    resolves: "Oct 2043",
  },
  {
    rank: 2,
    id: "STANDARD_10",
    name: "Standard 10-year",
    monthly: "1,659.14",
    payments: 120,
    term: "10 yr",
    forgiven: null,
    tax: null,
    total: "199,096",
    totalValue: 199096,
    resolves: "Aug 2036",
  },
  {
    rank: 3,
    id: "GRADUATED",
    name: "Graduated",
    monthly: "960.24",
    payments: 120,
    term: "10 yr",
    forgiven: null,
    tax: null,
    total: "214,959",
    totalValue: 214959,
    resolves: "Aug 2036",
  },
  {
    rank: 4,
    id: "IBR_OLD",
    name: "Old IBR",
    monthly: "462.75",
    payments: 266,
    term: "22 yr 2 mo",
    forgiven: "141,556",
    tax: "31,142",
    total: "255,901",
    totalValue: 255901,
    resolves: "Oct 2048",
  },
  {
    rank: 5,
    id: "TIERED_STANDARD",
    name: "Tiered Standard",
    monthly: "1,015.05",
    payments: 300,
    term: "25 yr",
    forgiven: null,
    tax: null,
    total: "304,507",
    totalValue: 304507,
    resolves: "Aug 2051",
  },
  {
    rank: 6,
    id: "EXTENDED",
    name: "Extended",
    monthly: "1,015.05",
    payments: 300,
    term: "25 yr",
    forgiven: null,
    tax: null,
    total: "304,507",
    totalValue: 304507,
    resolves: "Aug 2051",
  },
  {
    rank: 7,
    id: "RAP",
    name: "RAP",
    monthly: "405.00",
    payments: 360,
    term: "30 yr",
    forgiven: "8,405",
    tax: "1,849",
    total: "342,092",
    totalValue: 342092,
    resolves: "Aug 2056",
  },
  {
    rank: 8,
    id: "PAYE",
    name: "PAYE",
    monthly: "308.50",
    payments: 360,
    term: "30 yr",
    forgiven: "51,229",
    tax: "11,270",
    total: "348,780",
    totalValue: 348780,
    resolves: "Aug 2056",
  },
  {
    rank: 9,
    id: "ICR",
    name: "ICR",
    monthly: "844.67",
    payments: 360,
    term: "30 yr",
    forgiven: "10,732",
    tax: "2,361",
    total: "351,861",
    totalValue: 351861,
    resolves: "Aug 2056",
  },
] as const;

export const WINNER = PLANS[0]!;
export const WORST = PLANS[PLANS.length - 1]!;

/** Widest bar in the ranked table is the dearest plan. */
export const MAX_TOTAL = WORST.totalValue;

export type Severity = "IRREVERSIBLE" | "CAUTION" | "INFO";

export type WarningRow = {
  readonly severity: Severity;
  readonly plan: string;
  /** Verbatim engine warning text. Concrete, never "please review carefully". */
  readonly message: string;
};

export const WARNINGS: readonly WarningRow[] = [
  {
    severity: "IRREVERSIBLE",
    plan: "RAP",
    message:
      "Switching to RAP forfeits your 34 qualifying payments toward IBR, PAYE or ICR forgiveness. This cannot be undone.",
  },
  {
    severity: "CAUTION",
    plan: "RAP",
    message:
      "RAP has no payment cap. At your income it costs $142,996 more over the life of your loans than the 10-year Standard plan.",
  },
  {
    severity: "CAUTION",
    plan: "PAYE, ICR",
    message:
      "PAYE and ICR end on 1 Jul 2028 under P.L. 119-21. This projection moves you to RAP on that date and restarts the forgiveness clock at 360 payments.",
  },
  {
    severity: "CAUTION",
    plan: "New IBR",
    message:
      "Forgiveness outside PSLF is taxable income under current federal law. Estimated tax at forgiveness: $47,129 at an assumed 22% marginal rate. State treatment varies.",
  },
];

export const BORROWER = {
  balance: "142,200",
  agi: "78,000",
  filing: "Married filing jointly",
  familySize: "3",
  dependents: "1",
  growth: "3.0",
  currentPlan: "New IBR",
  priorPayments: "34",
} as const;

export type LoanRow = {
  readonly type: string;
  readonly balance: string;
  readonly rate: string;
  readonly disbursed: string;
};

export const LOANS: readonly LoanRow[] = [
  {
    type: "Direct Unsubsidised",
    balance: "61,800",
    rate: "6.54",
    disbursed: "1 Sep 2016",
  },
  {
    type: "Grad PLUS",
    balance: "80,400",
    rate: "7.54",
    disbursed: "1 Sep 2019",
  },
];

/** The insight the product exists to surface, stated in one sentence. */
export const CROSSOVER = {
  headline: "Two plans, the same first payment, $200,111 apart.",
  body: "PAYE and New IBR both start at $308.50 a month. PAYE sunsets on 1 Jul 2028 and moves you to RAP, which has no payment cap and a 360-payment clock, so the plan that looks identical today ends $200,111 dearer.",
  delta: "200,111",
} as const;

/** Rendered under every figure. Data-driven on the live site; frozen here. */
export const SOURCE_LINE =
  "Simulated 8 Aug 2026 · engine 1.0.0 · ruleset 2026.07.01 · 34 C.F.R. § 685.221 and P.L. 119-21, last verified 8 Aug 2026.";

export const DIRECTIONS = [
  { slug: "a", label: "A — The Statement" },
  { slug: "b", label: "B — The Terminal" },
  { slug: "c", label: "C — The Ledger" },
] as const;
