# AdSense approval audit — Bracketsight

**Audited 2026-08-18.** Second pass, building on the 2026-08-17 audit; settled items are not
re-litigated, they are re-verified.

Method: `NEXT_PUBLIC_SITE_URL=https://bracketsight.com npm run build` after `rm -rf .next/cache`,
served with `next start -p 3320`, crawled with system Chrome over every rendered link plus every
sitemap entry — **55 HTML pages**, each fetched twice, once with JavaScript enabled and once with
it disabled. Publisher account `pub-1973018352310576`. The site has never been submitted.

**Verdict: close, but not today.** Every structural, technical and disclosure finding from the
first pass is now closed and re-verified on a fresh crawl. The content floor has moved a long way:
the thinnest page on the site outside the in-flight guides pipeline is now 604 words, against 41
words two days ago. Three things stand between this and a submission, and two of them are somebody
else's keystrokes, not an audit's.

---

## Scoreboard

| Area | ✅ pass | ⚠️ weak | ❌ fail |
|---|---:|---:|---:|
| Content value / thin pages | 6 | 2 | 1 |
| Trust and E-E-A-T | 7 | 2 | 0 |
| Privacy, cookies and consent | 8 | 0 | 0 |
| Navigation | 7 | 1 | 0 |
| Technical hygiene | 12 | 1 | 0 |
| Prohibited content / overclaiming | 4 | 2 | 0 |
| Ad configuration | 5 | 0 | 0 |
| **Total** | **49** | **8** | **1** |

Measured before this pass → after:

| Metric | 2026-08-17 | Now |
|---|---:|---:|
| Indexable pages crawled | 48 | **55** |
| Pages under 300 words of own content | 1 | **3** (all three in the in-flight guides tree) |
| Pages under 600 words of own content | 16 | **3** (all three in the guides tree) |
| Thinnest page outside the guides tree | 296 | **604** |
| Median page-specific word count | 753 | **1,156** |
| Tool pages under 600 words | 3 | **0** |
| Methodology pages under 1,000 words | 4 | **0** |
| Pages with no breadcrumb trail | 47 | **0** |
| Pages with `BreadcrumbList` markup | 0 | **54** (every non-hub page) |
| True orphans (zero inbound links) | 0 | **0** |
| Pages deeper than 2 clicks | 0 | **0** |
| Internal links resolving to a non-200 | 0 | **0** |
| Outbound anchors pointing at a reserved TLD | 14 | **0** |
| `<html lang>` | `en` | **`en-US`** |
| Meta descriptions over 170 characters | 5 | **0** |
| Cookie consent mechanism | none | **self-hosted, gated, verified** |
| Named-human attribution page | none | **`/authors`, mechanism built, data null** |

---

## ❌ FAIL — one item

### F1. The guides tree ships three pages under 250 words — **another agent's, flag only**

`/guides/aca` (105 words), `/guides/loans` (106) and `/guides` (231) are the three thinnest
indexable pages on the site by a wide margin, and they are in the sitemap. The two tool-index
pages are a heading, a one-line description and a list of two links. That is the doorway-page
shape: a URL that exists to hold links rather than to answer anything.

This is the content agent's in-flight MDX pipeline, and it is explicitly not mine to edit. What
the audit can say precisely:

- The two articles themselves are substantial (1,353 and 1,641 words) and carry six inline
  citations each. They are pipeline proofs rather than a guides section, and they should not be
  counted as evidence that one exists.
- A tool-index page with two entries cannot carry 600 words honestly. The right answer is
  probably not to expand them but to **stop emitting a per-tool index until a tool has enough
  articles to justify one**, and let `/guides` link articles directly in the meantime.
- Both articles render a visible "no named reviewer has checked this page" line. That is the
  correct behaviour and it is also, for a YMYL page an ad network is assessing, an admission —
  see W2.

**Nothing else on the site fails.** Every other finding is a pass or a weakness.

---

## ⚠️ WEAK — eight items

### W1. Two pages throw a hydration error in the console — **another agent's, flag only**

`/guides/rap-can-cost-more-than-standard` and `/guides/aca-subsidy-cliff-400-percent` each emit
one `pageerror`: React error #418, a server/client HTML mismatch. Every other page on the site is
console-clean. It is not a visible defect and not a policy breach, but "no console errors" was
true of all 48 pages before the guides landed and is now true of 53 of 55. Owned by
`src/app/guides/[slug]/`.

### W2. No credentialed reviewer has signed off on anything, and the site now says so in three places

This is the honest weakness and it is not fixable by an audit. `/authors` publishes the table:
six review gates named by the section editorial policies, all six *Not engaged*. Two articles say
it per-article. The E-E-A-T assessment has to treat this as an open weakness rather than a passing
item, because it is one — a reviewer who reads the editorial policies will find the site promising
a review it has not had.

The alternative — quietly dropping the promise so the pages look finished — is worse, and would be
the single most dishonest change available. Keep saying it.

### W3. `MAINTAINER` is still `null`, so no page names a human

Unchanged from the first audit as a *fact*, but the mechanism is now complete and there are two
render sites rather than one. `/about` renders an attribution block when the object is set;
`/authors` renders a fuller one plus a profile link. While it is null, `/authors` states plainly
that one person maintains the rule files and is not yet named, and publishes the process instead.

**This remains the largest single risk to both approval and ranking.** Filling in five fields in
`src/lib/site.ts` closes it; nothing else has to change.

### W4. Duplicate JSON-LD blocks on the four guides pages — **another agent's, flag only**

All four emit two `BreadcrumbList` blocks, and the two articles emit two `Organization` blocks.
The global `<Breadcrumbs />` now covers every page, so the per-page blocks in `ArticleView.tsx`
and `ToolIndexView.tsx` are redundant. Duplicate structured data is not a violation, but two
`BreadcrumbList` objects describing the same page is the kind of thing that gets a rich-result
eligibility flag. Left alone on instruction; the content agent is reconciling it.

### W5. `/trades/invoice` has three inbound links, the fewest on the site

Not an orphan and not deep — depth 2, 897 words — but it sits at the bottom of the internal-link
distribution alongside the four guides pages. The section's four content gates ask for two inbound
links minimum; three clears it with little margin.

### W6. Six outbound citation links could not be verified from this environment

Of 58 distinct outbound links, 41 return HTTP 200. Nine return 403 to an automated client and are
known bot-blocks (`congress.gov`, `nysenate.gov`, `ssa.gov`, `cookcountyassessor.com`,
`attorneygeneral.gov`, `codes.findlaw.com`) — a browser reaches all of them, and
`VERIFICATION-STATUS.md` records each block. Six more (`flsenate.gov` ×2,
`statutes.capitol.texas.gov` ×2, `ptab.illinois.gov`, `njleg.state.nj.us`) returned nothing at
all, and **DNS resolution for those hosts times out inside this sandbox**, so the result proves
nothing about the links. They are listed rather than claimed as either working or broken. Someone
on an ordinary connection should click all six before submission.

### W7. Property verdict strings state a statutory entitlement with an unresolved multiplier behind it

`src/engines/property/verdict.ts` (read-only, correctly) emits headlines including *"Strong case:
Chapter 123 entitles you to a $X reduction"*. The reduction is in assessed value and the statute
does drive it, so the claim is defensible. What is not settled is the conversion of that reduction
into the annual dollar figure shown beside it: `estimatedTaxRateOnAssessedBps` is **UNRESOLVED for
both covered counties**. The section footer names this on every page in the section, and both
county pages now name it with the per-county reason. The gap between "the statute entitles you"
and "which is worth $X a year" is disclosed, but a reader in a hurry will read the second number.
Closing `GAP-014` / `GAP-043` is the real fix.

### W8. `/property/counties` at 604 words is the thinnest page outside the guides tree

It clears the 600-word floor by four words, which is not a margin. It is a genuinely useful page —
what must be true before a county publishes, and what to do when yours is not covered — but a
third covered county would serve it better than more prose.

---

## ✅ PASS — what was fixed and verified this pass

### Content value

**P1. Every tool page and every methodology page now clears its floor.** Fifteen pages were
expanded against primary sources already in the repository, with every figure imported from the
engine rather than transcribed:

| Route | Before | After | What was added |
|---|---:|---:|---|
| `/aca/methodology` | 764 | **3,243** | MAGI construction, the FPL-year lag, the applicable-percentage interpolation worked through, the benchmark mechanic, CSR bands, reconciliation and repayment limits, Medicaid-gap handling, every rounding direction |
| `/paycheck/methodology` | 498 | **2,774** | The seven-step order of operations, the 1.5×-into-MAGI / 0.5×-into-deduction asymmetry, the phase-out exhaustion table computed by the engine, three rounding directions, what is deliberately not modelled |
| `/trades/pricing-methodology` | 487 | **1,922** | The assembly table, waste-vs-access application order, the compounded markup, staleness arithmetic, and what an authoritative pricing basis would actually be |
| `/property/methodology` | 918 | **1,755** | Comp rejection reasons, the recency taper, fee-band selection before the worth-it test, the four places the engine refuses to answer |
| `/paycheck/sources` | 576 | **1,688** | How to read an entry, the source hierarchy, the ten documents read but not yet written into the files, the named blocked hosts and the routes around them |
| `/aca/sources` | 540 | **1,631** | Per-file verification status, effective windows, the open gap on each |
| `/loans/sources` | 343 | **1,612** | What each source settles, what it does not, when it was last read, what would move it |
| `/paycheck/occupations` | 553 | **1,562** | What makes an occupation qualified, the TTOC code structure, W-2 box linkage, why a search miss is not a disqualification |
| `/aca/changelog` | 296 | **1,482** | The rule-versioning scheme, what triggers an entry, how to tell whether a figure has moved |
| `/property/counties/nj/bergen` | 468 | **1,966** | The Chapter 123 corridor worked live, the fee schedule, received-by-not-postmark, the empty Director's Ratio table |
| `/property/counties/il/cook` | 447 | **1,815** | The uniformity-ratio model, the 30-day floor, the $0 fee's actual scope |
| `/trades/contracts/TX` | 680 | **1,628** | Per-state statutory formatting rules and a worked trigger example |
| `/trades/contracts/CA` | 562 | **1,530** | ditto, plus the $1,000 down-payment cap firing on a worked job |
| `/trades/contracts/NY` | 667 | **1,499** | ditto |
| `/trades/contracts/PA` | 529 | **1,459** | ditto |
| `/trades/contracts/FL` | 482 | **1,258** | ditto |
| `/property/changelog` | 411 | **1,218** | File inventory, loader validations, re-check cadences |
| `/trades/changelog` | 319 | **977** | The same, for pricing and state rulesets |
| `/trades/contract` | 601 | **932** | The fact set the trigger evaluates, and why generation fails closed |
| `/trades/invoice` | 557 | **897** | Why the margin is structural rather than checked, deposit clamping, what the document is not |
| `/contact` | 437 | **627** | What happens after you send a report, and why a rule change is a one-file edit |

No entry was invented in any changelog. The five `/trades/contracts/*` pages diverge on per-state
engine data — statutory formatting blocks, clause counts, and a trigger example run against each
state's own thresholds — so they are not five renderings of one template.

**P2. Tool pages read as complete guides with JavaScript off.** Verified by fetching all 55 routes
in a second browser context with `javaScriptEnabled: false`. Every page returns 200 and renders its
full prose; the largest shortfall anywhere is 26 words on `/trades/invoice`, which is a
localStorage-dependent line, not a section. `/loans` renders 1,803 words and a computed default
verdict with no JavaScript at all. There is no "enable JavaScript", no loading state and no empty
section on any route.

**P3. No placeholder text, no "coming soon", no empty sections.** Swept the rendered text of all 55
pages. The only strings matching a placeholder pattern are deliberate disclosures — the trades
pricing warnings and the paycheck pre-launch banner — which are content, not omissions.

**P4. No near-duplicate pages.** Zero duplicate titles and zero duplicate meta descriptions across
55 pages. Three section About pages shared the h1 "About Bracketsight"; they now read "About the
ACA cliff planner", "About the trades document engine" and "About the property assessment check".

### Trust and E-E-A-T

**P5. An authors-and-reviewers page exists: `/authors`, 1,190 words.** Driven by `MAINTAINER`, so
filling that object in is the whole change. While it is null the page publishes the process that
is real and checkable: what verification means here (somebody fetched the URL and read the value
off the document), why a secondary source may cross-check but never close a row, the incident that
produced that rule — a summarising fetch layer returning a fabricated percentage table over a
correct one — and the pass over **315 individual values: 203 confirmed, 69 corrected, 36 left
unresolved rather than filled in**, broken down per engine. Then the six review gates, all
unmet. Every figure is transcribed from `VERIFICATION-STATUS.md`. **No person, credential,
qualification or address was invented.**

**P6. The trust surface is complete and linked from every page.** `/about`, `/authors`,
`/contact`, `/privacy`, `/terms` and the cookie control render in the footer of all 55 pages;
`/guides` and `/glossary` were added to a separate footer column because nothing linked to either.
Each section carries its own methodology, sources, editorial policy, changelog and about.

**P7. Contact is a working `mailto:`.** `info@bracketsight.com` renders as visible text and as a
`mailto:` link on `/contact`, in the footer of every page, on the 404 and in the `Organization`
JSON-LD `contactPoint`. One address, one constant, no form posting nowhere.

**P8. Funding is disclosed before any advertising runs.** `/about` and `/privacy` both state that
advertising is planned, that none runs today, and that no code path lets a sponsor reach a computed
figure. `/privacy` names the publisher account.

**P9. Per-section unverified-state disclosure is now even.** It was strong where a section author
wrote one and absent where they did not. The ACA section had no section footer at all, and the
benchmark premium — the input every credit figure multiplies through — is `SAMPLE_DATA` with six
invented county base premiums. The trades section had no footer either, and every price in all
three rulesets is placeholder data past its own staleness window. Both now carry a section footer
on every page in the section, with the status and counts read from the rule files so the warning
disappears on its own when the data lands and cannot be left behind by hand.

### Privacy, cookies and consent

**P10. A self-hosted consent mechanism, no dependency, no CMP SDK.** `src/lib/consent.ts` (the
storage and gate) and `src/components/layout/ConsentBanner.tsx` (the banner and the footer
control). Verified end to end with Chrome:

| Requirement | Verified |
|---|---|
| Does not run before it must | No banner in the server HTML and none on the first client paint — `curl \| grep data-consent-banner` returns 0. It mounts one effect later, only if no decision is stored. |
| Blocks non-essential storage until consent | `hasAdConsent()` returns false until an explicit accept. `localStorage` is empty on a first visit and after Escape. |
| Records the choice locally | `bracketsight.consent.v1` = `{"ads":"denied"\|"granted","at":ISO,"version":1}`. Refusal is a real write, so a reader who declines is not asked again. |
| Keyboard dismissible | Focus moves to the banner region on mount (`aria-label="Cookie choices"`), Tab reaches the privacy link then Reject then Accept, Escape dismisses without storing anything and consent stays denied. |
| Not a dark pattern | Reject and Accept are the same component, size, weight and colour, reject first. No pre-ticked box, no "manage preferences" maze, no wall — nothing on the site is withheld either way. |
| Withdrawal as easy as consent | A **Cookie choices (advertising cookies refused)** control in the footer of every page reports the current state in words and reopens the banner in one click. Verified: clearing propagates to the gate without a reload, and across tabs via the `storage` event. |
| CLS | `position: fixed` at the bottom, outside the layout flow. Measured 0.00 on `/` at 390px with the banner open. |
| The AdSense loader is gated | `src/components/layout/ConsentGate.tsx` renders children only on an explicit accept, and is subscribed rather than read once, so withdrawal unmounts the vendor immediately. The file documents exactly where the loader goes. **No loader was added.** |

**P11. The privacy policy meets the publisher requirements.** `/privacy` grew 645 → 1,156 words
and now carries: the two storage categories and why a calculator saving your own input is not
gated; how the banner works and that silence is not consent; how to withdraw; the third-party
vendor cookie disclosure; the Google vendor links —
`policies.google.com/technologies/partner-sites` and `policies.google.com/technologies/ads` — plus
`google.com/settings/ads`, `aboutads.info/choices` and `youronlinechoices.eu`; a UK/EU section
naming consent as the lawful basis for ad storage and necessity for tool storage; and an accurate
statement of what the request log holds. The claim that no ad script is present is written as an
instruction to verify it in the page source.

### Navigation

**P12. Breadcrumbs on every non-home page, with matching markup.** `<Breadcrumbs />` renders from
the root layout, so a section that ships a page gets a trail without doing anything. One derived
trail feeds both the visible `nav[aria-label="Breadcrumb"]` and the `BreadcrumbList` JSON-LD, so
the markup cannot describe a hierarchy the reader cannot see. Segments that are not real routes
(`/trades/contracts`, `/property/counties/il`) are dropped rather than rendered as crumbs that
404. Verified on all 54 non-hub pages.

**P13. Zero orphans, nothing past 2 clicks.** Checked programmatically: BFS from `/` reaches all 55
pages, the sitemap has 55 entries, and the two sets are identical in both directions. Lowest
inbound count is 2.

**P14. No redirect chains, no soft 404s.** `/nope` returns a real HTTP 404 with a custom page
naming the five tools, the contact address and `/about`, marked `noindex, follow`. `/loans/`
returns a single 308 to `/loans` — one hop, Next's own trailing-slash normalisation, no chain.
Every internal link on every page resolves to a 200.

### Technical hygiene

**P15.** `<html lang="en-US">` on all 55 pages. Every rule is a US federal, state or county rule
and every figure is USD; the regional subtag is what tells a browser and a screen reader which
English this is.

**P16.** Canonicals correct on all 55, self-referential, absolute, `https://bracketsight.com…`. The
hub's canonical resolves to the bare origin with no trailing slash, and `sitemap.ts` now emits
`SITE_URL` rather than `absoluteUrl("/")` for that one entry, so the sitemap no longer declares a
URL the page canonicalises away.

**P17.** Zero console errors on 53 of 55 pages; the two exceptions are W1.

**P18.** No images to break: the site uses no raster images at all. Every graphic is inline SVG,
and every SVG is either `aria-hidden` or carries an accessible name — checked programmatically
across all 55 pages, zero unlabelled.

**P19.** Favicon and manifest. `src/app/icon.svg` serves at `/icon.svg` as `image/svg+xml`; a new
`src/app/manifest.ts` serves `/manifest.webmanifest` as `application/manifest+json` and is linked
from the head of every page. `display: "browser"` and `purpose: "any"` — a tool whose value is a
citable URL keeps its address bar, and claiming `maskable` without a designed safe zone gets the
mark cropped.

**P20.** No third-party requests of any kind. Zero external `<script src>` on any page; the three
faces are downloaded at build time by `next/font` and served from this origin.

**P21.** Meta descriptions: none over 170 characters, twelve in the 161–170 band against a 160
target. Titles run long on most pages, roughly 15 characters of which is the ` · Bracketsight`
suffix. Cosmetic; not fixed.

**P22.** `robots.txt` blocks nothing indexable — only `/api/`, which serves no HTML. The
non-standard `host` directive was removed. `/design/*` is deliberately **not** disallowed: those
routes carry `noindex` in their own metadata and a crawler has to fetch a page to read the noindex
on it.

**P23.** A stale citation URL was removed from the site's flagship page. `/loans` hard-coded
`federalregister.gov/documents/2026/07/01/rise-final-rule` — a placeholder slug built from the
rule's *effective* date, for a rule that published on 1 May 2026, on a host that bot-blocks every
path. It resolved to nothing for a reader who clicked it. The rule file had already been corrected
to the GPO text; the page held its own copy. The page now reads all three of its sources out of the
rule files, so it cannot drift again.

**P24.** No outbound link to a reserved TLD renders as a link. The three trades pricing rulesets
cite `https://example.invalid/pricing-methodology` — correct in the data, since `.invalid` can
never resolve and makes the placeholder impossible to mistake for a source. It was rendering as a
live anchor **fourteen times** across `/trades`, `/trades/pricing-methodology` and every per-line trace
in the takeoff builder: on a site whose central claim is that every rule is cited, the one citation
a sceptical reader would definitely click was guaranteed to fail DNS. `src/lib/trades/citation.ts`
now maps an unresolvable citation onto a label that says there is no published source and a link to
the on-site page explaining what the pricing rests on. Purely presentational; no rule file touched;
it stops matching automatically when a licensed source lands. Verified: zero `.invalid` hrefs in
the final crawl.

**P25.** No horizontal overflow at 390px on the pages checked, and the consent banner was
restructured after the first render squeezed its text into a 20-character column and covered half
a phone viewport.

### Prohibited content and overclaiming

**P26.** Swept the rendered text of all 55 pages for guarantee language, promised savings and
outcome claims: `guarantee`, `will save`, `risk-free`, `best plan`, `cheapest plan`, `100%`,
`maximise your`, `proven to`, `certain to` and a dozen more. Two hits, both about editorial
independence ("the structural guarantee is stronger than the promise"), which is the correct use.
No page promises an outcome, a saving, or that an appeal will succeed. `successRateNote` is null in
both county rule files and is not rendered.

**P27.** The homepage claimed two AI features in the present tense — "AI reads uploaded documents
and explains results in plain language", and "an uploaded document is read in memory and
discarded". Neither feature exists. `/about` said so, four clicks from the assertion. Both trust
points were rewritten to describe them as planned and not live.

**P28.** An unsourced legislative claim was removed from `/aca/changelog`: *"A bill restoring the
enhanced premium tax credits passed the House in January 2026 but is not law."* It traces to no
file in the repository and could not be verified from a primary source. Replaced with the mechanism
it was there to illustrate — that the lapse is a live legislative question, that this page will not
report a bill's status it cannot cite, and that a restored credit lands as a dated ruleset — which
is true and sourceable.

**P29.** No scraped or copyrighted text. The long quotations on the site are statutory notice text,
quoted verbatim and cited, which is the correct treatment; the trades engine refuses to generate a
contract for any state whose notice has not been transcribed word for word rather than paraphrase
one.

### Ad configuration

**P30. `ads.txt`** — HTTP 200 at `/ads.txt`, `Content-Type: text/plain; charset=UTF-8`, record
exact: `google.com, pub-1973018352310576, DIRECT, f08c47fec0942fa0`. Four comma-separated fields,
correct order, publisher ID matches the account, `DIRECT`, Google's certification authority ID, no
stray records, five leading `#` comment lines that parsers ignore.

**P31. No ad-slot placeholder renders anywhere.** `AdSlot` has **zero usages** in the application —
the only references are its own barrel export and one explanatory comment in `ConsentGate`.
Verified from the other end too: the final crawl found zero elements matching
`aside[aria-label*="advertis"]` on any of the 55 pages. No blank ad container, no reserved grey box,
nothing for a reviewer to read as an ad that failed to load.

**P32. No AdSense loader.** Grep across `src/` and `public/` for `adsbygoogle`, `pagead2`,
`googlesyndication` and `adsense` returns only comments, the `ads.txt` header, and one deliberate
occurrence in rendered copy — `/privacy` tells the reader to search the page source for
`googlesyndication` and find nothing. No page loads a third-party origin.

**P33. `AdSlot`'s two first-pass findings are closed** by whoever owns
`src/components/ui/**`. The reservation is now a fixed `height` with `overflow: hidden` rather than
`min-height`, so an oversized creative is clipped instead of pushing the page down; and a
`ToolBoundary` context makes an ad inside a calculator a build-time error in development and a
silent no-render in production. The disguised-ads defence is now structural rather than a
convention in a document.

---

## Word-count table

Page-specific content: `innerText` of `<main id="main">`, with every text line appearing on more
than three pages subtracted as boilerplate — so the site header, footer, section navs, breadcrumb
trail and the repeated section disclaimers are all excluded. "JS-off" is the same measurement in a
browser context with JavaScript disabled. ⚠ marks under 600.

| Route | Words | JS-off | Depth | Inbound | Cites | Controls |
|---|---:|---:|:-:|---:|---:|---:|
| `/guides/aca` | 105 ⚠ | 105 | 2 | 2 | — | — |
| `/guides/loans` | 106 ⚠ | 106 | 2 | 2 | — | — |
| `/guides` | 231 ⚠ | 231 | 1 | 54 | — | — |
| `/property/counties` | 604 | 604 | 2 | 9 | — | — |
| `/contact` | 627 | 627 | 1 | 54 | — | — |
| `/` | 693 | 693 | 0 | 54 | — | — |
| `/terms` | 734 | 734 | 1 | 54 | — | — |
| `/trades/sources` | 738 | 738 | 2 | 12 | 9 | — |
| `/trades` | 759 | 758 | 1 | 54 | — | 66 |
| `/trades/editorial-policy` | 828 | 828 | 2 | 12 | — | — |
| `/aca/editorial-policy` | 864 | 864 | 2 | 6 | — | — |
| `/paycheck` | 873 | 873 | 1 | 54 | — | 19 |
| `/trades/invoice` | 897 | 871 | 2 | 3 | — | 1 |
| `/trades/about` | 897 | 897 | 2 | 12 | — | — |
| `/property/editorial-policy` | 903 | 903 | 2 | 9 | — | — |
| `/trades/contract` | 932 | 907 | 2 | 9 | — | 1 |
| `/aca/about` | 936 | 936 | 2 | 6 | — | — |
| `/paycheck/changelog` | 946 | 946 | 2 | 6 | — | — |
| `/loans/privacy` | 965 | 965 | 2 | 7 | — | — |
| `/trades/changelog` | 977 | 977 | 2 | 12 | — | — |
| `/loans/changelog` | 989 | 989 | 2 | 7 | — | — |
| `/property/about` | 998 | 998 | 2 | 9 | — | — |
| `/paycheck/editorial-policy` | 1047 | 1047 | 2 | 6 | — | — |
| `/loans/editorial-policy` | 1058 | 1058 | 2 | 7 | — | — |
| `/loans/methodology` | 1095 | 1095 | 1 | 18 | — | — |
| `/property/sources` | 1137 | 1137 | 2 | 9 | — | — |
| `/about` | 1153 | 1153 | 1 | 54 | — | — |
| `/privacy` | 1156 | 1156 | 1 | 54 | — | — |
| `/authors` | 1190 | 1190 | 1 | 54 | — | — |
| `/loans/about` | 1214 | 1214 | 2 | 7 | — | — |
| `/property/changelog` | 1218 | 1218 | 2 | 9 | — | — |
| `/trades/contracts/FL` | 1258 | 1258 | 2 | 8 | 2 | 1 |
| `/paycheck/about` | 1288 | 1288 | 2 | 6 | — | — |
| `/guides/aca-subsidy-cliff-400-percent` | 1353 | 1353 | 2 | 2 | 6 | — |
| `/trades/contracts/PA` | 1459 | 1459 | 2 | 8 | 1 | 1 |
| `/aca/changelog` | 1482 | 1482 | 2 | 6 | — | — |
| `/trades/contracts/NY` | 1499 | 1499 | 2 | 8 | 2 | 1 |
| `/trades/contracts/CA` | 1530 | 1530 | 2 | 8 | 2 | 1 |
| `/paycheck/occupations` | 1562 | 1562 | 2 | 6 | — | 1 |
| `/loans/sources` | 1612 | 1612 | 2 | 8 | — | — |
| `/trades/contracts/TX` | 1628 | 1628 | 2 | 8 | 2 | 1 |
| `/aca/sources` | 1631 | 1631 | 2 | 7 | — | — |
| `/guides/rap-can-cost-more-than-standard` | 1641 | 1641 | 2 | 2 | 6 | — |
| `/aca` | 1650 | 1650 | 1 | 54 | 3 | 30 |
| `/property` | 1685 | 1685 | 1 | 54 | — | 14 |
| `/paycheck/sources` | 1688 | 1688 | 2 | 6 | — | — |
| `/property/methodology` | 1755 | 1755 | 1 | 21 | — | — |
| `/loans` | 1803 | 1803 | 1 | 54 | 3 | 31 |
| `/property/counties/il/cook` | 1815 | 1815 | 2 | 4 | 1 | — |
| `/property/check` | 1860 | 1860 | 2 | 5 | — | 22 |
| `/trades/pricing-methodology` | 1922 | 1922 | 1 | 24 | — | — |
| `/property/counties/nj/bergen` | 1966 | 1966 | 2 | 4 | 1 | — |
| `/paycheck/methodology` | 2774 | 2774 | 1 | 18 | 4 | — |
| `/aca/methodology` | 3243 | 3243 | 1 | 17 | — | — |
| `/glossary` | 5385 | 5385 | 1 | 54 | — | 18 |

Three pages sit under 600 words and all three are in the guides tree (F1). `/contact` at 627 is a
contact page and is the right length for one.

---

## Click-depth map

BFS from `/` over every rendered link, header, footer and breadcrumb included. **Every page is
within 2 clicks of the homepage. Zero orphans, zero pages at depth 3 or beyond.**

**Depth 0** — 1 page

`/`

**Depth 1** — 17 pages

`/about` · `/aca` · `/aca/methodology` · `/authors` · `/contact` · `/glossary` · `/guides` ·
`/loans` · `/loans/methodology` · `/paycheck` · `/paycheck/methodology` · `/privacy` ·
`/property` · `/property/methodology` · `/terms` · `/trades` · `/trades/pricing-methodology`

**Depth 2** — 37 pages

`/aca/about` · `/aca/changelog` · `/aca/editorial-policy` · `/aca/sources` · `/guides/aca` ·
`/guides/aca-subsidy-cliff-400-percent` · `/guides/loans` ·
`/guides/rap-can-cost-more-than-standard` · `/loans/about` · `/loans/changelog` ·
`/loans/editorial-policy` · `/loans/privacy` · `/loans/sources` · `/paycheck/about` ·
`/paycheck/changelog` · `/paycheck/editorial-policy` · `/paycheck/occupations` ·
`/paycheck/sources` · `/property/about` · `/property/changelog` · `/property/check` ·
`/property/counties` · `/property/counties/il/cook` · `/property/counties/nj/bergen` ·
`/property/editorial-policy` · `/property/sources` · `/trades/about` · `/trades/changelog` ·
`/trades/contract` · `/trades/contracts/CA` · `/trades/contracts/FL` · `/trades/contracts/NY` ·
`/trades/contracts/PA` · `/trades/contracts/TX` · `/trades/editorial-policy` · `/trades/invoice` ·
`/trades/sources`

`/about`, `/authors`, `/contact`, `/privacy`, `/terms`, `/guides` and `/glossary` are each linked
from all 54 other pages, via the site footer.

---

## Structural checks — final crawl

| Check | Result |
|---|---|
| Pages crawled | 55 |
| Sitemap entries | 55 |
| Internal links resolving to a non-200 | **0** |
| Sitemap entries not returning 200 | **0** |
| Crawlable pages missing from the sitemap | **0** |
| True orphans | **0** |
| Pages deeper than 2 clicks | **0** |
| Pages with no breadcrumb trail | **0** |
| Duplicate `<title>` | **0** |
| Duplicate meta description | **0** |
| Missing or incorrect canonical | **0** |
| Pages with zero or multiple `<h1>` | **0** |
| `<html lang>` other than `en-US` | **0** |
| Pages returning non-200 with JavaScript disabled | **0** |
| Browser console errors | **2 pages**, both in the guides tree (W1) |
| `<img>` without dimensions | **0** — no raster images anywhere |
| SVGs without an accessible name or `aria-hidden` | **0** |
| Third-party script origins | **0** |
| Ad slots rendered | **0** |
| Meta descriptions over 170 characters | **0** |
| `robots.txt` blocking indexable content | **No** |

**JSON-LD.** Every emitted block parses and carries `@context` and `@type`. `Organization` on all
55 (site-level; claims only the name, origin and an email visible on the page). `BreadcrumbList` on
all 54 non-hub pages, from the same trail the reader sees. `WebApplication` on all five tool roots.
`FAQPage` on `/loans`, `/paycheck` and `/aca` — questions and answers visibly rendered, verified in
the crawled HTML. `Article` on the two guides articles, `DefinedTermSet` on `/glossary`. No markup
describes content a reader cannot see. Four pages carry duplicate blocks (W4).

---

## The `/design/a|b|c` routes — decision

**They should not exist in a site about to be reviewed. Recommend deletion before submission.**
Flagged rather than deleted, because they were created hours before this audit and another agent is
actively using them.

The reasoning is not that they are untidy. Each renders a full decision table of **frozen invented
dollar figures** — plan payments, forgiveness amounts, thirty-year totals — read from
`src/app/design/data.ts`, on a domain whose entire pitch is that every figure is computed and
cited. And the layout deliberately hides the site header and footer, so a visitor who lands on
`/design/a` sees fabricated money figures with **no disclaimer, no privacy link, no contact route
and no way back to the site**. That is the worst combination of properties any page on this domain
has.

Mitigations already in place: all three carry `noindex, nofollow`, none is in the sitemap, and
nothing links to them, so discovery is close to impossible. That is enough to keep them out of the
index; it is not a reason to leave a page like that on a production origin during a policy review.
They also pull three extra Google font families into the build.

They have served their purpose — the direction is picked. Delete them, or move them behind a
non-production route, before submitting.

---

## What the owner must supply

Nothing below can be produced by an audit.

1. **A named human, and what qualifies them.** Fill in `MAINTAINER` in `src/lib/site.ts`: `name`,
   `role`, 2–4 sentences of checkable `background`, and ideally a `profileUrl` a reviewer can open.
   `/about` and `/authors` both render it automatically — no template or layout work. **This is
   still the single biggest blocker to approval and to ranking.** If the site trades as a
   registered entity, name the entity and its jurisdiction in `entity` as well; an entity with no
   named person behind it is not attribution.

2. **A decision on the guides tree before submission** (F1). Either give `/guides` and the two
   tool-index pages real substance, or stop emitting per-tool index pages until a tool has enough
   articles to need one. Three pages under 250 words in the sitemap is the exact shape the previous
   rejections were about, and it is the only outright failure in this audit.

3. **The credentialed reviewers the editorial policies promise.** An enrolled agent or CPA for the
   tax and subsidy engines, a construction attorney per state for the contract clause language, a
   licensed appraiser or appeal practitioner for the property engine, two working contractors for
   the trades pricing. All six gates are published as *Not engaged* on `/authors`. Until they are
   met the pages must keep saying so — do not quietly drop the warning to look more finished.

4. **A decision on the figures the repository calls illustrative.** The two that reach a
   user-facing dollar amount are the ACA benchmark premium (`SAMPLE_DATA`, six invented county base
   premiums — `GAP-039`) and the county tax rate behind every property overpayment figure
   (UNRESOLVED in both counties — `GAP-014`, `GAP-043`). Both are now disclosed on every page in
   their section, from the rule file rather than by hand. Whether that is enough to ship to an
   ad-supported YMYL audience is a decision, and it should be made deliberately rather than by
   default.

5. **A commercial cost-data licence** (`GAP-031`) if the trades pricing is ever to carry a real
   citation rather than a labelled placeholder. Until then every trades page says the prices are
   placeholder reference data past their own staleness window, which is honest and is also a
   reason a reviewer may judge the section unfinished.

6. **Click the six unverifiable outbound citations** (W6) from an ordinary connection:
   `flsenate.gov` (both statute links), `statutes.capitol.texas.gov` (both),
   `ptab.illinois.gov`, `njleg.state.nj.us`. DNS for those hosts does not resolve inside this
   sandbox, so the audit cannot say whether they work.

7. **Confirm the apex-vs-www origin** the AdSense account is registered against, and that
   `/ads.txt` serves from it. It lives in `public/`, so it serves from whatever origin the app is
   deployed to; if the site answers on `www.bracketsight.com` with the account registered to
   `bracketsight.com`, or the reverse, confirm the redirect preserves `/ads.txt`.

8. **An Open Graph image.** `metadataBase` and `openGraph` are configured and no image is declared,
   so every share renders as a bare text card. Not an approval blocker; a click-through cost on
   every social and chat surface. Needs a designed asset or an `opengraph-image` route.

9. **Delete `/design/a|b|c`,** or confirm the design review still needs them and accept the risk
   described above.

10. **A decision on a public repository link.** Prose across the site used to point readers at
    repository files they could not open; those references were removed in the first pass.
    Publishing the link would be a better answer than removing them.

---

## What was NOT done, deliberately

- **No AdSense loader script was added.** The gate it will sit behind was built and tested; the
  loader itself is out of scope until approval.
- **No third-party CMP or consent SDK, and no new dependency.** `package.json` gained nothing from
  this pass.
- **No person, credential, qualification, business address or reviewer was invented.** `MAINTAINER`
  is `null` rather than a plausible-looking placeholder, and `/authors` says so in words.
- **No engine logic, rule JSON, threshold or test expectation was touched.** `src/engines/**` and
  `tests/**` are unmodified. Where a page needed a figure it imports it; the one page that held its
  own copy of a citation now reads the rule file instead (P23).
- **No fact was asserted without a source in the repository.** The one unsourced claim found was
  removed rather than sourced from memory (P28).
- **`src/components/ui/**` and `src/styles/globals.css` were not edited.**
- **`src/app/guides/**`, `src/app/glossary/**` and `content/**` were not edited** — owned by the
  content agent. The three findings in that tree (F1, W1, W4) are written up rather than fixed. The
  one exception is that `/guides` and `/glossary` were added to the footer and to
  `breadcrumbTrail()`, from `src/lib/site.ts`, because both shipped with nothing linking to them.
- **`/design/a|b|c` were not deleted.** Recommended, not done.
- **No git command was run.**

## Gates

`npm run typecheck` clean · `npm test` **468 passing (42 files)** · `npm run build` clean, **64
routes prerendered**, 55 of them indexable.
