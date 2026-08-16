/**
 * User-facing plan names — named as borrowers know them.
 */

import type { PlanId } from "./types";

export const PLAN_NAMES: Record<PlanId, string> = {
  RAP: "RAP",
  IBR_OLD: "Old IBR",
  IBR_NEW: "New IBR",
  PAYE: "PAYE",
  ICR: "ICR",
  STANDARD_10: "Standard 10-year",
  TIERED_STANDARD: "Tiered Standard",
  GRADUATED: "Graduated",
  EXTENDED: "Extended",
};
