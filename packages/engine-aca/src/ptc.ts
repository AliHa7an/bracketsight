/**
 * The §36B premium tax credit.
 *
 *   fplPct = MAGI / FPL                      (Form 8962 truncation)
 *   fplPct > 400%  → PTC = 0                 ← THE CLIFF (2026: enhanced
 *                                              credits expired 31 Dec 2025)
 *   fplPct < 100%  → Medicaid / coverage-gap logic by state expansion status
 *   applicablePct  = table lookup (Rev. Proc. indexing, rules JSON)
 *   expectedContribution = MAGI × applicablePct
 *   PTC = max(0, benchmarkSilverPremium − expectedContribution)
 *
 * Married-filing-separately is generally ineligible (§36B(c)(1)(C)) — the
 * domestic-abuse/abandonment exception is surfaced as a note, not modeled.
 */

import {
  eligibilityCeilingPct,
  fplFor,
  fplPercentBps,
  fplPercentForm8962,
  stateGroupFor,
} from "./fpl";
import { assertCents, mulBps, mulPermille, roundHalf } from "./money";
import type { RuleSet } from "./rules";
import type { Cents, Household, MagiBreakdown, PtcResult } from "./types";

/**
 * Applicable percentage in basis points for a Form-8962-truncated FPL%.
 * Linear interpolation within the band, rounded to the nearest whole basis
 * point (one-hundredth of a percent) — the Form 8962 applicable-figure method.
 */
export function applicablePercentageBps(fplPctForm: number, rules: RuleSet): number {
  const bands = rules.applicablePct.bands;
  const last = bands[bands.length - 1];
  if (!last) throw new Error("applicable-percentage rules file has no bands");

  for (const band of bands) {
    const isLast = band === last;
    const inBand = isLast
      ? fplPctForm >= band.fromPct && fplPctForm <= band.toPct
      : fplPctForm >= band.fromPct && fplPctForm < band.toPct;
    if (inBand) {
      if (band.highBps === band.lowBps) return band.lowBps;
      const span = band.toPct - band.fromPct;
      return (
        band.lowBps +
        roundHalf(((fplPctForm - band.fromPct) * (band.highBps - band.lowBps)) / span)
      );
    }
  }
  throw new Error(
    `No applicable-percentage band covers ${fplPctForm}% FPL — caller must gate eligibility first.`,
  );
}

/**
 * Annual benchmark (second-lowest-cost Silver) premium for the covered
 * members: per-member monthly = age-21 base × age factor, summed, × 12.
 * v1 ships SAMPLE county data — see slcsp-sample.2026.json.
 */
export function benchmarkAnnualPremium(
  countyId: string,
  coveredMemberAges: number[],
  rules: RuleSet,
): Cents {
  const county = rules.slcsp.counties.find((c) => c.id === countyId);
  if (!county) {
    throw new Error(
      `Unknown county "${countyId}" — not in the sample SLCSP table.`,
    );
  }
  if (coveredMemberAges.length === 0) {
    throw new Error("At least one covered member age is required.");
  }
  let monthly = 0;
  for (const age of coveredMemberAges) {
    const clamped = Math.min(Math.max(Math.trunc(age), 0), 64);
    const factor = rules.slcsp.ageFactorsPermille[String(clamped)];
    if (factor === undefined) {
      throw new Error(`No age factor for age ${clamped}.`);
    }
    monthly += mulPermille(county.age21BaseMonthlyCents, factor);
  }
  return monthly * 12;
}

export function computePtc(
  magi: MagiBreakdown,
  household: Household,
  rules: RuleSet,
): PtcResult {
  assertCents(magi.magi, "magi");
  const stateGroup = stateGroupFor(household.stateCode);
  const fpl = fplFor(household.familySize, stateGroup, rules);
  const fplBps = fplPercentBps(magi.magi, fpl);
  const fplPctForm = fplPercentForm8962(magi.magi, fpl, rules);
  const benchmark = benchmarkAnnualPremium(
    household.countyId,
    household.coveredMemberAges,
    rules,
  );

  const zero = (status: PtcResult["status"], notes: string[]): PtcResult => ({
    status,
    magi: magi.magi,
    fpl,
    fplBps,
    fplPctForm,
    applicableBps: null,
    expectedAnnualContribution: 0,
    benchmarkAnnualPremium: benchmark,
    annualPtc: 0,
    monthlyPtc: 0,
    notes,
  });

  if (household.filingStatus === "MARRIED_SEPARATE") {
    return zero("FILING_STATUS_INELIGIBLE", [
      "Married filing separately is generally ineligible for the premium tax credit (IRC §36B(c)(1)(C)). An exception exists for survivors of domestic abuse or spousal abandonment — confirm with a tax professional.",
    ]);
  }

  // fplPercentForm8962 already applied Worksheet 2's ceiling test, so anything
  // above the ceiling arrives here as the 401 sentinel.
  if (fplPctForm > eligibilityCeilingPct(rules)) {
    return zero("CLIFF", [
      "Household income is over 400% of the federal poverty line. Under 2026 rules (enhanced credits expired 31 Dec 2025), the premium tax credit is $0 — the cliff.",
    ]);
  }

  const expanded = rules.medicaidExpansion.states[household.stateCode];
  if (expanded === undefined) {
    throw new Error(`Unknown state code "${household.stateCode}".`);
  }

  if (expanded && fplPctForm < 138) {
    return zero("MEDICAID_REFERRAL", [
      `${household.stateCode} expanded Medicaid: below 138% FPL the household generally qualifies for Medicaid rather than a marketplace credit. Apply through the state Medicaid agency.`,
    ]);
  }

  if (!expanded && fplPctForm < 100) {
    return zero("COVERAGE_GAP", [
      `${household.stateCode} has not expanded Medicaid: below 100% FPL the household falls in the coverage gap — generally no premium tax credit and no Medicaid. Special projected-income rules may apply at enrollment; confirm with the marketplace.`,
    ]);
  }

  const applicableBps = applicablePercentageBps(fplPctForm, rules);
  const expectedAnnualContribution = mulBps(magi.magi, applicableBps);
  const annualPtc = Math.max(0, benchmark - expectedAnnualContribution);

  const notes: string[] = [];
  if (!expanded && fplPctForm < 138) {
    notes.push(
      `${household.stateCode} has not expanded Medicaid, so premium tax credits remain available from 100% FPL (expansion states shift this range to Medicaid).`,
    );
  }

  return {
    status: "ELIGIBLE",
    magi: magi.magi,
    fpl,
    fplBps,
    fplPctForm,
    applicableBps,
    expectedAnnualContribution,
    benchmarkAnnualPremium: benchmark,
    annualPtc,
    monthlyPtc: roundHalf(annualPtc / 12),
    notes,
  };
}
