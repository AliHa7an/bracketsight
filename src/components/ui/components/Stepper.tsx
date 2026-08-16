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
                "num inline-flex size-[22px] shrink-0 items-center justify-center rounded-atlas",
                isCurrent && "bg-ink text-paper",
                !isCurrent && isComplete && "text-ink",
                !isVisited && "text-dim",
              )}
              style={{
                fontSize: "var(--text-step--2)",
                border: isCurrent
                  ? "1px solid var(--ink)"
                  : isComplete
                    ? "var(--hairline-strong)"
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
                  style={{ backgroundColor: "var(--rule)" }}
                />
              ) : null}

              {isVisited ? (
                <button
                  type="button"
                  onClick={() => onNavigate(step.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cx(
                    "inline-flex min-h-11 items-center gap-2 rounded-atlas px-1 transition-colors",
                    isCurrent ? "font-medium text-ink" : "text-ink hover:text-ink/70",
                  )}
                  style={{
                    fontSize: "var(--text-step--1)",
                    transitionDuration: "var(--dur-fast)",
                    transitionTimingFunction: "var(--ease)",
                  }}
                >
                  {marker}
                  <span>{step.label}</span>
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
