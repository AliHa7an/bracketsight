/**
 * @/lib/content — the article pipeline's public surface.
 *
 * Routes and components import from here rather than reaching for a deep
 * path, so the internal layout can change without a sweep across `src/app`.
 *
 * The one thing NOT re-exported is `known-gaps.ts`. It reads the filesystem
 * and is meant to be imported deliberately, by the two components that render
 * a disclosure — not pulled into every module that wanted a figure.
 */

export {
  figureText,
  getFigure,
  getFigureTable,
  listFigureIds,
  listFigureTableIds,
  type Figure,
  type FigureCitation,
  type FigureId,
  type FigureTableData,
  type FigureTableId,
  type FigureUnit,
  type ScalarFigure,
} from "./figures";

export { jsonLd } from "./json-ld";

export { loadArticleBody } from "./mdx-body";

export {
  TOOL_INDEX_MIN_POSTS,
  clustersForTool,
  getPost,
  indexableToolGuides,
  listPosts,
  postsForTool,
  relatedPosts,
  toolGuidesHref,
  toolIndexIsIndexable,
  toolsWithPosts,
  type Frontmatter,
  type Post,
} from "./posts";

export {
  ARTICLE_INTENTS,
  ARTICLE_TOOLS,
  UNREVIEWED,
  frontmatterSchema,
  parseFrontmatter,
  type ArticleIntent,
  type ArticleSource,
} from "./schema";

export {
  loansScenarioHref,
  toolAcceptsPrefill,
  toolHref,
  type LoansPrefill,
  type LoansPrefillLoan,
} from "./tool-links";
