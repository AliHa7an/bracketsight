/**
 * ═════════════════════════════════════════════════════════════════════════════
 * FIGURES — the only sanctioned way an article prints a number.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * THE FAILURE MODE THIS EXISTS TO PREVENT
 *
 * An article says "RAP forgives after 360 payments". Six months later the rule
 * changes, someone edits `rap.2026-07-01.json`, the engine and the calculator
 * update, every methodology page updates — and forty articles keep saying 360,
 * because 360 was typed into prose and prose is not wired to anything. The
 * calculator and the guide that explains the calculator now disagree, on a
 * YMYL finance site, about a number a reader is making a thirty-year decision
 * with. Nobody notices, because nothing broke.
 *
 * So: a figure an engine owns is never typed into an article. The article
 * writes the *reference* —
 *
 *     <KeyFigure id="loans.rap.forgivenessPayments" />
 *
 * — and this module resolves it out of the versioned rule JSON at build time,
 * together with the rule set version it came from, the primary citation, the
 * date that citation was last verified, and any open item in `KNOWN-GAPS.md`
 * sitting under it. Change the rule file and every article changes with it, in
 * the same commit, with no editorial pass.
 *
 * The rules that keep it honest:
 *
 *   1. NOTHING HERE HOLDS A VALUE. Every number below is read from a rules
 *      file through the engine's own loader. If you find yourself writing a
 *      digit in this file, you are rebuilding the problem one layer down.
 *   2. EVERY FIGURE CARRIES ITS PROVENANCE. Rule set version, effective dates,
 *      the file and key it came from, and a citation with a verified date.
 *      A figure that cannot be traced does not get an id.
 *   3. A FIGURE UNDER AN OPEN GAP DISCLOSES IT. `KNOWN-GAPS.md` carries 55
 *      unresolved verification items. Where one sits under a figure, its id is
 *      listed in `knownGapIds` and `<KeyFigure>` renders the register's own
 *      words beside the number. An article can then say "the engine assumes
 *      22%, and here is why that is an assumption" instead of asserting it.
 *
 * WHAT THIS IS NOT
 *
 * Not a calculator. It reads constants out of rule files; it never simulates.
 * An article that needs a *computed* result (a crossover point, a lifetime
 * cost) calls the engine directly in its page and passes the result in — the
 * engines are pure, synchronous and dependency-free, so that is cheap. This
 * module covers the far more common case: a threshold, a cap, a term, a rate.
 *
 * ADDING A FIGURE
 *
 * Add an entry to `SCALAR_FIGURES` or `FIGURE_TABLES` below. Give it the
 * dotted id `<tool>.<subject>.<name>`, read the value through the engine's
 * rules loader, point `source` at the file and key it came from, and check
 * `KNOWN-GAPS.md` for its id before you decide `knownGapIds` is empty.
 */

import { formatCents, formatDate, formatMonths } from "@/components/ui/format";
import { getRules as getAcaRules } from "@/engines/aca/rules";
import { resolveRules as resolvePaycheckRules, SUPPORTED_TAX_YEARS } from "@/engines/paycheck/rules";
import { getCounty } from "@/engines/property/rules";
import { resolveRules as resolveRepaymentRules } from "@/engines/repayment/rules";
import { STATE_RULES } from "@/engines/trades/rules";
import type { SectionSlug } from "@/lib/site";

/* ═══════════════════════════════════════════════════════════ formatting ══ */

/**
 * Percentages, at the precision the rule states them.
 *
 * `formatPct` in the design system rounds to one decimal, which is right for a
 * ledger column where a row of figures has to align. It is wrong here: the
 * 2026 top applicable percentage is 9.96%, and one decimal renders that as
 * "10.0%" — a misstatement of a statutory figure, in prose, on a page whose
 * whole purpose is to state the rule accurately. So figures print up to two
 * decimals and trim what is not there: 996 bps → "9.96%", 40000 → "400%",
 * 1500 → "15%".
 *
 * `@/components/ui/format` is not the place to fix this. Its one-decimal rule
 * is a deliberate table convention and the component library is another
 * agent's to change.
 */
function exactPct(pct: number): string {
  const rounded = Math.round(pct * 100) / 100;
  return `${rounded.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

/** Basis points at full precision: 996 → "9.96%". */
function exactBps(bps: number): string {
  return exactPct(bps / 100);
}

/* ══════════════════════════════════════════════════════════════════ types ══ */

/** How a raw value becomes a string a reader sees. */
export type FigureUnit =
  /** Integer cents. "$25,000", or "$1,234.56" when it is not whole dollars. */
  | "cents"
  /** A percentage already expressed as one: `10` → "10%". */
  | "percent"
  /** Basis points: `996` → "9.96%" via the engines' own convention. */
  | "bps"
  /** A plain count — payments, years, people. Pair with `suffix`. */
  | "count"
  /** A month count rendered "30 yrs". */
  | "months"
  /** An ISO date rendered "1 Jul 2028". */
  | "date"
  /** A boolean rule, rendered through `flagDisplay`. */
  | "flag";

export interface FigureCitation {
  readonly label: string;
  readonly url: string;
  /**
   * Null when the rule file records a citation nobody has fetched. Rendered as
   * "not yet verified" rather than quietly omitted — an unverified citation is
   * a thing a reader should be told about, not a blank.
   */
  readonly lastVerified: string | null;
}

/** Everything needed to answer "where did this number come from?". */
export interface FigureProvenance {
  /** Which engine owns it — also the palette an article about it wears. */
  readonly tool: SectionSlug;
  readonly ruleSetVersion: string;
  /**
   * Null where the rule set is versioned but not date-bounded. County appeal
   * procedures are the case: they change when a county changes them, not on a
   * calendar, so an invented effective date would be a fabricated fact.
   */
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  /** Repo-relative file and key: `…/rap.2026-07-01.json → principalMatchCents`. */
  readonly source: string;
  readonly citation: FigureCitation;
  /**
   * Ids into `KNOWN-GAPS.md`. Resolved to prose by
   * `src/lib/content/known-gaps.ts`, which is deliberately a separate module
   * so that this one stays pure and importable from anywhere.
   */
  readonly knownGapIds: readonly string[];
}

export interface ScalarFigure extends FigureProvenance {
  readonly kind: "scalar";
  readonly id: FigureId;
  /** What the number is, in a reader's words. */
  readonly label: string;
  readonly unit: FigureUnit;
  /** The raw value, for callers that want to compute rather than print. */
  readonly value: number | string | boolean;
  /** The formatted string. This is what goes on the page. */
  readonly display: string;
  /** One sentence of context, when the number is meaningless without it. */
  readonly note?: string;
}

export interface FigureTableData extends FigureProvenance {
  readonly kind: "table";
  readonly id: FigureTableId;
  readonly label: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly note?: string;
}

export type Figure = ScalarFigure | FigureTableData;

/* ═══════════════════════════════════════════════════════ rule-set access ══ */

/**
 * The as-of date every dated rule set is resolved against.
 *
 * The build date, not a literal. A rules file that has not taken effect yet
 * must not be quoted as current, and one that expired must not either — and
 * hard-coding a date here would silently freeze every article on whichever
 * plan year was current the day this file was written. Pages that use figures
 * are fully prerendered, so this is the day the site was built, which is also
 * the honest reading of "the rules in force as published".
 */
function asOfIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The latest tax year the paycheck engine carries rules for.
 *
 * Derived from the engine's own `SUPPORTED_TAX_YEARS` rather than named, so
 * adding `tips.2027.json` moves every OBBBA figure forward on its own.
 */
function latestPaycheckTaxYear(): number {
  const years = [...SUPPORTED_TAX_YEARS].sort((a, b) => a - b);
  const latest = years[years.length - 1];
  if (latest === undefined) {
    throw new Error("The paycheck engine reports no supported tax years.");
  }
  return latest;
}

/* Memoised: fifty articles resolving the same rule sets should not re-resolve
   them fifty times, and every one of these loaders is pure. */
let repaymentCache: ReturnType<typeof resolveRepaymentRules> | null = null;
let paycheckCache: ReturnType<typeof resolvePaycheckRules> | null = null;

function repayment() {
  repaymentCache ??= resolveRepaymentRules(asOfIso());
  return repaymentCache;
}

function paycheck() {
  paycheckCache ??= resolvePaycheckRules(latestPaycheckTaxYear());
  return paycheckCache;
}

function aca() {
  return getAcaRules();
}

/** A county's rules, or a throw naming the county — never a silent fallback. */
function county(countyId: string) {
  const rules = getCounty(countyId);
  if (!rules) {
    throw new Error(
      `figures.ts references county "${countyId}", which the property engine does not carry. ` +
        `Register it in src/engines/property/rules/index.ts or remove the figure.`,
    );
  }
  return rules;
}

/** A trades state's rules. `STATE_RULES` is total over `StateId`, so this is a narrowing. */
function tradesState(stateId: keyof typeof STATE_RULES) {
  return STATE_RULES[stateId];
}

/**
 * One citation out of a rule file's `citations[]`, by position.
 *
 * Throws rather than falling back to "no citation available": an uncited
 * figure on a money page is the defect this whole module is built against, and
 * a rules file that loses a citation should break the build that quotes it.
 */
function cite(
  citations: readonly { label: string; url: string; lastVerified?: string | null }[],
  index: number,
  where: string,
): FigureCitation {
  const found = citations[index];
  if (!found) {
    throw new Error(
      `figures.ts wanted citations[${String(index)}] of ${where}, which has ` +
        `${String(citations.length)} citation(s). The rules file changed — re-point the figure.`,
    );
  }
  return { label: found.label, url: found.url, lastVerified: found.lastVerified ?? null };
}

/* ══════════════════════════════════════════════════════════ definitions ══ */

interface ScalarDef {
  readonly label: string;
  readonly unit: FigureUnit;
  readonly note?: string;
  /** Appended to the formatted value: `" payments"`, `" of AGI"`. */
  readonly suffix?: string;
  /** `[whenTrue, whenFalse]` for `unit: "flag"`. */
  readonly flagDisplay?: readonly [string, string];
  /** Resolves the value and everything provable about it. */
  readonly resolve: () => {
    value: number | string | boolean;
    provenance: Omit<FigureProvenance, "knownGapIds">;
  };
  readonly knownGapIds?: readonly string[];
}

interface TableDef {
  readonly label: string;
  readonly note?: string;
  readonly resolve: () => {
    columns: readonly string[];
    rows: readonly (readonly string[])[];
    provenance: Omit<FigureProvenance, "knownGapIds">;
  };
  readonly knownGapIds?: readonly string[];
}

/* ---------------------------------------------------- provenance shorthands */

function repaymentProvenance(
  family: "rap" | "planTerms" | "poverty" | "tax" | "tieredStandard",
  file: string,
  key: string,
  citationIndex = 0,
): Omit<FigureProvenance, "knownGapIds"> {
  const rules = repayment()[family];
  return {
    tool: "loans",
    ruleSetVersion: rules.ruleSetVersion,
    effectiveFrom: rules.effectiveFrom,
    effectiveTo: rules.effectiveTo,
    source: `src/engines/repayment/rules/${file} → ${key}`,
    citation: cite(rules.citations, citationIndex, file),
  };
}

function acaProvenance(
  family: "applicablePct" | "fpl" | "csrBands" | "repaymentLimits" | "slcsp" | "contributionLimits",
  file: string,
  key: string,
  citationIndex = 0,
): Omit<FigureProvenance, "knownGapIds"> {
  const rules = aca()[family];
  return {
    tool: "aca",
    ruleSetVersion: rules.ruleSetVersion,
    effectiveFrom: rules.effectiveFrom,
    effectiveTo: rules.effectiveTo,
    source: `src/engines/aca/rules/${file} → ${key}`,
    citation: cite(rules.citations, citationIndex, file),
  };
}

function paycheckProvenance(
  family: "tips" | "overtime" | "senior" | "carLoan",
  file: string,
  key: string,
  citationIndex = 0,
): Omit<FigureProvenance, "knownGapIds"> {
  const rules = paycheck()[family];
  return {
    tool: "paycheck",
    ruleSetVersion: rules.ruleSetVersion,
    effectiveFrom: rules.effectiveFrom,
    effectiveTo: rules.effectiveTo,
    source: `src/engines/paycheck/rules/${file} → ${key}`,
    citation: cite(rules.citations, citationIndex, file),
  };
}

function propertyProvenance(
  countyId: string,
  key: string,
  citationIndex = 0,
): Omit<FigureProvenance, "knownGapIds"> {
  const rules = county(countyId);
  const file = `counties/${countyId}.json`;
  return {
    tool: "property",
    ruleSetVersion: rules.ruleSetVersion,
    // County rule files carry a version but no effective window — see the note
    // on `effectiveFrom`. Null rather than a date nobody can source.
    effectiveFrom: null,
    effectiveTo: null,
    source: `src/engines/property/rules/${file} → ${key}`,
    citation: cite(rules.citations, citationIndex, file),
  };
}

/* ═══════════════════════════════════════════════ the scalar figure registry ══ */

const SCALAR_FIGURES = {
  /* ---------------------------------------------------------------- loans -- */

  "loans.rap.minimumMonthlyPayment": {
    label: "RAP minimum monthly payment",
    unit: "cents",
    resolve: () => ({
      value: repayment().rap.minimumMonthlyPaymentCents,
      provenance: repaymentProvenance(
        "rap",
        "rap.2026-07-01.json",
        "minimumMonthlyPaymentCents",
      ),
    }),
  },

  "loans.rap.principalMatch": {
    label: "RAP monthly principal match",
    unit: "cents",
    note: "Applied on an on-time payment, or the payment amount when the payment is smaller.",
    resolve: () => ({
      value: repayment().rap.principalMatchCents,
      provenance: repaymentProvenance("rap", "rap.2026-07-01.json", "principalMatchCents"),
    }),
  },

  "loans.rap.dependentReduction": {
    label: "RAP reduction per dependent claimed",
    unit: "cents",
    suffix: " a month",
    resolve: () => ({
      value: repayment().rap.dependentReductionCents,
      provenance: repaymentProvenance("rap", "rap.2026-07-01.json", "dependentReductionCents"),
    }),
  },

  "loans.rap.bracketStep": {
    label: "RAP income bracket width",
    unit: "cents",
    resolve: () => ({
      value: repayment().rap.bracketStepCents,
      provenance: repaymentProvenance("rap", "rap.2026-07-01.json", "bracketStepCents"),
    }),
  },

  "loans.rap.topRate": {
    label: "RAP top payment rate",
    unit: "percent",
    suffix: " of AGI",
    resolve: () => ({
      value: repayment().rap.bracketMaxPct,
      provenance: repaymentProvenance("rap", "rap.2026-07-01.json", "bracketMaxPct"),
    }),
  },

  "loans.rap.forgivenessPayments": {
    label: "RAP forgiveness threshold",
    unit: "count",
    suffix: " qualifying payments",
    resolve: () => ({
      value: repayment().rap.forgivenessAfterPayments,
      provenance: repaymentProvenance("rap", "rap.2026-07-01.json", "forgivenessAfterPayments"),
    }),
  },

  "loans.rap.paymentCapped": {
    label: "Is the RAP payment capped at the 10-year Standard amount?",
    unit: "flag",
    flagDisplay: ["capped at the 10-year Standard payment", "not capped at any amount"],
    note:
      "The single most consequential difference between RAP and IBR. IBR's payment stops at the " +
      "10-year Standard amount; RAP's keeps climbing with income.",
    resolve: () => ({
      value: repayment().rap.paymentCappedAtStandard,
      provenance: repaymentProvenance("rap", "rap.2026-07-01.json", "paymentCappedAtStandard"),
    }),
  },

  "loans.rap.interestWaiver": {
    label: "Does RAP waive unpaid interest?",
    unit: "flag",
    flagDisplay: ["unpaid interest is waived, never capitalised", "unpaid interest accrues"],
    resolve: () => ({
      value: repayment().rap.interestWaiver,
      provenance: repaymentProvenance("rap", "rap.2026-07-01.json", "interestWaiver"),
    }),
  },

  "loans.pslf.payments": {
    label: "PSLF qualifying payments",
    unit: "count",
    suffix: " payments",
    resolve: () => ({
      value: repayment().planTerms.pslfPayments,
      provenance: repaymentProvenance("planTerms", "plan-terms.2026-07-01.json", "pslfPayments"),
    }),
  },

  "loans.ibrOld.rate": {
    label: "Old IBR share of discretionary income",
    unit: "percent",
    resolve: () => ({
      value: repayment().planTerms.ibrOld.discretionaryPct,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "ibrOld.discretionaryPct",
      ),
    }),
  },

  "loans.ibrOld.forgivenessPayments": {
    label: "Old IBR forgiveness threshold",
    unit: "count",
    suffix: " payments",
    resolve: () => ({
      value: repayment().planTerms.ibrOld.forgivenessAfterPayments,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "ibrOld.forgivenessAfterPayments",
      ),
    }),
  },

  "loans.ibrNew.rate": {
    label: "New IBR share of discretionary income",
    unit: "percent",
    resolve: () => ({
      value: repayment().planTerms.ibrNew.discretionaryPct,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "ibrNew.discretionaryPct",
      ),
    }),
  },

  "loans.ibrNew.forgivenessPayments": {
    label: "New IBR forgiveness threshold",
    unit: "count",
    suffix: " payments",
    resolve: () => ({
      value: repayment().planTerms.ibrNew.forgivenessAfterPayments,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "ibrNew.forgivenessAfterPayments",
      ),
    }),
  },

  "loans.ibrNew.firstLoanOnOrAfter": {
    label: "New IBR new-borrower date",
    unit: "date",
    resolve: () => ({
      value: repayment().planTerms.ibrNew.firstLoanOnOrAfter,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "ibrNew.firstLoanOnOrAfter",
      ),
    }),
    knownGapIds: ["GAP-049"],
  },

  "loans.idr.povertyMultiplier": {
    label: "IBR and PAYE protected income, as a share of the poverty guideline",
    unit: "percent",
    resolve: () => ({
      value: repayment().planTerms.ibrNew.povertyMultiplierPct,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "ibrNew.povertyMultiplierPct",
      ),
    }),
  },

  "loans.paye.sunsetDate": {
    label: "PAYE sunset date",
    unit: "date",
    note: "A simulation running past this date must model the forced migration, not project PAYE.",
    resolve: () => ({
      value: repayment().planTerms.paye.sunsetDate,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "paye.sunsetDate",
        2,
      ),
    }),
    knownGapIds: ["GAP-003"],
  },

  "loans.icr.sunsetDate": {
    label: "ICR sunset date",
    unit: "date",
    resolve: () => ({
      value: repayment().planTerms.icr.sunsetDate,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "icr.sunsetDate",
        2,
      ),
    }),
    knownGapIds: ["GAP-003"],
  },

  "loans.post2026RestrictionDate": {
    label: "Date after which a new federal loan can restrict the borrower to RAP",
    unit: "date",
    resolve: () => ({
      value: repayment().planTerms.post2026RestrictionDate,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "post2026RestrictionDate",
        2,
      ),
    }),
    knownGapIds: ["GAP-003"],
  },

  "loans.graduated.stepMonths": {
    label: "Graduated plan step interval",
    unit: "months",
    resolve: () => ({
      value: repayment().planTerms.graduated.stepMonths,
      provenance: repaymentProvenance(
        "planTerms",
        "plan-terms.2026-07-01.json",
        "graduated.stepMonths",
        1,
      ),
    }),
    knownGapIds: ["GAP-045"],
  },

  "loans.poverty.firstPerson": {
    label: "Poverty guideline, first person, 48 contiguous states and DC",
    unit: "cents",
    suffix: " a year",
    resolve: () => ({
      value: repayment().poverty.guidelines.CONTIGUOUS_48.firstPersonCents,
      provenance: repaymentProvenance(
        "poverty",
        "poverty-guidelines.2026.json",
        "guidelines.CONTIGUOUS_48.firstPersonCents",
      ),
    }),
  },

  "loans.poverty.additionalPerson": {
    label: "Poverty guideline, each additional person, 48 contiguous states and DC",
    unit: "cents",
    suffix: " a year",
    resolve: () => ({
      value: repayment().poverty.guidelines.CONTIGUOUS_48.additionalPersonCents,
      provenance: repaymentProvenance(
        "poverty",
        "poverty-guidelines.2026.json",
        "guidelines.CONTIGUOUS_48.additionalPersonCents",
      ),
    }),
  },

  "loans.tax.nonPslfForgivenessTaxable": {
    label: "Is non-PSLF forgiveness taxable?",
    unit: "flag",
    flagDisplay: [
      "taxable as cancellation-of-debt income",
      "excluded from income",
    ],
    resolve: () => ({
      value: repayment().tax.nonPslfForgivenessTaxable,
      provenance: repaymentProvenance("tax", "tax.2026.json", "nonPslfForgivenessTaxable"),
    }),
    knownGapIds: ["GAP-004"],
  },

  "loans.tax.pslfForgivenessTaxable": {
    label: "Is PSLF forgiveness taxable?",
    unit: "flag",
    flagDisplay: ["taxable", "excluded from income under 26 U.S.C. § 108(f)(1)"],
    resolve: () => ({
      value: repayment().tax.pslfForgivenessTaxable,
      provenance: repaymentProvenance("tax", "tax.2026.json", "pslfForgivenessTaxable"),
    }),
  },

  "loans.tax.assumedMarginalRate": {
    label: "Marginal tax rate the engine assumes on forgiven balances",
    unit: "percent",
    note: "A flat modelling assumption for ranking, not a rule. The real rate is borrower-specific.",
    resolve: () => ({
      value: repayment().tax.assumedMarginalRatePct,
      provenance: repaymentProvenance("tax", "tax.2026.json", "assumedMarginalRatePct"),
    }),
    knownGapIds: ["GAP-046"],
  },

  /* ------------------------------------------------------------------ aca -- */

  "aca.cliff.ceilingMultiple": {
    label: "Premium tax credit income ceiling",
    unit: "bps",
    suffix: " of the poverty line",
    note: "A strict 'more than' test applied before Form 8962's whole-percent truncation — there is no grace band above it.",
    resolve: () => ({
      value: aca().applicablePct.eligibilityCeiling.ceilingMultipleBps,
      provenance: acaProvenance(
        "applicablePct",
        "applicable-percentage.2026.json",
        "eligibilityCeiling.ceilingMultipleBps",
        5,
      ),
    }),
    knownGapIds: ["GAP-033"],
  },

  "aca.cliff.ineligibleSentinel": {
    label: "Form 8962 line 5 entry when the ceiling test fails",
    unit: "count",
    suffix: "%",
    resolve: () => ({
      value: aca().applicablePct.eligibilityCeiling.ineligibleSentinelPct,
      provenance: acaProvenance(
        "applicablePct",
        "applicable-percentage.2026.json",
        "eligibilityCeiling.ineligibleSentinelPct",
        3,
      ),
    }),
    knownGapIds: ["GAP-033"],
  },

  "aca.applicablePercentage.top": {
    label: "Top applicable percentage",
    unit: "bps",
    suffix: " of household income",
    note: "What a household at the top of the eligible range is expected to pay for the benchmark plan.",
    resolve: () => {
      const bands = aca().applicablePct.bands;
      const top = bands[bands.length - 1];
      if (!top) throw new Error("applicable-percentage.2026.json carries no bands.");
      return {
        value: top.highBps,
        provenance: acaProvenance(
          "applicablePct",
          "applicable-percentage.2026.json",
          "bands[last].highBps",
        ),
      };
    },
  },

  "aca.applicablePercentage.bottom": {
    label: "Lowest applicable percentage",
    unit: "bps",
    suffix: " of household income",
    resolve: () => {
      const bottom = aca().applicablePct.bands[0];
      if (!bottom) throw new Error("applicable-percentage.2026.json carries no bands.");
      return {
        value: bottom.lowBps,
        provenance: acaProvenance(
          "applicablePct",
          "applicable-percentage.2026.json",
          "bands[0].lowBps",
        ),
      };
    },
  },

  "aca.fpl.firstPerson": {
    label: "Poverty guideline used for 2026 marketplace coverage, first person",
    unit: "cents",
    suffix: " a year",
    note: "Coverage-year eligibility uses the guidelines in effect when open enrolment began — the prior calendar year's table.",
    resolve: () => ({
      value: aca().fpl.groups.CONTIGUOUS_48.firstPersonCents,
      provenance: acaProvenance("fpl", "fpl.2025.json", "groups.CONTIGUOUS_48.firstPersonCents"),
    }),
  },

  "aca.fpl.additionalPerson": {
    label: "Poverty guideline used for 2026 marketplace coverage, each additional person",
    unit: "cents",
    suffix: " a year",
    resolve: () => ({
      value: aca().fpl.groups.CONTIGUOUS_48.additionalPersonCents,
      provenance: acaProvenance(
        "fpl",
        "fpl.2025.json",
        "groups.CONTIGUOUS_48.additionalPersonCents",
      ),
    }),
  },

  "aca.clawback.capped": {
    label: "Is repayment of excess advance credit capped?",
    unit: "flag",
    flagDisplay: [
      "capped by income band",
      "uncapped — the full excess is repaid at every income",
    ],
    note: "OBBBA § 71305 struck IRC § 36B(f)(2)(B) for tax years after 2025, so no cap exists.",
    resolve: () => ({
      value: aca().repaymentLimits.limitation.inEffect,
      provenance: acaProvenance(
        "repaymentLimits",
        "repayment-limits.2026.json",
        "limitation.inEffect",
      ),
    }),
  },

  "aca.csr.topActuarialValue": {
    label: "Highest cost-sharing reduction actuarial value",
    unit: "bps",
    note: "Met plus or minus a de minimis variation, so a real enrollee's plan is approximately this.",
    resolve: () => {
      const top = aca().csrBands.bands[0];
      if (!top) throw new Error("csr-bands.json carries no bands.");
      return {
        value: top.actuarialValueBps,
        provenance: acaProvenance("csrBands", "csr-bands.json", "bands[0].actuarialValueBps"),
      };
    },
  },

  /* ------------------------------------------------------------- paycheck -- */

  "paycheck.tips.cap": {
    label: "Qualified tips deduction cap",
    unit: "cents",
    resolve: () => ({
      value: paycheck().tips.capCents,
      provenance: paycheckProvenance("tips", "tips.2026.json", "capCents"),
    }),
  },

  "paycheck.tips.phaseOutSingle": {
    label: "Tips deduction phase-out threshold, single",
    unit: "cents",
    suffix: " of MAGI",
    resolve: () => ({
      value: paycheck().tips.phaseOut.thresholdSingleCents,
      provenance: paycheckProvenance("tips", "tips.2026.json", "phaseOut.thresholdSingleCents"),
    }),
    knownGapIds: ["GAP-047"],
  },

  "paycheck.tips.phaseOutJoint": {
    label: "Tips deduction phase-out threshold, married filing jointly",
    unit: "cents",
    suffix: " of MAGI",
    resolve: () => ({
      value: paycheck().tips.phaseOut.thresholdJointCents,
      provenance: paycheckProvenance("tips", "tips.2026.json", "phaseOut.thresholdJointCents"),
    }),
    knownGapIds: ["GAP-047"],
  },

  "paycheck.overtime.capSingle": {
    label: "Qualified overtime deduction cap, single",
    unit: "cents",
    resolve: () => ({
      value: paycheck().overtime.capSingleCents,
      provenance: paycheckProvenance("overtime", "overtime.2026.json", "capSingleCents"),
    }),
    knownGapIds: ["GAP-005"],
  },

  "paycheck.overtime.capJoint": {
    label: "Qualified overtime deduction cap, married filing jointly",
    unit: "cents",
    resolve: () => ({
      value: paycheck().overtime.capJointCents,
      provenance: paycheckProvenance("overtime", "overtime.2026.json", "capJointCents"),
    }),
    knownGapIds: ["GAP-005"],
  },

  "paycheck.overtime.premiumShare": {
    label: "Share of the FLSA overtime rate that is the deductible premium",
    unit: "bps",
    note: "Only the half-time premium inside time-and-a-half qualifies — not the whole overtime cheque.",
    resolve: () => ({
      value: paycheck().overtime.premiumShareOfRegularRateBps,
      provenance: paycheckProvenance(
        "overtime",
        "overtime.2026.json",
        "premiumShareOfRegularRateBps",
      ),
    }),
    knownGapIds: ["GAP-005"],
  },

  "paycheck.senior.amount": {
    label: "Additional deduction for each qualifying person 65 or over",
    unit: "cents",
    resolve: () => ({
      value: paycheck().senior.amountPerQualifyingPersonCents,
      provenance: paycheckProvenance(
        "senior",
        "senior.2026.json",
        "amountPerQualifyingPersonCents",
      ),
    }),
  },

  "paycheck.senior.qualifyingAge": {
    label: "Qualifying age for the senior deduction",
    unit: "count",
    resolve: () => ({
      value: paycheck().senior.qualifyingAge,
      provenance: paycheckProvenance("senior", "senior.2026.json", "qualifyingAge"),
    }),
  },

  "paycheck.carLoan.cap": {
    label: "Qualified vehicle loan interest deduction cap",
    unit: "cents",
    resolve: () => ({
      value: paycheck().carLoan.capCents,
      provenance: paycheckProvenance("carLoan", "car-loan.2026.json", "capCents"),
    }),
  },

  /* ------------------------------------------------------------- property -- */

  "property.cook.assessmentRatio": {
    label: "Cook County assessment level for a residential parcel",
    unit: "percent",
    suffix: " of market value",
    resolve: () => ({
      value: county("il-cook").assessmentLevelPctOfMarket,
      provenance: propertyProvenance("il-cook", "assessmentLevelPctOfMarket"),
    }),
    knownGapIds: ["GAP-013"],
  },

  "property.cook.estimatedTaxRate": {
    label: "Cook County estimated tax rate on assessed value",
    unit: "bps",
    note: "A single blended estimate standing in for hundreds of overlapping taxing-district rates.",
    resolve: () => ({
      value: county("il-cook").estimatedTaxRateOnAssessedBps,
      provenance: propertyProvenance("il-cook", "estimatedTaxRateOnAssessedBps"),
    }),
    knownGapIds: ["GAP-014"],
  },

  "property.bergen.commonLevelCorridor": {
    label: "New Jersey common level range corridor",
    unit: "bps",
    note: "Chapter 123: an assessment inside this corridor around the Director's Ratio gets no relief.",
    resolve: () => {
      const rules = county("nj-bergen");
      const clr = rules.commonLevelRange;
      if (!clr) {
        throw new Error("nj-bergen.json is missing its commonLevelRange block.");
      }
      return {
        value: clr.corridorBps,
        provenance: propertyProvenance("nj-bergen", "commonLevelRange.corridorBps"),
      };
    },
    knownGapIds: ["GAP-041"],
  },

  /* --------------------------------------------------------------- trades -- */

  "trades.ca.homeImprovementThreshold": {
    label: "California home improvement contract threshold",
    unit: "cents",
    note: "Above this contract price, the statutory home improvement contract requirements attach.",
    resolve: () => ({
      value: tradesState("CA").homeImprovementThresholdCents,
      provenance: {
        tool: "trades",
        ruleSetVersion: tradesState("CA").ruleSetVersion,
        effectiveFrom: tradesState("CA").effectiveFrom,
        effectiveTo: tradesState("CA").effectiveTo,
        source: "src/engines/trades/rules/states/ca.json → homeImprovementThresholdCents",
        citation: cite(tradesState("CA").citations, 0, "states/ca.json"),
      },
    }),
    knownGapIds: ["GAP-053"],
  },

  "trades.ny.homeImprovementThreshold": {
    label: "New York home improvement contract threshold",
    unit: "cents",
    resolve: () => ({
      value: tradesState("NY").homeImprovementThresholdCents,
      provenance: {
        tool: "trades",
        ruleSetVersion: tradesState("NY").ruleSetVersion,
        effectiveFrom: tradesState("NY").effectiveFrom,
        effectiveTo: tradesState("NY").effectiveTo,
        source: "src/engines/trades/rules/states/ny.json → homeImprovementThresholdCents",
        citation: cite(tradesState("NY").citations, 0, "states/ny.json"),
      },
    }),
    knownGapIds: ["GAP-053"],
  },
} as const satisfies Record<string, ScalarDef>;

export type FigureId = keyof typeof SCALAR_FIGURES;

/* ═════════════════════════════════════════════════ the table registry ══ */

const FIGURE_TABLES = {
  /**
   * The RAP bracket table, generated from the three parameters the rule file
   * actually holds — start percentage, top percentage and bracket width — so
   * a change to any of them redraws every row rather than desynchronising one.
   */
  "loans.rap.brackets": {
    label: "RAP payment by adjusted gross income",
    note:
      "The regulation reads 'more than $X and not more than $Y', so an AGI landing exactly on a " +
      "bracket boundary falls in the LOWER band.",
    resolve: () => {
      const rap = repayment().rap;
      const step = rap.bracketStepCents;
      const rows: string[][] = [
        [
          `Not more than ${formatCents(rap.lowIncomeThresholdCents)}`,
          `${formatCents(Math.round(rap.lowIncomeAnnualBaseCents / 12))} a month`,
        ],
      ];
      for (let pct = rap.bracketStartPct; pct < rap.bracketMaxPct; pct++) {
        rows.push([
          `More than ${formatCents(pct * step)} and not more than ${formatCents((pct + 1) * step)}`,
          `${exactPct(pct)} of AGI`,
        ]);
      }
      rows.push([
        `More than ${formatCents(rap.bracketMaxPct * step)}`,
        `${exactPct(rap.bracketMaxPct)} of AGI`,
      ]);
      return {
        columns: ["Adjusted gross income", "Annual payment"],
        rows,
        provenance: repaymentProvenance(
          "rap",
          "rap.2026-07-01.json",
          "bracketStartPct · bracketMaxPct · bracketStepCents",
        ),
      };
    },
  },

  "loans.tieredStandard.terms": {
    label: "Tiered Standard repayment term by balance at entry",
    note:
      "'Equal to or greater than $X but less than $Y' — the opposite boundary convention to RAP. " +
      "A balance landing exactly on a boundary takes the longer term.",
    resolve: () => {
      const tiered = repayment().tieredStandard;
      let floor = 0;
      const rows = tiered.tiers.map((tier) => {
        const label =
          tier.maxBalanceCents === null
            ? `${formatCents(floor)} or more`
            : floor === 0
              ? `Less than ${formatCents(tier.maxBalanceCents)}`
              : `${formatCents(floor)} to less than ${formatCents(tier.maxBalanceCents)}`;
        floor = tier.maxBalanceCents ?? floor;
        return [label, formatMonths(tier.termMonths)];
      });
      return {
        columns: ["Balance at entry", "Term"],
        rows,
        provenance: repaymentProvenance(
          "tieredStandard",
          "tiered-standard-terms.2026-07-01.json",
          "tiers",
        ),
      };
    },
  },

  "aca.applicablePercentage.bands": {
    label: "Applicable percentage by household income",
    note:
      "Within a band the percentage is interpolated on the whole-percent income figure, then " +
      "rounded to the nearest basis point — the Form 8962 applicable-figure method.",
    resolve: () => {
      const bands = aca().applicablePct.bands;
      return {
        columns: ["Household income (% of poverty line)", "Expected contribution"],
        rows: bands.map((band) => [
          `${String(band.fromPct)}% to ${String(band.toPct)}%`,
          band.lowBps === band.highBps
            ? exactBps(band.lowBps)
            : `${exactBps(band.lowBps)} rising to ${exactBps(band.highBps)}`,
        ]),
        provenance: acaProvenance("applicablePct", "applicable-percentage.2026.json", "bands"),
      };
    },
  },

  "aca.csr.bands": {
    label: "Cost-sharing reduction bands",
    note: "Silver plans only. Actuarial values are met within a de minimis variation.",
    resolve: () => {
      const bands = aca().csrBands.bands;
      return {
        columns: ["Household income (% of poverty line)", "Approximate actuarial value"],
        rows: bands.map((band) => [
          `${String(band.fromPct)}% to ${String(band.toPct)}%`,
          exactBps(band.actuarialValueBps),
        ]),
        provenance: acaProvenance("csrBands", "csr-bands.json", "bands"),
      };
    },
  },

  "trades.homeImprovementThresholds": {
    label: "Home improvement contract thresholds by state",
    note:
      "Above the threshold, the state's home improvement contract requirements attach to the job.",
    resolve: () => {
      const states = Object.values(STATE_RULES).sort((a, b) =>
        a.stateName.localeCompare(b.stateName),
      );
      const first = states[0];
      if (!first) throw new Error("The trades engine carries no state rules.");
      return {
        columns: ["State", "Threshold", "Required clauses"],
        rows: states.map((state) => [
          state.stateName,
          formatCents(state.homeImprovementThresholdCents),
          String(state.requiredClauses.length),
        ]),
        provenance: {
          tool: "trades" as const,
          ruleSetVersion: states.map((state) => state.ruleSetVersion).join("+"),
          effectiveFrom: first.effectiveFrom,
          effectiveTo: first.effectiveTo,
          source: "src/engines/trades/rules/states/*.json → homeImprovementThresholdCents",
          citation: cite(first.citations, 0, "states/*.json"),
        },
      };
    },
    knownGapIds: ["GAP-053"],
  },
} as const satisfies Record<string, TableDef>;

export type FigureTableId = keyof typeof FIGURE_TABLES;

/* ══════════════════════════════════════════════════════════════ the API ══ */

function render(def: ScalarDef, value: number | string | boolean): string {
  const body = ((): string => {
    switch (def.unit) {
      case "cents":
        return formatCents(Number(value));
      case "percent":
        return exactPct(Number(value));
      case "bps":
        return exactBps(Number(value));
      case "months":
        return formatMonths(Number(value));
      case "date":
        return formatDate(String(value));
      case "count":
        return Number(value).toLocaleString("en-US");
      case "flag": {
        const [whenTrue, whenFalse] = def.flagDisplay ?? ["yes", "no"];
        return value ? whenTrue : whenFalse;
      }
    }
  })();
  return def.suffix ? `${body}${def.suffix}` : body;
}

const scalarCache = new Map<string, ScalarFigure>();
const tableCache = new Map<string, FigureTableData>();

/**
 * One figure, resolved from the rules in force, with its provenance.
 *
 * Throws on an unknown id. That is the point: `getFigure("loans.rap.forgivness")`
 * is a typo that must fail the build, not render an empty span into a page
 * about somebody's thirty-year repayment decision.
 */
export function getFigure(id: FigureId): ScalarFigure {
  const cached = scalarCache.get(id);
  if (cached) return cached;

  const def: ScalarDef | undefined = SCALAR_FIGURES[id];
  if (!def) {
    throw new Error(
      `Unknown figure id "${String(id)}". Registered ids are in src/lib/content/figures.ts. ` +
        `Do not work around this by typing the number into the article.`,
    );
  }

  const { value, provenance } = def.resolve();
  const figure: ScalarFigure = {
    kind: "scalar",
    id,
    label: def.label,
    unit: def.unit,
    value,
    display: render(def, value),
    ...(def.note === undefined ? {} : { note: def.note }),
    ...provenance,
    knownGapIds: def.knownGapIds ?? [],
  };
  scalarCache.set(id, figure);
  return figure;
}

/** A table figure — a bracket schedule, a band table — with the same provenance. */
export function getFigureTable(id: FigureTableId): FigureTableData {
  const cached = tableCache.get(id);
  if (cached) return cached;

  const def: TableDef | undefined = FIGURE_TABLES[id];
  if (!def) {
    throw new Error(`Unknown figure table id "${String(id)}". See src/lib/content/figures.ts.`);
  }

  const { columns, rows, provenance } = def.resolve();
  const table: FigureTableData = {
    kind: "table",
    id,
    label: def.label,
    columns,
    rows,
    ...(def.note === undefined ? {} : { note: def.note }),
    ...provenance,
    knownGapIds: def.knownGapIds ?? [],
  };
  tableCache.set(id, table);
  return table;
}

/**
 * Just the formatted string.
 *
 * For the places a React element cannot go and a template literal must —
 * an `<FAQ>` answer, a `<title>`, a meta description. Those strings end up in
 * JSON-LD and in search results, so they need the same guarantee the visible
 * page has: the digits come from the rule file.
 */
export function figureText(id: FigureId): string {
  return getFigure(id).display;
}

/** Every registered scalar id, optionally narrowed to one tool. */
export function listFigureIds(tool?: SectionSlug): FigureId[] {
  const ids = Object.keys(SCALAR_FIGURES) as FigureId[];
  if (!tool) return ids;
  return ids.filter((id) => getFigure(id).tool === tool);
}

/** Every registered table id. */
export function listFigureTableIds(): FigureTableId[] {
  return Object.keys(FIGURE_TABLES) as FigureTableId[];
}
