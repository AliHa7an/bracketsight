/**
 * Federal poverty line math.
 *
 * 2026 coverage uses the 2025 HHS guidelines (the guidelines in effect at the
 * start of the open-enrollment period). Guideline dollars come from
 * rules/fpl.2025.json — never hard-coded here.
 */

import { assertCents, mulBps, roundHalf } from "./money";
import type { RuleSet } from "./rules";
import type { BasisPoints, Cents, StateCode, StateGroup } from "./types";

export function stateGroupFor(stateCode: StateCode): StateGroup {
  if (stateCode === "AK") return "ALASKA";
  if (stateCode === "HI") return "HAWAII";
  return "CONTIGUOUS_48";
}

/** The poverty line for a family size in a state group, in cents. */
export function fplFor(
  familySize: number,
  stateGroup: StateGroup,
  rules: RuleSet,
): Cents {
  if (!Number.isInteger(familySize) || familySize < 1) {
    throw new Error(`familySize must be a positive integer, got ${familySize}`);
  }
  const g = rules.fpl.groups[stateGroup];
  return g.firstPersonCents + (familySize - 1) * g.additionalPersonCents;
}

/** Precise FPL percentage in basis points (401.37% → 40137). */
export function fplPercentBps(magi: Cents, fpl: Cents): BasisPoints {
  assertCents(magi, "magi");
  assertCents(fpl, "fpl");
  return roundHalf((magi * 10_000) / fpl);
}

/**
 * FPL percentage exactly as Form 8962 computes it for line 5 — in the order
 * Worksheet 2 computes it, which is two steps, not one:
 *
 *   Step 4: is household income MORE THAN the poverty line × 4.0?
 *           YES → enter 401 on line 5 and stop. (Line 6: "If the amount on
 *                 line 5 is 401%, you are not eligible for the PTC.")
 *           NO  → step 5: MAGI ÷ FPL × 100, TRUNCATED to a whole percent
 *                 ("drop any numbers after the decimal point").
 *
 * Order matters and it is worth real money: truncation is reached only in the
 * "No" branch, so there is no sub-1% grace band above the ceiling. Income at
 * 400.9% of FPL is 401 — ineligible — NOT 400. The engine previously applied a
 * bare floor and overstated the last eligible MAGI by up to ~1% of the poverty
 * line (about $321 for a family of four), at exactly the edge this product
 * exists to locate.
 *
 * The multiple (4.0) and the sentinel (401) come from
 * rules/applicable-percentage.2026.json → eligibilityCeiling, never from here.
 *
 * KNOWN-GAP GAP-033: the 2026 Form 8962 and its instructions are NOT YET
 * PUBLISHED — the IRS releases a tax year's form around January of the
 * following year, so the 2026 edition is due ~Jan 2027. The Worksheet 2 order
 * implemented here comes from the 2025 and 2020 editions, which agree
 * word-for-word across the ARPA boundary. That is strong evidence, not the 2026
 * document. If the step order changes, the cliff edge moves: the single-filer
 * edge is currently exactly $62,600.00 and the family-of-four edge $128,600.00.
 * Re-fetch https://www.irs.gov/pub/irs-pdf/i8962.pdf after Jan 2027 and
 * re-confirm Worksheet 2 and Line 6. See /KNOWN-GAPS.md.
 */
export function fplPercentForm8962(
  magi: Cents,
  fpl: Cents,
  rules: RuleSet,
): number {
  assertCents(magi, "magi");
  assertCents(fpl, "fpl");
  if (magi <= 0) return 0;
  const ceiling = rules.applicablePct.eligibilityCeiling;
  if (magi > mulBps(fpl, ceiling.ceilingMultipleBps)) {
    return ceiling.ineligibleSentinelPct;
  }
  return Math.floor((magi * 100) / fpl);
}

/**
 * The highest MAGI still on the good side of a boundary.
 *
 * Two different rules, because Form 8962 uses two different rules:
 *
 *  - AT THE ELIGIBILITY CEILING (400% FPL): Worksheet 2 applies a strict
 *    "more than 4.0 × FPL" test before any truncation, so the last eligible
 *    MAGI is exactly 4.0 × the poverty line. Not a truncation boundary at all.
 *  - AT EVERY INTERIOR BOUNDARY (the 250% CSR ledge, the applicable-percentage
 *    band edges): line 5 truncation governs. floor(magi·100/fpl) ≤ maxPct ⟺
 *    magi < (maxPct+1)·fpl/100, so the edge is ceil((maxPct+1)·fpl/100) − 1.
 */
export function magiAtPctEdge(
  fpl: Cents,
  maxPct: number,
  rules: RuleSet,
): Cents {
  if (maxPct >= eligibilityCeilingPct(rules)) return cliffEdgeMagi(fpl, rules);
  return Math.ceil(((maxPct + 1) * fpl) / 100) - 1;
}

/**
 * The eligibility ceiling as a whole percent (400), read from the rules file
 * so no .ts holds the threshold. Compare a Form-8962 percentage against this,
 * never against a literal.
 */
export function eligibilityCeilingPct(rules: RuleSet): number {
  return rules.applicablePct.eligibilityCeiling.ceilingMultipleBps / 100;
}

/**
 * The cliff itself: the highest MAGI that is still eligible, which Worksheet 2
 * makes exactly 4.0 × the poverty line. One cent more and line 5 is 401.
 */
export function cliffEdgeMagi(fpl: Cents, rules: RuleSet): Cents {
  return mulBps(fpl, rules.applicablePct.eligibilityCeiling.ceilingMultipleBps);
}
