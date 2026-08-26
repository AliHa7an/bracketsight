# SEO audit — Bracketsight

**Scope:** technical SEO to production standard across all 55 indexable routes.
**Origin under test:** `https://bracketsight.com` (`NEXT_PUBLIC_SITE_URL` set at build).
**Date:** 26 August 2026.

Everything below is measured against the **built HTML** in `.next/server/app`, not
against source. That distinction is the reason this file exists: the defect this
site actually shipped — 53 canonicals resolving to `http://localhost:3000` — was
invisible at source level and obvious in the emitted markup.

The measurements are reproducible:

```
npm run build          # NEXT_PUBLIC_SITE_URL=https://bracketsight.com
npm run seo:check      # asserts; exits 1 on any failure
npm run seo:report     # same checks, never fails, writes seo-report.json
```

---

## 1. Headline result

| | Before | After |
|---|--:|--:|
| Routes audited | 55 | 55 |
| Titles over 60 chars | **43** | **0** |
| Longest title | 90 | 55 |
| Mean title length | 69.5 | 45.2 |
| Descriptions over 155 chars | **16** | **0** |
| Longest description | 169 | 155 |
| Duplicate titles | 0 | 0 |
| Duplicate descriptions | 0 | 0 |
| Routes with no `og:image` | **55** | **0** |
| Routes with no `twitter:image` | **55** | **0** |
| JSON-LD blocks | 122 | 65 |
| Broken internal links | 0 | 0 |
| Orphans (contextual graph) | **1** | **0** |
| Pages with a single contextual inbound link | 4 | 1 |
| Contextual internal link edges | 260 | 288 |
| Sitemap entries with a fabricated `lastmod` | **53** | **0** |
| `seo-check` failures | **119** | **0** |

---

## 2. Metadata: one source of truth

### What was wrong

Fifty-five page components each wrote their own `export const metadata`. Nobody
was careless — there was simply nowhere the 55 strings could be seen next to
each other, so nothing measured them. Two things followed:

1. **A `title.template` in the root layout appended `· Bracketsight` (14 chars),
   and three section layouts appended a second one — `· Health cover ·
   Bracketsight` (30 chars).** An author writing a 51-character title shipped an
   82-character one and had no way to see it from inside the file that chose the
   words. `/aca/methodology` shipped at 82; `/property/counties` at 90.
2. **Sixteen descriptions ran past the truncation point**, and the clause that
   gets cut is always the last one — which on these pages is the qualification
   ("…free, no signup", "…each rule cited", "…not legal advice").

### What replaced it

`src/lib/seo/routes.ts` — a typed registry holding every route's title,
description, section, Open Graph headline and `lastModified` source.
`src/lib/seo/constraints.ts` asserts the whole set at module load: length bounds
plus **uniqueness of both title and description across every route**. A page now
says:

```ts
export const metadata: Metadata = pageMetadata("/loans");
```

and cannot write its own title. Both `title.template`s are gone; every title is
emitted with `title.absolute`, so **the string measured in the registry is the
string in the `<head>`**. The brand is carried by `og:site_name`,
`applicationName` and the `WebSite` node instead of by a suffix on 55 titles.

Canonicals are relative paths against `metadataBase`, never absolute — one
origin, one place.

The gate is real. It fired twice during this work and stopped the build both
times:

```
Metadata bounds failed for 1 route(s):
  • /property/counties/nj/bergen: description is 158 chars, max 155
```
```
Metadata bounds failed for 1 route(s):
  • /trades/contracts/CA: description is 163 chars, max 155
```

Both were dynamic-family templates that fit the shortest member (Cook County,
Texas) and overflowed on the longest (Bergen County, California). Both templates
were shortened to carry headroom.

### The full over-length table

Every route that breached either bound, before → after. Titles are the emitted
`<title>` including the template suffix that was silently added.

| Route | Title before | Title after | Desc before | Desc after |
|---|--:|--:|--:|--:|
| `/property/counties` | 90 ⚠ | 43 | 141 | 146 |
| `/property/counties/nj/bergen` | 86 ⚠ | 52 | 139 | 131 |
| `/property/methodology` | 86 ⚠ | 48 | 154 | 153 |
| `/property/check` | 85 ⚠ | 46 | 164 ⚠ | 153 |
| `/property/counties/il/cook` | 84 ⚠ | 50 | 133 | 125 |
| `/aca/methodology` | 82 ⚠ | 46 | 167 ⚠ | 153 |
| `/property/sources` | 82 ⚠ | 42 | 156 ⚠ | 140 |
| `/trades/contracts/PA` | 82 ⚠ | 44 | 153 | 135 |
| `/aca/editorial-policy` | 81 ⚠ | 44 | 147 | 147 |
| `/property/editorial-policy` | 81 ⚠ | 45 | 150 | 150 |
| `/trades/contracts/CA` | 80 ⚠ | 42 | 151 | 133 |
| `/authors` | 79 ⚠ | 50 | 161 ⚠ | 150 |
| `/property/about` | 79 ⚠ | 37 | 153 | 153 |
| `/about` | 78 ⚠ | 48 | 161 ⚠ | 148 |
| `/aca/about` | 78 ⚠ | 35 | 142 | 149 |
| `/trades/contracts/NY` | 78 ⚠ | 40 | 149 | 131 |
| `/trades/editorial-policy` | 78 ⚠ | 47 | 142 | 148 |
| `/trades/contracts/FL` | 77 ⚠ | 39 | 148 | 130 |
| `/aca/sources` | 76 ⚠ | 46 | 160 ⚠ | 154 |
| `/trades/about` | 76 ⚠ | 32 | 148 | 152 |
| `/aca/changelog` | 75 ⚠ | 45 | 133 | 147 |
| `/trades/contracts/TX` | 75 ⚠ | 37 | 146 | 128 |
| `/trades/pricing-methodology` | 75 ⚠ | 52 | 169 ⚠ | 153 |
| `/paycheck/occupations` | 74 ⚠ | 43 | 156 ⚠ | 147 |
| `/privacy` | 74 ⚠ | 49 | 152 | 152 |
| `/property/changelog` | 74 ⚠ | 44 | 131 | 139 |
| `/trades/sources` | 74 ⚠ | 50 | 157 ⚠ | 152 |
| `/trades/changelog` | 73 ⚠ | 49 | 144 | 154 |
| `/trades/contract` | 73 ⚠ | 49 | 151 | 151 |
| `/paycheck` | 72 ⚠ | 47 | 152 | 152 |
| `/trades` | 71 ⚠ | 46 | 155 | 155 |
| `/trades/invoice` | 67 ⚠ | 48 | 125 | 143 |
| `/aca` | 66 ⚠ | 48 | 169 ⚠ | 152 |
| `/loans` | 66 ⚠ | 51 | 132 | 146 |
| `/property` | 66 ⚠ | 46 | 154 | 154 |
| `/loans/privacy` | 65 ⚠ | 49 | 158 ⚠ | 143 |
| `/contact` | 64 ⚠ | 49 | 165 ⚠ | 154 |
| `/guides/aca-subsidy-cliff-400-percent` | 64 ⚠ | 49 | 139 | 139 |
| `/loans/editorial-policy` | 64 ⚠ | 45 | 153 | 153 |
| `/loans/sources` | 63 ⚠ | 43 | 167 ⚠ | 153 |
| `/paycheck/changelog` | 63 ⚠ | 43 | 155 | 155 |
| `/glossary` | 62 ⚠ | 53 | 153 | 153 |
| `/paycheck/sources` | 61 ⚠ | 46 | 143 | 147 |
| `/paycheck/methodology` | 58 | 43 | 159 ⚠ | 155 |
| `/terms` | 57 | 44 | 165 ⚠ | 148 |
| `/` | 47 | 55 | 168 ⚠ | 147 |

**No duplicates were found, before or after.** The uniqueness assertion is
preventative: a config-driven approach fails this way if a template is coarse
enough to collapse two routes onto one string, so the check runs on every build.

---

## 3. Open Graph images

The site had **none**. Every shared link — Slack, WhatsApp, LinkedIn, iMessage —
rendered as a bare grey URL. On a site that computes a household's subsidy
cliff, that is not only the weakest possible click-through; it is the one
surface where a stranger decides whether this is a real publication, and it was
blank.

**What ships now:** a templated 1200×630 card built with `next/og`, generated at
build time as a PNG on disk. Seven image routes:

| Route file | Covers | Headline source |
|---|---|---|
| `src/app/opengraph-image.tsx` | `/`, `/about`, `/authors`, `/contact`, `/privacy`, `/terms`, `/glossary`, `/guides` | registry entry for `/` |
| `src/app/loans/opengraph-image.tsx` | `/loans` + 6 sub-pages | registry entry for `/loans` |
| `src/app/paycheck/opengraph-image.tsx` | `/paycheck` + 6 sub-pages | registry entry for `/paycheck` |
| `src/app/aca/opengraph-image.tsx` | `/aca` + 5 sub-pages | registry entry for `/aca` |
| `src/app/property/opengraph-image.tsx` | `/property` + 7 sub-pages incl. 2 county pages | registry entry for `/property` |
| `src/app/trades/opengraph-image.tsx` | `/trades` + 12 sub-pages incl. 5 state pages | registry entry for `/trades` |
| `src/app/guides/[slug]/opengraph-image.tsx` | each article, each tool index | **article frontmatter** (`title`, `tool`, `updatedAt`) |

Design: the section's dark ground and dark signal accent, transcribed from the
`--dk-*` tokens in `globals.css`; the Bracketsight mark redrawn as inline SVG
with the section accent on its signal band; the section name in the eyebrow; the
claim strip (`rules cited · no AI arithmetic · nothing stored · free`) — every
one of which is also stated visibly on the page it links to.

**No webfont is loaded.** `ImageResponse` gets no `fonts` option: the site's four
faces are self-hosted for CWV reasons, and reading a font file at build for
glyphs that only ever exist as a PNG would be cost with no benefit. The bundled
default carries it; the layout and the mark do the identity work.

### The non-obvious bit, recorded for whoever touches this next

The first pass set `openGraph` in metadata on all 55 routes and produced cards on
**nine**. Next resolves `opengraph-image.tsx` by walking up the segment tree, but
a page declaring its own `openGraph` object at a **deeper segment than the image
file replaces the resolved one outright, image included**. `/loans` had a card
(its image file is a sibling of its `page.tsx`); `/loans/about` had none.

The fix is in `src/lib/seo/metadata.ts`: non-article routes declare **no**
`openGraph` and **no** `twitter` block at all. Next fills `og:title` /
`og:description` from `title` / `description`, `og:type` / `og:site_name` /
`og:locale` come from the root layout, `twitter:card` likewise, and the nearest
ancestor image supplies both `og:image` and `twitter:image`. Articles are the
exception and are safe, because `src/app/guides/[slug]/` holds the page and its
image at the same segment — which is what buys articles their
`article:published_time`, `article:modified_time` and `og:url`.

---

## 4. Structured data — validated, not just rendered

### How it is validated, twice

**At build.** `src/lib/seo/schema.ts` holds a typed builder per `@type` and a
`SPEC` table of required and permitted properties. `renderJsonLd()` walks the
node graph, throws on a missing required property, on an unexpected property,
and — importantly — on **any `@type` that has no spec**, because an
unrecognised block is exactly how an unvalidated one hides. Nothing reaches a
`<script>` tag without passing.

**After build.** `scripts/seo-check.mjs` re-parses every `application/ld+json`
block out of the emitted HTML, carries the same spec table, and applies three
further assertions the builders cannot:

- every block parses as JSON and carries `@context`;
- no type is emitted twice on one URL;
- **`visible`-marked properties appear in the page's rendered text** — the
  mechanical form of "never mark up what a reader cannot see". The comparison is
  on a normalised form (case-folded, punctuation stripped, first ten words), so
  a typographic apostrophe or a `<span class="num">` around a figure does not
  produce a false failure while a genuinely different sentence does.

That last check found two real defects on `/aca`: the `FAQPage` claimed *"What
counts as MAGI for an ACA subsidy?"* and *"How can I lower my MAGI before 31
December?"* while the page's visible `<h2>`s read *"…for the marketplace?"* and
*"How do I lower…"*. **The markup was corrected to the visible headings, never
the reverse** — the reader's page is the thing being described.

### What is emitted, and against what it was checked

| Type | Count | Where | Validated against | Visibility |
|---|--:|---|---|---|
| `Organization` | 1 | `/` | `name`, `url` required; `contactPoint` → `ContactPoint.contactType` | name, origin and `info@bracketsight.com` all rendered in the footer and on `/contact` |
| `WebSite` | 1 | `/` | `name`, `url` required | — |
| `WebApplication` | 5 | the five tool roots | `name`, `applicationCategory`, `url`, `offers` required; `offers` → `Offer.price` + `Offer.priceCurrency` | the `price: "0"` / `isAccessibleForFree` claim is the visible "free, no signup" strip `ToolShell` renders on all five |
| `FAQPage` | 5 | `/loans`, `/aca`, `/paycheck`, 2 articles | `mainEntity` required; each → `Question.name` + `Question.acceptedAnswer` → `Answer.text` | **every question string asserted present in the page text**; each is one of the page's own `<h2>`s |
| `Article` | 2 | the 2 guides | `headline`, `datePublished`, `dateModified`, `author`, `publisher`, `mainEntityOfPage` required; `citation[]` → `CreativeWork.name` | headline asserted present (it is the `<h1>`) |
| `BreadcrumbList` | 54 | every page but the hub | `itemListElement` required; each → `ListItem.position` + `ListItem.name` | built from the same `trail` array the visible `<nav>` renders |
| `DefinedTermSet` | 1 | `/glossary` | `name`, `url`, `hasDefinedTerm` required; each → `DefinedTerm.name` + `DefinedTerm.description` | **every term name asserted present**; each is an `<h2>`, and each description is the same `entry.definition()` call the page renders |

Total: **65 blocks, 0 failures.**

### Deliberate omissions

**`SearchAction` on `WebSite` — not emitted.** There is no site search. The two
`<input type="search">` elements on the site are in-tool filters with no URL, no
results page and no way to be reached with a query. Declaring a sitelinks
searchbox against a `?q=` route that 404s is a claim about a feature that does
not exist.

**`Person` — not emitted anywhere.** `MAINTAINER` in `src/lib/site.ts` is
deliberately `null`. `Article.author` is an `Organization` because the byline in
`content/posts` is a masthead ("Bracketsight editorial"), and `reviewedBy` is
suppressed entirely while frontmatter says `UNREVIEWED`. An article may ship
unreviewed; it may not ship claiming a review that did not happen.

**`HowTo` — not emitted.** The builder exists and is validated, so the day a
genuine procedure is written the markup is a two-line change. Three candidates
were assessed against one test — *does the page visibly show numbered steps that
the reader performs?* — and all three failed:

- **`/property`, "How the check works".** Four numbered steps, visibly on the
  page, but three of the four are things the tool does ("We pick the
  comparables", "Statistics, not opinion", "An honest verdict"). It describes a
  mechanism, not a procedure a reader carries out.
- **`/property/counties/[state]/[county]`, the appeal levels.** An ordered list,
  but the page's own copy says of it: *"The last two are alternatives, not
  sequential steps."* Marking it sequential would contradict the sentence
  directly beneath it.
- **The W-2 check.** A real two-step remedy (request a W-2c; for 2025,
  reconstruct the premium from stubs and file 1040-X). But `W2Checker` renders
  only after a reader enters figures, so none of it is in the prerendered HTML.
  Marking up content that is absent until an interaction is marking up content a
  crawler cannot see.

**`Organization` moved off the root layout.** It was emitted on all 55 pages —
55 copies of one fact and 54 chances to drift. Google reads a publisher from one
page; it now sits on `/` beside `WebSite`. This accounts for the drop from 122
blocks to 65.

---

## 5. Internal linking — pillar ↔ cluster ↔ glossary

### The measurement problem, first

Measured naively, this site had **54 inbound links per page and zero orphans**
before any work — because the footer links the guides index and the glossary
from all 55 pages, and the section rail links the trust pages from every page in
its section. Those numbers are meaningless. A link that appears identically on
every page carries no signal about any particular page; only a page *choosing*
to point at another is evidence.

`scripts/seo-check.mjs` therefore builds a **contextual graph**: it strips
`<header>`, `<footer>` and every `<nav>` from the HTML before extracting hrefs.
On that graph the real picture appeared: **1 orphan, 4 pages with a single
inbound link, 260 edges.**

### What was built

`src/lib/seo/links.ts` — a resolver, not a set of hand-written blobs. Three edge
kinds, each computed from metadata that already exists:

- **Pillar → cluster.** `articlesForTool()` reads the article index; a tool page
  links its four most-recently-reviewed guides plus its cluster index.
- **Cluster → pillar.** `linksForArticle()` returns the tool, the tool's guides
  index, and 2–4 siblings from `relatedPosts()` (ranked on cluster, then tool,
  then shared keywords). Already rendered by `ArticleView`.
- **Tool ↔ glossary.** `/glossary` already deep-linked each term into the tools
  that use it. `termsForTool()` supplies the **return edge**, read from the same
  `entry.tools` field — so a term cannot say it appears in the loans tool while
  the loans tool fails to link back to it.
- **Plus the workings.** `workingsForTool()` puts each section's methodology,
  sources, editorial policy and changelog into **body copy** on its tool page.
  That is what closed the orphan.

Rendered by `src/components/content/ToolLinks.tsx`, at the end of the reading
band on the five tool roots. No image, no ad slot, nothing lazily loaded — it
reserves its own height from the server HTML and contributes nothing to CLS.

A build-time gate, `assertLinkModel()`, fails on a glossary entry naming a tool
that is not a section, and on a tool with no glossary vocabulary at all.

### Result

| | Before | After |
|---|--:|--:|
| Contextual edges | 260 | **288** |
| Orphans | **1** (`/property/editorial-policy`) | **0** |
| Single-inbound pages | 4 | 1 |
| Broken internal links (404) | 0 | 0 |
| Mean contextual inbound links per route | 4.8 | **5.3** |

Selected movements:

| Route | Before | After |
|---|--:|--:|
| `/property/editorial-policy` | **0** | 1 |
| `/glossary` | 4 | 9 |
| `/guides` | 3 | 6 |
| `/guides/rap-can-cost-more-than-standard` | 2 | 3 |
| `/guides/aca-subsidy-cliff-400-percent` | 2 | 3 |
| `/loans/privacy` | 1 | 2 |
| `/paycheck/about` | 1 | 2 |
| `/property/about` | 1 | 2 |
| `/trades/about` | 1 | 2 |

**The 404 check is real, not nominal:** every internal `href` in the built HTML
is resolved against the actual route table produced by the build (plus the six
static asset paths). A link to a route that was not generated fails the run.
Zero broken links before and after.

---

## 6. Crawlability

### robots.txt

```
User-Agent: *
Allow: /

Sitemap: https://bracketsight.com/sitemap.xml
```

`Disallow: /api/` was removed. There is no `/api` segment in `src/app` and no
route handler anywhere in the tree — the site is 55 prerendered documents. The
rule protected no crawl budget and described a shape the site does not have, in
the first file a reviewer or an ad network opens. `seo-check` now asserts it:
**any `Disallow` matching a route that was actually built fails the run.**

### sitemap.xml — 53 entries, every date derived

The previous file stamped `lastModified: new Date()` on all 53 URLs. Every
deploy announced that the entire site had just changed. `<lastmod>` is used by
Google only where it is "consistently and verifiably accurate", so a host that
stamps the build clock trains the crawler to discard the field — including on
the pages where the date is real, like an article re-verified against a changed
regulation.

`src/lib/seo/freshness.ts` derives every date from something the page itself
asserts on screen:

| Route family | Date source | Value today |
|---|---|--:|
| Site-level policy pages (5) | `POLICY_UPDATED` — the same constant the visible "Last updated" stamp reads | `2026-08-19` |
| Articles (2) + `/guides` | frontmatter `updatedAt` | `2026-08-18` |
| `/`, `/glossary`, aca / loans / property / trades routes (24) | newest `lastVerified` in the engine's own rule citations | `2026-08-15` |
| paycheck routes (21) | newest `lastVerified` in the paycheck ruleset | `2026-08-08` |

Rule dates are read through each engine's own citation export
(`listRuleCitations`, `allCitations`, `rulesMeta`, `counties[].citations`,
`STATE_RULES`), not by walking `rules/*.json` from disk — so a superseded file
sitting in the directory cannot contribute a date to a page that does not use
it. County and state pages carry their **own** jurisdiction's newest citation
date, not the section's.

Where no honest date exists the element is **omitted**; the protocol makes it
optional precisely so that is available. As it happens all 53 entries resolved
to a real date today, so nothing is currently omitted. `seo-check` warns on any
`lastmod` equal to the build day — **zero warnings after, 53 before.**

### noindex ↔ sitemap agreement

`/guides/loans` and `/guides/aca` list fewer than `TOOL_INDEX_MIN_POSTS` (3)
articles. Both serve:

```html
<meta name="robots" content="noindex, follow"/>
```

and both are absent from the sitemap. **One predicate drives both** —
`toolIndexIsIndexable()` sets the `indexable` flag on the `RouteSeo` object, and
`generateMetadata` and `sitemap.ts` each read that same flag. `/guides` itself is
`index, follow` and present. Publish a third loans article and both reverse in
the same build.

`seo-check` asserts the agreement in both directions on every route: a sitemap
URL that serves `noindex` fails, and an indexable route missing from the sitemap
fails. 55 routes, 53 sitemap entries, 2 noindex — reconciled.

---

## 7. Core Web Vitals

Lighthouse 12.8.2, **mobile** form factor, simulated throttling, headless
Chrome, against `next start` on a production build.

| Page | | Perf | A11y | Best pr. | SEO | CLS | LCP | TBT |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| `/` | before | 94 | 100 | 100 | 100 | 0.000 | 3.09 s | 9 ms |
| | **after** | **97** | **100** | **100** | **100** | **0.000** | **2.57 s** | 10 ms |
| `/loans` | before | 90 | 97 | 100 | 100 | 0.000 | 3.61 s | 18 ms |
| | **after** | **90** | **97** | **100** | **100** | **0.000** | **3.61 s** | 23 ms |
| `/guides/rap-can-cost-more-than-standard` | before | 96 | 100 | 100 | 100 | 0.000 | 2.71 s | 12 ms |
| | **after** | **96** | **100** | **100** | **100** | **0.000** | **2.71 s** | 10 ms |

**Gate: every score ≥ 90, CLS < 0.1. Met — CLS is 0.000 on all three.**

Two things about the method, stated so the numbers are not read as more than
they are:

- **What "before" is.** The pre-existing `.next` was overwritten during the work
  and git is out of scope here, so the baseline is a **second full build of the
  current tree with the two changes that alter rendered DOM removed** — the
  `<ToolLinks>` block on the five tool pages, and the seven Open Graph image
  routes. Everything else changed in this work is `<head>` text and JSON-LD
  placement, which moves the home page's HTML by 1.3 kB and cannot move a
  Core Web Vital.
- **The home-page delta reproduced three times** (94/94/94 vs 97/97/97; LCP
  3.09/3.09/3.09 s vs 2.57/2.58/2.56 s), with the same LCP element (`h1.display`)
  and identical FCP and Speed Index on both. The two artefacts were built
  separately, so read it as **no regression** rather than as a claimed win.

`/loans` scores 97 on accessibility **before and after** — two pre-existing
audits inside the calculator, untouched by this work and outside its scope:
`label-content-name-mismatch` and `target-size`.

---

## 8. What remains open

1. **`/property/editorial-policy` has one contextual inbound link** (from
   `/property`, via the ToolLinks "workings" column). Not an orphan; reported as
   a warning by `seo-check`. The other four sections' editorial policies earn
   theirs from body copy on their methodology and sources pages. The fix is one
   sentence of prose on `/property/methodology` or `/property/sources` — content
   work, deliberately not done here.

2. **Article frontmatter still permits values this registry rejects.**
   `src/lib/content/schema.ts` caps `title` at 70 and `description` at 160; this
   registry enforces 60 and 155. Both current articles pass both, so nothing is
   broken — but a writer can currently write a 68-character title, pass
   frontmatter validation, and fail the build one layer later. Tightening
   `frontmatterSchema` to 60/155 would move the error to where the writer is.
   `content/` is another agent's file.

3. **Section cards, not per-page cards.** `/loans/methodology` shares the
   `/loans` card. The brief scoped it that way ("one per section plus a default;
   articles get theirs from frontmatter") and it is the right default — but every
   route already carries its own `ogHeadline` and `ogStrap` in the registry, so
   giving one sub-page its own card is a four-line file in that route's folder
   and no other change. Highest-value candidates: `/property/check`,
   `/paycheck/occupations`, `/trades/invoice`, `/trades/contract`.

4. **Article `og:image:alt` is the static string "Bracketsight guide".** The
   `alt` export of a dynamic image route cannot vary per param without
   `generateImageMetadata`. The card itself is fully per-article; only the alt
   text is generic.

5. **`Article` carries no `image` property.** The generated card's hashed URL is
   not available to the page component at render, and a wrong image URL in
   structured data is worse than an absent optional one. Resolvable with
   `generateImageMetadata` if article rich results become a priority.

6. **No `logo` on `Organization` and no `sameAs`.** The mark is an SVG favicon;
   Google's logo guidance wants a raster of known dimensions. No verified social
   profiles exist to point at. Both omitted rather than faked.

7. **`MAINTAINER` is still `null`**, so no `Person` markup exists anywhere. This
   is the single largest remaining E-E-A-T gap on a YMYL finance site and only
   the owner can close it. See the block in `src/lib/site.ts` for exactly what is
   needed.

8. **`seo-check` is not yet wired into CI.** It runs as `npm run seo:check`
   after a build and exits non-zero on failure. It needs one job step:
   `npm run build && npm run seo:check`.

---

## Appendix — files

**New**

| Path | What it is |
|---|---|
| `src/lib/seo/routes.ts` | the route registry: every title, description, OG headline, freshness source |
| `src/lib/seo/constraints.ts` | the 60/155 bounds and the uniqueness assertion |
| `src/lib/seo/metadata.ts` | `RouteSeo` → Next `Metadata`; the Open Graph merge rule |
| `src/lib/seo/schema.ts` | typed JSON-LD builders + the build-time validator |
| `src/lib/seo/links.ts` | the pillar ↔ cluster ↔ glossary resolver |
| `src/lib/seo/freshness.ts` | derived `lastModified`, per route family |
| `src/lib/seo/og.tsx` | the Open Graph card template and its six palettes |
| `src/lib/seo/index.ts` | the barrel |
| `src/app/opengraph-image.tsx` + 5 section + 1 article route | the cards |
| `src/components/content/ToolLinks.tsx` | the pillar end of the link model |
| `scripts/seo-check.mjs` | the CI gate, run against built HTML |

**Changed**

`src/app/layout.tsx` (templates removed, `Organization` moved out, `twitter:card`
added) · `src/app/sitemap.ts` (rewritten: derived dates, registry-driven) ·
`src/app/robots.ts` (phantom `Disallow` removed) · `src/components/layout/Breadcrumbs.tsx`
and `src/app/guides/[slug]/ArticleView.tsx` (JSON-LD through the validated
builders) · 47 page and layout files (metadata delegated to the registry) ·
the five tool pages (schema builders + `ToolLinks`) · `src/app/glossary/page.tsx`
· the four policy pages (`UPDATED` → `POLICY_UPDATED`) · `package.json`,
`.gitignore` (the two `seo:*` scripts and their artefact).

**Gates at the time of writing:** `npm run typecheck` clean ·
`npm test` 468 passing (42 files) · `npm run build` clean, 71 routes ·
`npm run seo:check` 0 failures, 1 warning.
