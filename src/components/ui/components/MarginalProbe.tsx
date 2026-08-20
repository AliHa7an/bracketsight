"use client";

/**
 * M3 — the marginal probe.
 *
 * A slider that reports the DERIVATIVE, not the level: "each additional
 * $1,000 of income costs you $340 a year." Federal repayment is a system of
 * thresholds and phase-outs, so the marginal rate — not the balance — is the
 * decision. It is also the mechanic people cannot stop touching.
 *
 * Built on a native `<input type="range">`, which means arrow keys, PageUp /
 * PageDown, Home / End and touch all work without being reimplemented, and the
 * control is announced correctly. The derivative is carried in
 * `aria-valuetext`, so a screen-reader user gets the marginal figure on every
 * step — the same information the sighted user reads off the sentence.
 *
 * Nothing animates here: the readout tracks the pointer within the frame. That
 * is deliberate — a 200ms tween chasing a drag would lag behind the thumb.
 */

import { useId } from "react";

export interface MarginalProbeProps {
  /** "Your income". Also used in the sentence, first letter lowered. */
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  /** The step is also the unit the derivative is quoted per: "each $1,000…". */
  step: number;
  /** Reserved: every probe currently formats through `format`. */
  unit: "cents";
  /**
   * The engine-derived marginal effect at `v`.
   * `delta` > 0 costs the borrower money, < 0 saves it.
   * `per` is the period it is quoted over: "/year", "a year", "per month".
   */
  derive: (v: number) => { delta: number; per: string };
  /** Formats the LEVEL — the readout, the step label and the track's ends. */
  format: (n: number) => string;
  /**
   * Formats the DERIVATIVE, when it is not in the same unit as the level.
   * Defaults to `format`, which is right for the income probes (dollars of
   * income → dollars of credit). Trades slides a percentage and reads back
   * dollars, so the two cannot share one formatter without printing the
   * marginal cents as a percent.
   */
  formatDelta?: (n: number) => string;
  /**
   * The verb pair for a positive / negative `delta`. Defaults to the phase-out
   * reading, where moving the probe up is something happening TO the reader:
   * "each additional $1,000 of income costs you $340 a year."
   *
   * Trades inverts the subject — the contractor SETS the number rather than
   * being subject to it — so it supplies "adds" / "takes off" and puts the
   * object in `per`: "each additional 1.0% of margin adds $187 to the price."
   * Only the verb is overridable; the sentence shape, the `aria-valuetext` and
   * the describedby wiring stay identical, so the mechanic reads the same in
   * every section and a screen reader gets the derivative either way.
   */
  verbs?: { up: string; down: string };
  className?: string;
}

/** "/year" joins tight; "a year" needs its space. */
function joinPer(per: string): string {
  if (!per) return "";
  return /^[/%]/.test(per) ? per : ` ${per}`;
}

function lowerFirst(text: string): string {
  return text.length > 1 && text.slice(1) === text.slice(1).toLowerCase()
    ? text.charAt(0).toLowerCase() + text.slice(1)
    : text;
}

export function MarginalProbe({
  label,
  value,
  onChange,
  min,
  max,
  step,
  derive,
  format,
  formatDelta,
  verbs = { up: "costs you", down: "saves you" },
  className,
}: MarginalProbeProps) {
  const id = useId();
  const sentenceId = `${id}-marginal`;

  const { delta, per } = derive(value);
  const direction = delta > 0 ? verbs.up : delta < 0 ? verbs.down : null;
  const magnitude = (formatDelta ?? format)(Math.abs(delta));
  const stepLabel = format(step);

  const sentence = direction
    ? `Each additional ${stepLabel} of ${lowerFirst(label)} ${direction} ${magnitude}${joinPer(
        per,
      )}.`
    : `Another ${stepLabel} of ${lowerFirst(label)} changes nothing here.`;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="micro-label">
          {label}
        </label>
        <output
          htmlFor={id}
          className="num text-ink"
          style={{ fontSize: "var(--text-step-1)", fontWeight: 500 }}
        >
          {format(value)}
        </output>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        aria-describedby={sentenceId}
        aria-valuetext={`${format(value)} — ${sentence}`}
        className="mt-2 block h-11 w-full cursor-ew-resize bg-transparent"
        style={{ accentColor: "var(--ink)" }}
      />

      <div className="flex items-baseline justify-between">
        <span className="num micro-label" style={{ textTransform: "none" }}>
          {format(min)}
        </span>
        <span className="num micro-label" style={{ textTransform: "none" }}>
          {format(max)}
        </span>
      </div>

      {/* The derivative. Not a live region: it is reachable via
          aria-describedby on focus, and repeated on every step through
          aria-valuetext, so announcing it twice would only add noise. */}
      <p
        id={sentenceId}
        className="mt-2 text-ink"
        style={{ fontSize: "var(--text-step--1)", lineHeight: 1.35 }}
      >
        {direction ? (
          <>
            Each additional <span className="num">{stepLabel}</span> of {lowerFirst(label)}{" "}
            {direction} <span className="num">{magnitude}</span>
            {joinPer(per)}.
          </>
        ) : (
          <>
            Another <span className="num">{stepLabel}</span> of {lowerFirst(label)} changes
            nothing here.
          </>
        )}
      </p>
    </div>
  );
}
