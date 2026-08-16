import * as React from "react";

import { LiveNumber } from "./LiveNumber";

/**
 * HeroNumber — the one large number per screen. Maximum one.
 *
 * §3 of the design system: "the one hero number per screen at --step-4,
 * weight 500, with a micro-label above it. That's the only place a number gets
 * to be large." The discipline is the point — if two things on a page are this
 * size, neither reads as the answer.
 *
 * Server-renderable by default, and deliberately NOT marked "use client": a
 * content page that renders a static hero figure should ship no JavaScript for
 * it. Opting into `tween` routes the figure through <LiveNumber> (M2) so it
 * counts to its new value instead of jumping — which is what you want on a
 * screen where the hero number IS the thing the reader is editing. Tabular
 * figures mean the tween cannot shift a pixel of layout, and <LiveNumber>
 * checks `prefers-reduced-motion` itself and swaps instantly under it.
 *
 * `tween` is only usable from a client component. `format` is a function, so a
 * tweening hero necessarily lives inside a client subtree; every editable
 * surface already is one. With `tween` false (the default) the component stays
 * a plain server render.
 */

export type HeroNumberDelta = {
  /** Signed. Negative renders with a minus sign, never parentheses. */
  value: number;
  /** What the delta is measured against: "vs Standard over 30 years". */
  label: string;
  /**
   * Overrides the mechanical sign→colour rule. Needed because a *negative*
   * delta is usually the good outcome here (paying less), and painting a
   * saving in oxide red would break the flag law. Default is "auto":
   * negative → flag, positive → ink.
   */
  tone?: "auto" | "signal" | "flag" | "neutral";
};

export type HeroNumberProps = {
  /** The micro-label above the figure. Sentence case; rendered in caps by CSS. */
  label: string;
  value: number;
  /** From `../format` — formatCents, formatPct, formatMonths. */
  format: (n: number) => string;
  delta?: HeroNumberDelta;
  /**
   * The "how this was calculated" affordance. Never state a computed figure
   * without one — pass a <TraceDisclosure> or <SourceCitation> here.
   */
  footnote?: React.ReactNode;
  /** Ties the figure to its own label for assistive tech. */
  id?: string;
  /**
   * Count to the new value instead of jumping to it (M2). Opt-in: only the
   * figure that answers the screen's own question should count itself up, and
   * only where the reader is editing the inputs that move it.
   *
   * NAMING: the merged design system standardised on `tween` / `tweenMs`.
   * ClearPaycheck's local copy called this `live`; that name is not carried
   * over, because `Live*` is the prefix this system uses for components
   * (LiveNumber, LiveWarnings) and a boolean prop reading `live` invited the
   * two to be confused. `tween` also has somewhere to put the duration.
   */
  tween?: boolean;
  /** Tween duration. Defaults to --dur-base (200ms); the signature moment is 700. */
  tweenMs?: number;
  className?: string;
};

export function HeroNumber({
  label,
  value,
  format,
  delta,
  footnote,
  id,
  tween = false,
  tweenMs,
  className,
}: HeroNumberProps) {
  const labelId = id ? `${id}-label` : undefined;

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
      <span className="micro-label" id={labelId}>
        {label}
      </span>

      <span
        id={id}
        aria-labelledby={labelId}
        className="num text-ink"
        style={{
          fontSize: "var(--text-step-4)",
          fontWeight: 500,
          lineHeight: 1.1,
          letterSpacing: "-0.011em",
        }}
      >
        {tween ? (
          <LiveNumber value={value} format={format} durationMs={tweenMs} />
        ) : (
          format(value)
        )}
      </span>

      {delta ? <DeltaLine delta={delta} format={format} /> : null}

      {footnote ? (
        <div className="mt-1" style={{ fontSize: "var(--text-step--1)" }}>
          {footnote}
        </div>
      ) : null}
    </div>
  );
}

function DeltaLine({
  delta,
  format,
}: {
  delta: HeroNumberDelta;
  format: (n: number) => string;
}) {
  const tone = delta.tone ?? "auto";
  const negative = delta.value < 0;

  // The sign is always carried by the glyph, so colour is never doing the work
  // alone: formatters emit U+2212 for negatives and we prefix "+" for gains.
  const magnitude = format(Math.abs(delta.value));
  const signed = negative ? `−${magnitude}` : `+${magnitude}`;

  const toneClass =
    tone === "auto"
      ? negative
        ? "num-negative"
        : "text-ink"
      : tone === "signal"
        ? "text-signal"
        : tone === "flag"
          ? "num-negative"
          : "text-ink";

  return (
    <span
      className="flex items-baseline gap-2"
      style={{ fontSize: "var(--text-step--1)" }}
    >
      <span className={`num ${toneClass}`} style={{ fontWeight: 500 }}>
        {signed}
      </span>
      <span className="text-dim">{delta.label}</span>
    </span>
  );
}
