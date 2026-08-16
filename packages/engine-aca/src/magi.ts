/**
 * MAGI for premium-tax-credit purposes — IRC §36B(d)(2)(B).
 *
 * MAGI = AGI
 *      + tax-exempt interest (Form 1040 line 2a)
 *      + excluded foreign earned income and housing (§911)
 *      + the non-taxable portion of Social Security benefits.
 *
 * There is no single "MAGI" in the tax code — the IRA-deduction MAGI and the
 * net-investment-income-tax MAGI are different. This module is the §36B one.
 */

import { assertCents, sumCents } from "./money";
import type { MagiBreakdown, MagiComponents } from "./types";

export function buildMagi(components: MagiComponents): MagiBreakdown {
  const agi = assertCents(components.agi, "agi");
  const taxExemptInterest = assertCents(
    components.taxExemptInterest,
    "taxExemptInterest",
  );
  const excludedForeignIncome = assertCents(
    components.excludedForeignIncome,
    "excludedForeignIncome",
  );
  const nonTaxableSocialSecurity = assertCents(
    components.nonTaxableSocialSecurity,
    "nonTaxableSocialSecurity",
  );

  for (const [label, v] of [
    ["taxExemptInterest", taxExemptInterest],
    ["excludedForeignIncome", excludedForeignIncome],
    ["nonTaxableSocialSecurity", nonTaxableSocialSecurity],
  ] as const) {
    if (v < 0) {
      throw new Error(`${label} cannot be negative.`);
    }
  }

  return {
    agi,
    taxExemptInterest,
    excludedForeignIncome,
    nonTaxableSocialSecurity,
    magi: sumCents([
      agi,
      taxExemptInterest,
      excludedForeignIncome,
      nonTaxableSocialSecurity,
    ]),
  };
}
