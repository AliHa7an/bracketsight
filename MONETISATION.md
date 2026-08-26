# Monetisation — Bracketsight

**Status: wired, inert, unapproved.** Every advertising position on this site exists in code, reserves
its exact height, and loads nothing. No ad unit renders on any page and no ad-network script is
served to any browser. The site has never served an ad and will not until somebody deliberately sets
one environment variable and redeploys.

One caveat to that, and it is not part of this system: a separate ownership-verification tag was
added to `src/app/layout.tsx` while this work was in progress. It is inert today and it is outside
the consent gate. **Read "Two loaders" below before setting anything.**

This document is the human-readable half of `src/lib/ads/`. Where the two disagree, the code is
right — the placement map is a typed registry whose invariants are asserted at module load, so a
placement that breaks a rule fails the build rather than a policy review.

---

## ⚠ Two loaders — an open decision for the owner

**Read this before setting any environment variable.** While the placements were being wired, a
second and entirely separate AdSense mechanism was added to `src/app/layout.tsx`: a bare loader
`<script>` in `<head>`, for **ownership verification and review**, gated on
`NEXT_PUBLIC_ADSENSE_CLIENT`. `/privacy` was updated in the same change to disclose it.

That tag is **not** part of the system this document describes, and it is not behind the consent
gate. It is a deliberate, documented decision by whoever made it, and arbitrating it is the owner's
call, not this document's. But three things about it have to be stated plainly:

1. **It bypasses consent.** It sits in `<head>`, outside `<ConsentGate>`, so it loads for every
   visitor before anyone has agreed to anything. Its own comment acknowledges the script can set
   cookies. Everything else in this repository is built so that cannot happen.

2. **It is inert today, but `/privacy` says otherwise.** `NEXT_PUBLIC_ADSENSE_CLIENT` is unset, the
   ternary is dead code, and a grep of the whole build output finds zero occurrences of the loader
   URL. Meanwhile `/privacy` now states the script "*is* now loaded in the page head". **That
   sentence is false of every build this repository currently produces**, on the one page whose job
   is to be exactly accurate, and an AdSense reviewer reads that page. Either the variable is set in
   production and the sentence is true, or it is not and the sentence needs correcting. It cannot
   stay as it is.

3. **The two mechanisms now use different variables, on purpose.** The ad units read
   `NEXT_PUBLIC_AD_CLIENT`; the verification tag reads `NEXT_PUBLIC_ADSENSE_CLIENT`. They shared one
   variable for a while, which meant that following step 3 of the runbook below would have put
   **two** AdSense loaders on every page — one gated, one not — which is both a consent failure and
   the "only one AdSense head tag supported per page" error. Setting one no longer turns on the
   other. Setting both still puts two loaders on the page.

**Worth checking before deciding:** `public/ads.txt` already serves the correct publisher record, and
an `ads.txt` snippet is one of the verification methods Google accepts. There is also a meta-tag
method (`<meta name="google-adsense-account" content="ca-pub-…">`) that verifies ownership without
loading a script or setting a cookie. If either satisfies the review, the site can be verified with
no ungated third-party script at all — which would let the consent promise stand unqualified and let
`/privacy` go back to the stronger sentence. Confirm against Google's current documentation before
acting; this is a process question with real consequences and it should be checked, not assumed.

---

## The switch

One environment variable, three states, read in exactly one place
(`src/lib/ads/config.ts`).

| `NEXT_PUBLIC_ADS_MODE` | What a mapped placement renders | Loader | Third-party request |
|---|---|---|---|
| unset / `off` | **nothing at all** — no element, no box, no label, no reserved height | absent | none |
| `reserve` | the fixed reserved box, labelled "Advertisement", dashed rule | absent | none |
| `on` | the reserved box, with an ad element inside it | mounted **inside `<ConsentGate>`** | only after an explicit accept |

Unset means `off` in production and `reserve` in development, so a developer sees the map and a
reader does not. A misspelled value throws at build time rather than falling back to `off`: a switch
the operator believes is on and is not costs a week of wondering why nothing fills.

`off` is not merely "ads disabled". It is what keeps `ADSENSE-AUDIT.md` P31 true — *no ad-slot
placeholder renders anywhere on the site*. A reviewer who finds a reserved grey box labelled
"Advertisement" on a site that has never served an ad is looking at an ad that failed to load, and
"ad units that do not fill" is a rejection reason of its own. Wiring the placements and showing them
are two different decisions, and only the first has been taken.

### Why the ad network is configuration and not code

`ADSENSE-AUDIT.md` P32 records a verified fact: grep this repository for the ad network's script
host and you find comments and documentation, never code. That fact is part of the case being
submitted for review.

A constant in a source file would have ended it. A string in a source file becomes a string in a
deployed JavaScript chunk whether or not any page references it — the first version of this module
put `pagead2.googlesyndication.com` into two static chunks on the production origin. Unreferenced
bytes are not a policy violation, but *"we do not ship the loader"* is a much better sentence to be
able to say during a review than *"we ship the loader's URL in a chunk nothing loads"*.

So the vendor lives in three environment variables, all unset today, and the exact values are
written out in the runbook below. This is not obfuscation — it is the same treatment
`NEXT_PUBLIC_SITE_URL` already gets, for the same reason: a value that differs between environments
does not belong in a source file. It also buys something real. There is no ad network anywhere in
the placement system, so changing networks is three variables and nothing else.

---

## The placement map

Encoded in `src/lib/ads/placements.ts`. Nothing below is decided in a page file — a page renders
`<AdPlacement id="…" />` and the registry supplies the height, the permitted creative sizes, the
disclosure label and the DOM id. A position that is not in the table is not expressible.

### Where a slot may go

| id | Page type | Position | Reserved | Creatives |
|---|---|---|---:|---|
| `tool-below-answer` | tool | between the closing edge of the workbench and the reading band | 304px | 300×250, 336×280 |
| `tool-foot` | tool | after the reading band, before the section footer | 124px | 320×100, 728×90 |
| `article-mid` | article | end of the first section — immediately before the second H2 | 304px | 300×250, 336×280 |
| `article-foot` | article | after the closing tool kicker, last on the page | 304px | 300×250, 336×280 |
| `index-foot` | index | end of the list page | 304px | 300×250, 336×280 |
| `reference-mid` | reference | after the first prose section, at a section boundary | 304px | 300×250, 336×280 |
| `hub-foot` | hub | after the closing colophon band | 124px | 320×100, 728×90 |

20px of each reserve is the permanent "Advertisement" label, which is a disclosure requirement and
part of the box rather than an addition to it. The reserve is a **fixed** height, not a minimum, and
the box clips: a creative taller than the reserve is cut off rather than allowed to push the page.
That trade is deliberate and it is measured below.

### Where a slot may never go

| | Rule |
|---|---|
| **Inside a tool** | Never between a field being edited and the number that changes. This is the "disguised ads" policy risk — an ad inside a calculator panel reads as part of the computed answer — and it is also just the product working: the whole engagement thesis of these instruments is that the answer moves faster than you can type. |
| **Above the answer** | On a tool page, nothing above the closing edge of the workbench. Both tool slots are below the fold on every viewport the site targets. |
| **Before the first H2** | In-article slots only after the first H2, and never adjacent to the FAQ or the Sources ledger. |
| **`/contact`, `/privacy`, `/terms`, `/loans/privacy`** | Policy pages carry no advertising. `/contact` is the correction route a reviewer and a reader with a wrong figure both use. |
| **Consent surfaces** | The banner and the gate carry no placement. An ad on the surface that asks permission to serve ads is self-refuting. |
| **Trust pages** | `/about`, `/authors`, and every section's `methodology`, `sources`, `editorial-policy`, `changelog` and `pricing-methodology`. A deliberate refusal: these pages are the evidence the rest of the site rests on, and selling space beside a citation table discounts the one asset the site has. They are also short-dwell "check one fact" pages, which is the worst inventory on the site — the principled answer and the commercial answer agree. |
| **Beside a `--flag` warning** | Oxide red marks a decision the reader cannot undo. An ad beside *"switching to RAP forfeits your payment credit permanently"* or *"this deadline is nine days away"* is the worst adjacency on the site, and the one a policy reviewer would screenshot. |
| **`/property/counties`** | The site's thinnest indexable page at ~604 words. Ads wait for content. |
| **`/property/check`, `/trades/contract`, `/trades/invoice`** | Document builders and deep-funnel tools. A person mid-way through generating a contract is not an audience to interrupt. |

### How each rule is enforced rather than remembered

Four of the seven placement rules above are machine-checked. That was the point of encoding the map
instead of writing it down.

1. **Never inside a tool.** `ToolShell` wraps the entire workbench in `<ToolBoundary>`. An `AdSlot`
   rendered anywhere inside it — by a tool, by a component a tool uses, by a future edit that looked
   harmless — **throws in development**, naming the slot, and renders nothing in production. Loud for
   a developer, silent for a reader.

2. **Never on a denied path.** `<AdPlacement>` calls `adsPermittedOn(pathname)` on every render,
   against the live path rather than a page type the caller asserted. A slot that finds itself on
   `/privacy` or on any trust page throws in development and renders nothing in production. The trust
   list is derived from route *suffixes*, so a sixth section's methodology page is ad-free the day it
   is created and not the day someone remembers to add it.

3. **Never adjacent to output, a flag warning, the FAQ or the Sources.** Every placement declares
   what sits immediately above and below it. `assertPlacementMap()` runs at module load and rejects
   any placement naming a forbidden neighbour — `tool-input`, `tool-output`, `flag-warning`, `faq`,
   `sources`, `policy-body`, `consent-surface`. The declaration is a claim about the wiring and
   `wiredIn` names the file where the claim can be checked in one read.

4. **The reserve must hold the creative.** The same assertion rejects a placement that permits a
   creative taller than its own reserved height, because `AdSlot` clips and a clipped call-to-action
   is an unclickable ad.

5. **The disclosure.** The assertion rejects a label that does not contain the word "advertis". Every
   slot is an `<aside>` with that accessible name and a permanently visible label of the same word —
   a landmark a screen-reader user skips in one keystroke.

### The guards, verified rather than asserted

Each enforcement above was tested by deliberately breaking it.

| Test | Result |
|---|---|
| Declare `flag-warning` as a neighbour of `tool-foot` | `next build` **fails**: *Ad placement "tool-foot" declares "flag-warning" as a neighbour. That adjacency is forbidden … Move the slot in src/components/tool/ToolShell.tsx, do not relax the rule.* |
| Wire `<AdPlacement id="index-foot" />` onto `/privacy` | Production build renders **0** slot elements on `/privacy`; `/glossary` still renders its own. The path gate refused it silently, as it must in production, and would have thrown in development. |
| Wire `<AdPlacement id="tool-below-answer" />` **inside** the `/loans` workbench | Production build renders exactly the same **2** slots as the correct build — `ad-tool-below-answer` and `ad-tool-foot`, both outside the tool. The one inside `<ToolBoundary>` rendered nothing, and would have thrown in development naming the slot. |

### The one placement that is computed rather than written

`article-mid` is not placed by hand. `src/lib/ads/article.tsx` reads the article's H2 outline from
its MDX source at build time and wraps the `h2` component so that the **second** heading is preceded
by the slot.

Before the second H2, not after the first, and the distinction is the whole placement. An ad
directly under a heading sits between the heading and the paragraph it introduces, which is the
shape readers describe as *"an ad I had to read past to find the article"*. An ad at a section
boundary sits where a reader has already finished something.

It refuses to place itself at all when the article has fewer than four H2s. Every article here closes
with a `<FAQ>` block; with three sections, "before the second" is one section away from it. Four is
the first count that leaves two full sections between the slot and the closing blocks.

The decision is a string comparison against a value read from the file, so it is idempotent — no
counter, no mutable state, the same slot in the same place on the server and in the browser, which
is also what stops it being a hydration mismatch. If the outline cannot be read, or the heading never
turns up in the rendered tree, nothing renders. A missing ad is a lost impression; an ad in an
unreviewed position is a policy finding.

---

## Consent

Unchanged by this work, and it must stay unchanged.

- **Denied by default.** Silence is not consent, closing the banner is not consent, scrolling is not
  consent. `hasAdConsent()` is false until an explicit accept is recorded.
- **Escape dismisses without recording.** The banner closes, nothing is stored, consent stays denied,
  and it returns on the next visit.
- **Reject is exactly as easy as accept.** Same component, same size, same weight, same colour,
  reject first. No preferences maze, no pre-ticked box, no greyed-out decline, no wall.
- **Withdrawal propagates.** The footer's "Cookie choices" link clears the record. `<ConsentGate>` is
  subscribed rather than read once, so the loader unmounts on the spot — in this tab and in every
  other open one, without a reload.
- **No CMP, no SDK, no dependency.** A consent management platform is a third-party script that reads
  every page load before the reader has agreed to anything.

The loader is behind two independent gates. The switch decides whether an ad network is part of the
product at all; the gate decides whether a particular reader has agreed to it. Neither substitutes
for the other, and `src/lib/ads/AdsRuntime.tsx` is the only place either is mounted.

---

## Proof: CLS is unaffected

Measured on a production build served by `next start`, driven through the Chrome DevTools Protocol,
with a `PerformanceObserver` on `layout-shift` installed before the first byte of the document.
The reported figure is the **sum of every layout shift with `hadRecentInput === false`** over a full
scroll of the page — a strict upper bound on CLS, not a session-window maximum.

Three cases per page, and the third is the one that matters.

| | | **inert** | **creative at the reserved size** | **creative 2.4× taller than reserved** |
|---|---|---:|---:|---:|
| `/` | mobile 390×844 | **0.0000** | **0.0000** | **0.0000** |
| | desktop 1440×900 | **0.0000** | **0.0000** | **0.0000** |
| `/loans` | mobile 390×844 | **0.0000** | **0.0000** | **0.0000** |
| | desktop 1440×900 | **0.0000** | **0.0000** | **0.0000** |
| `/guides/rap-can-cost-more-than-standard` | mobile 390×844 | **0.0000** | **0.0000** | **0.0000** |
| | desktop 1440×900 | **0.0000** | **0.0000** | **0.0000** |

Three consecutive runs of all eighteen cells. Every one 0.0000; not one `layout-shift` entry was recorded
against a slot in any run, at any size.

**The third column is the one that matters**, and a total is not enough to prove it — a shift that
happens below the fold and is never scrolled into view is not recorded. So the document height was
measured directly, before and after the oversized creative arrived:

| Slot | Reserved | Creative injected | Box after | Document height before → after |
|---|---:|---:|---:|---:|
| `ad-tool-below-answer` on `/loans` | 304px | **682px** | 304px | 12271px → **12271px** |
| `ad-tool-foot` on `/loans` | 124px | **250px** | 124px | 12271px → **12271px** |

A creative more than twice the height of its reservation left the box at exactly its reserved height
and the page exactly as long as it was. **The fixed height clips; it does not push.** That is the
whole guarantee, and it is a property of two CSS declarations in `AdSlot` — `height` (not
`min-height`) and `overflow: hidden`. Changing either one is a ranking regression, not a style
preference.

### How the numbers were produced

A production build with `NEXT_PUBLIC_ADS_MODE=reserve`, served by `next start`, driven through the
Chrome DevTools Protocol. The observer is installed with
`Page.addScriptToEvaluateOnNewDocument`, so it is running before the document's first byte and sees
buffered entries. Each page is walked top to bottom in viewport-height steps, so every lazily-mounted
slot enters the viewport and any shift it causes is recorded; the simulated creative is then injected
into each slot **after paint**, which is the only moment CLS cares about, and the page is walked
again.

Two honest caveats. These are simulated creatives, not real ones — a real ad also brings an iframe, a
font and its own paint, and step 5 of the runbook says to re-measure with real inventory. And the
figure reported is the sum of every shift with `hadRecentInput === false`, which is stricter than the
session-window maximum browsers actually report as CLS, so the real number cannot be worse than the
one above.

The one non-zero reading seen anywhere during this work was `0.0008` on the hub at desktop width, in
the **inert** run — the tool cards' and proof row's entrance animation (`RevealGroup`), not a slot. It
did not reproduce across the three final runs and it is unrelated to advertising; it is noted here
because a measurement report that only lists the numbers that flattered the result is not a
measurement report.

### What the wiring costs when it is switched off

Not nothing, and the honest number is **6.4 KB of uncompressed JavaScript per page** (≈2 KB over the
wire) — the `AdSlot` primitive, the slot component and the path denylist, which sit in a shared chunk
because they are client components in the module graph even though `off` mode never renders one.

It was 12.8 KB before the placement registry was moved off the client. `placements.ts` documents every
placement in prose, minification strips comments but not string literals, and the whole map was being
shipped to every reader of every page. `AdPlacement` now resolves a placement on the server and hands
the browser seven values; `paths.ts` holds the only part of the map that has to run there. Getting the
remaining 6.4 KB to zero would need build-time module elimination that neither a static nor a
`next/dynamic` import achieves — both were measured, both give the same figure.

No HTML, no reserved height, no third-party request, and nothing a reader or a reviewer can see. But
it is 6.4 KB, and this document is not going to pretend otherwise.

---

## Proof: nothing loads

A crawl of all 55 sitemap routes plus the six non-indexed ones, against a production build served by
`next start`, with the default configuration (`NEXT_PUBLIC_ADS_MODE` unset):

```
routes crawled                : 55
ad-network <script src> tags  : 0
ad <ins> elements             : 0
pages with a reserved slot    : 0
violations                    : 0
```

And the same crawl against a `reserve` build, which is what the site would look like with the boxes
visible:

```
routes crawled                : 55
ad-network <script src> tags  : 0
ad <ins> elements             : 0
pages with a reserved slot    : 18
violations                    : 0
```

Eighteen pages, matching the registry exactly: five tool pages and the hub, two articles, three
indexes, two county pages, five state contract pages. Zero slots on `/contact`, `/privacy`, `/terms`,
`/loans/privacy` or any of the 24 trust pages.

Greping the build output for `pagead2`, `googlesyndication` and `adsbygoogle`:

| Where | Occurrences |
|---|---:|
| Prerendered HTML, RSC payloads, segment payloads — everything a browser is served | **0** |
| `.next/static` — every client JavaScript chunk | **0** |
| `.next/server/chunks/ssr` — server-only code, never sent to a browser | 1 file |

The one server-side occurrence is the template literal inside the ownership-verification tag in
`src/app/layout.tsx` (see "Two loaders"). It is never rendered, because
`NEXT_PUBLIC_ADSENSE_CLIENT` is unset — which is why no served page contains it — and the chunk it
sits in runs on the server and is never downloaded. Nothing under `src/lib/ads/` contributes to it:
that directory names no ad network at all.

The only match for `adsense` in any served page is the word "AdSense" in `/privacy`'s own prose,
describing what the site plans to do.

---

## Flipping the switch, after approval

Nothing below happens before AdSense approves the site.

### Before you start

1. Confirm the AdSense account is approved and that the property it is approved for is the origin the
   site actually answers on. `public/ads.txt` serves from whatever origin the app is deployed to; if
   the site answers on `www.bracketsight.com` with the account registered to `bracketsight.com`, or
   the reverse, confirm the redirect preserves `/ads.txt`.
2. Confirm `https://<origin>/ads.txt` returns HTTP 200 as `text/plain` with the record
   `google.com, pub-1973018352310576, DIRECT, f08c47fec0942fa0`.

### Step 1 — create the ad units

In the AdSense console, create one **display** unit per placement you intend to fill, at the sizes in
the map above. Note each unit's slot id (the `data-ad-slot` value).

Do **not** create responsive units. The placements reserve fixed heights and clip; a responsive unit
sizes itself from the container and can come back taller than reserved, which turns a wasted pixel
into a cut-off call to action.

### Step 2 — put the unit ids in the registry

In `src/lib/ads/placements.ts`, set `adUnitId` on each placement you created a unit for. A placement
left at `null` throws a legible error when it tries to render, rather than serving a blank box.

```ts
"tool-below-answer": {
  …
  adUnitId: "1234567890",
},
```

### Step 3 — set four environment variables in the **build** environment

`NEXT_PUBLIC_*` values are inlined at build time. Setting them on the running server does nothing.
On Vercel: Project Settings → Environment Variables → Production, then **redeploy**.

```
NEXT_PUBLIC_ADS_MODE=on
NEXT_PUBLIC_AD_CLIENT=ca-pub-1973018352310576
NEXT_PUBLIC_AD_LOADER_SRC=https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js
NEXT_PUBLIC_AD_UNIT_TAG=adsbygoogle
```

`NEXT_PUBLIC_AD_CLIENT`, **not** `NEXT_PUBLIC_ADSENSE_CLIENT`. The second one drives the ungated
verification tag in `src/app/layout.tsx` and is a different decision — see "Two loaders" above. If
that tag is still in the layout when you flip this switch, resolve it first: two AdSense loaders on
one page is an error, and one of them is outside the consent gate.

`NEXT_PUBLIC_AD_LOADER_SRC` is validated at render: https only, no credentials, a `.js` path. A typo
fails loudly rather than putting a script tag pointing somewhere unintended on every page of a
finance site.

`NEXT_PUBLIC_AD_UNIT_TAG` is used as both the ad element's class and the name of the global queue it
pushes onto — in this network they are the same identifier, so they are one variable and cannot
drift apart into a silent no-fill.

Setting the three network variables **without** `NEXT_PUBLIC_ADS_MODE=on` does nothing at all: every
function that reads them refuses to run unless the switch is on.

### Step 4 — stage it

Set `NEXT_PUBLIC_ADS_MODE=reserve` on a preview deployment first and walk the site. You will see
every mapped slot at its exact reserved size, loading nothing. This is the last cheap moment to
decide a placement is in the wrong place.

### Step 5 — verify, in this order

1. **With consent denied** (open the site fresh, press Reject): the network tab shows **no request**
   to the loader origin. Not a blocked one — no request at all.
2. **With consent accepted**: the loader appears exactly once, as `#ad-network-loader`, and the units
   fill.
3. **Withdraw consent** from the footer without reloading: the loader unmounts. Open a second tab and
   confirm the withdrawal propagated.
4. **Re-run the CLS measurement.** The numbers in this document were taken with simulated creatives;
   real ones are the actual test.
5. **Walk the denylist**: `/privacy`, `/terms`, `/contact`, `/loans/privacy`, and one trust page per
   section. Zero `aside[aria-label="Advertisement"]` elements on any of them.

### Rolling back

Unset `NEXT_PUBLIC_ADS_MODE` (or set it to `off`) and redeploy. Every slot returns to rendering no
element at all, and the loader chunk is unreferenced again. There is no second thing to undo.

---

## What must never be done

- **Do not add the loader script before approval.** Not as a constant, not as a commented-out tag
  that someone uncomments, not "just to test the CSP". `ADSENSE-AUDIT.md` P32 is a claim the site is
  making to a reviewer.
- **Do not enable Auto ads.** Not in the console, not with a page-level tag. Auto ads choose their own
  positions by reading the DOM, which means they will place a unit inside a calculator panel, beside a
  `--flag` warning, and on `/privacy` — every rule the placement map exists to enforce, broken by a
  setting in a console this repository cannot see and cannot check. Every unit on this site is an
  explicit element at a position in `placements.ts`.
- **Do not put a slot inside a tool.** `<ToolBoundary>` will throw in development if you try. Do not
  work around it by removing the boundary.
- **Do not put a slot on a policy or trust page.** `adsPermittedOn()` will throw. Do not work around
  it by editing the denylist.
- **Do not change a reserve to `min-height`.** The fixed height plus `overflow: hidden` is the entire
  CLS guarantee, and it is the difference between the third measurement below being 0.00 and being a
  ranking problem.
- **Do not use responsive or auto-format units.** See step 1.
- **Do not put a loader outside `<ConsentGate>`.** There is one in `src/app/layout.tsx` today, for
  verification; see "Two loaders". Nothing else may join it.
- **Do not weaken consent** to raise fill: no pre-ticked accept, no "manage preferences" maze in front
  of reject, no consent wall, no treating a scroll or a dismissal as agreement.
- **Do not drop a disclosure or a trust claim** to make room. Every "nothing stored", "no AI
  arithmetic", "rules cited" and unverified-figure warning on this site is load-bearing.
- **Do not add an ad network dependency.** The entire system is nine files and no packages.

---

## Expected revenue, honestly

**Everything in this section is a range, and every range is an estimate.** No revenue projection can
be made for this site, because the two numbers a projection needs — its traffic and its actual RPM —
do not exist yet. The site is pre-launch, has never served an ad, and carries two published articles.
What follows is arithmetic on industry ranges, so that a decision about effort can be made with the
right order of magnitude in mind. It is not a forecast.

### The ranges

US personal-finance content is among the better-paying display inventory, because the advertisers
bidding against it are lenders, brokerages, insurers and tax software. Published page RPMs for
US-heavy finance sites on AdSense display typically fall somewhere in the **$5–$25 per thousand
pageviews** range, with the low end typical of a young site with little advertiser history and mostly
informational intent, and the high end typical of an established site with commercial-intent traffic
and multiple well-viewed units per page. Sites that move to a managed ad partner (Mediavine, Raptive,
AdThrive) commonly report meaningfully higher session RPMs, but all of them have traffic minimums
this site is nowhere near.

Three things push this particular site toward the **lower** end of that range, and they are all
consequences of decisions taken deliberately:

- **Below-content placements only.** Every slot on this site is after the answer or after the first
  section. Above-the-fold and in-content-early units earn substantially more, and they are exactly the
  units this map forbids. A more aggressive layout would plausibly earn two to three times as much per
  pageview.
- **Few units per page.** One or two, where a typical finance content site runs four to eight.
- **Short dwell on tool pages.** A person who gets their answer and leaves generates one pageview and
  one below-fold impression. Calculator traffic converts to sessions well and to impressions poorly.

Two push the other way: the audience is US, and the intent (student loans, ACA subsidies, tax
deductions, property tax appeals) is squarely in the highest-CPC verticals AdSense serves.

### What that means for traffic

At a page RPM of $8 — a plausible mid-point for this shape of site, and still an estimate — the
arithmetic is:

| Monthly pageviews | Gross at $4 RPM | at $8 RPM | at $16 RPM |
|---:|---:|---:|---:|
| 10,000 | $40 | $80 | $160 |
| 50,000 | $200 | $400 | $800 |
| 250,000 | $1,000 | $2,000 | $4,000 |
| 1,000,000 | $4,000 | $8,000 | $16,000 |

The honest reading: **display advertising on this site is not a business until it is doing six-figure
monthly pageviews**, and at the traffic a 61-page pre-launch site can expect in its first months it
will be a number that does not pay for the hosting. That is not an argument against wiring it — the
work is done, the switch is one variable, and the day it is worth turning on it costs nothing to turn
on. It is an argument against letting revenue pressure move a single placement.

The thing that changes the arithmetic is not a better ad layout. It is the traffic, and the traffic
depends on the content programme and on the E-E-A-T blockers already recorded in
`ADSENSE-AUDIT.md` — a named, credentialed maintainer above all. A site that ranks for
"is my property assessment too high" does not need an aggressive ad layout; a site that does not rank
cannot be saved by one.

---

## Files

```
src/lib/ads/
  config.ts             the switch, and the network configuration
  placements.ts         the placement map; invariants asserted at module load
  AdPlacement.tsx       the only way to render a slot
  article.tsx           how the in-article slot finds its section boundary
  article-outline.ts    server-only: an article's H2 outline, read from source
  network.ts            the adapter — and why it names no ad network
  AdUnit.tsx            the ad element; reached only when the switch is on
  AdNetworkLoader.tsx   the loader; reached only through ConsentGate
  AdsRuntime.tsx        the single mount point, rendered from the root layout
  index.ts              the barrel

src/components/ui/components/AdSlot.tsx   the primitive: fixed height, clips, tool-boundary guard
src/components/layout/ConsentGate.tsx     the only place a consent-gated third party is mounted
src/components/layout/ConsentBanner.tsx   the banner and the footer withdrawal control
```

Wiring points: `src/components/tool/ToolShell.tsx` (the five instruments),
`src/app/guides/[slug]/ArticleView.tsx` and `src/lib/ads/article.tsx` (articles), `src/app/page.tsx`
(the hub), `src/app/guides/page.tsx`, `src/app/glossary/page.tsx`,
`src/app/paycheck/occupations/page.tsx` (indexes),
`src/app/property/counties/[state]/[county]/page.tsx`,
`src/app/trades/contracts/[state]/page.tsx` (reference pages).
