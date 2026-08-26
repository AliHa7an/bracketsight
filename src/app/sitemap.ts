import type { MetadataRoute } from "next";

import { counties, filingFeeSummary } from "@/engines/property";
import { STATE_IDS, STATE_RULES } from "@/engines/trades";
import { listPosts, toolIndexIsIndexable, toolsWithPosts } from "@/lib/content";
import {
  countyRoute,
  stateContractRoute,
  toolIndexRoute,
  articleRoute,
  STATIC_ROUTES,
  type RouteSeo,
} from "@/lib/seo";
import {
  countyLastVerified,
  routeLastModified,
  stateLastVerified,
} from "@/lib/seo/freshness";
import { SECTIONS, SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * sitemap.xml — one entry per indexable route, and every date derived.
 *
 * ── THE URLS ────────────────────────────────────────────────────────────────
 * The static routes come from the same registry that produced their titles, so
 * a page that exists has a sitemap entry by construction and a route removed
 * from the registry leaves the sitemap in the same commit. The three
 * prerendered dynamic families are enumerated from the SAME engine exports and
 * content functions their `generateStaticParams` reads — `counties`,
 * `STATE_IDS`, `listPosts()` — so the sitemap cannot claim a page that was not
 * built, or miss one that was.
 *
 * ── THE `noindex` AGREEMENT ─────────────────────────────────────────────────
 * A URL in the sitemap that serves `noindex` is a contradiction the crawler
 * charges for: it was asked to fetch the page and then told the fetch was
 * pointless. Both halves read one predicate here. `toolIndexIsIndexable()`
 * decides whether `/guides/<tool>` is in this file AND whether its
 * `generateMetadata` emits `noindex`, through the same `indexable` flag on the
 * same `RouteSeo` object. They cannot disagree.
 *
 * ── THE DATES ───────────────────────────────────────────────────────────────
 * `lastModified` was `new Date()` on all 53 entries. Every deploy therefore
 * announced that the entire site had just changed, which was false of all of
 * them. `<lastmod>` is only used by Google where it is "consistently and
 * verifiably accurate", so a host that stamps the build clock trains the
 * crawler to discard the field — including on the pages where the date is real
 * and load-bearing, like an article re-verified against a changed regulation.
 *
 * Every date below now answers a question the page itself answers on screen:
 * an article's own `updatedAt`, a policy page's visible "last updated" stamp,
 * a county's newest citation date, a section's newest rule verification. Where
 * there is no honest answer the element is OMITTED — the protocol makes it
 * optional precisely so that is available, and an omitted date costs a little
 * crawl scheduling where an invented one costs the credibility of every other
 * date in the file. See `src/lib/seo/freshness.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  /**
   * One entry. `lastModified` is set only when a real date is available;
   * `changeFrequency` and `priority` are omitted entirely, which is not an
   * oversight — Google has stated for years that it ignores both, and a
   * per-page `priority: 0.7` is a number nobody reads that still has to be
   * kept plausible by whoever edits this file next.
   */
  function add(route: RouteSeo, derived: string | null): void {
    if (!route.indexable) return;

    /*
     * `SITE_URL` rather than `absoluteUrl("/")` for the hub: its own canonical
     * resolves to the bare origin with no trailing slash, and a sitemap that
     * declares a URL the page then canonicalises away is a self-inflicted
     * duplicate-content signal. One string, both places.
     */
    const url = route.path === "/" ? SITE_URL : absoluteUrl(route.path);
    const lastModified = route.lastModified ?? derived;

    entries.push(lastModified === null ? { url } : { url, lastModified });
  }

  /* ---- the static registry ---------------------------------------------- */

  for (const route of STATIC_ROUTES.values()) {
    add(route, routeLastModified(route.path));
  }

  /* ---- county playbooks -------------------------------------------------- */

  for (const county of counties) {
    const [state, slug] = county.countyId.split("-");
    if (!state || !slug) continue;
    add(
      countyRoute({
        state,
        county: slug,
        countyName: county.countyName,
        stateName: county.stateName,
        feeSummary: filingFeeSummary(county),
        lastModified: countyLastVerified(county.countyId),
      }),
      null,
    );
  }

  /* ---- state contract pages ---------------------------------------------- */

  for (const state of STATE_IDS) {
    add(
      stateContractRoute({
        stateId: state,
        stateName: STATE_RULES[state].stateName,
        lastModified: stateLastVerified(state),
      }),
      null,
    );
  }

  /* ---- the guides tree ---------------------------------------------------- */

  /*
   * Tool indexes below `TOOL_INDEX_MIN_POSTS` are built with `indexable:
   * false`, so `add()` drops them here and `generateMetadata` emits `noindex`
   * for them — from the same flag. Publish a third article for a tool and both
   * reverse in the same build.
   */
  for (const tool of toolsWithPosts()) {
    const section = SECTIONS.find((candidate) => candidate.slug === tool);
    if (!section) continue;
    add(
      toolIndexRoute({
        slug: section.slug,
        name: section.name,
        tagline: section.tagline,
        indexable: toolIndexIsIndexable(tool),
        lastModified: routeLastModified(`/guides/${tool}`),
      }),
      null,
    );
  }

  for (const post of listPosts()) {
    const section = SECTIONS.find((candidate) => candidate.slug === post.tool);
    add(
      articleRoute({
        slug: post.slug,
        title: post.title,
        description: post.description,
        tool: post.tool,
        toolName: section?.name ?? post.tool,
        updatedAt: post.updatedAt,
        primaryKeyword: post.primaryKeyword,
      }),
      null,
    );
  }

  return entries;
}
