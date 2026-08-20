/**
 * One tool card. Five of these are the middle of the home page.
 *
 * Two structural rules, because they are correctness rules rather than style
 * ones:
 *
 *   ONE FOCUS STOP for the whole surface. The question is the only anchor; its
 *   ::after covers the card; the CTA underneath is a styled span, not a second
 *   link. A keyboard user gets five tab stops for five tools, not fifteen, and
 *   `:has(a:focus-visible)` puts the ring on the card so the highlighted
 *   surface is the one that will actually activate.
 *
 *   THE QUESTION IS NOT UNDERLINED. It is the largest type in the card and an
 *   underline on top of that reads as a correction rather than as a link. The
 *   whole card being clickable is what makes it obviously a link.
 *
 * The card carries `data-section={slug}`, which is the site's entire theming
 * mechanism: it redefines the six semantic colour tokens for its own subtree,
 * in whichever theme the reader is in, so the accent rule, the eyebrow, the
 * mark, the CTA border and the card's ground are all that tool's identity with
 * no colour value written here. The grid therefore previews the five identities
 * before a reader is inside one.
 *
 * The flagship — loans — spans the grid and carries a second half: a ledger of
 * three real plans with bars to scale, so the card shows the shape of the
 * answer rather than only claiming one exists. Bar widths are percentages
 * computed out of band; see LOANS_LEDGER in ./data.ts for the run they came
 * from. Every figure is in the data face with tabular figures.
 */

import Link from "next/link";
import type * as React from "react";

import { LOANS_LEDGER, type ToolCard as ToolCardModel } from "./data";
import { ToolIcon } from "./ToolIcon";
import styles from "./home.module.css";

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 8h9" />
      <path d="m8.6 4.6 3.4 3.4-3.4 3.4" />
    </svg>
  );
}

export function ToolCard({ card, index }: { card: ToolCardModel; index: number }) {
  return (
    /* The stagger index lives on the group's DIRECT child, because that is what
       the reveal CSS puts the transition-delay on. See ./RevealGroup.tsx. */
    <li className={styles.cardWrap} style={{ "--reveal-index": index } as React.CSSProperties}>
      <article
        className={`${styles.card} ${card.flagship ? styles.cardFlagship : ""}`}
        data-section={card.slug}
      >
        {/*
          The accent bleed. A flat wash of the section's own signal, painted by
          a pseudo-element under the content and revealed on hover — so the
          per-tool accent does more than draw a 3px rule at the top, and does it
          with opacity on an existing box rather than with a new one. No
          gradient, no shadow spread, no geometry change: nothing here can move
          a pixel of layout, which is what keeps CLS at zero.
        */}
        <span className={styles.cardBleed} aria-hidden="true" />

        <div className={styles.cardMain}>
          <p className={styles.cardEyebrow}>
            <span>{card.eyebrow}</span>
            {card.flagship ? <span className={styles.cardBadge}>Start here</span> : null}
            {/*
              The mark sits on a plate. Five hand-drawn marks of different ink
              density read as five different weights when they float free; a
              fixed square with a hairline of the section accent gives all five
              the same optical footprint, and gives the hover somewhere to go.
            */}
            <span className={styles.cardArt}>
              <ToolIcon slug={card.slug} size={card.flagship ? 34 : 30} />
            </span>
          </p>

          <h3 className={styles.cardQuestion}>
            <Link href={card.href} className={styles.cardLink}>
              {card.question}
            </Link>
          </h3>

          <p className={styles.cardBody}>{card.body}</p>

          {/*
            Not a link and not a button: the whole card is the link, and a
            second control inside it would be a second tab stop to the same
            place. It is `aria-hidden` because the anchor above already carries
            the destination and the label would otherwise be announced twice.
          */}
          <span className={styles.cardCta} aria-hidden="true">
            {card.cta}
            <Arrow />
          </span>

          {/* The flagship's example lives on its ledger side instead. */}
          {card.flagship ? null : (
            <p className={styles.cardExample}>
              <span className={styles.cardExampleLabel}>Worked example</span>
              <strong className={styles.cardExampleFigure}>{card.example.figure}</strong>
              {card.example.caption}
            </p>
          )}
        </div>

        {card.flagship ? (
          <div className={styles.cardData}>
            <p className={styles.cardDataHead}>
              <span>Worked example · 30-year total</span>
              <span>3 of 9</span>
            </p>

            <div className={styles.ledger}>
              {LOANS_LEDGER.map((row) => (
                <div className={styles.ledgerRow} key={row.name}>
                  <span className={styles.ledgerName}>{row.name}</span>
                  <span
                    className={`${styles.ledgerValue} ${row.key ? styles.ledgerValueKey : ""}`}
                  >
                    {row.total}
                  </span>
                  <span className={styles.ledgerBar} aria-hidden="true">
                    <span
                      className={`${styles.ledgerBarFill} ${
                        row.key ? styles.ledgerBarFillKey : ""
                      }`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </span>
                  <span className={styles.ledgerNote}>{row.note}</span>
                </div>
              ))}
            </div>

            <p className={styles.cardExample}>
              <strong className={styles.cardExampleFigure}>{card.example.figure}</strong>
              {card.example.caption}
            </p>
          </div>
        ) : null}
      </article>
    </li>
  );
}
