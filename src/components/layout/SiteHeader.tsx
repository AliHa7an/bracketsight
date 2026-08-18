"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { SECTIONS, sectionHref } from "@/lib/site";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The site header. Present on every page including inside a section — a
 * visitor who lands on a deep tool page must be able to reach the rest of the
 * site and the trust pages without a back button. That is an AdSense policy
 * requirement as much as it is navigation.
 *
 * The nav is derived from `SECTIONS`, so a sixth tool cannot ship without
 * appearing here.
 *
 * STICKY, AND COMPACT ONCE THE PAGE HAS MOVED. It shrinks by 6px of vertical
 * padding and gains a hairline and a shadow past 8px of scroll — enough to read
 * as a rail sitting over the page rather than as part of it, and small enough
 * that it never repositions the content underneath. The height change is on the
 * header's own padding, and the header is `position: sticky`, so nothing in the
 * document flow moves and the transition contributes nothing to CLS.
 *
 * WHY A SCROLL LISTENER AND NOT AN INTERSECTIONOBSERVER SENTINEL: the sentinel
 * pattern needs an element at the top of every page, and this header renders
 * above `main` for pages it does not control. The listener is passive, reads
 * one already-computed value, and writes state only when the boolean actually
 * flips — so it does not schedule a render per frame.
 *
 * Client component for three reasons: `aria-current="page"` needs the pathname,
 * the compact state needs the scroll position, and the theme control needs
 * `localStorage`. The first of those is the load-bearing one — without it a
 * screen-reader user cannot tell which of the five tools they are inside.
 */

type NavItem = { href: string; label: string };

const EXTRA_NAV: readonly NavItem[] = [{ href: "/contact", label: "Contact" }];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 8;
      setCompact((current) => (current === next ? current : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items: NavItem[] = [
    ...SECTIONS.map((section) => ({ href: sectionHref(section), label: section.name })),
    ...EXTRA_NAV,
  ];

  return (
    <header
      data-compact={compact ? "" : undefined}
      className={[
        "sticky top-0 z-30 bg-paper",
        compact
          ? "border-b border-[color-mix(in_srgb,var(--ink)_14%,transparent)] shadow-[0_1px_12px_-6px_color-mix(in_srgb,var(--ink)_45%,transparent)]"
          : "border-b border-[color-mix(in_srgb,var(--ink)_9%,transparent)]",
      ].join(" ")}
      style={{ transition: "box-shadow var(--dur-base) var(--ease)" }}
    >
      {/*
        Two rows below 900px, one above it.

        Six destinations plus a wordmark do not fit on one 375px line, and
        wrapping them produced a 130px sticky rail that ate a fifth of a phone
        screen. So on narrow viewports the nav gets its own row and scrolls
        sideways INSIDE ITSELF — `overflow-x` on the nav, never on the page —
        which keeps the whole header at about 84px and keeps every one of the
        six reachable. Above 900px there is room for a single line and the
        second row's hairline disappears with it.
      */}
      <div
        className="mx-auto max-w-6xl px-4 lg:flex lg:items-center lg:justify-between lg:gap-x-5"
        style={{
          paddingBlock: compact ? "2px" : "6px",
          transition: "padding var(--dur-base) var(--ease)",
        }}
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />

            {/*
              The two things a first-time visitor most wants to know before
              they type an income into anything, in four words. It is repeated
              in the hero's trust strip and in the footer, so nothing is only
              here.
            */}
            <span className="num inline-flex shrink-0 items-center rounded-full border border-rule px-2 py-[3px] text-[0.625rem] tracking-[0.08em] text-dim uppercase">
              Free · no signup
            </span>
          </div>

          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-x-4">
          <nav
            aria-label="Sections"
            className="-mx-4 min-w-0 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
            style={{ scrollbarWidth: "none" }}
          >
            <ul className="flex w-max items-center gap-x-4 gap-y-0 text-step--1 lg:w-auto">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "inline-flex min-h-11 items-center rounded-atlas whitespace-nowrap underline-offset-4 transition-colors",
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

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
