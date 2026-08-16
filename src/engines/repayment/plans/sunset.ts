/**
 * packages/engine/src/plans/sunset.ts
 *
 * The 1 Jul 2028 PAYE/ICR sunset: where a non-electing borrower is placed,
 * what they pay there, and which payment credit survives the move.
 *
 * Authority: 34 C.F.R. § 685.209 as revised by the RISE final rule,
 * 91 Fed. Reg. 23768 (published 1 May 2026, FR Doc. 2026-08556). Full GPO
 * text: https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm
 *
 * Two rules are easy to get wrong and are both encoded here.
 *
 * 1. THE DESTINATION. § 685.209(c)(7)(iii)(A) places the borrower in "(1) the
 *    Repayment Assistance Plan for Direct Loans eligible for [it]; or (2) the
 *    income-based repayment plan for loans not eligible for" RAP. RAP first,
 *    IBR second. It is NOT "PAYE goes to New IBR, ICR goes to Old IBR" — that
 *    was this engine's earlier model and it was wrong for both plans. The
 *    difference is large: RAP is a 360-payment clock with an interest waiver
 *    and a $50 principal match, where IBR is 240 or 300 with neither.
 *
 * 2. THE CREDIT. Credit does not flow flatly in both directions:
 *      - § 685.209(k)(4)(i)(A): credit toward IBR/PAYE/ICR forgiveness comes
 *        from payments made under an IDR plan "except the Repayment
 *        Assistance Plan". RAP payments therefore never count toward IBR.
 *      - § 685.209(k)(8)(i)(C)(5): payments made before 1 Jul 2028 under an
 *        income-contingent plan count toward RAP's 360 only where each was
 *        "not less than the monthly payment required under the applicable
 *        plan".
 *    So IDR→RAP credit is conditional and RAP→IBR credit is nil. Modelling a
 *    single flat carry in either direction gets one of them wrong.
 */

import type { Cents, PlanId } from "../types";
import { levelPayment } from "../money";
import { sunsetDestination } from "../eligibility";
import { rapMonthlyPayment } from "./rap";
import {
  agiForYear,
  idrMonthlyPayment,
  spouseProrationFactor,
  type SimContext,
} from "./shared";

/** The income-driven plans other than RAP — the ones that earn IBR credit. */
const IDR_EXCEPT_RAP: readonly PlanId[] = ["IBR_OLD", "IBR_NEW", "PAYE", "ICR"] as const;

/**
 * Does forgiveness credit earned under `from` count toward `to`'s clock?
 *
 * `paymentsMetRequiredAmount` is the § 685.209(k)(8)(i)(C)(5) condition: it
 * only matters when moving INTO RAP, where a payment counts only if it was at
 * least the amount the origin plan required.
 *
 * KNOWN-GAP GAP-035 — regulatory ambiguity, not a bug. This function credits
 * pre-sunset payments the engine SIMULATES (they satisfy (k)(8)(i)(C)(5) by
 * construction — see SIMULATED_PAYMENTS_MEET_REQUIRED_AMOUNT). It deliberately
 * does NOT credit `Strategy.priorQualifyingPayments`, whose per-month amounts
 * the engine cannot know. Whether a VOLUNTARY election to RAP should carry the
 * same credit as the forced 2028 migration is not settled either way by the
 * retrieved regulation text. Current behaviour stays as-is: prior IBR/PAYE/ICR
 * credit is forfeited on a voluntary switch, per the CLAUDE.md one-way-door
 * invariant, and the engine warns hard about it. Do not "fix" this without a
 * second primary source. See /KNOWN-GAPS.md.
 */
export function idrCreditCarries(
  from: PlanId,
  to: PlanId,
  paymentsMetRequiredAmount: boolean,
): boolean {
  if (from === to) return true;

  if (to === "RAP") {
    // (k)(8)(i)(C)(5): pre-2028 income-contingent payments carry, but only at
    // or above the required amount. Fixed plans earn no income-driven credit.
    return IDR_EXCEPT_RAP.includes(from) && paymentsMetRequiredAmount;
  }

  if (IDR_EXCEPT_RAP.includes(to)) {
    // (k)(4)(i)(A): "an IDR plan except the Repayment Assistance Plan".
    // This is the asymmetric half — RAP credit dies at the door.
    return from !== "RAP" && IDR_EXCEPT_RAP.includes(from);
  }

  // Standard, Graduated, Extended and the Tiered Standard forgive nothing,
  // so there is no clock for credit to land on.
  return false;
}

/**
 * Every simulated payment IS the amount the plan required that month — the
 * engine models required payments only, never a delinquent or partial one.
 * The § 685.209(k)(8)(i)(C)(5) condition is therefore satisfied for every
 * pre-sunset month the engine generates.
 *
 * A borrower who actually underpaid would lose that month's RAP credit. The
 * engine has no input for payment history at that granularity, so it assumes
 * a compliant borrower and says so here rather than silently.
 *
 * Note the deliberate asymmetry with `Strategy.priorQualifyingPayments`, which
 * is NOT credited toward RAP at a migration. Those payments were made before
 * the simulation window and the engine knows only their count, never their
 * amounts, so the (k)(8)(i)(C)(5) condition cannot be shown to hold for them.
 * `plans/rap.ts` forfeits them for the same reason, and CLAUDE.md's one-way
 * door treats that forfeiture as a product invariant.
 */
export const SIMULATED_PAYMENTS_MEET_REQUIRED_AMOUNT = true;

export interface SunsetMigration {
  /** Where § 685.209(c)(7)(iii)(A) puts this borrower. */
  destination: PlanId;
  /** Payment under the destination, by GLOBAL month index. */
  paymentForMonth: (m: number, balanceAtMigration: Cents) => Cents;
  /** The destination plan's own forgiveness clock, or null. */
  forgivenessAfterPayments: number | null;
  /** Do the origin plan's pre-sunset payments count toward that clock? */
  creditCarries: boolean;
  /** RAP destination only. */
  interestWaiver: boolean;
  principalMatchCents: Cents;
}

/**
 * Resolve the forced migration for a borrower leaving `origin` at the sunset.
 *
 * `pslfTargetPayments` is passed when the borrower is on the PSLF track: PSLF
 * is a 120-payment clock that runs across plans (§ 685.219(e)(1) counts
 * qualifying payments under any qualifying plan), so it overrides the
 * destination's own forgiveness count and its credit always carries.
 */
export function sunsetMigration(
  ctx: SimContext,
  origin: PlanId,
  pslfTargetPayments: number | null,
): SunsetMigration {
  const destination = sunsetDestination(ctx.loans, ctx.rules);
  const proration = spouseProrationFactor(ctx);
  const planTerms = ctx.rules.planTerms;

  const idrFor = (m: number, povertyMultiplierPct: number, discretionaryPct: number): Cents =>
    idrMonthlyPayment(
      agiForYear(ctx, Math.floor(m / 12)),
      ctx.household,
      ctx.rules.poverty,
      povertyMultiplierPct,
      discretionaryPct,
      proration,
    );

  const base = ((): Omit<SunsetMigration, "creditCarries" | "destination"> => {
    switch (destination) {
      case "RAP": {
        const rap = ctx.rules.rap;
        return {
          // RAP has no cap at the 10-year Standard amount — that asymmetry
          // with IBR/PAYE survives the migration intact.
          paymentForMonth: (m) =>
            rapMonthlyPayment(
              agiForYear(ctx, Math.floor(m / 12)),
              ctx.household.dependentsClaimed,
              rap,
              proration,
            ),
          forgivenessAfterPayments: rap.forgivenessAfterPayments,
          interestWaiver: rap.interestWaiver,
          principalMatchCents: rap.principalMatchCents,
        };
      }
      case "IBR_NEW":
      case "IBR_OLD": {
        const terms = destination === "IBR_NEW" ? planTerms.ibrNew : planTerms.ibrOld;
        return {
          paymentForMonth: (m) => {
            const idr = idrFor(m, terms.povertyMultiplierPct, terms.discretionaryPct);
            return terms.paymentCappedAtStandard ? Math.min(idr, ctx.standardCapMonthly) : idr;
          },
          forgivenessAfterPayments: terms.forgivenessAfterPayments,
          interestWaiver: false,
          principalMatchCents: 0,
        };
      }
      default: {
        // Residual: eligible for neither RAP nor IBR. A Standard amortisation
        // of the balance as it stands at migration. See sunsetDestination().
        const months = planTerms.standard10.termMonths;
        return {
          paymentForMonth: (_m, balanceAtMigration) =>
            levelPayment(balanceAtMigration, ctx.aggregate.weightedRateBps, months),
          forgivenessAfterPayments: null,
          interestWaiver: false,
          principalMatchCents: 0,
        };
      }
    }
  })();

  if (pslfTargetPayments !== null) {
    // PSLF overrides the destination's clock and carries in full.
    return {
      destination,
      ...base,
      forgivenessAfterPayments: pslfTargetPayments,
      creditCarries: true,
    };
  }

  return {
    destination,
    ...base,
    creditCarries: idrCreditCarries(
      origin,
      destination,
      SIMULATED_PAYMENTS_MEET_REQUIRED_AMOUNT,
    ),
  };
}
