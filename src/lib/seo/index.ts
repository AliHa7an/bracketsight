/**
 * @/lib/seo — everything a route needs to describe itself.
 *
 * Pages import from here, never from a deep path, so the internal layout can
 * change without a sweep across `src/app`.
 *
 * `freshness.ts` is deliberately NOT re-exported. It resolves rule sets and is
 * meant to be imported by `sitemap.ts` alone; pulling it into the barrel would
 * put five engines into the import graph of every page that only wanted a
 * title. `og.tsx` is likewise imported directly by the image routes.
 */

export { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX } from "./constraints";

export { pageMetadata, routeMetadata, type ArticleFacets } from "./metadata";

export {
  POLICY_UPDATED,
  STATIC_ROUTES,
  articleRoute,
  countyRoute,
  stateContractRoute,
  staticRoute,
  toolIndexRoute,
  type RouteSeo,
} from "./routes";

export {
  article,
  breadcrumbList,
  definedTermSet,
  faqPage,
  howTo,
  organization,
  renderJsonLd,
  renderJsonLdAll,
  webApplication,
  webSite,
  type ArticleInput,
  type DefinedTermInput,
  type FaqItem,
  type ToolAppInput,
} from "./schema";

export {
  articlesForTool,
  assertLinkModel,
  linksForArticle,
  termsForTool,
  toolLinks,
  workingsForTool,
  type ArticleLinks,
  type LinkTarget,
  type TermTarget,
  type ToolLinkModel,
} from "./links";
