/**
 * County rules loader. Rules are versioned, cited JSON — never constants in .ts
 * (portfolio invariant 3). Add a county by adding a JSON file here and
 * registering it below; every county page and the /check tool pick it up.
 */

import type { CountyRules } from "../types";
import ilCook from "./counties/il-cook.json";
import njBergen from "./counties/nj-bergen.json";

function assertCountyRules(raw: unknown, file: string): CountyRules {
  const r = raw as CountyRules;
  if (typeof r.countyId !== "string" || r.countyId.length === 0) {
    throw new Error(`${file}: missing countyId`);
  }
  if (!Array.isArray(r.citations) || r.citations.length === 0) {
    throw new Error(`${file}: rules must carry at least one citation`);
  }
  for (const c of r.citations) {
    if (!c.url || !c.lastVerified) {
      throw new Error(`${file}: every citation needs url and lastVerified`);
    }
  }
  if (!Number.isInteger(r.filingFee.amountCents)) {
    throw new Error(`${file}: filingFee.amountCents must be integer cents`);
  }
  assertFeeBands(r, file);
  if (!r.argumentTypes.includes(r.primaryArgument)) {
    throw new Error(`${file}: primaryArgument must be one of argumentTypes`);
  }
  if (r.reliefModel !== "GAP" && r.reliefModel !== "COMMON_LEVEL_RANGE") {
    throw new Error(`${file}: reliefModel must be "GAP" or "COMMON_LEVEL_RANGE"`);
  }
  assertCommonLevelRange(r, file);
  return r;
}

/**
 * A fee schedule that leaves a gap would silently fall back to the flat fee —
 * exactly the bug the schedule exists to fix. Bands must start at zero, ascend
 * without gaps or overlaps, and end open.
 */
function assertFeeBands(r: CountyRules, file: string): void {
  const bands = r.filingFee.bands;
  if (bands === undefined) return;
  if (bands.length === 0) {
    throw new Error(`${file}: filingFee.bands is present but empty — omit it for a flat fee`);
  }
  let expectedMin = 0;
  bands.forEach((band, i) => {
    if (!Number.isInteger(band.amountCents) || band.amountCents < 0) {
      throw new Error(`${file}: filingFee.bands[${i}].amountCents must be integer cents`);
    }
    if (band.minAssessedValueCents !== expectedMin) {
      throw new Error(
        `${file}: filingFee.bands[${i}] starts at ${band.minAssessedValueCents}, leaving a gap or overlap at ${expectedMin}`,
      );
    }
    const isLast = i === bands.length - 1;
    if (isLast) {
      if (band.maxAssessedValueCentsExclusive !== null) {
        throw new Error(`${file}: the last filingFee band must be open-ended (max null)`);
      }
      return;
    }
    if (
      band.maxAssessedValueCentsExclusive === null ||
      band.maxAssessedValueCentsExclusive <= band.minAssessedValueCents
    ) {
      throw new Error(`${file}: filingFee.bands[${i}] needs an upper bound above its lower bound`);
    }
    expectedMin = band.maxAssessedValueCentsExclusive;
  });
}

/**
 * A COMMON_LEVEL_RANGE county without corridor data would have no way to reach
 * a verdict. An empty `municipalities` table is legitimate — it means no ratio
 * has been verified yet, and the verdict path returns CANNOT_DETERMINE — but
 * the corridor parameters themselves must be present.
 */
function assertCommonLevelRange(r: CountyRules, file: string): void {
  if (r.reliefModel !== "COMMON_LEVEL_RANGE") {
    if (r.commonLevelRange !== undefined) {
      throw new Error(`${file}: commonLevelRange is only meaningful for reliefModel COMMON_LEVEL_RANGE`);
    }
    return;
  }
  const clr = r.commonLevelRange;
  if (clr === undefined) {
    throw new Error(`${file}: reliefModel COMMON_LEVEL_RANGE requires a commonLevelRange block`);
  }
  if (!Number.isInteger(clr.corridorBps) || clr.corridorBps <= 0 || clr.corridorBps >= 10_000) {
    throw new Error(`${file}: commonLevelRange.corridorBps must be integer basis points in (0, 10000)`);
  }
  if (!Number.isInteger(clr.countyPercentageLevelBps) || clr.countyPercentageLevelBps <= 0) {
    throw new Error(`${file}: commonLevelRange.countyPercentageLevelBps must be positive basis points`);
  }
  if (!clr.sourceUrl.startsWith("https://")) {
    throw new Error(`${file}: commonLevelRange.sourceUrl must record where to re-fetch the table`);
  }
  if (!Array.isArray(clr.municipalities)) {
    throw new Error(`${file}: commonLevelRange.municipalities must be an array (empty is allowed)`);
  }
  for (const m of clr.municipalities) {
    if (!Number.isInteger(m.averageRatioBps) || m.averageRatioBps <= 0) {
      throw new Error(`${file}: ${m.municipalityId} averageRatioBps must be positive basis points`);
    }
    if (m.effectiveFrom > m.effectiveTo) {
      throw new Error(`${file}: ${m.municipalityId} has effectiveFrom after effectiveTo`);
    }
    if (m.citations.length === 0) {
      throw new Error(
        `${file}: ${m.municipalityId} needs a citation — a Director's Ratio without a source does not ship`,
      );
    }
  }
}

export const counties: CountyRules[] = [
  assertCountyRules(ilCook, "il-cook.json"),
  assertCountyRules(njBergen, "nj-bergen.json"),
];

export function getCounty(countyId: string): CountyRules | undefined {
  return counties.find((c) => c.countyId === countyId);
}

export function getCountyBySlug(
  state: string,
  county: string,
): CountyRules | undefined {
  return getCounty(`${state.toLowerCase()}-${county.toLowerCase()}`);
}
