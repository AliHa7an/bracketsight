/**
 * @/lib/ads — the entire monetisation surface of this site, in one directory.
 *
 * That is deliberate. Advertising is the one subsystem where a change made in
 * the wrong place is invisible until a policy reviewer finds it, so there is
 * exactly one directory to read, one switch to check, and one table that says
 * where a slot may go. Pages import `AdPlacement` and nothing else.
 *
 *   config.ts            the switch: off | reserve | on, and the network config
 *   placements.ts        the placement map, invariants asserted at module load
 *   paths.ts             the denylist — the only part of the map the browser sees
 *   AdPlacement.tsx      the only way to render a slot (server; null when off)
 *   AdSlotClient.tsx     its browser half: the path gate and the reserved box
 *   article.tsx          how the in-article slot finds its section boundary
 *   article-outline.ts   server-only: an article's H2 outline, read from source
 *   network.ts           the adapter — and why it names no ad network
 *   AdUnit.tsx           the ad element — reached only when the switch is on
 *   AdNetworkLoader.tsx  the loader — reached only through ConsentGate
 *   AdsRuntime.tsx       the single mount point, in the root layout
 *
 * `MONETISATION.md` at the repository root is the human-readable version of
 * the map, plus the runbook for flipping the switch after approval.
 *
 * `article.tsx` and `article-outline.ts` are NOT re-exported here: they read
 * the filesystem and belong to the article template alone. Importing them from
 * a client component would be a build error with a confusing message.
 */

export { AdPlacement } from "./AdPlacement";
export { AD_MODE, AD_MODES, AD_RESERVING, AD_SERVING, type AdMode } from "./config";
export { AdsRuntime } from "./AdsRuntime";
export { AD_FREE_PATHS, AD_FREE_SUFFIXES, adsPermittedOn } from "./paths";
export {
  AD_FREE_PAGE_TYPES,
  AD_NEIGHBOURS,
  AD_PAGE_TYPES,
  AD_PLACEMENT_IDS,
  AD_PLACEMENT_LIST,
  AD_PLACEMENTS,
  FORBIDDEN_NEIGHBOURS,
  RESERVE_BANNER,
  RESERVE_RECTANGLE,
  creativeHeight,
  getPlacement,
  placementsFor,
  slotDomId,
  toSlotSpec,
  type AdNeighbour,
  type AdPageType,
  type AdPlacement as AdPlacementSpec,
  type AdPlacementId,
  type AdReservation,
  type AdSlotSpec,
} from "./placements";
