import type { ReactNode } from "react";

import { ToolBoundary } from "@/components/ui";
import { AdPlacement } from "@/lib/ads";
import { SECTIONS, type SectionSlug } from "@/lib/site";

import styles from "./tool.module.css";

/**
 * ToolShell — the one layout the five tool pages share.
 *
 * WHY ONE COMPONENT AND NOT FIVE COPIES. The five tools were built in five
 * repos and merged; the hub was then redesigned and they were not, so `/` and
 * `/loans` stopped looking like the same product. Five near-identical page
 * headers is how that happened, and five near-identical fixes is how it would
 * happen again. Everything visual about a tool page's frame lives here and in
 * `tool.module.css`, so a change lands on all five at once or on none.
 *
 * WHAT IT PUTS ON THE PAGE, in order — and the order IS the band rhythm:
 *
 *   1. the masthead — hairline eyebrow, a serif h1 on the hub's rung ladder, a
 *      dim lead, a mono claim strip, closed by a 1px ink rule. This is the
 *      hub's hero without the panel, and it is why a tool page now opens in the
 *      same voice the hub does.
 *   2. the workbench — the instrument itself, on paper, at the tightest
 *      spacing on the page. The ink verdict band (ToolVerdict) sits at the top
 *      of it; that is the page's centre of gravity and the tool's own to place.
 *   3. the reading band — everything written, announced by a ruled mono label
 *      and set as a colophon rather than as a second essay.
 *
 * The h1 and the standfirst are still each page's own words, and every link,
 * citation and disclosure the pages carried is passed straight through. This
 * component adds a frame; it does not edit a page's content.
 *
 * ── WHERE ADVERTISING MAY GO ON A TOOL PAGE, AND WHY IT IS DECIDED HERE ────
 * Two slots, both after the workbench closes: `tool-below-answer` on the seam
 * between the instrument and the reading band, `tool-foot` at the end of the
 * written matter. Their reserved heights, permitted creative sizes and reasons
 * are in `src/lib/ads/placements.ts`; nothing about them is decided in this
 * file beyond where they sit.
 *
 * They are wired HERE rather than in the five section layouts, which is the
 * more obvious place and the wrong one: a section layout wraps the tool page
 * AND that section's methodology, sources, changelog and editorial policy, all
 * of which are ad-free by rule. A slot in `loans/layout.tsx` would appear on
 * every one of them. `ToolShell` is used by the five instruments and by
 * nothing else, so a slot placed here lands on exactly the pages the map says
 * it may.
 *
 * THE WORKBENCH IS WRAPPED IN `<ToolBoundary>`. That is the enforcement half
 * of "never inside the input → result flow": an `<AdSlot>` rendered anywhere
 * inside the instrument — by a tool, by a component a tool uses, by a future
 * edit that looked harmless — throws in development naming the slot. The rule
 * stops being a convention someone has to remember and becomes a property of
 * the layout. See AdSlot.tsx.
 */

export type ToolShellProps = {
  /** Drives the eyebrow's section name. Same key as `data-section`. */
  section: SectionSlug;
  /** The page h1. One sentence, in the reader's words. */
  title: string;
  /** The standfirst under it. Two lines at most — the tool is the argument. */
  standfirst: ReactNode;
  /**
   * The mono claim strip. Site-wide claims only, each of which is separately
   * true and separately stated elsewhere on the page or in the section footer.
   * Omit rather than invent one.
   */
  claims?: readonly string[];
  /** Optional row under the strip: a <LastVerified>, a rule-set line. */
  meta?: ReactNode;
  /** The instrument. */
  children: ReactNode;
  /** Everything written below the instrument. */
  reading?: ReactNode;
  /** The mono label on the reading band's rule. */
  readingLabel?: string;
  /** The right-hand end of that rule: a date, a count. */
  readingMeta?: ReactNode;
};

/** Site-wide, and every one of them is stated again in the section footer. */
export const TOOL_CLAIMS = [
  "rules cited",
  "no AI arithmetic",
  "nothing stored",
  "free, no signup",
] as const;

export function ToolShell({
  section,
  title,
  standfirst,
  claims = TOOL_CLAIMS,
  meta,
  children,
  reading,
  readingLabel = "The workings",
  readingMeta,
}: ToolShellProps) {
  const name = SECTIONS.find((s) => s.slug === section)?.name ?? "Bracketsight";

  return (
    <div className={styles.root}>
      <header className={styles.masthead}>
        <div className={`${styles.shell} ${styles.mastheadInner}`}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowRule} aria-hidden="true" />
            <span className={styles.tag}>{name} · decision engine</span>
          </p>

          <h1 className={styles.title}>{title}</h1>

          <p className={styles.lead}>{standfirst}</p>

          {claims.length > 0 ? (
            <ul className={styles.claims}>
              {claims.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          ) : null}

          {meta ? <div className={styles.mastheadMeta}>{meta}</div> : null}
        </div>
      </header>

      {/* Everything the engine computes lives in here, and an ad cannot. */}
      <ToolBoundary>
        <div className={`${styles.shell} ${styles.workbench}`}>{children}</div>
      </ToolBoundary>

      {/* On the far side of the workbench's closing edge: after the answer,
          after the ledger, after the trace, after the warnings. The class is
          the page's own measure, applied to the slot itself rather than to a
          wrapper — with the switch off the placement returns null and there is
          no element on the page at all, which is what the pre-approval crawl
          checks for. */}
      <AdPlacement id="tool-below-answer" className={styles.adSlot} />

      {reading ? (
        <div className={`${styles.shell} ${styles.reading}`}>
          <div className={styles.readingHead}>
            <p className={styles.tag}>{readingLabel}</p>
            {readingMeta ? <p className={styles.tag}>{readingMeta}</p> : null}
          </div>
          {reading}
        </div>
      ) : null}

      <AdPlacement id="tool-foot" className={styles.adSlot} />
    </div>
  );
}
