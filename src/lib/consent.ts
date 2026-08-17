/**
 * Cookie and advertising-storage consent.
 *
 * Self-hosted, no SDK, no vendor, no dependency. A consent management platform
 * is a third-party script that reads every page load before the reader has
 * agreed to anything, which is the thing consent is supposed to prevent. This
 * file is about a hundred lines and does the same job for the one category of
 * storage this site will ever have.
 *
 * ── The model ──────────────────────────────────────────────────────────────
 * There are exactly two categories of browser storage on this site.
 *
 *   ESSENTIAL — exempt from consent, and never gated here.
 *     · what a calculator saves so you can close the tab and come back. It is
 *       stored because you asked for the calculation; it is your own data; it
 *       never leaves your device; and nothing reads it but the tool that wrote
 *       it. That is the "strictly necessary for a service explicitly requested
 *       by the subscriber" limb, and it is the reason this banner does not
 *       block the tools.
 *     · the consent record itself, below. Storing "you said no" is the only
 *       way to stop asking.
 *
 *   ADVERTISING — blocked until the reader opts in.
 *     Everything an ad network sets: frequency capping, measurement, and the
 *     identifiers behind personalised ads. No advertising runs on this site
 *     today and no ad loader is present, so today this category is empty and
 *     the gate below is what makes sure it stays empty until somebody agrees.
 *
 * ── Defaults ───────────────────────────────────────────────────────────────
 * Denied. Silence is not consent, closing the banner is not consent, and
 * scrolling is not consent. `hasAdConsent()` returns false until an explicit
 * accept is recorded, which means an integration mistake fails closed.
 *
 * ── What is deliberately not here ──────────────────────────────────────────
 * No server call, no consent-string encoding, no vendor list, no IAB TCF
 * signal. Those matter when a page carries dozens of third-party vendors. This
 * site carries none. Adding a CMP later is a swap of this module, not a
 * rewrite of the pages that read it.
 */

/** Bumped when the categories change; an old record then no longer counts. */
export const CONSENT_VERSION = 1;

/** `localStorage` key. Namespaced so it cannot collide with a tool's own key. */
export const CONSENT_STORAGE_KEY = "bracketsight.consent.v1";

/** Fired on the window whenever the decision changes, in this tab. */
export const CONSENT_EVENT = "bracketsight:consent";

export type ConsentDecision = "granted" | "denied";

export type ConsentRecord = {
  /** Advertising and measurement storage. */
  readonly ads: ConsentDecision;
  /** ISO-8601 instant the reader decided. Proof of when, for a complaint. */
  readonly at: string;
  readonly version: number;
};

function isRecord(value: unknown): value is ConsentRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ConsentRecord>;
  return (
    (candidate.ads === "granted" || candidate.ads === "denied") &&
    typeof candidate.at === "string" &&
    candidate.version === CONSENT_VERSION
  );
}

/**
 * The stored decision, or `null` when the reader has not decided — which is
 * what makes the banner appear. Returns `null` on the server and on any
 * storage failure (private mode, storage disabled, corrupted value), because
 * "we do not know" and "we could not ask" both mean no consent.
 */
export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Records a decision and notifies this tab. Writing "denied" is a real write:
 * a reader who declines should not be asked again on every page.
 */
export function writeConsent(ads: ConsentDecision): ConsentRecord {
  const record: ConsentRecord = {
    ads,
    at: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* Storage refused. The decision still applies for this page view. */
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }));
  }
  return record;
}

/**
 * Clears the record so the banner asks again. This is what "change your
 * choice" runs; withdrawing has to be as easy as giving, and it is the same
 * one click.
 */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

/**
 * THE GATE. Nothing that sets an advertising cookie, loads an ad network's
 * script or reports a measurement event may run unless this returns true.
 *
 * When the AdSense loader is added, it is added behind this — see
 * `src/components/layout/ConsentGate.tsx`, which is the only place a
 * consent-gated script should ever be mounted.
 */
export function hasAdConsent(): boolean {
  return readConsent()?.ads === "granted";
}

/** Subscribes to decision changes in this tab. Returns an unsubscribe. */
export function subscribeToConsent(listener: (record: ConsentRecord | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener(readConsent());
  window.addEventListener(CONSENT_EVENT, handler);
  // Another tab deciding counts too: the reader made one choice, not one per tab.
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
