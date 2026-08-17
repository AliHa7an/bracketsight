import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPost, listPosts, toolsWithPosts } from "@/lib/content";
import { SECTIONS, absoluteUrl, type Section } from "@/lib/site";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const section = toolSection(slug);
  if (section) {
    return {
      title: `${section.name} guides`,
      description: `Every Bracketsight guide to ${section.name.toLowerCase()}: ${section.tagline}`,
      alternates: { canonical: `/guides/${slug}` },
    };
  }

  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: [post.primaryKeyword, ...post.secondaryKeywords],
    alternates: { canonical: post.href },
    openGraph: {
      type: "article",
      url: absoluteUrl(post.href),
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const section = toolSection(slug);
  if (section) return <ToolIndexView section={section} />;

  const post = getPost(slug);
  if (!post) notFound();

  return <ArticleView post={post} />;
}
