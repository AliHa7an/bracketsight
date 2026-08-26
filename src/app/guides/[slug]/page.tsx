import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPost, listPosts, toolIndexIsIndexable, toolsWithPosts } from "@/lib/content";
import { articleRoute, routeMetadata, toolIndexRoute } from "@/lib/seo";
import { SECTIONS, type Section } from "@/lib/site";
import { ArticleView } from "./ArticleView";
import { ToolIndexView } from "./ToolIndexView";

/**
 * /guides/[slug] — one segment, two kinds of page.
 *
 * A slug that names one of the five tools is that tool's cluster index; every
 * other slug is an article. They share a segment on purpose: reading URLs stay
 * short (`/guides/rap-has-no-payment-cap`) and no article is more than one hop
 * from the hub. The frontmatter schema reserves the five tool slugs so the two
 * families can never collide — see `RESERVED_ARTICLE_SLUGS`.
 *
 * `dynamicParams = false` closes the route: anything not enumerated below is a
 * 404 at the edge, never a render attempt with an attacker-supplied slug.
 */

export const dynamicParams = false;

/** A tool index exists only when the tool actually has guides. */
function toolSection(slug: string): Section | null {
  const section = SECTIONS.find((candidate) => candidate.slug === slug);
  if (!section) return null;
  return toolsWithPosts().includes(section.slug) ? section : null;
}

export function generateStaticParams(): { slug: string }[] {
  return [
    ...toolsWithPosts().map((tool) => ({ slug: tool })),
    ...listPosts().map((post) => ({ slug: post.slug })),
  ];
}

/**
 * Both shapes go through the same registry builders as every other route, so
 * an article title over 60 characters or a tool index whose description
 * collides with another page's fails the build here rather than in a crawl.
 *
 * A tool index that lists fewer than `TOOL_INDEX_MIN_POSTS` articles asks not
 * to be indexed: everything on it also appears on `/guides`, so as a search
 * result it is a URL holding links. `follow` stays on, because the articles it
 * points at are the pages that should rank. `sitemap.ts` reads the same
 * predicate through the same `indexable` flag, so the directive and the
 * sitemap cannot drift apart.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const section = toolSection(slug);
  if (section) {
    return routeMetadata(
      toolIndexRoute({
        slug: section.slug,
        name: section.name,
        tagline: section.tagline,
        indexable: toolIndexIsIndexable(section.slug),
        lastModified: null,
      }),
    );
  }

  const post = getPost(slug);
  if (!post) return {};

  const tool = SECTIONS.find((candidate) => candidate.slug === post.tool);

  return routeMetadata(
    articleRoute({
      slug: post.slug,
      title: post.title,
      description: post.description,
      tool: post.tool,
      toolName: tool?.name ?? post.tool,
      updatedAt: post.updatedAt,
      primaryKeyword: post.primaryKeyword,
    }),
    {
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      author: post.author,
      sectionName: tool?.name ?? post.tool,
      keywords: [post.primaryKeyword, ...post.secondaryKeywords],
    },
  );
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const section = toolSection(slug);
  if (section) return <ToolIndexView section={section} />;

  const post = getPost(slug);
  if (!post) notFound();

  return <ArticleView post={post} />;
}
