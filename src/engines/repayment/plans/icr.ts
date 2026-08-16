/**
 * ICR — the lesser of 20% of discretionary income (AGI − 100% FPL) or a
 * 12-year fixed amortisation (income-percentage-factor simplified to 1.0
 * — a documented v1 simplification, see VERIFICATION-NEEDED.md).
 * Forgiveness at 300 payments. SUNSETS 1 Jul 2028.
 *
 * The destination is NOT Old IBR: 34 C.F.R. § 685.209(c)(7)(iii)(A) places a
 * non-electing borrower in RAP for RAP-eligible loans and in IBR only for
 * loans RAP will not take. A Parent PLUS consolidation outside the
 * § 685.209(b)(6)(ii) carve-out is eligible for neither and falls back to a
 * Standard amortisation of the remaining balance. See plans/sunset.ts.
 *
 * Parameters from rules/plan-terms.2026-07-01.json.
 */

import type { PlanResult } from "../types";
import { levelPayment } from "../money";
import { checkIcr } from "../eligibility";
import {
  agiForYear,
  forgivenessTarget,
  idrMonthlyPayment,
  ineligibleResult,
  monthsUntil,
  runPlanTwoPhase,
  spouseProrationFactor,
  type SimContext,
} from "./shared";
import { sunsetMigration } from "./sunset";

export function simulateIcr(ctx: SimContext): PlanResult {
  const check = checkIcr(ctx.loans, ctx.rules, ctx.asOfIso);
  if (!check.eligible) return ineligibleResult("ICR", check.reasons);

  const terms = ctx.rules.planTerms.icr;
  const proration = spouseProrationFactor(ctx);
  const target = forgivenessTarget(ctx, terms.forgivenessAfterPayments);
  const migrationAtMonth = Math.max(0, monthsUntil(ctx, terms.sunsetDate));

  // The 12-year alternative is fixed at plan entry.
  //
  // KNOWN-GAP GAP-034: the ICR income-percentage factor is hardcoded to 1.0 —
  // i.e. it is absent from this expression entirely. 34 C.F.R.
  // § 685.209(f)(4)(i)(A) requires the 12-year amount to be multiplied by "a
  // percentage based on the borrower's income as established by the Secretary
  // in a Federal Register notice published annually". That notice is a separate
  // document from the RISE final rule and could not be located, so 1.0 remains
  // an unverified simplification that UNDERSTATES ICR payments for higher
  // incomes and therefore ranks ICR better than it should. This is the one
  // figure in plan-terms.2026-07-01.json needing a yearly re-check.
  // See /KNOWN-GAPS.md.
  const alternative = levelPayment(
    ctx.aggregate.balance,
    ctx.aggregate.weightedRateBps,
    terms.alternativeAmortisationMonths,
  );

  const icrPayment = (m: number) => {
    const idr = idrMonthlyPayment(
      agiForYear(ctx, Math.floor(m / 12)),
      ctx.household,
      ctx.rules.poverty,
      terms.povertyMultiplierPct,
      terms.discretionaryPct,
      proration,
    );
    return Math.min(idr, alternative);
  };

  const migration = sunsetMigration(ctx, "ICR", target.isPslfTrack ? target.payments : null);

  return runPlanTwoPhase({
    ctx,
    planId: "ICR",
    paymentForMonth: icrPayment,
    forgivenessAfterPayments: target.payments,
    isPslfTrack: target.isPslfTrack,
    migrationAtMonth,
    migratedPaymentForMonth: migration.paymentForMonth,
    migratedForgivenessAfterPayments: migration.forgivenessAfterPayments,
    phaseACreditCarries: migration.creditCarries,
    migratedInterestWaiver: migration.interestWaiver,
    migratedPrincipalMatchCents: migration.principalMatchCents,
  });
}
