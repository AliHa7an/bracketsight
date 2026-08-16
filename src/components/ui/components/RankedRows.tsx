"use client";

/**
 * M5 — rankings that reorder in front of you.
 *
 * Flip the sort from "lowest monthly payment" to "lowest total cost" and watch
 * the winner physically move. That is this product's central insight delivered
 * as an interaction rather than a sentence, so the movement has to be legible:
 * rows keep their identity (and their colour) through the reorder, and the
 * animation is a FLIP — measure First, render Last, Invert with a transform,
 * Play — which runs entirely on the compositor and never touches layout.
 *
 * It fires ONLY when `sortKey` changes. A recalculation that happens to change
 * the order — the user nudging their income — reorders instantly, because at
 * one animation per keystroke the effect would stop being information and
 * start being noise (interaction spec §7.5).
 *
 * Under `prefers-reduced-motion: reduce` the rows are simply in their final
 * positions from the first frame. Nothing is lost: the order *is* the
 * information, and the order is in the DOM either way.
 */

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { DUR_BASE, EASE_CSS, prefersReducedMotion } from "../motion";

export interface RankedRowsProps<T extends { id: string }> {
  /** Already sorted by the caller. This component never sorts. */
  items: T[];
  /** Changing this — and only this — triggers the reorder animation. */
  sortKey: string;
  renderRow: (item: T, index: number) => ReactNode;
  className?: string;
}

function clearFlipStyles(el: HTMLElement): void {
  el.style.transition = "";
  el.style.transform = "";
  el.style.willChange = "";
}

export function RankedRows<T extends { id: string }>({
  items,
  sortKey,
  renderRow,
  className,
}: RankedRowsProps<T>) {
  const rowsRef = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevTopsRef = useRef<Map<string, number>>(new Map());
  const prevSortKeyRef = useRef<string>(sortKey);
  const rafRef = useRef<number | null>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animatingRef = useRef<HTMLLIElement[]>([]);

  // Runs on every commit: positions must be recorded continuously, because
  // the "First" measurement of a reorder is the layout of the commit *before*
  // it. `offsetTop` rather than getBoundingClientRect so a page scroll between
  // commits cannot be mistaken for movement.
  useLayoutEffect(() => {
    const nextTops = new Map<string, number>();
    for (const [id, el] of rowsRef.current) nextTops.set(id, el.offsetTop);

    const sortChanged = prevSortKeyRef.current !== sortKey;
    prevSortKeyRef.current = sortKey;

    if (sortChanged && !prefersReducedMotion()) {
      // Abandon any half-finished reorder before starting the next one.
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (settleRef.current !== null) clearTimeout(settleRef.current);
      for (const el of animatingRef.current) clearFlipStyles(el);
      animatingRef.current = [];

      const moved: HTMLLIElement[] = [];
      for (const [id, el] of rowsRef.current) {
        const before = prevTopsRef.current.get(id);
        const after = nextTops.get(id);
        if (before === undefined || after === undefined) continue;
        const dy = before - after;
        if (Math.abs(dy) < 1) continue;
        // Invert: put the row back where the eye last saw it.
        el.style.transition = "none";
        el.style.transform = `translateY(${dy}px)`;
        el.style.willChange = "transform";
        moved.push(el);
      }

      if (moved.length > 0) {
        animatingRef.current = moved;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          for (const el of moved) {
            el.style.transition = `transform ${DUR_BASE}ms ${EASE_CSS}`;
            el.style.transform = "translateY(0)";
          }
          settleRef.current = setTimeout(() => {
            settleRef.current = null;
            for (const el of moved) clearFlipStyles(el);
            animatingRef.current = [];
          }, DUR_BASE + 40);
        });
      }
    }

    prevTopsRef.current = nextTops;
  });

  useLayoutEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (settleRef.current !== null) clearTimeout(settleRef.current);
      rafRef.current = null;
      settleRef.current = null;
      animatingRef.current = [];
    };
  }, []);

  return (
    <ol className={className}>
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={(el) => {
            if (el) rowsRef.current.set(item.id, el);
            else rowsRef.current.delete(item.id);
          }}
        >
          {renderRow(item, index)}
        </li>
      ))}
    </ol>
  );
}
