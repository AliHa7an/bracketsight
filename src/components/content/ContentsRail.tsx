"use client";

/**
 * "On this page" — a contents rail for the long reference documents.
 *
 * The methodology, sources and changelog pages run to eight and fourteen
 * thousand pixels on a phone. That length is not a fault to be edited away:
 * a methodology page is an audit trail, and the reader who wants the
 * cost-sharing section wants all of it. What was missing was a way to reach
 * that section without thumbing past nine others.
 *
 * WHY THE HEADINGS ARE READ FROM THE DOM RATHER THAN PASSED IN
 * ─────────────────────────────────────────────────────────────────────────────
 * `PolicyPage` builds its rail from the same `sections` array it renders the
 * body from, so the two cannot drift. That is the better pattern and it stays
 * the pattern for pages built that way. These pages are not: they are long
 * hand-set JSX where each section is a block of bespoke markup, and hoisting
 * thirteen of those into an array would be a large, risky edit whose only
 * product is a list of links. Reading the headings the page actually rendered
 * gets the same guarantee — the rail cannot list a section that is not there,
 * or miss one that is — without touching the prose at all.
 *
 * ZERO CLS, BY CONSTRUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 * The summary bar is server-rendered at its final height and never changes.
 * The list is populated on mount, INSIDE a closed `<details>`, where it is not
 * laid out and so cannot move anything. Opening it is a user action, and layout
 * shift caused by a user action is not CLS.
 */

import * as React from "react";

interface Heading {
  id: string;
  text: string;
}

/** "The applicable percentage is interpolated" → "the-applicable-percentage…" */
function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section"
  );
}

export function ContentsRail({
  /** CSS selector for the headings to list. Defaults to the page's own h2s. */
  selector = "main h2",
  className,
}: {
  selector?: string;
  className?: string;
}) {
  const [headings, setHeadings] = React.useState<Heading[]>([]);

  React.useEffect(() => {
    const found: Heading[] = [];
    const seen = new Set<string>();

    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      // A visually hidden heading is a landmark label, not a destination.
      if (el.closest(".sr-only, .sr-only-table, [aria-hidden='true']")) continue;
      if (el.classList.contains("sr-only") || el.classList.contains("micro-label")) continue;

      const text = (el.textContent ?? "").trim();
      if (!text) continue;

      let id = el.id;
      if (!id) {
        // Assigning the id here is what makes the link work. It is derived from
        // the heading's own words, so it is stable across renders and readable
        // in a pasted URL.
        id = slugify(text);
        let n = 2;
        while (seen.has(id) || document.getElementById(id)) id = `${slugify(text)}-${n++}`;
        el.id = id;
      }
      if (seen.has(id)) continue;
      seen.add(id);

      // The headings on these pages are full sentences. The rail is an index,
      // so it takes the first clause and stops.
      const label = text.length > 72 ? `${text.slice(0, 69).replace(/[\s,;:]+\S*$/, "")}…` : text;
      found.push({ id, text: label });
    }

    setHeadings(found.length >= 3 ? found : []);
  }, [selector]);

  return (
    <nav aria-label="On this page" className={className}>
      <details className="group hairline-t hairline-b">
        <summary className="rounded-atlas flex min-h-11 cursor-pointer items-center gap-2">
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="shrink-0 transition-transform group-open:rotate-90"
            style={{ transitionDuration: "var(--dur-fast)" }}
          >
            <path d="M4 2.5 8 6l-4 3.5" />
          </svg>
          <span className="micro-label">On this page</span>
          {headings.length > 0 ? (
            <span className="num text-dim" style={{ fontSize: "var(--text-step--2)" }}>
              {headings.length}
            </span>
          ) : null}
        </summary>

        <ol
          className="m-0 flex list-none flex-col gap-0 p-0 pb-2"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          {headings.map((h, i) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className="rounded-atlas flex min-h-11 items-start gap-3 py-1 text-dim hover:text-ink"
              >
                <span className="num shrink-0 pt-[3px]" style={{ fontSize: "var(--text-step--2)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="pt-[1px]">{h.text}</span>
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
