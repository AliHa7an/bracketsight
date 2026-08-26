/**
 * @/components/content — the article components.
 *
 * Everything an article or a guide route renders that is not a design-system
 * primitive. These compose `@/components/ui` rather than replacing it: there
 * are no new buttons, inputs or disclosures here, only content blocks built
 * out of the ones that exist.
 */

export { ContentsRail } from "./ContentsRail";
export { FAQ, type FAQItem, type FAQProps } from "./FAQ";
export { FigureTable, type FigureTableProps } from "./FigureTable";
export { KeyFigure, type KeyFigureProps } from "./KeyFigure";
export { LastReviewed, type LastReviewedProps } from "./LastReviewed";
export { RelatedArticles, type RelatedArticlesProps } from "./RelatedArticles";
export { Sources, type SourcesProps } from "./Sources";
export { ToolCTA, type ToolCTAProps } from "./ToolCTA";
export { ToolLinks, type ToolLinksProps } from "./ToolLinks";
export { articleComponents } from "./mdx-components";
