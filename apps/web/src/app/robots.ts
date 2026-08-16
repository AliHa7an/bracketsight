import type { MetadataRoute } from "next";

import { SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * robots.txt.
 *
 * Everything a visitor can reach is indexable. The only disallow is `/api/`,
 * which serves no HTML and would waste crawl budget on JSON. No section, no
 * trust page and no tool is blocked — a page worth building is a page worth
 * indexing, and a stray disallow is the cheapest way to lose a launch.
 *
 * Both the sitemap and host lines are built from `SITE_URL`, so a preview
 * deployment advertises its own origin rather than pointing crawlers at
 * production.
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
    host: SITE_URL,
  };
}
