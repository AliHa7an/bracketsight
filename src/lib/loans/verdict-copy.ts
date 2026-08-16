/**
 * M8 — copy that reacts.
 *
 * The headline sentence is generated from the computed result, not written in
 * advance: "New IBR costs you $28,404 less than RAP over the life of your
 * loans." It rewrites as inputs change, which is what makes a page read as
 * authored for this reader.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO LLM IN THIS PATH. Deterministic templates only.
 *
 * CLAUDE.md invariant 1 (no AI in the calculation path) and invariant 5 (no
 * unvalidated numbers in generated text). Every figure below is either a field
 * read straight off `SimulationResult`, or an exact integer-cent subtraction of
 * two such fields. Nothing here estimates, rounds early, or infers. If a
 * sentence needs a number this file cannot source from the engine, the
 * sentence does not get written.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every function is pure and total: it returns `null` rather than a hedged
 * sentence when the situation does not support one. Callers render nothing.
 */

import type { PlanId, PlanResult, SimulationResult } from "@/engines/repayment";
import { PLAN_NAMES } from "@/engines/repayment";
import { durationLabel, monthLabel, usd } from "@/components/ui/format";

/* ------------------------------------------------------------------ helpers */

function planName(planId: PlanId): string {
  return PLAN_NAMES[planId];
}

function findPlan(result: SimulationResult, planId: PlanId): PlanResult | null {
  return result.plans.find((p) => p.planId === planId) ?? null;
}

/** Eligible plans, cheapest lifetime cost first. Ties keep engine order. */
function rankedByCost(result: SimulationResult): PlanResult[] {
  return result.plans
    .filter((p) => p.eligible)
    .slice()
    .sort((a, b) => a.totalLifetimeCost - b.totalLifetimeCost);
}

/* ----------------------------------------------------------------- headline */

/**
 * The one sentence at the top of the result. Describes *this* borrower's
 * outcome, in whole dollars, against the plan they would otherwise pick.
 */
export function verdictHeadline(result: SimulationResult): string {
  const ranked = rankedByCost(result);
  const winner = ranked[0];
  if (!winner) {
    return "No repayment plan fits this loan mix. Check the loan types you entered.";
  }

  const runnerUp = ranked[1];
  if (!runnerUp) {
    return `${planName(winner.planId)} is the only plan your loans qualify for. It costs ${usd(
      winner.totalLifetimeCost,
    )} over ${durationLabel(winner.monthsToResolution)}.`;
  }

  const delta = runnerUp.totalLifetimeCost - winner.totalLifetimeCost;
  if (delta === 0) {
    return `${planName(winner.planId)} and ${planName(
      runnerUp.planId,
    )} cost the same over the life of your loans — ${usd(
      winner.totalLifetimeCost,
    )} each. Choose on the monthly payment.`;
  }

  return `${planName(winner.planId)} costs you ${usd(delta)} less than ${planName(
    runnerUp.planId,
  )} over the life of your loans.`;
}

/**
 * The product's central insight, stated only when it is true: the plan with
 * the smallest payment is not the plan that costs least. Returns `null` when
 * the two recommendations agree — there is no trade-off to explain.
 */
export function paymentVsCostSentence(result: SimulationResult): string | null {
  if (!result.recommendation.theyDisagree) return null;

  const cheapestMonthly = findPlan(result, result.recommendation.lowestMonthlyPayment);
  const cheapestTotal = findPlan(result, result.recommendation.lowestTotalCost);
  if (!cheapestMonthly || !cheapestTotal) return null;

  const monthlyGap = cheapestTotal.firstMonthlyPayment - cheapestMonthly.firstMonthlyPayment;
  const lifetimeGap = cheapestMonthly.totalLifetimeCost - cheapestTotal.totalLifetimeCost;

  return `${planName(cheapestMonthly.planId)} starts ${usd(
    monthlyGap,
  )} a month cheaper than ${planName(cheapestTotal.planId)}, and ends up ${usd(
    lifetimeGap,
  )} more expensive.`;
}

/* -------------------------------------------------------------- per-plan copy */

/** "RAP starts at $214 a month and costs $128,404 over 24 yr 6 mo." */
export function planCostSentence(result: SimulationResult, planId: PlanId): string | null {
  const plan = findPlan(result, planId);
  if (!plan) return null;
  if (!plan.eligible) {
    const reason = plan.ineligibilityReasons[0];
    return reason
      ? `${planName(planId)} is not available to you: ${reason}`
      : `${planName(planId)} is not available to you.`;
  }
  return `${planName(planId)} starts at ${usd(
    plan.firstMonthlyPayment,
  )} a month and costs ${usd(plan.totalLifetimeCost)} over ${durationLabel(
    plan.monthsToResolution,
  )}.`;
}

/**
 * Forgiveness and its tax bill, in the same breath — the two are never
 * separated, because the tax is the part borrowers are blindsided by.
 */
export function forgivenessSentence(result: SimulationResult, planId: PlanId): string | null {
  const plan = findPlan(result, planId);
  if (!plan || !plan.eligible || plan.totalForgiven <= 0) return null;

  const when = plan.forgivenessDate ? ` in ${monthLabel(plan.forgivenessDate)}` : "";
  const base = `${planName(planId)} forgives ${usd(plan.totalForgiven)}${when}.`;

  if (plan.estimatedTaxOnForgiveness > 0) {
    return `${base} That forgiven balance is taxable — about ${usd(
      plan.estimatedTaxOnForgiveness,
    )} owed in the year it lands.`;
  }
  return `${base} It is not taxable.`;
}

/**
 * A single month of a schedule, for the M4 scrub readout. Engine rows only —
 * nothing is interpolated between months.
 */
export function monthSentence(plan: PlanResult, month: number): string | null {
  const row = plan.schedule[month - 1];
  if (!row) {
    if (plan.schedule.length === 0) return null;
    return `${planName(plan.planId)} is finished by month ${month} — ${durationLabel(
      plan.monthsToResolution,
    )} in.`;
  }

  const waived =
    row.interestWaived > 0 ? `, with ${usd(row.interestWaived)} of interest waived` : "";
  return `Month ${row.month} (${monthLabel(row.date)}): you pay ${usd(
    row.payment,
  )} and owe ${usd(row.endingBalance)}${waived}.`;
}

/* -------------------------------------------------------------- irreversible */

/**
 * The first fact the borrower cannot undo, verbatim from the engine's warning
 * text. Rendered in `--flag`, which is reserved for exactly this.
 */
export function irreversibleSentence(result: SimulationResult): string | null {
  const fromGlobal = result.globalWarnings.find((w) => w.severity === "IRREVERSIBLE");
  if (fromGlobal) return fromGlobal.message;

  for (const plan of result.plans) {
    const found = plan.warnings.find((w) => w.severity === "IRREVERSIBLE");
    if (found) return found.message;
  }
  return null;
}

/* ------------------------------------------------------------------- verdict */

export interface Verdict {
  /** Always present. The reactive headline. */
  headline: string;
  /** The payment-vs-cost trade-off, when the two recommendations disagree. */
  tradeoff: string | null;
  /** The forgiveness + tax note for the winning plan, when there is one. */
  forgiveness: string | null;
  /** The first one-way door in play. */
  irreversible: string | null;
  /** The winning plan, so the caller can highlight the matching row. */
  winner: PlanId | null;
}

/**
 * Everything the answer block needs, in one pass. Suits the ≤60-word
 * `AnswerBox`: render `headline`, then whichever of the rest are non-null.
 */
export function verdict(result: SimulationResult): Verdict {
  const winner = rankedByCost(result)[0] ?? null;
  return {
    headline: verdictHeadline(result),
    tradeoff: paymentVsCostSentence(result),
    forgiveness: winner ? forgivenessSentence(result, winner.planId) : null,
    irreversible: irreversibleSentence(result),
    winner: winner ? winner.planId : null,
  };
}
