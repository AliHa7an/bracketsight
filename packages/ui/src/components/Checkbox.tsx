"use client";

/**
 * Checkbox — native input, 44px row, label is part of the hit area.
 *
 * The box is drawn by the UA with `accent-color: var(--ink)` so the checked
 * state stays inside the six-token palette and the platform's own focus and
 * high-contrast handling is preserved.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  className,
  "aria-describedby": describedBy,
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cx(
        "flex min-h-11 items-center gap-2.5 py-1.5",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="size-[18px] shrink-0 rounded-atlas"
        style={{ accentColor: "var(--ink)" }}
      />
      <span className="text-ink" style={{ fontSize: "var(--text-step-0)" }}>
        {label}
      </span>
    </label>
  );
}
