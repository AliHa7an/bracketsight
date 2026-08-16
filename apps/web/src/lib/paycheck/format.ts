/**
 * Formatting for the paycheck section.
 *
 * Everything general lives in `@fineprint/ui/format` and is re-exported here so
 * ported components keep one import site. The only addition is `formatBps`:
 * the paycheck engine states marginal rates in basis points, and this section
 * is the only one that turns them into prose, so it does not belong in the
 * shared package.
 */

export {
  usd,
  usdExact,
  formatCents,
  formatCentsExact,
  formatDate,
  formatPct,
  formatMonths,
  durationLabel,
  monthLabel,
} from "@fineprint/ui/format";
export type { Cents } from "@fineprint/ui/format";

import { formatPct } from "@fineprint/ui/format";

/**
 * Basis points → percent, one decimal maximum: 1200 → "12.0%".
 * The engine speaks bps everywhere; this is the only place they become prose.
 */
export function formatBps(bps: number): string {
  return formatPct(bps / 100);
}
