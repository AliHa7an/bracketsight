import type { ReactNode } from "react";

import styles from "./verdict.module.css";

/**
 * ToolVerdict — the answer, on ink.
 *
 * The sentence this band carries is the emotional peak of the product: the one
 * line the reader came for, generated from their own engine result and
 * rewritten on every keystroke (M8). It was set as a grotesk h2 at the weight
 * of the field labels beside it. It is now Instrument Serif on an ink ground
 * with the section's own accent — the same two moves the hub uses for its
 * headline and its instrument panel.
 *
 * NOT MARKED "use client". It holds no state and calls no hook, so it renders
 * on the server for the pages that want it there and folds into the client
 * bundle for the four tools whose verdict is recomputed as the reader types.
 *
 * THE SENTENCE STAYS THE CALLER'S ELEMENT. Every tool announces its verdict
 * differently — `aria-live="polite"` on the loans headline, an `<h2>` that
 * names the outcome on property — and the live region has to sit on the node
 * whose text actually changes. `as` picks the tag; `sentenceProps` passes the
 * ARIA through untouched.
 */

export type ToolVerdictProps = {
  /** Mono small-caps at the head of the band: "The answer", "The verdict". */
  label: string;
  /** The right-hand end of the head rule: a status, a count, a plan name. */
  status?: ReactNode;
  /** The tag the sentence renders as. Default `p`. */
  as?: "p" | "h2";
  /** ARIA for the sentence — `aria-live`, `id`, `aria-labelledby`. */
  sentenceProps?: Record<string, string>;
  /** The sentence itself. Wrap the figure it turns on in <VerdictFigure>. */
  children: ReactNode;
  /** A trade-off line, a forgiveness note. Dim on ink. */
  note?: ReactNode;
  /** A second, quieter note under the first. */
  subNote?: ReactNode;
  /**
   * The figure the sentence is about — a <HeroNumber> with its trace. Sits
   * beside the sentence from 900px and under it below that. Every component
   * inside re-themes itself off the token remap; nothing needs a panel variant.
   */
  aside?: ReactNode;
  /**
   * Supporting figures, on the ink ground under the sentence and its hero.
   * For the tools whose answer is two or three numbers rather than one — the
   * property verdict is a gap, a yearly cost and an evidence score, and
   * splitting them across two surfaces would say they are two answers.
   */
  below?: ReactNode;
  /** Irreversible or high-stakes fact. Icon AND word, never colour alone. */
  flag?: { word: string; text: ReactNode };
  /** The provenance strip at the foot: ruleset, citation, engine version. */
  foot?: ReactNode;
  className?: string;
};

export function ToolVerdict({
  label,
  status,
  as: Tag = "p",
  sentenceProps,
  children,
  note,
  subNote,
  aside,
  below,
  flag,
  foot,
  className,
}: ToolVerdictProps) {
  return (
    <section
      aria-label={label}
      className={[styles.verdict, className].filter(Boolean).join(" ")}
    >
      <div className={styles.grid} aria-hidden="true" />

      <div className={styles.head}>
        <span className={styles.headMark}>
          <span className={styles.headDot} aria-hidden="true" />
          {label}
        </span>
        {status ? <span>{status}</span> : null}
      </div>

      <div className={styles.body}>
        <div className={aside ? styles.split : undefined}>
          <div>
            <Tag
              className={aside ? styles.sentence : `${styles.sentence} ${styles.sentenceWide}`}
              {...sentenceProps}
            >
              {children}
            </Tag>

            {note ? <p className={styles.note}>{note}</p> : null}
            {subNote ? <p className={styles.note}>{subNote}</p> : null}

            {flag ? (
              <p className={styles.flagRow}>
                <FlagGlyph />
                <span>
                  <span className={styles.flagWord}>{flag.word}</span>
                  <br />
                  {flag.text}
                </span>
              </p>
            ) : null}
          </div>

          {aside ? <div className={styles.aside}>{aside}</div> : null}
        </div>

        {below ? <div className={styles.below}>{below}</div> : null}
      </div>

      {foot ? <div className={styles.foot}>{foot}</div> : null}
    </section>
  );
}

/**
 * A figure inside the sentence. The data face, the section's accent, and the
 * only monospaced run in the line — so the number is findable without colour
 * doing the work on its own.
 */
export function VerdictFigure({ children }: { children: ReactNode }) {
  return <span className={styles.figure}>{children}</span>;
}

/* $1,204 · −$8,730 · $1,204.37 · 399% · 9.96% — the same token set
   `lib/aca/numerify` recognises, kept in step with it deliberately. */
const FIGURE_SOURCE = "−?\\$\\d[\\d,]*(?:\\.\\d+)?|\\d[\\d,]*(?:\\.\\d+)?%";
const SPLIT = new RegExp(`(${FIGURE_SOURCE})`);
const IS_FIGURE = new RegExp(`^(?:${FIGURE_SOURCE})$`);

/**
 * Set the figures inside an engine-written sentence.
 *
 * Every verdict on the site arrives as a finished string with its numbers
 * already formatted by the engine's own formatter, and a string cannot carry a
 * span. This splits on money and percentage tokens and wraps each one — it
 * NEVER reformats, re-rounds or re-derives anything, so the characters that
 * come out are the characters the engine put in. That is not a style
 * preference: an unvalidated number in generated text is the one thing this
 * codebase will not ship, and the only safe transformation on a computed
 * sentence is one that cannot change a digit.
 */
export function verdictFigures(text: string): ReactNode {
  const parts = text.split(SPLIT);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    IS_FIGURE.test(part) ? <VerdictFigure key={`${i}-${part}`}>{part}</VerdictFigure> : part,
  );
}

/** The word beside the mark is the signal; the mark is the reinforcement. */
function FlagGlyph() {
  return (
    <svg
      className={styles.flagIcon}
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 1.8 15 14H1z" />
      <path d="M8 6.2v3.4" />
      <path d="M8 11.8h.01" />
    </svg>
  );
}
