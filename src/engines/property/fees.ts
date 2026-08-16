/**
 * Filing fees.
 *
 * A fee is not always a scalar. New Jersey's is a statutory schedule banded by
 * assessed value (N.J.S.A. 54:3-21.3; N.J.A.C. 18:12A-1.6(d) and 1.7): $5 /
 * $25 / $100 / $150. `verdict.ts` gates NOT_WORTH_IT on the fee, so encoding
 * the middle band as a flat rate quoted a $1,000,000 home a fee six times too
 * low and let a case through that the fee should have stopped.
 *
 * Everything that needs a fee reads it through `filingFeeFor` — never
 * `county.filingFee.amountCents` directly.
 */

import { assertCents, formatCents } from "./money";
import type { Cents, CountyRules, FilingFeeBand } from "./types";

/**
 * The band covering `assessedValueCents`. Bands are half-open:
 * `[min, maxExclusive)`, with the top band open-ended.
 * Undefined when the county charges a flat fee or no band matches.
 */
export function filingFeeBandFor(
  county: CountyRules,
  assessedValueCents: Cents,
): FilingFeeBand | undefined {
  const bands = county.filingFee.bands;
  if (bands === undefined || bands.length === 0) return undefined;
  assertCents(assessedValueCents, "assessed value for filing fee");
  // A negative assessed value is not a thing; clamp so the first band answers.
  const value = Math.max(0, assessedValueCents);
  return bands.find(
    (band) =>
      value >= band.minAssessedValueCents &&
      (band.maxAssessedValueCentsExclusive === null ||
        value < band.maxAssessedValueCentsExclusive),
  );
}

/**
 * The fee this county charges to file on a home assessed at
 * `assessedValueCents`. Falls back to the flat `amountCents` when the county
 * has no schedule — or when a schedule somehow leaves a gap, which the rules
 * loader rejects at import time.
 */
export function filingFeeFor(county: CountyRules, assessedValueCents: Cents): Cents {
  const band = filingFeeBandFor(county, assessedValueCents);
  if (band !== undefined) {
    return assertCents(band.amountCents, `${county.countyId} fee band "${band.label}"`);
  }
  return assertCents(county.filingFee.amountCents, `${county.countyId} filing fee`);
}

/**
 * What to show where no particular home is in hand — a county page, a listing.
 * "No fee", "$25", or "$5 to $150". Quoting one band as if it were the fee is
 * how a $1,000,000 home came to be told $25.
 */
export function filingFeeSummary(county: CountyRules): string {
  const bands = county.filingFee.bands;
  if (bands === undefined || bands.length === 0) {
    return county.filingFee.amountCents === 0
      ? "No fee"
      : formatCents(county.filingFee.amountCents);
  }
  const amounts = bands.map((b) => b.amountCents);
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  if (low === high) return formatCents(low);
  return `${formatCents(low)} to ${formatCents(high)}`;
}
