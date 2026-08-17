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
 * `/design/*` is deliberately NOT disallowed. Those three routes are internal
 * mockups carrying `noindex, nofollow` in their own metadata, and a crawler
 * has to be able to fetch a page to read the noindex on it. Blocking the path
 * would leave the pages indexable-by-reference and unreadable — the worst of
 * both. Nothing links to them, so nothing discovers them either.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
