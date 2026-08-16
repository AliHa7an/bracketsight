/**
 * packages/engine/src/warnings.ts
 *
 * The seven warnings (spec §1.5), plus the RAP extra-payment backfire
 * notice. Warnings are derived deterministically from inputs and computed
 * results. Severity discipline: IRREVERSIBLE is reserved for one-way
 * decisions only — the UI renders it in oxide red and nothing else may.
 * Copy is concrete: state the number, the date, and the consequence.
 */

import type {
  Cents,
  Household,
  Loan,
  PlanId,
  PlanResult,
  Strategy,
  Warning,
} from "./types";
import type { ResolvedRules } from "./rules/index";
import {
  anyLoanOnOrAfter,
  hasLegacyLoans,
  hasParentPlusExposure,
  sunsetDestination,
  taintExceptionApplies,
} from "./eligibility";
import { PLAN_NAMES } from "./plan-names";

/** Whole dollars for warning copy (round half away from zero). */
function usd(cents: Cents): string {
  const dollars = Math.round(Math.abs(cents) / 100);
  return `${cents < 0 ? "-" : ""}$${dollars.toLocaleString("en-US")}`;
}

export interface DerivedWarnings {
  global: Warning[];
  perPlan: Partial<Record<PlanId, Warning[]>>;
}

export function deriveWarnings(
  loans: Loan[],
  household: Household,
  strategy: Strategy,
  rules: ResolvedRules,
  results: Map<PlanId, PlanResult>,
): DerivedWarnings {
  const global: Warning[] = [];
  const perPlan: Partial<Record<PlanId, Warning[]>> = {};
  const attach = (planId: PlanId, w: Warning) => {
    (perPlan[planId] ??= []).push(w);
  };

  const rap = results.get("RAP");
  const standard = results.get("STANDARD_10");
  const prior = Math.max(0, Math.floor(strategy.priorQualifyingPayments));
  const pursuingPSLF = strategy.pursuingPSLF === true;

  // 1. RAP one-way door — the only IRREVERSIBLE severity in the engine.
  if (rap?.eligible && prior > 0 && !pursuingPSLF) {
    const w: Warning = {
      id: "RAP_ONE_WAY_DOOR",
      severity: "IRREVERSIBLE",
      planId: "RAP",
      message: `Switching to RAP forfeits your ${prior} qualifying payment${prior === 1 ? "" : "s"} toward IBR/PAYE/ICR forgiveness. This cannot be undone.`,
    };
    global.push(w);
    attach("RAP", w);
  }

  // 2. Parent PLUS is ineligible for RAP even after consolidation — unless the
  //    § 685.209(b)(6)(ii) carve-out rescued the consolidation, in which case
  //    the fact still matters but the conclusion is the opposite one.
  if (hasParentPlusExposure(loans)) {
    const rescued = loans.filter((l) => taintExceptionApplies(l, rules));
    if (rescued.length > 0 && rap?.eligible) {
      global.push({
        id: "PARENT_PLUS_CONSOLIDATION_RAP_EXCEPTION",
        severity: "CAUTION",
        message:
          "Your consolidation repaid a Parent PLUS loan, which normally shuts RAP for good. It stays open only because you told us the loan was being repaid under ICR, PAYE, or IBR at some point between 4 Jul 2025 and 30 Jun 2028. Your servicer will check that. It does not open IBR or PAYE — those stay closed to any Parent PLUS consolidation.",
      });
    } else {
      global.push({
        id: "PARENT_PLUS_RAP_INELIGIBLE",
        severity: "CAUTION",
        message:
          "Parent PLUS loans cannot use RAP — even after consolidation. A consolidation that repaid any Parent PLUS loan is permanently ineligible. ICR (until 1 Jul 2028) is the only income-driven option for a consolidated Parent PLUS loan.",
      });
    }
  }

  // 3. RAP is uncapped: it can exceed the 10-year Standard payment.
  if (rap?.eligible && standard?.eligible) {
    const rapHigherMonthly = rap.firstMonthlyPayment > standard.firstMonthlyPayment;
    const rapHigherTotal = rap.totalLifetimeCost > standard.totalLifetimeCost;
    if (rapHigherMonthly || rapHigherTotal) {
      const w: Warning = {
        id: "RAP_EXCEEDS_STANDARD",
        severity: "CAUTION",
        planId: "RAP",
        message: rapHigherMonthly
          ? `RAP has no payment cap. At your income, RAP starts at ${usd(rap.firstMonthlyPayment)}/month — more than the ${usd(standard.firstMonthlyPayment)}/month 10-year Standard payment.`
          : `RAP has no payment cap. At your income it costs ${usd(rap.totalLifetimeCost - standard.totalLifetimeCost)} more over the life of your loans than the 10-year Standard plan.`,
      };
      global.push(w);
      attach("RAP", w);
    }
  }

  // 4. Loans disbursed on/after 1 Jul 2026 restrict plan choice.
  if (anyLoanOnOrAfter(loans, rules.planTerms.post2026RestrictionDate)) {
    global.push({
      id: "POST_2026_LOANS_RESTRICTED",
      severity: "CAUTION",
      message:
        "At least one of your loans was first disbursed on or after 1 Jul 2026. Under P.L. 119-21, those loans can only use RAP or the Tiered Standard plan — and taking any new federal loan after that date restricts your plan choice.",
    });
  }

  // 5. FFEL / Perkins / HEAL exclusions.
  if (hasLegacyLoans(loans)) {
    global.push({
      id: "FFEL_PERKINS_HEAL_EXCLUDED",
      severity: "CAUTION",
      message:
        "FFEL, Perkins, and HEAL loans cannot use RAP or the Tiered Standard plan. Consolidating into a Direct Consolidation Loan may open more plans — but consolidation is permanent and can change your interest rate and forgiveness credit.",
    });
  }

  // 6. PAYE and ICR sunset 1 Jul 2028 — the schedule models the migration.
  //    § 685.209(c)(7)(iii)(A) sends a non-electing borrower to RAP where
  //    their loans qualify and to IBR where they do not, so name the plan this
  //    borrower actually lands on rather than a generic one.
  const destination = sunsetDestination(loans, rules);
  const destinationName =
    destination === "STANDARD_10"
      ? "a Standard 10-year schedule, because your loans qualify for neither RAP nor IBR"
      : PLAN_NAMES[destination];
  for (const planId of ["PAYE", "ICR"] as const) {
    const result = results.get(planId);
    if (!result?.eligible) continue;
    const sunset = rules.planTerms.paye.sunsetDate;
    const crossesSunset = result.schedule.some((row) => row.date >= sunset);
    if (crossesSunset) {
      const w: Warning = {
        id: "PAYE_ICR_SUNSET",
        severity: "CAUTION",
        planId,
        message: `${planId} ends on 1 Jul 2028 under P.L. 119-21. If you do not choose a plan by then you are placed on ${destinationName}, and this projection models that move. ${destination === "RAP" ? "RAP restarts the forgiveness clock at 360 payments; the payments you make before the move count toward it, but nothing you paid before this projection begins does." : "You will have to change plans again."}`,
      };
      global.push(w);
      attach(planId, w);
    }
  }

  // 7. Non-PSLF forgiveness is taxable under current law.
  const taxedPlans = [...results.values()].filter(
    (r) => r.eligible && r.totalForgiven > 0 && r.estimatedTaxOnForgiveness > 0,
  );
  if (taxedPlans.length > 0) {
    const largest = taxedPlans.reduce((a, b) =>
      b.estimatedTaxOnForgiveness > a.estimatedTaxOnForgiveness ? b : a,
    );
    global.push({
      id: "FORGIVENESS_TAXABLE",
      severity: "CAUTION",
      message: `Forgiven balances outside PSLF are taxable income under current federal law. Estimated tax at forgiveness: up to ${usd(largest.estimatedTaxOnForgiveness)} (at an assumed ${rules.tax.assumedMarginalRatePct}% marginal rate — an estimate, not tax advice). State treatment varies.`,
    });
    for (const r of taxedPlans) {
      attach(r.planId, {
        id: "FORGIVENESS_TAXABLE",
        severity: "CAUTION",
        planId: r.planId,
        message: `Forgiveness of ${usd(r.totalForgiven)} under this plan is taxable under current law — estimated ${usd(r.estimatedTaxOnForgiveness)} at an assumed ${rules.tax.assumedMarginalRatePct}% marginal rate.`,
      });
    }
  }

  // 8. RAP extra-payment backfire (INFO — modelled behaviour, not a decision).
  if (rap?.eligible) {
    attach("RAP", {
      id: "RAP_EXTRA_PAYMENT_BACKFIRE",
      severity: "INFO",
      planId: "RAP",
      message:
        "Paying extra on RAP can backfire. Amounts above the required payment are applied to interest first, which can cancel the interest waiver and the $50 principal match for that month. If you want to pay loans down faster, compare a Standard plan first.",
    });
  }

  return { global, perPlan };
}
