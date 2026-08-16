"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SECTIONS, sectionHref } from "@/lib/site";
import { Logo } from "./Logo";

/**
 * The site header. Present on every page including inside a section — a
 * visitor who lands on a deep tool page must be able to reach the rest of the
 * site and the trust pages without a back button. That is an AdSense policy
 * requirement as much as it is navigation.
 *
 * The nav is derived from `SECTIONS`, so a sixth tool cannot ship without
 * appearing here.
 *
 * Client component for one reason: `aria-current="page"` needs the pathname.
 * The alternative is a nav where a screen reader user cannot tell which of the
 * five tools they are inside.
 */

type NavItem = { href: string; label: string };

const EXTRA_NAV: readonly NavItem[] = [{ href: "/contact", label: "Contact" }];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  const items: NavItem[] = [
    ...SECTIONS.map((section) => ({ href: sectionHref(section), label: section.name })),
    ...EXTRA_NAV,
  ];

  return (
    <header className="hairline-b bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
        <Logo />

        <nav aria-label="Sections">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-0 text-step--1">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "inline-flex min-h-11 items-center rounded-atlas underline-offset-4 transition-colors",
                      active
                        ? "font-semibold text-ink underline decoration-signal decoration-2"
                        : "text-dim hover:text-ink hover:underline",
                    ].join(" ")}
                    style={{ transitionDuration: "var(--dur-fast)" }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
