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

/**
 * One article.
 *
 * The `data-section` wrapper is the whole theming mechanism: a guide about
 * student loans reads in the loans palette, one about health cover in the ACA
 * palette. Nothing else changes — same components, same type scale — so a
 * reader who arrives from a tool page stays in the same visual world as the
 * numbers they came from.
 *
 * Structured data:
 *   • `Article`, with `dateModified` from `updatedAt` and `reviewedBy` present
 *     only when a human actually reviewed it.
 *   • `BreadcrumbList` for Home → Guides → tool → this article. Every crumb in
 *     it is a link a reader can see and click in the kicker above the title —
 *     markup that describes a hierarchy the page does not show is the
 *     structured-data abuse the publisher policies name, and a trail that
 *     exists only in JSON would be exactly that.
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

  const breadcrumbMarkup = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
      {
        "@type": "ListItem",
        position: 3,
        name: toolName,
        item: absoluteUrl(toolGuidesHref(post.tool)),
      },
      { "@type": "ListItem", position: 4, name: post.title },
    ],
  };

  return (
    <div data-section={post.tool} className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleMarkup) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbMarkup) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10">
        <header>
          {/* The visible trail every crumb in the markup above resolves to. */}
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
