import Link from "next/link";

import {
  LastReviewed,
  RelatedArticles,
  Sources,
  articleComponents,
} from "@/components/content";
import { AdPlacement } from "@/lib/ads";
import { withInArticleSlot } from "@/lib/ads/article";
import { loadArticleBody, relatedPosts, toolGuidesHref, type Post } from "@/lib/content";
import { article, renderJsonLd } from "@/lib/seo";
import { UNREVIEWED } from "@/lib/content/schema";
import { SECTIONS, sectionHref } from "@/lib/site";
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
 *
 * ── The two ad placements, and the two things they are kept away from ──────
 * `article-mid` is injected into the MDX stream by `withInArticleSlot`, which
 * puts it at the end of the first section — immediately before the second H2 —
 * and refuses to place it at all on an article with fewer than four H2s. That
 * refusal is what keeps it clear of the closing `<FAQ>` block, which every
 * article ends with.
 *
 * `article-foot` is last on the page, after the Sources ledger, the related
 * articles and the kicker. The Sources block is never the slot's neighbour in
 * either direction: two elements stand between them, and the kicker is not
 * conditional.
 *
 * Reserved heights and reasoning: src/lib/ads/placements.ts.
 */

const TOOL_NAMES = new Map(SECTIONS.map((section) => [section.slug, section.name]));

export async function ArticleView({ post }: { post: Post }) {
  const Body = await loadArticleBody(post.slug);
  const related = relatedPosts(post);
  const section = SECTIONS.find((candidate) => candidate.slug === post.tool);
  const toolName = TOOL_NAMES.get(post.tool) ?? post.tool;

  /*
   * `Article`, built and validated by `src/lib/seo/schema.ts`.
   *
   * `reviewedBy` is present only when a human actually reviewed the piece —
   * `UNREVIEWED` renders a visible "not yet reviewed" line and suppresses the
   * property entirely. An article may ship unreviewed; it may not ship
   * claiming a review that did not happen, which is the same rule that keeps
   * `MAINTAINER` null in src/lib/site.ts rather than filled with a name.
   *
   * `author` is an Organization, not a Person, because the byline in
   * `content/posts` is a masthead. Dressing a masthead as a Person invents a
   * human on a YMYL finance page.
   */
  const articleMarkup = renderJsonLd(
    article({
      headline: post.title,
      description: post.description,
      path: post.href,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      author: post.author,
      reviewedBy: post.reviewedBy === UNREVIEWED ? null : post.reviewedBy,
      sectionName: toolName,
      keywords: [post.primaryKeyword, ...post.secondaryKeywords],
      citations: post.sources.map((source) => ({ label: source.label, url: source.url })),
    }),
  );

  return (
    <div data-section={post.tool} className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleMarkup }}
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
          <Body components={withInArticleSlot(articleComponents, post.slug)} />
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

        <AdPlacement id="article-foot" className="mt-10" />
      </article>
    </div>
  );
}
