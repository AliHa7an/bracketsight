"use client";

/**
 * The browser half of a placement. Never imported by a page — `AdPlacement` is
 * the front door, it resolves the registry entry on the server, and it only
 * reaches this file when the switch is not "off".
 *
 * It imports the denylist and nothing else from the map. See `paths.ts` for
 * why the rest of the registry stays on the server.
 *
 * ── The two gates that need a browser ──────────────────────────────────────
 *
 *   THE PATH. `adsPermittedOn()` is consulted on every render against the live
 *   pathname, not against a page type the caller asserted. A slot that finds
 *   itself on /privacy, /terms, /contact or any trust page throws in
 *   development — naming the path and the placement — and renders nothing in
 *   production. A reader must never see a developer's mistake, and a developer
 *   must never be able to miss it. Same fail-loud, fail-silent shape `AdSlot`
 *   uses for the tool-boundary rule.
 *
 *   THE TOOL BOUNDARY. Handled inside `AdSlot`: a slot rendered anywhere within
 *   a `<ToolBoundary>` throws in development. `ToolShell` wraps the whole
 *   workbench in one, so "never inside the input → result flow" is a structural
 *   property of the layout rather than a convention someone remembers.
 *
 * ── Accessibility ──────────────────────────────────────────────────────────
 * `AdSlot` renders an `<aside>` whose accessible name is "Advertisement", with
 * a permanently visible label of the same word — a landmark a screen-reader
 * user skips in one keystroke. The box holds no focusable element until a
 * creative arrives, and a creative lives in an iframe of its own, so nothing
 * here can trap focus or intercept a tab sequence.
 */

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { AdSlot } from "@/components/ui";

import { AD_SERVING } from "./config";
import { adsPermittedOn } from "./paths";
import type { AdSlotSpec } from "./placements";

/** Loaded only when serving, so the ad element is not in the reserve build. */
const AdUnit = dynamic(() => import("./AdUnit").then((module) => module.AdUnit));

export function AdSlotClient({ spec, className }: { spec: AdSlotSpec; className?: string }) {
  const pathname = usePathname() ?? "";

  if (!adsPermittedOn(pathname)) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `Ad placement "${spec.id}" is rendering on ${pathname}, which carries no ` +
          `advertising. Policy pages (/privacy, /terms, /contact), the consent ` +
          `surfaces and every trust page — methodology, sources, changelog, ` +
          `editorial policy, about, authors — are ad-free by rule. See ` +
          `AD_FREE_PATHS and AD_FREE_SUFFIXES in src/lib/ads/paths.ts.`,
      );
    }
    return null;
  }

  return (
    <AdSlot
      id={spec.domId}
      height={spec.height}
      label={spec.label}
      className={className}
      render={AD_SERVING ? () => <AdUnit spec={spec} /> : undefined}
    />
  );
}
