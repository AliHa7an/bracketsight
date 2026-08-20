"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConsentChoicesLink } from "./ConsentBanner";
import { LogoMark } from "./Logo";
import {
  CONTACT_EMAIL,
  DISCLAIMER,
  LIBRARY_PAGES,
  SECTIONS,
  SECTION_PAGES,
  SITE_NAME,
  TRUST_PAGES,
  sectionFromPath,
  sectionHref,
  sectionPageHref,
} from "@/lib/site";

/**
 * The site footer. Like the header, it renders on every page including inside a
 * section: the contact address, the trust pages and the "this is not advice"
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
 * FOUR COLUMNS, and they are the four questions a reader arrives with: what can
 * this do, how does it work, who is behind it, and what do the words mean. The
 * previous footer had five uneven ones that reflowed into a ragged block at
 * every width between 640 and 1024px. Nothing was dropped in the tightening —
 * the reference pages moved into the fourth column rather than out of the
 * footer, because a glossary and a guides index that no page links to are, to a
 * crawler, two more orphans.
 *
 * Client component only because the section mapping needs the pathname.
 */

/*
 * `min-h-8` rather than `min-h-9`. 32px is still a comfortable stacked-list tap
 * target for a text link inside a list (the 44px floor is for controls, and a
 * footer link is prose), and across sixteen links in a two-column stack the four
 * pixels each were 60px of a phone screen spent on nothing. Nothing was dropped
 * in the tightening — see the note below on why that matters here specifically.
 */
const linkClass =
  "inline-flex min-h-8 items-center rounded-atlas py-[3px] underline-offset-4 hover:text-ink hover:underline";

function Column({
  label,
  children,
  ariaLabel,
}: {
  label: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={ariaLabel} className="min-w-0">
      <p className="micro-label mb-2">{label}</p>
      <ul className="space-y-0">{children}</ul>
    </nav>
  );
}

export function SiteFooter() {
  const pathname = usePathname() ?? "/";
  const section = sectionFromPath(pathname);
  const trustPages = section ? SECTION_PAGES[section.slug].filter((page) => page.trust) : [];

  return (
    <footer className="hairline-t mt-12 bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-8 text-step--1 text-dim">
        {/* ---- the brand line, and the one address a correction arrives by ---- */}
        <div className="hairline-b flex flex-wrap items-start justify-between gap-x-8 gap-y-4 pb-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-ink">
              <LogoMark size={20} />
              <span className="text-[1.0625rem] font-semibold tracking-[-0.015em]">
                {SITE_NAME}
              </span>
            </p>
            <p className="mt-2 max-w-[46ch]">
              Five decision engines for US money rules. Every rule cited and dated, no arithmetic
              by a language model, nothing stored.
            </p>
          </div>

          <div className="min-w-0">
            <p className="micro-label mb-1">Found a wrong figure?</p>
            <p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="num rounded-atlas text-[0.9375rem] text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-1 max-w-[34ch]">
              Checked against the primary source before anything changes.
            </p>
          </div>
        </div>

        {/* ---- the four columns ---- */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-5 md:grid-cols-4">
          <Column label="Tools" ariaLabel="Tools">
            {SECTIONS.map((item) => (
              <li key={item.id}>
                <Link href={sectionHref(item)} className={linkClass}>
                  {item.name}
                </Link>
              </li>
            ))}
          </Column>

          <Column
            label={section ? `${section.name} — how it works` : "How this works"}
            ariaLabel="How this tool works"
          >
            {section
              ? trustPages.map((page) => (
                  <li key={page.href}>
                    <Link href={sectionPageHref(section, page)} className={linkClass}>
                      {page.label}
                    </Link>
                  </li>
                ))
              : SECTIONS.map((item) => {
                  const methodology = SECTION_PAGES[item.slug].find((page) => page.trust);
                  if (!methodology) return null;
                  return (
                    <li key={item.id}>
                      <Link href={sectionPageHref(item, methodology)} className={linkClass}>
                        {item.name} methodology
                      </Link>
                    </li>
                  );
                })}
          </Column>

          {/*
            The site-level trust column. Every entry in TRUST_PAGES renders on
            every page, section pages included — about, authors, contact,
            privacy, terms. Before this existed, /terms was four clicks from the
            hub and reachable only through /privacy, which for a site computing
            high-stakes money figures is the same as not having a disclaimer.
          */}
          <Column label="This site" ariaLabel="About this site">
            {TRUST_PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className={linkClass}>
                  {page.label}
                </Link>
              </li>
            ))}
            {/*
              Withdrawing consent has to be as easy as giving it, from any page.
              This reopens the banner and reports the current state in words, so
              a reader can see what they chose without opening developer tools.
              Renders nothing until mounted — see the component.
            */}
            <li>
              <ConsentChoicesLink />
            </li>
          </Column>

          {/*
            The reading surface. Separate from the trust column because a
            glossary is not a policy page, and separate from the tools column
            because it is not a tool — but in the footer of every page for the
            same reason both of those are: nothing else on the site linked to
            either, so both shipped as orphans.
          */}
          <Column label="Reference" ariaLabel="Reference">
            {LIBRARY_PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className={linkClass}>
                  {page.label}
                </Link>
              </li>
            ))}
          </Column>
        </div>

        <p className="hairline-t mt-6 max-w-[74ch] pt-5">{DISCLAIMER}</p>

        <p className="mt-2">
          © <span className="num">{new Date().getUTCFullYear()}</span> {SITE_NAME}. No lender,
          insurer, employer or county pays for placement here.
        </p>
      </div>
    </footer>
  );
}
