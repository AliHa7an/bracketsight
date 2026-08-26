import Link from "next/link";

import { toolLinks } from "@/lib/seo/links";
import type { SectionSlug } from "@/lib/site";

/**
 * ToolLinks — the pillar end of the internal link model, rendered.
 *
 * Everything here is resolved, never written. The guides come from the article
 * index, the terms from the glossary entries that name this tool, and the
 * workings from `SECTION_PAGES`. Nothing in this component is a list a human
 * keeps up to date, because that list is wrong within a month of a content
 * programme starting.
 *
 * ── WHY IT IS BODY COPY AND NOT NAVIGATION ──────────────────────────────────
 * Every one of these targets is already reachable from chrome: the section
 * rail links the trust pages, the footer links the guides index and the
 * glossary. Measured with chrome included, this site had 54 inbound links per
 * page and no orphans — and no internal linking at all. A link that appears
 * identically on every page says nothing about any particular page; only a
 * page choosing to point at another is evidence, and it is the only kind a
 * crawler weighs. `/property/editorial-policy` was reachable from the rail on
 * thirteen pages and from no page's body, which is the state a crawler reads
 * as "nothing here thought this was worth pointing at".
 *
 * ── LAYOUT ──────────────────────────────────────────────────────────────────
 * Three columns above `sm`, stacked below, and no image, no ad slot and no
 * lazily-loaded anything — so it reserves its own height from the server HTML
 * and contributes nothing to CLS. It sits at the end of the reading band,
 * after the page's own prose, because it is where a reader goes next rather
 * than part of the answer they came for.
 */

export interface ToolLinksProps {
  readonly tool: SectionSlug;
  /** Override the heading where a page's voice needs a different one. */
  readonly heading?: string;
}

const LINK =
  "rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current";

export function ToolLinks({ tool, heading = "Where to go next" }: ToolLinksProps) {
  const model = toolLinks(tool);
  const { section, articles, terms, workings } = model;

  return (
    <section aria-labelledby="tool-links" className="hairline-t mt-12 pt-8">
      <h2 id="tool-links">{heading}</h2>

      <div className="mt-6 grid gap-8 sm:grid-cols-3">
        {/* ---- pillar → cluster ------------------------------------------- */}
        <div>
          <p className="micro-label">Guides</p>
          {articles.length > 0 ? (
            <ul className="mt-2 list-none space-y-2 p-0">
              {articles.map((entry) => (
                <li key={entry.href}>
                  <Link href={entry.href} className={LINK}>
                    {entry.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={model.guidesHref} className={LINK}>
                  All {section.name.toLowerCase()} guides
                </Link>
              </li>
            </ul>
          ) : (
            /*
             * Honest rather than empty. Three of the five tools have no guide
             * written yet, and saying so — with a link to the index that does
             * exist — reads better than a heading over nothing and better than
             * a link to a page with no content on it.
             */
            <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              No guide has been published for this tool yet. The{" "}
              <Link href="/guides" className={LINK}>
                guides index
              </Link>{" "}
              lists what has.
            </p>
          )}
        </div>

        {/* ---- tool → glossary --------------------------------------------- */}
        <div>
          <p className="micro-label">Terms used here</p>
          <ul className="mt-2 list-none space-y-2 p-0">
            {terms.map((term) => (
              <li key={term.href}>
                <Link href={term.href} className={LINK}>
                  {term.term}
                </Link>
                {term.expansion ? (
                  <span className="block text-dim" style={{ fontSize: "var(--text-step--2)" }}>
                    {term.expansion}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        {/* ---- the workings ------------------------------------------------ */}
        <div>
          <p className="micro-label">The workings</p>
          <ul className="mt-2 list-none space-y-2 p-0">
            {workings.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className={LINK}>
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
