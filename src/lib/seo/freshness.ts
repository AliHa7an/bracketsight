/**
 * `lastModified`, derived — never the deploy time.
 *
 * The sitemap used to stamp `new Date()` on all 53 entries. Every deployment
 * therefore told Google that every page on the site had just changed, which is
 * false about fifty-two of them and useless about the fifty-third.
 *
 * That is not a cosmetic issue. `<lastmod>` is a recrawl hint; Google's own
 * documentation says it is used only if it is "consistently and verifiably
 * accurate", and a host that stamps everything with the build clock trains the
 * crawler to ignore the field entirely — including on the pages where the date
 * is real and useful, like an article that was genuinely re-verified against
 * a changed regulation last Tuesday.
 *
 * ── WHAT A DATE IS DERIVED FROM ─────────────────────────────────────────────
 * Every date below answers a question the page itself answers on screen:
 *
 *   a tool page, its methodology,   the newest `lastVerified` in that engine's
 *   sources, changelog and about    rule files — the day the rules behind the
 *                                   page were last checked, which is exactly
 *                                   what `<LastVerified>` renders on the page
 *   a county or state page          that jurisdiction's own newest citation
 *   an article                      its frontmatter `updatedAt`
 *   the guides and glossary indexes the newest date among what they list
 *   a policy page                   `POLICY_UPDATED`, the same constant the
 *                                   visible "Last updated" stamp reads
 *   the hub                         the newest rule check anywhere, which is
 *                                   the figure the proof strip already prints
 *
 * ── AND WHERE THERE IS NO HONEST ANSWER ─────────────────────────────────────
 * `null`, and the sitemap emits no `<lastmod>` for that URL. The protocol
 * makes the element optional so that this option exists. An omitted date costs
 * a little crawl scheduling; an invented one costs the credibility of every
 * other date on the file.
 *
 * SERVER ONLY — resolves rule sets during prerender.
 */

import { allCitations as acaCitations } from "@/engines/aca";
import { counties } from "@/engines/property";
import { listRuleCitations } from "@/engines/repayment";
import { STATE_RULES, TRADE_RULES, type StateId } from "@/engines/trades";
import { rulesMeta } from "@/lib/paycheck/rules-meta";

import { listPosts } from "@/lib/content/posts";
import { GLOSSARY } from "@/lib/content/glossary";
import type { SectionSlug } from "@/lib/site";

/** ISO `yyyy-mm-dd` sorts lexicographically, so `max` is a string compare. */
function newest(dates: readonly (string | null | undefined)[]): string | null {
  let best: string | null = null;
  for (const date of dates) {
    if (!date) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (best === null || date > best) best = date;
  }
  return best;
}

/* ─────────────────────────────────────────────────────── per-engine dates ── */

let memo: Readonly<Record<SectionSlug, string | null>> | null = null;

/**
 * The newest verification date in each engine's rule files.
 *
 * Read through each engine's own citation export rather than by walking
 * `src/engines/*​/rules/*.json` from disk. The engines are the authority on
 * which rule files are actually in force for a given date — `resolveRules`
 * picks by `effectiveFrom`/`effectiveTo` — so a superseded file sitting in the
 * directory cannot contribute a date to a page that does not use it.
 */
function engineDates(): Readonly<Record<SectionSlug, string | null>> {
  if (memo) return memo;

  const today = new Date().toISOString().slice(0, 10);

  const loans = newest(
    listRuleCitations(today).flatMap((set) => set.citations.map((c) => c.lastVerified)),
  );

  const paycheck = newest(rulesMeta().citations.map((c) => c.lastVerified));

  const aca = newest(acaCitations().flatMap((set) => set.citations.map((c) => c.lastVerified)));

  const property = newest(counties.flatMap((county) => county.citations.map((c) => c.lastVerified)));

  const trades = newest([
    ...Object.values(TRADE_RULES).flatMap((rules) => rules.citations.map((c) => c.lastVerified)),
    ...Object.values(STATE_RULES).flatMap((rules) => rules.citations.map((c) => c.lastVerified)),
  ]);

  memo = { loans, paycheck, aca, property, trades };
  return memo;
}

/** The newest rule check for one section, or null if that engine cites no date. */
export function sectionLastVerified(section: SectionSlug): string | null {
  return engineDates()[section];
}

/** The newest rule check anywhere on the site. What the hub's proof strip prints. */
export function siteLastVerified(): string | null {
  return newest(Object.values(engineDates()));
}

/* ───────────────────────────────────────────────────── per-page resolvers ── */

/** One county's own newest citation date. */
export function countyLastVerified(countyId: string): string | null {
  const county = counties.find((candidate) => candidate.countyId === countyId);
  if (!county) return null;
  return newest(county.citations.map((citation) => citation.lastVerified));
}

/** One state contract ruleset's own newest citation date. */
export function stateLastVerified(stateId: StateId): string | null {
  return newest(STATE_RULES[stateId].citations.map((citation) => citation.lastVerified));
}

/** The newest article review date, for `/guides` and the tool indexes. */
export function guidesLastUpdated(tool?: SectionSlug): string | null {
  const posts = tool ? listPosts().filter((post) => post.tool === tool) : listPosts();
  return newest(posts.map((post) => post.updatedAt));
}

/**
 * The glossary's date: the newest source read across its entries.
 *
 * Not every entry has been fetched — `lastVerified` is nullable there by
 * design, and the page says "not yet fetched" where it is null — so this is
 * the newest of the ones that have. Null only if none has.
 */
export function glossaryLastVerified(): string | null {
  return newest(GLOSSARY.map((entry) => entry.source.lastVerified));
}

/**
 * The date for any route that has no more specific answer than "the rules
 * behind this section were last checked then".
 *
 * Covers every page inside a section: the tool, its methodology, its sources,
 * its changelog, its about page, and the sub-tools. All five of those pages
 * are about the same rule set, and when it is re-verified all five of them
 * are, in the same commit. Returns null for a section with no dated citation
 * rather than falling through to today.
 */
export function routeLastModified(path: string): string | null {
  if (path === "/") return siteLastVerified();
  if (path === "/glossary") return glossaryLastVerified();
  if (path === "/guides") return guidesLastUpdated();

  const guideMatch = /^\/guides\/([a-z]+)$/.exec(path);
  if (guideMatch) {
    const slug = guideMatch[1] as SectionSlug;
    return guidesLastUpdated(slug);
  }

  const sectionMatch = /^\/(loans|paycheck|aca|property|trades)(\/|$)/.exec(path);
  if (sectionMatch) return sectionLastVerified(sectionMatch[1] as SectionSlug);

  return null;
}
