/**
 * SYNTHETIC DEMO DATA. Fictional parcels in a fictional neighborhood so the
 * tool demonstrates end-to-end without real county records. Every surface that
 * renders these parcels must say so — the label below is exported for that.
 *
 * KNOWN-GAP GAP-044: this is correct by design, not an oversight — recorded so
 * the labelling is never quietly dropped. No parcel carries a `municipalityId`,
 * because attaching a real New Jersey municipality to a fictional parcel would
 * imply a real place. See /KNOWN-GAPS.md.
 */

import type { Property } from "../types";
import raw from "./sample-parcels.json";

export const SAMPLE_DATA_LABEL: string = raw._label;
export const SAMPLE_NEIGHBORHOOD_ID: string = raw.neighborhoodId;
export const SAMPLE_NEIGHBORHOOD_NAME: string = raw.neighborhoodName;

export const sampleParcels: Property[] = raw.parcels as Property[];

/** The three parcels the demo highlights: strong / worth filing / looks fair. */
export const DEMO_SUBJECT_IDS = ["DEMO-001", "DEMO-002", "DEMO-003"] as const;

export function getSampleParcel(id: string): Property | undefined {
  return sampleParcels.find((p) => p.id === id);
}
