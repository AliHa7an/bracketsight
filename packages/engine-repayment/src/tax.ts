/**
 * packages/engine/src/tax.ts
 *
 * Forgiveness tax estimation. All treatment flags and the assumed
 * marginal rate live in rules/tax.<year>.json (dated config with
 * citations) — NEVER as constants here. See CLAUDE.md invariant 3.
 *
 * Current law (post-2025, ARPA exclusion expired):
 *  - Non-PSLF forgiveness is taxable cancellation-of-debt income.
 *  - PSLF discharge is tax-free under 26 U.S.C. § 108(f)(1).
 * The flat marginal rate is a labelled ESTIMATE; state treatment is not
 * modelled in v1.
 */

import type { Cents } from "./types";
import type { TaxRules } from "./rules/index";
import { percentOf } from "./money";

export function estimateTaxOnForgiveness(
  forgiven: Cents,
  isPslfTrack: boolean,
  tax: TaxRules,
): Cents {
  if (forgiven <= 0) return 0;
  const taxable = isPslfTrack ? tax.pslfForgivenessTaxable : tax.nonPslfForgivenessTaxable;
  if (!taxable) return 0;
  return percentOf(forgiven, tax.assumedMarginalRatePct);
}
