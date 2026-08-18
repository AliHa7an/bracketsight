"use client";

/**
 * One entrance mechanic for the whole home page.
 *
 * `useReveal` returns a ref and a phase. Attach the ref to the group you want
 * to animate in, and put the phase on it as `data-reveal`; `home.module.css`
 * styles `[data-reveal="pending"]` and `[data-reveal="in"]`. Stagger is a
 * `--reveal-index` custom property on the children, so the delay is CSS's
 * problem rather than a chain of timers.
 *
 * Three properties this has to hold, in priority order:
 *
 *   NO-JS AND SSR RENDER FINISHED. The server phase is "static", which no
 *   direction styles, so the markup arrives fully visible. Nothing is hidden
 *   by default and then revealed by script — a failed hydration leaves a
 *   readable page, not an empty one.
 *
 *   REDUCED MOTION IS NOT A FADED-DOWN VERSION. When the user asks for reduced
 *   motion the hook never leaves "static": no fade, no translate, no delay,
 *   and the count-up that reads `phase` renders its final value on the first
 *   paint. It is not a shorter animation; there is no animation.
 *
 *   NOTHING CAN GET STUCK HIDDEN. The element is only put into "pending"
 *   inside a layout effect — before paint, so there is no flash of finished
 *   content — and only after we have decided how it will leave. If it is
 *   already on screen it goes straight to "in" on the next frame. If
 *   IntersectionObserver is missing, it goes straight to "in" too. The
 *   observer is an optimisation, never the only exit.
 *
 * Opacity and transform only. Both are composited, neither reflows, so the
 * whole mechanic contributes nothing to CLS.
 */

import * as React from "react";

import { useReducedMotion } from "@/components/ui";

export type RevealPhase = "static" | "pending" | "in";

export function useReveal<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  phase: RevealPhase;
  /**
   * True only once the group has actually been released on screen. Starts
   * false and stays false under reduced motion, so a count-up can never start
   * from a first-paint render that has not decided yet.
   */
  playing: boolean;
} {
  const ref = React.useRef<T>(null);
  const reduced = useReducedMotion();
  const [phase, setPhase] = React.useState<RevealPhase>("static");

  React.useLayoutEffect(() => {
    if (reduced) {
      setPhase("static");
      return;
    }
    const node = ref.current;
    if (!node) return;

    // Already in view on first paint (the hero, and the proof strip on a tall
    // desktop viewport): hide it now, then release it on the next frame so the
    // transition has two states to run between.
    const rect = node.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight * 0.9;
    setPhase("pending");

    if (onScreen || typeof IntersectionObserver !== "function") {
      const raf = requestAnimationFrame(() => setPhase("in"));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPhase("in");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return { ref, phase, playing: phase === "in" };
}
