"use client";

/**
 * Button — three variants, no ripple, no third-party anything.
 *
 * Labels name the outcome they produce ("Compare all 9 plans"), never "Submit".
 * `md` is 44px tall (the touch-target floor); `sm` is 36px and is for dense
 * desktop-only rows — and it means that literally: below `sm` it stands back
 * up to 44px. "Desktop-dense" was being read as "small everywhere", which put
 * 36px targets under a thumb on the paycheck shift stepper and the ACA lever
 * chips, both of which are phone-first surfaces. The width and the type size
 * stay dense at every viewport; only the height obeys the floor.
 *
 * Radius is `--radius-atlas` (3px). There is no elevation: separation comes
 * from the hairline and the two paper shifts. The focus ring is the global
 * `:focus-visible` outline — never overridden here.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends Omit<React.ComponentPropsWithRef<"button">, "size"> {
  /** primary = the one outcome on the screen. secondary = alternates. ghost = tertiary. */
  variant?: ButtonVariant;
  /** md = 44px (default, touch floor). sm = 36px on desktop, 44px under `sm`. */
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-atlas font-medium",
        "transition-colors select-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" ? "min-h-11 px-4" : "min-h-11 px-3 sm:min-h-9",
        variant === "primary" && "bg-ink text-paper hover:bg-ink/90",
        variant === "secondary" && "border border-ink text-ink hover:bg-ink/5",
        variant === "ghost" && "text-dim hover:text-ink hover:bg-ink/5",
        className,
      )}
      style={{
        fontSize: size === "md" ? "var(--text-step-0)" : "var(--text-step--1)",
        transitionDuration: "var(--dur-fast)",
        transitionTimingFunction: "var(--ease)",
        ...style,
      }}
      {...props}
    />
  );
}
