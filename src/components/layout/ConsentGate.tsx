"use client";

import * as React from "react";

import { type ConsentRecord, readConsent, subscribeToConsent } from "@/lib/consent";

/**
 * The only place a consent-gated third party may be mounted.
 *
 * Children render if, and only if, the reader has recorded an explicit accept
 * for advertising storage. Before the first effect the answer is "we have not
 * read the record yet", which renders nothing — so a script inside this gate
 * cannot execute during server rendering, during hydration, or in the gap
 * between them. Consent is checked before the first byte of the vendor is
 * requested, not after.
 *
 * ── Where the AdSense loader goes ──────────────────────────────────────────
 * Here, and nowhere else. `src/lib/ads/AdsRuntime.tsx` is the single mount
 * point, it is rendered once from the root layout, and all it does is:
 *
 *   <ConsentGate>
 *     <AdSenseLoader />
 *   </ConsentGate>
 *
 * TODAY THAT SUBTREE DOES NOT EXIST. `AdsRuntime` returns `null` unless
 * `NEXT_PUBLIC_ADS_MODE=on`, which is a build-time constant and is unset — so
 * this build contains no ad loader, emits no script tag, and contacts no
 * third-party origin. The site has never served an ad. See MONETISATION.md for
 * the exact steps that change it and for the crawl that verifies the claim.
 *
 * Two gates, deliberately independent. The switch decides whether an ad
 * network is part of the product at all; this gate decides whether a
 * particular reader has agreed to it. Neither one substitutes for the other,
 * and the loader is behind both.
 *
 * ── Withdrawal ─────────────────────────────────────────────────────────────
 * The gate is subscribed, not read once. A reader who clears their choice from
 * the footer unmounts whatever is inside it on the spot, in the same tab and in
 * every other open tab, without a reload.
 */
export function ConsentGate({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = React.useState<ConsentRecord | null | undefined>(undefined);

  React.useEffect(() => {
    setRecord(readConsent());
    return subscribeToConsent(setRecord);
  }, []);

  if (record?.ads !== "granted") return null;
  return <>{children}</>;
}
