/**
 * The Open Graph card — one template, six palettes.
 *
 * Until now the site had none at all. A link to a page that computes a
 * household's subsidy cliff arrived in a Slack channel or a WhatsApp thread as
 * a bare grey URL, which is both the weakest possible click-through and, on a
 * money site, an active trust problem: the one surface where a stranger judges
 * whether this is a real publication was blank.
 *
 * ── WHY IT IS BUILT, NOT DRAWN ──────────────────────────────────────────────
 * A designer's PNG per page is 55 files that go stale the first time a headline
 * is edited. This is a React tree rendered by `next/og` at build time, fed from
 * the same `routes.ts` entry that produces the `<title>` — so the card and the
 * page cannot disagree about what the page says, and a new route gets a card
 * without anyone opening a design tool.
 *
 * ── NO WEBFONT ──────────────────────────────────────────────────────────────
 * `ImageResponse` is not given a `fonts` option, deliberately. The site's four
 * faces are self-hosted for Core Web Vitals reasons, and loading one of them
 * here would mean reading a font file at build for every card — for glyphs
 * nobody's browser ever sees, since the output is a PNG. The bundled default
 * is a clean grotesque, the layout is doing the identity work, and the mark
 * carries the brand. If a face is ever added, subset it to the Latin range and
 * the two weights this template uses and nothing else.
 *
 * ── SATORI CONSTRAINTS ──────────────────────────────────────────────────────
 * The renderer supports a subset of CSS: flexbox only, no grid, no `gap`
 * shorthand quirks, and every element with more than one child needs an
 * explicit `display: "flex"`. Everything below is written to that subset on
 * purpose — a style that works in the browser and silently drops here produces
 * a card that is wrong in a way nobody sees until it is already shared.
 */

import { SECTIONS, SITE_NAME, type SectionSlug } from "@/lib/site";
import { staticRoute } from "./routes";

/** 1200×630 — the size every platform crops from. Exported as the route's `size`. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_CONTENT_TYPE = "image/png";

/**
 * The card palette.
 *
 * Every card is set on the section's DARK ground, whichever theme the reader
 * has: a social card has no theme to follow, it is composited against whatever
 * chrome the platform draws, and a dark card reads as deliberate on both. The
 * values are the `--dk-*` tokens from `globals.css`, transcribed because a PNG
 * renderer cannot resolve a custom property.
 *
 * KEEP THESE IN STEP WITH globals.css. They are the one place in the codebase
 * that legitimately holds a copy of the palette, and the copy is why: the
 * cards are generated outside the document, with no cascade to inherit from.
 */
interface OgPalette {
  readonly ground: string;
  readonly ink: string;
  readonly dim: string;
  readonly accent: string;
  readonly rule: string;
}

const SHELL: OgPalette = {
  ground: "#0f151e",
  ink: "#e9eef6",
  dim: "#a0aabc",
  accent: "#45c4a8",
  rule: "#29313e",
};

const PALETTES: Readonly<Record<SectionSlug, OgPalette>> = {
  loans: { ground: "#0e1520", ink: "#e7ecf4", dim: "#9ba7bc", accent: "#4fc3a6", rule: "#29313f" },
  paycheck: { ground: "#14130f", ink: "#f0ede6", dim: "#ada69a", accent: "#4fc0b2", rule: "#33302a" },
  aca: { ground: "#0d161b", ink: "#e6eef2", dim: "#9baab3", accent: "#55bedc", rule: "#26333a" },
  property: { ground: "#15120c", ink: "#f1ebe0", dim: "#b0a692", accent: "#86c176", rule: "#322c21" },
  trades: { ground: "#11141a", ink: "#e9ebef", dim: "#a2a8b2", accent: "#6fa8e8", rule: "#2b2f36" },
};

export function ogPalette(section: SectionSlug | null): OgPalette {
  return section ? PALETTES[section] : SHELL;
}

/**
 * The mark, at 56 units.
 *
 * The same geometry as `src/app/icon.svg` — two brackets, two muted bands you
 * are not in, one accent band you are — with the accent taken from the
 * section's palette rather than fixed, so the mark belongs to the card it is
 * on. Redrawn here rather than imported because Satori rasterises SVG from
 * elements, not from a file reference, and a card must not depend on a network
 * or filesystem read at render.
 */
function Mark({ palette }: { palette: OgPalette }) {
  return (
    <svg width="56" height="56" viewBox="0 0 32 32" style={{ marginRight: 18 }}>
      <rect width="32" height="32" rx="3" fill={palette.ink} />
      <g
        fill="none"
        stroke={palette.ground}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.5 7H7.5v18h4" />
        <path d="M20.5 7h4v18h-4" />
      </g>
      <g stroke={palette.ground} strokeOpacity="0.34" strokeWidth="2" strokeLinecap="round">
        <path d="M14 11h4" />
        <path d="M14 21h4" />
      </g>
      <path d="M12.5 16h7" stroke={palette.accent} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export interface OgCardProps {
  /** The claim. One or two lines; the type scale steps down as it grows. */
  readonly headline: string;
  /** One clause under it. No full stop. */
  readonly strap: string;
  /** Picks the palette and names the section in the eyebrow. */
  readonly section: SectionSlug | null;
  /** The eyebrow's right-hand label: the section name, or a kind of page. */
  readonly kicker: string;
  /**
   * The footer strip. Site-wide claims only, each separately true and each
   * separately stated on the page itself — the same rule `ToolShell`'s visible
   * claim strip keeps. Never invent one to fill the row.
   */
  readonly claims?: readonly string[];
}

/** Every card carries these, and every page they appear on states them too. */
export const OG_CLAIMS = ["rules cited", "no AI arithmetic", "nothing stored", "free"] as const;

/**
 * The type scale.
 *
 * Three steps rather than a fluid formula, because Satori has no text metrics
 * to measure against and a headline that wraps to four lines pushes the strap
 * off the bottom of a fixed 630px canvas. The thresholds are character counts
 * that have been checked against the longest headline in the registry.
 */
function headlineSize(headline: string): number {
  if (headline.length > 74) return 54;
  if (headline.length > 46) return 64;
  return 76;
}

export function OgCard({ headline, strap, section, kicker, claims = OG_CLAIMS }: OgCardProps) {
  const palette = ogPalette(section);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: palette.ground,
        color: palette.ink,
        padding: "64px 72px",
        /* The one decorative element: a hairline of the section's accent down
           the left edge, which is the same device the tool pages use to say
           "you are inside this section". */
        borderLeft: `10px solid ${palette.accent}`,
      }}
    >
      {/* ---- eyebrow ---- */}
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <Mark palette={palette} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.4 }}>{SITE_NAME}</div>
          <div
            style={{
              fontSize: 20,
              color: palette.dim,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
        </div>
      </div>

      {/* ---- the claim ---- */}
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
        <div
          style={{
            fontSize: headlineSize(headline),
            fontWeight: 600,
            lineHeight: 1.12,
            letterSpacing: -1.4,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 28,
            lineHeight: 1.4,
            color: palette.dim,
          }}
        >
          {strap}
        </div>
      </div>

      {/* ---- the claim strip ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          paddingTop: 26,
          borderTop: `2px solid ${palette.rule}`,
          fontSize: 22,
          color: palette.dim,
        }}
      >
        {claims.map((claim, index) => (
          <div key={claim} style={{ display: "flex", alignItems: "center" }}>
            {index > 0 ? (
              <div style={{ color: palette.rule, padding: "0 16px" }}>·</div>
            ) : null}
            <div>{claim}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── the section card ── */

export interface SectionCard {
  readonly alt: string;
  readonly element: React.ReactElement;
}

/**
 * The card for a section, assembled from that section's registry entry.
 *
 * Five `opengraph-image.tsx` routes call this and differ only in the slug they
 * pass, which is the point: the five files stay four lines long, and a change
 * to the card's wording or layout lands on all five at once rather than being
 * copied into five near-identical route files that then drift.
 */
export function sectionCard(slug: SectionSlug): SectionCard {
  const section = SECTIONS.find((candidate) => candidate.slug === slug);
  if (!section) throw new Error(`sectionCard: "${slug}" is not a section.`);

  const route = staticRoute(`/${slug}`);

  return {
    alt: `${section.name} — ${route.ogHeadline}`,
    element: (
      <OgCard
        headline={route.ogHeadline}
        strap={route.ogStrap}
        section={slug}
        kicker={`${section.name} · decision engine`}
      />
    ),
  };
}
