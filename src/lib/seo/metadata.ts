/**
 * The one function that turns a registry entry into Next's `Metadata`.
 *
 * Every page in `src/app` now exports either `pageMetadata("/some/path")` or
 * `routeMetadata(<a derived RouteSeo>)`, and nothing else. That is the whole
 * interface, and it is deliberately too narrow to write a title through: the
 * words come from `routes.ts`, where they can be measured against each other.
 *
 * ── CANONICALS ARE RELATIVE, ALWAYS ─────────────────────────────────────────
 * `alternates.canonical` is a path, never an absolute URL. The root layout
 * sets `metadataBase` from `SITE_URL`, and Next resolves the path against it
 * at render — so a preview deployment canonicalises to itself instead of to
 * production, and the origin exists in exactly one place.
 *
 * This is the tag the site got wrong once already, in the other direction: it
 * shipped with `NEXT_PUBLIC_SITE_URL` unset, `metadataBase` fell back to
 * localhost, and every canonical on the site resolved to `http://localhost:3000`
 * — 53 of 53 URLs in error in Search Console. `src/lib/site.ts` now fails the
 * production build rather than let that happen silently. The rule this file
 * keeps is the other half of it: never write the origin twice.
 *
 * ── WHY NON-ARTICLE ROUTES DECLARE NO `openGraph` AT ALL ────────────────────
 * This is the non-obvious part, and it was found by measuring the built HTML
 * rather than by reading the docs.
 *
 * Next resolves `opengraph-image.tsx` by walking up the segment tree, and it
 * merges the resolved image — absolute URL, dimensions, type, alt — into the
 * page's Open Graph metadata. But a page that declares its OWN `openGraph`
 * object at a DEEPER segment than the image file replaces the resolved one
 * outright, image included. The first pass here set `openGraph` on all 55
 * routes; the result was that `/loans` carried a card (its image file is in
 * the same segment as its page) and `/loans/about` carried none. Nine of 55
 * routes had an image and 46 shipped a bare-URL preview — the exact defect
 * this work exists to fix, reintroduced by the fix.
 *
 * So non-article routes declare no `openGraph` here. Next fills `og:title` and
 * `og:description` from `title` and `description`, `og:type`, `og:site_name`
 * and `og:locale` come from the root layout, and the nearest ancestor
 * `opengraph-image.tsx` supplies the card. All 55 routes get one.
 *
 * Articles are the exception and are safe: `src/app/guides/[slug]/` holds both
 * `page.tsx` and its own `opengraph-image.tsx`, so the declaration and the
 * image are at the same segment and merge. That is what buys articles their
 * `article:published_time`, `article:modified_time` and `og:url`.
 *
 * `openGraph.images` is never written by hand anywhere. Hand-written entries
 * are how a card ends up declaring dimensions the image does not have.
 */

import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/site";
import { staticRoute, type RouteSeo } from "./routes";

/** The Metadata for any route, static or derived. */
export function routeMetadata(route: RouteSeo, extra?: ArticleFacets): Metadata {
  return {
    /*
     * `absolute` rather than a bare string: a bare title is fed through the
     * nearest `title.template`, and this site had two levels of them adding 14
     * and 30 characters to strings that were written to fit without them. The
     * templates are gone; this makes it impossible to reintroduce one by
     * accident, because the string here is the string in the <head>.
     */
    title: { absolute: route.title },
    description: route.description,

    alternates: { canonical: route.path },

    /* See the note at the top of this file: declared for articles only. */
    ...(extra
      ? {
          openGraph: {
            type: "article" as const,
            url: route.path,
            siteName: SITE_NAME,
            locale: "en_US",
            title: route.title,
            description: route.description,
            publishedTime: extra.publishedAt,
            modifiedTime: extra.updatedAt,
            authors: [extra.author],
            section: extra.sectionName,
            tags: [...extra.keywords],
          },
        }
      : {}),

    /*
     * NO `twitter` BLOCK HERE EITHER, for exactly the reason above: a
     * `twitter` object declared at a deeper segment than the image file
     * replaces the resolved one and takes `twitter:image` with it.
     *
     * `summary_large_image` is declared once, in the root layout, and applies
     * to every route. Next fills `twitter:title` and `twitter:description`
     * from `title` and `description`, and reuses the Open Graph image when no
     * separate `twitter-image` file exists — which is correct here, because
     * one 1200×630 card serves both and a second copy would be a second thing
     * to keep in step.
     */

    ...(extra ? { keywords: [...extra.keywords] } : {}),

    /*
     * Only ever emitted to say NO. The root layout carries the positive
     * `index, follow` for the whole site; repeating it per page would be 55
     * copies of a default. A route that sets this is asking to be left out,
     * and `sitemap.ts` reads the same `indexable` flag, so the directive and
     * the sitemap cannot disagree about any route.
     */
    ...(route.indexable
      ? {}
      : {
          robots: {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
          },
        }),
  };
}

/** Article-only fields. Absent on every other kind of page. */
export interface ArticleFacets {
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly author: string;
  readonly sectionName: string;
  readonly keywords: readonly string[];
}

/** The Metadata for a static route, by path. Throws on an unregistered path. */
export function pageMetadata(path: string): Metadata {
  return routeMetadata(staticRoute(path));
}
