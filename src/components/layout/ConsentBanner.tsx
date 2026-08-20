"use client";

import Link from "next/link";
import * as React from "react";

import {
  type ConsentRecord,
  clearConsent,
  readConsent,
  subscribeToConsent,
  writeConsent,
} from "@/lib/consent";

/**
 * The consent banner.
 *
 * ── When it runs ───────────────────────────────────────────────────────────
 * Never on the server, and not on the first client paint. The initial state is
 * "not mounted", so the server HTML and the hydrated HTML both contain no
 * banner; it appears one effect later, only if no decision is on record. That
 * ordering is deliberate: it means the banner cannot be part of the largest
 * contentful paint, cannot cause a hydration mismatch, and — the point —
 * cannot be the thing that runs before the reader has agreed to anything.
 *
 * ── What it blocks ─────────────────────────────────────────────────────────
 * Nothing that sets an advertising cookie may run until `hasAdConsent()` is
 * true, and it is false until somebody presses accept. See `src/lib/consent.ts`
 * for the two storage categories and why a calculator saving your own inputs
 * is not one of the gated ones.
 *
 * ── Why it is not a dark pattern ───────────────────────────────────────────
 * Reject and accept are the same component, the same size, the same weight,
 * the same colour, in that order — reject first. There is no "manage
 * preferences" maze standing between the reader and no, no pre-ticked box, no
 * greyed-out decline, and no wall: every word of the site is readable whatever
 * is chosen, because none of the content depends on advertising storage.
 * Escape closes the banner without granting anything, which leaves consent
 * denied — the safe default — and the footer's "Cookie choices" link brings it
 * back at any time, so withdrawing is exactly as easy as giving.
 *
 * ── Layout ─────────────────────────────────────────────────────────────────
 * `position: fixed` at the bottom of the viewport, so it is outside the
 * document flow and cannot contribute to CLS whatever it renders.
 */

const dismissedThisView = { value: false };

export function ConsentBanner() {
  const [record, setRecord] = React.useState<ConsentRecord | null | undefined>(undefined);
  const [dismissed, setDismissed] = React.useState(dismissedThisView.value);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setRecord(readConsent());
    return subscribeToConsent((next) => {
      setRecord(next);
      if (next === null) {
        dismissedThisView.value = false;
        setDismissed(false);
      }
    });
  }, []);

  const open = record === null && !dismissed;

  /**
   * Publish the banner's height as `--consent-h` while it is open.
   *
   * The banner is fixed to the bottom of the viewport, and the tool pages park
   * a sticky answer bar there too. Without this the banner sits on top of the
   * answer on a first visit — the reader is asked to make a cookie decision
   * while the number they came for is hidden behind it. The bar reads this
   * variable, so it parks above the banner and drops back to the floor the
   * moment the banner goes. Cleared on unmount so nothing is reserved for a
   * banner that is no longer there.
   */
  React.useEffect(() => {
    const root = document.documentElement;
    if (!open) {
      root.style.removeProperty("--consent-h");
      return;
    }
    const node = containerRef.current;
    if (!node) return;

    const publish = () => {
      root.style.setProperty("--consent-h", `${Math.ceil(node.getBoundingClientRect().height)}px`);
    };
    publish();

    // The banner reflows between the stacked and side-by-side layouts, so its
    // height is not a constant.
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publish);
    observer?.observe(node);

    return () => {
      observer?.disconnect();
      root.style.removeProperty("--consent-h");
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const node = containerRef.current;
    if (!node) return;

    // Focus moves to the banner, because it sits over the page and a keyboard
    // user must not have to tab past the whole document to dismiss the thing
    // covering it. The region takes focus rather than a button, so nothing is
    // pre-selected and no answer is implied.
    node.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape is a dismissal, never a decision: nothing is stored, consent
      // stays denied, and the banner returns on the next visit.
      dismissedThisView.value = true;
      setDismissed(true);
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const decide = (ads: "granted" | "denied") => {
    writeConsent(ads);
  };

  const button =
    "inline-flex min-h-11 items-center justify-center rounded-atlas px-4 font-medium hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]";

  return (
    <div
      ref={containerRef}
      data-consent-banner=""
      role="region"
      aria-label="Cookie choices"
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-40 bg-paper focus:outline-none"
      style={{ borderTop: "var(--hairline-strong)" }}
    >
      {/*
        Stacked below 640px, side by side above it. At 390px the previous
        side-by-side layout squeezed the text into a 20-character column and
        pushed the banner up over half the viewport, which is its own kind of
        dark pattern — a reader cannot weigh a choice they have to scroll.
      */}
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-x-8 gap-y-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0" style={{ fontSize: "var(--text-step--1)" }}>
          <p className="font-semibold text-ink">Cookies for advertising</p>
          <p className="mt-1 max-w-[62ch] text-dim">
            This site plans to carry advertising, and ad networks set cookies to do it. None is
            set unless you accept, and nothing here is withheld if you decline. What you type
            into a calculator stays on your own device either way —{" "}
            <Link href="/privacy" className="rounded-atlas text-ink underline underline-offset-4">
              privacy and cookies
            </Link>
            .
          </p>
        </div>

        <div className="flex w-full shrink-0 items-center gap-x-3 sm:w-auto">
          <button
            type="button"
            onClick={() => decide("denied")}
            className={`${button} flex-1 sm:flex-none text-ink`}
            style={{ border: "var(--hairline-strong)" }}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className={`${button} flex-1 sm:flex-none text-ink`}
            style={{ border: "var(--hairline-strong)" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The footer control. Renders the current decision as text and reopens the
 * banner, so a reader can change or withdraw a choice from any page in one
 * click. Hidden entirely until mounted, for the same reason as the banner.
 */
export function ConsentChoicesLink({ className }: { className?: string }) {
  const [record, setRecord] = React.useState<ConsentRecord | null | undefined>(undefined);

  React.useEffect(() => {
    setRecord(readConsent());
    return subscribeToConsent(setRecord);
  }, []);

  if (record === undefined) return null;

  const state =
    record === null
      ? "not set"
      : record.ads === "granted"
        ? "advertising cookies allowed"
        : "advertising cookies refused";

  return (
    <button
      type="button"
      // Clearing rather than toggling: the reader is asked again and makes the
      // choice, instead of the site flipping it for them.
      onClick={clearConsent}
      className={[
        "inline-flex min-h-11 items-center rounded-atlas text-left underline-offset-4 hover:text-ink hover:underline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      Cookie choices ({state})
    </button>
  );
}
