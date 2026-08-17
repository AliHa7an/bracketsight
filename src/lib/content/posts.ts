/**
 * The article index — one read of `content/posts`, validated, cached.
 *
 * Every route that lists, links to or renders a guide comes through here, so
 * there is exactly one answer to "what articles exist" and it is derived from
 * the filesystem rather than from a hand-kept manifest. A manifest is the
 * thing that goes stale the first week a content programme runs.
 *
 * The whole directory is validated on first read, not the one article being
 * rendered. That is deliberate: a broken frontmatter block anywhere fails the
 * build of every guide page, immediately, rather than lying in wait until
 * someone happens to visit the URL it broke.
 *
 * SERVER ONLY — reads the filesystem, during prerender.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";

import type { SectionSlug } from "@/lib/site";
import { parseFrontmatter, type Frontmatter } from "./schema";

export type { Frontmatter } from "./schema";

/** Where articles live. Flat: the tool is frontmatter, not a directory. */
const POSTS_DIR = "content/posts";

export interface Post extends Frontmatter {
  /** `/guides/rap-vs-ibr-crossover`. Never build this by hand. */
  readonly href: string;
  /** The file it came from, for error messages. */
  readonly file: string;
}

/* ------------------------------------------------------------------- read */

let cache: readonly Post[] | null = null;

function readAllPosts(): readonly Post[] {
  const dir = join(process.cwd(), POSTS_DIR);
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .sort();

  const posts: Post[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const { data } = matter(raw);
    const frontmatter = parseFrontmatter(data, file);

    // The filename is the URL. Letting them diverge means the article a
    // reviewer opens and the article a reader gets are different files.
    const expected = `${frontmatter.slug}.mdx`;
    if (file !== expected) {
      throw new Error(
        `content/posts/${file} declares slug "${frontmatter.slug}", so the file must be named ${expected}.`,
      );
    }

    const duplicate = seen.get(frontmatter.slug);
    if (duplicate) {
      throw new Error(
        `Duplicate slug "${frontmatter.slug}" in content/posts/${file} and content/posts/${duplicate}.`,
      );
    }
    seen.set(frontmatter.slug, file);

    if (frontmatter.draft) continue;

    posts.push({ ...frontmatter, href: `/guides/${frontmatter.slug}`, file });
  }

  // Most recently reviewed first. `updatedAt` and not `publishedAt`: a piece
  // that was re-verified last week is the more useful one to surface, and on a
  // site whose value is current rules that is not a vanity ordering.
  return posts.sort((a, b) =>
    a.updatedAt === b.updatedAt ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt),
  );
}

/** Every published article, newest review first. */
export function listPosts(): readonly Post[] {
  cache ??= readAllPosts();
  return cache;
}

/** One article, or null. Callers on a route should 404 on null. */
export function getPost(slug: string): Post | null {
  return listPosts().find((post) => post.slug === slug) ?? null;
}

/** Articles for one tool. */
export function postsForTool(tool: SectionSlug): readonly Post[] {
  return listPosts().filter((post) => post.tool === tool);
}

/** Tools that currently have at least one published article. */
export function toolsWithPosts(): readonly SectionSlug[] {
  const tools = new Set(listPosts().map((post) => post.tool));
  return [...tools];
}

/** Articles for one tool, grouped by cluster, clusters in alphabetical order. */
export function clustersForTool(tool: SectionSlug): readonly { cluster: string; posts: readonly Post[] }[] {
  const groups = new Map<string, Post[]>();
  for (const post of postsForTool(tool)) {
    const bucket = groups.get(post.cluster);
    if (bucket) bucket.push(post);
    else groups.set(post.cluster, [post]);
  }
  return [...groups.entries()]
    .map(([cluster, posts]) => ({ cluster, posts }))
    .sort((a, b) => a.cluster.localeCompare(b.cluster));
}

/* ---------------------------------------------------------------- related */

/**
 * Related articles, resolved from metadata — never a hand-written list.
 *
 * A hand-kept "see also" block is wrong within a month: it does not know about
 * articles published after it, and it keeps pointing at ones that were
 * retired. Ranking, strongest signal first:
 *
 *   1. Same cluster. Two pieces in `rap-vs-idr` are about the same decision.
 *   2. Same tool. Different question, same engine, same reader.
 *   3. A shared keyword across tools. This is the one that earns its place —
 *      it is how the MAGI article under `paycheck` finds the MAGI article
 *      under `aca`, which is a genuine connection a reader makes and a
 *      per-tool listing never surfaces.
 *
 * Ties break on `updatedAt`, so a freshly re-verified piece outranks a stale
 * one at the same relevance.
 */
export function relatedPosts(post: Post, limit = 4): readonly Post[] {
  const keywords = new Set(
    [post.primaryKeyword, ...post.secondaryKeywords].map((keyword) => keyword.toLowerCase()),
  );

  const scored = listPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      const candidateKeywords = [candidate.primaryKeyword, ...candidate.secondaryKeywords].map(
        (keyword) => keyword.toLowerCase(),
      );
      const shared = candidateKeywords.filter((keyword) => keywords.has(keyword)).length;

      let score = 0;
      if (candidate.tool === post.tool && candidate.cluster === post.cluster) score += 100;
      if (candidate.tool === post.tool) score += 20;
      score += shared * 10;
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) =>
      b.score === a.score
        ? b.candidate.updatedAt.localeCompare(a.candidate.updatedAt)
        : b.score - a.score,
    );

  return scored.slice(0, limit).map((entry) => entry.candidate);
}

/* ------------------------------------------------------------------- urls */

/** `/guides/loans` — a tool's cluster index. */
export function toolGuidesHref(tool: SectionSlug): string {
  return `/guides/${tool}`;
}
