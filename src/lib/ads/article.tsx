/**
 * The in-article placement — how `article-mid` gets into the middle of an MDX
 * body without an author having to put it there.
 *
 * SERVER ONLY. Called from `ArticleView`, which is a server component; the
 * outline read happens during prerender.
 *
 * ── Where the slot goes, and why it is expressed as "before the second H2" ──
 * The rule is "only after the first H2". The natural reading of that is "at the
 * end of the first section", and the end of the first section is the moment
 * before the second one starts — so the slot is emitted immediately BEFORE the
 * second `<h2>`, not immediately after the first.
 *
 * That distinction is the whole placement. An ad directly under a heading sits
 * between the heading and the paragraph it introduces, which is the shape
 * readers describe as "an ad I had to read past to find the article". An ad at
 * a section boundary sits where a reader has already finished something, which
 * is where a break belongs whether or not it is being sold.
 *
 * ── The refusals ───────────────────────────────────────────────────────────
 * No slot at all when:
 *
 *   · the article has fewer than four H2s. Every article here closes with a
 *     `<FAQ>` block and a Sources ledger; with three sections, "before the
 *     second" is one section away from the FAQ, and the rule is that an
 *     in-article slot is never adjacent to the FAQ or the Sources. Four is the
 *     first count that leaves two full sections between the slot and the
 *     closing blocks.
 *   · the outline could not be read, or the second heading never turns up in
 *     the rendered tree (a heading whose markdown and rendered text differ by
 *     more than this module normalises). Nothing renders. A missing ad is a
 *     lost impression; an ad in an unreviewed position is a policy finding.
 *
 * ── Idempotence ────────────────────────────────────────────────────────────
 * The decision is a string comparison against a value read from the file, so a
 * re-render puts the slot in the same place. There is no counter and no
 * mutable state anywhere in this module.
 */

import type { ReactNode } from "react";
import { isValidElement, type ReactElement } from "react";

import { AdPlacement } from "./AdPlacement";
import { articleH2Headings, headingText } from "./article-outline";

/** Below this many H2s an article has no room for an in-body slot. */
export const MIN_H2S_FOR_IN_ARTICLE_SLOT = 4;

/** Flattens a heading's children to comparable text. */
function flatten(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join("");
  if (isValidElement(node)) {
    const props = (node as ReactElement<{ children?: ReactNode }>).props;
    return flatten(props.children);
  }
  return "";
}

type H2Component = (props: { children?: ReactNode }) => ReactNode;

/** The shape a compiled MDX module accepts. See src/lib/content/mdx.d.ts. */
type ArticleComponents = Readonly<Record<string, unknown>>;

/**
 * Returns the article's component map with its `h2` wrapped so that the second
 * heading is preceded by the in-article slot. Returns the map untouched when
 * the article does not qualify — too few sections, an unreadable outline, or a
 * map with no `h2` to wrap.
 */
export function withInArticleSlot(
  components: ArticleComponents,
  slug: string,
): ArticleComponents {
  const headings = articleH2Headings(slug);
  if (headings.length < MIN_H2S_FOR_IN_ARTICLE_SLOT) return components;

  const target = headings[1];
  if (!target) return components;

  const Heading = components.h2;
  if (typeof Heading !== "function") return components;
  const RenderHeading = Heading as H2Component;

  const wrapped: H2Component = (props) => {
    const isTarget = headingText(flatten(props.children)) === target;
    if (!isTarget) return <RenderHeading {...props} />;

    return (
      <>
        {/* `mt-10` matches the h2's own top margin, so the slot sits in the
            section rhythm rather than crowding the heading below it. */}
        <AdPlacement id="article-mid" className="mt-10" />
        <RenderHeading {...props} />
      </>
    );
  };

  return { ...components, h2: wrapped };
}
