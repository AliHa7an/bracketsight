"use client";

/**
 * Stepper — the flow header for the multi-step form.
 *
 * A step is reachable once it has been visited, which is every step up to and
 * including the current one; steps ahead are inert text, not disabled buttons
 * that tease. The current step carries `aria-current="step"`. Numbers are set
 * in the data face like every other figure in the product.
 *
 * It wraps rather than scrolls at 375px — a horizontal scrollbar in a progress
 * header hides where the user is.
 *
 * THE CURRENT STEP IS THE SECTION'S ACCENT, NOT INK.
 *
 * It used to be a 22px ink chip and an ink label, which made the step you are
 * on the same colour as the six labels, four hints and two buttons around it —
 * so the one piece of state the header exists to communicate was the one thing
 * it did not signal. `--signal` is the right token for it: it is the colour of
 * "this is the answer / this is the live one" everywhere else in the system,
 * and using it here is the same accent doing the same job. Three signals
 * carry the state, not one: the filled chip, the label going semibold, and a
 * 2px rule under the label — so it survives greyscale and it survives colour
 * blindness. `--paper` on `--signal` is 5.40:1 at the thinnest (aca) and 8.45
 * in dark; the ratios are recorded per section in globals.css.
 *
 * The marker is 24px rather than 22px and the label steps up from
 * `--text-step--1` to `--text-step-0` on the current step only, which is the
 * other half of "small and weak": at 13.3px in a 22px chip the whole header
 * measured smaller than the field hints beneath it.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function CheckGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

export interface Step {
  id: string;
  label: string;
}

export interface StepperProps {
  steps: Step[];
  /** id of the step being shown */
  current: string;
  onNavigate: (id: string) => void;
  /** Accessible name for the nav landmark. */
  label?: string;
  className?: string;
}

export function Stepper({
  steps,
  current,
  onNavigate,
  label = "Progress",
  className,
}: StepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === current),
  );

  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isVisited = index <= currentIndex;
          const isComplete = index < currentIndex;

          const marker = (
            <span
              aria-hidden="true"
              className={cx(
                "num inline-flex size-6 shrink-0 items-center justify-center rounded-atlas",
                isCurrent && "bg-signal text-paper",
                !isCurrent && isComplete && "text-signal",
                !isVisited && "text-dim",
              )}
              style={{
                fontSize: "var(--text-step--2)",
                fontWeight: 500,
                border: isCurrent
                  ? "1px solid var(--signal)"
                  : isComplete
                    ? "1px solid color-mix(in srgb, var(--signal) 45%, transparent)"
                    : "var(--hairline)",
              }}
            >
              {isComplete ? <CheckGlyph /> : index + 1}
            </span>
          );

          return (
            <li key={step.id} className="flex items-center gap-2">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="hidden h-px w-6 sm:block"
                  style={{
                    backgroundColor: isVisited
                      ? "color-mix(in srgb, var(--signal) 55%, transparent)"
                      : "var(--rule)",
                  }}
                />
              ) : null}

              {isVisited ? (
                <button
                  type="button"
                  onClick={() => onNavigate(step.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cx(
                    "inline-flex min-h-11 items-center gap-2 rounded-atlas px-1 transition-colors",
                    isCurrent ? "font-semibold text-ink" : "text-ink hover:text-ink/70",
                  )}
                  style={{
                    fontSize: isCurrent ? "var(--text-step-0)" : "var(--text-step--1)",
                    transitionDuration: "var(--dur-fast)",
                    transitionTimingFunction: "var(--ease)",
                  }}
                >
                  {marker}
                  {/* The rule under the label is the third signal. Drawn with a
                      box-shadow rather than a border so it cannot add a pixel
                      to the button's box when the step changes. */}
                  <span
                    style={
                      isCurrent
                        ? { boxShadow: "inset 0 -2px 0 0 var(--signal)", paddingBottom: 2 }
                        : undefined
                    }
                  >
                    {step.label}
                  </span>
                  <span className="sr-only">
                    {isComplete ? " (completed)" : " (current step)"}
                  </span>
                </button>
              ) : (
                <span
                  className="inline-flex min-h-11 items-center gap-2 px-1 text-dim"
                  style={{ fontSize: "var(--text-step--1)" }}
                >
                  {marker}
                  <span>{step.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
