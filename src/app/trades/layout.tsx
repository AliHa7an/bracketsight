import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { TRADE_IDS, TRADE_RULES } from "@/engines/trades";
import { SectionRail } from "@/components/tool/SectionRail";

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
    template: "%s · Trades · Bracketsight",
  },
  description:
    "Build an itemised takeoff with honest price ranges, turn it into an invoice that matches to the cent, and see which clauses your state requires.",
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
    <div data-section="trades" className="flex min-h-full flex-1 flex-col">
      <SectionRail section="trades" label="Trades section" />

      {/* The container moved onto the pages. See the note in paycheck/layout —
          a tool page cannot lay out a band from inside somebody else's column,
          and this section's nine pages each already knew their own measure. */}
      <div className="flex-1">{children}</div>

      {/*
        Every page in this section carries the pricing warning, not just the
        tool. Every unit cost, labour hour, waste factor and regional multiplier
        in the three rulesets is placeholder reference data, and the staleness
        window each file sets for itself has already run out — so the honest
        statement is stronger than "prices may vary", and it belongs on the
        changelog and the contract pages too, not only where the estimate is
        built. The dates and the trade count are read from the rule files.
      */}
      <div className="hairline-t mt-16">
        <div
          className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-dim"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <p style={{ maxWidth: "var(--measure)" }}>
            This is an independent estimating and paperwork tool. It is not a quote, not a
            contract until you and your customer sign one, and not legal advice — a state&rsquo;s
            required clauses change, and a contract that matters is worth an hour of a
            construction attorney&rsquo;s time. Nothing you enter leaves your browser.
          </p>

          <p className="hairline-t pt-3" style={{ maxWidth: "var(--measure)" }}>
            Pre-launch build, and the prices are the part to be careful with. Every unit cost,
            labour hour, labour rate, waste factor, access multiplier and regional multiplier in
            all <span className="num">{TRADE_IDS.length}</span> rulesets is{" "}
            <strong className="text-ink">placeholder reference data</strong>, modelled rather
            than licensed, and none has been sanity-checked by a working contractor. Each file
            also sets its own staleness window of{" "}
            <span className="num">{TRADE_RULES.decks.staleAfterDays}</span> days from{" "}
            <span className="num">
              <time dateTime={TRADE_RULES.decks.effectiveFrom}>
                {TRADE_RULES.decks.effectiveFrom}
              </time>
            </span>
            , which has already elapsed. Use the structure — the takeoff, the assemblies, the
            ranges, the clause list — and put your own numbers over the top. The state contract
            requirements are a different matter: those are cited to statute, and where a
            statutory notice has not been transcribed word for word the generator refuses to
            produce the document rather than paraphrase it. What is settled and what is not is
            on{" "}
            <Link href="/trades/sources" className="underline underline-offset-4 hover:text-ink">
              sources
            </Link>{" "}
            and{" "}
            <Link
              href="/trades/pricing-methodology"
              className="underline underline-offset-4 hover:text-ink"
            >
              pricing methodology
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
