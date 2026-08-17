/**
 * Article frontmatter — the schema, and the reason the build fails without it.
 *
 * Every file in `content/posts` carries a YAML block that this schema parses
 * with `.parse()`, never `.safeParse()`. A missing `reviewedBy`, a source with
 * no `lastVerified`, a description that would be truncated in a SERP: each one
 * throws, and a throw during `generateStaticParams` fails `next build`. That
 * is the intended behaviour. A YMYL finance article that publishes without a
 * dated primary source is worse than an article that does not publish, and a
 * content programme of fifty pieces will not catch that by eye.
 *
 * Where a rule is a judgement call rather than a fact, the bound is stated in
 * a comment beside it so a writer hitting the error knows what to change.
 */

import { z } from "zod";

import type { SectionSlug } from "@/lib/site";

/* -------------------------------------------------------------- primitives */

/** `2026-08-18`. Rejects `2026-8-8`, timestamps and anything unparseable. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date, yyyy-mm-dd")
  .refine((value) => !Number.isNaN(Date.parse(value)), "is not a real date");

/**
 * A source has to be fetchable and dated. `http://` is rejected outright: a
 * citation a reader cannot reach over TLS is a citation a browser will warn
 * them away from, and every primary source this site uses serves https.
 */
const sourceSchema = z.object({
  /** Name the source precisely: "34 C.F.R. § 685.209(b)(2)", not "the rules". */
  label: z.string().min(4),
  url: z
    .string()
    .startsWith("https://", "sources must be https")
    .refine((value) => URL.canParse(value), "is not a parseable URL"),
  /** The day a human last opened this URL and confirmed the claim. */
  lastVerified: isoDate,
});

export type ArticleSource = z.infer<typeof sourceSchema>;

/**
 * Search intent, as a closed set.
 *
 * Free text here drifts into forty synonyms across fifty articles and stops
 * being groupable. These five are the shapes this site's pages actually take.
 */
export const ARTICLE_INTENTS = [
  /** "What is X" — definition and mechanism. */
  "informational",
  /** "X vs Y" — two named options, one recommendation. */
  "comparison",
  /** "Should I X" — the reader is at a decision with a deadline. */
  "decision",
  /** "How do I X" — a procedure with steps. */
  "procedural",
  /** "X is wrong / X was denied" — diagnosing a specific failure. */
  "troubleshooting",
] as const;

export type ArticleIntent = (typeof ARTICLE_INTENTS)[number];

/**
 * The five tools, restated as a Zod enum.
 *
 * `SectionSlug` in `src/lib/site.ts` is the source of truth; the
 * `satisfies` below is what makes drift a compile error rather than a runtime
 * surprise, without this module reaching into the shell's config to build a
 * schema at runtime.
 */
export const ARTICLE_TOOLS = ["loans", "paycheck", "aca", "property", "trades"] as const satisfies
  readonly SectionSlug[];

/**
 * Slugs the guide routes reserve for themselves.
 *
 * `/guides/[slug]` serves both articles and the per-tool cluster indexes, so
 * an article slugged `loans` would shadow the loans cluster listing. Caught
 * here rather than discovered as a missing page after launch.
 */
export const RESERVED_ARTICLE_SLUGS: readonly string[] = [...ARTICLE_TOOLS];

/**
 * The sentinel for "no human has reviewed this yet".
 *
 * `src/lib/site.ts` types the site maintainer as `Maintainer | null` and
 * refuses to fill it with a plausible-looking placeholder, for the reason
 * stated there: a fabricated name on a YMYL finance page is worse than an
 * empty field. The same rule governs a byline. An article may ship
 * unreviewed — it may not ship claiming a review that did not happen — so
 * `reviewedBy: UNREVIEWED` renders a visible "not yet reviewed" line and
 * suppresses the `reviewedBy` property in the Article JSON-LD entirely.
 */
export const UNREVIEWED = "UNREVIEWED";

/* ------------------------------------------------------------------ schema */

export const frontmatterSchema = z
  .object({
    /**
     * The `<h1>`, the `<title>` and the JSON-LD headline. Capped at 70
     * characters because Google truncates a title tag around there and a
     * clipped headline is a clipped promise.
     */
    title: z.string().min(10).max(70),

    /**
     * The meta description. 70–160 characters: under 70 wastes the slot,
     * over 160 is rewritten by the search engine and the writer loses control
     * of it. Must read as a sentence, so it ends in punctuation.
     */
    description: z
      .string()
      .min(70)
      .max(160)
      .refine((value) => /[.?!]$/.test(value), "must end in a full stop"),

    /**
     * URL segment. Lowercase, hyphenated, no dates — a dated slug ages the
     * URL and forces a redirect the first time the article is refreshed.
     */
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase-hyphenated")
      .max(72)
      .refine(
        (value) => !RESERVED_ARTICLE_SLUGS.includes(value),
        "is reserved for a /guides/<tool> cluster index — pick another slug",
      ),

    /** Which engine the article's figures come from, and which palette it wears. */
    tool: z.enum(ARTICLE_TOOLS),

    /**
     * The cluster this article belongs to inside its tool: `rap-vs-idr`,
     * `subsidy-cliff`, `appeal-evidence`. Free text, lowercase-hyphenated,
     * because clusters are a content decision and get invented as the
     * programme runs — but it is the key `RelatedArticles` resolves on, so a
     * typo silently orphans the piece. Kept lowercase to make that unlikely.
     */
    cluster: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase-hyphenated"),

    /** The one query this page is written to win. */
    primaryKeyword: z.string().min(3),

    /** Supporting queries. At least one — a page with no secondary coverage is a stub. */
    secondaryKeywords: z.array(z.string().min(3)).min(1),

    intent: z.enum(ARTICLE_INTENTS),

    publishedAt: isoDate,
    /**
     * Drives the visible "Last reviewed" line and `dateModified`. It is not a
     * freshness lever: move it when the page changed, never to look recent.
     */
    updatedAt: isoDate,

    /** A named human, or a masthead the About page accounts for. */
    author: z.string().min(2),

    /** A named reviewer, or `UNREVIEWED`. See the constant above. */
    reviewedBy: z.string().min(2),

    /**
     * Primary sources for the claims on the page. At least two: one source is
     * a citation, two is corroboration, and every figure this site prints is
     * meant to be checkable without trusting the site.
     */
    sources: z.array(sourceSchema).min(2),

    /**
     * Excluded from the index, the sitemap and the route table. A draft is
     * invisible rather than noindexed — a page that renders is a page that
     * leaks.
     */
    draft: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.updatedAt < value.publishedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: `updatedAt (${value.updatedAt}) is before publishedAt (${value.publishedAt})`,
      });
    }
    for (const [index, source] of value.sources.entries()) {
      if (source.lastVerified > value.updatedAt) {
        ctx.addIssue({
          code: "custom",
          path: ["sources", index, "lastVerified"],
          message: `source verified ${source.lastVerified}, after the article's updatedAt (${value.updatedAt}) — bump updatedAt when you re-verify a source`,
        });
      }
    }
  });

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/**
 * Parses one article's frontmatter, or throws with the file named.
 *
 * Zod's own message is precise about the field and useless about the file, and
 * "Expected string, received undefined at sources.0.label" across fifty
 * articles is a hunt. The filename goes first.
 */
export function parseFrontmatter(raw: unknown, file: string): Frontmatter {
  const result = frontmatterSchema.safeParse(raw);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Invalid frontmatter in content/posts/${file}:\n${issues}\n\n` +
      `Frontmatter is validated at build time on purpose — see src/lib/content/schema.ts. ` +
      `Fix the block; do not relax the schema to get a build through.`,
  );
}
