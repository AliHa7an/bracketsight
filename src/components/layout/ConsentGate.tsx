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
 * It is deliberately not here. Nothing in this repository loads an ad network,
 * and the site has never served an ad. When it does, exactly one thing is
 * added, and it is added inside this component's children:
 *
 *   <ConsentGate>
 *     <Script
 *       async
 *       strategy="afterInteractive"
 *       crossOrigin="anonymous"
 *       src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-…"
 *     />
 *   </ConsentGate>
 *
 * With no ad script anywhere on the page, an <AdSlot> renders its reserved,
 * labelled, empty box and nothing else — which is why none is placed on any
 * page before approval.
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
