/**
 * PAYE — 10% of discretionary income, 240-payment forgiveness, capped at
 * the 10-year Standard amount. SUNSETS 1 Jul 2028 under P.L. 119-21.
 *
 * Any simulation crossing that date models the forced migration. The
 * destination is NOT New IBR: 34 C.F.R. § 685.209(c)(7)(iii)(A) places a
 * non-electing borrower in RAP for RAP-eligible loans and in IBR only for
 * loans RAP will not take. See plans/sunset.ts, which owns that routing and
 * the asymmetric payment-credit rules that go with it. The engine never
 * silently projects PAYE past the sunset.
 *
 * Parameters from rules/plan-terms.2026-07-01.json.
 */

import type { PlanResult } from "../types";
import { checkPaye } from "../eligibility";
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

export function simulatePaye(ctx: SimContext): PlanResult {
  const check = checkPaye(ctx.loans, ctx.rules, ctx.asOfIso);
  if (!check.eligible) return ineligibleResult("PAYE", check.reasons);

  const terms = ctx.rules.planTerms.paye;
  const proration = spouseProrationFactor(ctx);
  const target = forgivenessTarget(ctx, terms.forgivenessAfterPayments);
  const migrationAtMonth = Math.max(0, monthsUntil(ctx, terms.sunsetDate));

  const payePayment = (m: number) => {
    const idr = idrMonthlyPayment(
      agiForYear(ctx, Math.floor(m / 12)),
      ctx.household,
      ctx.rules.poverty,
      terms.povertyMultiplierPct,
      terms.discretionaryPct,
      proration,
    );
    return terms.paymentCappedAtStandard ? Math.min(idr, ctx.standardCapMonthly) : idr;
  };

  const migration = sunsetMigration(ctx, "PAYE", target.isPslfTrack ? target.payments : null);

  return runPlanTwoPhase({
    ctx,
    planId: "PAYE",
    paymentForMonth: payePayment,
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
