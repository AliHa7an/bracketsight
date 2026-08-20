"use client";

/**
 * The answer, pinned, on a phone.
 *
 * Most of the traffic these tools get is a phone arriving from a search result.
 * On a narrow screen the form and the answer cannot sit side by side, so one of
 * them is off-screen at all times — and for a person filling in fields, the one
 * that goes off-screen is the answer they came for. The whole engagement thesis
 * (interaction spec §1: "the answer can update faster than the user can type")
 * only pays off if the answer is *visible* while they type.
 *
 * So: one line, pinned to the bottom of the viewport for the length of the
 * tool, carrying the same figure the results panel leads with. Every keystroke
 * moves it, tweened through `LiveNumber`, which is what makes causality legible
 * on a screen too small to show cause and effect at once.
 *
 * Three details that are load-bearing rather than stylistic:
 *
 *   • `position: sticky`, not `fixed`, and rendered as the LAST CHILD of the
 *     tool's own container. Sticky keeps the bar in flow, so it reserves its
 *     own height and contributes nothing to CLS, and it stops at the end of the
 *     tool instead of hovering over the article and the site footer below it.
 *     A `fixed` bar also fights the consent banner, which is `fixed` at the same
 *     edge on a first visit.
 *   • `lg:hidden`. From `lg` up the results column is beside the form and
 *     already on screen; a second copy of the figure would be noise, and the
 *     design system allows exactly one hero number per screen.
 *   • The figure is not announced. It duplicates a number the results panel
 *     already renders and announces, and a value that re-announces on every
 *     keystroke makes a screen reader unusable. `aria-hidden` on the bar, with
 *     the jump link kept reachable, is the honest resolution.
 */

import type * as React from "react";

import { LiveNumber } from "./LiveNumber";

export interface StickyAnswerProps {
  /** The micro-label above the figure: "Lowest lifetime cost". */
  label: string;
  /** The figure itself, in whatever integer unit `format` reads. */
  value: number;
  format: (n: number) => string;
  /**
   * One short clause under the figure, rewritten from the result — the plan
   * that won, the distance to the cliff, the verdict. Keep it to a few words:
   * this is a single line on a 390px screen, not a summary.
   */
  caption?: React.ReactNode;
  /**
   * Paints the figure in `--flag` instead of `--signal`. For a result the
   * reader cannot undo or cannot afford to miss, per the flag law — never for a
   * figure that is merely large.
   */
  flagged?: boolean;
  /** Anchor id of the full answer, so the bar is a way back to it. */
  jumpTo?: string;
  jumpLabel?: string;
}

export function StickyAnswer({
  label,
  value,
  format,
  caption,
  flagged = false,
  jumpTo,
  jumpLabel = "See the full answer",
}: StickyAnswerProps) {
  return (
    <div
      className="hairline-t sticky z-20 -mx-4 mt-8 flex items-end justify-between gap-4 px-4 py-2.5 lg:hidden"
      /* The consent banner is fixed to the bottom on a first visit and would
         sit on top of this bar. It publishes its own height as --consent-h, so
         the answer parks above it and drops back to the floor the moment the
         banner is dismissed. Falls back to 0 when there is no banner. */
      style={{ background: "var(--paper-raised)", bottom: "var(--consent-h, 0px)" }}
    >
      <div className="min-w-0" aria-hidden="true">
        <p className="micro-label">{label}</p>
        {/* --text-step-2, not the hero's step-4: this is a reminder of the
            answer rather than the answer's own screen, and step-4 in a pinned
            bar eats a fifth of a 390px viewport. */}
        <p
          className="leading-none"
          style={{
            fontSize: "var(--text-step-2)",
            fontWeight: 500,
            color: flagged ? "var(--flag)" : "var(--signal)",
          }}
        >
          <LiveNumber value={value} format={format} />
        </p>
        {caption ? (
          <p
            className="truncate text-dim"
            style={{ fontSize: "var(--text-step--2)", marginTop: "2px" }}
          >
            {caption}
          </p>
        ) : null}
      </div>

      {jumpTo ? (
        <a
          href={`#${jumpTo}`}
          className="rounded-atlas flex min-h-11 shrink-0 items-center underline decoration-rule underline-offset-4 hover:decoration-current"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          {jumpLabel}
        </a>
      ) : null}
    </div>
  );
}
