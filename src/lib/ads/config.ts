/**
 * THE SWITCH.
 *
 * One environment variable decides everything about advertising on this site.
 * Nothing else in the repository reads `process.env` for an ad decision, and
 * nothing else may: a second switch is a second thing to forget.
 *
 * ── The three states, and why there are three rather than two ──────────────
 *
 *   off      Default in production, and the state the site ships in today.
 *            A placement renders NOTHING — no box, no label, no reserved
 *            height, no element. There is no ad loader, no ad unit, and no
 *            request to a third-party origin.
 *
 *            This is not merely "ads disabled". It is the state the AdSense
 *            review depends on: a reviewer who finds a reserved grey box
 *            labelled "Advertisement" on a site that has never served an ad is
 *            looking at an ad that failed to load, and "ads that do not fill"
 *            is a rejection reason of its own. `ADSENSE-AUDIT.md` P31 records
 *            zero ad-slot placeholders anywhere on the site; `off` is what
 *            keeps that true while the placements are wired.
 *
 *   reserve  Default in development. Every mapped placement renders its fixed
 *            reserved box, labelled, with the dashed rule — and loads nothing.
 *            No loader, no unit, no third-party request. This is how the
 *            placement map is inspected, how the layout is designed against
 *            real reserved heights, and how the CLS measurements in
 *            MONETISATION.md were taken. Safe on a preview origin; never set
 *            it on the production origin before approval.
 *
 *   on       Post-approval. The reserved boxes render AND the AdSense loader
 *            is mounted — inside `<ConsentGate>`, and nowhere else, so it
 *            cannot execute before an explicit accept. See `AdsRuntime.tsx`.
 *
 * ── Why the value is inlined and not read at runtime ───────────────────────
 * `NEXT_PUBLIC_*` is substituted by the bundler at BUILD time. Setting it on a
 * running server does nothing. That is a constraint, but it is also the
 * property that makes `off` safe: with the value inlined as the string "off",
 * `AD_SERVING` is a literal `false` and the branches that reach the vendor
 * module are dead code the minifier can remove. Flipping the switch means a
 * rebuild, deliberately.
 *
 * ── Failure mode ───────────────────────────────────────────────────────────
 * A typo throws at module load, which fails the build. `NEXT_PUBLIC_ADS_MODE=one`
 * silently falling back to "off" would be a switch that looks flipped and is
 * not — the owner would spend a week wondering why nothing filled.
 */

export const AD_MODES = ["off", "reserve", "on"] as const;

export type AdMode = (typeof AD_MODES)[number];

function isAdMode(value: string): value is AdMode {
  return (AD_MODES as readonly string[]).includes(value);
}

function resolveAdMode(): AdMode {
  const raw = process.env.NEXT_PUBLIC_ADS_MODE?.trim().toLowerCase();

  if (raw && raw.length > 0) {
    if (!isAdMode(raw)) {
      throw new Error(
        `NEXT_PUBLIC_ADS_MODE is "${raw}", which is not one of ${AD_MODES.join(", ")}. ` +
          `Fix the value or unset it — a misspelled switch that quietly falls back ` +
          `to "off" is a switch the operator believes is on.`,
      );
    }
    return raw;
  }

  // Unset. Boxes visible while building, invisible in production.
  return process.env.NODE_ENV === "development" ? "reserve" : "off";
}

export const AD_MODE: AdMode = resolveAdMode();

/** True only in `on`: the loader may mount and units may request a creative. */
export const AD_SERVING: boolean = AD_MODE === "on";

/** True in `reserve` and `on`: a mapped placement paints its reserved box. */
export const AD_RESERVING: boolean = AD_MODE !== "off";

/* ─────────────────────────────────────────────────── the network, if any ── */

/**
 * THE AD NETWORK IS CONFIGURATION, NOT CODE, and the three variables below are
 * all of it. With them unset — today, and until approval — this repository and
 * every artefact built from it contain no ad-network reference of any kind.
 *
 * The reasoning is in `network.ts`, at length, and the exact values to set are
 * written out in MONETISATION.md. In short: `ADSENSE-AUDIT.md` P32 records that
 * grepping this repository for the loader's host finds comments and never
 * code, that fact is part of the case being submitted for review, and a
 * constant in a source file would have ended it — a string in a source file
 * becomes a string in a deployed JavaScript chunk whether or not any page
 * references it.
 *
 * All three are public by construction: the publisher ID is in `public/ads.txt`
 * and the loader URL would appear in the markup of every page. None is a
 * secret, and the NEXT_PUBLIC_ prefix is therefore correct — see `.env.example`
 * on why that prefix is never used for anything that is.
 */

/** The publisher ID an ad unit is served against. `ca-pub-…`. */
export const AD_CLIENT: string | null =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null;

/** The full https URL of the network's loader script. Validated in network.ts. */
export const AD_LOADER_SRC: string | null =
  process.env.NEXT_PUBLIC_AD_LOADER_SRC?.trim() || null;

/**
 * The identifier the network uses for both the class on an ad element and the
 * global queue it pushes onto. One string, because in a script-plus-element ad
 * network they are the same identifier.
 */
export const AD_UNIT_TAG: string | null =
  process.env.NEXT_PUBLIC_AD_UNIT_TAG?.trim() || null;
