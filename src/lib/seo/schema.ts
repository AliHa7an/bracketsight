/**
 * Structured data — built, then VALIDATED, then serialised.
 *
 * Three rules govern every builder below, and the third is the one that gets
 * sites penalised rather than merely ignored.
 *
 * 1. NOTHING IS HAND-WRITTEN AT A CALL SITE. Each type has a builder with a
 *    typed input, so a required property cannot be forgotten and a property
 *    schema.org does not define cannot be invented. The `@type` strings appear
 *    exactly once each, here.
 *
 * 2. EVERY NODE IS CHECKED BEFORE IT IS SERIALISED. `assertNode` walks the
 *    object graph and throws on a missing required property or an unexpected
 *    one — at build time, with the type named. Rendering invalid markup is
 *    worse than rendering none: an incomplete node is silently dropped by the
 *    parser, so the page pays the cost of the bytes and gets nothing, and
 *    nobody finds out because nothing visibly breaks.
 *
 * 3. NOTHING IS MARKED UP THAT A READER CANNOT SEE. This is a policy line, not
 *    a preference: `FAQPage` carrying questions that are not on the page, and
 *    `HowTo` over a procedure that does not exist, are the two structured-data
 *    abuses Google names explicitly. The builders enforce it structurally —
 *    `faqPage` takes the SAME array the page renders, so the two are the same
 *    strings — and `scripts/seo-check.mjs` re-checks it against the emitted
 *    HTML afterwards, by looking for each marked-up string in the page text.
 *
 * ── WHAT THIS SITE EMITS, AND WHAT IT REFUSES TO ────────────────────────────
 *   Organization        once, on `/`. Name, origin and the contact address
 *                       that is rendered as visible text in the footer.
 *   WebSite             once, on `/`. WITHOUT `potentialAction`/`SearchAction`
 *                       — see `webSite()` for why that omission is deliberate.
 *   WebApplication      one per tool root, five in total.
 *   FAQPage             where the questions are visibly the page's H2s.
 *   Article             one per guide.
 *   BreadcrumbList      every page, from the same trail rendered visibly.
 *   DefinedTermSet      the glossary.
 *   HowTo               NONE. The builder exists and is validated; nothing on
 *                       the site currently qualifies. See `howTo()`.
 *   Person              NONE, ever, while `MAINTAINER` is null. See `person()`.
 */

import { jsonLd } from "@/lib/content/json-ld";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/* ────────────────────────────────────────────────────────── the validator ── */

type Node = Record<string, unknown> & { readonly "@type": string };

/**
 * Required and permitted properties per type.
 *
 * `scripts/seo-check.mjs` carries the same table and applies it to the emitted
 * HTML. Two copies is the right number here rather than one shared module: the
 * script must be able to run against a built directory with no TypeScript
 * toolchain and no import of application code, which is what lets it be
 * pointed at a deployed artefact. They are checked against each other by the
 * fact that a divergence fails one of the two runs.
 */
const SPEC: Readonly<Record<string, { required: readonly string[]; optional: readonly string[] }>> = {
  Organization: {
    required: ["name", "url"],
    optional: ["email", "description", "contactPoint", "logo", "sameAs", "@id"],
  },
  ContactPoint: {
    required: ["contactType"],
    optional: ["email", "url", "availableLanguage"],
  },
  WebSite: {
    required: ["name", "url"],
    optional: ["description", "inLanguage", "publisher", "@id", "potentialAction"],
  },
  WebApplication: {
    required: ["name", "applicationCategory", "url", "offers"],
    optional: [
      "operatingSystem",
      "description",
      "browserRequirements",
      "isAccessibleForFree",
      "featureList",
      "publisher",
      "@id",
    ],
  },
  Offer: { required: ["price", "priceCurrency"], optional: ["availability", "category"] },
  FAQPage: { required: ["mainEntity"], optional: ["@id", "inLanguage"] },
  Question: { required: ["name", "acceptedAnswer"], optional: [] },
  Answer: { required: ["text"], optional: [] },
  HowTo: {
    required: ["name", "step"],
    optional: ["description", "totalTime", "tool", "supply", "estimatedCost", "@id", "inLanguage"],
  },
  HowToStep: { required: ["name", "text"], optional: ["position", "url", "image"] },
  Article: {
    required: [
      "headline",
      "datePublished",
      "dateModified",
      "author",
      "publisher",
      "mainEntityOfPage",
    ],
    optional: [
      "description",
      "inLanguage",
      "isAccessibleForFree",
      "citation",
      "reviewedBy",
      "image",
      "@id",
      "keywords",
      "articleSection",
    ],
  },
  BreadcrumbList: { required: ["itemListElement"], optional: ["@id"] },
  ListItem: { required: ["position", "name"], optional: ["item"] },
  DefinedTermSet: {
    required: ["name", "url", "hasDefinedTerm"],
    optional: ["inLanguage", "description", "@id"],
  },
  DefinedTerm: {
    required: ["name", "description"],
    optional: ["inDefinedTermSet", "@id", "url", "termCode"],
  },
  CreativeWork: { required: ["name"], optional: ["url"] },
  Person: { required: ["name"], optional: ["url", "jobTitle", "description"] },
  WebPage: { required: [], optional: ["@id", "name", "url"] },
};

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Walks every nested `@type` and throws on the first structural failure. */
function assertNode(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertNode(item, `${path}[${String(index)}]`);
    });
    return;
  }
  if (typeof value !== "object" || value === null) return;

  const node = value as Record<string, unknown>;
  const type = node["@type"];

  if (typeof type === "string") {
    const spec = SPEC[type];
    if (!spec) {
      throw new Error(
        `JSON-LD at ${path}: no validation spec for @type "${type}". Add it to SPEC in ` +
          `src/lib/seo/schema.ts (and to scripts/seo-check.mjs) before emitting it — an ` +
          `unvalidated type is how an incomplete node ships unnoticed.`,
      );
    }
    for (const key of spec.required) {
      if (isEmpty(node[key])) {
        throw new Error(`JSON-LD at ${path} (${type}): missing required property "${key}".`);
      }
    }
    const known = new Set([...spec.required, ...spec.optional, "@type", "@context"]);
    for (const key of Object.keys(node)) {
      if (!known.has(key)) {
        throw new Error(
          `JSON-LD at ${path} (${type}): property "${key}" is not in this type's spec. ` +
            `Either it is a typo or the spec needs widening — do not ship a property a ` +
            `parser will drop.`,
        );
      }
    }
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === "@context") continue;
    assertNode(child, `${path}.${key}`);
  }
}

/**
 * Validates a node graph and returns the string for a `<script>` body.
 *
 * `jsonLd()` supplies the `<` escape that stops a `</script>` sequence inside
 * a citation label ending the element early — see `@/lib/content/json-ld`.
 */
export function renderJsonLd(node: Node): string {
  assertNode(node);
  return jsonLd({ "@context": "https://schema.org", ...node });
}

/** Validates several nodes and returns one `@graph`-free array payload. */
export function renderJsonLdAll(nodes: readonly Node[]): string {
  for (const node of nodes) assertNode(node);
  return jsonLd(nodes.map((node) => ({ "@context": "https://schema.org", ...node })));
}

/* ─────────────────────────────────────────────────────────── the builders ── */

const ORG_ID = `${SITE_URL}/#organization`;

/**
 * The publisher. Emitted once, on the home page.
 *
 * It used to be on all 55 pages, from the root layout. That is not an error,
 * but it is 55 copies of one fact, and Google's own guidance is to put
 * Organization markup on a single page and let it describe the site. One
 * definition also means one place for it to be wrong.
 *
 * Everything claimed is verifiable on the page a reader is standing on: the
 * name, the origin, and an email address rendered as visible text in the
 * footer and on `/contact`. No `logo` — the mark is an SVG favicon, and
 * Google's logo guidance wants a raster of known dimensions; claiming one that
 * does not exist is worse than omitting an optional property. No `sameAs` —
 * there are no verified social profiles to point at.
 */
export function organization(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    description:
      "Independent decision engines for US federal and local money rules. Every rule is cited to its primary source and dated. Nothing a visitor enters is stored.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "corrections and support",
        email: CONTACT_EMAIL,
        url: absoluteUrl("/contact"),
        availableLanguage: ["en"],
      },
    ],
  };
}

/**
 * The site itself.
 *
 * NO `potentialAction` / `SearchAction`, and that omission is the considered
 * part of this function rather than an oversight.
 *
 * `SearchAction` tells Google there is a site-wide search endpoint it can send
 * a query string to and offers a sitelinks searchbox in return. This site has
 * no such endpoint. There are two filter inputs inside two calculators — the
 * tipped-occupation list and an in-tool lookup — and neither has a URL, a
 * results page, or any way to be reached with a query. Declaring a
 * `SearchAction` against a `?q=` route that 404s is a claim about a feature
 * that does not exist, which is the same class of defect as an FAQ that is not
 * on the page. If a real `/search` ships, add it here and nowhere else.
 */
export function webSite(): Node {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Five decision engines for US money rules: student loan repayment, OBBBA deductions, ACA subsidies, property tax appeals and trade contracts.",
    inLanguage: "en-US",
    publisher: { "@id": ORG_ID },
  };
}

export interface ToolAppInput {
  readonly name: string;
  readonly description: string;
  readonly path: string;
  /** `FinanceApplication` for the four money tools, `BusinessApplication` for trades. */
  readonly category: "FinanceApplication" | "BusinessApplication";
  /**
   * The features the tool visibly has. Optional, and omitted rather than
   * padded: a `featureList` naming something the page does not do is the same
   * defect as an invisible FAQ, one property along.
   */
  readonly features?: readonly string[];
}

/**
 * One tool.
 *
 * `offers: { price: "0" }` and `isAccessibleForFree` are only true claims
 * because every page this is emitted on carries "free, no signup" in the
 * visible claim strip that `ToolShell` renders. If a tool ever ships behind a
 * price, this is a second place that has to change — which is why the strip
 * and this node describe the same fact rather than two.
 */
export function webApplication(input: ToolAppInput): Node {
  return {
    "@type": "WebApplication",
    "@id": `${absoluteUrl(input.path)}#app`,
    name: input.name,
    applicationCategory: input.category,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    url: absoluteUrl(input.path),
    description: input.description,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORG_ID },
    ...(input.features && input.features.length > 0 ? { featureList: [...input.features] } : {}),
  };
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/**
 * An FAQ.
 *
 * Takes the same array the page renders. There is no second argument and no
 * way to pass markup without passing the rendered list, because the failure
 * this prevents is not a typo — it is an editor improving the prose on the
 * page and leaving the JSON-LD holding the old answer, which then differs from
 * what the reader sees. Here they are one string.
 */
export function faqPage(items: readonly FaqItem[]): Node {
  if (items.length === 0) {
    throw new Error("faqPage() called with no items — emit nothing rather than an empty FAQPage.");
  }
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface HowToStepInput {
  readonly name: string;
  readonly text: string;
}

/**
 * A procedure — currently used by nothing, and that is the finding rather than
 * an omission.
 *
 * Three places were assessed as candidates and each was rejected on the same
 * test: does the page visibly show numbered steps that THE READER performs?
 *
 *   `/property`, "How the check works" — four numbered steps, visibly on the
 *   page, but three of the four are things the tool does ("We pick the
 *   comparables", "Statistics, not opinion", "An honest verdict"). It
 *   describes a mechanism, not a procedure a reader carries out.
 *
 *   `/property/counties/[state]/[county]`, the appeal levels — an ordered
 *   list, but the page's own copy says of it: "The last two are alternatives,
 *   not sequential steps." Marking it as sequential would contradict the
 *   sentence directly beneath it.
 *
 *   The W-2 check — a real two-step remedy (request a W-2c; for 2025,
 *   reconstruct the premium from stubs and file 1040-X). But `W2Checker`
 *   renders only after a reader enters figures, so none of it is in the
 *   prerendered HTML. Marking up content that is absent until an interaction
 *   is marking up content a crawler cannot see, which is the rule this module
 *   exists to keep.
 *
 * The builder stays, validated and ready, so that the day a genuine procedure
 * is written the markup is a two-line change and not a fresh decision.
 */
export function howTo(input: {
  readonly name: string;
  readonly description: string;
  readonly steps: readonly HowToStepInput[];
}): Node {
  if (input.steps.length < 2) {
    throw new Error("howTo() needs at least two steps — one step is not a procedure.");
  }
  return {
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export interface ArticleInput {
  readonly headline: string;
  readonly description: string;
  readonly path: string;
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly author: string;
  /** The reviewer's name, or null when nobody has reviewed it. */
  readonly reviewedBy: string | null;
  readonly sectionName: string;
  readonly keywords: readonly string[];
  readonly citations: readonly { readonly label: string; readonly url: string }[];
}

/**
 * One guide.
 *
 * `reviewedBy` is emitted only when a human actually reviewed the piece. An
 * article may ship unreviewed — the page says so in its visible "Last
 * reviewed" line — but it may not ship claiming a review that did not happen,
 * which is the same rule that keeps `MAINTAINER` null rather than filled with
 * a plausible name.
 *
 * `author` is an Organization rather than a Person for the same reason: the
 * byline in `content/posts` is a masthead ("Bracketsight editorial"), and
 * dressing a masthead as a `Person` invents a human.
 */
export function article(input: ArticleInput): Node {
  return {
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt,
    author: { "@type": "Organization", name: input.author, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
    articleSection: input.sectionName,
    keywords: [...input.keywords],
    inLanguage: "en-US",
    isAccessibleForFree: true,
    citation: input.citations.map((citation) => ({
      "@type": "CreativeWork",
      name: citation.label,
      url: citation.url,
    })),
    ...(input.reviewedBy === null
      ? {}
      : { reviewedBy: { "@type": "Person", name: input.reviewedBy } }),
  };
}

/**
 * The breadcrumb trail, from the same array the visible nav renders.
 *
 * The final crumb carries no `item`: it is the page itself, Google's guidance
 * allows the URL to be omitted there, and omitting it is the honest signal
 * that the last crumb is not a link — which is exactly how it is rendered.
 */
export function breadcrumbList(trail: readonly { href: string; label: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(index === trail.length - 1 ? {} : { item: absoluteUrl(crumb.href) }),
    })),
  };
}

export interface DefinedTermInput {
  readonly id: string;
  readonly term: string;
  readonly definition: string;
}

export function definedTermSet(input: {
  readonly name: string;
  readonly path: string;
  readonly terms: readonly DefinedTermInput[];
}): Node {
  const url = absoluteUrl(input.path);
  return {
    "@type": "DefinedTermSet",
    "@id": `${url}#termset`,
    name: input.name,
    url,
    inLanguage: "en-US",
    hasDefinedTerm: input.terms.map((term) => ({
      "@type": "DefinedTerm",
      "@id": `${url}#${term.id}`,
      name: term.term,
      description: term.definition,
      inDefinedTermSet: url,
    })),
  };
}

/**
 * Deliberately not implemented.
 *
 * `MAINTAINER` in `src/lib/site.ts` is `Maintainer | null` and is currently
 * null, for the reason stated there at length: a fabricated name, role or
 * credential on a YMYL finance site is a worse failure than an empty field.
 * Person markup is the machine-readable form of exactly that claim, so it is
 * omitted rather than filled — including in `Article.author`, which names the
 * editorial masthead as an Organization.
 *
 * When a real maintainer is named in `site.ts`, the `Person` spec is already
 * in `SPEC` above and `article()` will accept a reviewer; this is the only
 * thing standing between here and there.
 */
export const person = null;
