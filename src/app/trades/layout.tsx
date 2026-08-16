import type { Metadata } from "next";
import type { ReactNode } from "react";

/* Layout, touch and print behaviour only — no tokens, no colour values. The
   section's identity still comes entirely from `data-section` + globals.css.
   See the header of takeoff-sheet.css for why it could not be dropped. */
import "./takeoff-sheet.css";

/**
 * The trades section — "the takeoff sheet".
 *
 * `data-section="trades"` redefines the six semantic colour tokens for this
 * subtree; the ported components read tokens only, so they take on the section
 * identity untouched. No colour values here, no per-section stylesheet.
 *
 * This is the phone-in-a-truck section: the ported components keep their larger
 * touch targets and their stacked full-size inputs below `md`.
 */

export const metadata: Metadata = {
  title: {
    default: "Free Estimate Builder for Trades — Itemised, With Ranges",
    template: "%s · Trades · Fineprint",
  },
  description:
    "Build an itemised takeoff with honest price ranges, turn it into an invoice that matches to the cent, and see which contract clauses your state requires. No signup.",
};

export default function TradesSectionLayout({ children }: { children: ReactNode }) {
  return (
    /*
     * Two elements, not one. The themed wrapper has to span the full width so
     * the section's paper reaches the edge of the viewport; the measure lives
     * on the track inside it. Collapsing them would paint the trades ground
     * only under a 72rem column and leave the site's paper down both margins.
     *
     * The trades pages carry no container of their own — in the source app
     * that job belonged to `<main>` — so it is supplied here rather than added
     * to nine page files.
     */
    <div data-section="trades" className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
