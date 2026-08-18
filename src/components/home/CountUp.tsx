"use client";

/**
 * A figure that counts up to its value once, when its group arrives.
 *
 * Rules it keeps, because a count-up is the easiest place on a page to
 * accidentally break three things at once:
 *
 *   THE FINAL VALUE IS THE MARKUP. `children` — the formatted string — is what
 *   the server renders and what a reduced-motion reader sees on first paint.
 *   The tween replaces the text only while it is running. There is no state in
 *   which the correct number is not already in the DOM.
 *
 *   IT RESERVES ITS WIDTH. `ch` units against a tabular-figure face are exact:
 *   `min-width` is set from the final string's length, so "0" and "468" occupy
 *   the same box and nothing beside it moves. That is this component's CLS
 *   contribution: zero by construction rather than by measurement.
 *
 *   IT COUNTS TO THE TRUTH. The tween runs over the numeric value and the last
 *   frame hands the DOM back to `children`, so what settles on screen is the
 *   exact string the server rendered — never a rounded approximation of it.
 *
 * Non-numeric figures — the last-checked date — pass `value={null}` and simply
 * appear with their group. Counting a date up from zero would be nonsense.
 *
 * `playing` comes from the group's `useReveal`, so one observer at the top of
 * the strip starts every cell at the same instant. Under reduced motion the
 * group never leaves "static", `playing` is true from the first render, and
 * this component still does nothing — the check below is on `reduced`, not on
 * a shorter duration.
 */

import * as React from "react";

import { useReducedMotion } from "@/components/ui";
import { DUR_SIGNATURE, easeAtlas } from "@/components/ui/motion";

/** Long enough to read as deliberate, short enough not to be a loading bar. */
const COUNT_MS = DUR_SIGNATURE * 1.6;

export interface CountUpProps {
  /** The number to count to, or null for a value that should not be counted. */
  value: number | null;
  /** The finished string. Rendered as-is on the server and under reduced motion. */
  children: string;
  /** True once the group is on screen. False holds the figure at its final value. */
  playing: boolean;
  className?: string;
}

export function CountUp({ value, children, playing, className }: CountUpProps) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (reduced || value === null || !playing) return;

    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / COUNT_MS);
      if (progress >= 1) {
        setFrame(null); // hand the DOM back to `children` — the exact string
        return;
      }
      setFrame(Math.round(value * easeAtlas(progress)).toLocaleString("en-US"));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, value, playing]);

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        // Reserve the finished width only for figures that actually tween. A
        // value that never counts needs no reservation, and reserving one for
        // an 11-character date pushed a 4-column grid off the side of a 375px
        // screen — the box was 222px wide inside a 160px column.
        minWidth: value === null ? undefined : `${children.length}ch`,
        maxWidth: "100%",
      }}
    >
      {frame ?? children}
    </span>
  );
}
