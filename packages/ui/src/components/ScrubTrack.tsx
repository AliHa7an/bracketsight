"use client";

/**
 * M4 — scrubbing time.
 *
 * Drag along the 30-year axis and every figure on the page updates to that
 * month: balance, payment, interest waived, cumulative paid. This is what
 * turns a static chart into an exploration surface, and it is where users
 * discover the crossover point on their own rather than being told about it.
 *
 * Keyboard equivalents are complete, because a drag-only control is a dead end
 * (interaction spec §3, §7.8):
 *   ← / →              one month        ↑ / ↓        one month
 *   shift + ← / →      one year         PageUp/Dn    one year
 *   Home / End         the extremes
 * There is no key trap: this is one tabbable element and Tab leaves it.
 *
 * Pointer Events with `setPointerCapture` so mouse, pen and touch share one
 * code path and a drag that leaves the track still tracks.
 *
 * Nothing here animates. The handle follows the input in the same frame, so
 * `prefers-reduced-motion` has nothing to disable — the control is identical
 * either way.
 */

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export interface ScrubTrackProps {
  /** Length of the schedule. Months are 1-based: month 1 is the first payment. */
  months: number;
  /** The month being examined, 1-based. */
  value: number;
  onChange: (month: number) => void;
  /** Label for an axis tick. Defaults to "Yr 5". */
  renderTick?: (month: number) => ReactNode;
  /** Accessible name, also rendered above the track. */
  label: string;
  className?: string;
}

const MIN_MONTH = 1;

function yearTickStep(totalYears: number): number {
  if (totalYears <= 6) return 1;
  if (totalYears <= 12) return 2;
  if (totalYears <= 32) return 5;
  return 10;
}

export function ScrubTrack({
  months,
  value,
  onChange,
  renderTick,
  label,
  className,
}: ScrubTrackProps) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const max = Math.max(MIN_MONTH, Math.trunc(months));
  const clamp = (m: number): number =>
    Math.min(max, Math.max(MIN_MONTH, Math.round(m)));
  const current = clamp(value);
  const pct = max === MIN_MONTH ? 0 : ((current - MIN_MONTH) / (max - MIN_MONTH)) * 100;

  const emit = (next: number): void => {
    const clamped = clamp(next);
    if (clamped !== current) onChange(clamped);
  };

  const monthFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return current;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return current;
    const ratio = (clientX - rect.left) / rect.width;
    return clamp(MIN_MONTH + ratio * (max - MIN_MONTH));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const jump = event.shiftKey ? 12 : 1;
    let next: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = current - jump;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = current + jump;
        break;
      case "PageDown":
        next = current - 12;
        break;
      case "PageUp":
        next = current + 12;
        break;
      case "Home":
        next = MIN_MONTH;
        break;
      case "End":
        next = max;
        break;
      default:
        return; // every other key, Tab included, passes straight through
    }

    event.preventDefault();
    emit(next);
  };

  const totalYears = Math.max(1, Math.ceil(max / 12));
  const step = yearTickStep(totalYears);
  const ticks: number[] = [];
  for (let year = step; year <= totalYears; year += step) {
    const month = Math.min(year * 12, max);
    if (month > MIN_MONTH && !ticks.includes(month)) ticks.push(month);
  }

  const yearOf = Math.ceil(current / 12);
  const valueText = `month ${current} of ${max}, year ${yearOf}`;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={`${id}-label`} className="micro-label">
          {label}
        </span>
        <span className="num text-ink" style={{ fontSize: "var(--text-step--1)" }}>
          Month {current} · Yr {yearOf}
        </span>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-valuemin={MIN_MONTH}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={valueText}
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          event.preventDefault(); // suppresses text selection; focus is set below
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus();
          draggingRef.current = true;
          emit(monthFromClientX(event.clientX));
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;
          emit(monthFromClientX(event.clientX));
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        className="relative mt-2 h-11 w-full cursor-ew-resize select-none"
        style={{ touchAction: "pan-y" }}
      >
        {/* the axis: elapsed in ink, remaining in rule */}
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 top-1/2 h-px"
          style={{ backgroundColor: "var(--rule)" }}
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-px"
          style={{ width: `${pct}%`, backgroundColor: "var(--ink)" }}
        />

        {ticks.map((month) => {
          const tickPct =
            max === MIN_MONTH ? 0 : ((month - MIN_MONTH) / (max - MIN_MONTH)) * 100;
          return (
            <span
              key={month}
              aria-hidden="true"
              className="absolute top-1/2 w-px"
              style={{
                left: `${tickPct}%`,
                height: "6px",
                backgroundColor: "var(--rule)",
              }}
            />
          );
        })}

        {/* the handle */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 rounded-atlas"
          style={{
            left: `${pct}%`,
            width: "3px",
            height: "20px",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--ink)",
          }}
        />
      </div>

      <div aria-hidden="true" className="relative h-4 w-full">
        {ticks.map((month) => {
          const tickPct =
            max === MIN_MONTH ? 0 : ((month - MIN_MONTH) / (max - MIN_MONTH)) * 100;
          return (
            <span
              key={month}
              className="num absolute whitespace-nowrap text-dim"
              style={{
                left: `${tickPct}%`,
                // End labels pull inside the track so nothing overhangs the
                // viewport at 375px.
                transform:
                  tickPct > 92
                    ? "translateX(-100%)"
                    : tickPct < 8
                      ? "translateX(0)"
                      : "translateX(-50%)",
                fontSize: "var(--text-step--2)",
              }}
            >
              {renderTick ? renderTick(month) : `Yr ${Math.round(month / 12)}`}
            </span>
          );
        })}
      </div>
    </div>
  );
}
