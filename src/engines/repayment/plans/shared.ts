/**
 * packages/engine/src/plans/shared.ts
 *
 * Machinery shared by all nine plan modules: the simulation context,
 * household-income helpers, the IDR payment formula, and the runners that
 * turn a payment function into a full PlanResult.
 *
 * Documented v1 modelling simplifications (see /methodology and
 * VERIFICATION-NEEDED.md):
 *  - Loans are aggregated to one balance at a balance-weighted average
 *    rate (integer bps). Real servicers amortise per-loan; the difference
 *    is small relative to plan-level divergence.
 *  - A plan is eligible only if EVERY entered loan is eligible for it
 *    (all-or-nothing). Real borrowers may split plans per loan.
 *  - Poverty guidelines are held constant over the projection
 *    (conservative: payments rise faster than if the FPL grew).
 *  - At a forced plan migration (PAYE/ICR sunset), outstanding unpaid
 *    interest is treated as capitalised into principal — consistent with
 *    historical plan-exit capitalisation. This is an exit event from the
 *    ORIGIN plan; where the destination is RAP, the waiver then applies from
 *    the first RAP month on and the balance cannot grow after that. The RISE
 *    rule does not state whether the 2028 migration capitalises; this is an
 *    unverified assumption, recorded in VERIFICATION-NEEDED.md.
 */

import type { Cents, Household, Loan, PlanId, PlanResult, Strategy } from "../types";
import type { PovertyGuidelineRules, ResolvedRules } from "../rules/index";
import { levelPayment, percentOf, roundToCents } from "../money";
import {
  addMonths,
  amortise,
  grownAgi,
  monthsBetween,
  type YearMonth,
} from "../amortise";
import { estimateTaxOnForgiveness } from "../tax";

export interface SimContext {
  loans: Loan[];
  household: Household;
  strategy: Strategy;
  rules: ResolvedRules;
  /** First simulated payment month (the month after asOf). */
  start: YearMonth;
  asOfIso: string;
  aggregate: { balance: Cents; weightedRateBps: number };
  /** strategy.pursuingPSLF === true. 'UNSURE' simulates as false. */
  pursuingPSLF: boolean;
  /** 10-year Standard payment on the entry balance — the IBR/PAYE cap. */
  standardCapMonthly: Cents;
}

/** AGI used for payment formulas: joint income when filing jointly. */
export function householdAgi(household: Household): Cents {
  if (household.filingStatus === "MARRIED_JOINT") {
    return household.agi + (household.spouseAgi ?? 0);
  }
  return household.agi;
}

/**
 * When filing jointly and the spouse also has federal loans, the payment is
 * prorated by the borrower's share of the couple's combined federal debt
 * (34 C.F.R. § 685.209). Returns a float factor in (0, 1]; apply it once,
 * then round once.
 */
export function spouseProrationFactor(ctx: SimContext): number {
  const { household, aggregate } = ctx;
  const spouseBal = household.spouseFederalLoanBalance ?? 0;
  if (household.filingStatus !== "MARRIED_JOINT" || spouseBal <= 0 || aggregate.balance <= 0) {
    return 1;
  }
  return aggregate.balance / (aggregate.balance + spouseBal);
}

/** Poverty guideline for a family size, in cents. */
export function fplCents(
  poverty: PovertyGuidelineRules,
  stateGroup: Household["stateGroup"],
  familySize: number,
): Cents {
  const g = poverty.guidelines[stateGroup];
  const extra = Math.max(0, Math.floor(familySize) - 1);
  return g.firstPersonCents + g.additionalPersonCents * extra;
}

/**
 * Generic IDR monthly payment:
 *   max(0, (AGI − povertyMultiplier% × FPL) × discretionaryPct% ÷ 12)
 * Rounded once at the end.
 */
export function idrMonthlyPayment(
  agi: Cents,
  household: Household,
  poverty: PovertyGuidelineRules,
  povertyMultiplierPct: number,
  discretionaryPct: number,
  prorationFactor = 1,
): Cents {
  const fpl = fplCents(poverty, household.stateGroup, household.familySize);
  const protectedIncome = percentOf(fpl, povertyMultiplierPct);
  const discretionary = Math.max(0, agi - protectedIncome);
  return roundToCents(((discretionary * discretionaryPct) / 100 / 12) * prorationFactor);
}

export function ineligibleResult(planId: PlanId, reasons: string[]): PlanResult {
  return {
    planId,
    eligible: false,
    ineligibilityReasons: reasons,
    firstMonthlyPayment: 0,
    schedule: [],
    monthsToResolution: 0,
    totalPaid: 0,
    totalForgiven: 0,
    estimatedTaxOnForgiveness: 0,
    totalLifetimeCost: 0,
    forgivenessDate: null,
    warnings: [],
  };
}

export interface RunPlanOptions {
  ctx: SimContext;
  planId: PlanId;
  /** Required payment for 0-based payment index m. */
  paymentForMonth: (m: number) => Cents;
  interestWaiver?: boolean;
  principalMatchCents?: Cents;
  /** Payments until forgiveness (already net of prior qualifying payments), or null. */
  forgivenessAfterPayments: number | null;
  /** Whether forgiveness under this scenario is PSLF (tax-free). */
  isPslfTrack: boolean;
}

/** Run a plan to a full PlanResult. */
export function runPlan(opts: RunPlanOptions): PlanResult {
  const { ctx, planId } = opts;
  const result = amortise({
    startBalance: ctx.aggregate.balance,
    annualRateBps: ctx.aggregate.weightedRateBps,
    start: ctx.start,
    paymentForMonth: opts.paymentForMonth,
    interestWaiver: opts.interestWaiver ?? false,
    principalMatchCents: opts.principalMatchCents ?? 0,
    forgivenessAfterPayments: opts.forgivenessAfterPayments,
  });
  const tax = estimateTaxOnForgiveness(result.totalForgiven, opts.isPslfTrack, ctx.rules.tax);
  return {
    planId,
    eligible: true,
    ineligibilityReasons: [],
    firstMonthlyPayment: result.schedule[0]?.payment ?? opts.paymentForMonth(0),
    schedule: result.schedule,
    monthsToResolution: result.monthsToResolution,
    totalPaid: result.totalPaid,
    totalForgiven: result.totalForgiven,
    estimatedTaxOnForgiveness: tax,
    totalLifetimeCost: result.totalPaid + tax,
    forgivenessDate: result.forgivenessDate,
    warnings: [],
  };
}

export interface TwoPhaseOptions extends RunPlanOptions {
  /** Global month index (0-based) at which the forced migration happens. */
  migrationAtMonth: number;
  /**
   * Payment function after migration. Receives the GLOBAL month index and
   * the principal balance at migration (unpaid interest capitalised).
   */
  migratedPaymentForMonth: (m: number, balanceAtMigration: Cents) => Cents;
  /**
   * The DESTINATION plan's own forgiveness clock, in total payments, or null
   * if the destination forgives nothing. This is not the origin plan's clock:
   * a PAYE borrower moved to RAP is on RAP's 360, not PAYE's 240.
   */
  migratedForgivenessAfterPayments: number | null;
  /**
   * Whether payments made in phase A count toward the destination's clock.
   * Asymmetric by regulation — see `idrCreditCarries` in plans/sunset.ts.
   * When false, the destination's clock starts from zero at migration.
   */
  phaseACreditCarries: boolean;
  /** RAP destination: unpaid interest is waived from the migration month on. */
  migratedInterestWaiver?: boolean;
  /** RAP destination: the $50 principal match applies after migration. */
  migratedPrincipalMatchCents?: Cents;
}

/**
 * Run a plan that is forced to migrate mid-schedule (PAYE/ICR sunset).
 * Phase A runs the origin plan's formula until the migration month; phase B
 * runs the destination plan's formula, mechanics, and forgiveness clock.
 *
 * Payment credit does NOT simply carry. Phase-A payments reduce the
 * destination's clock only when `phaseACreditCarries` says the regulation
 * lets them — see § 685.209(k)(4)(i)(A) and (k)(8)(i)(C)(5), encoded in
 * `idrCreditCarries`.
 */
export function runPlanTwoPhase(opts: TwoPhaseOptions): PlanResult {
  const { ctx, planId } = opts;

  const phaseA = amortise({
    startBalance: ctx.aggregate.balance,
    annualRateBps: ctx.aggregate.weightedRateBps,
    start: ctx.start,
    paymentForMonth: opts.paymentForMonth,
    interestWaiver: opts.interestWaiver ?? false,
    principalMatchCents: opts.principalMatchCents ?? 0,
    forgivenessAfterPayments: opts.forgivenessAfterPayments,
    maxMonths: opts.migrationAtMonth,
  });

  const paymentsA = phaseA.schedule.length;
  const resolvedInA =
    phaseA.paidInFull ||
    phaseA.totalForgiven > 0 ||
    (opts.forgivenessAfterPayments !== null && paymentsA >= opts.forgivenessAfterPayments);

  const taxA = estimateTaxOnForgiveness(phaseA.totalForgiven, opts.isPslfTrack, ctx.rules.tax);

  if (resolvedInA) {
    return {
      planId,
      eligible: true,
      ineligibilityReasons: [],
      firstMonthlyPayment: phaseA.schedule[0]?.payment ?? opts.paymentForMonth(0),
      schedule: phaseA.schedule,
      monthsToResolution: phaseA.monthsToResolution,
      totalPaid: phaseA.totalPaid,
      totalForgiven: phaseA.totalForgiven,
      estimatedTaxOnForgiveness: taxA,
      totalLifetimeCost: phaseA.totalPaid + taxA,
      forgivenessDate: phaseA.forgivenessDate,
      warnings: [],
    };
  }

  // Migration: outstanding unpaid interest capitalises into principal.
  const balanceAtMigration =
    phaseA.schedule[phaseA.schedule.length - 1]?.endingBalance ?? ctx.aggregate.balance;

  // Phase B runs the destination's clock, credited with phase-A payments only
  // where the regulation lets that credit carry.
  const carried = opts.phaseACreditCarries ? paymentsA : 0;
  const phaseBForgivenessAfterPayments =
    opts.migratedForgivenessAfterPayments === null
      ? null
      : Math.max(1, opts.migratedForgivenessAfterPayments - carried);

  const phaseB = amortise({
    startBalance: balanceAtMigration,
    annualRateBps: ctx.aggregate.weightedRateBps,
    start: addMonths(ctx.start, paymentsA),
    paymentForMonth: (m) => opts.migratedPaymentForMonth(m + paymentsA, balanceAtMigration),
    interestWaiver: opts.migratedInterestWaiver ?? false,
    principalMatchCents: opts.migratedPrincipalMatchCents ?? 0,
    forgivenessAfterPayments: phaseBForgivenessAfterPayments,
  });

  const schedule = [
    ...phaseA.schedule,
    ...phaseB.schedule.map((row) => ({ ...row, month: row.month + paymentsA })),
  ];
  const totalPaid = phaseA.totalPaid + phaseB.totalPaid;
  const tax = estimateTaxOnForgiveness(phaseB.totalForgiven, opts.isPslfTrack, ctx.rules.tax);

  return {
    planId,
    eligible: true,
    ineligibilityReasons: [],
    firstMonthlyPayment: schedule[0]?.payment ?? opts.paymentForMonth(0),
    schedule,
    monthsToResolution: paymentsA + phaseB.monthsToResolution,
    totalPaid,
    totalForgiven: phaseB.totalForgiven,
    estimatedTaxOnForgiveness: tax,
    totalLifetimeCost: totalPaid + tax,
    forgivenessDate: phaseB.forgivenessDate,
    warnings: [],
  };
}

/** Months from the simulation start until an ISO date (first of month). */
export function monthsUntil(ctx: SimContext, iso: string): number {
  return monthsBetween(ctx.start, {
    year: Number(iso.slice(0, 4)),
    month: Number(iso.slice(5, 7)),
  });
}

/** IDR forgiveness clock net of prior qualifying payments (min 1 payment). */
export function forgivenessTarget(
  ctx: SimContext,
  planForgivenessPayments: number,
): { payments: number; isPslfTrack: boolean } {
  const prior = Math.max(0, Math.floor(ctx.strategy.priorQualifyingPayments));
  if (ctx.pursuingPSLF) {
    return {
      payments: Math.max(1, ctx.rules.planTerms.pslfPayments - prior),
      isPslfTrack: true,
    };
  }
  return { payments: Math.max(1, planForgivenessPayments - prior), isPslfTrack: false };
}

/** AGI in payment-year `yearIndex`, grown by the strategy's growth rate. */
export function agiForYear(ctx: SimContext, yearIndex: number): Cents {
  return grownAgi(
    householdAgi(ctx.household),
    ctx.strategy.expectedAnnualIncomeGrowthPct,
    yearIndex,
  );
}

/** The 10-year Standard payment used as the IBR/PAYE cap. */
export function standardCap(balance: Cents, rateBps: number, termMonths: number): Cents {
  return levelPayment(balance, rateBps, termMonths);
}
