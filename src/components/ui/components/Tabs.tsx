"use client";

/**
 * Tabs — roving tabindex, arrow-key navigation, APG semantics.
 *
 * Exactly one tab is in the tab order at a time; ←/→ (or ↑/↓) move between
 * tabs, Home/End jump to the ends. Activation follows focus, which is correct
 * here because every panel in this product renders from an already-computed,
 * synchronous engine result — there is nothing to wait for.
 *
 * Panels: pass `children` and Tabs wires the tabpanel for you (labelled by the
 * active tab, focusable so the Tab key lands inside the panel next). Render the
 * panel yourself instead by using `tabPanelId(idBase, tabId)` for its id.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function tabId(base: string, id: string): string {
  return `${base}-tab-${id}`;
}

export function tabPanelId(base: string, id: string): string {
  return `${base}-panel-${id}`;
}

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  current: string;
  onChange: (id: string) => void;
  /** Accessible name for the tablist. */
  label?: string;
  /** Prefix for tab/panel ids. Generated when omitted. */
  idBase?: string;
  className?: string;
  /** Optional: the active panel's content, wired into a proper tabpanel. */
  children?: React.ReactNode;
}

export function Tabs({
  tabs,
  current,
  onChange,
  label,
  idBase,
  className,
  children,
}: TabsProps) {
  const generatedId = React.useId();
  const base = idBase ?? generatedId;
  const refs = React.useRef(new Map<string, HTMLButtonElement>());

  const enabled = tabs.filter((tab) => tab.disabled !== true);
  const activeIndex = Math.max(
    0,
    enabled.findIndex((tab) => tab.id === current),
  );

  function focusTab(index: number) {
    const target = enabled[index];
    if (!target) return;
    onChange(target.id);
    refs.current.get(target.id)?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const last = enabled.length - 1;
    if (last < 0) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusTab(activeIndex === last ? 0 : activeIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusTab(activeIndex === 0 ? last : activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(last);
        break;
      default:
        break;
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="flex flex-wrap items-end gap-x-1"
        style={{ borderBottom: "var(--hairline)" }}
      >
        {tabs.map((tab) => {
          const isCurrent = tab.id === current;
          const isDisabled = tab.disabled === true;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tabId(base, tab.id)}
              aria-selected={isCurrent}
              aria-controls={tabPanelId(base, tab.id)}
              aria-disabled={isDisabled || undefined}
              tabIndex={isCurrent ? 0 : -1}
              disabled={isDisabled}
              ref={(node) => {
                if (node) refs.current.set(tab.id, node);
                else refs.current.delete(tab.id);
              }}
              onClick={() => {
                if (!isDisabled) onChange(tab.id);
              }}
              className={cx(
                "-mb-px min-h-11 px-3 transition-colors",
                isCurrent ? "font-medium text-ink" : "text-dim hover:text-ink",
                isDisabled && "cursor-not-allowed opacity-60",
              )}
              style={{
                fontSize: "var(--text-step--1)",
                borderBottom: isCurrent
                  ? "2px solid var(--ink)"
                  : "2px solid transparent",
                transitionDuration: "var(--dur-fast)",
                transitionTimingFunction: "var(--ease)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {children !== undefined ? (
        <div
          role="tabpanel"
          id={tabPanelId(base, current)}
          aria-labelledby={tabId(base, current)}
          tabIndex={0}
          className="pt-4"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
