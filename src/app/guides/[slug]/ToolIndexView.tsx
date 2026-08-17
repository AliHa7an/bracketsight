import Link from "next/link";

import { clustersForTool, postsForTool } from "@/lib/content";
import { SECTION_PAGES, sectionHref, type Section } from "@/lib/site";

/**
 * /guides/<tool> — every guide for one engine, grouped by cluster.
 *
 * This route shares the `[slug]` segment with the articles, which is why the
 * frontmatter schema reserves the five tool slugs: `/guides/loans` is this
 * page, so no article may claim that URL. One dynamic segment serving both
 * keeps the reading URL short (`/guides/rap-vs-ibr`, not
 * `/guides/loans/rap-vs-ibr`) and keeps every article one hop from the hub.
 *
 * It also does the internal-linking work. Each article is reachable from
 * `/guides`, from here, and from the related block of its siblings — so no
 * guide is ever an orphan, and the cluster it belongs to is visible rather
 * than implied.
 *
 * Below `TOOL_INDEX_MIN_POSTS` articles this page is deliberately kept out of
 * the index — see the note on that constant in `src/lib/content/posts.ts`. It
 * still renders, still links and is still crawlable; it just does not ask to
 * be a search result while everything on it also appears on `/guides`.
 *
 * No structured data is emitted here. The page's `BreadcrumbList` comes from
 * the global `<Breadcrumbs />` in the root layout, which builds it from the
 * same trail it renders visibly. A second copy from this component described
 * the same URL twice.
 */

export function ToolIndexView({ section }: { section: Section }) {
  const posts = postsForTool(section.slug);
  const clusters = clustersForTool(section.slug);
  const trustPages = SECTION_PAGES[section.slug].filter((page) => page.trust);

  return (
    <div data-section={section.slug} className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header>
          <p className="micro-label">
            <Link href="/guides" className="rounded-atlas hover:text-ink hover:underline">
              Guides
            </Link>
          </p>

          <h1 className="mt-2">{section.name} guides</h1>

          <p className="mt-3 text-dim" style={{ fontSize: "var(--text-step-1)", lineHeight: 1.5 }}>
            {section.tagline}
          </p>

          <p className="mt-4">
            <Link
              href={sectionHref(section)}
              className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
            >
              Open the {section.name.toLowerCase()} tool
            </Link>
          </p>
        </header>

        {clusters.map((cluster) => (
          <section
            key={cluster.cluster}
            aria-labelledby={`cluster-${cluster.cluster}`}
            className="mt-8"
          >
            <h2 id={`cluster-${cluster.cluster}`} className="capitalize">
              {cluster.cluster.replace(/-/g, " ")}
            </h2>
            <ul className="mt-3 list-none space-y-0 p-0">
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
                    <span className="micro-label num mt-1 block">
                      Reviewed {post.updatedAt}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {posts.length === 0 ? (
          <p className="mt-8 text-dim">No guides are published for this tool yet.</p>
        ) : null}

        <section aria-labelledby="trust" className="mt-10">
          <h2 id="trust">How these figures are checked</h2>
          <p className="mt-2 text-dim">
            Every number in these guides is read from the same versioned, cited rule files the
            tool runs on. The tool&rsquo;s own trust pages document them.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 p-0" style={{ listStyle: "none" }}>
            {trustPages.map((page) => (
              <li key={page.href}>
                <Link
                  href={`${sectionHref(section)}${page.href}`}
                  className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Guides for the other tools are on the{" "}
          <Link
            href="/guides"
            className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
          >
            guides index
          </Link>
          , and the{" "}
          <Link
            href="/glossary"
            className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
          >
            glossary
          </Link>{" "}
          defines the terms they use.
        </p>
      </div>
    </div>
  );
}
