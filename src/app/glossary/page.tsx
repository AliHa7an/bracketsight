import type { Metadata } from "next";
import Link from "next/link";

import { FigureTable, KeyFigure } from "@/components/content";
import { formatDate } from "@/components/ui/format";
import { jsonLd } from "@/lib/content";
import {
  GLOSSARY,
  GLOSSARY_IDS,
  glossaryAlphabetical,
  type GlossaryEntry,
} from "@/lib/content/glossary";
import { SECTIONS, absoluteUrl, sectionHref } from "@/lib/site";

/**
 * /glossary — every term the five tools use, defined once.
 *
 * One page rather than one page per term. A glossary entry is two hundred
 * words; two hundred words on their own URL is a thin page, and twenty-four of
 * them is a thin-content pattern that costs more in ranking than the deep
 * links earn. Each entry gets a stable `id` instead, so an article can link
 * straight to `/glossary#common-level-range` and land on the definition with
 * it at the top of the viewport.
 *
 * Every number in a definition is resolved from a rule file by `figures.ts`,
 * and every entry that renders one shows its citation, its rule set version
 * and any open item from `KNOWN-GAPS.md`. A glossary is the part of a site
 * people quote, which makes an unmaintained number here more damaging than
 * the same number in an article.
 */

export const metadata: Metadata = {
  title: "Glossary — the terms these rules are written in",
  description:
    "Plain-English definitions of MAGI, FPL, RAP, IBR, the applicable percentage, the common level range and every other term the five Bracketsight tools use.",
  alternates: { canonical: "/glossary" },
};

const TOOL_NAMES = new Map(SECTIONS.map((section) => [section.slug, section.name]));
const TOOL_HREFS = new Map(SECTIONS.map((section) => [section.slug, sectionHref(section)]));

/**
 * A `seeAlso` pointing at an id that does not exist is a dead in-page link,
 * and a dead in-page link is invisible in review — the anchor simply does
 * nothing. Checked here so it fails the build instead.
 */
function assertCrossReferences(): void {
  for (const entry of GLOSSARY) {
    for (const id of entry.seeAlso ?? []) {
      if (!GLOSSARY_IDS.includes(id)) {
        throw new Error(
          `Glossary entry "${entry.id}" links to "${id}", which is not a glossary entry. ` +
            `See src/lib/content/glossary.ts.`,
        );
      }
    }
  }
}

export default function GlossaryPage() {
  assertCrossReferences();
  const entries = glossaryAlphabetical();

  const markup = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Bracketsight glossary",
    url: absoluteUrl("/glossary"),
    inLanguage: "en-US",
    hasDefinedTerm: entries.map((entry) => ({
      "@type": "DefinedTerm",
      "@id": `${absoluteUrl("/glossary")}#${entry.id}`,
      name: entry.term,
      description: entry.definition(),
      inDefinedTermSet: absoluteUrl("/glossary"),
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(markup) }} />

      <header className="density-reading">
        <h1>Glossary</h1>
        <p className="mt-2 text-dim">
          Every term these tools put in front of you that you did not ask to learn. Each entry
          says what it is, what decision it changes, where it shows up, and which primary source
          it comes from. Every figure is read from the same cited rule file the calculators run
          on — nothing here is typed in by hand.
        </p>
      </header>

      <nav aria-labelledby="jump" className="hairline-t hairline-b mt-8 py-4">
        {/* `.micro-label` sits in the components layer and so wins over the
            base h2 rule — a heading that is a label rather than a title. */}
        <h2 id="jump" className="micro-label">
          Jump to a term
        </h2>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-2 p-0" style={{ listStyle: "none" }}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
                style={{ fontSize: "var(--text-step--1)" }}
              >
                {entry.term}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        {entries.map((entry) => (
          <Entry key={entry.id} entry={entry} />
        ))}
      </div>

      <p className="mt-10 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        A term missing, or a definition that reads wrong?{" "}
        <Link
          href="/contact"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          Tell us
        </Link>
        . Longer explanations live in the{" "}
        <Link
          href="/guides"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          guides
        </Link>
        .
      </p>
    </div>
  );
}

function Entry({ entry }: { entry: GlossaryEntry }) {
  const primaryTool = entry.tools[0];

  return (
    <section
      id={entry.id}
      aria-labelledby={`${entry.id}-term`}
      data-section={primaryTool}
      className="hairline-b py-8"
      style={{ scrollMarginTop: "var(--spacing-8)" }}
    >
      <h2 id={`${entry.id}-term`}>{entry.term}</h2>

      {entry.expansion ? (
        <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          {entry.expansion}
        </p>
      ) : null}

      <p className="mt-3">{entry.definition()}</p>

      {/*
       * Twenty-four entries rendered whole made this page 28,451px tall at
       * 390px — about seventy phone screens, which is not a glossary but a
       * scroll. The term and its definition, the two things a reader came for,
       * stay open; the apparatus behind them folds.
       *
       * A native <details> rather than the `Disclosure` primitive on purpose:
       * this page is a server component with a build-time cross-reference
       * assertion, the fold needs no state, and 24 client islands to open and
       * close 24 paragraphs would be the wrong trade. It is keyboard-operable
       * and screen-reader-labelled by the UA, its contents stay in the DOM for
       * indexing, and the JSON-LD DefinedTermSet above carries every definition
       * whatever the markup does.
       */}
      <details className="group mt-3">
        <summary className="rounded-atlas flex min-h-11 cursor-pointer items-center gap-2 text-dim hover:text-ink">
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="shrink-0 transition-transform group-open:rotate-90"
            style={{ transitionDuration: "var(--dur-fast)" }}
          >
            <path d="M4 2.5 8 6l-4 3.5" />
          </svg>
          <span style={{ fontSize: "var(--text-step--1)" }}>
            Why it matters, where it appears, and the source
          </span>
        </summary>

        <p className="mt-3">
          <span className="micro-label">Why it matters</span>
          <span className="mt-1 block">{entry.whyItMatters()}</span>
        </p>

        {entry.figures?.map((id) => <KeyFigure key={id} id={id} variant="block" />)}
        {entry.tables?.map((id) => <FigureTable key={id} id={id} />)}

        <div className="mt-4 flex flex-col gap-2">
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)", margin: 0 }}>
          <span className="micro-label">Where it appears</span>{" "}
          {entry.tools.map((tool, index) => (
            <span key={tool}>
              {index > 0 ? ", " : null}
              <Link
                href={TOOL_HREFS.get(tool) ?? `/${tool}`}
                className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
              >
                {TOOL_NAMES.get(tool) ?? tool}
              </Link>
            </span>
          ))}
        </p>

        <p className="text-dim" style={{ fontSize: "var(--text-step--1)", margin: 0 }}>
          <span className="micro-label">Source</span>{" "}
          <a
            href={entry.source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
          >
            {entry.source.label}
          </a>
          {entry.source.lastVerified ? (
            <>
              {" "}
              &middot; last read{" "}
              <time className="num" dateTime={entry.source.lastVerified}>
                {formatDate(entry.source.lastVerified)}
              </time>
            </>
          ) : (
            <> &middot; not yet fetched</>
          )}
        </p>

        {entry.seeAlso && entry.seeAlso.length > 0 ? (
          <p className="text-dim" style={{ fontSize: "var(--text-step--1)", margin: 0 }}>
            <span className="micro-label">See also</span>{" "}
            {entry.seeAlso.map((id, index) => (
              <span key={id}>
                {index > 0 ? ", " : null}
                <a
                  href={`#${id}`}
                  className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
                >
                  {GLOSSARY.find((candidate) => candidate.id === id)?.term ?? id}
                </a>
              </span>
            ))}
          </p>
        ) : null}
        </div>
      </details>
    </section>
  );
}
