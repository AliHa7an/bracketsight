import Link from "next/link";

import type { Post } from "@/lib/content/posts";
import { SECTIONS } from "@/lib/site";

/**
 * RelatedArticles — resolved, never written.
 *
 * The list comes from `relatedPosts()` in `src/lib/content/posts.ts`, which
 * ranks on cluster, then tool, then shared keywords. Nothing here is a
 * hand-kept "see also" block, because a hand-kept block is wrong within a
 * month: it cannot know about articles published after it, and it keeps
 * linking to ones that were retired.
 *
 * Each item names the tool it belongs to, so a cross-tool link — the MAGI
 * article under paycheck reaching the MAGI article under health cover — reads
 * as a deliberate jump rather than a stray.
 *
 * Renders nothing when there is nothing to relate to. An empty "Related"
 * heading is worse than no heading, and on a young content programme it will
 * be empty for a while.
 */

export interface RelatedArticlesProps {
  posts: readonly Post[];
  heading?: string;
}

const TOOL_NAMES = new Map(SECTIONS.map((section) => [section.slug, section.name]));

export function RelatedArticles({ posts, heading = "Related guides" }: RelatedArticlesProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related" className="my-8">
      <h2 id="related">{heading}</h2>

      <ul className="mt-4 list-none space-y-0 p-0">
        {posts.map((post) => (
          <li key={post.slug} className="hairline-b">
            <Link
              href={post.href}
              className="rounded-atlas block py-3 no-underline hover:bg-ink/5"
            >
              <span className="micro-label">{TOOL_NAMES.get(post.tool) ?? post.tool}</span>
              <span className="mt-1 block text-ink underline decoration-rule underline-offset-4">
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
    </section>
  );
}
