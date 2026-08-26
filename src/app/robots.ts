import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * robots.txt.
 *
 * Everything a visitor can reach is indexable. The only disallow is `/api/`,
 * which serves no HTML and would waste crawl budget on JSON. No section, no
 * trust page and no tool is blocked — a page worth building is a page worth
 * indexing, and a stray disallow is the cheapest way to lose a launch.
 *
 * The sitemap line is built from `SITE_URL`, so a preview deployment
 * advertises its own origin rather than pointing crawlers at production.
 *
 * No `host` directive. It is not part of the robots.txt standard, Google
 * ignores it, and only Yandex ever honoured it — so its only real effect on
 * this site was to put a non-standard line in the first file a reviewer opens.
 *
 * There is no `/design/*` rule any more, and there should not be one. Those
 * routes were internal redesign mockups; the direction they were reviewing is
 * now the live home page, so the routes have been deleted rather than hidden.
 * A `Disallow` for a path that 404s is a line in the first file a reviewer
 * opens that describes something the site does not have.
 *
 * THE `Disallow: /api/` LINE IS GONE FOR THAT SAME REASON. There is no `/api`
 * segment in `src/app` and no route handler anywhere in the tree — the site is
 * 55 prerendered documents and nothing else. The rule was written against a
 * JSON surface that was never built, so it protected no crawl budget and
 * described a shape the site does not have, in the one file every reviewer and
 * every ad network opens first. Add it back on the same commit that adds the
 * first route handler, not before.
 *
 * The result is a robots.txt with no `Disallow` at all, which is the correct
 * answer for a site where every URL is a document worth indexing.
 * `scripts/seo-check.mjs` asserts it: any `Disallow` that matches a route that
 * was actually built fails the run.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
