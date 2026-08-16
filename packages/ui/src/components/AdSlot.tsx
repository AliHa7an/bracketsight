"use client";

import * as React from "react";

/**
 * AdSlot — CLS 0.00 is a component guarantee, not a hope.
 *
 * The slot's height is reserved by an inline `min-height` that is present in
 * the very first paint, before anything loads and before hydration. Nothing
 * this component does afterwards — coming into view, rendering, failing — can
 * change the box's height, so nothing below it can ever move. A layout shift
 * from an ad costs more in rankings than the ad earns.
 *
 * Lazy: content mounts only once the slot is within a viewport of the fold,
 * via IntersectionObserver. If the observer is unavailable the slot mounts
 * immediately rather than staying blank.
 *
 * Fails silent: if `render` throws, the slot renders nothing at all. No error
 * text, no broken frame, no apology — just the reserved space, which is what
 * the layout was promised.
 *
 * v1 wires no ad network. What ships is the reserved, labelled placeholder.
 */

export type AdSlotProps = {
  /** Reserved height in CSS pixels. Must match the creative's real height. */
  height: number;
  /** Stable slot identifier — also the element id the network would target. */
  id: string;
  /**
   * The ad payload, mounted only when in view. Called inside a try/catch;
   * throwing renders nothing. Omit in v1.
   */
  render?: () => React.ReactNode;
  /** Disclosure label. Ads must always be labelled as ads. */
  label?: string;
  className?: string;
};

export function AdSlot({ height, id, render, label = "Advertisement", className }: AdSlotProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer: mount anyway rather than leave the slot permanently
      // blank. Deferred to a task so it lands as a normal update rather than
      // a cascading render inside the effect body.
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      // One viewport of lead time: loaded by the time it is looked at, but
      // never loaded for a reader who stops above it.
      { rootMargin: "100% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  let content: React.ReactNode = null;
  if (inView && render) {
    try {
      content = render();
    } catch {
      // Renders nothing on failure. The reserved height stays.
      content = null;
    }
  }

  return (
    <aside
      ref={containerRef}
      id={id}
      aria-label={label}
      className={["w-full min-w-0 overflow-hidden", className].filter(Boolean).join(" ")}
      // The whole guarantee, in one declaration, in the first paint.
      style={{ minHeight: `${height}px` }}
    >
      <span className="micro-label block" style={{ marginBottom: "4px" }}>
        {label}
      </span>

      {content ?? (
        <span
          aria-hidden="true"
          className="hairline-all block w-full rounded-atlas"
          style={{
            // Height minus the label line, so the reserved box is exactly the
            // height the caller asked for.
            minHeight: `${Math.max(0, height - 20)}px`,
            borderRadius: "var(--radius-atlas)",
            background: "var(--paper-raised)",
          }}
        />
      )}
    </aside>
  );
}
