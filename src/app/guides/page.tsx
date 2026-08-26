import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import type { CSSProperties } from "react";

import { AnswerBox } from "@/components/ui";
import { formatDate } from "@/components/ui/format";
import {
  clustersForTool,
  getFigure,
  getFigureTable,
  listFigureIds,
  listFigureTableIds,
  listPosts,
  toolGuidesHref,
} from "@/lib/content";
import { AdPlacement } from "@/lib/ads";
import { SECTIONS, sectionHref } from "@/lib/site";

/**
 * /guides — the index, grouped by tool, plus the account of how a guide is
 * built.
 *
 * Not a flat reverse-chronological list. A reader arrives holding one problem,
 * and "everything we have written, newest first" makes them scan fifty
 * headlines to find the five about their problem. Grouping by tool and then by
 * cluster means the page answers "what do you have about student loans?" in
 * one glance, and it gives every article at least two internal links — one
 * from here and one from its tool index — which is what keeps a growing
 * library from filling up with orphans.
 *
 * A tool with nothing published does not get an empty section. It gets a line
 * in the "not yet" list, which is honest and takes one row.
 *
 * The sections below the list are the reason this page is indexable while the
 * per-tool indexes currently are not. A list of two links is a URL holding
 * links; what a reader cannot get anywhere else on this site is the account of
 * how a guide gets its numbers, what the collection currently rests on, and
 * what it does not have. The coverage table is computed from the figure
 * registry at build time, so it describes the tree as it actually is on the
 * day it is served — including the two engines whose coverage is too thin to
 * write about yet.
 */

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/guides");

const CELL: CSSProperties = {
  padding: "var(--cell-pad-y) var(--cell-pad-x)",
};

const LINK = "rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current";

/** ISO date → "15 Aug 2026", or null when nothing in the group was fetched. */
function oldestCheck(dates: readonly (string | null)[]): string | null {
  const fetched = dates.filter((date): date is string => Boolean(date)).sort();
  return fetched[0] ?? null;
}

export default function GuidesIndexPage() {
  const posts = listPosts();
  const sectionsWithPosts = SECTIONS.filter((section) =>
    posts.some((post) => post.tool === section.slug),
  );
  const sectionsWithout = SECTIONS.filter(
    (section) => !posts.some((post) => post.tool === section.slug),
  );

  /*
   * The figure vocabulary, resolved from the registry rather than counted by
   * hand. Every one of these numbers changes on the day someone wires another
   * rule-file value into `src/lib/content/figures.ts`, which is the only way a
   * guide is allowed to print one.
   */
  const scalars = listFigureIds().map((id) => getFigure(id));
  const tables = listFigureTableIds().map((id) => getFigureTable(id));

  const coverage = SECTIONS.map((section) => {
    const ownScalars = scalars.filter((figure) => figure.tool === section.slug);
    const ownTables = tables.filter((table) => table.tool === section.slug);
    const all = [...ownScalars, ...ownTables];

    return {
      section,
      figures: ownScalars.length,
      tables: ownTables.length,
      gapped: all.filter((figure) => figure.knownGapIds.length > 0).length,
      guides: posts.filter((post) => post.tool === section.slug).length,
    };
  });

  const totalFigures = scalars.length;
  const totalTables = tables.length;
  const totalGapped = coverage.reduce((sum, row) => sum + row.gapped, 0);
  const registryFloor = oldestCheck([...scalars, ...tables].map((f) => f.citation.lastVerified));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="density-reading">
        <h1>Guides</h1>
        <p className="mt-2 text-dim">
          One page per decision, grouped by the tool that computes it. A guide never types a figure
          an engine owns — it names one, and the build reads the value out of the same versioned,
          cited rule file the calculator runs on, so a guide and the tool it explains cannot
          disagree about a number.
        </p>
      </header>

      <AnswerBox className="mt-6">
        Every figure in a guide is a reference to a rule file, resolved when the site is built.{" "}
        <span className="num">{totalFigures}</span> values and{" "}
        <span className="num">{totalTables}</span> schedules are wired this way. Change a rule and
        the guides change in the same commit; name a value that does not exist and the build stops.
      </AnswerBox>

      {sectionsWithPosts.map((section) => {
        const clusters = clustersForTool(section.slug);
        const count = posts.filter((post) => post.tool === section.slug).length;

        return (
          <section
            key={section.slug}
            aria-labelledby={`guides-${section.slug}`}
            data-section={section.slug}
            className="hairline-all rounded-atlas mt-8 p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id={`guides-${section.slug}`}>
                <Link
                  href={toolGuidesHref(section.slug)}
                  className="rounded-atlas no-underline hover:underline"
                  style={{ textDecorationColor: "var(--rule)", textUnderlineOffset: "4px" }}
                >
                  {section.name}
                </Link>
              </h2>
              <p className="micro-label num m-0">
                {count} {count === 1 ? "guide" : "guides"}
              </p>
            </div>

            <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              {section.tagline}{" "}
              <Link href={sectionHref(section)} className={LINK}>
                Open the tool
              </Link>
            </p>

            {clusters.map((cluster) => (
              <div key={cluster.cluster} className="mt-5">
                <p className="micro-label">{cluster.cluster.replace(/-/g, " ")}</p>
                <ul className="mt-1 list-none space-y-0 p-0">
                  {cluster.posts.map((post) => (
                    <li key={post.slug} className="hairline-b">
                      <Link
                        href={post.href}
                        className="rounded-atlas block py-3 no-underline hover:bg-ink/5"
                      >
                        <span className="block text-ink underline decoration-rule underline-offset-4">
                          {post.title}
                        </span>
                        <span
                          className="mt-1 block text-dim"
                          style={{ fontSize: "var(--text-step--1)" }}
                        >
                          {post.description}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}

      {sectionsWithout.length > 0 ? (
        <section aria-labelledby="guides-pending" className="mt-10">
          <h2 id="guides-pending">Not yet written</h2>
          <p className="mt-2 text-dim">
            These tools have no guides published yet. The tools themselves work, and each carries
            its own methodology and sources pages.
          </p>
          <ul className="mt-3 list-none space-y-0 p-0">
            {sectionsWithout.map((section) => (
              <li key={section.slug} className="hairline-b py-3">
                <Link href={sectionHref(section)} className={LINK}>
                  {section.name}
                </Link>
                <span className="ml-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                  {section.tagline}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="what-a-guide-is" className="density-reading mt-12">
        <h2 id="what-a-guide-is">What a guide is here</h2>

        <p className="mt-3 text-dim">
          Each tool already carries a methodology page describing what its engine does, a sources
          page listing every rule file and the date its citation was last read, and a changelog
          recording what moved. A guide is none of those. It takes one borrower or one household,
          runs a single decision to the end, and says which way it comes out, what it costs to get
          wrong, and which part of it cannot be undone afterwards.
        </p>

        <p className="mt-3 text-dim">
          The bar a draft has to clear before it is published is that it contains at least one
          figure a reader could not have arrived at from the tool&rsquo;s own pages — a crossover
          point, an eligibility interaction, a threshold two rules produce between them — and that
          it names the consequence rather than leaving the reader to infer it. A page that only
          restates what the calculator already prints does not get written.
        </p>

        <p className="mt-3 text-dim">
          So the collection grows by decision, never by keyword. Two guides chasing the same
          question split the traffic and start disagreeing within a year, so the content register
          in the repository holds one row per planned piece and refuses a repeated primary keyword.
          Where a tool has no guide yet, the list above says so instead of filling the gap.
        </p>
      </section>

      <section aria-labelledby="where-numbers-come-from" className="density-reading mt-12">
        <h2 id="where-numbers-come-from">Where a guide&rsquo;s numbers come from</h2>

        <p className="mt-3 text-dim">
          An article writes the name of a figure — <code className="num">loans.rap.topRate</code>,{" "}
          <code className="num">aca.fpl.firstPerson</code> — and the build hands back the value, the
          rule set version it was read from, the primary citation, and the date somebody last opened
          that citation and checked the value against it. The digits are never in the markdown. On a
          site about rules that move on a schedule that is the difference between a correction and a
          rewrite: the poverty guidelines are republished every January, the RISE rule took effect
          on 1 July 2026, and an article with a payment count typed into its prose would go on
          printing the old one long after the rule file had been fixed.
        </p>

        <p className="mt-3 text-dim">
          The same resolution runs for whole schedules — the RAP bracket table, the applicable
          percentage bands — so a guide cannot carry a table that has drifted from the one the
          engine computes with. A figure name that does not resolve fails the build rather than
          rendering a blank, which is why nothing here can be quietly worked around by typing the
          number in.
        </p>

        <div className="density-instrument hairline-all rounded-atlas mt-5 w-full min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="micro-label text-left" style={{ ...CELL, captionSide: "top" }}>
              What a guide can print today, by engine
            </caption>
            <thead>
              <tr className="hairline-b">
                <th scope="col" className="micro-label align-bottom" style={CELL}>
                  Engine
                </th>
                <th scope="col" className="micro-label align-bottom" style={CELL}>
                  Values
                </th>
                <th scope="col" className="micro-label align-bottom" style={CELL}>
                  Schedules
                </th>
                <th scope="col" className="micro-label align-bottom" style={CELL}>
                  Open items
                </th>
                <th scope="col" className="micro-label align-bottom" style={CELL}>
                  Guides
                </th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((row) => (
                <tr key={row.section.slug} className="hairline-b">
                  <th scope="row" className="text-left align-top" style={{ ...CELL, fontWeight: 500 }}>
                    {row.section.name}
                  </th>
                  <td className="num align-top" style={CELL}>
                    {row.figures}
                  </td>
                  <td className="num align-top" style={CELL}>
                    {row.tables}
                  </td>
                  <td className="num align-top" style={CELL}>
                    {row.gapped}
                  </td>
                  <td className="num align-top" style={CELL}>
                    {row.guides}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Values and schedules are what that engine has wired into the registry; open items are the
          ones whose source could not be closed. Nothing in the registry was last read off its
          primary source earlier than{" "}
          {registryFloor ? (
            <time className="num" dateTime={registryFloor}>
              {formatDate(registryFloor)}
            </time>
          ) : (
            "any recorded date"
          )}
          , so that is the staleness floor for every figure a guide can print.
        </p>

        <p className="mt-4 text-dim">
          Property tax and trades sit at the bottom of that table, and that is the reason neither
          has a guide rather than an accident of scheduling. An article about a county appeal would
          have to state a filing deadline; the deadline is in the engine but not yet in the figure
          registry, so the article could only get it onto the page by typing it, which is the one
          thing this arrangement does not allow. Coverage first, then the article.
        </p>
      </section>

      <section aria-labelledby="what-is-missing" className="density-reading mt-12">
        <h2 id="what-is-missing">What these guides do not have</h2>

        <p className="mt-3 text-dim">
          No named reviewer has checked either published guide. Both say so above the first
          paragraph, and the <code className="num">reviewedBy</code> property is left out of their
          structured data entirely rather than filled with the site&rsquo;s own name — a claim of
          human review is not a thing to assert by default. The{" "}
          <Link href="/authors" className={LINK}>
            authors page
          </Link>{" "}
          lists the six review gates the section editorial policies commit to and marks every one of
          them as not engaged. That is the largest open weakness on this site and prose cannot close
          it.
        </p>

        <p className="mt-3 text-dim">
          <span className="num">{totalGapped}</span> of the figures a guide can print carry an open
          item in the verification register — a value that is in the engine but rests on a source
          that could not be fetched, an agency table not yet published, or a documented
          simplification. Where a guide prints one, the register&rsquo;s own words appear under the
          number, together with what would close the item, rather than a footnote a reader has to go
          looking for. The register itself is summarised on the{" "}
          <Link href="/about" className={LINK}>
            about page
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="alongside-the-tool" className="density-reading mt-12">
        <h2 id="alongside-the-tool">Reading a guide next to its tool</h2>

        <p className="mt-3 text-dim">
          Every guide ends in the tool it explains. For student loans the link carries the
          article&rsquo;s worked example in the URL fragment, encoded by the calculator&rsquo;s own
          encoder, so a reader lands on exactly the borrower the guide described — the same balance,
          rate, income and filing status — with all nine plans already ranked, and edits from there.
          A fragment is never sent to a server, and nothing about the scenario is stored.
        </p>

        <p className="mt-3 text-dim">
          The other four tools have no scenario transport: they seed from defaults and keep state in
          the browser, and none of them reads a query string. Their links are therefore plain links
          to the tool, and the component that renders them types the pre-fill option out of
          existence for those four. A link that looked pre-filled and then loaded somebody
          else&rsquo;s defaults would show a reader an answer that was not the article&rsquo;s.
        </p>

        <p className="mt-3 text-dim">
          Terms are defined in one place. A guide that needs discretionary income, the common level
          range or the benchmark plan links to its entry in the{" "}
          <Link href="/glossary" className={LINK}>
            glossary
          </Link>
          , where every definition carries a primary source, rather than defining it again — two
          definitions of one term start disagreeing the first time one of them is edited.
        </p>
      </section>

      {/* Foot only. An index page's job is to route someone onward, and an ad
          between a reader and the link they are scanning for is an obstruction
          before it is a design problem. See placements.ts, "index-foot". */}
      <AdPlacement id="index-foot" className="mt-12" />
    </div>
  );
}
