/**
 * The ad-network adapter.
 *
 * ── Why this file names no ad network ──────────────────────────────────────
 * It would be shorter to write the loader URL here as a constant. It is not
 * written here, and that is the single most deliberate decision in this
 * directory.
 *
 * `ADSENSE-AUDIT.md` P32 records a verified fact about this repository: grep it
 * for the ad network's script host and you find comments and documentation,
 * never code. That fact is part of the case the site is submitting for review,
 * and the first version of this module quietly ended it — a constant in a
 * source file becomes a string in a JavaScript chunk on the deployed origin,
 * whether or not any page references it. Unreferenced bytes are not a policy
 * violation, but "we do not ship the loader" is a much better sentence than
 * "we ship the loader's URL in a chunk nothing loads".
 *
 * So the vendor is CONFIGURATION, exactly like the site origin and the
 * publisher ID already are. With the four variables unset — today, and until
 * the day approval arrives — the repository and every artefact built from it
 * contain no ad-network reference at all.
 *
 * This is not obfuscation. The exact values are written out in full in
 * MONETISATION.md, in the runbook, ready to paste. The point is that they live
 * in a document until somebody decides to serve ads, rather than in the build
 * from the day the slots were wired.
 *
 * It also buys something real: the placement system has no vendor in it. If
 * the network is ever changed, this file's four variables change and nothing
 * else does.
 *
 * ── Nothing here runs before the switch ────────────────────────────────────
 * Every export throws when `AD_SERVING` is false, and the two components that
 * call them are reached only through a branch the bundler resolves to `false`
 * at build time.
 */

import { AD_CLIENT, AD_LOADER_SRC, AD_MODE, AD_SERVING, AD_UNIT_TAG } from "./config";
import type { AdSlotSpec } from "./placements";

function requireServing(what: string): void {
  if (!AD_SERVING) {
    throw new Error(
      `${what} was reached with NEXT_PUBLIC_ADS_MODE="${AD_MODE}". Nothing in ` +
        `this module may run unless the switch is "on". This is a bug in the ` +
        `caller, not a reason to relax the check.`,
    );
  }
}

function missing(variable: string, what: string): never {
  throw new Error(
    `NEXT_PUBLIC_ADS_MODE is "on" but ${variable} is unset, so ${what}. ` +
      `NEXT_PUBLIC_* values are inlined at BUILD time — setting it on the ` +
      `running server has no effect. Set it in the build environment and ` +
      `redeploy. The exact value to use is in MONETISATION.md, ` +
      `"Flipping the switch".`,
  );
}

/**
 * The loader URL, validated.
 *
 * Validated rather than trusted because it arrives from an environment
 * variable: a typo here is a script tag pointing somewhere unintended on every
 * page of a finance site, which is the one failure in this directory with a
 * real-world cost. https only, no credentials, and a `.js` path.
 */
export function requireLoaderSrc(): string {
  requireServing("requireLoaderSrc()");
  if (!AD_LOADER_SRC) {
    missing("NEXT_PUBLIC_AD_LOADER_SRC", "there is no loader to request");
  }

  let url: URL;
  try {
    url = new URL(AD_LOADER_SRC);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_AD_LOADER_SRC is "${AD_LOADER_SRC}", which is not a URL.`,
    );
  }

  if (url.protocol !== "https:") {
    throw new Error(
      `NEXT_PUBLIC_AD_LOADER_SRC uses ${url.protocol}. A third-party script on a ` +
        `finance site loads over https or it does not load.`,
    );
  }
  if (url.username || url.password) {
    throw new Error("NEXT_PUBLIC_AD_LOADER_SRC carries credentials. Remove them.");
  }
  if (!url.pathname.endsWith(".js")) {
    throw new Error(
      `NEXT_PUBLIC_AD_LOADER_SRC has path "${url.pathname}", which is not a script.`,
    );
  }

  return url.toString();
}

/** The origin to preconnect. Derived from the loader, never configured twice. */
export function loaderOrigin(): string {
  return new URL(requireLoaderSrc()).origin;
}

/**
 * The tag name the network uses for BOTH the class on an ad element and the
 * global queue array it pushes onto. One string, one variable — they are the
 * same identifier in every script-plus-`<ins>` ad network, and configuring
 * them separately would let them drift apart into a silent no-fill.
 */
export function requireUnitTag(): string {
  requireServing("requireUnitTag()");
  if (!AD_UNIT_TAG) {
    missing("NEXT_PUBLIC_AD_UNIT_TAG", "an ad element has no class to carry");
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(AD_UNIT_TAG)) {
    throw new Error(
      `NEXT_PUBLIC_AD_UNIT_TAG is "${AD_UNIT_TAG}". It is used as a CSS class and ` +
        `as a global identifier, so it must be a plain identifier.`,
    );
  }
  return AD_UNIT_TAG;
}

/** The publisher ID the units are served against. */
export function requireAdClient(): string {
  requireServing("requireAdClient()");
  if (!AD_CLIENT) {
    missing("NEXT_PUBLIC_AD_CLIENT", "there is no publisher ID to serve against");
  }
  if (!AD_CLIENT.startsWith("ca-pub-")) {
    throw new Error(
      `NEXT_PUBLIC_AD_CLIENT is "${AD_CLIENT}". The ad tag wants the ca-pub- ` +
        `form; public/ads.txt carries the bare pub- form and the two are not ` +
        `interchangeable.`,
    );
  }
  return AD_CLIENT;
}

/** The unit id for a placement, or a legible failure. */
export function requireAdUnitId(spec: AdSlotSpec): string {
  requireServing("requireAdUnitId()");
  if (!spec.adUnitId) {
    throw new Error(
      `Placement "${spec.id}" has no adUnitId. Create the unit in the publisher ` +
        `console at the size this slot reserves (${String(spec.creativeHeight)}px of ` +
        `creative height), then put its slot id in src/lib/ads/placements.ts. An ad ` +
        `element with no unit id renders a blank box, which is worse than no ad.`,
    );
  }
  return spec.adUnitId;
}
