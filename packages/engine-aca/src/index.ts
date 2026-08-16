/**
 * CliffCheck engine — public API.
 *
 * `analyzeHousehold` is the one call the app makes: MAGI → FPL% → PTC → CSR
 * → cliff geometry → clawback risk → ranked levers. Pure, deterministic,
 * dependency-free (invariant #1).
 */

import { reconcileAdvanceCredit } from "./clawback";
import { computeCsr, csrTopPct } from "./csr";
import { cliffEdgeMagi, fplFor, magiAtPctEdge, stateGroupFor } from "./fpl";
import { buildMagi } from "./magi";
import { computeLevers, ptcAtMagi } from "./levers";
import { computePtc } from "./ptc";
import { getRules } from "./rules";
import type {
  CliffAnalysis,
  CliffAnalysisInput,
  CliffGeometry,
  ClawbackResult,
} from "./types";

export const ENGINE_VERSION = "0.1.0";

export function analyzeHousehold(
  input: CliffAnalysisInput,
  computedAt?: Date,
): CliffAnalysis {
  const rules = getRules();
  const magi = buildMagi(input.income);
  const ptc = computePtc(magi, input.household, rules);
  const csr = computeCsr(ptc.fplPctForm, ptc.status, rules);

  const fpl = fplFor(
    input.household.familySize,
    stateGroupFor(input.household.stateCode),
    rules,
  );
  // The cliff is a strict "more than 4.0 × FPL" test (Form 8962 Worksheet 2,
  // step 4) — not a truncation boundary. The CSR ledge genuinely is one, so it
  // still goes through magiAtPctEdge with the truncated percent from the rules.
  const edgeMagi = cliffEdgeMagi(fpl, rules);
  const csrEdgeMagi = magiAtPctEdge(fpl, csrTopPct(rules), rules);
  const overCliff = magi.magi > edgeMagi;

  const cliff: CliffGeometry = {
    overCliff,
    cliffEdgeMagi: edgeMagi,
    distanceToEdge: overCliff ? magi.magi - edgeMagi : edgeMagi - magi.magi,
    // Under the cliff: the credit you would lose by crossing (your current
    // PTC). Over it: the credit waiting at the edge if you climb back.
    creditAtStake: overCliff
      ? ptcAtMagi(edgeMagi, input.household, rules)
      : ptc.annualPtc,
    csrEdgeMagi,
    distanceToCsrEdge: csrEdgeMagi - magi.magi,
  };

  let clawback: ClawbackResult | null = null;
  if (input.aptcMonthly !== undefined && input.aptcMonthly > 0) {
    clawback = reconcileAdvanceCredit(
      {
        aptcAnnual: input.aptcMonthly * 12,
        finalPtcAnnual: ptc.annualPtc,
        fplPctForm: ptc.fplPctForm,
        filingStatus: input.household.filingStatus,
      },
      rules,
    );
  }

  const levers = computeLevers(magi, input.household, input.levers, rules);

  return {
    magi,
    ptc,
    csr,
    cliff,
    clawback,
    levers,
    meta: {
      engineVersion: ENGINE_VERSION,
      ruleSetVersion: rules.ruleSetVersion,
      computedAt: (computedAt ?? new Date()).toISOString(),
    },
  };
}

// Re-export the full surface for the app, tests, and trust pages.
export * from "./types";
export {
  assertCents,
  roundHalf,
  mulBps,
  mulPermille,
  sumCents,
  clampCents,
  formatUsd,
} from "./money";
export { buildMagi } from "./magi";
export {
  stateGroupFor,
  fplFor,
  fplPercentBps,
  fplPercentForm8962,
  magiAtPctEdge,
  cliffEdgeMagi,
  eligibilityCeilingPct,
} from "./fpl";
export {
  applicablePercentageBps,
  benchmarkAnnualPremium,
  computePtc,
} from "./ptc";
export { computeCsr, csrTopPct } from "./csr";
export { reconcileAdvanceCredit } from "./clawback";
export {
  computeLevers,
  ptcAtMagi,
  halfSeTax,
  sepMaxContribution,
  deductibleIraLimit,
  sehiIterative,
  DEFAULT_LEVER_CONTEXT,
} from "./levers";
export { getRules, allCitations } from "./rules";
export type { RuleSet, Citation } from "./rules";
