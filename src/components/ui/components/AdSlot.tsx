"use client";

import * as React from "react";

/**
 * AdSlot — two guarantees, both structural rather than conventional.
 *
 * ── 1. CLS 0.00 ────────────────────────────────────────────────────────────
 * The box is a FIXED `height`, present in the very first paint, before anything
 * loads and before hydration. It was `min-height`, which only holds the floor:
 * a responsive ad unit taller than the reservation grows the box and pushes
 * every element below it down — precisely the shift this component exists to
 * prevent. A fixed height plus `overflow: hidden` means nothing the network
 * serves can move the page. Oversized creative is clipped, which is the correct
 * trade: a layout shift costs more in rankings than the extra pixels earn.
 *
 * ── 2. An ad can never be rendered inside a tool ───────────────────────────
 * "Disguised ads" is a named AdSense rejection reason, and an ad sitting inside
 * a calculator's own panel reads as part of the computed answer. Two defences:
 *
 *   a. Visual. The slot is deliberately NOT built like the rest of the system.
 *      Everything that carries tool output — AnswerBox, LedgerTable, the trace
 *      panels — sits on `--paper-raised` inside a hairline. If an ad wore that
 *      frame it would look like output. This one sits on the page's own paper,
 *      inside a dashed rule, under a permanent "Advertisement" label.
 *
 *   b. Structural. Any container showing computed output wraps its children in
 *      `<ToolBoundary>`. An AdSlot inside one refuses to render and, in
 *      development, throws with the slot id — so a wrong placement fails at the
 *      moment it is written, not after a policy reviewer finds it. This is the
 *      same fail-closed precedent the trades contract engine uses: refuse the
 *      output rather than emit something that looks fine and is not.
 *
 * Lazy: content mounts only once within a viewport of the fold. If the observer
 * is unavailable it mounts immediately rather than staying blank.
 *
 * Fails silent: if `render` throws, the slot renders nothing. No error text, no
 * broken frame — just the reserved space, which is what the layout was promised.
 *
 * v1 wires no ad network and has zero usages. What exists is the reserved,
 * labelled, guarded placeholder.
 */

/**
 * Marks a subtree as tool output. Wrap any panel that shows a computed figure.
 * Cheap to apply and the only thing that makes the placement rule enforceable.
 */
const ToolBoundaryContext = React.createContext(false);

export function ToolBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ToolBoundaryContext.Provider value={true}>{children}</ToolBoundaryContext.Provider>
  );
}

/** True when the caller sits inside a tool-output subtree. */
export function useInsideTool(): boolean {
  return React.useContext(ToolBoundaryContext);
}

export type AdSlotProps = {
  /** Reserved height in CSS pixels. The box is exactly this tall, always. */
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
  const insideTool = useInsideTool();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || insideTool) return;

    if (typeof IntersectionObserver === "undefined") {
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
      { rootMargin: "100% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [insideTool]);

  if (insideTool) {
    // Loud in development, silent in production: a reader should never see a
    // developer's mistake, but a developer must never be able to miss it.
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `AdSlot "${id}" is inside a <ToolBoundary>. An ad rendered within a ` +
          `calculator reads as part of its computed output, which is the ` +
          `"disguised ads" policy violation. Move it outside the tool panel.`,
      );
    }
    return null;
  }

  let content: React.ReactNode = null;
  if (inView && render) {
    try {
      content = render();
    } catch {
      content = null;
    }
  }

  const LABEL_LINE = 20;

  return (
    <aside
      ref={containerRef}
      id={id}
      aria-label={label}
      className={["w-full min-w-0 overflow-hidden", className].filter(Boolean).join(" ")}
      // The whole CLS guarantee, in one declaration, in the first paint.
      // Fixed, not minimum: see the note at the top of this file.
      style={{ height: `${height}px` }}
    >
      <span className="micro-label block" style={{ marginBottom: "4px" }}>
        {label}
      </span>

      {content ?? (
        <span
          aria-hidden="true"
          className="block w-full"
          style={{
            height: `${Math.max(0, height - LABEL_LINE)}px`,
            // Dashed, on the page's own paper — deliberately unlike every
            // surface that carries a computed figure.
            border: "1px dashed color-mix(in srgb, var(--ink) 20%, transparent)",
            borderRadius: "var(--radius-atlas)",
            background: "transparent",
          }}
        />
      )}
    </aside>
  );
}
