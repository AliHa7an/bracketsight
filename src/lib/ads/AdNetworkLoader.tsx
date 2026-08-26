"use client";

/**
 * The ad network's loader — the one script tag, in the one place it is allowed.
 *
 * THIS COMPONENT IS NOT RENDERED BY ANY BUILD THIS REPOSITORY CURRENTLY
 * PRODUCES. It is reached only from `AdsRuntime`, which returns `null` unless
 * `AD_SERVING` is true; `AD_SERVING` is a build-time constant and is false
 * unless somebody sets `NEXT_PUBLIC_ADS_MODE=on` in the build environment. It
 * is imported through `next/dynamic`, so with the switch off its chunk is
 * referenced by no page and requested by no browser. And even then it has no
 * URL to request until `NEXT_PUBLIC_AD_LOADER_SRC` is set, which is deliberate
 * — see `network.ts`.
 *
 * When it IS rendered, it is rendered as a child of `<ConsentGate>`, which
 * renders nothing until an explicit accept is on record — not on the server,
 * not during hydration, and not in the gap between them. So the first byte of
 * the network's script cannot be requested before the reader has agreed to it,
 * and clearing that record from the footer unmounts this component on the spot,
 * in this tab and in every other open one.
 *
 * `afterInteractive` rather than `beforeInteractive`: an ad loader has no
 * business on the critical path of a page whose Core Web Vitals are the reason
 * anyone found it.
 *
 * NO PAGE-LEVEL / AUTO-ADS TAG. The loader is requested and nothing is pushed
 * to it from here. Auto ads choose their own positions from the DOM, which
 * means they would place a unit inside a calculator panel, beside a --flag
 * warning and on /privacy — every rule the placement map exists to enforce,
 * broken by a setting in a console this repository cannot see. Every unit on
 * this site is an explicit element at a position in `placements.ts`.
 */

import Script from "next/script";

import { loaderOrigin, requireLoaderSrc } from "./network";

export function AdNetworkLoader() {
  return (
    <>
      {/* Emitted only alongside the loader, so an accepting reader pays the
          handshake and a declining one contacts nobody. */}
      <link rel="preconnect" href={loaderOrigin()} crossOrigin="anonymous" />
      <Script
        id="ad-network-loader"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={requireLoaderSrc()}
      />
    </>
  );
}
