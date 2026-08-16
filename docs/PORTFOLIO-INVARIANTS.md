# CLAUDE.md — The Decision Engine Portfolio

Repo-root file; Claude Code loads it every session. These invariants apply to **all five tools**. The full briefs: `00-MASTER-PLAN.md` (read first), then `01`–`05` per tool, `06-seo-copy-playbook.md` for every word of page content, and `07-DESIGN-SYSTEM.md` for every pixel. `BUILD-PROMPT.md` is the session-starting prompt.

## What we build

Decision engines, not calculators. A calculator returns a number; a decision engine returns a **ranked, cited, dated recommendation with the irreversible or high-stakes choices flagged**. If a change makes a tool more like a single-answer widget, it's the wrong change.

Current portfolio, in build order:
1. **Repayment Atlas** — student loan plan decision engine (ship mid-Sept 2026)
2. **ClearPaycheck** — OBBBA tips/overtime deduction engine (ship Dec 2026)
3. **CliffCheck** — ACA subsidy cliff planner
4. **FairParcel** — property tax appeal toolkit
5. **JobPaper** — trades estimate/invoice/contract engine

## The eight invariants — breaking any one is a build-breaking bug

1. **No AI in any calculation path, ever.** Every `packages/engine-*` has zero AI imports, zero network calls, zero dependencies. All money math is deterministic and unit-tested. CI greps for violations. If you want an LLM to compute, estimate, or sanity-check a number — stop; that's this invariant firing correctly.
2. **Money is integer cents** (`Cents = number`, always integer). Rates in basis points. Rounding rules live in `engine-core/money.ts` and are documented. No floats for currency, anywhere.
3. **Rules live in versioned, cited JSON.** No rate, threshold, bracket, clause, or deadline hard-coded in `.ts`. Every rules file: `effectiveFrom`, `effectiveTo`, `citations[]` with URL + `lastVerified`. Rules are encoded **from primary sources only** (regulation, statute, IRS guidance, county authority) — never from a blog.
4. **AI extraction always lands on a non-skippable human review screen** — any confidence level, no "looks right, skip" path, in every tool.
5. **AI-generated text never contains unvalidated numbers.** `lib/ai/validate-numerics.ts` asserts every numeric/date in an LLM output exists in the engine JSON it was given. On mismatch: fail closed, render the deterministic template.
6. **Uploaded documents are never persisted.** In-memory processing only; no disk, no object storage, no content logging. The privacy promise is a stated product feature in every tool.
7. **CLS stays 0.00.** Every ad slot reserves height; images have dimensions; fonts self-hosted + preloaded. An ad-induced reflow costs more in rankings than the slot earns.
8. **No credentialed reviewer, no launch.** Every tool ships with a named domain-credentialed reviewer (CSLP/attorney, EA/CPA, property-tax consultant, construction attorney) and full trust pages (`/methodology`, `/sources`, `/editorial-policy`, `/changelog`, `/about`). This is YMYL — the trust layer is phase-one work.

## Shared stack — do not substitute without asking

Next.js 16.3 App Router (pinned exact; patch security advisories promptly) · TypeScript strict + `noUncheckedIndexedAccess` · Tailwind v4 + token CSS · shadcn/ui · react-hook-form + Zod (one schema shared by client, API, and AI structured output) · Vitest + Playwright · Vercel AI SDK v5 behind `lib/ai/client.ts` with model IDs in env · `unpdf` before any vision call · `@upstash/ratelimit` on every AI route (5 uploads/hr/IP, 20 explanations/hr/IP, hard monthly spend cap with auto-degrade) · hand-rolled SVG + `d3-scale` for signature visuals — no charting libraries.

**No database, no auth, no signup wall in any tool's v1.** localStorage + compressed URL state. Introduce Neon + Drizzle only when a retention feature genuinely needs accounts.

## The four publish gates — every programmatic page, enforced at build time

1. Contains ≥1 engine-computed number appearing on no other page.
2. Contains ≥1 non-obvious insight (crossover, interaction, trap) underivable from parent pages.
3. Reachable from ≥2 other pages; zero orphans (CI check).
4. ≥800 words of page-specific substance, excluding boilerplate.

Never generate mass scenario/doorway pages. All page copy follows `06-seo-copy-playbook.md`: AnswerBox ≤60 words with a concrete number, LastVerified driven by ruleset version, one FactTable, H2s as real questions, in-line primary citations, ≥3 contextual internal links.

## Design system — `07-DESIGN-SYSTEM.md` is authoritative

`packages/ui` implements it once; each app supplies values for the same six token names (`--paper --ink --rule --dim --signal --flag`) and gets one signature element. No app defines a seventh color.

Load-bearing rules: `Bricolage Grotesque` in h1/h2 **only** · `Public Sans` body · `IBM Plex Mono` + `tabular-nums` for **every** number, right-aligned with decimals aligned · radius 3px everywhere · **zero shadows except the focus ring** · two densities (instrument for tables, reading for prose) · one signature animation per app at 700ms, nothing else animates · light-only in v1, tokens dark-ready.

**The flag law:** the flag color marks only irreversible or high-stakes facts. Two flag-colored items on a page must mean two such facts.

Every computed figure is clickable → calculation trace → rule → citation. Loading, empty, and error states are designed, never default.

**Banned looks** (§2 of the design system): SaaS gradient hero with floating shadowed cards; cream + serif + terracotta; near-black + acid green; broadsheet pastiche; untouched shadcn defaults. Run the 13-point design review in §7 before calling any screen done.

Copy law: errors state cause and fix, never apologise; buttons name their outcome and keep the verb through the flow; empty states invite one action.

## Definition of done — every PR

- [ ] `typecheck` + `lint` clean; new logic has tests; golden cases re-verified if engine touched
- [ ] Engine dirs still AI-free (CI grep green)
- [ ] UI changes: keyboard-navigable, AA contrast, CLS unchanged
- [ ] AI-adjacent changes: rate-limited, size-capped, output validated, fails closed
- [ ] Rules changes: citation present, `lastVerified` updated, `/changelog` entry drafted
- [ ] No secrets, no `NEXT_PUBLIC_` keys, no new dependency without stated reason

## When unsure

Correctness beats features · cite or don't ship · deterministic beats clever · **ask rather than assume on anything regulatory** — a guessed rule in these domains has real-world cost to real people.