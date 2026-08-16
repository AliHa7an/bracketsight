# Interaction Spec — how these tools earn a six-minute session

Companion to `07-DESIGN-SYSTEM.md`. That file governs how things look; this one governs how they *behave*. Read both before building any screen.

## 1. The principle

A calculator is a vending machine: insert inputs, receive number, leave. An instrument is a piano: touch it and it responds, and the responding is how you learn to play.

All five engines run client-side and synchronously. That single technical fact is the entire engagement strategy — **the answer can update faster than the user can type**, which means the interface can be a live model of their situation rather than a form submission. Everything below follows from spending that latency budget well.

**Engagement is bought with responsiveness, not decoration.** No confetti, no gamification, no scroll theatre, no fake urgency. The visual register stays disciplined per the design system; the aliveness comes from the loop between input and answer.

## 2. The nine mechanics

Applied across all five apps. Each is a shared primitive in `packages/ui`.

### M1 — No gate on the answer
There is no Calculate button anywhere in the portfolio. The answer region renders from the first keystroke, using defaults for unentered fields, and refines as inputs arrive. A `<ConfidenceMeter>` shows input completeness ("4 of 7 details — add your loan types for an exact answer") so incompleteness is communicated without blocking. A partial, caveated answer always beats an empty state.

### M2 — Values tween, so causality is visible
`<LiveNumber>` animates from old value to new over 200ms via `requestAnimationFrame` on the number itself — never a CSS transition on a layout property. Tabular figures guarantee zero layout shift while counting. The user *sees* their change propagate, which is what turns a form into a model. Under `prefers-reduced-motion`, values swap instantly.

### M3 — The marginal probe
The single most engaging mechanic available here. `<MarginalProbe>` is a slider that reports the **derivative**, not the value: "each additional $1,000 of income costs you $340/year" or "each $1,000 into your 401(k) recovers $1,420 of credit." People cannot stop moving this. It also happens to be the most genuinely useful thing on the page, because these are all threshold-and-phase-out systems where the marginal rate is the decision.

### M4 — Scrubbing time
`<ScrubTrack>` makes any timeline draggable. Drag along the 30-year axis and every figure updates to that month: balance, payment, interest waived, cumulative paid. Keyboard: arrow keys step one month, shift+arrow one year, Home/End to the extremes. This converts a static chart into an exploration surface and is where users discover crossover points on their own.

### M5 — Rankings that reorder in front of you
`<RankedRows>` animates position changes with FLIP transforms when the sort key changes. Flipping "lowest monthly payment" → "lowest total cost" and watching the winner physically move is the portfolio's core insight delivered as an interaction rather than a sentence. Rows keep their identity colour through the reorder so the eye can track them.

### M6 — Warnings that live
`<LiveWarnings>` enters and exits as conditions flip. Set a disbursement date past 1 Jul 2026 and the "you're restricted to RAP" warning slides in; change it back and it leaves. Users learn the rules by tripping them safely. Entry is 200ms, never bouncy; exit is immediate (a warning that lingers after it stops applying is a bug, not a flourish).

### M7 — Pinned scenarios
`<ScenarioPins>` lets a user pin the current state, keep editing, and compare pinned versions side by side. Named locally, persisted to `localStorage`, each with a shareable compressed URL. This is what converts one-shot intent into a session and a return visit — and it costs nothing because there's no backend.

### M8 — Copy that reacts
The headline sentence is generated from the computed result, not static: "New IBR costs you $28,404 less than RAP over the life of your loans." It rewrites as inputs change. Deterministic templates only — no LLM in this path, because the numbers must be engine-exact. A page that describes *their* situation in a sentence reads as authored for them.

### M9 — Traces on tap
`<TraceDisclosure>` on every figure: formula, the inputs actually used, rule version, citation link. Curiosity is engagement, and this is also the trust mechanism — the same interaction serves both. Expansion is 200ms, in place, never a modal.

## 3. Input ergonomics

Fields are where a tool feels cheap or expensive.

- **Validate as they type**, not on blur. Show the constraint, not a scolding ("Rate is usually 3–9%" as the field fills, not "Invalid rate" after they leave).
- **Number inputs** in the data face, right-aligned, thousands separators inserted live, arrow keys nudge by a sensible increment (±$1,000 for balances, ±0.125% for rates, ±1 for counts), shift+arrow for 10×.
- **Keyboard-complete flows:** Tab order matches visual order, Enter advances, Escape cancels the current disclosure, no keyboard trap in any drag interaction (M4 and M7 both need full key equivalents).
- **Add-a-row patterns** (loans, comps, line items) focus the new row's first field automatically and support Cmd/Ctrl+Enter to add another.
- **Smart defaults over empty fields.** Every field opens with a plausible value and a "confirm this — it affects your eligibility" marker where accuracy matters. A user who abandons at 60% still leaves with a real answer.
- **Never lose work.** State persists to `localStorage` on every change and restores on return, with the URL as the shareable form.

## 4. The one orchestrated moment

Each app gets exactly one 700ms sequence, fired **only** on first results render — never on subsequent recalculations, where it would become noise. This is the reveal that makes the tool feel considered. Per app:

| App | The moment |
|---|---|
| Repayment Atlas | Plan tracks draw left→right across the 30-year axis, diverging; forgiveness and crossover markers land last |
| ClearPaycheck | Deduction line items settle onto the paystub in sequence, each followed by its tax-saved callout |
| CliffCheck | The credit curve draws, then the marker slides to the household's position — falling off the edge if they're over 400% |
| FairParcel | Comparable parcels resolve onto the map, then the verdict figure counts up |
| JobPaper | Line items materialise on the takeoff sheet as the total climbs |

Skipped entirely under `prefers-reduced-motion`.

## 5. Per-app engagement hooks (three each)

**Repayment Atlas** — scrub the Fork to any month · PSLF toggle that reorders the whole ranking · income-growth slider showing how a residency-to-attending jump changes the winner.

**ClearPaycheck** — overtime-hours stepper with the deduction climbing live · "add a shift" button that shows marginal value per shift · occupation search-as-you-type returning an instant qualified/not-qualified verdict.

**CliffCheck** — drag the income marker toward the 400% cliff and watch the credit fall off the edge (the most visceral interaction in the portfolio) · tappable lever chips (401k, HSA, SEP-IRA) that pull the marker back and show dollars recovered · a mid-year "I got a raise in July" simulator.

**FairParcel** — include/exclude individual comparables and watch the verdict recompute · a real deadline countdown for the user's county · assessed-value slider showing the appeal's break-even point.

**JobPaper** — line items appearing as the job description is typed · drag-to-reorder with the total holding steady · margin slider showing profit at each price point.

## 6. Engagement that survives the session

- **Shareable state:** compressed URL encoding the full scenario. Every result is a link, and links are how these spread between spouses, coworkers, and forum threads.
- **Dynamic OG images** via `next/og` rendering the user's actual computed comparison — a shared link previews their real numbers, which is the highest-converting distribution the portfolio has.
- **One email hook per app**, tied to a genuine date: IDR recertification (Atlas), filing season opening (ClearPaycheck), open enrollment (CliffCheck), the county appeal deadline (FairParcel). Real dates only. No drip sequences, no newsletter.
- **Embeddable widget** with attribution — engagement on someone else's site that links back.

## 7. Interaction review — before any screen is done

1. Does the answer appear before the form is complete?
2. Does every input change visibly move something within one frame?
3. Is there a marginal probe, and does it report a rate rather than a level?
4. Can the user explore — scrub, pin, compare — or only submit?
5. Does the reorder animation fire on sort change and *not* on every recalc?
6. Do warnings leave immediately when they stop applying?
7. Is the recompute measured under 16ms, with no spinner on the primary path?
8. Is every drag interaction fully keyboard-operable?
9. With `prefers-reduced-motion` on, is the tool equally usable and equally informative?
10. Does the headline sentence describe *this* user's result?
11. Is anything here gamification, celebration, or fake urgency? If so, cut it.
12. Would a person plausibly keep touching this for six minutes — and would they send the link to someone?