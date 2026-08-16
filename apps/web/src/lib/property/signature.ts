"use client";

/**
 * The one orchestrated moment (interaction.md §4): comparable parcels resolve
 * onto the Comp Map, then the verdict figure counts up.
 *
 * Two components own the two halves — <CompMap> draws the parcels, the verdict
 * hero counts — so the phase boundary lives here rather than being restated in
 * both. It fires on FIRST results render only, never on a recalculation, and
 * is skipped entirely under `prefers-reduced-motion`.
 */

import * as React from "react";
import { DUR_SIGNATURE, easeAtlas, prefersReducedMotion } from "@fineprint/ui/motion";

/** Parcels resolve across the first 70% of the signature. */
export const PARCEL_PHASE = 0.7;

/** How long the parcels take to finish landing. */
export const PARCEL_MS = Math.round(DUR_SIGNATURE * PARCEL_PHASE);

/** Each parcel's own fade, so the stagger overlaps rather than flickers. */
export const PARCEL_STEP_MS = 190;

/** The verdict figure starts counting as the last parcel settles. */
export const VERDICT_DELAY_MS = PARCEL_MS;

/** …and finishes with the signature. */
export const VERDICT_COUNT_MS = DUR_SIGNATURE - PARCEL_MS;

/**
 * The second half of the moment: the verdict figure counts from zero to its
 * value as the last parcel lands.
 *
 * Fires ONCE. On any later change of `target` — a recalculation — the figure
 * simply follows, because the count-up is the reveal and a reveal that repeats
 * is noise. Under `prefers-reduced-motion` the figure is its value from the
 * first frame.
 *
 * Server and first client render both return `target`, so the markup matches
 * across hydration; the effect is a layout effect, so the reset to zero happens
 * before the browser paints and nothing flashes.
 */
export function useCountUp(
  target: number,
  delayMs: number = VERDICT_DELAY_MS,
  durationMs: number = VERDICT_COUNT_MS,
): number {
  const [shown, setShown] = React.useState(target);
  const playedRef = React.useRef(false);
  const rafRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useLayoutEffect(() => {
    if (playedRef.current) {
      setShown(target);
      return;
    }
    playedRef.current = true;

    if (durationMs <= 0 || !Number.isFinite(target) || prefersReducedMotion()) {
      setShown(target);
      return;
    }

    setShown(0);
    timerRef.current = setTimeout(() => {
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / durationMs);
        setShown(Math.round(target * easeAtlas(t)));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else rafRef.current = null;
      };
      rafRef.current = requestAnimationFrame(step);
    }, delayMs);
  }, [target, delayMs, durationMs]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  return shown;
}
