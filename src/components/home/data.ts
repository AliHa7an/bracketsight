/**
 * ═════════════════════════════════════════════════════════════════════════════
 * HOME PAGE CONTENT — and the provenance of every figure on it.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Three kinds of number appear on the home page, and the distinction matters
 * more than any of the styling does. A reader is being asked to believe figures
 * about money; the least this file can do is say where each one came from.
 *
 *   1. THE HERO PANEL IS LIVE. `CliffPanel` imports `analyzeHousehold` from
 *      `@/engines/aca` and computes in the reader's browser as they drag. This
 *      file holds only the fixed inputs the demo keeps constant — `ACA_DEMO`
 *      below — so the page and the client component cannot disagree about which
 *      household is being modelled. Nothing in the panel is transcribed.
 *
 *   2. THE PROOF STRIP IS BUILD-TIME. `@/lib/proof` derives all four figures
 *      from this repository during `next build`: the suite is run and counted,
 *      VERIFICATION-STATUS.md is parsed, the rule files are walked, the newest
 *      `lastVerified` is found. No figure in that strip is written by hand
 *      anywhere, here or in the component.
 *
 *   3. THE FIVE TOOL-CARD EXAMPLES ARE FROZEN, AND COMPUTED OUT OF BAND. A card
 *      is an advertisement for a tool, so its example has to be a specific
 *      household's real answer rather than a plausible-looking round number.
 *      Each figure below was produced by running the engine named in the block
 *      comment above it, on the inputs stated there, on the date stated there,
 *      and then written down.
 *
 *      They are frozen strings and they WILL drift the moment a rule file
 *      changes. That is the accepted cost of not shipping five simulations into
 *      the home page's critical path, and it is bounded: every one of them is
 *      an `asOf`-pinned run whose inputs are recorded here in full, so
 *      reproducing any card is a copy-paste. IF YOU CHANGE A RULE FILE, re-run
 *      the block comments' inputs and update the strings — a stale example on
 *      the page that argues its figures are dated is the one defect this site
 *      cannot afford.
 *
 * WHAT IS SAMPLE DATA rather than a verified rule is said on the card that
 * shows it, not in a footnote elsewhere. Two of the five rest partly on sample
 * inputs — the ACA benchmark premiums (pending the CMS county landscape file)
 * and the property comparables (a synthetic demo neighbourhood) — and both
 * captions say so in the reader's sight line.
 */

import type { SectionSlug } from "@/lib/site";

/* ═══════════════════════════════════════ the line under the headline ══ */

/**
 * The trust strip. Four claims, each one either true of the code or not; none
 * is a promise about the future. Rendered as one line with hairline separators
 * rather than four ticks, because four ticks reads as a pricing table and this
 * is a masthead. Each claim is set out in full further down the page, under
 * "Why trust a number from here?".
 */
export const TRUST_STRIP = [
  "rules cited",
  "no AI arithmetic",
  "nothing stored",
  "free, no signup",
] as const;

export const CTA_LABEL = "Choose your question";

/* ══════════════════════════════════════ the live ACA panel's household ══ */

/**
 * The household the hero panel models. Everything except MAGI is fixed, and
 * every one of these values is printed in the panel — a live number that hides
 * its inputs is a worse number than a static one.
 *
 * A family of three in Travis County, ages 52, 50 and 17, sits where the cliff
 * actually bites: old enough for the age-rated benchmark premium to be large,
 * and at an income where $1 either side of the line is a five-figure swing.
 */
export const ACA_DEMO = {
  county: "Travis County, TX",
  countyId: "travis-tx",
  household: "Married filing jointly · family of 3 · ages 52, 50 and 17",
  minMagi: 40_000,
  maxMagi: 130_000,
  stepMagi: 200,
  defaultMagi: 100_000,
  /** Held fixed so the panel is reproducible rather than drifting by the day. */
  asOf: "2026-08-01",
} as const;

/* ═════════════════════════════════════════════════════ the tool cards ══ */

export interface WorkedExample {
  /** The finding, in the data face. One line where it can be. */
  readonly figure: string;
  /** The inputs that produced it, plus any sample-data caveat. */
  readonly caption: string;
}

export interface ToolCard {
  readonly slug: SectionSlug;
  /** Small-caps label. The tool's name as the reader knows it. */
  readonly eyebrow: string;
  /** The question the tool answers, in the reader's words. Never underlined. */
  readonly question: string;
  /**
   * ONE SHARP LINE, and it is a budget rather than a style note.
   *
   * A card is a question, one line, the worked example, the CTA. Nothing more.
   * These bodies were five and six lines each; at 390px that made five cards
   * 2,930px tall on their own and the page ten screens long, which is the
   * failure a reader experiences as "there is too much here to read". Every
   * body below is now the single most load-bearing sentence about the tool —
   * usually the trap the tool exists to surface. Keep them under ~120
   * characters: that is two lines at 390px and one on a laptop.
   */
  readonly body: string;
  readonly example: WorkedExample;
  /** Button label naming the outcome, never "Learn more". */
  readonly cta: string;
  readonly href: string;
  /** The flagship. Rendered double-width with a "start here" badge. */
  readonly flagship?: boolean;
}

/**
 * LOANS — the flagship.
 *
 * PROVENANCE. `simulateAllPlans` from `@/engines/repayment` 1.0.0, rule set
 * `rap-2026-07-01+plan-terms-2026-07-01+poverty-guidelines-2026+tax-2026`, run
 * 19 Aug 2026 with `asOf` 1 Aug 2026 on:
 *
 *   loans     $61,800 Direct Unsubsidised @ 6.54%, first disbursed 1 Sep 2016
 *             $80,400 Direct Grad PLUS   @ 7.54%, first disbursed 1 Sep 2019
 *             → aggregate $142,200 at a weighted 7.11%
 *   household AGI $80,000 · single · family of 1 · no dependents · contiguous 48
 *   strategy  not pursuing PSLF · 0 prior qualifying payments · 3% growth
 *
 * Totals in cents, all nine plans:
 *   STANDARD_10     19_909_602   first payment 165_914
 *   IBR_NEW         20_609_473   first payment  46_717
 *   GRADUATED       21_495_931   first payment  96_024
 *   TIERED_STANDARD 30_450_717   first payment 101_505
 *   EXTENDED        30_450_717   first payment 101_505
 *   ICR             33_409_308   first payment 106_733
 *   RAP             33_924_919   first payment  46_667  ← smallest payment
 *   IBR_OLD         34_080_318   first payment  70_075
 *   PAYE            37_003_225   first payment  46_717  ← dearest
 *
 * `recommendation.theyDisagree` is true for this borrower: the cheapest plan
 * (Standard 10) and the smallest payment (RAP) are different plans, and RAP is
 * the third-dearest of the nine. That disagreement is the whole product, so it
 * is what the card leads with. Spread = 37_003_225 − 19_909_602 = $170,936.23.
 */
export const LOANS_LEDGER = [
  {
    name: "Standard 10-year",
    total: "$199,096",
    note: "cheapest of the nine · $1,659 a month",
    /** Each total as a percentage of the dearest, from the cents above. */
    pct: 53.8,
    key: true,
  },
  {
    name: "RAP",
    total: "$339,249",
    note: "smallest payment of the nine · $467 a month",
    pct: 91.7,
    key: false,
  },
  {
    name: "PAYE",
    total: "$370,032",
    note: "dearest · sunsets 1 Jul 2028, then RAP",
    pct: 100,
    key: false,
  },
] as const;

/**
 * PAYCHECK.
 *
 * PROVENANCE. `computeDeductions` from `@/engines/paycheck` 0.1.0, rule set
 * `tips-2026.1+overtime-2026.1+senior-2026.1+car-loan-2026.1+brackets-2026.1
 * +occupations-2026.1`, run 19 Aug 2026, tax year 2026, on:
 *
 *   single filer, age 34
 *   wages     $130,000
 *   tips      $18,000, occupation code 102, employee, properly reported
 *   overtime  $12,000 of gross overtime pay
 *   → MAGI $160,000, which is $10,000 past the $150,000 phase-out threshold
 *
 * Result: TIPS deductible $17,000 (reduced from $18,000), OVERTIME deductible
 * $3,000 (reduced from $4,000 — the premium half of $12,000 at 1.5×), total
 * $20,000, federal tax saved $4,800 at a 24% bracket rate.
 *
 * `marginalNext1000`: deductions lost $200, extra federal tax $288, effective
 * marginal rate 2,880 bps. Two deductions phase out off the same MAGI at once,
 * so the next $1,000 of income is taxed at 28.8% inside a 24% bracket. That
 * interaction is the tool's central insight and it is what the card shows.
 */

/**
 * ACA.
 *
 * PROVENANCE. `analyzeHousehold` from `@/engines/aca` 0.1.0, rule set
 * `cliffcheck-rules-2026.draft-1`, run 19 Aug 2026 with `asOf` 1 Aug 2026 on
 * the `ACA_DEMO` household above:
 *
 *   MAGI $106,600  → status ELIGIBLE, Form-8962 line 5 = 400, annual PTC $14,901.60
 *   MAGI $106,601  → status CLIFF,    Form-8962 line 5 = 401, annual PTC $0
 *
 * The edge itself ($106,600) is `cliff.cliffEdgeMagi` and the credit at stake
 * is `cliff.creditAtStake`. Benchmark premiums come from the engine's sample
 * SLCSP table pending the CMS county landscape file, which is why the caption
 * says "this household" and both the card and the panel say the premiums are
 * sample data.
 */

/**
 * PROPERTY.
 *
 * PROVENANCE. `runAssessmentCheck` from `@/engines/property` 0.1.0, Cook
 * County rules, run 19 Aug 2026 with `asOf` 8 Aug 2026 on sample parcel
 * DEMO-001 against the eight comparables that survive the filters in the
 * bundled synthetic demo neighbourhood:
 *
 *   verdict STRONG_CASE · over-assessed 15.17% · $8,378.62 of assessed value
 *   estimated annual overpayment $1,675.72 · 8 comps · COD 1.53 · confidence HIGH
 *
 * The comparables are synthetic demo data, not Cook County's roll. The caption
 * says so — a worked example built on sample parcels that does not admit it is
 * exactly the kind of figure this site exists to argue against.
 */

/**
 * TRADES.
 *
 * PROVENANCE. `buildEstimate` from `@/engines/trades`, rule set
 * `trades-decks-2026-08` (citations last verified 8 Aug 2026), run 19 Aug 2026
 * with `asOf` 1 Aug 2026 on: a new deck, 16 ft × 12 ft, 40 linear ft of
 * railing, 4 stair steps, mid grade, standard access, southeast region, at the
 * rules' taught defaults of 10% overhead and 15% profit.
 *
 *   materials $4,032.21 · labour $3,415.55 · subtotal $7,447.76
 *   overhead    $744.78 · profit $1,228.88 · total    $9,421.42
 *   range $8,479.28 – $11,117.28 across 6 line items
 *
 * Pricing data is reference data pending contractor review, and the card's
 * caption says the number is a range rather than a quote.
 */

export const TOOL_CARDS: readonly ToolCard[] = [
  {
    slug: "loans",
    eyebrow: "Student loans",
    question: "Which of the 9 federal repayment plans costs you least over 30 years?",
    body: "Ranked by 30-year total, not by monthly payment. Switching to RAP forfeits every payment already credited under IBR, PAYE or ICR.",
    example: {
      figure: "$170,936 between the cheapest plan and the dearest",
      caption:
        "$142,200 across two loans, $80,000 of income. The smallest monthly payment is the third-dearest of the nine.",
    },
    cta: "Compare all 9 plans",
    href: "/loans",
    flagship: true,
  },
  {
    slug: "paycheck",
    eyebrow: "Paycheck",
    question: "Which OBBBA deductions is your pay owed — and does your W-2 show them?",
    body: "Tips and the overtime premium phase out off one MAGI, so a raise can cost more than it pays.",
    example: {
      figure: "The next $1,000 costs $288 — a 28.8% rate inside the 24% bracket",
      caption:
        "$130,000 wages, $18,000 tips, $12,000 overtime — $10,000 past the $150,000 threshold.",
    },
    cta: "Check your deductions",
    href: "/paycheck",
  },
  {
    slug: "aca",
    eyebrow: "Health cover",
    question: "How close is your household to the 400% subsidy cliff?",
    body: "Above 400% of the poverty line the credit stops rather than tapers, and advance credit already taken is repaid in full.",
    example: {
      figure: "$106,600 → $14,902 a year. $106,601 → $0.",
      caption:
        "The family of three in the panel above. Benchmark premiums are sample data pending the CMS county file.",
    },
    cta: "Measure your cliff distance",
    href: "/aca",
  },
  {
    slug: "property",
    eyebrow: "Property tax",
    question: "Is your home over-assessed enough to be worth appealing?",
    body: "Comparables and a median ratio, then one verdict — strong case, worth filing, or not worth the fee. No contingency cut.",
    example: {
      figure: "15.17% over · $1,676 a year · strong case",
      caption:
        "A Cook County parcel, 8 comparables. Comparables are the bundled synthetic demo neighbourhood, not a live county roll.",
    },
    cta: "Test your assessment",
    href: "/property",
  },
  {
    slug: "trades",
    eyebrow: "Trades",
    question: "What should this job cost, and what must the contract say in your state?",
    body: "An itemised estimate with the basis for every line, plus a contract carrying your state's required clauses.",
    example: {
      figure: "$9,421 · range $8,479 – $11,117",
      caption:
        "A 16 × 12 ft mid-grade deck, southeast, 6 line items, 10% overhead, 15% profit. Reference pricing, never a quote.",
    },
    cta: "Price a job",
    href: "/trades",
  },
] as const;

/* ═══════════════════════════════════════════════ why trust a figure ══ */

/**
 * The four trust claims, unchanged in substance from the page they replace.
 * Each has a punchy line the eye lands on and the full claim underneath it;
 * shortening one to fit a card would be softening it, and these four are the
 * only reason to believe anything else on the page.
 *
 * `body` IS QUOTED VERBATIM AND IS NOT A CANDIDATE FOR CUTTING, ever, in any
 * pass that is trying to make the page shorter. `lede` is a one-line summary of
 * the body written for the eye, so it is fair game — two of them ran to a second
 * line on a phone and were tightened, which is the only change here.
 */
export const TRUST_POINTS: readonly {
  readonly id: string;
  readonly heading: string;
  readonly lede: string;
  readonly body: string;
}[] = [
  {
    id: "cited",
    heading: "Every rule is cited and dated",
    lede: "One file changes, every page updates.",
    body: "Rates, thresholds, brackets and deadlines live in versioned JSON with a link to the regulation and the date it was last checked against it. When a rule changes, one file changes and every page that depends on it updates.",
  },
  {
    id: "no-ai",
    heading: "No AI touches the arithmetic",
    lede: "No dependencies, no network, nothing to call through.",
    body: "The five engines are plain TypeScript with zero dependencies and no network access, so there is nothing for a model call to be made through. Two AI features are planned and neither is live: reading an uploaded document to fill a form in, and explaining a result in words. Neither would ever compute a figure you are shown.",
  },
  {
    id: "nothing-stored",
    heading: "Nothing you enter is stored",
    lede: "No account, no database, no server to send it to.",
    body: "No account, no signup wall, no database. What you type stays in your own browser and is never sent to a server, because there is no server to send it to. A shared scenario link carries its numbers in the URL fragment, which browsers never transmit.",
  },
  {
    id: "estimates",
    heading: "Estimates, not promises",
    lede: "Irreversible choices are flagged in red first.",
    body: "Every figure is an estimate under current rules. Irreversible choices are flagged in red before you make them, and the site says plainly when a case is one to take to your servicer, your county or a licensed adviser.",
  },
];

/**
 * How a rule becomes a number. Four nodes, three steps, drawn once as a
 * horizontal run with hairline connectors. It is the site's whole method, and
 * it is the answer to the only question a sceptical reader has.
 *
 * One line each. The bodies were three and four lines apiece, which turned the
 * closing figure of the trust band into four more grey paragraphs — the same
 * defect as the tool cards, one band further down. Nothing was dropped that
 * carries a claim: the primary-source rule, the citation contract, the integer
 * cents and the link back to the regulation are all still stated.
 */
export const RULE_PIPELINE: readonly {
  readonly step: string;
  readonly title: string;
  readonly body: string;
}[] = [
  {
    step: "01",
    title: "The regulation",
    body: "A statute, a Federal Register notice, an IRS procedure. A secondary source may cross-check a value, never close one.",
  },
  {
    step: "02",
    title: "A versioned rule file",
    body: "Into JSON with the dates it takes effect and stops, and a citation with a URL. Never into the code that uses it.",
  },
  {
    step: "03",
    title: "A deterministic engine",
    body: "Plain TypeScript, no dependencies, no network. Integer cents and basis points, because float drift over 360 iterations lies.",
  },
  {
    step: "04",
    title: "Your result",
    body: "Every option priced under the same rules, ranked by what you pay, with a link back to the regulation that decided it.",
  },
];
