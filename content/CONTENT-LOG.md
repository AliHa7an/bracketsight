# CONTENT-LOG

The register for the article programme. One row per piece, filled in as it moves.
Empty rows are fine; a row that does not exist is not.

This file is the plan. `content/posts/*.mdx` is the truth — the build reads the
directory, not this table, so a row here with no file is a commitment and a file
here with no row is an accident.

---

## How a row moves

| Status | Means |
|---|---|
| `planned` | Keyword and cluster chosen. Nothing written. |
| `drafting` | Body exists, figures not yet wired through `figures.ts`. |
| `review` | Complete, frontmatter validates, awaiting a named reviewer. |
| `published` | `draft: false`, live at `/guides/<slug>`, reviewer named in frontmatter. |
| `hold` | Blocked. Say why in Notes — usually an open item in `KNOWN-GAPS.md`. |

## Rules the table encodes

1. **One primary keyword per row, and no keyword twice.** Two articles chasing
   the same query cannibalise each other and neither ranks.
2. **Every row names a cluster.** The cluster is what `RelatedArticles`
   resolves on, and an article with a cluster of its own is an article nothing
   links to.
3. **A row is not `published` until `reviewedBy` names a human.** An article may
   ship with `reviewedBy: UNREVIEWED` — it renders a visible "no named reviewer"
   line — but that is a `review` row, not a `published` one.
4. **A figure the engine owns is never typed into the body.** Use
   `<KeyFigure>`, `<FigureTable>` or `figureText()`. See
   `src/lib/content/figures.ts`.
5. **Where a figure carries an open item in `KNOWN-GAPS.md`, the article
   discloses it.** The components do this automatically; the writer's job is to
   write around it honestly rather than assert the number flat.

---

## Pipeline proofs

These two exist to prove the pipeline end to end and are **not** part of the
content programme. Replace or retire them once real articles land; keep at
least one until then, because deleting both removes the only working example of
the figure helper and the pre-filled tool link.

| Article | Slug | Cluster | Tool | Primary keyword | Status | Notes |
|---|---|---|---|---|---|---|
| When RAP costs more than the Standard plan | `rap-can-cost-more-than-standard` | rap-vs-idr | loans | RAP payment cap | review | **Pipeline proof.** Exercises `<KeyFigure>` inline and block, `<FigureTable>` (RAP brackets, generated from the rule file's three parameters), a five-item `<FAQ>` whose answers interpolate `figureText()`, and a `<ToolCTA>` carrying a real pre-filled scenario encoded by the calculator's own `encodeScenario`. `reviewedBy: UNREVIEWED`. |
| The 400% subsidy cliff, and what one dollar costs | `aca-subsidy-cliff-400-percent` | subsidy-cliff | aca | 400% FPL subsidy cliff | review | **Pipeline proof.** Exercises the known-gap disclosure path (the ceiling figure carries GAP-033), two figure tables, and the *honest* CTA path: the ACA planner has no URL state, so the link does not pretend to pre-fill. `reviewedBy: UNREVIEWED`. |

---

## Programme

| Article | Slug | Cluster | Tool | Primary keyword | Intent | Status | Reviewer | Notes |
|---|---|---|---|---|---|---|---|---|
|  |  |  | loans |  |  | planned |  |  |
|  |  |  | loans |  |  | planned |  |  |
|  |  |  | loans |  |  | planned |  |  |
|  |  |  | paycheck |  |  | planned |  |  |
|  |  |  | paycheck |  |  | planned |  |  |
|  |  |  | paycheck |  |  | planned |  |  |
|  |  |  | aca |  |  | planned |  |  |
|  |  |  | aca |  |  | planned |  |  |
|  |  |  | aca |  |  | planned |  |  |
|  |  |  | property |  |  | planned |  |  |
|  |  |  | property |  |  | planned |  |  |
|  |  |  | property |  |  | planned |  |  |
|  |  |  | trades |  |  | planned |  |  |
|  |  |  | trades |  |  | planned |  |  |
|  |  |  | trades |  |  | planned |  |  |

---

## Clusters in use

A cluster is a group of articles about one decision. Add a row when you invent
one, so two writers do not create `rap-vs-idr` and `rap-versus-idr`.

| Cluster | Tool | The decision it serves |
|---|---|---|
| `rap-vs-idr` | loans | Which income-driven plan, given this borrower's income-to-balance ratio. |
| `subsidy-cliff` | aca | Whether this household is about to cross 400% of the poverty line, and what to do about it. |

---

## Glossary coverage

`/glossary` carries 24 entries and is the canonical definition of every term.
An article that needs to define a term links to its anchor —
`/glossary#common-level-range` — rather than defining it again. Two definitions
of one term is how they start to disagree.

Terms currently defined: MAGI · FPL · discretionary income · phase-out · RAP ·
IBR (old) · IBR (new) · PAYE · ICR · SAVE · PSLF · qualified tip occupation ·
FLSA overtime premium · applicable percentage · benchmark plan (SLCSP) ·
cost-sharing reduction · advance premium tax credit · clawback · assessment
ratio · equalization ratio (Director's Ratio) · common level range · home
improvement contract threshold · mechanic's lien · right of rescission.

Add an entry in `src/lib/content/glossary.ts`. Every figure in a definition
comes from `figures.ts`; every entry cites a primary source.
