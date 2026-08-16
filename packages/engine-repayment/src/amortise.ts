/**
 * packages/engine/src/amortise.ts
 *
 * The shared month-by-month simulation loop used by every plan.
 *
 * Interest model (Direct loans use simple daily interest; we model simple
 * monthly interest on principal): interest accrues on PRINCIPAL only.
 * Unpaid interest goes into a separate `unpaidInterest` bucket and does
 * not itself accrue interest (Direct loan interest does not compound
 * monthly). Under RAP the bucket is never used — unpaid interest is
 * WAIVED the month it accrues and the balance can never grow.
 *
 * Payment application order: outstanding unpaid interest → current month's
 * interest → principal. RAP's $50 principal match tops up the month's
 * principal reduction to min($50, payment).
 */

import type { Cents, MonthlyRow } from "./types";
import { assertCents, monthlyInterest, roundToCents } from "./money";

export interface YearMonth {
  year: number;
  month: number; // 1–12
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const zero = ym.year * 12 + (ym.month - 1) + n;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

export function ymToIso(ym: YearMonth): string {
  return `${ym.year.toString().padStart(4, "0")}-${ym.month.toString().padStart(2, "0")}-01`;
}

export function isoToYm(iso: string): YearMonth {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return { year, month };
}

/** Whole months from a (inclusive) until b (exclusive). Negative if b < a. */
export function monthsBetween(a: YearMonth, b: YearMonth): number {
  return b.year * 12 + (b.month - 1) - (a.year * 12 + (a.month - 1));
}

export interface AmortiseInput {
  startBalance: Cents;
  annualRateBps: number;
  /** First payment month. */
  start: YearMonth;
  /**
   * Required payment for 0-based payment index m. Recomputed by IDR plans
   * annually as income grows; constant for fixed plans.
   */
  paymentForMonth: (m: number) => Cents;
  /** RAP: unpaid interest is waived, never capitalised. */
  interestWaiver: boolean;
  /** RAP: government tops principal reduction up to min(this, payment). 0 = off. */
  principalMatchCents: Cents;
  /** Remaining balance is forgiven after this many payments. null = must amortise. */
  forgivenessAfterPayments: number | null;
  /** Hard stop safety net. */
  maxMonths?: number;
}

export interface AmortiseResult {
  schedule: MonthlyRow[];
  totalPaid: Cents;
  totalForgiven: Cents;
  monthsToResolution: number;
  /** ISO date of forgiveness, or null if paid in full (or never resolved). */
  forgivenessDate: string | null;
  paidInFull: boolean;
}

export function amortise(input: AmortiseInput): AmortiseResult {
  assertCents(input.startBalance, "startBalance");
  const maxMonths = input.maxMonths ?? 480;

  let principal = input.startBalance;
  let unpaidInterest = 0;
  let totalPaid = 0;
  const schedule: MonthlyRow[] = [];

  for (let m = 0; m < maxMonths; m++) {
    if (principal + unpaidInterest <= 0) break;

    const interest = monthlyInterest(principal, input.annualRateBps);
    const required = input.paymentForMonth(m);
    assertCents(required, "payment");

    // Never pay more than what would retire the loan this month.
    const payoff = principal + unpaidInterest + interest;
    const payment = Math.min(required, payoff);

    let interestPaid = 0;
    let interestWaived = 0;
    let principalPaid = 0;
    let match = 0;

    if (input.interestWaiver) {
      // RAP: payment covers as much of this month's interest as it can;
      // the shortfall is waived outright. Balance cannot grow.
      interestPaid = Math.min(payment, interest);
      interestWaived = interest - interestPaid;
      principalPaid = payment - interestPaid;
    } else {
      // Outstanding unpaid interest first, then current interest, then principal.
      const towardUnpaid = Math.min(payment, unpaidInterest);
      unpaidInterest -= towardUnpaid;
      const towardCurrent = Math.min(payment - towardUnpaid, interest);
      const shortfall = interest - towardCurrent;
      unpaidInterest += shortfall; // accrues, does not compound
      interestPaid = towardUnpaid + towardCurrent;
      principalPaid = payment - interestPaid;
    }

    principal -= principalPaid;

    if (input.principalMatchCents > 0) {
      // RAP $50 match: total principal reduction this month is at least
      // min($50, payment) on an on-time payment. The match is a government
      // contribution — it reduces the balance but is not borrower money.
      const targetReduction = Math.min(input.principalMatchCents, payment);
      match = Math.max(0, Math.min(targetReduction - principalPaid, principal));
      principal -= match;
    }

    totalPaid += payment;
    const paymentsMade = m + 1;
    const date = ymToIso(addMonths(input.start, m));

    schedule.push({
      month: paymentsMade,
      date,
      payment,
      interestAccrued: interest,
      interestPaid,
      interestWaived,
      principalPaid,
      principalMatch: match,
      endingBalance: principal + unpaidInterest,
    });

    if (principal + unpaidInterest <= 0) {
      return {
        schedule,
        totalPaid,
        totalForgiven: 0,
        monthsToResolution: paymentsMade,
        forgivenessDate: null,
        paidInFull: true,
      };
    }

    if (input.forgivenessAfterPayments !== null && paymentsMade >= input.forgivenessAfterPayments) {
      const forgiven = principal + unpaidInterest;
      return {
        schedule,
        totalPaid,
        totalForgiven: forgiven,
        monthsToResolution: paymentsMade,
        forgivenessDate: date,
        paidInFull: false,
      };
    }
  }

  // Safety net: ran out of months without resolution (should not happen for
  // well-formed plans — every plan either amortises or forgives).
  return {
    schedule,
    totalPaid,
    totalForgiven: 0,
    monthsToResolution: schedule.length,
    forgivenessDate: null,
    paidInFull: false,
  };
}

/** AGI grown by g% per whole year elapsed, rounded once per year. */
export function grownAgi(agi: Cents, growthPct: number, yearIndex: number): Cents {
  if (yearIndex <= 0 || growthPct === 0) return agi;
  return roundToCents(agi * Math.pow(1 + growthPct / 100, yearIndex));
}
