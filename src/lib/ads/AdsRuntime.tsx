/**
 * The single mount point for everything third-party about advertising.
 *
 * Rendered once, from the root layout, beside the consent banner. Two gates
 * stand between it and a network request, and they are independent:
 *
 *   1. THE SWITCH. `AD_SERVING` is a build-time constant. With
 *      `NEXT_PUBLIC_ADS_MODE` unset or "off" — the default, and production
 *      today — this component returns `null` and the elements below are never
 *      created, so no client reference to the loader enters the RSC payload
 *      and its chunk is requested by nobody. A build with no advertising in it
 *      ships no advertising JavaScript.
 *
 *   2. CONSENT. Even with the switch on, `<ConsentGate>` renders nothing until
 *      the reader has explicitly accepted advertising storage. It is
 *      subscribed rather than read once, so withdrawing consent from the
 *      footer unmounts the loader immediately, in this tab and in every other
 *      open one, without a reload.
 *
 * A server component on purpose: the switch is resolved during render on the
 * server, and nothing here needs the browser. Nothing else in the repository
 * may mount an ad script — if a second mount point ever appears, one of these
 * two gates is being bypassed.
 */

import { ConsentGate } from "@/components/layout/ConsentGate";

import { AdNetworkLoader } from "./AdNetworkLoader";
import { AD_SERVING } from "./config";

export function AdsRuntime() {
  if (!AD_SERVING) return null;

  return (
    <ConsentGate>
      <AdNetworkLoader />
    </ConsentGate>
  );
}
