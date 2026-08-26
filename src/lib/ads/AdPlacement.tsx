/**
 * The only way to put an advertisement on a page.
 *
 * It takes a placement id and nothing else — no height, no unit, no label. A
 * position that is not in `placements.ts` is therefore not expressible, which
 * is what makes the map a map rather than a description of one. Everything
 * about the slot (its reserved height, its permitted creative sizes, its
 * disclosure label, its DOM id, and eventually its ad unit) is read from the
 * registry here, on the server.
 *
 * ── A SERVER component, and both halves of that matter ─────────────────────
 *
 * With the switch off it returns `null` before touching anything, and because
 * `AD_MODE` is a build-time constant the element below is never created — so
 * no client reference enters the RSC payload for a build that has no
 * advertising in it.
 *
 * And it resolves the placement into a small plain object before handing it to
 * the browser. That is not a micro-optimisation. The registry documents every
 * placement in prose, because a map nobody can read is a map nobody checks;
 * minification strips comments but not string literals, so importing it from a
 * client component shipped every word of that reasoning to every reader of
 * every page — measured at ~13KB on each of the 61 routes, including the ones
 * with no slot on them. The map is a server-side and build-time concern and it
 * now stays there. The browser gets seven values.
 */

import { AD_MODE } from "./config";
import { AdSlotClient } from "./AdSlotClient";
import { getPlacement, toSlotSpec, type AdPlacementId } from "./placements";

export function AdPlacement({
  id,
  className,
}: {
  id: AdPlacementId;
  /** Spacing only. The slot's own geometry comes from the registry. */
  className?: string;
}) {
  if (AD_MODE === "off") return null;
  return <AdSlotClient spec={toSlotSpec(getPlacement(id))} className={className} />;
}
