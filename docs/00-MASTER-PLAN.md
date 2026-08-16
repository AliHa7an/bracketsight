# Master Plan — The Decision Engine Portfolio

**Version 2.0 · Research dated 8 Aug 2026 · 5 tools, 1 shared architecture**

This package contains everything Claude Code needs to build five tools. Read this file first, then `CLAUDE.md`, then the tool spec for whatever you're building.

## The files

| File | What it is |
|---|---|
| `CLAUDE.md` | Repo-root invariants. Claude Code auto-loads it every session. Never violate it. |
| `00-MASTER-PLAN.md` | This file — portfolio strategy, shared architecture, build sequence |
| `01-repayment-atlas.md` | Tool 1: Federal Student Loan Decision Engine — **build first** |
| `02-obbba-deduction-engine.md` | Tool 2: Tips/Overtime/OBBBA Deduction Engine — fast-follow |
| `03-aca-cliff-planner.md` | Tool 3: ACA Subsidy Cliff Planner |
| `04-property-tax-appeal.md` | Tool 4: Property Tax Assessment Appeal Toolkit |
| `05-trades-document-engine.md` | Tool 5: Trades Estimate → Invoice → Contract Engine |
| `06-seo-copy-playbook.md` | How every page, title, and paragraph is written. Applies to all five tools |

## The thesis, in five sentences

Informational content is being gutted by AI Overviews (present on ~48% of queries, −61% organic CTR where they appear), but **tool intent survives** — an AI summary cannot compute your personal answer. Finance and insurance are the highest-RPM ad verticals ($25–60 Tier-1). Federal policy shocks (a rule changes, millions must decide, incumbent content goes stale) create recurring windows where a fresh, rigorous tool beats aged authority. A **decision engine** — ranked recommendation, cited rules, irreversibility warnings — earns sessions, links, and premium revenue that a mere calculator cannot. Build the architecture once; ship it five times.

## The build sequence — and why this order

| # | Tool | Ship target | Window driver | Reuse from #1 |
|---|---|---|---|---|
| 1 | **Repayment Atlas** (student loans) | **Mid-Sept 2026** | SAVE 90-day deadlines expire this autumn; will not repeat | — |
| 2 | **OBBBA Deduction Engine** | Dec 2026 | Jan–Apr 2027 filing season; first year with dedicated W-2 boxes | ~70% |
| 3 | **ACA Cliff Planner** | Sept 2027 | Nov 2027 open enrollment; cliff is live unless Congress acts | ~65% |
| 4 | **Property Tax Appeal** | Rolling, county-by-county from month 9 | Perennial; assessment-notice seasons vary by county | ~55% |
| 5 | **Trades Document Engine** | Opportunistic / month 12+ | Evergreen | ~50% |

Tools 1–3 share the same statute (P.L. 119-21 touches all three), the same core variable (AGI/MAGI), and the same audience overlap. **The long-term company is the MAGI decision engine:** a $5,000 401(k) contribution simultaneously lowers a RAP student loan payment, recovers an ACA subsidy, and preserves an OBBBA phase-out. No competitor models the interaction. Design the shared engine so household income flows through all three rule sets.

## Shared architecture — build once

Every tool is the same machine with different rules:

```
┌────────────────────────────────────────────────────────────┐
│  packages/engine-core/        shared: money.ts (integer    │
│                               cents), rules loader,        │
│                               versioning, citation types   │
│  packages/engine-loans/       tool 1 rules + plans         │
│  packages/engine-obbba/       tool 2 deductions            │
│  packages/engine-aca/         tool 3 PTC + FPL             │
│  packages/engine-proptax/     tool 4 comp analysis         │
│  packages/engine-trades/      tool 5 pricing + documents   │
│                                                            │
│  Every engine: pure TS, zero deps, zero AI, zero network.  │
│  Rules in versioned JSON with effectiveFrom + citations[]. │
├────────────────────────────────────────────────────────────┤
│  lib/ai/          shared ingestion (PDF→structured),       │
│                   explanation (validated numerics),        │
│                   provider abstraction                      │
│  lib/seo/         metadata, JSON-LD, internal links,       │
│                   publish gates                             │
│  components/      design system (see below), AnswerBox,    │
│                   FactTable, AdSlot, CalculationTrace       │
└────────────────────────────────────────────────────────────┘
```

**Stack (all five tools):** Next.js 16.3 App Router (pinned) · TypeScript strict + `noUncheckedIndexedAccess` · Tailwind v4 · shadcn/ui · react-hook-form + Zod · Vitest + Playwright · Vercel AI SDK v5 · Upstash rate limiting · Vercel hosting. No database, no auth in any tool's v1.

**Domain strategy:** each tool gets its own domain and brand (YMYL topical authority concentrates better than a generic "tools site"), but they cross-link as an editorial network with shared `/methodology` standards and — eventually — a shared About identity.

## The AI doctrine (identical across all five)

> **AI reads and explains. Deterministic code decides.**

AI is permitted for exactly three jobs: (1) document ingestion → structured data, always behind a non-skippable human review screen; (2) explaining engine output in plain language, with every numeric validated against the engine JSON and a fail-closed template fallback; (3) internal regulatory diffing that opens PRs for human approval. AI never computes money, eligibility, or recommendations. This is enforced by CI grep on every `packages/engine-*` directory.

**Model routing (verify prices at build time; last verified 8 Aug 2026):**

| Job | Primary | Fallback/escalation |
|---|---|---|
| Text extraction | GPT-5.6 Luna ($0.20/$1.20 per M) | Gemini 3.5 Flash-Lite |
| Vision extraction (scans) | Gemini 3.5 Flash-Lite ($0.30/$2.50) | Claude Haiku 4.5 |
| User-facing explanation | Claude Haiku 4.5 ($1/$5) | Claude Sonnet 5 (complex cases only) |
| Regulatory diff (internal) | Claude Sonnet 5 or Gemini 3.1 Pro | — |

Do not build on Gemini 2.5 Flash-Lite (retires 16 Oct 2026). All model IDs in env vars behind `lib/ai/client.ts`. Rate limits on every AI route: 5 uploads/hr/IP, 20 explanations/hr/IP, hard monthly spend cap with auto-degrade to manual entry.

AI cost is not a risk: ~$0.002/extraction, ~$0.005/explanation ⇒ under 10% of conservative ad revenue at every scale. Abuse is the risk; the rate limits are the control.

## The design system — one family, five identities

All five tools share tokens, spacing, and component behaviour; each gets its own accent pair and signature element so it reads as its own product. Full direction per tool in each spec; the shared foundation:

```css
/* Shared foundation — every tool */
--font-display: 'Bricolage Grotesque';   /* page titles only */
--font-body:    'Public Sans';           /* USWDS's own face — a credibility signal */
--font-data:    'IBM Plex Mono';         /* EVERY number, tabular-nums, no exceptions */
--radius: 3px;                            /* documents, not bubbles */
```

| Tool | Paper | Ink | Signal | Flag | Signature element |
|---|---|---|---|---|---|
| 1 Loans | cool ledger `#F5F7FA` | navy `#14213A` | ledger green `#0F6E5C` | oxide `#B4451F` | **The Fork** — 30-yr divergence timeline |
| 2 OBBBA | warm gray `#F6F5F2` | charcoal `#1C1B18` | teal `#0E6E63` | amber `#9A5B00` | **The Paystub** — your W-2, annotated live |
| 3 ACA | clinical `#F4F7F8` | slate `#16232B` | deep cyan `#0A6E8A` | signal red `#B4451F` | **The Cliff Meter** — distance-to-400% gauge |
| 4 PropTax | parcel cream `#F7F5F0` | umber `#221D14` | survey green `#3D6B35` | stamp red `#A83820` | **The Comp Map** — your parcel vs. comparables |
| 5 Trades | site white `#F7F7F5` | steel `#20242A` | safety blue `#155EA8` | flag orange `#C25E10` | **The Takeoff Sheet** — line items building live |

**Non-negotiables in every tool:** WCAG 2.2 AA, CLS 0.00 (ads reserve height), LCP <1.8s mobile, the flag colour reserved exclusively for irreversible/high-stakes warnings, every computed number traceable to its rule and citation, errors direct never apologetic.

## Monetization ladder (same shape, all tools)

1. **AdSense** — the floor, never the plan. Apply only after 30+ substantial pages. Below-results and mid-article slots only; never above or inside the tool; Auto Ads off; block predatory categories even though they bid highest.
2. **$19 premium PDF** — the decision memo / appeal packet / branded document. Marginal cost <$0.02. One-time, not subscription: these needs are episodic.
3. **Ethically-gated affiliate** — refinance (tool 1), tax prep (tool 2), insurance enrollment (tool 3), appeal services (tool 4), field-service SaaS (tool 5). Shown only when the engine determines it genuinely serves the user; forfeitures disclosed at equal visual weight; never influences recommendations.
4. **White-label licensing** ($200–2,000/mo) — universities, employers, credit unions, brokerages, trade associations. Algorithm-independent revenue; the reason every engine is a clean portable package.

## E-E-A-T infrastructure (per tool, non-optional, phase-one)

Named credentialed reviewer (CSLP/attorney for tool 1, EA/CPA for tools 2–3, property tax consultant for 4, construction attorney for 5) · `/methodology` with every formula · `/sources` with last-verified dates · `/editorial-policy` with corrections process and funding disclosure · `/changelog` — dated, cited, diffed. **If a credentialed reviewer cannot be secured for a tool, do not launch that tool.** In YMYL, this is the ranking gate.

## Verify before building anything

1. Real keyword volumes (Ahrefs/Semrush) for each tool's cluster — every volume in these specs is a modelled estimate.
2. The controlling formula from its primary source (each spec cites it) — never encode from a blog.
3. Current model pricing and the reviewer's availability.
4. Domain availability for each brand.
5. Legislative watch-items: a bill restoring enhanced ACA credits passed the House Jan 2026 (weakens tool 3's cliff angle if enacted); OBBBA deductions sunset after 2028 (tool 2's ceiling); PAYE/ICR sunset 1 Jul 2028 (tool 1 content wave).
