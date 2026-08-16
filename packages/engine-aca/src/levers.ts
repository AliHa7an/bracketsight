/**
 * The lever engine — the product.
 *
 * For a household near (or over) the 400% FPL cliff, rank every legal
 * MAGI-reduction lever by dollars of premium tax credit recovered per dollar
 * committed. Output supports sentences like:
 *
 *   "Contributing $4,300 to an HSA moves you from 401% to 384% FPL and
 *    recovers $6,120 of premium tax credit."
 *
 * Every limit and threshold comes from rules/contribution-limits.2026.json.
 * Income timing is NEVER auto-advised — it ships as an advisory-only card.
 */

import {
  cliffEdgeMagi,
  fplFor,
  fplPercentBps,
  fplPercentForm8962,
  stateGroupFor,
} from "./fpl";
import { assertCents, clampCents, formatUsd, mulBps, roundHalf } from "./money";
import { computePtc } from "./ptc";
import type { RuleSet } from "./rules";
import type {
  Cents,
  Household,
  LeverContext,
  LeverResult,
  MagiBreakdown,
} from "./types";

export const DEFAULT_LEVER_CONTEXT: LeverContext = {
  age: 40,
  wagesW2: 0,
  selfEmploymentNetProfit: 0,
  hdhpCoverage: "NONE",
  coveredByEmployerPlan: false,
  spouseCoveredByEmployerPlan: false,
  ytd401k: 0,
  ytdHsa: 0,
  ytdIra: 0,
  ytdSep: 0,
  annualHealthPremium: 0,
};

/** Annual PTC at a hypothetical MAGI, all else equal. 0 when ineligible. */
export function ptcAtMagi(
  magiCents: Cents,
  household: Household,
  rules: RuleSet,
): Cents {
  const breakdown: MagiBreakdown = {
    agi: magiCents,
    taxExemptInterest: 0,
    excludedForeignIncome: 0,
    nonTaxableSocialSecurity: 0,
    magi: magiCents,
  };
  return computePtc(breakdown, household, rules).annualPtc;
}

interface LeverSpec {
  id: LeverResult["id"];
  label: string;
  shortName: string;
  eligible: boolean;
  ineligibilityReasons: string[];
  maxAvailable: Cents;
  advisoryOnly: boolean;
  warnings: string[];
  /** Overrides the standard "Contributing $X to …" sentence opening. */
  sentencePrefix?: (amount: Cents) => string;
  /** SEHI models a computed deduction rather than a chosen contribution. */
  fixedModeledAmount?: Cents;
}

/** Half of self-employment tax — the Schedule SE deduction, from rules. */
export function halfSeTax(netProfit: Cents, rules: RuleSet): Cents {
  const c = rules.contributionLimits;
  if (netProfit <= 0) return 0;
  const netEarnings = mulBps(netProfit, c.seNetEarningsFactorBps);
  const ssPortion = mulBps(Math.min(netEarnings, c.ssWageBaseCents), c.seTaxSsRateBps);
  const medicarePortion = mulBps(netEarnings, c.seTaxMedicareRateBps);
  return roundHalf((ssPortion + medicarePortion) / 2);
}

/**
 * Traditional IRA deductible limit given employer-plan coverage — the ratable
 * phase-out, rounded to the nearest $10 with the statutory $200 floor while
 * inside the range. Simplification (documented in /methodology): the IRA
 * phase-out uses its own MAGI definition; we approximate it with §36B MAGI.
 */
export function deductibleIraLimit(
  magi: Cents,
  household: Household,
  ctx: LeverContext,
  rules: RuleSet,
): { limit: Cents; phasedOut: boolean } {
  const c = rules.contributionLimits;
  const base = c.iraCents + (ctx.age >= 50 ? c.iraCatchUp50Cents : 0);
  const p = c.iraPhaseOut;

  let from: Cents | null = null;
  let to: Cents | null = null;
  if (ctx.coveredByEmployerPlan) {
    if (household.filingStatus === "MARRIED_JOINT") {
      from = p.coveredJointFromCents;
      to = p.coveredJointToCents;
    } else if (household.filingStatus === "MARRIED_SEPARATE") {
      from = p.marriedSeparateFromCents;
      to = p.marriedSeparateToCents;
    } else {
      from = p.coveredSingleFromCents;
      to = p.coveredSingleToCents;
    }
  } else if (
    ctx.spouseCoveredByEmployerPlan &&
    household.filingStatus === "MARRIED_JOINT"
  ) {
    from = p.spouseCoveredJointFromCents;
    to = p.spouseCoveredJointToCents;
  }

  if (from === null || to === null) return { limit: base, phasedOut: false };
  if (magi <= from) return { limit: base, phasedOut: false };
  if (magi >= to) return { limit: 0, phasedOut: true };

  const raw = roundHalf((base * (to - magi)) / (to - from));
  const roundedTo10 = roundHalf(raw / 1000) * 1000; // nearest $10
  return { limit: Math.max(roundedTo10, 20000), phasedOut: true }; // $200 floor
}

/** SEP-IRA employer-contribution ceiling for a self-employed person.
 *  25% of compensation net of the contribution itself ⟹ rate/(1+rate) of
 *  (net profit − ½ SE tax). Solo-401(k) employee deferrals can add more —
 *  surfaced as a warning, not modeled in v1. */
export function sepMaxContribution(netProfit: Cents, rules: RuleSet): Cents {
  const c = rules.contributionLimits;
  if (netProfit <= 0) return 0;
  const compBase = netProfit - halfSeTax(netProfit, rules);
  const effective = roundHalf(
    (compBase * c.sepEmployerPctBps) / (10_000 + c.sepEmployerPctBps),
  );
  return clampCents(effective, 0, c.sepOverallCapCents);
}

/**
 * Self-employed health insurance deduction — the IRS iterative calculation.
 *
 * The circularity: the SEHI deduction lowers MAGI → a lower MAGI raises the
 * PTC → a higher PTC lowers the out-of-pocket premium that is deductible →
 * a smaller deduction raises MAGI again. Rev. Proc. 2014-41 blesses an
 * iterative method: recompute until successive deductions differ by less
 * than $1.00. Near the 400% cliff the sequence can oscillate between an
 * over-the-cliff and an under-the-cliff fixed point; when the loop has not
 * settled after `maxIterations`, we return the SMALLER candidate deduction —
 * the conservative choice (less deduction claimed, less credit assumed) —
 * and flag it. Documented on /methodology.
 */
export function sehiIterative(
  baseMagi: Cents,
  annualPremium: Cents,
  earnedIncomeLimit: Cents,
  household: Household,
  rules: RuleSet,
  maxIterations = 50,
  toleranceCents = 100,
): { deduction: Cents; iterations: number; converged: boolean } {
  const cap = Math.min(annualPremium, Math.max(earnedIncomeLimit, 0));
  let deduction: Cents = 0;
  let previous: Cents = -1;
  for (let i = 1; i <= maxIterations; i++) {
    const trialMagi = Math.max(0, baseMagi - deduction);
    const ptc = ptcAtMagi(trialMagi, household, rules);
    const next = clampCents(annualPremium - ptc, 0, cap);
    if (Math.abs(next - deduction) <= toleranceCents) {
      return { deduction: next, iterations: i, converged: true };
    }
    // Two-cycle detection: the classic cliff oscillation.
    if (next === previous) {
      return {
        deduction: Math.min(next, deduction),
        iterations: i,
        converged: false,
      };
    }
    previous = deduction;
    deduction = next;
  }
  return {
    deduction: Math.min(deduction, previous >= 0 ? previous : deduction),
    iterations: maxIterations,
    converged: false,
  };
}

function buildSpecs(
  magi: Cents,
  household: Household,
  ctx: LeverContext,
  rules: RuleSet,
): LeverSpec[] {
  const c = rules.contributionLimits;
  const specs: LeverSpec[] = [];

  // 1 — Traditional 401(k) / 403(b) / 457
  {
    const limit =
      c.elective401kCents + (ctx.age >= 50 ? c.catchUp401k50Cents : 0);
    const room = clampCents(limit - ctx.ytd401k, 0, limit);
    const available = Math.min(room, Math.max(ctx.wagesW2, 0));
    const eligible = ctx.wagesW2 > 0 && available > 0;
    specs.push({
      id: "TRADITIONAL_401K",
      label: "Traditional 401(k) / 403(b) / 457 contribution",
      shortName: "your traditional 401(k)",
      eligible,
      ineligibilityReasons: eligible
        ? []
        : ctx.wagesW2 <= 0
          ? ["Requires W-2 wages and an employer plan that accepts deferrals."]
          : ["You have already reached this year's elective deferral limit."],
      maxAvailable: available,
      advisoryOnly: false,
      warnings:
        ctx.age >= 50
          ? ["Includes the age-50+ catch-up allowance."]
          : [],
    });
  }

  // 2 — HSA
  {
    const eligibleCoverage = ctx.hdhpCoverage !== "NONE";
    const limit = eligibleCoverage
      ? (ctx.hdhpCoverage === "FAMILY" ? c.hsaFamilyCents : c.hsaSelfOnlyCents) +
        (ctx.age >= 55 ? c.hsaCatchUp55Cents : 0)
      : 0;
    const available = clampCents(limit - ctx.ytdHsa, 0, limit);
    const eligible = eligibleCoverage && available > 0;
    specs.push({
      id: "HSA",
      label: "HSA contribution",
      shortName: "an HSA",
      eligible,
      ineligibilityReasons: eligible
        ? []
        : !eligibleCoverage
          ? ["Requires enrollment in a qualifying high-deductible health plan (HDHP)."]
          : ["You have already reached this year's HSA limit."],
      maxAvailable: available,
      advisoryOnly: false,
      warnings: [
        "HSA eligibility also requires no other disqualifying coverage (including Medicare enrollment and a general-purpose FSA).",
        ...(ctx.age >= 55 ? ["Includes the age-55+ catch-up allowance."] : []),
      ],
    });
  }

  // 3 — Traditional IRA
  {
    const { limit, phasedOut } = deductibleIraLimit(magi, household, ctx, rules);
    const compensation = Math.max(ctx.wagesW2, 0) + Math.max(ctx.selfEmploymentNetProfit, 0);
    const room = clampCents(limit - ctx.ytdIra, 0, limit);
    const available = Math.min(room, compensation);
    const eligible = available > 0;
    specs.push({
      id: "TRADITIONAL_IRA",
      label: "Traditional IRA contribution (deductible portion)",
      shortName: "a traditional IRA",
      eligible,
      ineligibilityReasons: eligible
        ? []
        : compensation <= 0
          ? ["Requires earned income (wages or self-employment profit)."]
          : limit === 0
            ? ["Your deduction is fully phased out at this MAGI because of employer-plan coverage."]
            : ["You have already used this year's IRA room."],
      maxAvailable: available,
      advisoryOnly: false,
      warnings: phasedOut
        ? [
            "Employer-plan coverage partially phases out your IRA deduction at this income — only the deductible portion reduces MAGI. Non-deductible contributions do not move you off the cliff.",
          ]
        : [],
    });
  }

  // 4 — SEP-IRA / Solo 401(k)
  {
    const sepMax = sepMaxContribution(ctx.selfEmploymentNetProfit, rules);
    const available = clampCents(sepMax - ctx.ytdSep, 0, sepMax);
    const eligible = ctx.selfEmploymentNetProfit > 0 && available > 0;
    specs.push({
      id: "SEP_SOLO_401K",
      label: "SEP-IRA / Solo 401(k) employer contribution",
      shortName: "a SEP-IRA",
      eligible,
      ineligibilityReasons: eligible
        ? []
        : ctx.selfEmploymentNetProfit <= 0
          ? ["Requires self-employment profit."]
          : ["You have already reached this year's SEP ceiling."],
      maxAvailable: available,
      advisoryOnly: false,
      warnings: [
        "Modeled as the SEP employer contribution (25% of net self-employment earnings after the ½ SE-tax deduction). A Solo 401(k) can add an employee deferral on top if you have no workplace deferrals — worth asking a professional about.",
      ],
    });
  }

  // 5 — Self-employed health insurance deduction (circular with the PTC)
  {
    const seProfit = ctx.selfEmploymentNetProfit;
    const premium = ctx.annualHealthPremium;
    const eligible = seProfit > 0 && premium > 0;
    let fixed: Cents = 0;
    const warnings: string[] = [
      "This deduction is circular with the premium tax credit — CliffCheck applies the IRS iterative method (Rev. Proc. 2014-41). See /methodology.",
    ];
    if (eligible) {
      const limit = seProfit - halfSeTax(seProfit, rules) - Math.max(ctx.ytdSep, 0);
      const result = sehiIterative(magi, premium, limit, household, rules);
      fixed = result.deduction;
      if (!result.converged) {
        warnings.push(
          "The iterative calculation oscillated around the cliff edge; the conservative (smaller) deduction is shown. Confirm the final figure with a tax professional.",
        );
      }
    }
    specs.push({
      id: "SE_HEALTH_INSURANCE",
      label: "Self-employed health insurance deduction",
      shortName: "the self-employed health insurance deduction",
      eligible,
      ineligibilityReasons: eligible
        ? []
        : ["Requires self-employment profit and marketplace premiums you pay yourself."],
      maxAvailable: fixed,
      advisoryOnly: false,
      warnings,
      fixedModeledAmount: fixed,
      sentencePrefix: (amount) =>
        `Claiming your ${formatUsd(amount)} self-employed health insurance deduction`,
    });
  }

  // 6 — Income timing: advisory only, never auto-advised.
  specs.push({
    id: "INCOME_TIMING",
    label: "Income timing (deferring invoices, harvesting losses)",
    shortName: "income timing",
    eligible: true,
    ineligibilityReasons: [],
    maxAvailable: 0,
    advisoryOnly: true,
    warnings: [
      "Shifting income across tax years has consequences beyond the subsidy. Discuss with a tax professional — CliffCheck never auto-advises income timing.",
    ],
  });

  return specs;
}

export function computeLevers(
  magi: MagiBreakdown,
  household: Household,
  contextPartial: Partial<LeverContext> | undefined,
  rules: RuleSet,
): LeverResult[] {
  const ctx: LeverContext = { ...DEFAULT_LEVER_CONTEXT, ...contextPartial };
  assertCents(magi.magi, "magi");

  const stateGroup = stateGroupFor(household.stateCode);
  const fpl = fplFor(household.familySize, stateGroup, rules);
  const fplPctBefore = fplPercentForm8962(magi.magi, fpl, rules);
  // Over the cliff is a MAGI comparison, not a percentage comparison: the
  // ceiling test is "more than 4.0 × FPL" (Form 8962 Worksheet 2, step 4).
  const cliffEdge = cliffEdgeMagi(fpl, rules);
  const overCliff = magi.magi > cliffEdge;
  const ptcBefore = ptcAtMagi(magi.magi, household, rules);

  const results = buildSpecs(magi.magi, household, ctx, rules).map((spec): LeverResult => {
    const modeled = spec.advisoryOnly
      ? 0
      : (spec.fixedModeledAmount ?? spec.maxAvailable);

    const magiAfter = Math.max(0, magi.magi - modeled);
    const ptcAfter = spec.eligible ? ptcAtMagi(magiAfter, household, rules) : ptcBefore;
    const creditRecovered = Math.max(0, ptcAfter - ptcBefore);

    const needed = overCliff ? magi.magi - cliffEdge : null;
    const amountToClearCliff =
      needed !== null && spec.eligible && !spec.advisoryOnly
        ? (spec.fixedModeledAmount ?? spec.maxAvailable) >= needed
          ? needed
          : null
        : null;

    const warnings = [...spec.warnings];
    if (
      needed !== null &&
      spec.eligible &&
      !spec.advisoryOnly &&
      amountToClearCliff === null
    ) {
      warnings.push(
        `This lever alone cannot bring you under 400% FPL — it covers ${formatUsd(spec.fixedModeledAmount ?? spec.maxAvailable)} of the ${formatUsd(needed)} reduction required. Combine levers.`,
      );
    }
    if (amountToClearCliff !== null && amountToClearCliff === needed) {
      warnings.push(
        "Landing exactly at the edge leaves no margin for a year-end surprise (a dividend, a bonus, a mutual-fund distribution). Build a buffer below 400%.",
      );
    }

    let sentence: string;
    if (spec.advisoryOnly) {
      sentence =
        "Deferring December invoices or harvesting capital losses can move income across tax years — but it changes more than your subsidy. Discuss with a tax professional; CliffCheck never auto-advises income timing.";
    } else if (!spec.eligible || modeled <= 0) {
      sentence = spec.ineligibilityReasons[0] ?? "Not available for this household.";
    } else {
      const pctAfter = fplPercentForm8962(magiAfter, fpl, rules);
      const opening = spec.sentencePrefix
        ? spec.sentencePrefix(modeled)
        : `Contributing ${formatUsd(modeled)} to ${spec.shortName}`;
      const returnClause =
        creditRecovered > 0 && modeled > 0
          ? ` — a ${Math.round((creditRecovered / modeled) * 100)}% instant return.`
          : ".";
      sentence = `${opening} moves you from ${fplPctBefore}% to ${pctAfter}% FPL and recovers ${formatUsd(creditRecovered)} of premium tax credit${returnClause}`;
    }

    return {
      id: spec.id,
      label: spec.label,
      eligible: spec.eligible,
      ineligibilityReasons: spec.ineligibilityReasons,
      maxAvailable: spec.maxAvailable,
      amountToClearCliff,
      modeledAmount: modeled,
      magiAfter,
      fplBpsAfter: fplPercentBps(magiAfter, fpl),
      fplPctFormAfter: fplPercentForm8962(magiAfter, fpl, rules),
      ptcBefore,
      ptcAfter,
      creditRecovered,
      recoveredPerDollarBps:
        modeled > 0 ? roundHalf((creditRecovered * 10_000) / modeled) : null,
      advisoryOnly: spec.advisoryOnly,
      warnings,
      sentence,
    };
  });

  // Rank: eligible dollar-levers by credit recovered per dollar committed
  // (the product's promise), tie-broken by absolute recovery; then eligible
  // levers that currently recover nothing; then advisory; then ineligible.
  return results.sort((a, b) => {
    const tier = (r: LeverResult): number => {
      if (!r.eligible) return 3;
      if (r.advisoryOnly) return 2;
      if (r.creditRecovered <= 0) return 1;
      return 0;
    };
    const t = tier(a) - tier(b);
    if (t !== 0) return t;
    const eff = (b.recoveredPerDollarBps ?? 0) - (a.recoveredPerDollarBps ?? 0);
    if (eff !== 0) return eff;
    return b.creditRecovered - a.creditRecovered;
  });
}
