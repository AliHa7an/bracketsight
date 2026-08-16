/**
 * Comparable selection — spec §1.1 step 2:
 * same class, within radius/neighborhood, sold or assessed within the county's
 * window, size within ±20%. Deterministic filters, then a similarity ranking.
 * Every rejection is recorded with its reason so the UI can show its work.
 */

import type {
  CompCriteria,
  CompRejection,
  CompSelection,
  Property,
} from "./types";

export const DEFAULT_CRITERIA: Omit<CompCriteria, "windowMonths" | "requireSale"> = {
  sizeTolerancePct: 20,
  maxComps: 8,
};

const MS_PER_DAY = 86_400_000;

/** Whole days between two ISO dates (b − a). */
export function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(`${aIso}T00:00:00Z`);
  const b = Date.parse(`${bIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error(`invalid ISO date: ${aIso} / ${bIso}`);
  }
  return Math.round((b - a) / MS_PER_DAY);
}

/** Great-circle distance in miles (haversine). Pure math, no dependencies. */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // mean Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** The evidence date a comp's recency is judged by. */
export function evidenceDate(p: Property, requireSale: boolean): string | undefined {
  return requireSale ? p.lastSaleDate : p.assessmentDate;
}

/**
 * Similarity distance between subject and candidate — lower is more similar.
 * Weights favor living area (the dominant assessment driver), then age,
 * bed/bath count, and lot size. Used only to RANK candidates that already
 * passed the hard filters; it never admits or rejects a comp by itself.
 */
export function similarityDistance(subject: Property, candidate: Property): number {
  const sqftTerm = Math.abs(candidate.sqft - subject.sqft) / subject.sqft;
  const yearTerm = Math.abs(candidate.yearBuilt - subject.yearBuilt) / 100;
  const bedsTerm = Math.abs(candidate.beds - subject.beds) * 0.05;
  const bathsTerm = Math.abs(candidate.baths - subject.baths) * 0.05;
  const lotTerm =
    subject.lotSqft > 0
      ? (Math.abs(candidate.lotSqft - subject.lotSqft) / subject.lotSqft) * 0.25
      : 0;
  return sqftTerm + yearTerm + bedsTerm + bathsTerm + lotTerm;
}

export function selectComps(
  subject: Property,
  candidates: Property[],
  criteria: CompCriteria,
  asOfIso: string,
): CompSelection {
  const selected: Property[] = [];
  const rejected: CompRejection[] = [];
  const windowDays = Math.round(criteria.windowMonths * 30.44);
  const sizeTolerance = criteria.sizeTolerancePct / 100;

  for (const candidate of candidates) {
    if (candidate.id === subject.id) {
      rejected.push({
        property: candidate,
        reason: "IS_SUBJECT",
        detail: "This is the property being checked.",
      });
      continue;
    }
    if (candidate.class !== subject.class) {
      rejected.push({
        property: candidate,
        reason: "DIFFERENT_CLASS",
        detail: `Property class ${candidate.class} does not match subject class ${subject.class}.`,
      });
      continue;
    }
    // Location: radius when both parcels have coordinates and a radius is set;
    // otherwise the neighborhood boundary must match.
    const canUseRadius =
      criteria.radiusMiles !== undefined &&
      subject.lat !== undefined &&
      subject.lng !== undefined &&
      candidate.lat !== undefined &&
      candidate.lng !== undefined;
    if (canUseRadius) {
      const d = distanceMiles(
        subject.lat as number,
        subject.lng as number,
        candidate.lat as number,
        candidate.lng as number,
      );
      if (d > (criteria.radiusMiles as number)) {
        rejected.push({
          property: candidate,
          reason: "OUTSIDE_AREA",
          detail: `${d.toFixed(2)} miles away — beyond the ${criteria.radiusMiles}-mile radius.`,
        });
        continue;
      }
    } else if (candidate.neighborhoodId !== subject.neighborhoodId) {
      rejected.push({
        property: candidate,
        reason: "OUTSIDE_AREA",
        detail: `Different neighborhood (${candidate.neighborhoodId}).`,
      });
      continue;
    }
    const sizeDelta = Math.abs(candidate.sqft - subject.sqft);
    if (sizeDelta > subject.sqft * sizeTolerance) {
      rejected.push({
        property: candidate,
        reason: "SIZE_OUT_OF_RANGE",
        detail: `${candidate.sqft.toLocaleString("en-US")} sqft is outside ±${criteria.sizeTolerancePct}% of the subject's ${subject.sqft.toLocaleString("en-US")} sqft.`,
      });
      continue;
    }
    const evidence = evidenceDate(candidate, criteria.requireSale);
    if (criteria.requireSale && (evidence === undefined || candidate.lastSalePriceCents === undefined)) {
      rejected.push({
        property: candidate,
        reason: "NO_SALE",
        detail: "No recorded arm's-length sale; market-value analysis needs a sale price.",
      });
      continue;
    }
    if (evidence !== undefined) {
      const age = daysBetween(evidence, asOfIso);
      if (age > windowDays || age < 0) {
        rejected.push({
          property: candidate,
          reason: "DATA_TOO_OLD",
          detail: `Evidence dated ${evidence} falls outside the ${criteria.windowMonths}-month window.`,
        });
        continue;
      }
    }
    selected.push(candidate);
  }

  selected.sort(
    (a, b) => similarityDistance(subject, a) - similarityDistance(subject, b),
  );

  const kept = selected.slice(0, criteria.maxComps);
  return { selected: kept, rejected, criteria };
}
