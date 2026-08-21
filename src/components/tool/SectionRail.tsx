"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SECTION_PAGES, type SectionSlug } from "@/lib/site";

import styles from "./tool.module.css";

/**
 * SectionRail — one sub-nav, all five sections.
 *
 * Two of the five had no rail at all: `/aca` and `/property` shipped their
 * methodology, sources and changelog with nothing on the tool page pointing at
 * them, which is a click further from the evidence than `/loans` and a weaker
 * internal-linking floor than the publish gates ask for. The other three each
 * hand-wrote their own list, in their own order, at their own type size.
 *
 * The list is derived from `SECTION_PAGES`, so a rail entry cannot point at a
 * page that was never built and a new page cannot ship without appearing here.
 *
 * It is a recessed `--band` strip rather than a hairline-ruled row, which is
 * the third thing the tool pages were missing: breadcrumb on paper, rail on
 * band, masthead on paper, verdict on ink. Rhythm, from the first 130px.
 *
 * `min-height: 44px` on the link is the touch floor and does not move; the
 * height this band gives back comes out of the row's padding, not the target.
 */

export function SectionRail({ section, label }: { section: SectionSlug; label: string }) {
  const pathname = usePathname() ?? "";
  const root = `/${section}`;

  const items = [
    { href: root, label: "The tool" },
    ...SECTION_PAGES[section].map((page) => ({
      href: `${root}${page.href}`,
      label: page.label,
    })),
  ];

  return (
    <nav aria-label={label} className={`${styles.rail} surface-band`}>
      <ul className={`${styles.shell} ${styles.railList}`}>
        {items.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`${styles.railLink}${current ? ` ${styles.railLinkCurrent}` : ""}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
