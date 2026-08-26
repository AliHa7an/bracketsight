import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/seo/og";
import { getPost, listPosts, toolsWithPosts } from "@/lib/content";
import { SECTIONS } from "@/lib/site";

/**
 * The card for one guide — headline straight from the article's frontmatter.
 *
 * `/guides/[slug]` serves two shapes, so this does too: a slug that names one
 * of the five tools is that tool's cluster index and gets the section's name
 * on the section's palette; every other slug is an article and gets its own
 * title, its tool's accent, and the date it was last reviewed.
 *
 * The headline is `post.title`, which is also the `<h1>`, also the `<title>`
 * and also the `Article.headline` in the JSON-LD. One string, four places, one
 * file to edit — which is the whole reason the article's own frontmatter is
 * the source rather than a card-specific field nobody would remember to
 * change.
 *
 * `generateStaticParams` is declared here as well as on the page. An image
 * route in a dynamic segment is its own route, and without it the cards would
 * be generated on demand rather than written to disk at build — which for a
 * fully static site means a cold render on the first share of every article.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Bracketsight guide";

export function generateStaticParams(): { slug: string }[] {
  return [
    ...toolsWithPosts().map((tool) => ({ slug: tool })),
    ...listPosts().map((post) => ({ slug: post.slug })),
  ];
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const section = SECTIONS.find((candidate) => candidate.slug === slug);
  if (section) {
    return new ImageResponse(
      (
        <OgCard
          headline={`${section.name} guides`}
          strap={section.tagline}
          section={section.slug}
          kicker="Guides"
        />
      ),
      { ...OG_SIZE },
    );
  }

  const post = getPost(slug);
  if (!post) {
    /*
     * `dynamicParams = false` on the page closes this route to anything not
     * enumerated above, so this branch is unreachable in a build. It renders
     * the site's default card rather than throwing, because an image route
     * that throws fails the whole build for a slug that cannot exist.
     */
    return new ImageResponse(
      (
        <OgCard
          headline="How the US money rules actually work"
          strap="One page per decision, grouped by the engine that computes it"
          section={null}
          kicker="Guides"
        />
      ),
      { ...OG_SIZE },
    );
  }

  const toolName = SECTIONS.find((candidate) => candidate.slug === post.tool)?.name ?? post.tool;

  return new ImageResponse(
    (
      <OgCard
        headline={post.title}
        strap={`${toolName} guide · last reviewed ${post.updatedAt}`}
        section={post.tool}
        kicker="Guide"
      />
    ),
    { ...OG_SIZE },
  );
}
