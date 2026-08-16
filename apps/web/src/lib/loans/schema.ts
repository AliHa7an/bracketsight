/**
 * One Zod schema for the whole flow — the single source of truth shared
 * by the form (client) and, in phase 2, the API and AI structured output.
 * Form units are human (dollars, percent); conversion to engine units
 * (integer cents, basis points) happens exactly once, in toEngineInput.
 */

import { z } from "zod";
import { simulateAllPlans } from "@fineprint/engine-repayment";
import type { Household, Loan, SimulationResult, Strategy } from "@fineprint/engine-repayment";

const money = (label: string) =>
  z
    .number({ error: `Enter ${label}` })
    .min(0, `${label} cannot be negative`)
    .max(5_000_000, `${label} looks too large — enter dollars, not cents`);

export const loanSchema = z.object({
  id: z.string(),
  type: z.enum([
    "DIRECT_SUBSIDIZED",
    "DIRECT_UNSUBSIDIZED",
    "DIRECT_GRAD_PLUS",
    "DIRECT_PARENT_PLUS",
    "DIRECT_CONSOLIDATION",
    "FFEL",
    "PERKINS",
    "HEAL",
  ]),
  balanceDollars: money("the balance").min(1, "Enter the current balance"),
  ratePct: z
    .number({ error: "Enter the interest rate" })
    .min(0, "The rate cannot be negative")
    .max(30, "Enter the annual rate as a percentage, e.g. 6.39"),
  firstDisbursement: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the first disbursement date"),
  isConsolidation: z.boolean(),
  underlyingHadParentPlus: z.boolean(),
  /**
   * The § 685.209(b)(6)(ii) carve-out: a consolidation that repaid a Parent
   * PLUS loan keeps RAP if it was being repaid under ICR, PAYE, or IBR at any
   * point from 4 Jul 2025 through 30 Jun 2028. Defaults to false, so the taint
   * applies unless the borrower affirms it. Only asked when the loan is a
   * consolidation that repaid a Parent PLUS loan.
   */
  repaidUnderIdrInWindow: z.boolean(),
});

export const householdSchema = z.object({
  agiDollars: money("your adjusted gross income"),
  filingStatus: z.enum(["SINGLE", "MARRIED_JOINT", "MARRIED_SEPARATE", "HEAD_OF_HOUSEHOLD"]),
  spouseAgiDollars: money("your spouse's AGI"),
  spouseFederalLoanBalanceDollars: money("your spouse's federal loan balance"),
  dependentsClaimed: z
    .number({ error: "Enter 0 if none" })
    .int("Whole number of dependents")
    .min(0)
    .max(20),
  familySize: z
    .number({ error: "Enter your family size" })
    .int("Whole number")
    .min(1, "Family size includes you — at least 1")
    .max(20),
  stateGroup: z.enum(["CONTIGUOUS_48", "ALASKA", "HAWAII"]),
});

export const goalsSchema = z.object({
  pursuingPSLF: z.enum(["YES", "NO", "UNSURE"]),
  priorQualifyingPayments: z
    .number({ error: "Enter 0 if none" })
    .int("Whole number of payments")
    .min(0)
    .max(360),
  expectedAnnualIncomeGrowthPct: z
    .number({ error: "Enter expected annual income growth" })
    .min(0)
    .max(15),
});

export const formSchema = z.object({
  loans: z.array(loanSchema).min(1, "Add at least one loan"),
  household: householdSchema,
  goals: goalsSchema,
});

export type LoanFormValues = z.infer<typeof loanSchema>;
export type FormValues = z.infer<typeof formSchema>;

/**
 * Numeric fields start empty. `undefined` renders as an empty input and
 * fails validation with the field's own message — never a silent 0.
 */
const emptyNumber = undefined as unknown as number;

export function emptyLoan(): LoanFormValues {
  return {
    id: `loan-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    type: "DIRECT_UNSUBSIDIZED",
    balanceDollars: emptyNumber,
    ratePct: emptyNumber,
    firstDisbursement: "",
    isConsolidation: false,
    underlyingHadParentPlus: false,
    repaidUnderIdrInWindow: false,
  };
}

export const defaultFormValues: FormValues = {
  loans: [emptyLoan()],
  household: {
    agiDollars: emptyNumber,
    filingStatus: "SINGLE",
    spouseAgiDollars: 0,
    spouseFederalLoanBalanceDollars: 0,
    dependentsClaimed: 0,
    familySize: 1,
    stateGroup: "CONTIGUOUS_48",
  },
  goals: {
    pursuingPSLF: "NO",
    priorQualifyingPayments: 0,
    expectedAnnualIncomeGrowthPct: 3,
  },
};

/**
 * M1 — no gate on the answer.
 *
 * The form does not open empty. It opens on one plausible borrower, so the
 * ranked answer is on screen before the first keystroke and every edit refines
 * a real result instead of filling a void. The example is labelled as an
 * example in the UI (see `confirmedDetails` in CalculatorApp) — a partial,
 * caveated answer beats an empty state, but an unlabelled one would be a lie.
 *
 * The loan id is a literal, not `emptyLoan()`: a value derived from
 * `Date.now()` would differ between the server render and hydration.
 */
export const exampleFormValues: FormValues = {
  loans: [
    {
      id: "loan-1",
      type: "DIRECT_UNSUBSIDIZED",
      balanceDollars: 38_500,
      ratePct: 6.39,
      firstDisbursement: "2022-08-01",
      isConsolidation: false,
      underlyingHadParentPlus: false,
      repaidUnderIdrInWindow: false,
    },
  ],
  household: {
    agiDollars: 55_000,
    filingStatus: "SINGLE",
    spouseAgiDollars: 0,
    spouseFederalLoanBalanceDollars: 0,
    dependentsClaimed: 0,
    familySize: 1,
    stateGroup: "CONTIGUOUS_48",
  },
  goals: {
    pursuingPSLF: "NO",
    priorQualifyingPayments: 0,
    expectedAnnualIncomeGrowthPct: 3,
  },
};

const LOAN_TYPES = loanSchema.shape.type.options;
const FILING_STATUSES = householdSchema.shape.filingStatus.options;
const STATE_GROUPS = householdSchema.shape.stateGroup.options;
const PSLF_ANSWERS = goalsSchema.shape.pursuingPSLF.options;

function pickNumber(raw: unknown, fallback: number, min: number, max: number): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  if (raw < min || raw > max) return fallback;
  return raw;
}

function pickEnum<T extends string>(raw: unknown, table: readonly T[], fallback: T): T {
  return typeof raw === "string" && (table as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;
}

function pickDate(raw: unknown, fallback: string): string {
  return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

/**
 * Fill every gap in a half-typed form with the example borrower's value, so the
 * engine always has a complete, valid input. This is what lets the answer
 * region render from the first keystroke: a field the user has not reached yet
 * (or has just emptied) falls back rather than blanking the result.
 *
 * It never invents a number the user *did* type — only replaces values that
 * cannot be simulated at all.
 */
export function resolveFormValues(raw: unknown): FormValues {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const example = exampleFormValues;
  const exampleLoan = example.loans[0]!;

  const rawLoans = Array.isArray(source.loans) ? source.loans : [];
  const loans: LoanFormValues[] = rawLoans.map((entry, index) => {
    const l = (typeof entry === "object" && entry !== null ? entry : {}) as Record<
      string,
      unknown
    >;
    return {
      id: typeof l.id === "string" && l.id ? l.id : `loan-${index + 1}`,
      type: pickEnum(l.type, LOAN_TYPES, exampleLoan.type),
      balanceDollars: pickNumber(l.balanceDollars, exampleLoan.balanceDollars, 1, 5_000_000),
      ratePct: pickNumber(l.ratePct, exampleLoan.ratePct, 0, 30),
      firstDisbursement: pickDate(l.firstDisbursement, exampleLoan.firstDisbursement),
      isConsolidation: l.isConsolidation === true,
      underlyingHadParentPlus: l.underlyingHadParentPlus === true,
      repaidUnderIdrInWindow: l.repaidUnderIdrInWindow === true,
    };
  });

  const h = (typeof source.household === "object" && source.household !== null
    ? source.household
    : {}) as Record<string, unknown>;
  const g = (typeof source.goals === "object" && source.goals !== null
    ? source.goals
    : {}) as Record<string, unknown>;

  return {
    loans: loans.length > 0 ? loans : [{ ...exampleLoan }],
    household: {
      agiDollars: pickNumber(h.agiDollars, example.household.agiDollars, 0, 5_000_000),
      filingStatus: pickEnum(h.filingStatus, FILING_STATUSES, example.household.filingStatus),
      spouseAgiDollars: pickNumber(h.spouseAgiDollars, 0, 0, 5_000_000),
      spouseFederalLoanBalanceDollars: pickNumber(
        h.spouseFederalLoanBalanceDollars,
        0,
        0,
        5_000_000,
      ),
      dependentsClaimed: Math.trunc(pickNumber(h.dependentsClaimed, 0, 0, 20)),
      familySize: Math.trunc(pickNumber(h.familySize, example.household.familySize, 1, 20)),
      stateGroup: pickEnum(h.stateGroup, STATE_GROUPS, example.household.stateGroup),
    },
    goals: {
      pursuingPSLF: pickEnum(g.pursuingPSLF, PSLF_ANSWERS, example.goals.pursuingPSLF),
      priorQualifyingPayments: Math.trunc(pickNumber(g.priorQualifyingPayments, 0, 0, 360)),
      expectedAnnualIncomeGrowthPct: pickNumber(
        g.expectedAnnualIncomeGrowthPct,
        example.goals.expectedAnnualIncomeGrowthPct,
        0,
        15,
      ),
    },
  };
}

/**
 * Form values → ranked simulation, in one call. Synchronous and client-side:
 * there is no Calculate button and no spinner anywhere in this product.
 *
 * Returns `null` only when the loan mix genuinely has no available plan — the
 * one case the engine refuses to answer.
 */
export function simulateFromForm(raw: unknown, asOf?: Date): SimulationResult | null {
  const values = resolveFormValues(raw);
  try {
    const { loans, household, strategy } = toEngineInput(values);
    return simulateAllPlans(loans, household, strategy, asOf);
  } catch {
    return null;
  }
}

const toCents = (dollars: number): number => Math.round(dollars * 100);
const toBps = (pct: number): number => Math.round(pct * 100);

export function toEngineInput(values: FormValues): {
  loans: Loan[];
  household: Household;
  strategy: Strategy;
} {
  const loans: Loan[] = values.loans.map((l) => ({
    id: l.id,
    type: l.type,
    balance: toCents(l.balanceDollars),
    annualRateBps: toBps(l.ratePct),
    firstDisbursement: l.firstDisbursement,
    isConsolidation: l.isConsolidation || l.type === "DIRECT_CONSOLIDATION",
    underlyingHadParentPlus: l.underlyingHadParentPlus,
    repaidUnderIdrInWindow: l.repaidUnderIdrInWindow,
  }));

  const married =
    values.household.filingStatus === "MARRIED_JOINT" ||
    values.household.filingStatus === "MARRIED_SEPARATE";

  const household: Household = {
    agi: toCents(values.household.agiDollars),
    filingStatus: values.household.filingStatus,
    spouseAgi: married ? toCents(values.household.spouseAgiDollars) : undefined,
    spouseFederalLoanBalance: married
      ? toCents(values.household.spouseFederalLoanBalanceDollars)
      : undefined,
    dependentsClaimed: values.household.dependentsClaimed,
    familySize: values.household.familySize,
    stateGroup: values.household.stateGroup,
  };

  const strategy: Strategy = {
    pursuingPSLF:
      values.goals.pursuingPSLF === "YES"
        ? true
        : values.goals.pursuingPSLF === "NO"
          ? false
          : "UNSURE",
    priorQualifyingPayments: values.goals.priorQualifyingPayments,
    expectedAnnualIncomeGrowthPct: values.goals.expectedAnnualIncomeGrowthPct,
  };

  return { loans, household, strategy };
}
