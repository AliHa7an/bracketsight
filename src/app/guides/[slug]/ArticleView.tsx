import Link from "next/link";

import {
  LastReviewed,
  RelatedArticles,
  Sources,
  articleComponents,
} from "@/components/content";
import { jsonLd, loadArticleBody, relatedPosts, toolGuidesHref, type Post } from "@/lib/content";
import { UNREVIEWED } from "@/lib/content/schema";
import { SECTIONS, SITE_NAME, absoluteUrl, sectionHref } from "@/lib/site";
import { ContentsRail } from "@/components/content";

/**
 * One article.
 *
 * The `data-section` wrapper is the whole theming mechanism: a guide about
 * student loans reads in the loans palette, one about health cover in the ACA
 * palette. Nothing else changes — same components, same type scale — so a
 * reader who arrives from a tool page stays in the same visual world as the
 * numbers they came from.
 *
 * Structured data: `Article` only, with `dateModified` from `updatedAt` and
 * `reviewedBy` present only when a human actually reviewed it.
 *
 * The `BreadcrumbList` used to be emitted here too. It is not any more: the
 * global `<Breadcrumbs />` in the root layout emits one for every page from
 * the same trail it renders visibly, so a second one here described the same
 * URL twice and put two competing objects in front of a rich-result parser.
 * One page, one trail, one object. The kicker below stays — it is in-page
 * navigation to the tool this article belongs to, not markup.
 */

const TOOL_NAMES = new Map(SECTIONS.map((section) => [section.slug, section.name]));

export async function ArticleView({ post }: { post: Post }) {
  const Body = await loadArticleBody(post.slug);
  const related = relatedPosts(post);
  const section = SECTIONS.find((candidate) => candidate.slug === post.tool);
  const toolName = TOOL_NAMES.get(post.tool) ?? post.tool;

  const articleMarkup = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(post.href) },
    inLanguage: "en-US",
    isAccessibleForFree: true,
    citation: post.sources.map((source) => ({
      "@type": "CreativeWork",
      name: source.label,
      url: source.url,
    })),
    // Claimed only when true. See LastReviewed for why.
    ...(post.reviewedBy === UNREVIEWED
      ? {}
      : { reviewedBy: { "@type": "Person", name: post.reviewedBy } }),
  };

  return (
    <div data-section={post.tool} className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleMarkup) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10">
        <header>
          {/* In-page navigation back to the tool's collection. The page's
              BreadcrumbList comes from the global <Breadcrumbs /> above. */}
          <p className="micro-label flex flex-wrap items-center gap-x-2">
            <Link href="/guides" className="rounded-atlas hover:text-ink hover:underline">
              Guides
            </Link>
            <span aria-hidden="true" className="text-rule">
              /
            </span>
            <Link
              href={toolGuidesHref(post.tool)}
              className="rounded-atlas hover:text-ink hover:underline"
            >
              {toolName}
            </Link>
          </p>

          <h1 className="mt-2">{post.title}</h1>

          <p
            className="mt-3 text-dim"
            style={{ fontSize: "var(--text-step-1)", lineHeight: 1.5 }}
          >
            {post.description}
          </p>

          <div className="mt-5">
            <LastReviewed
              publishedAt={post.publishedAt}
              updatedAt={post.updatedAt}
              author={post.author}
              reviewedBy={post.reviewedBy}
            />
          </div>
        </header>

        <ContentsRail className="mt-6" />

        <div className="density-reading mt-6" style={{ maxWidth: "none" }}>
          <Body components={articleComponents} />
        </div>

        <Sources sources={post.sources} />

        <RelatedArticles posts={related} />

        {section ? (
          <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            Every figure above comes from the same rule files the{" "}
            <Link
              href={sectionHref(section)}
              className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
            >
              {section.name.toLowerCase()} tool
            </Link>{" "}
            runs on. Its{" "}
            <Link
              href={`${sectionHref(section)}/sources`}
              className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
            >
              sources page
            </Link>{" "}
            lists every one of them, dated.
          </p>
        ) : null}
      </article>
    </div>
  );
}
