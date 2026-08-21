import type { ReactNode } from "react";

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

      <div className={`${styles.shell} ${styles.workbench}`}>{children}</div>

      {reading ? (
        <div className={`${styles.shell} ${styles.reading}`}>
          <div className={styles.readingHead}>
            <p className={styles.tag}>{readingLabel}</p>
            {readingMeta ? <p className={styles.tag}>{readingMeta}</p> : null}
          </div>
          {reading}
        </div>
      ) : null}
    </div>
  );
}
