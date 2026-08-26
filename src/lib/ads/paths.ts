/**
 * The path denylist — the one part of the placement map that has to run in the
 * browser, kept in its own module so that the rest of the map does not.
 *
 * `placements.ts` is a documented registry: every placement carries the reason
 * it sits where it does, in prose, because a map nobody can read is a map
 * nobody checks. Minification strips comments but not string literals, so
 * importing that file from a client component shipped roughly 13KB of
 * reasoning to every reader of every page — including the pages with no slot
 * on them, and including builds with advertising switched off entirely.
 *
 * So the registry stays on the server, `AdPlacement` resolves a placement into
 * a small plain object before handing it to the browser, and the only thing
 * the browser needs the map itself for is this: deciding whether the path it
 * is currently on may carry an ad at all.
 */

/**
 * Exact paths that carry no advertising under any configuration.
 *
 * /contact is here because it is the correction route an AdSense reviewer, and
 * a reader who has found a wrong figure, both use; /privacy and /terms because
 * a page describing what a site does with your data is not a place to
 * demonstrate it; /loans/privacy because the loans section carries its own.
 */
export const AD_FREE_PATHS: readonly string[] = [
  "/contact",
  "/privacy",
  "/terms",
  "/loans/privacy",
];

/**
 * Trailing segments that mark a trust page in any section. Derived from the
 * shape of the routes rather than listed one by one, so a sixth section's
 * methodology page is ad-free the day it is created and not the day someone
 * remembers to add it here.
 *
 * Trust pages are a deliberate refusal rather than an oversight. A methodology
 * page, a sources ledger and a changelog are the evidence the rest of the site
 * rests on; they are what a reviewer reads to decide whether this is a
 * publication or a landing page. Selling space beside a citation table
 * discounts the one asset the site has. They are also short-dwell pages a
 * reader arrives at to check one fact, which is the worst inventory here
 * anyway — so the principled answer and the commercial answer agree.
 */
export const AD_FREE_SUFFIXES: readonly string[] = [
  "/about",
  "/authors",
  "/methodology",
  "/pricing-methodology",
  "/sources",
  "/editorial-policy",
  "/changelog",
];

/**
 * THE PATH GATE. The browser half of a placement calls this on every render
 * against the live pathname — not against a page type the caller asserted —
 * and refuses to paint on a false.
 */
export function adsPermittedOn(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (AD_FREE_PATHS.includes(path)) return false;
  if (AD_FREE_SUFFIXES.some((suffix) => path.endsWith(suffix))) return false;

  return true;
}
