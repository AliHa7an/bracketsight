# Design contract — `src/components/ui/`

Authoritative component APIs for Repayment Atlas. Derived from
`07-DESIGN-SYSTEM.md` (§4 shared components) and the interaction spec (§2 nine
mechanics). **Every component in this file is written to be portable**: it reads
only the six semantic colour tokens and the shared scale, so moving this
directory into another app and swapping the `@theme` block re-themes it whole.

## Rules that bind every component

1. **Six colour tokens only** — `--paper --ink --rule --dim --signal --flag`.
   No component introduces a seventh colour, a gradient, or an opacity ramp
   beyond `color-mix` with `--ink` for hairlines and the two paper shifts.
2. **No shadows.** The focus ring is the only `box-shadow` in the codebase.
   Separation comes from `--hairline` and `--paper-raised`/`--paper-sunken`.
3. **Radius is `var(--radius-atlas)` (3px)** on every control, card, and input.
4. **Every number** renders through `.num` (data face, `tabular-nums
   lining-nums`). In tables also `.num-cell` (right-aligned, nowrap).
5. **Display face (`--font-display`) only in `h1`/`h2`.** Components never set
   it. If a component needs a title, it takes a `heading` prop and renders `h2`.
6. **Motion** uses `var(--dur-fast|base|signature)` and `var(--ease)`. Those
   collapse to `0ms` under `prefers-reduced-motion`, so a component that reads
   them needs no extra media query — but any JS-driven animation must check
   `matchMedia("(prefers-reduced-motion: reduce)")` itself and skip to the end
   state.
7. **Focus** is never removed. Interactive elements are ≥44px on touch.
8. **Colour is never the sole carrier of meaning.** `--flag` always pairs with
   an icon and a word.

## Formatting helpers — `src/lib/format.ts` (already exists, extend it)

```ts
formatCents(c: Cents): string        // "$1,204"  — cents only when non-zero
formatCentsExact(c: Cents): string   // "$1,204.37" — always 2dp, for traces
formatDate(iso: string): string      // "8 Aug 2026" — never 08/08/2026
formatPct(n: number): string         // one decimal max: "5.0%"
formatMonths(n: number): string      // "12 yrs 4 mos"
```

Currency never abbreviates in a results table: `$1,204,000`, never `$1.2M` —
approximation reads as imprecision here.

---

## Group A — primitives

```tsx
// Button — three variants, no ripple, no icon-only without aria-label.
// Labels name their outcome ("Compare all 9 plans"), never "Submit".
<Button variant="primary" | "secondary" | "ghost"
        size="md" | "sm"            // md = 44px tall, sm = 36px (desktop-only rows)
        type="button" | "submit"
        disabled?: boolean
        onClick?: () => void>

// Field — the ONLY way a label/hint/error is rendered, so error position is
// identical everywhere. Wraps any control via children.
<Field label="Loan balance"
       hint?="Your current payoff amount"     // shown while empty/valid
       error?="Balance must be under $1,000,000"  // replaces hint, aria-live="polite"
       required?: boolean
       htmlFor: string>

// Input — text. NumberInput — the important one:
//   • data face, right-aligned, thousands separators inserted live
//   • arrow keys nudge by `step`, shift+arrow by `step * 10`
//   • validates AS THE USER TYPES, showing the constraint not a scolding
<NumberInput id: string
             value: number              // in the unit given by `unit`
             onChange: (n: number) => void
             unit="cents" | "bps" | "count" | "pct" | "year"
             step?: number               // default per unit: 100000 cents ($1,000),
                                         //   25 bps (0.25pp), 10 pct (1.0pp), 1 count, 1 year
                                         // NB: interaction.md asks for ±0.125% on rates, which is
                                         // 12.5 bps — not representable in the engine's integer-bps
                                         // encoding. A quarter point is the nearest honest increment.
             min?: number  max?: number
             placeholder?: string
             constraintHint?: string />  // "Rate is usually 3–9%"

<Select id value onChange options={[{value,label}]} />
<RadioGroup name value onChange options={[{value,label,hint?}]} orientation="horizontal"|"vertical" />
<Checkbox id checked onChange label />

// Stepper — the ① ② ③ flow header. Steps are clickable once visited.
<Stepper steps={[{id,label}]} current: string onNavigate: (id) => void />

<Tabs tabs={[{id,label}]} current onChange />          // roving tabindex
<Disclosure summary: ReactNode defaultOpen?: boolean>  // 200ms, in place, NEVER a modal
<Tooltip content: string>                              // hover + focus, Escape closes
<Dialog open onClose title>                            // focus trap, Escape closes
```

---

## Group B — interaction mechanics (the nine)

```tsx
// M1 — no gate on the answer. Shows input completeness; never blocks.
<ConfidenceMeter filled: number total: number
                 missingLabel?: string />  // "add your loan types for an exact answer"

// M2 — values tween so causality is visible. rAF on the NUMBER ITSELF,
// never a CSS transition on a layout property. Tabular figures ⇒ zero CLS.
// Under reduced motion, swaps instantly.
<LiveNumber value: number
            format: (n: number) => string
            durationMs?: number          // default var(--dur-base) = 200
            className?: string />

// M3 — the marginal probe. Reports the DERIVATIVE, not the level.
// "each additional $1,000 of income costs you $340/year"
<MarginalProbe label: string
               value: number
               onChange: (n: number) => void
               min max step
               unit: "cents"
               derive: (v: number) => { delta: number; per: string }
               format: (n: number) => string />

// M4 — scrubbing time. Drag the axis; every figure updates to that month.
// Keyboard: ←/→ one month, shift one year, Home/End extremes. No key trap.
<ScrubTrack months: number
            value: number
            onChange: (month: number) => void
            renderTick?: (month: number) => ReactNode
            label: string />

// M5 — rankings that reorder in front of you. FLIP transforms on sort change.
// Fires ONLY when the sort key changes, never on every recalc.
<RankedRows items={[{id, ...}]} sortKey: string
            renderRow: (item, index) => ReactNode />

// M6 — warnings that live. Enter 200ms (never bouncy); exit IMMEDIATE.
<LiveWarnings warnings={[{id, severity: "irreversible"|"caution", title, body}]} />

// M7 — pinned scenarios. localStorage, each with a shareable compressed URL.
<ScenarioPins pins={[{id,name,summary,url}]}
              onPin: () => void  onRemove: (id) => void  onRestore: (id) => void />

// M9 — traces on tap. Formula, inputs used, rule version, citation. In place.
<TraceDisclosure formula: string
                 inputs={[{label, value}]}
                 ruleVersion: string
                 citation={{label,url,lastVerified}} />
```

M8 (reactive copy) is not a component — it is a **deterministic template
function** in `src/lib/verdict-copy.ts`. No LLM in this path; the numbers must
be engine-exact.

---

## Group C — data display (where the identity lives)

```tsx
// One per screen, maximum. --step-4, weight 500, micro-label above.
<HeroNumber label: string value: number format delta?: {value, label} />

// Hairline rules, tabular right-aligned numerics, --signal tint on the winner,
// greyed rows carrying an INLINE REASON — never a bare "N/A".
<LedgerTable columns={[{id,label,align:"left"|"right",numeric?:boolean}]}
             rows={[{id, cells, winner?: boolean,
                     disabled?: boolean, disabledReason?: string,
                     trace?: ReactNode}]}
             caption: string />

// Renders NOTHING when empty. No "no warnings" state.
<WarningStack warnings={[{id,severity,title,body}]} />

<LastVerified date: string ruleSetVersion: string citation={{label,url}} />
<AnswerBox>          {/* ≤60 words, one concrete number, self-contained */}
<FactTable rows={[{key, value}]} />        {/* two-column, mono values */}
<SourceCitation index: number label url lastVerified />   {/* inline superscript */}
<AdSlot height: number id: string />       {/* reserves height BEFORE load; CLS 0.00 is a guarantee */}
```

## States are designed, never default

Every async or data-dependent surface ships three real states:

- **Loading** — skeleton matching the final layout exactly. No spinners on the
  primary path: the engine is synchronous and client-side, so results appear
  within a frame.
- **Empty** — invites exactly one action. No illustration.
- **Error** — names cause and fix, never apologises.

## Review gate — a component isn't done until

Display face confined to h1/h2 · every number in `.num` · zero shadows except
focus · radius 3px · flag colour only on irreversible/high-stakes facts, always
with icon + word · keyboard complete · AA contrast · holds at 375px with no
horizontal scrollbar.
