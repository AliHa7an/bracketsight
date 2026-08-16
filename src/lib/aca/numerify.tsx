import * as React from "react";

/**
 * Put engine-written sentences into the house typography.
 *
 * The engine returns whole sentences with figures already formatted inside them
 * ("Contributing $11,616 to a SEP-IRA moves you from 399% to 325% FPL…"). The
 * design system requires every figure to sit in the data face with tabular
 * numerals, and a plain string cannot carry a `<span class="num">`.
 *
 * So this splits on money and percentage tokens and wraps each one. It NEVER
 * reformats, re-rounds or re-derives anything — the characters that come out
 * are the characters that went in, only set in the right face. Anything that is
 * not a recognised figure passes through untouched.
 *
 * Years and ordinary counts are deliberately left alone: a mono "2026" in the
 * middle of a sentence reads as a code rather than a date, and hand-written
 * prose on the same pages leaves them in the body face too.
 */

/** $1,204 · −$8,730 · $1,204.37 · 399% · 9.96% */
const FIGURE_SOURCE = "−?\\$\\d[\\d,]*(?:\\.\\d+)?|\\d[\\d,]*(?:\\.\\d+)?%";
/** Split needs the capture group; the test needs a fresh, non-global regex
 *  (a shared /g regex carries `lastIndex` between calls and would skip). */
const SPLIT = new RegExp(`(${FIGURE_SOURCE})`);
const IS_FIGURE = new RegExp(`^(?:${FIGURE_SOURCE})$`);

export function numerify(text: string): React.ReactNode {
  const parts = text.split(SPLIT);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    IS_FIGURE.test(part) ? (
      <span key={`${i}-${part}`} className="num">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
