"use client";

/**
 * Tooltip — opens on hover AND on focus, closes on Escape, never traps.
 *
 * The tooltip only ever describes; it never holds the only copy of anything the
 * user needs, and it holds no interactive content, so there is nothing to trap.
 * Focus events are read on the wrapper (focusin/focusout bubble), which means a
 * focusable child — a button, a link, the underlined term rendered for a plain
 * string child — is all that is required for the keyboard path.
 *
 * The panel is a flat ink block: no shadow, no arrow, 3px radius.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface TooltipProps {
  /** Plain text only — a tooltip is never a container for interactive content. */
  content: string;
  /** Where the panel sits relative to the trigger. */
  side?: "top" | "bottom";
  className?: string;
  children: React.ReactNode;
}

export function Tooltip({ content, side = "top", className, children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const tooltipId = `${id}-tooltip`;

  let cloned: React.ReactNode = null;
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<Record<string, unknown>>;
    const existing = element.props["aria-describedby"];
    cloned = React.cloneElement(element, {
      "aria-describedby": [typeof existing === "string" ? existing : undefined, tooltipId]
        .filter(Boolean)
        .join(" "),
    });
  }

  const trigger = cloned ?? (
    <span
      tabIndex={0}
      aria-describedby={tooltipId}
      className="rounded-atlas underline decoration-dotted underline-offset-4"
    >
      {children}
    </span>
  );

  return (
    <span
      className={cx("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      {trigger}
      <span
        role="tooltip"
        id={tooltipId}
        aria-hidden={!open}
        className={cx(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-atlas bg-ink px-2 py-1 text-paper",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{
          fontSize: "var(--text-step--1)",
          lineHeight: 1.35,
          visibility: open ? "visible" : "hidden",
          transition: "opacity var(--dur-fast) var(--ease)",
        }}
      >
        {content}
      </span>
    </span>
  );
}
