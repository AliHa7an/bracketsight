import Link from "next/link";

import { SITE_NAME } from "@/lib/site";

/**
 * The logo lockup: mark + wordmark.
 *
 * The mark is a ruled document with one line picked out — the line in the fine
 * print that decides the money. It is the same drawing as the favicon
 * (src/app/icon.svg), so the tab and the header argue the same thing.
 *
 * Every fill and stroke reads a CSS custom property, never a hex value, so the
 * mark re-themes with its subtree: drop it inside a `[data-section="aca"]`
 * wrapper and the picked-out line turns clinical blue with no code change.
 * The favicon is the one place that cannot do this — a standalone SVG file has
 * no page to inherit from — so it carries the default (loans) palette.
 *
 * The wordmark is set in the BODY face. The system confines `--font-display`
 * to h1/h2, and a wordmark in the display face reads as a second title
 * competing with the page's real one. Weight and tight tracking carry it.
 */

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="3" fill="var(--ink)" />
      {/* the clauses nobody reads */}
      <g
        stroke="var(--paper)"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M7 9h18" />
        <path d="M7 14h18" />
        <path d="M7 24h12" />
      </g>
      {/* the one that decides the money */}
      <path
        d="M7 19h13"
        stroke="var(--signal)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="25" cy="19" r="2.5" fill="var(--signal)" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-atlas text-ink"
      aria-label={`${SITE_NAME} — home`}
    >
      <LogoMark />
      <span className="text-[1.0625rem] font-semibold tracking-[-0.015em]">
        {SITE_NAME}
      </span>
    </Link>
  );
}
