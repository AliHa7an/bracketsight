/**
 * THE INTERNAL LINK MODEL — pillar ↔ cluster ↔ glossary, resolved.
 *
 * Every edge in this graph is computed from metadata that already exists.
 * Nothing here is a hand-written "see also" block, for the reason those always
 * fail: a list typed into a page cannot know about the article published after
 * it, and it keeps pointing at the one that was retired. Six months of that is
 * how a content programme ends up with a link graph that describes the site it
 * was in January.
 *
 * ── THE THREE EDGE KINDS ────────────────────────────────────────────────────
 *
 *   PILLAR → CLUSTER   A tool page links to the guides written about it,
 *                      newest review first. `articlesForTool`.
 *   CLUSTER → PILLAR   An article links back to its tool and to 2–4 siblings.
 *                      The siblings come from `relatedPosts()`, which ranks on
 *                      cluster, then tool, then shared keywords.
 *   TOOL ↔ GLOSSARY    A glossary entry already deep-links into the tools that
 *                      use it (`entry.tools`, rendered on `/glossary`). This
 *                      module supplies the return edge — the terms a tool
 *                      puts in front of a reader — from the SAME field, so the
 *                      two directions cannot disagree about which tool uses
 *                      which term.
 *
 * ── WHY THE WORKINGS ARE IN HERE TOO ────────────────────────────────────────
 * `workingsForTool` returns a section's methodology, sources, editorial policy
 * and changelog. Those pages are in the section rail, which is navigation, and
 * a link that appears identically on every page of a section carries no signal
 * about any one of them. `/property/editorial-policy` was an orphan by that
 * measure — reachable from chrome and from no page's body copy, which is the
 * state a crawler reads as "nothing here thought this was worth pointing at".
 * One contextual link per section, from the tool page, is the fix.
 *
 * SERVER ONLY — `listPosts()` reads the filesystem during prerender.
 */

import { GLOSSARY } from "@/lib/content/glossary";
import { postsForTool, relatedPosts, toolGuidesHref, type Post } from "@/lib/content/posts";
import {
  SECTIONS,
  SECTION_PAGES,
  sectionHref,
  sectionPageHref,
  type Section,
  type SectionSlug,
} from "@/lib/site";

export interface LinkTarget {
  readonly href: string;
  readonly label: string;
  /** One line of context. Rendered under the label where there is room. */
  readonly note?: string;
}

/* ───────────────────────────────────────────────────── pillar → cluster ── */

/**
 * The guides for one tool, most recently reviewed first.
 *
 * Capped, because a pillar page linking to forty articles is a directory
 * rather than a recommendation. Four is enough to establish the cluster and
 * leaves the tool's guides index — linked alongside — to hold the rest.
 */
export function articlesForTool(tool: SectionSlug, limit = 4): readonly LinkTarget[] {
  return postsForTool(tool)
    .slice(0, limit)
    .map((post) => ({ href: post.href, label: post.title, note: post.description }));
}

/* ───────────────────────────────────────────────────── cluster → pillar ── */

export interface ArticleLinks {
  /** The tool the article explains. */
  readonly tool: LinkTarget;
  /** That tool's guides index. */
  readonly index: LinkTarget;
  /** 2–4 siblings, ranked by cluster, then tool, then shared keywords. */
  readonly siblings: readonly Post[];
}

/**
 * The links out of one article.
 *
 * `relatedPosts` is asked for four and may return fewer; on a young programme
 * it will often return one or none, and a "Related guides" heading over an
 * empty list is worse than no heading. The caller renders what it gets.
 */
export function linksForArticle(post: Post, siblingLimit = 4): ArticleLinks {
  const section = SECTIONS.find((candidate) => candidate.slug === post.tool);
  const name = section?.name ?? post.tool;

  return {
    tool: {
      href: `/${post.tool}`,
      label: `${name} tool`,
      note: section?.tagline,
    },
    index: { href: toolGuidesHref(post.tool), label: `All ${name.toLowerCase()} guides` },
    siblings: relatedPosts(post, siblingLimit),
  };
}

/* ───────────────────────────────────────────────────── tool ↔ glossary ── */

export interface TermTarget {
  /** `/glossary#common-level-range` — the anchor, never built by hand. */
  readonly href: string;
  readonly term: string;
  readonly expansion?: string;
}

/**
 * The glossary terms a tool uses, alphabetical.
 *
 * Read from `entry.tools`, which is the same field `/glossary` renders as
 * "Where it appears". One declaration drives both directions of the edge, so a
 * term cannot say it appears in the loans tool while the loans tool does not
 * link back to it.
 */
export function termsForTool(tool: SectionSlug): readonly TermTarget[] {
  return GLOSSARY.filter((entry) => entry.tools.includes(tool))
    .map((entry) => ({
      href: `/glossary#${entry.id}`,
      term: entry.term,
      ...(entry.expansion === undefined ? {} : { expansion: entry.expansion }),
    }))
    .sort((a, b) => a.term.localeCompare(b.term));
}

/* ─────────────────────────────────────────────────────────── the workings ── */

/** A section's trust pages, as body links rather than as rail navigation. */
export function workingsForTool(tool: SectionSlug): readonly LinkTarget[] {
  const section = SECTIONS.find((candidate) => candidate.slug === tool);
  if (!section) return [];
  return SECTION_PAGES[tool]
    .filter((page) => page.trust)
    .map((page) => ({ href: sectionPageHref(section, page), label: page.label }));
}

/* ─────────────────────────────────────────────────────────── the model ── */

export interface ToolLinkModel {
  readonly section: Section;
  readonly toolHref: string;
  readonly guidesHref: string;
  readonly articles: readonly LinkTarget[];
  readonly terms: readonly TermTarget[];
  readonly workings: readonly LinkTarget[];
}

let asserted = false;

/** Everything one tool page needs to link to, resolved in one call. */
export function toolLinks(tool: SectionSlug): ToolLinkModel {
  /*
   * The build gate fires here, on the first tool page prerendered, rather than
   * at module load: this module is imported by the sitemap and by client-side
   * type-only paths, and a top-level throw would take down builds that never
   * render a link block. Every build renders five of them, so the check runs.
   */
  if (!asserted) {
    assertLinkModel();
    asserted = true;
  }

  const section = SECTIONS.find((candidate) => candidate.slug === tool);
  if (!section) throw new Error(`toolLinks: "${tool}" is not a section.`);

  return {
    section,
    toolHref: sectionHref(section),
    guidesHref: toolGuidesHref(tool),
    articles: articlesForTool(tool),
    terms: termsForTool(tool),
    workings: workingsForTool(tool),
  };
}

/* ────────────────────────────────────────────────────── the build gate ── */

/**
 * Fails the build on a link the model cannot honour.
 *
 * Two specific failures, both silent at runtime:
 *
 *   • A glossary entry naming a tool that is not a section. The entry would
 *     render a link to `/typo`, which 404s, and nothing on the page would look
 *     wrong to a reviewer.
 *   • A tool whose glossary vocabulary is empty. Not an error — three of the
 *     five have only three terms — but a tool with none means the return edge
 *     does not exist for it at all, and that is worth knowing at build rather
 *     than discovering in a crawl.
 *
 * `scripts/seo-check.mjs` then re-checks the whole graph against the built
 * HTML: every internal href resolves to a route that was actually generated,
 * and every indexable route has at least one inbound link from another page's
 * body copy. This function catches what it can before the pages are even
 * rendered; that one catches everything, including links this module never
 * produced.
 */
export function assertLinkModel(): void {
  const slugs = new Set<string>(SECTIONS.map((section) => section.slug));
  const problems: string[] = [];

  for (const entry of GLOSSARY) {
    for (const tool of entry.tools) {
      if (!slugs.has(tool)) {
        problems.push(`glossary entry "${entry.id}" names tool "${tool}", which is not a section`);
      }
    }
  }

  for (const section of SECTIONS) {
    if (termsForTool(section.slug).length === 0) {
      problems.push(
        `no glossary term names the "${section.slug}" tool, so that tool has no return edge ` +
          `into /glossary — add \`tools: ["${section.slug}"]\` to the entries it uses`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Internal link model failed:\n${problems.map((p) => `  • ${p}`).join("\n")}\n\n` +
        `See src/lib/seo/links.ts.`,
    );
  }
}
