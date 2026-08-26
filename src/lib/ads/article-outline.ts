/**
 * The H2 outline of an article, read from its source at build time.
 *
 * SERVER ONLY — reads the filesystem, during prerender. Nothing in this file
 * reaches the browser.
 *
 * ── Why the outline is read from the file rather than counted while rendering ──
 * The in-article slot goes at the end of the FIRST section, which means the
 * component that renders it has to recognise the second H2 as it goes past.
 * Counting headings during the render would work exactly once: React is free
 * to re-render a tree, and a counter that has already reached two puts the
 * slot in a different place the second time, or nowhere. Reading the outline
 * up front makes the decision a pure function of the file — the same slot ends
 * up in the same place on every render, on the server and in the browser, which
 * is also what stops it being a hydration mismatch.
 *
 * It also answers the question a counter cannot answer until it is too late:
 * how many sections are there BELOW the slot? An article with three H2s, one
 * of which is the FAQ, has no room for an in-body ad that is not adjacent to
 * something it must not touch. Knowing the count in advance lets the placement
 * be refused rather than squeezed in.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Same directory `src/lib/content/posts.ts` reads. Flat, slug-named. */
const POSTS_DIR = "content/posts";

/**
 * Strips the frontmatter block and every fenced code block, so a `## heading`
 * inside a code sample is not mistaken for a section of the article.
 */
function stripNonProse(raw: string): string {
  const withoutFrontmatter = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return withoutFrontmatter.replace(/^```[\s\S]*?^```\s*$/gm, "");
}

/**
 * Reduces a raw markdown heading to the text a reader sees: inline code marks,
 * emphasis and link syntax removed, whitespace collapsed. This is the form the
 * rendered `<h2>` will be compared against.
 */
export function headingText(raw: string): string {
  return raw
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const cache = new Map<string, readonly string[]>();

/**
 * Every H2 in an article, in document order, as rendered text.
 * Returns an empty list if the file cannot be read — fail closed: no outline,
 * no in-article slot.
 */
export function articleH2Headings(slug: string): readonly string[] {
  const cached = cache.get(slug);
  if (cached) return cached;

  let headings: readonly string[] = [];
  try {
    const raw = readFileSync(join(process.cwd(), POSTS_DIR, `${slug}.mdx`), "utf8");
    headings = [...stripNonProse(raw).matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)]
      .map((match) => headingText(match[1] ?? ""))
      .filter((text) => text.length > 0);
  } catch {
    headings = [];
  }

  cache.set(slug, headings);
  return headings;
}
