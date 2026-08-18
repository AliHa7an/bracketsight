import type * as React from "react";

import styles from "./policy.module.css";

/**
 * The shell the four record pages share — /terms, /privacy, /about, /authors.
 *
 * It gives each of them a masthead with a dated stamp, a contents rail built
 * from the sections themselves, and a 68ch measure. THE RAIL CANNOT DRIFT FROM
 * THE PAGE: it is rendered from the same `sections` array the body is, so a
 * heading without an anchor, or an anchor pointing at a heading that was
 * renamed, is not expressible. Adding a section to a page adds it to that
 * page's contents in the same edit.
 *
 * `updated` is the date the page's WORDS last changed, stamped in the data face
 * where a reader deciding whether a policy is current looks for it. Bump it in
 * the same commit that edits the text — a policy page carrying last year's date
 * is worse than one carrying none.
 */

export interface PolicySection {
  /** Anchor id. Stable: it is a URL people paste at each other. */
  readonly id: string;
  /** The h2 the page renders, and the label in the rail. Same string, once. */
  readonly heading: string;
  readonly children: React.ReactNode;
}

export function PolicyPage({
  eyebrow,
  title,
  standfirst,
  updated,
  stamps = [],
  intro,
  sections,
  footnote,
}: {
  /** Small-caps kicker: what kind of document this is. */
  eyebrow: string;
  title: string;
  /** One or two sentences. The page's own answer, before the sections. */
  standfirst: React.ReactNode;
  /** ISO date the wording last changed. */
  updated: string;
  /** Extra facts for the stamp line — a compile date, a scope note. */
  stamps?: readonly string[];
  /** Optional prose above the first h2. */
  intro?: React.ReactNode;
  sections: readonly PolicySection[];
  /** The closing line: what this page is not, and where the other one is. */
  footnote?: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowRule} aria-hidden="true" />
          {eyebrow}
        </p>

        <h1 className={styles.title}>{title}</h1>

        <p className={styles.standfirst}>{standfirst}</p>

        <ul className={styles.stamp}>
          <li>
            Last updated <time dateTime={updated}>{formatLong(updated)}</time>
          </li>
          {stamps.map((stamp) => (
            <li key={stamp}>{stamp}</li>
          ))}
        </ul>
      </header>

      <div className={styles.body}>
        <nav className={styles.contents} aria-label="On this page">
          <p className={styles.contentsLabel}>On this page</p>
          <ul className={styles.contentsList}>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className={styles.contentsLink}>
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.prose}>
          {intro ? <section>{intro}</section> : null}

          {sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id}>{section.heading}</h2>
              {section.children}
            </section>
          ))}

          {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
        </div>
      </div>
    </div>
  );
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "2026-08-19" → "19 August 2026". Parsed from characters, never through Date,
    so it cannot shift a day in a timezone west of UTC. */
function formatLong(iso: string): string {
  const month = MONTHS[Number(iso.slice(5, 7)) - 1];
  if (!month) return iso;
  return `${Number(iso.slice(8, 10))} ${month} ${iso.slice(0, 4)}`;
}
