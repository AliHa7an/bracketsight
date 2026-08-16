"use client";

/**
 * Dialog — focus trap, Escape to close, focus returned to whatever opened it.
 *
 * The backdrop is a FLAT scrim mixed from `--ink`: no blur, no glass, no
 * elevation. The panel is ordinary paper with a hairline, 3px radius, and the
 * title rendered as an <h2> (the one place the display face is allowed).
 *
 * Portalled to <body> so no ancestor's `overflow` or `transform` can clip it,
 * and mounted client-side only.
 */

import * as React from "react";
import { createPortal } from "react-dom";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional one-line description under the title. */
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  className,
  children,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const id = React.useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  // Remember the trigger, move focus in, and put it back on the way out.
  React.useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    restoreRef.current = active instanceof HTMLElement ? active : null;

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      restoreRef.current?.focus();
    };
  }, [open]);

  // The page behind a modal does not scroll.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (node) => node.offsetParent !== null || node === document.activeElement,
    );
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Portals have no server rendering; `open` is state-driven and false on the
  // first paint, so the client and the server agree on "nothing here yet".
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      style={{ backgroundColor: "color-mix(in srgb, var(--ink) 45%, transparent)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx("w-full max-w-lg rounded-atlas bg-paper p-6", className)}
        style={{ border: "var(--hairline-strong)", maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-dim"
                style={{ fontSize: "var(--text-step--1)" }}
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1 inline-flex size-11 shrink-0 items-center justify-center rounded-atlas text-dim transition-colors hover:text-ink"
            style={{
              transitionDuration: "var(--dur-fast)",
              transitionTimingFunction: "var(--ease)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
