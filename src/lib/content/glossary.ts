/**
 * The glossary.
 *
 * Every term these five tools put in front of a reader who did not ask to
 * learn it. Each entry answers three questions in order — what it is, why it
 * decides something, and where to check it — because a definition that stops
 * at "what it is" leaves the reader exactly where they started: holding a word
 * and no decision.
 *
 * TWO RULES THIS FILE KEEPS
 *
 * 1. NO FIGURE IS TYPED HERE. Where a definition needs a number it calls
 *    `figureText()`, and where a number deserves its provenance on screen the
 *    entry lists a figure id and the page renders it with its citation, its
 *    rule set version, and any open item from `KNOWN-GAPS.md`. A glossary that
 *    hard-codes "400%" is a second, unmaintained copy of the rules — and the
 *    one people quote, because glossaries are what people quote.
 *
 * 2. EVERY ENTRY CITES A PRIMARY SOURCE. Not a summary, not another page on
 *    this site. Where the project's own register records that a source could
 *    not be fetched, the figure the entry renders carries that disclosure with
 *    it, so the reader sees the doubt at the same moment as the number.
 *
 * Definitions are written as functions so a figure is resolved when the page
 * renders rather than when this module is imported — which keeps the rule
 * loaders out of the import graph of anything that only wanted the term list.
 */

import { figureText, type FigureId, type FigureTableId } from "./figures";
import type { SectionSlug } from "@/lib/site";

export interface GlossarySource {
  readonly label: string;
  readonly url: string;
  /** The day this URL was last read. Null where nobody has fetched it yet. */
  readonly lastVerified: string | null;
}

export interface GlossaryEntry {
  /** The anchor. `/glossary#magi` — stable, never renamed once published. */
  readonly id: string;
  readonly term: string;
  /** What the abbreviation stands for, when it is one. */
  readonly expansion?: string;
  /** Which tools use it. Drives the "where this appears" links. */
  readonly tools: readonly SectionSlug[];
  /** Plain English, for someone who is stressed and not an expert. */
  readonly definition: () => string;
  /** What decision it changes. The part a dictionary would not have. */
  readonly whyItMatters: () => string;
  /** Figures rendered under the entry with full provenance. */
  readonly figures?: readonly FigureId[];
  /** Tables rendered under the entry. */
  readonly tables?: readonly FigureTableId[];
  readonly source: GlossarySource;
  /** Other entry ids. Rendered as anchor links. */
  readonly seeAlso?: readonly string[];
}

/* Primary sources reused across entries, declared once so a URL cannot drift
   between two definitions of related terms. Every one of these is a URL this
   repository already cites in a rules file. */
const RISE_RULE: GlossarySource = {
  label:
    "34 C.F.R. §§ 685.208–685.209 as revised by the RISE final rule, 91 Fed. Reg. 23768 (1 May 2026)",
  url: "https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm",
  lastVerified: "2026-08-15",
};

const FORM_8962: GlossarySource = {
  label: "IRS Form 8962 instructions — Premium Tax Credit",
  url: "https://www.irs.gov/pub/irs-pdf/i8962.pdf",
  lastVerified: "2026-08-15",
};

const OBBBA: GlossarySource = {
  label: "P.L. 119-21 — full text (govinfo)",
  url: "https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm",
  lastVerified: "2026-08-15",
};

export const GLOSSARY: readonly GlossaryEntry[] = [
  /* ───────────────────────────────────────────────── income and thresholds ── */
  {
    id: "magi",
    term: "MAGI",
    expansion: "Modified adjusted gross income",
    tools: ["paycheck", "aca"],
    definition: () =>
      "Your adjusted gross income with certain items added back — most commonly tax-exempt " +
      "interest, excluded foreign earned income, and the non-taxable part of Social Security " +
      "benefits. There is no single MAGI: each credit and deduction defines its own, and the " +
      "definition that governs the health-insurance premium tax credit is not the one that " +
      "governs a traditional IRA deduction.",
    whyItMatters: () =>
      "MAGI, not salary and not taxable income, is the number every phase-out and every " +
      "eligibility cliff is measured against. It is also partly controllable after the year " +
      "has ended: a deductible retirement or HSA contribution reduces it directly. Near a " +
      "cliff that makes a dollar of MAGI reduction worth far more than its marginal tax value.",
    figures: ["paycheck.tips.phaseOutSingle"],
    source: {
      label: "IRC § 36B(d)(2)(B) — modified adjusted gross income, as defined for the premium tax credit",
      url: "https://www.law.cornell.edu/uscode/text/26/36B",
      lastVerified: "2026-08-08",
    },
    seeAlso: ["phase-out", "applicable-percentage", "advance-premium-tax-credit"],
  },
  {
    id: "fpl",
    term: "FPL",
    expansion: "Federal poverty level, properly the HHS poverty guidelines",
    tools: ["loans", "aca"],
    definition: () =>
      `A table published by the Department of Health and Human Services each January: one ` +
      `figure for the first person in a household and an increment for each additional ` +
      `person, with separate columns for Alaska and Hawaii. For the 48 contiguous states the ` +
      `student loan engine uses ${figureText("loans.poverty.firstPerson")} plus ` +
      `${figureText("loans.poverty.additionalPerson")} per additional person.`,
    whyItMatters: () =>
      "Two programmes use the same table with different vintages, and getting the vintage " +
      "wrong moves a threshold by hundreds of dollars. Student loan repayment uses the " +
      "guidelines currently in effect. Marketplace health coverage uses the guidelines that " +
      "were in effect when open enrolment began — the previous calendar year's table. So in " +
      "2026 the two tools are correctly reading two different tables.",
    figures: ["loans.poverty.firstPerson", "aca.fpl.firstPerson"],
    source: {
      label: "HHS Poverty Guidelines (ASPE), published annually in the Federal Register",
      url: "https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["discretionary-income", "applicable-percentage"],
  },
  {
    id: "discretionary-income",
    term: "Discretionary income",
    tools: ["loans"],
    definition: () =>
      `In federal student loan repayment, adjusted gross income minus a multiple of the ` +
      `poverty guideline for your family size and state. IBR and PAYE protect ` +
      `${figureText("loans.idr.povertyMultiplier")} of the guideline; ICR protects 100%. ` +
      `Whatever is left is what the payment is a percentage of.`,
    whyItMatters: () =>
      "It is the reason a plan's headline percentage is not what you pay. Ten per cent of " +
      "discretionary income is a much smaller number than ten per cent of income, and the gap " +
      "widens with family size. The Repayment Assistance Plan abandons the concept entirely — " +
      "it takes a percentage of gross AGI with no protected amount at all, which is why " +
      "comparing its rate to IBR's rate directly is misleading.",
    figures: ["loans.idr.povertyMultiplier", "loans.ibrOld.rate", "loans.ibrNew.rate"],
    source: RISE_RULE,
    seeAlso: ["fpl", "ibr-old", "ibr-new", "rap"],
  },
  {
    id: "phase-out",
    term: "Phase-out",
    tools: ["paycheck", "aca"],
    definition: () =>
      `A rule that shrinks a deduction or credit as income rises, instead of removing it at ` +
      `a single point. The OBBBA deductions phase out in $1,000 steps: for qualified tips, ` +
      `every $1,000 of MAGI above ${figureText("paycheck.tips.phaseOutSingle")} for a single ` +
      `filer removes $100 of the deduction. The senior deduction uses a percentage of the ` +
      `excess rather than a step.`,
    whyItMatters: () =>
      "A phase-out is a hidden marginal rate. Inside the range, an extra dollar of income is " +
      "taxed at your bracket rate and also costs you part of the deduction, so the real " +
      "marginal rate is higher than the bracket says. It is the opposite of a cliff — it costs " +
      "steadily rather than all at once — which makes it easier to ignore and harder to notice.",
    figures: [
      "paycheck.tips.phaseOutSingle",
      "paycheck.tips.phaseOutJoint",
      "paycheck.senior.amount",
    ],
    source: OBBBA,
    seeAlso: ["magi", "clawback", "qualified-tip-occupation"],
  },

  /* ─────────────────────────────────────────────────── repayment plans ── */
  {
    id: "rap",
    term: "RAP",
    expansion: "Repayment Assistance Plan",
    tools: ["loans"],
    definition: () =>
      `The income-driven repayment plan created by P.L. 119-21 and available from 1 July ` +
      `2026. The payment is a percentage of gross adjusted gross income taken from a bracket ` +
      `table, from 1% up to ${figureText("loans.rap.topRate")}, reduced by ` +
      `${figureText("loans.rap.dependentReduction")} for each dependent claimed, with a floor ` +
      `of ${figureText("loans.rap.minimumMonthlyPayment")}. Forgiveness arrives at ` +
      `${figureText("loans.rap.forgivenessPayments")}.`,
    whyItMatters: () =>
      `Two features make it the cheapest plan for some borrowers and the most expensive for ` +
      `others. Unpaid interest is waived rather than capitalised, and every on-time payment ` +
      `cuts principal by at least ${figureText("loans.rap.principalMatch")}, so the balance ` +
      `cannot grow. But the payment is ${figureText("loans.rap.paymentCapped")} — unlike IBR, ` +
      `which stops at the 10-year Standard amount. High income against a moderate balance can ` +
      `therefore make RAP cost more than simply paying the Standard plan. Moving to RAP also ` +
      `forfeits qualifying payment credit earned under IBR, PAYE or ICR, which is a one-way door.`,
    figures: [
      "loans.rap.paymentCapped",
      "loans.rap.interestWaiver",
      "loans.rap.principalMatch",
      "loans.rap.forgivenessPayments",
    ],
    tables: ["loans.rap.brackets"],
    source: RISE_RULE,
    seeAlso: ["ibr-old", "ibr-new", "paye", "icr", "pslf", "discretionary-income"],
  },
  {
    id: "ibr-old",
    term: "IBR (old)",
    expansion: "Income-Based Repayment, pre-2014 borrower terms",
    tools: ["loans"],
    definition: () =>
      `The original Income-Based Repayment terms, for borrowers whose first loan predates ` +
      `1 July 2014. The payment is ${figureText("loans.ibrOld.rate")} of discretionary income ` +
      `and forgiveness arrives at ${figureText("loans.ibrOld.forgivenessPayments")} — 25 years.`,
    whyItMatters: () =>
      "A higher payment rate and a longer road to forgiveness than new IBR, but it is still " +
      "capped at the 10-year Standard amount, which is the protection RAP does not have. A " +
      "borrower years into old IBR who switches to RAP forfeits every one of those payments.",
    figures: ["loans.ibrOld.rate", "loans.ibrOld.forgivenessPayments"],
    source: RISE_RULE,
    seeAlso: ["ibr-new", "rap", "discretionary-income"],
  },
  {
    id: "ibr-new",
    term: "IBR (new)",
    expansion: "Income-Based Repayment, post-2014 borrower terms",
    tools: ["loans"],
    definition: () =>
      `Income-Based Repayment for a borrower with no outstanding balance whose first loan was ` +
      `disbursed on or after ${figureText("loans.ibrNew.firstLoanOnOrAfter")}. The payment is ` +
      `${figureText("loans.ibrNew.rate")} of discretionary income and forgiveness arrives at ` +
      `${figureText("loans.ibrNew.forgivenessPayments")} — 20 years.`,
    whyItMatters: () =>
      "Cheaper and shorter than old IBR, and the new-borrower date is the whole test — one " +
      "loan disbursed a month too early puts a borrower on the older, costlier terms. The " +
      "engine records that this test has a second limb it does not yet model, so treat the " +
      "date as necessary rather than sufficient.",
    figures: [
      "loans.ibrNew.rate",
      "loans.ibrNew.forgivenessPayments",
      "loans.ibrNew.firstLoanOnOrAfter",
    ],
    source: RISE_RULE,
    seeAlso: ["ibr-old", "rap", "discretionary-income"],
  },
  {
    id: "paye",
    term: "PAYE",
    expansion: "Pay As You Earn",
    tools: ["loans"],
    definition: () =>
      `An income-driven plan paying 10% of discretionary income with forgiveness at 20 years, ` +
      `capped at the 10-year Standard amount. It sunsets on ` +
      `${figureText("loans.paye.sunsetDate")}.`,
    whyItMatters: () =>
      "The sunset is the point. Any projection that runs past it and keeps showing PAYE " +
      "payments is showing a plan that will not exist. A borrower on PAYE at that date is " +
      "moved to another plan, and the plan they land on — and what happens to their accrued " +
      "unpaid interest at the move — is what actually decides their lifetime cost.",
    figures: ["loans.paye.sunsetDate"],
    source: RISE_RULE,
    seeAlso: ["icr", "rap", "ibr-new"],
  },
  {
    id: "icr",
    term: "ICR",
    expansion: "Income-Contingent Repayment",
    tools: ["loans"],
    definition: () =>
      `The oldest income-driven plan: the lesser of 20% of discretionary income (protecting ` +
      `100% of the poverty guideline rather than 150%) or a fixed 12-year amortisation ` +
      `adjusted for income. Forgiveness at 25 years. It sunsets on ` +
      `${figureText("loans.icr.sunsetDate")}.`,
    whyItMatters: () =>
      "It is usually the most expensive income-driven plan, and it is on the way out. Its one " +
      "remaining role is as the only income-driven plan historically open to a consolidation " +
      "loan that repaid a Parent PLUS loan, which is why it appears in the carve-out that " +
      "decides whether such a consolidation keeps access to RAP.",
    figures: ["loans.icr.sunsetDate"],
    source: RISE_RULE,
    seeAlso: ["paye", "rap"],
  },
  {
    id: "save",
    term: "SAVE",
    expansion: "Saving on a Valuable Education",
    tools: ["loans"],
    definition: () =>
      "The income-driven plan introduced in 2023 as a revision of REPAYE. It is not one of " +
      "the plans this site simulates: the repayment engine models the plans in force under " +
      "34 C.F.R. §§ 685.208–685.209 as revised by the RISE final rule effective 1 July 2026, " +
      "and SAVE is not among them.",
    whyItMatters: () =>
      "If a servicer currently has you on SAVE, the figures on this site describe the plan you " +
      "will be moved to, not the one you are on. That makes the comparison more useful, not " +
      "less — the decision in front of you is which plan to land on — but check your own " +
      "status with your servicer before acting, because this site does not model your " +
      "current plan.",
    source: RISE_RULE,
    seeAlso: ["rap", "ibr-new", "icr"],
  },
  {
    id: "pslf",
    term: "PSLF",
    expansion: "Public Service Loan Forgiveness",
    tools: ["loans"],
    definition: () =>
      `Forgiveness of the remaining balance after ${figureText("loans.pslf.payments")} ` +
      `qualifying monthly payments made while working full time for a qualifying employer — ` +
      `government at any level, or a 501(c)(3) non-profit.`,
    whyItMatters: () =>
      `The tax treatment is the difference that dominates every ranking. A PSLF discharge is ` +
      `${figureText("loans.tax.pslfForgivenessTaxable")}; a balance forgiven at the end of an ` +
      `income-driven plan is ${figureText("loans.tax.nonPslfForgivenessTaxable")}. On a large ` +
      `forgiven balance that difference is tens of thousands of dollars, arriving in one tax ` +
      `year, and any comparison that leaves it out is comparing the wrong numbers.`,
    figures: [
      "loans.pslf.payments",
      "loans.tax.pslfForgivenessTaxable",
      "loans.tax.nonPslfForgivenessTaxable",
    ],
    source: RISE_RULE,
    seeAlso: ["rap", "ibr-new"],
  },

  /* ──────────────────────────────────────────────────────── paycheck ── */
  {
    id: "qualified-tip-occupation",
    term: "Qualified tip occupation",
    tools: ["paycheck"],
    definition: () =>
      `The tips deduction is not open to anyone who receives tips. It applies only to work in ` +
      `an occupation that customarily and regularly received tips before 2025, on a published ` +
      `list of occupation codes. Tips from an occupation off that list do not count, however ` +
      `they were reported. The deduction is capped at ${figureText("paycheck.tips.cap")}.`,
    whyItMatters: () =>
      "It is the first test, before any arithmetic. A worker whose occupation is not on the " +
      "list gets nothing from the deduction no matter how their tips were reported, and a " +
      "worker whose occupation is on it still has to have the tips reported properly to claim " +
      "it. Checking the occupation code first saves working out a number that turns out to be zero.",
    figures: ["paycheck.tips.cap", "paycheck.tips.phaseOutSingle"],
    source: {
      label: "IRC § 224, added by P.L. 119-21 § 70201 — deduction for qualified tips",
      url: "https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["phase-out", "flsa-overtime-premium", "magi"],
  },
  {
    id: "flsa-overtime-premium",
    term: "FLSA overtime premium",
    tools: ["paycheck"],
    definition: () =>
      `In time-and-a-half, the premium is the extra half — not the whole overtime payment. ` +
      `Of the 150% paid for an overtime hour, ${figureText("paycheck.overtime.premiumShare")} ` +
      `of the regular rate is the premium, and only that part is deductible. The deduction is ` +
      `capped at ${figureText("paycheck.overtime.capSingle")} for a single filer and ` +
      `${figureText("paycheck.overtime.capJoint")} filing jointly.`,
    whyItMatters: () =>
      "This is the single most common way the deduction is over-claimed. A worker who paid " +
      "$9,000 in overtime pay has a premium of roughly $3,000, not $9,000 — and a W-2 that " +
      "does not break out the premium separately is the reason the figure has to be " +
      "reconstructed rather than read off. Only overtime required by the federal Fair Labor " +
      "Standards Act counts; a premium paid under a contract or a state rule alone does not.",
    figures: [
      "paycheck.overtime.premiumShare",
      "paycheck.overtime.capSingle",
      "paycheck.overtime.capJoint",
    ],
    source: {
      label: "IRC § 225, added by P.L. 119-21 § 70202 — deduction for qualified overtime compensation",
      url: "https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["qualified-tip-occupation", "phase-out"],
  },

  /* ───────────────────────────────────────────────────── health cover ── */
  {
    id: "applicable-percentage",
    term: "Applicable percentage",
    tools: ["aca"],
    definition: () =>
      `The share of household income the law says you should be able to pay toward the ` +
      `benchmark health plan. It rises with income across six bands, from ` +
      `${figureText("aca.applicablePercentage.bottom")} at the bottom to ` +
      `${figureText("aca.applicablePercentage.top")} at the top of the eligible range. The ` +
      `premium tax credit is the benchmark premium minus that amount.`,
    whyItMatters: () =>
      "It is why the credit falls as income rises without any single threshold being crossed — " +
      "and why it disappears completely at the ceiling, where there is no applicable " +
      "percentage at all. Within a band the figure is interpolated on the whole-percent income " +
      "figure, so the credit changes in small steps rather than smoothly.",
    tables: ["aca.applicablePercentage.bands"],
    figures: ["aca.applicablePercentage.top", "aca.cliff.ceilingMultiple"],
    source: {
      label: "IRC § 36B(b)(3)(A) and Rev. Proc. 2025-25 § 3.01 — the 2026 applicable percentage table",
      url: "https://www.irs.gov/pub/irs-drop/rp-25-25.pdf",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["benchmark-plan", "advance-premium-tax-credit", "fpl"],
  },
  {
    id: "benchmark-plan",
    term: "Benchmark plan (SLCSP)",
    expansion: "Second lowest cost silver plan",
    tools: ["aca"],
    definition: () =>
      "The second cheapest silver plan available to your household in your county. Nobody has " +
      "to buy it: it exists only as the yardstick the premium tax credit is measured against. " +
      "Your credit is the benchmark premium minus your expected contribution, and you may " +
      "spend that credit on any metal level you like.",
    whyItMatters: () =>
      "Because the credit is fixed to the benchmark and not to the plan you choose, buying " +
      "cheaper than the benchmark keeps the difference and buying dearer costs you the full " +
      "difference. It also means the credit varies enormously by county — the same household " +
      "income produces very different credits in two counties with different benchmark premiums.",
    source: {
      label: "IRC § 36B(b)(3)(B) — the second lowest cost silver plan",
      url: "https://www.law.cornell.edu/uscode/text/26/36B",
      lastVerified: "2026-08-08",
    },
    seeAlso: ["applicable-percentage", "cost-sharing-reduction", "advance-premium-tax-credit"],
  },
  {
    id: "cost-sharing-reduction",
    term: "Cost-sharing reduction",
    expansion: "CSR",
    tools: ["aca"],
    definition: () =>
      `A separate subsidy that lowers deductibles, copays and the out-of-pocket maximum — not ` +
      `premiums. It is available only on silver plans and only up to 250% of the poverty line, ` +
      `in three bands. At the top band a silver plan behaves like one covering approximately ` +
      `${figureText("aca.csr.topActuarialValue")} of costs.`,
    whyItMatters: () =>
      "It is the subsidy people do not know they are losing. Crossing 250% of the poverty line " +
      "does not touch the premium credit but can transform a plan's deductible, and a " +
      "household that shops on premium alone will move to a bronze plan and lose it without " +
      "ever seeing the trade. Two ledges exist, at 250% and at 400%, and this is the lower one.",
    tables: ["aca.csr.bands"],
    source: {
      label: "42 U.S.C. § 18071(c)(2) and 45 C.F.R. § 156.420 — cost-sharing reductions and their actuarial values",
      url: "https://www.govinfo.gov/link/uscode/42/18071?link-type=html",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["benchmark-plan", "applicable-percentage", "fpl"],
  },
  {
    id: "advance-premium-tax-credit",
    term: "Advance premium tax credit",
    expansion: "APTC",
    tools: ["aca"],
    definition: () =>
      "The premium tax credit paid monthly to your insurer during the year, based on the " +
      "income you estimated at enrolment, rather than claimed as a lump sum on your return. " +
      "The following spring it is reconciled on Form 8962 against the income you actually had.",
    whyItMatters: () =>
      "It converts an estimate into a debt. Estimate low and you repay the difference; " +
      "estimate high and you get the balance back. Updating your estimate with the marketplace " +
      "during the year is the only way to change the advance amount, and it is free to do.",
    source: FORM_8962,
    seeAlso: ["clawback", "applicable-percentage", "benchmark-plan"],
  },
  {
    id: "clawback",
    term: "Clawback",
    tools: ["aca"],
    definition: () =>
      `Repayment of advance premium tax credit you received but were not entitled to, added ` +
      `to your tax bill at reconciliation. For tax years after 2025 the repayment is ` +
      `${figureText("aca.clawback.capped")}.`,
    whyItMatters: () =>
      "Until tax year 2025 a repayment limitation capped what a household under 400% of the " +
      "poverty line could be asked to repay. P.L. 119-21 § 71305 struck it. There is now no " +
      "cap at any income level, so a household that took a full year of advance credit and " +
      "finished one dollar over the ceiling repays all of it. The cliff was always there; the " +
      "thing that softened the landing has been removed.",
    figures: ["aca.clawback.capped", "aca.cliff.ceilingMultiple"],
    source: {
      label: "P.L. 119-21 § 71305 — eliminating the limitation on recapture of advance payments",
      url: "https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["advance-premium-tax-credit", "magi", "phase-out"],
  },

  /* ────────────────────────────────────────────────────── property tax ── */
  {
    id: "assessment-ratio",
    term: "Assessment ratio",
    expansion: "Assessment level",
    tools: ["property"],
    definition: () =>
      `The fraction of market value a jurisdiction records as assessed value. Cook County, ` +
      `Illinois assesses a residential parcel at ` +
      `${figureText("property.cook.assessmentRatio")}; many New Jersey municipalities assess ` +
      `at or near full market value. The tax rate is then applied to the assessed value, not ` +
      `to the market value.`,
    whyItMatters: () =>
      "It is why an assessment that looks small is not necessarily low, and why comparing " +
      "your assessed value to your neighbour's sale price proves nothing on its own. The " +
      "appeal argument is always about the ratio your parcel is carrying relative to the " +
      "ratio everyone else is carrying — never about the raw number on the notice.",
    figures: ["property.cook.assessmentRatio", "property.cook.estimatedTaxRate"],
    source: {
      label: "Cook County Assessor's Office — appeals and assessment levels",
      url: "https://www.cookcountyassessor.com/appeals",
      lastVerified: "2026-08-08",
    },
    seeAlso: ["equalization-ratio", "common-level-range"],
  },
  {
    id: "equalization-ratio",
    term: "Equalization ratio (Director's Ratio)",
    tools: ["property"],
    definition: () =>
      "In New Jersey, the average ratio of assessed value to true market value in a " +
      "municipality, calculated each year by the Director of the Division of Taxation from " +
      "actual sales. Each municipality gets its own figure, republished every year around " +
      "1 April.",
    whyItMatters: () =>
      "It is the benchmark a New Jersey appeal is judged against: your parcel's own ratio is " +
      "compared to the municipality's Director's Ratio, and relief depends on how far outside " +
      "the permitted corridor you sit. Without your municipality's current ratio the question " +
      "cannot be answered at all — which is why this site returns \"cannot determine\" for " +
      "New Jersey parcels rather than guessing.",
    figures: ["property.bergen.commonLevelCorridor"],
    source: {
      label: "NJ Division of Taxation — Chapter 123 and the common level range",
      url: "https://www.state.nj.us/treasury/taxation/lpt/chapter123.shtml",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["common-level-range", "assessment-ratio"],
  },
  {
    id: "common-level-range",
    term: "Common level range",
    tools: ["property"],
    definition: () =>
      `New Jersey's Chapter 123 corridor: a band of plus or minus ` +
      `${figureText("property.bergen.commonLevelCorridor")} around the municipality's ` +
      `Director's Ratio. An assessment whose own ratio falls inside the corridor gets no ` +
      `relief, however over-assessed the owner believes it is.`,
    whyItMatters: () =>
      "It is the reason a demonstrably high assessment can still lose an appeal. Proving your " +
      "market value is lower than the assessment is not enough; you have to be outside the " +
      "corridor. Working out where you sit before filing is the difference between a " +
      "worthwhile appeal and a filing fee spent for nothing.",
    figures: ["property.bergen.commonLevelCorridor"],
    source: {
      label: "NJ Division of Taxation — Chapter 123 and the common level range",
      url: "https://www.state.nj.us/treasury/taxation/lpt/chapter123.shtml",
      lastVerified: "2026-08-15",
    },
    seeAlso: ["equalization-ratio", "assessment-ratio"],
  },

  /* ─────────────────────────────────────────────────────────── trades ── */
  {
    id: "home-improvement-contract-threshold",
    term: "Home improvement contract threshold",
    tools: ["trades"],
    definition: () =>
      `The contract price above which a state's home improvement contract rules attach — ` +
      `mandatory written terms, prescribed notices, deposit limits and cancellation rights. ` +
      `California's threshold is ` +
      `${figureText("trades.ca.homeImprovementThreshold")}; Texas has no dollar threshold at ` +
      `all, so its requirements attach to residential work regardless of price.`,
    whyItMatters: () =>
      "Below the threshold a handshake and an invoice may be lawful. Above it, a contract " +
      "missing a required notice can be unenforceable, can extend the customer's cancellation " +
      "window, and in some states exposes the contractor to penalties. The threshold decides " +
      "which document you need before the work starts, not after.",
    tables: ["trades.homeImprovementThresholds"],
    source: {
      label: "Cal. Bus. & Prof. Code § 7159 — home improvement contracts",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7159",
      lastVerified: "2026-08-08",
    },
    seeAlso: ["right-of-rescission", "mechanics-lien"],
  },
  {
    id: "mechanics-lien",
    term: "Mechanic's lien",
    tools: ["trades"],
    definition: () =>
      "A claim a contractor, subcontractor or supplier can record against the property they " +
      "worked on when they are not paid. It attaches to the property itself, not to the " +
      "person who owes the money, and it can block a sale or a refinance until it is resolved.",
    whyItMatters: () =>
      "It runs in both directions, which is why several states require the contract to warn " +
      "the homeowner about it in prescribed wording. A homeowner who pays the general " +
      "contractor in full can still face a lien from an unpaid subcontractor. A contractor who " +
      "misses a notice or a deadline can lose the lien right entirely. The wording and the " +
      "timing are statutory, and paraphrasing either is how the protection is lost.",
    source: {
      label: "N.Y. Gen. Bus. Law § 771 — home improvement contracts, including the lien notice requirement",
      url: "https://www.nysenate.gov/legislation/laws/GBS/771",
      lastVerified: "2026-08-08",
    },
    seeAlso: ["home-improvement-contract-threshold", "right-of-rescission"],
  },
  {
    id: "right-of-rescission",
    term: "Right of rescission",
    expansion: "Right to cancel",
    tools: ["trades"],
    definition: () =>
      "A window, usually three business days, in which a homeowner can cancel a home " +
      "improvement contract without giving a reason and without penalty. The contract must " +
      "normally carry the notice in prescribed wording, and in several states in prescribed " +
      "type size and placement.",
    whyItMatters: () =>
      "The clock generally starts when the notice is properly given — not when the contract " +
      "is signed. A contract with a missing or defective cancellation notice can leave the " +
      "window open long past three days, sometimes until the work is finished, which turns a " +
      "formatting mistake into an open-ended right to walk away.",
    source: {
      label: "Cal. Bus. & Prof. Code § 7159(e)(6) — the notice of the right to cancel",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7159",
      lastVerified: "2026-08-08",
    },
    seeAlso: ["home-improvement-contract-threshold", "mechanics-lien"],
  },
];

/** Entry ids, for anchor validation and internal links. */
export const GLOSSARY_IDS: readonly string[] = GLOSSARY.map((entry) => entry.id);

/** One entry by id, or null. */
export function getGlossaryEntry(id: string): GlossaryEntry | null {
  return GLOSSARY.find((entry) => entry.id === id) ?? null;
}

/**
 * Alphabetical by term, case-insensitive.
 *
 * The declaration order above is thematic, which is the right order to write
 * and review in and the wrong order to look a word up in.
 */
export function glossaryAlphabetical(): readonly GlossaryEntry[] {
  return [...GLOSSARY].sort((a, b) =>
    a.term.localeCompare(b.term, "en-US", { sensitivity: "base" }),
  );
}
