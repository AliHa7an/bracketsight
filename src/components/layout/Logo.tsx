import Link from "next/link";

import { SITE_NAME } from "@/lib/site";

/**
 * The logo lockup: mark + wordmark.
 *
 * The mark is the product's own argument in 32 units — a pair of brackets with
 * a sightline finding the band you land in. Every tool here is a
 * bracket-and-threshold system: RAP's AGI bands, the federal tax brackets, the
 * 400% FPL cliff, county assessment ratios, contract-value thresholds. Two grey
 * bands you are not in, one signal band you are, and a sight on it.
 *
 * Every fill and stroke reads a CSS custom property, never a hex value, so the
 * mark re-themes with its subtree: drop it inside a `[data-section="aca"]`
 * wrapper and the found band turns clinical cyan with no code change. The
 * favicon is the one place that cannot do this — a standalone SVG file has no
 * page to inherit from — so it carries the shell palette.
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
      style={{ borderRadius: "var(--radius-atlas)" }}
    >
      <rect width="32" height="32" rx="3" fill="var(--ink)" />

      {/* the brackets */}
      <g
        fill="none"
        stroke="var(--paper)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.5 7H7.5v18h4" />
        <path d="M20.5 7h4v18h-4" />
      </g>

      {/* bands you are not in: inset, muted */}
      <g
        stroke="var(--paper)"
        strokeOpacity="0.34"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M14 11h4" />
        <path d="M14 21h4" />
      </g>

      {/* the band you land in: full width, signal colour, and thicker */}
      <path d="M12.5 16h7" stroke="var(--signal)" strokeWidth="3.2" strokeLinecap="round" />
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
