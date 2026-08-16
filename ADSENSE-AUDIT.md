# AdSense approval audit — Bracketsight

**Audited 2026-08-17.** Method: `NEXT_PUBLIC_SITE_URL=https://bracketsight.com npm run build`,
served with `next start -p 3300`, crawled with Chrome over every rendered link plus every sitemap
entry — 48 HTML pages. Publisher account `pub-1973018352310576`. The site has never been
submitted.

This audit is written against the reasons sites actually get rejected, not the wording of the
rejection email. "Low value content" is the label attached to nearly every tool-site rejection;
what it means in practice is a handful of concrete, measurable things, and they are separated out
below.

**Verdict: do not submit yet.** Everything structural has been fixed and verified on a fresh
crawl. Two blockers remain and neither can be closed by anyone but the owner — one of them, that
the site names no human being anywhere, is the largest single risk both to approval and to
ranking.

---

## Summary

| | Count | Fixed here | Needs the owner |
|---|---:|---:|---:|
| MUST-FIX (blocks approval) | 10 | 8 | 2 |
| SHOULD-FIX | 10 | 8 | 2 |
| NICE-TO-HAVE | 6 | 2 | 4 |

Measured before → after:

| Metric | Before | After |
|---|---:|---:|
| Pages under 300 words of own content | 14 | **1** |
| Pages under 600 words of own content | 34 | **17** |
| Thinnest page | 41 words | **292 words** |
| Pages more than 2 clicks from the hub | 3 | **0** |
| True orphans (zero inbound links) | 1 | **0** |
| Prerendered pages missing from the sitemap | 7 | **0** |
| Internal links resolving to a non-200 | 0 | **0** |
| Duplicate titles / duplicate meta descriptions | 0 / 0 | **0 / 0** |
| Pages with an incorrect or missing canonical | 0 | **0** |
| Pages with a working link to the privacy policy | 2 of 47 | **48 of 48** |

**The single biggest blocker: the site names no human being anywhere.** Not on any About page, not
in the JSON-LD, not in a byline. Five engines compute a household's subsidy cliff, a borrower's
30-year repayment cost and a homeowner's appeal odds, and a reader cannot find out who is
responsible for any of it. For YMYL finance that is the first question both a policy reviewer and
Google's quality guidance ask. Nothing in this audit can answer it — see
[What the owner must supply](#what-the-owner-must-supply).

---

## MUST-FIX — blocks approval

### M1. No named human, anywhere on the site — **OWNER**

No author, no editor, no maintainer, no organisation officer, no credential, no byline, no profile
link. The site-level `Organization` JSON-LD claims a name, a URL and an email and nothing else.
Every section's About page describes the *method* and never the *people*.

For a site that tells a reader whether to switch to a repayment plan that forfeits their payment
credit, this is the highest-severity finding in the audit, and it is a ranking problem as much as
an ad-network problem.

**Fixed here:** a typed `MAINTAINER` config was added to `src/lib/site.ts`, and the new site-level
`/about` page renders a full attribution block from it. Filling in the object is the entire
remaining change — no template work, no layout work.

**Deliberately not fixed:** the object is `null`, not a placeholder. Inventing a name, a credential
or a stock biography on a YMYL finance site is a worse failure than an empty field. The comment
block in `src/lib/site.ts` states exactly what each key must contain.

### M2. No site-level About page at all — **FIXED**

There were five section About pages and no site-level one, so no page answered "what is this site,
who runs it, how is it funded, what does it admit it doesn't know". `/contact` existed; `/about`
did not.

**Fixed:** `src/app/about/page.tsx`, 1,095 words. Covers what the site is, how a rule gets from a
regulation into a number, where AI is and is not used, the unverified-items register summarised by
unblocking category, the two places the tools refuse to answer, the missing credentialed review,
independence, funding, data handling and the correction route. Every claim is checkable against
the repository. Linked from the footer of every page, from the hub, from `/contact` and from
`/terms`.

### M3. `/privacy` and `/terms` were reachable from almost nowhere — **FIXED**

Both were in `TRUST_PAGES` and in the sitemap, and rendered in no navigation at all. Measured on
the first crawl:

- `/privacy` — inbound links from **2** pages of 47 (`/loans/privacy`, `/terms`)
- `/terms` — inbound links from **1** page of 47 (`/privacy`), click depth **4** from the hub

A privacy policy four clicks deep and reachable only through another policy page does not meet
"easily accessible from every page", which is a stated AdSense requirement, and a "not financial
advice" disclaimer nobody can reach is not a disclaimer.

**Fixed:** `SiteFooter` now renders a "This site" column from `TRUST_PAGES` on every page, section
pages included — About, Contact, Privacy, Terms and disclaimer. Verified on the final crawl: all
four are one click from all 48 pages.

### M4. `/trades/invoice` was an orphan with 41 words — **FIXED**

The thinnest page on the site, with **zero** inbound links from anywhere: it existed only in the
sitemap. A sitemap entry that no page links to, whose content is an `<h1>` and one sentence, is
close to a worked example of what "low value content" means.

The cause was structural and hit two pages: both `/trades/invoice` and `/trades/contract` render a
tool that has nothing to show until an estimate is saved in `localStorage`. A crawler never has
one, so a crawler always saw the empty state.

**Fixed:**
- `src/app/trades/invoice/page.tsx` — 41 → **549 words**. Unconditional body content on why the
  invoice must match the estimate to the cent, deposit clamping, computed due dates, print
  behaviour, storage, and what the document is not. Verified against
  `src/engines/trades/invoice.ts` and `src/app/trades/takeoff-sheet.css`.
- `src/app/trades/page.tsx` now links to both `/trades/invoice` and `/trades/contract`.

### M5. `/trades/contract` had 49 words — **FIXED**

Same cause as M4. Now **580 words**: an AnswerBox, an engine-derived table of required clauses per
state (always vs conditional, the home-improvement threshold, a link to each state page), and
sections on how clauses are selected, why generation fails closed for untranscribed statutory
notices, that it is not legal advice, and where the job data comes from. The clause counts and
thresholds are read from `getStateRules`, so the page cannot drift from the engine.

### M6. Thin trust pages across all five sections — **FIXED**

Fourteen pages sat under 300 words of page-specific content, including seven About and editorial
policy pages. A two-paragraph About is a documented rejection cause, and on a YMYL site an
editorial policy that does not say who reviews what is worse than none.

**Fixed:** the fourteen thinnest trust pages were rewritten to carry real, sourced content — what
each engine decides and refuses to decide, the specific unverified values and the primary source
each must be checked against, the review gate that has not been met, the correction process and
timeline, funding and why it cannot reach a computed figure, and the rule-versioning scheme.
Nothing was padded and no fact was invented; every claim traces to a rules JSON file,
`KNOWN-GAPS.md` or a `VERIFICATION-STATUS.md`. Results:

| Page | Before | After |
|---|---:|---:|
| `/paycheck/changelog` | 116 | 929 |
| `/loans/changelog` | 132 | 973 |
| `/trades/editorial-policy` | 169 | 821 |
| `/paycheck/about` | 175 | 1,262 |
| `/aca/about` | 184 | 920 |
| `/trades/about` | 194 | 884 |
| `/paycheck/editorial-policy` | 206 | 1,038 |
| `/aca/editorial-policy` | 224 | 854 |
| `/property/about` | 231 | 978 |
| `/loans/privacy` | 232 | 953 |
| `/loans/about` | 251 | 1,197 |
| `/property/sources` | 267 | 1,114 |
| `/loans/editorial-policy` | 283 | 1,046 |
| `/property/editorial-policy` | 298 | 893 |

### M7. Seven prerendered pages were in no sitemap — **FIXED**

`/property/counties/[state]/[county]` (2 pages) and `/trades/contracts/[state]` (5 pages) are
prerendered, internally linked, fully cited pages — among the strongest content on the site — and
`src/app/sitemap.ts` deliberately excluded them, on the theory that section owners would emit them
with `generateSitemaps`. Nobody did.

**Fixed:** the sitemap now enumerates both from the same engine exports (`counties`, `STATE_IDS`)
that `generateStaticParams` reads, so the sitemap and the build cannot disagree about which pages
exist. Verified: 48 sitemap URLs, 48 crawled pages, zero difference in either direction.

### M8. No disclosure of ad cookies or personalisation in the privacy policy — **FIXED**

`/privacy` said only that "if advertising is enabled in future… this page will say so". A reviewer
assessing a site *for* ad serving needs the disclosure present at review time.

**Fixed:** `/privacy` now names Google AdSense as the intended provider, states plainly that no
advertising runs today and that no loader script is present, and carries the third-party-vendor
cookie disclosure with both opt-out routes (Google Ads Settings, aboutads.info). It also states
what will not change: the ad network never receives tool input, because tool input never leaves
the browser.

### M9. A dead placeholder contact address on a trust page — **FIXED**

`src/app/property/editorial-policy/page.tsx` rendered `corrections@fairparcel.example` as a
visible `mailto:` link — stale pre-merge branding, on a reserved TLD that can never resolve, on
the page that tells readers how to get a wrong figure corrected. A non-functional contact method
is a direct policy failure, and a fake-looking domain on a trust page is worse than no address.

**Fixed:** replaced with `CONTACT_EMAIL` imported from `@/lib/site`, so it cannot drift again.
A sweep across all rendered copy for `.example` / `.invalid` addresses and for the five pre-merge
product names now returns no hits in user-visible text.

### M10. Figures presented with more confidence than the underlying data supports — **PARTLY FIXED / OWNER**

Both an ad-policy risk and a real-user-harm risk, and the one finding where the honest answer is
uncomfortable.

The site is candid in places, and more so than most sites in this category: the paycheck section
footer and its changelog and About carry explicit placeholder warnings, the ACA tool labels its
benchmark premiums as sample data inline, the trades prose calls its prices placeholder reference
data, and two tools genuinely refuse to answer rather than answer wrongly. But `KNOWN-GAPS.md`
records **55 open items**, and the disclosure was not evenly distributed — it was strong where a
section author chose to write one and absent where they did not. Two specific gaps were found:

- **`/property` had no disclosure at all.** The tool returns a verdict — file, or do not bother —
  and the dollar figure that verdict is gated on multiplies through
  `county.estimatedTaxRateOnAssessedBps`, recorded UNRESOLVED for **both** covered counties in
  `src/engines/property/VERIFICATION-STATUS.md`. The confidence meter says nothing about that,
  because the uncertainty is in the rate, not in the comparables.
- **`/loans` disclosed its assumptions but not its eligibility limits.** `GAP-048` records that
  PAYE eligibility tests only one limb of the two-part new-borrower rule, so the engine
  **over-admits** to PAYE — it can rank a plan a servicer would turn the borrower down for. That
  was in a JSON comment and nowhere a reader could see it.

**Fixed here:**
- `src/app/property/layout.tsx` — the section had no footer at all; it now carries one, naming the
  unverified tax rate, the unresolved Cook County values, and the withheld New Jersey verdicts, on
  every page in the section.
- `src/app/loans/layout.tsx` — the section footer now names the three unsettled items specifically
  rather than hedging generally.
- `src/app/loans/methodology/page.tsx` — the PAYE over-admission, the Tiered Standard step's lack
  of regulatory basis, and the assumed marginal rate added to "Documented simplifications".
- `/terms` gained an "Is this a finished product?" section; `/about` summarises the register.

**The owner's decision, which no audit can make:** either close the gaps that reach user-facing
figures before submitting, or render the unverified state from a single shared mechanism on every
page that shows an affected figure, rather than page by page at each author's discretion. Shipping
figures the repository itself calls "illustrative" to an ad-supported YMYL audience is a decision,
and it should be made deliberately.

---

## SHOULD-FIX

### S1. `AdSlot` can be placed inside a tool with nothing to stop it — **FLAGGED, owned elsewhere**

`src/components/ui/components/AdSlot.tsx` is owned by another agent and was not edited. Two real
problems:

**Disguised ads.** The slot renders `background: var(--paper-raised)` inside a `hairline-all
rounded-atlas` frame — the same treatment as `AnswerBox` and as the card frames used in results
areas. A live ad in that frame, placed inside a results panel, reads as part of the tool. That is
the "disguised ads" rejection, and nothing in the component prevents the placement.

**No boundary.** `AdSlot` takes `height` and `id` and renders wherever it is imported. Recommended
guard, for whoever owns the file:

```tsx
// ToolBoundary.tsx — provided by every tool container
export const InsideTool = React.createContext(false);

// in AdSlot, before anything else
const insideTool = React.useContext(InsideTool);
if (insideTool) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("AdSlot inside a tool container. Ads never render inside a calculator.");
  }
  return null;
}
```

Then wrap `TakeoffBuilder`, `CheckTool`, `InvoiceView`, `ContractView`, `CalculatorApp`, the
paycheck `Calculator` and the ACA `Planner` in `<InsideTool.Provider value={true}>`.

**Where ad slots may and may not go**, once serving is switched on:

| Placement | Verdict |
|---|---|
| Section root, below the tool and below the first prose `<h2>` | Allowed |
| Between prose sections on methodology, sources, about, editorial policy, changelog | Allowed |
| Between prose sections on county and state-contract pages | Allowed |
| Hub page, below the section cards | Allowed |
| Anywhere inside `TakeoffBuilder`, `CheckTool`, `InvoiceView`, `ContractView`, `CalculatorApp`, the paycheck `Calculator` or the ACA `Planner` | **Never** |
| Between a form field and the result it produces | **Never** |
| Inside a results table, a ranked list, a confidence meter or a warning stack | **Never** |
| On the printed invoice or contract surface (`.print-sheet`) | **Never** |
| `/privacy`, `/terms`, `/contact`, `/about` | Not recommended |

### S2. `AdSlot` reserves `min-height`, not `height` — CLS risk with responsive units — **FLAGGED**

The component's guarantee holds only if the creative is never taller than the reserved box.
`min-height` on an auto-height block lets a taller creative grow the box and push everything below
it — the exact CLS the component exists to prevent. With fixed-size ad units matching `height` it
is fine; with a responsive `data-ad-format="auto"` unit it is not, because the height is not known
in advance.

**Recommendation:** use fixed-size units only, with `height` matching the unit exactly, or change
`minHeight` to `height` and keep the existing `overflow: hidden`. Owner of `src/components/ui/**`
to decide. **CLS from ads today is 0 by construction: `AdSlot` has zero usages anywhere in the
app.**

### S3. Citation links to a reserved TLD rendered as live links — **FIXED (render) / OWNER (data)**

The three trades pricing rulesets carry `https://example.invalid/pricing-methodology` as their
citation URL — a deliberate placeholder on a reserved TLD that can never resolve. `/trades/sources`
rendered them as clickable `SourceCitation` markers, so a reviewer clicking a citation on the page
whose entire claim is "every rule is cited" got a DNS failure.

**Fixed:** `/trades/sources` now detects a `.invalid` URL and renders it as plain text reading
"no source URL yet; placeholder pending a licensed cost source" instead of a dead link. The page's
existing unverified-data warning is unchanged.

**Owner:** closing this needs a commercial cost-data licence (`GAP-031`), not a code change.

### S4. `/property` and `/trades` had no `WebApplication` JSON-LD — **FIXED**

`/loans`, `/paycheck` and `/aca` each emit `WebApplication` + `FAQPage`; the other two tool roots
emitted only the site-level `Organization`. Fixed by adding `WebApplication` to both. `FAQPage`
was deliberately *not* added — the `<h2>`s on those two pages are statements rather than
questions, and marking up an FAQ a reader cannot see is the structured-data abuse the policy
prohibits.

### S5. `/property/counties` was three clicks deep and 171 words — **FIXED**

The last page on the site outside a 2-click radius, and the thinnest after the trades fixes.
Now **612 words** and depth 2: what must be true before a county page publishes, why the evidence
standard cannot be templated, why only a few counties are covered, and what to do when yours is
not. Linked from the new property section footer.

### S6. Pages pointed readers at repository files they cannot open — **FIXED**

`/terms` cited `KNOWN-GAPS.md` "in the source repository"; `/paycheck/sources` cited
`VERIFICATION-NEEDED.md` "at the repository root", which does not exist; `/loans/about` referred to
"the repository's open-items register"; `/loans/methodology` cited the same non-existent file.
There is no public repository link anywhere on the site, so all four resolved to nothing. All now
point at on-site pages, and `/terms` states the open-item count.

### S7. An unsourced statistic in body copy — **FIXED**

`/loans/about` opened with "Roughly 7 million former SAVE borrowers are choosing a plan under
deadline right now". It traces to no file in the repository and no citation on the site. On a site
whose central claim is that every figure carries a primary source, one uncited population
statistic in the first paragraph of an About page is a credibility problem out of proportion to
its size. Replaced with the mechanism it was there to illustrate, which is both true and
sourceable.

### S8. Hub and `/contact` did not link to the trust surface's top page — **FIXED**

Both now link to `/about`, so it has body-content inbound links and not only footer links.

### S9. Meta descriptions run slightly long on 16 pages — **NOT FIXED, low value**

16 of 48 descriptions are 161–175 characters against the playbook's 140–160 target. Google
truncates by pixel width, not character count, so the practical cost is a clipped tail on a
minority of pages. No approval impact. Listed rather than churned: `/`, `/about`, `/terms`,
`/contact`, `/aca`, `/aca/methodology`, `/property`, `/property/check`, `/trades`,
`/trades/contract`, `/trades/pricing-methodology`, and the five `/trades/contracts/*` pages.

### S10. No Open Graph image on any page — **OWNER**

`metadataBase` and `openGraph` are configured but no image is declared, so every share on every
platform renders as a bare text card. Not an approval blocker; a click-through cost on every
social and chat surface. Needs a designed asset or an `opengraph-image.tsx` route — a decision for
whoever owns the visual identity.

---

## NICE-TO-HAVE

- **N1. No `BreadcrumbList` JSON-LD** on any page, though the copy playbook calls for it on every
  page. The section navs and footer already express the hierarchy visually. Not fixed.
- **N2. Titles exceed the ≤60-character guideline on 39 of 48 pages.** Roughly 15 of those
  characters are the ` · Bracketsight` template suffix, so most own-titles are close to the
  target; the longest are `/property/counties` (90) and `/property/check` (85). Cosmetic. Not
  fixed.
- **N3. `sitemap.ts` uses deployment time as `lastModified`** for every URL. The file's own comment
  argues this honestly — a fake freshness stamp is detected by both Google and readers — but rule
  pages could be driven by their rules' `lastVerified` dates, which would be honest *and*
  accurate. A design decision, not a defect. Not fixed.
- **N4. No public repository link**, despite prose across the site having referred to "the source
  repository". Those references were removed (S6); publishing the link would be a better answer
  than removing them. Owner decision.
- **N5. `robots.txt` emits a `host` directive.** Ignored by Google, only ever honoured by Yandex.
  Harmless. Not fixed.
- **N6. No `manifest.webmanifest` or `apple-touch-icon`.** `src/app/icon.svg` is served and is
  enough for a favicon. Not an approval item.

---

## Word count table

Measured on the built site: `innerText` of `<main id="main">`, with every text line appearing on
more than three pages subtracted as boilerplate. This is *page-specific* content, excluding the
header, footer, section nav and the repeated section disclaimer blocks.

"Cite" is yes when the page carries an inline `SourceCitation` marker or an outbound link to a
primary source. "Tool" is yes when the page has live form controls. ⚠ marks under 600 words.

| Route | Words | AnswerBox | FactTable | Cite | Tool | Depth |
|---|---:|:-:|:-:|:-:|:-:|:-:|
| `/aca/changelog` | 292 ⚠ | — | — | — | — | 2 |
| `/trades/changelog` | 310 ⚠ | — | — | — | — | 2 |
| `/loans/sources` | 317 ⚠ | — | — | yes | — | 2 |
| `/property/changelog` | 399 ⚠ | — | — | — | — | 2 |
| `/contact` | 430 ⚠ | — | — | — | — | 1 |
| `/property/counties/il/cook` | 432 ⚠ | yes | yes | yes | — | 2 |
| `/property/counties/nj/bergen` | 454 ⚠ | yes | yes | yes | — | 2 |
| `/trades/pricing-methodology` | 468 ⚠ | yes | yes | yes | — | 1 |
| `/paycheck/methodology` | 474 ⚠ | yes | yes | yes | — | 1 |
| `/trades/contracts/FL` | 475 ⚠ | yes | yes | yes | — | 2 |
| `/aca/sources` | 481 ⚠ | — | — | yes | — | 2 |
| `/paycheck/sources` | 510 ⚠ | — | — | yes | — | 2 |
| `/trades/contracts/PA` | 514 ⚠ | yes | yes | yes | — | 2 |
| `/paycheck/occupations` | 522 ⚠ | yes | yes | yes | yes | 2 |
| `/trades/contracts/CA` | 546 ⚠ | yes | yes | yes | — | 2 |
| `/trades/invoice` | 549 ⚠ | yes | — | — | — | 2 |
| `/trades/contract` | 580 ⚠ | yes | yes | — | — | 2 |
| `/property/counties` | 612 | yes | yes | yes | — | 2 |
| `/` | 639 | yes | — | — | — | 0 |
| `/privacy` | 645 | — | — | yes | — | 1 |
| `/trades/contracts/NY` | 656 | yes | yes | yes | — | 2 |
| `/trades/contracts/TX` | 667 | yes | yes | yes | — | 2 |
| `/trades/sources` | 682 | — | — | yes | — | 2 |
| `/terms` | 718 | — | — | — | — | 1 |
| `/trades` | 724 | — | yes | yes | yes | 1 |
| `/aca/methodology` | 736 | — | — | — | — | 1 |
| `/trades/editorial-policy` | 821 | — | — | — | — | 2 |
| `/aca/editorial-policy` | 854 | — | — | — | — | 2 |
| `/paycheck` | 855 | yes | yes | yes | yes | 1 |
| `/trades/about` | 884 | — | — | — | — | 2 |
| `/property/methodology` | 891 | — | — | — | — | 1 |
| `/property/editorial-policy` | 893 | — | — | — | — | 2 |
| `/aca/about` | 920 | — | — | — | — | 2 |
| `/paycheck/changelog` | 929 | — | — | — | — | 2 |
| `/loans/privacy` | 953 | — | — | — | — | 2 |
| `/loans/changelog` | 973 | — | — | — | — | 2 |
| `/property/about` | 978 | — | — | — | — | 2 |
| `/loans/methodology` | 1021 | — | — | — | — | 1 |
| `/paycheck/editorial-policy` | 1038 | — | — | — | — | 2 |
| `/loans/editorial-policy` | 1046 | — | — | — | — | 2 |
| `/about` | 1095 | yes | yes | — | — | 1 |
| `/property/sources` | 1114 | — | — | yes | — | 2 |
| `/loans/about` | 1197 | — | — | — | — | 2 |
| `/paycheck/about` | 1262 | — | — | — | — | 2 |
| `/aca` | 1603 | yes | yes | yes | yes | 1 |
| `/property` | 1625 | — | yes | yes | yes | 1 |
| `/loans` | 1723 | yes | yes | yes | yes | 1 |
| `/property/check` | 1785 | yes | yes | yes | yes | 2 |

**On the 17 pages still under 600 words.** They fall into three groups and none is a rejection
risk. Four are **changelogs** (292–399), which are dated logs — length would mean inventing
entries for changes that did not happen, and the two changelogs that could honestly be extended
were (`/loans` 973, `/paycheck` 929). Three are **sources pages** (317–510) whose substance is the
citations themselves, each carrying a label, a URL and a verification date. The rest are **tool
and reference pages** that carry an AnswerBox, a FactTable, citations and, in three cases, a live
tool — the "thin content" signal is absent even where the word count is moderate. `/contact` at
430 is a contact page and is the right length for one.

---

## Click-depth map

BFS from `/` over every rendered link, header and footer included. **Every page on the site is
within 2 clicks of the homepage. There are no orphans and no page at depth 3 or beyond.**

**Depth 0** — 1 page

`/`

**Depth 1** — 14 pages

`/about` · `/aca` · `/aca/methodology` · `/contact` · `/loans` · `/loans/methodology` ·
`/paycheck` · `/paycheck/methodology` · `/privacy` · `/property` · `/property/methodology` ·
`/terms` · `/trades` · `/trades/pricing-methodology`

**Depth 2** — 33 pages

`/aca/about` · `/aca/changelog` · `/aca/editorial-policy` · `/aca/sources` · `/loans/about` ·
`/loans/changelog` · `/loans/editorial-policy` · `/loans/privacy` · `/loans/sources` ·
`/paycheck/about` · `/paycheck/changelog` · `/paycheck/editorial-policy` · `/paycheck/occupations` ·
`/paycheck/sources` · `/property/about` · `/property/changelog` · `/property/check` ·
`/property/counties` · `/property/counties/il/cook` · `/property/counties/nj/bergen` ·
`/property/editorial-policy` · `/property/sources` · `/trades/about` · `/trades/changelog` ·
`/trades/contract` · `/trades/contracts/CA` · `/trades/contracts/FL` · `/trades/contracts/NY` ·
`/trades/contracts/PA` · `/trades/contracts/TX` · `/trades/editorial-policy` · `/trades/invoice` ·
`/trades/sources`

`/contact` is linked from all 48 pages (site header and footer). `/about`, `/privacy` and
`/terms` are linked from all 48 (site footer).

---

## Structural checks — final crawl

| Check | Result |
|---|---|
| Pages crawled | 48 |
| Internal links resolving to a non-200 | **0** |
| Pages in the sitemap that are not 200 | **0** |
| Crawlable pages missing from the sitemap | **0** |
| True orphans (no inbound link from any page) | **0** |
| Pages deeper than 2 clicks | **0** |
| Duplicate `<title>` | **0** |
| Duplicate meta description | **0** |
| Missing or incorrect canonical | **0** — all 48 self-canonical to `https://bracketsight.com…` |
| Pages with zero or multiple `<h1>` | **0** |
| Browser console errors | **0** across all 48 pages |
| `<img>` without explicit dimensions | **0** — the site uses no raster images; all graphics are inline SVG |
| Third-party script origins | **0** — fonts are self-hosted via `next/font` at build time |
| Horizontal overflow at 375 / 768 / 1440 | **0** on every page checked |
| `robots.txt` blocking indexable content | **No** — only `Disallow: /api/`, which serves no HTML |

**JSON-LD.** All emitted blocks parse as valid JSON and carry `@context` and `@type`.
`Organization` on all 48 pages (site-level, claiming only the name, URL, email and contact point
that are visible on the page). `WebApplication` on all five tool roots. `FAQPage` on `/loans`,
`/paycheck` and `/aca` — the questions and answers marked up are visibly rendered on those pages,
verified in the crawled HTML. No markup describes content a reader cannot see.

---

## ads.txt verification

| Check | Result |
|---|---|
| Serves at `/ads.txt` | Pass — HTTP 200 |
| `Content-Type` | Pass — `text/plain; charset=UTF-8` |
| Record present, exact | Pass — `google.com, pub-1973018352310576, DIRECT, f08c47fec0942fa0` |
| Field count and separators | Pass — 4 comma-separated fields, correct order |
| Publisher ID matches the account | Pass — `pub-1973018352310576` |
| Relationship | Pass — `DIRECT` |
| Certification authority ID | Pass — `f08c47fec0942fa0`, Google's |
| Stray records or wrong domains | Pass — none |
| Comments | Pass — 5 leading `#` lines, ignored by parsers |

One correction applied: the comment block referenced `packages/ui AdSlot`, a monorepo path from
before the merge. Now `src/components/ui/components/AdSlot.tsx`. The record itself was and is
correct.

**Origin caveat.** `ads.txt` must serve from the root of the domain the AdSense account is
registered against. It lives in `public/`, so it serves from whatever origin the app is deployed
to. If the site is served from `www.bracketsight.com` with the account registered to
`bracketsight.com` — or the reverse — confirm the redirect preserves `/ads.txt`.

---

## Ad-loader verification

No AdSense loader exists anywhere in the app, as required at this stage. Verified by grep across
`src/` and `public/` for `adsbygoogle`, `pagead2`, `googlesyndication` and `adsense`: the only
matches are the comment in `ads.txt` and four explanatory code comments. No `<script>` tag on any
of the 48 crawled pages loads a third-party origin. `AdSlot` has **zero usages** in the
application.

---

## What the owner must supply

Nothing below can be produced by an audit, and the first two are real blockers.

1. **A named human, and what qualifies them.** Fill in `MAINTAINER` in `src/lib/site.ts`: name,
   role, 2–4 sentences of checkable background, and ideally a profile URL a reviewer can open.
   `/about` renders it automatically. **This is the single biggest blocker to approval.** If the
   site trades as a registered entity, name the entity and its jurisdiction as well — but an
   entity with no named person behind it is not attribution.

2. **A decision on the 55 unverified items.** Either close the ones that reach user-facing figures,
   or commit to a single shared mechanism that surfaces the unverified state on every page showing
   an affected figure. The two worst cases are now disclosed on the page (M10), but the pattern —
   disclosure at each author's discretion — will drift again.

3. **The credentialed reviewers the editorial policies promise.** An enrolled agent or CPA for the
   tax and subsidy engines, a construction attorney for each state's contract clause language, two
   working contractors for the trades pricing data. Every section's editorial policy names this as
   a launch gate and none has been met. Until then those pages must keep saying so — do not
   quietly drop the warning to look more finished.

4. **A commercial cost-data licence** (`GAP-031`) if the trades pricing is to carry a real
   citation rather than a labelled placeholder (S3).

5. **Confirmation of the apex-vs-www origin** the AdSense account is registered against, and that
   `/ads.txt` serves from it.

6. **An Open Graph image**, if social click-through matters (S10).

7. **A decision on the public repository link** (N4) — publish it, or leave the references removed.

---

## What was NOT done, deliberately

- **No AdSense loader script was added.** Out of scope and premature.
- **No author, credential, business address or reviewer was invented.** `MAINTAINER` is `null`
  rather than a plausible-looking placeholder, and no page names a person.
- **No new fact was asserted without a source in the repository.** The one pre-existing uncited
  statistic found was removed rather than sourced from memory (S7).
- **`src/components/ui/**` and `src/styles/globals.css` were not edited** — owned by another agent.
  The two `AdSlot` findings (S1, S2) are written as patches for that owner rather than applied.
- **No git command was run.**

## Gates at time of writing

`npm run typecheck` clean · `npm test` 468 passing (42 files) · `npm run build` clean, 53 routes
prerendered.
