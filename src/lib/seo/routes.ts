/**
 * THE ROUTE REGISTRY — one typed module, every route's metadata.
 *
 * Before this file, each of fifty-five page components wrote its own
 * `export const metadata`. That is not a small inefficiency; it is why 43 of
 * those 55 routes shipped a title over the length Google will render and 16
 * shipped a description past the truncation point. Nobody was careless. There
 * was simply nowhere the fifty-five strings could be seen next to each other,
 * so nothing could measure them, and the two `title.template` suffixes that
 * silently added 14 and 30 characters were invisible from inside the file that
 * chose the words.
 *
 * Now: the strings live here, the bounds are asserted here at module load, and
 * a page says `export const metadata = pageMetadata("/loans")`. A page cannot
 * write its own title, so a page cannot write an unmeasured one.
 *
 * ── PURE BY CONSTRUCTION ─────────────────────────────────────────────────────
 * This module reads no files, imports no engine and touches no environment. It
 * is imported by page metadata, by `sitemap.ts`, by the internal-link resolver
 * and by the Open Graph image routes, and one `node:fs` import here would
 * break the last of those. Anything derived — a county's name, an article's
 * title, a rule's verification date — arrives as an argument.
 *
 * ── WHAT A ROUTE DECLARES ────────────────────────────────────────────────────
 * `title` and `description` are the search result. `ogHeadline` is the social
 * card, which is a different job: a result page is scanned in a list against
 * competitors, a shared card is seen alone in a feed, so the card gets the
 * claim and the title gets the query. `section` picks the card's accent and
 * the page's palette. `lastModified` is the sitemap's, and it is a real date
 * about real content or it is absent — see the note on the field.
 */

import type { SectionSlug } from "@/lib/site";
import { assertMetadataBounds } from "./constraints";

export interface RouteSeo {
  /** Root-relative, no trailing slash. `/` for the hub. The canonical path. */
  readonly path: string;
  /** The exact `<title>`. Emitted with `title.absolute`; no template applies. */
  readonly title: string;
  /** The exact meta description and `og:description`. */
  readonly description: string;
  /** Which palette the page and its social card wear. Null on site-level pages. */
  readonly section: SectionSlug | null;
  /**
   * The big line on the Open Graph card. Two or three words longer than a
   * title is fine — nothing truncates it — and it should make a claim rather
   * than name a page, because a card is read alone rather than in a list.
   */
  readonly ogHeadline: string;
  /** The small line under the card's headline. One clause, no full stop. */
  readonly ogStrap: string;
  /**
   * The sitemap's `<lastmod>`, ISO `yyyy-mm-dd`, or `null` for "we do not
   * know".
   *
   * NEVER the deploy time. The sitemap previously stamped `new Date()` on
   * every entry, which told a crawler that fifty-three pages changed the
   * moment a CSS fix was deployed. That is not a small dishonesty: `lastmod`
   * is a recrawl signal, Google discounts a host that lies with it, and once
   * discounted the dates that ARE true stop being believed either.
   *
   * So every date is derived from something the page actually asserts — the
   * newest verification date in the rule files behind it, an article's own
   * `updatedAt`, a policy page's visible "last updated" stamp. Where no such
   * date exists, this is `null` and the sitemap emits no `<lastmod>` at all.
   * The protocol makes the field optional precisely so that omission is
   * available, and an omitted date costs a little crawl efficiency where a
   * fabricated one costs trust in every other date on the file.
   *
   * Routes whose freshness comes from a rule file leave this `null` here and
   * are resolved by `freshness.ts` at sitemap build time, because a rule date
   * cannot be typed into a pure module without becoming a second copy of it.
   */
  readonly lastModified: string | null;
  /** False only where the page asks not to be indexed. Drives the sitemap. */
  readonly indexable: boolean;
}

/* ───────────────────────────────────────────────── the policy stamp ── */

/**
 * The date the site-level policy wording last changed.
 *
 * One constant, read by `/about`, `/authors`, `/privacy` and `/terms` for the
 * visible "Last updated" line AND by the sitemap for their `<lastmod>`. The
 * four pages each held their own `const UPDATED = "2026-08-19"`, which is four
 * chances for the stamp a reader sees to disagree with the date the sitemap
 * submits. It is one chance now.
 *
 * Move it when the WORDS change. It is not a freshness lever.
 */
export const POLICY_UPDATED = "2026-08-19";

/* ────────────────────────────────────────────────── static routes ── */

type StaticRoute = Omit<RouteSeo, "indexable"> & { readonly indexable?: boolean };

const STATIC: readonly StaticRoute[] = [
  /* ---- the hub and the site-level trust surface ------------------------- */
  {
    path: "/",
    title: "Bracketsight — five decision engines for US money rules",
    description:
      "Compare 9 federal loan repayment plans, check OBBBA deductions, measure your distance to the 400% ACA cliff, test an assessment, price a trade job.",
    section: null,
    ogHeadline: "Every option, priced. Then ranked.",
    ogStrap: "Five decision engines · rules cited · nothing stored",
    lastModified: null,
  },
  {
    path: "/about",
    title: "About Bracketsight — how a rule becomes a number",
    description:
      "How five US money-rule engines are built, funded and corrected: deterministic arithmetic, cited primary sources, and a register of unverified items.",
    section: null,
    ogHeadline: "How a rule becomes a number",
    ogStrap: "Deterministic arithmetic · cited sources · a published gap register",
    lastModified: POLICY_UPDATED,
  },
  {
    path: "/authors",
    title: "Who writes and checks this — authorship and review",
    description:
      "Who is accountable for every figure here, how a value is verified against a primary source, what the verification pass found, and what is outstanding.",
    section: null,
    ogHeadline: "Who is accountable for these figures",
    ogStrap: "Authorship, verification and the reviews still outstanding",
    lastModified: POLICY_UPDATED,
  },
  {
    path: "/contact",
    title: "Contact — report a wrong figure or a changed rule",
    description:
      "Email a correction, a rule that has changed, or a figure that looks wrong. Every report is checked against the primary source and logged in the changelog.",
    section: null,
    ogHeadline: "Found a figure that is wrong?",
    ogStrap: "Checked against the primary source, then logged in the changelog",
    lastModified: POLICY_UPDATED,
  },
  {
    path: "/privacy",
    title: "Privacy and cookies — nothing you enter is stored",
    description:
      "Every calculation runs in your browser: no account, no database, no server-side storage. What is stored, what advertising changes, and how to refuse it.",
    section: null,
    ogHeadline: "Nothing you enter leaves your browser",
    ogStrap: "No account, no database, no server-side storage",
    lastModified: POLICY_UPDATED,
  },
  {
    path: "/terms",
    title: "Terms and disclaimer — estimates, not advice",
    description:
      "These tools produce estimates from published rules, not financial, tax or legal advice. What each figure is, what it is not, and where the gaps are.",
    section: null,
    ogHeadline: "Estimates from published rules. Not advice.",
    ogStrap: "What each figure is, and what it is not",
    lastModified: POLICY_UPDATED,
  },
  {
    path: "/glossary",
    title: "Glossary — the terms these money rules are written in",
    description:
      "Plain-English definitions of MAGI, FPL, RAP, IBR, the applicable percentage, the common level range and every other term the five Bracketsight tools use.",
    section: null,
    ogHeadline: "The terms these rules are written in",
    ogStrap: "Every figure read from the same cited rule file the tools run on",
    lastModified: null,
  },
  {
    path: "/guides",
    title: "Guides — how the US money rules actually work",
    description:
      "Guides to student loan repayment, OBBBA deductions, ACA subsidies, property tax and trade contracts — how each one is built, cited and kept current.",
    section: null,
    ogHeadline: "How the US money rules actually work",
    ogStrap: "One page per decision, grouped by the engine that computes it",
    lastModified: null,
  },

  /* ---- loans ------------------------------------------------------------ */
  {
    path: "/loans",
    title: "Which student loan plan costs least? All 9 compared",
    description:
      "See your exact payment under all 9 federal repayment plans, ranked by 30-year total cost. Every rule cited to the regulation. Free, and no signup.",
    section: "loans",
    ogHeadline: "Nine federal plans. Ranked by what they actually cost.",
    ogStrap: "30 years of arithmetic · irreversible choices flagged",
    lastModified: null,
  },
  {
    path: "/loans/methodology",
    title: "Student loan methodology — every plan formula",
    description:
      "How all 9 federal repayment plans are simulated: the exact payment formulas, rounding rules, integer-cent arithmetic, and every documented simplification.",
    section: "loans",
    ogHeadline: "Every formula, stated as the engine runs it",
    ogStrap: "Nine plans · integer cents · documented simplifications",
    lastModified: null,
  },
  {
    path: "/loans/sources",
    title: "Student loan sources — every citation dated",
    description:
      "The primary sources behind every rate, bracket and threshold in the repayment engine: what each one settles, what it does not, and when it was last read.",
    section: "loans",
    ogHeadline: "Every rate traced to its regulation",
    ogStrap: "What each source settles, and when it was last read",
    lastModified: null,
  },
  {
    path: "/loans/editorial-policy",
    title: "Student loan editorial policy and corrections",
    description:
      "Standards behind the student loan engine: primary sources only, credentialed review before launch, a public corrections process, full funding disclosure.",
    section: "loans",
    ogHeadline: "Primary sources only. Corrections in public.",
    ogStrap: "Review, corrections and funding, stated in full",
    lastModified: null,
  },
  {
    path: "/loans/changelog",
    title: "Student loan rule changelog — dated and cited",
    description:
      "Dated record of every rule change, verification and correction in the federal repayment engine, each entry carrying its own primary citation.",
    section: "loans",
    ogHeadline: "Every rule change, dated and cited",
    ogStrap: "What changed, when, and against which source",
    lastModified: null,
  },
  {
    path: "/loans/about",
    title: "About the student loan repayment engine",
    description:
      "How this section simulates all nine federal repayment plans from your real loan mix and ranks them by lifetime cost. Every rule cited. No lender pays us.",
    section: "loans",
    ogHeadline: "A decision engine, not a payment calculator",
    ogStrap: "Nine plans from your real loan mix · no lender pays us",
    lastModified: null,
  },
  {
    path: "/loans/privacy",
    title: "Loan privacy — your data never leaves the browser",
    description:
      "Nothing about your loans is stored server-side: balances, income and results live in your browser and in the link fragment you choose to share.",
    section: "loans",
    ogHeadline: "Your balances never reach a server",
    ogStrap: "Held in your browser and in a link you choose to share",
    lastModified: null,
  },

  /* ---- paycheck --------------------------------------------------------- */
  {
    path: "/paycheck",
    title: "OBBBA deductions calculator — tips and overtime",
    description:
      "All four OBBBA deductions on one household MAGI — tips, overtime premium, senior, car-loan interest — with the phase-out math and the federal tax saved.",
    section: "paycheck",
    ogHeadline: "Four deductions. One shared MAGI.",
    ogStrap: "Tips, overtime, senior, car loan · interacting phase-outs",
    lastModified: null,
  },
  {
    path: "/paycheck/methodology",
    title: "OBBBA deduction methodology — every formula",
    description:
      "The exact formulas behind the OBBBA tips, overtime, senior and car-loan deductions: caps, shared-MAGI phase-outs, the bracket table, integer-cent rounding.",
    section: "paycheck",
    ogHeadline: "Caps, phase-outs and the bracket table",
    ogStrap: "Every OBBBA formula, exactly as the engine runs it",
    lastModified: null,
  },
  {
    path: "/paycheck/sources",
    title: "OBBBA deduction sources — IRS citations, dated",
    description:
      "Every OBBBA deduction rule traced to its primary source: P.L. 119-21, IRS guidance and the FLSA, with last-verified dates and the open items named.",
    section: "paycheck",
    ogHeadline: "P.L. 119-21, IRS guidance, the FLSA",
    ogStrap: "Every rule traced, dated, and its open items named",
    lastModified: null,
  },
  {
    path: "/paycheck/editorial-policy",
    title: "Paycheck editorial policy and rule verification",
    description:
      "How these pages are written, reviewed, corrected and funded — primary sources only, credentialed review before launch, and corrections within 48 hours.",
    section: "paycheck",
    ogHeadline: "How an OBBBA figure gets checked",
    ogStrap: "Primary sources · review before launch · 48-hour corrections",
    lastModified: null,
  },
  {
    path: "/paycheck/changelog",
    title: "OBBBA changelog — dated, cited rule changes",
    description:
      "Every rule change behind the OBBBA deduction numbers, dated and cited. When IRS guidance moves, this page says exactly what changed in the engine and when.",
    section: "paycheck",
    ogHeadline: "When IRS guidance moves, this says what changed",
    ogStrap: "Every OBBBA rule change, dated and cited",
    lastModified: null,
  },
  {
    path: "/paycheck/about",
    title: "About the OBBBA deduction engine",
    description:
      "A deterministic OBBBA deduction engine: tips, overtime, senior and car-loan deductions on one household MAGI, every rule cited to its primary source.",
    section: "paycheck",
    ogHeadline: "One household MAGI, four interacting deductions",
    ogStrap: "Deterministic arithmetic · every rule cited",
    lastModified: null,
  },
  {
    path: "/paycheck/occupations",
    title: "Qualified tipped occupations — the IRS list",
    description:
      "Search the IRS qualified tipped occupation list. Only tips earned in a listed occupation qualify for the OBBBA tips deduction — check your own job.",
    section: "paycheck",
    ogHeadline: "Is your job on the IRS tipped-occupation list?",
    ogStrap: "Only listed occupations qualify for the tips deduction",
    lastModified: null,
  },

  /* ---- aca -------------------------------------------------------------- */
  {
    path: "/aca",
    title: "ACA subsidy cliff calculator — 400% FPL distance",
    description:
      "See exactly how far your household is from the 400% FPL subsidy cliff, what one more dollar of income costs, and which legal levers pull you back under.",
    section: "aca",
    ogHeadline: "One dollar over 400% and the credit stops",
    ogStrap: "Your distance to the cliff, and every legal lever back under it",
    lastModified: null,
  },
  {
    path: "/aca/methodology",
    title: "ACA methodology — how the premium credit works",
    description:
      "Every formula the subsidy engine runs: MAGI, the poverty-guideline lag, applicable-percentage interpolation, the benchmark, CSR bands and reconciliation.",
    section: "aca",
    ogHeadline: "Every formula behind the premium tax credit",
    ogStrap: "MAGI, the guideline lag, interpolation, CSR bands",
    lastModified: null,
  },
  {
    path: "/aca/sources",
    title: "ACA sources — every threshold, cited and dated",
    description:
      "The primary sources behind every poverty line, applicable percentage and repayment rule in the subsidy engine, with verification status and the open gaps.",
    section: "aca",
    ogHeadline: "Every threshold traced to statute",
    ogStrap: "Verification status, and the gaps still open",
    lastModified: null,
  },
  {
    path: "/aca/editorial-policy",
    title: "ACA editorial policy, review and corrections",
    description:
      "How the subsidy cliff pages are written, who reviews the tax rules, how a correction reaches the changelog, and exactly where the money comes from.",
    section: "aca",
    ogHeadline: "Who reviews these tax rules, and how",
    ogStrap: "Corrections, review and funding, stated plainly",
    lastModified: null,
  },
  {
    path: "/aca/changelog",
    title: "ACA changelog — rule changes, dated and cited",
    description:
      "How the subsidy ruleset is versioned, what triggers an entry, which rule files carry which dates, and every dated change made to the engine so far.",
    section: "aca",
    ogHeadline: "Every subsidy rule change, versioned",
    ogStrap: "What triggers an entry, and every change so far",
    lastModified: null,
  },
  {
    path: "/aca/about",
    title: "About the ACA subsidy cliff planner",
    description:
      "Who builds the subsidy cliff planner, what it refuses to do, and the credentialed review it will not launch without. No insurance is sold here, ever.",
    section: "aca",
    ogHeadline: "A planner that sells no insurance",
    ogStrap: "What it refuses to do, and the review it waits for",
    lastModified: null,
  },

  /* ---- property --------------------------------------------------------- */
  {
    path: "/property",
    title: "Is your home over-assessed? Property tax check",
    description:
      "Run your assessment against comparable homes with the same median-ratio statistics an assessor uses. Most people are told not to file — that is the point.",
    section: "property",
    ogHeadline: "Most homeowners should not file. Find out if you should.",
    ogStrap: "The median-ratio statistics an assessor uses, run in your browser",
    lastModified: null,
  },
  {
    path: "/property/check",
    title: "Is my assessment too high? Free 2-minute check",
    description:
      "Compare your assessment to comparable homes with the ratio statistics assessors use. Honest verdict, confidence score, and your county's filing deadline.",
    section: "property",
    ogHeadline: "Check an assessment in two minutes",
    ogStrap: "Honest verdict · confidence score · your county's deadline",
    lastModified: null,
  },
  {
    path: "/property/counties",
    title: "Property tax appeal rules, county by county",
    description:
      "County-by-county appeal playbooks: deadline, filing fee, appeal body, forms and evidence standard — each rule cited to the county's own authority.",
    section: "property",
    ogHeadline: "Every county sets its own deadline",
    ogStrap: "Deadline, fee, forms and evidence standard — cited",
    lastModified: null,
  },
  {
    path: "/property/methodology",
    title: "Property tax methodology — the appeal statistics",
    description:
      "Every formula: comparable selection filters, median assessment ratios, the IAAO coefficient of dispersion, confidence scoring and the verdict thresholds.",
    section: "property",
    ogHeadline: "Statistics, not opinion",
    ogStrap: "Median ratios, IAAO dispersion, confidence, verdict thresholds",
    lastModified: null,
  },
  {
    path: "/property/sources",
    title: "Property tax sources — county rules, cited",
    description:
      "The primary sources behind every county deadline, fee, form and evidence standard, with last-verified dates. Unverified values stay flagged.",
    section: "property",
    ogHeadline: "Every county rule, traced to the county",
    ogStrap: "Unverified values stay flagged until they are confirmed",
    lastModified: null,
  },
  {
    path: "/property/editorial-policy",
    title: "Property tax editorial policy and corrections",
    description:
      "Who writes the county playbooks, how each deadline and fee is verified, how corrections work, how the site is funded, and where AI is and is not used.",
    section: "property",
    ogHeadline: "Where AI is used, and where it is not",
    ogStrap: "How a county deadline gets verified, and corrected",
    lastModified: null,
  },
  {
    path: "/property/changelog",
    title: "Property tax changelog — county rule changes",
    description:
      "A dated record of every county rules change, methodology change and correction to the assessment check, each one carrying its own citation.",
    section: "property",
    ogHeadline: "Every county rule change, dated",
    ogStrap: "Rules, methodology and corrections, each cited",
    lastModified: null,
  },
  {
    path: "/property/about",
    title: "About the property tax appeal toolkit",
    description:
      "What the property tax appeal toolkit is, what it is not, and the launch bar it holds itself to — credentialed review of every method and county playbook.",
    section: "property",
    ogHeadline: "Assistance with an appeal you file yourself",
    ogStrap: "Not a law firm, not an appraisal, not a representative",
    lastModified: null,
  },

  /* ---- trades ----------------------------------------------------------- */
  {
    path: "/trades",
    title: "Free estimate builder for trades — with ranges",
    description:
      "Price a deck, an interior paint job or a bathroom remodel on a live takeoff sheet. Edit any line, watch the total move, print the sheet your customer gets.",
    section: "trades",
    ogHeadline: "Price the job on a takeoff sheet",
    ogStrap: "Itemised, with honest ranges · free, no signup",
    lastModified: null,
  },
  {
    path: "/trades/invoice",
    title: "Trade invoice that matches your estimate exactly",
    description:
      "Turn your takeoff sheet into an invoice that mirrors it line for line, tracks the deposit already taken, and prints clean. Free, and no signup.",
    section: "trades",
    ogHeadline: "An invoice that matches the estimate to the cent",
    ogStrap: "Mirrors the takeoff line for line · credits the deposit",
    lastModified: null,
  },
  {
    path: "/trades/contract",
    title: "Contract template — state-required clauses, cited",
    description:
      "A home improvement contract template carrying the clauses your state requires for a job this size, each with its statute. A template, not legal advice.",
    section: "trades",
    ogHeadline: "The clauses your state actually requires",
    ogStrap: "Each with its statute · a template, not legal advice",
    lastModified: null,
  },
  {
    path: "/trades/pricing-methodology",
    title: "Trades pricing methodology — where numbers come from",
    description:
      "How estimates are computed: assemblies, waste factors, regional multipliers, overhead and profit — and the honest status of the placeholder pricing data.",
    section: "trades",
    ogHeadline: "Where every number in an estimate comes from",
    ogStrap: "Assemblies, waste, region, overhead — and what is still placeholder",
    lastModified: null,
  },
  {
    path: "/trades/sources",
    title: "Trades sources — pricing and state rulesets, cited",
    description:
      "Every pricing ruleset and state contract ruleset behind the estimator, with citations, last-verified dates, and the honest status of placeholder prices.",
    section: "trades",
    ogHeadline: "Pricing and statute, separately sourced",
    ogStrap: "Citations, dates, and the honest status of the price data",
    lastModified: null,
  },
  {
    path: "/trades/editorial-policy",
    title: "Trades editorial policy, review and corrections",
    description:
      "How the pricing and state-law pages are written, reviewed, corrected and funded. Deterministic code decides; humans review; every error gets logged.",
    section: "trades",
    ogHeadline: "Code decides, humans review, errors get logged",
    ogStrap: "How the pricing and state-law pages are kept honest",
    lastModified: null,
  },
  {
    path: "/trades/changelog",
    title: "Trades changelog — pricing and state rule changes",
    description:
      "Every change to the pricing rulesets and the state contract rulesets, dated and cited — including the states contract generation is currently blocked for.",
    section: "trades",
    ogHeadline: "Pricing and statute changes, dated",
    ogStrap: "Including the states generation is blocked for",
    lastModified: null,
  },
  {
    path: "/trades/about",
    title: "About the trades document engine",
    description:
      "Why a free estimate, invoice and contract engine exists for solo and small-crew contractors: no signup, state-aware clauses, and every number traceable.",
    section: "trades",
    ogHeadline: "Built for a solo crew, not a franchise",
    ogStrap: "No signup · state-aware clauses · every number traceable",
    lastModified: null,
  },
] as const;

/** Every static route, keyed by path. */
export const STATIC_ROUTES: ReadonlyMap<string, RouteSeo> = new Map(
  STATIC.map((route) => [route.path, { ...route, indexable: route.indexable ?? true }]),
);

/*
 * The bound check runs the moment this module is imported — which is during
 * `next build`, on the first page that asks for its metadata. There is no way
 * to ship a page from this registry without the whole registry having passed.
 */
assertMetadataBounds([...STATIC_ROUTES.values()]);

/**
 * The metadata for a static route. Throws rather than falling back: a page
 * asking for a path this registry does not know is a page that would otherwise
 * inherit the site-level title, and a silently-generic title on a real route is
 * exactly the duplicate this file exists to prevent.
 */
export function staticRoute(path: string): RouteSeo {
  const route = STATIC_ROUTES.get(path);
  if (!route) {
    throw new Error(
      `No SEO entry for "${path}". Every route declares its title and description in ` +
        `src/lib/seo/routes.ts — add one there rather than writing metadata in the page.`,
    );
  }
  return route;
}

/* ─────────────────────────────────────────────── derived route families ── */

/**
 * The three prerendered families cannot be typed out route by route: their
 * membership comes from the engines and from `content/posts`, and a hand-kept
 * list would be a second, staler copy of the enumeration `generateStaticParams`
 * already reads. They get builders instead, and each builder asserts the same
 * bounds the static table does — so a county whose name is long enough to push
 * its title past 60 characters fails the build with the county named.
 */

function derived(route: RouteSeo): RouteSeo {
  assertMetadataBounds([route]);
  return route;
}

/** `/property/counties/il/cook`. */
export function countyRoute(input: {
  readonly state: string;
  readonly county: string;
  readonly countyName: string;
  readonly stateName: string;
  readonly feeSummary: string;
  readonly lastModified: string | null;
}): RouteSeo {
  return derived({
    path: `/property/counties/${input.state}/${input.county}`,
    title: `${input.countyName} property tax appeal — deadline and fee`,
    /*
     * Kept short on purpose. `feeSummary` is a whole clause in some counties
     * ("$5–$150, banded by assessed value"), so a template that fits Cook can
     * overflow in Bergen — which is exactly what it did, at 158 characters,
     * and the build stopped rather than shipping a truncated snippet. The
     * headroom here absorbs a fee summary about twice as long as today's.
     */
    description:
      `How to appeal a ${input.countyName} assessment: the deadline rule, the ` +
      `${input.feeSummary} filing fee, where to file, and the evidence that works.`,
    section: "property",
    ogHeadline: `Appealing in ${input.countyName}`,
    ogStrap: `Deadline, fee, forms and evidence standard — cited to ${input.stateName}`,
    lastModified: input.lastModified,
    indexable: true,
  });
}

/** `/trades/contracts/CA`. */
export function stateContractRoute(input: {
  readonly stateId: string;
  readonly stateName: string;
  readonly lastModified: string | null;
}): RouteSeo {
  return derived({
    path: `/trades/contracts/${input.stateId}`,
    title: `${input.stateName} home improvement contract rules`,
    /* "Pennsylvania" is 12 characters where "TX" would have been 2; the
       template has to fit the longest state name, not the shortest. */
    description:
      `The clauses ${input.stateName} law requires in a home improvement contract, ` +
      `each with its statute cite, plus a generator that assembles them.`,
    section: "trades",
    ogHeadline: `What ${input.stateName} requires in writing`,
    ogStrap: "Every required clause, with the statute that requires it",
    lastModified: input.lastModified,
    indexable: true,
  });
}

/** `/guides/loans` — a tool's cluster index. */
export function toolIndexRoute(input: {
  readonly slug: SectionSlug;
  readonly name: string;
  readonly tagline: string;
  readonly indexable: boolean;
  readonly lastModified: string | null;
}): RouteSeo {
  return derived({
    path: `/guides/${input.slug}`,
    title: `${input.name} guides — every explainer, grouped`,
    description:
      `Every Bracketsight guide to ${input.name.toLowerCase()}, grouped by the decision it ` +
      `settles. ${input.tagline}`,
    section: input.slug,
    ogHeadline: `${input.name} guides`,
    ogStrap: input.tagline,
    lastModified: input.lastModified,
    indexable: input.indexable,
  });
}

/**
 * `/guides/rap-can-cost-more-than-standard` — one article.
 *
 * The title and description are the article's own frontmatter, not a template
 * over it: an article is written to win one query and the writer chose those
 * words. What this adds is the bound check. `content/posts` validates title at
 * 70 characters and description at 160 — looser than the 60/155 asserted here,
 * because that schema was written against the raw limits rather than against
 * what a result actually renders. Today every article passes both. When one
 * does not, the build fails here and names the file.
 */
export function articleRoute(input: {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tool: SectionSlug;
  readonly toolName: string;
  readonly updatedAt: string;
  readonly primaryKeyword: string;
}): RouteSeo {
  return derived({
    path: `/guides/${input.slug}`,
    title: input.title,
    description: input.description,
    section: input.tool,
    ogHeadline: input.title,
    ogStrap: `${input.toolName} · reviewed ${input.updatedAt}`,
    lastModified: input.updatedAt,
    indexable: true,
  });
}
