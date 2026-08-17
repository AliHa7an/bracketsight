import type { Metadata } from "next";
import Link from "next/link";

import { clustersForTool, listPosts, toolGuidesHref } from "@/lib/content";
import { SECTIONS, sectionHref } from "@/lib/site";

/**
 * /guides — the index, grouped by tool.
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
 */

export const metadata: Metadata = {
  title: "Guides — how the US money rules actually work",
  description:
    "Plain-English guides to federal student loan repayment, OBBBA paycheck deductions, ACA subsidies, property tax appeals and trade contracts. Every figure cited.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  const posts = listPosts();
  const sectionsWithPosts = SECTIONS.filter((section) =>
    posts.some((post) => post.tool === section.slug),
  );
  const sectionsWithout = SECTIONS.filter(
    (section) => !posts.some((post) => post.tool === section.slug),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="density-reading">
        <h1>Guides</h1>
        <p className="mt-2 text-dim">
          One page per question, grouped by the tool it belongs to. Every figure in every guide is
          read from the same cited rule file the calculator runs on, so a guide and the tool it
          explains cannot disagree about a number.
        </p>
      </header>

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
              <Link
                href={sectionHref(section)}
                className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
              >
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
                <Link
                  href={sectionHref(section)}
                  className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
                >
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

      <p className="mt-10 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        Looking for a term rather than a guide? The{" "}
        <Link
          href="/glossary"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          glossary
        </Link>{" "}
        defines every piece of jargon these tools use, with a primary source for each.
      </p>
    </div>
  );
}
