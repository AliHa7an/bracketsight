"use client";

/**
 * One ad unit — the element the network fills, and nothing else.
 *
 * Mounted only by `AdSlot`'s `render` callback, which fires when the reserved
 * box comes within a viewport of the fold, and only when `AD_SERVING` is true.
 * It is loaded through `next/dynamic` from `AdPlacement`, so with the switch
 * off this module is a chunk that is never referenced and never requested.
 *
 * The element's class and the global it queues onto both come from
 * `NEXT_PUBLIC_AD_UNIT_TAG` rather than being written here — the same reasoning
 * that keeps the loader URL out of the source. See `network.ts`.
 *
 * ── The height is the reserve minus the label, and it is fixed ─────────────
 * `display:block` with an explicit height rather than an auto-sizing
 * full-width-responsive unit. Auto units size themselves from the container and
 * can come back taller than they were asked for; the surrounding `AdSlot`
 * clips, so the visible failure would be a creative with its bottom cut off
 * rather than a page that jumps — but a clipped ad is a wasted impression and,
 * if the call to action is what got cut, an unclickable one. Requesting the
 * size we reserved is the honest version of the same guarantee.
 *
 * ── If the network never answers ───────────────────────────────────────────
 * The box stays empty at its reserved height. That is deliberate: collapsing an
 * unfilled slot is exactly the shift this component tree exists to prevent.
 * `NEXT_PUBLIC_ADS_MODE=off` is the state where nothing is reserved at all.
 */

import * as React from "react";

import { requireAdClient, requireAdUnitId, requireUnitTag } from "./network";
import type { AdSlotSpec } from "./placements";

/**
 * The loader replaces the queue array with its own object once it runs. Until
 * then, pushing onto a plain array is how a unit queues itself — which is why a
 * unit that mounts before the loader arrives is not a race.
 */
function queue(tag: string): void {
  const globals = window as unknown as Record<string, unknown[] | undefined>;
  const existing = globals[tag];
  const array = Array.isArray(existing) ? existing : [];
  globals[tag] = array;
  array.push({});
}

export function AdUnit({ spec }: { spec: AdSlotSpec }) {
  const pushed = React.useRef(false);
  const tag = requireUnitTag();

  React.useEffect(() => {
    // Once per mount. React mounts twice in development, and a second push
    // against the same element is the network's "already have ads here" error.
    if (pushed.current) return;
    pushed.current = true;

    try {
      queue(tag);
    } catch {
      /* No loader, blocked, or offline. The reserved box stays empty. */
    }
  }, [tag]);

  return (
    <ins
      className={tag}
      style={{ display: "block", width: "100%", height: `${spec.creativeHeight}px` }}
      data-ad-client={requireAdClient()}
      data-ad-slot={requireAdUnitId(spec)}
      // Never an auto format: see the note above. The unit asks for the shape
      // that was reserved for it.
      data-ad-format={spec.format}
      data-full-width-responsive="false"
    />
  );
}
