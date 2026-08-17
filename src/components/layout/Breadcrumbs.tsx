"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { absoluteUrl, breadcrumbTrail } from "@/lib/site";

/**
 * Breadcrumbs, on every page except the hub.
 *
 * One trail feeds both the visible nav and the BreadcrumbList markup, so the
 * markup can never describe a hierarchy the reader cannot see — which is the
 * structured-data abuse the publisher policies name, and the reason this is not
 * two separate lists.
 *
 * Rendered from the root layout, so a section that ships a new page gets
 * breadcrumbs without doing anything. The trail itself is derived in
 * `src/lib/site.ts` from the same config the header, footer and sitemap read.
 *
 * Layout: fixed height is not needed because this sits above the page content
 * and is present in the server-rendered HTML — there is nothing to shift.
 * Client component only because the trail needs the pathname.
 */
export function Breadcrumbs() {
  const pathname = usePathname() ?? "/";
  const trail = breadcrumbTrail(pathname);
  if (trail.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      // The final crumb is the page itself; Google's guidance allows it to omit
      // the URL, and omitting it is the honest signal that it is not a link.
      ...(index === trail.length - 1 ? {} : { item: absoluteUrl(crumb.href) }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-3">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-0 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-x-2">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-rule">
                    /
                  </span>
                ) : null}
                {isLast ? (
                  <span aria-current="page" className="text-ink">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="rounded-atlas underline-offset-4 hover:text-ink hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
