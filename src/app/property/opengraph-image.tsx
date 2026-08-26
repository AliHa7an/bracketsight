import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, sectionCard } from "@/lib/seo/og";

/**
 * The Open Graph card for every page in this section.
 *
 * One image per section rather than one per route: Next resolves
 * `opengraph-image` from the nearest ancestor segment, so this covers the tool
 * page and its methodology, sources, editorial-policy, changelog and about
 * pages at once. The headline is the section's own claim, read from the same
 * registry entry that produced the tool page's `<title>`, so the card and the
 * page cannot drift apart.
 *
 * To give one sub-page its own headline, drop a file like this one into that
 * route's folder and build the card from its own `staticRoute()` entry — the
 * template and the palette are already section-aware and need no other change.
 *
 * The default runtime, not edge: every page that uses this card is static, so
 * the PNG is written at build and no request ever reaches a renderer.
 */
const CARD = sectionCard("property");

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = CARD.alt;

export default function OpengraphImage() {
  return new ImageResponse(CARD.element, { ...OG_SIZE });
}
