"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConsentChoicesLink } from "./ConsentBanner";
import {
  CONTACT_EMAIL,
  DISCLAIMER,
  SECTIONS,
  SECTION_PAGES,
  SITE_NAME,
  TRUST_PAGES,
  sectionFromPath,
  sectionHref,
  sectionPageHref,
} from "@/lib/site";

/**
 * The site footer. Like the header, it renders on every page including inside
 * a section: the contact address, the trust pages and the "this is not advice"
 * line must be one scroll away from any figure the site shows, wherever the
 * visitor landed. That is an AdSense policy requirement as much as it is good
 * manners.
 *
 * The trust column is section-aware. Each tool answers to a different
 * rule-maker and so carries its own methodology, sources and changelog; a
 * reader inside the ACA planner wants the ACA sources, not a menu of five. On
 * the hub, where no section is in scope, the column lists each tool's
 * methodology instead — so the trust surface is reachable from the front page
 * too, never more than one click away.
 *
 * Client component only because that mapping needs the pathname.
 */

export function SiteFooter() {
  const pathname = usePathname() ?? "/";
  const section = sectionFromPath(pathname);
  const trustPages = section ? SECTION_PAGES[section.slug].filter((page) => page.trust) : [];

  return (
    <footer className="hairline-t mt-16 bg-paper">
      <div className="mx-auto max-w-5xl px-4 py-8 text-step--1 text-dim">
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <nav aria-label="Tools" className="min-w-[10rem]">
            <p className="micro-label mb-2">Tools</p>
            <ul className="space-y-0">
              {SECTIONS.map((item) => (
                <li key={item.id}>
                  <Link
                    href={sectionHref(item)}
                    className="inline-flex min-h-11 items-center rounded-atlas underline-offset-4 hover:text-ink hover:underline"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="How this tool works" className="min-w-[10rem]">
            <p className="micro-label mb-2">
              {section ? `${section.name} — how it works` : "How this works"}
            </p>
            <ul className="space-y-0">
              {section
                ? trustPages.map((page) => (
                    <li key={page.href}>
                      <Link
                        href={sectionPageHref(section, page)}
                        className="inline-flex min-h-11 items-center rounded-atlas underline-offset-4 hover:text-ink hover:underline"
                      >
                        {page.label}
                      </Link>
                    </li>
                  ))
                : SECTIONS.map((item) => {
                    const methodology = SECTION_PAGES[item.slug].find((page) => page.trust);
                    if (!methodology) return null;
                    return (
                      <li key={item.id}>
                        <Link
                          href={sectionPageHref(item, methodology)}
                          className="inline-flex min-h-11 items-center rounded-atlas underline-offset-4 hover:text-ink hover:underline"
                        >
                          {item.name} methodology
                        </Link>
                      </li>
                    );
                  })}
            </ul>
          </nav>

          {/*
            The site-level trust column. Every entry in TRUST_PAGES renders on
            every page, section pages included — about, contact, privacy,
            terms. Before this existed, /terms was four clicks from the hub and
            reachable only through /privacy, which for a site computing
            high-stakes money figures is the same as not having a disclaimer.
          */}
          <nav aria-label="About this site" className="min-w-[10rem]">
            <p className="micro-label mb-2">This site</p>
            <ul className="space-y-0">
              {TRUST_PAGES.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="inline-flex min-h-11 items-center rounded-atlas underline-offset-4 hover:text-ink hover:underline"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
              {/*
                Withdrawing consent has to be as easy as giving it, from any
                page. This reopens the banner and reports the current state in
                words, so a reader can see what they chose without opening
                developer tools. Renders nothing until mounted — see the
                component.
              */}
              <li>
                <ConsentChoicesLink />
              </li>
            </ul>
          </nav>

          <div className="min-w-[14rem] flex-1">
            <p className="micro-label mb-2">Found a wrong figure?</p>
            <p className="max-w-[34ch]">
              Write to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="num rounded-atlas text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
              >
                {CONTACT_EMAIL}
              </a>
              . Corrections are checked against the primary source before anything changes.
            </p>
          </div>
        </div>

        <p className="hairline-t mt-6 max-w-[68ch] pt-6">{DISCLAIMER}</p>

        <p className="mt-3">
          © <span className="num">{new Date().getUTCFullYear()}</span> {SITE_NAME}. No lender,
          insurer, employer or county pays for placement here.
        </p>
      </div>
    </footer>
  );
}
