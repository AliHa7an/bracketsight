# Design System — one system, five identities

Authoritative for every pixel in the monorepo. `packages/ui` implements this; each app supplies token *values* for the same variable *names*. Read this before building any screen.

## 1. The design thesis

All five tools serve the same emotional situation: **an ordinary person facing a high-stakes money decision, under time pressure, in a field full of predatory noise.** The design job is to be visibly the most competent thing on their screen.

That points somewhere specific: **precision as the aesthetic.** Not friendly, not playful, not "fintech fun." The reference points are a well-typeset legal document, an engineering drawing, a ledger — artifacts whose visual language *means* rigor. Density and alignment do the persuading. A page that is perfectly aligned, tightly set, and numerically immaculate reads as trustworthy before a single word is processed.

**Consequence:** the hero is data, not a headline. Every app opens with the live tool — a real input and a real computed number — because the visitor arrived from a search result with a question, and showing them the answer forming is a stronger opening than promising it. Marketing copy goes below the fold or nowhere.

## 2. Banned by name

Reject these on sight, in any app:

**Generic SaaS:** purple-to-blue gradient hero · three floating cards with `rounded-2xl` and `shadow-lg` · Inter as the only typeface · emoji or "✨ AI" iconography · "Get started free" / "Supercharge your…" copy · glassmorphism · animated gradient blobs · a phone mockup floating at an angle · testimonial carousel · logo cloud.

**Generic AI-design:** cream near `#F4F1EA` + high-contrast serif + terracotta near `#D97757` · near-black + one acid-green accent · broadsheet pastiche with hairline rules and zero radius everywhere. These three show up regardless of subject; they are defaults, not decisions.

**Generic dashboard:** shadcn defaults untouched · `rounded-lg` on everything · gray-500 body text on white · a chart library's stock colors · sidebar + breadcrumb + card grid with no reason for any of it.

**Structural decoration:** numbered eyebrows (01/02/03) unless the content is genuinely sequential · dividers that separate nothing · badges that label nothing · icons beside every label · progress bars that don't track progress.

## 3. Shared foundation

### Typography — three roles, no more

```
--font-display : 'Bricolage Grotesque'  variable, 500–700. TITLES ONLY.
--font-body    : 'Public Sans'          400/500/600. All prose and UI chrome.
--font-data     : 'IBM Plex Mono'        400/500. ALL numbers, dates, codes, IDs.
```

Self-hosted via `next/font/local`, preloaded, `display: swap`. Never a Google Fonts CDN link (CWV and privacy).

`Public Sans` is the US Web Design System's own typeface. Using it is a deliberate argument: these tools speak the same visual language as the federal sources they cite. It is also genuinely superb at 13–15px in dense tables. `Bricolage Grotesque` supplies enough personality that the result reads as designed rather than as a government form — but it appears **only** in `h1`/`h2`, never in body, buttons, labels, or tables. Discipline here is most of what separates elegant from busy.

**Type scale** (1.25 ratio, tight — documents, not landing pages):

```
--step--2: 0.694rem  11.1px   micro labels, citations
--step--1: 0.833rem  13.3px   table cells, captions, helper text
--step-0:  1rem      16px     body
--step-1:  1.25rem   20px     lead paragraph, h3
--step-2:  1.563rem  25px     h2
--step-3:  1.953rem  31px     h1
--step-4:  2.441rem  39px     the single hero number
```

Line height: 1.5 body, 1.2 display, 1.35 tables. Measure capped at 68ch for prose. `letter-spacing: -0.011em` on display sizes, `0` on body, `+0.02em` on micro-labels set in caps-lowercase.

### Numbers — the highest-leverage detail in the whole system

Numbers are the product. They get their own rules, and violating them is the fastest way to look amateur:

- Always `--font-data` with `font-variant-numeric: tabular-nums lining-nums`.
- Right-aligned in tables, decimal points aligned across rows.
- Currency: `$1,204` under four figures with cents only when they matter; `$1,204,000` never `$1.2M` in a results table (approximation reads as imprecision here).
- Percentages one decimal max. Dates as `8 Aug 2026`, never `08/08/2026` (ambiguous internationally, and these are US-only products where the reader still benefits from the unambiguous form).
- Negative and forfeited amounts in the flag color, with a minus sign, never parentheses.
- The one hero number per screen at `--step-4`, weight 500, with a `--step--1` label above it in `--text-secondary`. That's the only place a number gets to be large.

### Color — six tokens, semantic only

Each app supplies values for these six names. No app defines a seventh.

```
--paper    page background
--ink      primary text, headings, borders at low alpha
--rule     hairlines, table borders, dividers
--dim      secondary text, labels, captions
--signal   the recommended / winning / positive outcome
--flag     irreversible or high-stakes facts ONLY
```

**The flag law:** `--flag` never decorates. It appears only on facts the user cannot undo or cannot afford to miss. Two flag-colored items on a page must mean two such facts. This is what makes the warnings land — if red is everywhere, red means nothing.

**Elevation:** none. Separation comes from `--rule` hairlines and a single half-step background shift, never from shadows. The only `box-shadow` in the codebase is the focus ring.

**Borders:** `1px solid color-mix(in srgb, var(--ink) 12%, transparent)` as the default hairline. Radius `3px` on everything — controls, cards, inputs. Not 8px, not 12px. Documents don't have bubbles.

### Spacing and density

4px base. `4 8 12 16 24 32 48 64 96`. Two densities, applied deliberately:

- **Reading density** for prose and trust pages: generous, 24–32px between blocks, 68ch measure.
- **Instrument density** for tables, forms, and results: tight, 8–12px cell padding, 32px row height. This is where the "serious tool" feeling lives. Resist the urge to add air here — a dense, perfectly aligned table is the single most credible object you can put on the screen.

### Motion — three durations, one moment

```
--dur-fast:   120ms   hover, focus, toggle
--dur-base:   200ms   panel open, step transition
--dur-signature: 700ms  the one orchestrated moment per app
```

Easing: `cubic-bezier(0.2, 0, 0.13, 1)`. Each app gets **one** signature animation (listed below) and nothing else animates beyond state feedback. No scroll-triggered reveals, no stagger-in on cards, no parallax, no ambient loops. `prefers-reduced-motion: reduce` disables the signature entirely and shortens the rest to 0ms.

### Dark mode

Build tokens dark-ready from day one (every value referenced through variables, never hardcoded), but **ship light-only in v1 and say so.** A half-executed dark mode looks worse than none. Turn it on per app once the light theme is finished and reviewed.

### Accessibility floor — part of the design, not a retrofit

WCAG 2.2 AA. Every token pair contrast-verified (`--dim` on `--paper` must clear 4.5:1 — check it, several plausible values fail). Focus ring: `2px solid var(--signal)` with `2px` offset, never `outline: none`. Touch targets ≥44px. Full keyboard operation of every multi-step flow. Signature visuals ship with a screen-reader table equivalent. Errors announced via `aria-live`. Never color as the sole carrier of meaning — the flag color always pairs with an icon and a word.

## 4. Shared components — `packages/ui`

Built once, themed by tokens, used by all five apps.

**Primitives:** `Button` (primary/secondary/ghost, no third-party ripple), `Input`, `NumberInput` (data face, right-aligned, thousands separators as you type), `Select`, `Radio`, `Checkbox`, `Field` (label + hint + error, one component so errors are always positioned identically), `Stepper`, `Tabs`, `Disclosure`, `Tooltip`, `Dialog`.

**Data display — where the identity actually lives:**

| Component | Behaviour |
|---|---|
| `HeroNumber` | label above, `--step-4` figure, optional delta. One per screen, maximum. |
| `LedgerTable` | hairline rules, tabular figures, right-aligned numerics, `--signal` tint on the winning row, greyed rows carrying an inline reason — never a bare "N/A". |
| `WarningStack` | flag-colored, icon + concrete sentence. Renders nothing when empty (no "no warnings" state). |
| `CalculationTrace` | disclosure: formula, inputs used, rule version, citation link. Attached to every figure. |
| `LastVerified` | date + ruleset version + primary citation. Driven by data, never hand-written. |
| `AnswerBox` | the ≤60-word answer block from the copy playbook. |
| `FactTable` | two-column key/value, mono values. |
| `AdSlot` | reserves height before load, lazy below the fold, renders nothing on failure. CLS 0.00 is a component guarantee, not a hope. |
| `SourceCitation` | inline superscript link + hover detail. |

**States are designed, never default:** every async surface has a real loading state (skeleton matching final layout, no spinners on the primary path — the engines are synchronous and client-side, so results should appear instantly), a designed empty state that invites one action, and an error state naming cause and fix.

## 5. The five identities

Same system, five worlds. Each app's palette derives from its subject's own materials.

### Repayment Atlas — "federal ledger, redrawn"
`--paper #F5F7FA` cool ledger stock (deliberately not warm cream) · `--ink #14213A` document navy · `--rule #C9D4E2` · `--dim #5C6B85` · `--signal #0F6E5C` ledger green, "in the black" · `--flag #B4451F` oxide red.

**Signature — The Fork.** One 30-year horizontal ruled timeline, one track per eligible plan, tracks visibly diverging. Markers: `●` forgiveness, `▲` the crossover where a cheaper monthly payment becomes a costlier total, `✕` in flag for each irreversible decision. Hand-rolled SVG with `d3-scale`, no chart library. On first render the tracks draw left→right over 700ms so divergence is *witnessed*. Hover reveals that month's payment, balance, and interest waived.

### ClearPaycheck — "the annotated paystub"
`--paper #F6F5F2` warm gray · `--ink #1C1B18` charcoal · `--rule #DAD7D0` · `--dim #6B675F` · `--signal #0E6E63` teal · `--flag #9A5B00` amber (nothing here is irreversible; the flag means "money you're about to leave behind").

**Signature — The Paystub.** Results render as a stylised pay statement the audience already knows how to read: gross, then each deduction as an annotated line with a teal "federal tax saved" callout, then a phase-out meter tracking MAGI toward $150k/$300k. Inline, a single bar splits time-and-a-half into "your regular rate" and "the premium — this half is deductible," which teaches the concept people most often get wrong. The one animation: line items settling into the sheet as they're computed.

### CliffCheck — "the clinical margin"
`--paper #F4F7F8` clinical · `--ink #16232B` slate · `--rule #C6D6DC` · `--dim #5A6B73` · `--signal #0A6E8A` deep cyan · `--flag #B4451F` signal red.

**Signature — The Cliff Meter.** A horizontal gauge from 100% to 450% FPL with the household's position marked, and behind it the actual credit curve — which falls off a literal vertical edge at 400%. The 250% cost-sharing boundary shows as a smaller ledge. Distance to the edge stated in dollars of income, not percentages ("you are $3,180 below the cliff"). Levers render as arrows pulling the marker left, each labelled with dollars recovered. Flag red appears only past the edge or when clawback risk is live.

### FairParcel — "the plat book"
`--paper #F7F5F0` parcel cream · `--ink #221D14` umber · `--rule #D8D0C2` · `--dim #6E6553` · `--signal #3D6B35` survey green · `--flag #A83820` stamp red.

**Signature — The Comp Map.** A parcel-style map (static tiles, no heavy map library) with the subject property centered and each comparable as a small parcel card — address, sqft, assessed value, ratio — color-coded by whether it helps or hurts the case. Below it the verdict block, and a real deadline countdown ("Bergen County's deadline: 1 April — 63 days away"). The urgency is genuine, never manufactured.

### JobPaper — "the takeoff sheet"
`--paper #F7F7F5` site white · `--ink #20242A` steel · `--rule #D5D7DA` · `--dim #666B73` · `--signal #155EA8` safety blue · `--flag #C25E10` flag orange.

**Signature — The Takeoff Sheet.** As the contractor describes the job, line items materialise on a ruled takeoff sheet in real time — qty, unit, unit cost, line total in mono columns — with a large sticky running total. Editing any line recalculates instantly. The sheet *is* the estimate *is* the PDF preview: what's built on screen is literally what the client receives. Assumptions appear as small pinned notes on their lines. This is the one app tuned for phone-in-a-truck use: bigger targets, less reading, one-thumb reach.

## 6. Copy is design material

Per `06-seo-copy-playbook.md`, plus:

- Buttons name outcomes: "Compare all 9 plans," not "Submit." The verb persists: "Download memo" → "Memo downloaded."
- Errors state cause and fix, in the interface's voice, never apologising: "This PDF has no readable text layer. Upload a clearer scan, or enter your loans manually →"
- Flag-colored copy is always concrete: "Switching to RAP forfeits your 34 qualifying payments. This cannot be undone." Never "Warning: please review carefully."
- Name things as the user knows them — "your loans," not "loan entities."
- Sentence case everywhere. One qualifier maximum per sentence.

## 7. Design review — a screen isn't done until it passes

Run this on every screen, with a screenshot in front of you:

1. Does the hero show data, or does it promise data?
2. Is there exactly one hero number, one signature element, one bold move?
3. Do all numbers use the data face, tabular, right-aligned, decimals aligned?
4. Is the flag color used only for irreversible or high-stakes facts?
5. Is `--font-display` confined to h1/h2?
6. Zero shadows except the focus ring? Radius 3px throughout?
7. Are tables at instrument density and prose at reading density — not one compromise between them?
8. Do loading, empty, and error states exist and look designed?
9. Is every figure clickable to its trace and citation?
10. Focus visible on every interactive element, keyboard path complete, AA contrast verified?
11. Does it hold at 375px without a horizontal scrollbar?
12. **Remove one thing.** What did you remove?
13. Would this be mistaken for any of the banned looks in §2? If there's any doubt, it fails.