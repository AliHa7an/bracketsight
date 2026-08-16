# VERIFICATION-STATUS — primary-source audit of every rules-file constant

**Audit date: 15 August 2026.** Auditor: automated research pass against primary
sources only. Every row below either carries a URL that was actually fetched and
whose content was read, or the word `UNRESOLVED`.

**Governing rule of this audit:** no figure was inferred, estimated, or recalled.
Where a primary source could not be reached, the row says `UNRESOLVED` rather
than guessing. **No numeric value in any rules file was changed by this pass** —
this document is the review artifact; value changes are a separate, user-approved
step.

---

## Remediation log — Batch A, 15 August 2026

The user-approved first remediation batch has been applied. Rows below are
annotated **FIXED** (with what changed) or left as they were; nothing was
deleted. Batch A covered four items and deliberately excluded four others.

| # | Item | Status after Batch A |
|---|---|---|
| 1 | Repealed repayment cap (`repayment-limits.2026.json` + `clawback.ts`) | **FIXED** — `limitation.inEffect: false`, `limitation.bands: []`, full clawback at every income; wrong Rev. Proc. 2025-25 citation removed and replaced with Pub. L. 119-21 §71305, Rev. Proc. 2025-32 §2.04 and the post-OBBBA §36B text. The old bands are retained as `_repealedStructure` (provenance only, not read by the engine) so a reinstatement has a shape to copy. `clawback.ts` now throws when a ruleset declares a limitation in effect but encodes no bands. |
| 2 | 400% cliff edge off by up to ~1% of FPL (`fpl.ts`) | **FIXED** — `fplPercentForm8962` now applies Worksheet 2's "more than 4.0 × FPL" test *before* truncation and returns the 401 sentinel; `magiAtPctEdge` returns exactly 4.0 × FPL at the ceiling and keeps the truncation formula for interior boundaries. New `cliffEdgeMagi` and `eligibilityCeilingPct` helpers; the multiple (40000 bps) and sentinel (401) live in `applicable-percentage.2026.json → eligibilityCeiling`, not in code. The comment at `fpl.ts:43` that asserted "400.9% is still 400" is gone. |
| 3a | Hawaii additional person $6,325 → $6,330 | **FIXED** — `fpl.2025.json` now holds `633000`; the bot-blocked `federalregister.gov` placeholder citation was replaced with the govinfo PDF for FR Doc. 2025-01377. |
| 3b | Traditional IRA single phase-out $79k–$89k → $81k–$91k | **FIXED** — `contribution-limits.2026.json` now holds `8100000`/`9100000`, cited to IRS Notice 2025-67. |
| 4a | SECURE 2.0 age 60–63 catch-up ($11,250) | **STILL UNRESOLVED** — not modelled; explicitly out of scope for Batch A. |
| 4b | Invented SLCSP county premiums | **STILL UNRESOLVED** — sample data; the CMS PUF ingest below is the fix. |
| 4c | 2026 Form 8962 and instructions | **STILL UNRESOLVED** — unpublished until ~Jan 2027. The Worksheet 2 order implemented in item 2 comes from the 2025 and 2020 editions, which agree word-for-word across the ARPA boundary. |
| 4d | State-specific age rating curves | **STILL UNRESOLVED** — CMS's list is stamped Dec 2021 and no newer version exists. |

Also touched, because they restated a corrected rule to users in their own
words: `src/app/page.tsx` (FAQ answer, fact table, the pay-back section and its
citation), `src/app/methodology/page.tsx` (the pseudocode block, the truncation
paragraph, the reconciliation paragraph), `src/components/ResultsPanel.tsx`
(both clawback warnings), `src/components/CliffMeter.tsx` (the screen-reader
table said Form 8962 "truncates to" a percentage that is now a sentinel), and
`src/lib/cliff-meter.ts` (the `CLIFF_PCT` comment).

Engine test count went from **56 to 67**: eleven tests added, ten existing
expectations re-derived by hand (each carries an in-test comment with the
arithmetic and the authority — OBBBA §71305 or Form 8962 Worksheet 2 — rather
than a snapshot of whatever the engine now prints), and four tests re-commented
without changing their numbers. Not touched: `fpl.2025.json`'s other five values
(the file is correct by design — 2026 coverage uses the 2025 guidelines).

---

## Summary

| Outcome | Rows | Individual constants covered |
|---|---|---|
| **Verified correct** (value in file matches a primary source I fetched) | 41 | ~150 |
| **Correction identified** (primary source disagrees with the file) | 5 | 5 |
| **Structurally obsolete** (the rule itself is repealed, or the model is wrong — not just a number) | 2 | 3 bands + 1 function |
| **Unresolved** (no primary source available) | 2 | 2 |
| **Not verifiable by design** (declared sample data) | 6 | 6 |

Every dated 2026 figure in the engine now has a primary source behind it. The
placeholder values turned out to be right far more often than the build-time notes
feared — the applicable-percentage table is exact, and nine of eleven contribution
limits are exact. The failures are concentrated and specific.

### The three findings that matter most

1. **`repayment-limits.2026.json` is obsolete, not merely mis-valued.** — **FIXED 2026-08-15 (Batch A).**
   OBBBA (Pub. L. 119-21) § 71305 **struck IRC § 36B(f)(2)(B) outright**, effective
   for taxable years beginning after 31 Dec 2025. For 2026 there is **no repayment
   limitation at any income level** — full clawback of excess APTC applies to
   *every* filer, not only those at or above 400% FPL. The whole `bands` array
   should be removed (or reduced to an explicit "no limitation" marker), and the
   `note`'s premise that caps apply below 400% is wrong for the target year.
   Verified twice: statute text on govinfo, and Rev. Proc. 2025-32 § 2.04, which
   removes the § 36B(f)(2)(B) inflation adjustment for exactly this reason.

2. **The 400% cliff edge is off by up to ~1% of FPL** (engine code, not a rules file). — **FIXED 2026-08-15 (Batch A).**
   `packages/engine/src/fpl.ts:43` states "400.9% is still 400" and
   `fplPercentForm8962` implements a bare `Math.floor`. Form 8962 **Worksheet 2**
   does not work that way: step 4 first asks whether household income is **more
   than 4.0 × FPL**; if yes you enter **401** (ineligible) and never reach the
   truncation step. Truncation applies only in the "No" branch. So the cliff is
   exact at income > 4.0 × FPL, and there is no sub-1% grace band above 400%.
   `magiAtPctEdge(fpl, 400)` therefore overstates the last eligible MAGI by up to
   ~1% of the poverty line (≈ $321 for a family of four in the lower 48) — and at
   the cliff that difference is worth thousands of dollars of credit. This is a
   real-money error in the product's central number.

3. **Hawaii's additional-person guideline is $5 low.** File holds $6,325; the
   Federal Register notice says **$6,330**. — **FIXED 2026-08-15 (Batch A):**
   `fpl.2025.json` now holds `633000`.

---

## Coverage year vs. guideline year — conclusion

**The engine targets 2026 coverage / 2026 tax year.** Every dated rules file is
`effectiveFrom 2026-01-01`, `effectiveTo 2026-12-31`, and `fpl.ts:4` states the
mapping in its own header comment.

**`fpl.2025.json` is CORRECT by design and must NOT be "upgraded" to the 2026
guidelines.** ACA premium-tax-credit eligibility for a coverage year uses the
poverty guidelines in effect at the start of that year's open-enrollment period —
i.e. the guidelines published in the **prior** calendar year:

| Coverage / tax year | HHS guideline year to use | Published |
|---|---|---|
| 2025 | 2024 guidelines | Jan 2024 |
| **2026 (this engine)** | **2025 guidelines** | **17 Jan 2025, 90 FR 5917** |
| 2027 | 2026 guidelines | 15 Jan 2026 |

Concretely: the 2026 guidelines the user already confirmed on ASPE (contiguous 48
= $15,960 + $5,680; Alaska $19,950 + $7,100; Hawaii $18,360 + $6,530) are the
**2027** coverage-year numbers. They belong in a future `fpl.2026.json` used by a
2027 ruleset — putting them in the 2026 engine would inflate every poverty line by
~2%, shift the cliff by ~$620 for a single filer, and produce systematically wrong
credit amounts. The file name is right; only three of its six numbers needed
checking, and only one was wrong (Hawaii's increment).

Cross-check that the 2025 guidelines are the right ones: the Federal Register
notice at 90 FR 5917 gives contiguous-48 one person = $15,650, which is what the
file holds — and the file's `effectiveFrom` of `2025-01-15` matches the notice's
stated `DATES: January 15, 2025`.

---

## `packages/engine/src/rules/applicable-percentage.2026.json`

**Controlling source found and fetched: Rev. Proc. 2025-25** (the file's own
citation was correct; it was simply never verified). Fetched
`https://www.irs.gov/pub/irs-drop/rp-25-25.pdf` on 15 Aug 2026 and read § 3.01
verbatim.

The table published by the IRS is **character-for-character what the file already
holds.** The "placeholder shaped like the pre-2021 law with indexing drift"
described in VERIFICATION-NEEDED.md happens to be exactly right — every band, every
basis point.

| Figure | Current value | File:line | Correct value | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Band 1 (`< 133%`) initial/final | 210 / 210 bps | `applicable-percentage.2026.json:26` | **210 / 210 bps** ✅ | https://www.irs.gov/pub/irs-drop/rp-25-25.pdf | 2026-08-15 | Rev. Proc. 2025-25 § 3.01: "Less than 133% — 2.10% / 2.10%". File encodes `fromPct: 100`; the Rev. Proc. band is open-ended below. See note on the 100% floor below. |
| Band 2 (`133–150%`) | 314 / 419 bps | `applicable-percentage.2026.json:27` | **314 / 419 bps** ✅ | same | 2026-08-15 | "At least 133% but less than 150% — 3.14% / 4.19%" |
| Band 3 (`150–200%`) | 419 / 660 bps | `applicable-percentage.2026.json:28` | **419 / 660 bps** ✅ | same | 2026-08-15 | "At least 150% but less than 200% — 4.19% / 6.60%" |
| Band 4 (`200–250%`) | 660 / 844 bps | `applicable-percentage.2026.json:29` | **660 / 844 bps** ✅ | same | 2026-08-15 | "At least 200% but less than 250% — 6.60% / 8.44%" |
| Band 5 (`250–300%`) | 844 / 996 bps | `applicable-percentage.2026.json:30` | **844 / 996 bps** ✅ | same | 2026-08-15 | "At least 250% but less than 300% — 8.44% / 9.96%" |
| Band 6 (`300–400%`) top band | 996 / 996 bps | `applicable-percentage.2026.json:31` | **996 / 996 bps** ✅ | same | 2026-08-15 | "At least 300% but **not more than 400%** — 9.96% / 9.96%". Confirms the file's `note` that the final band includes 400 exactly. The "~9.96% at the top band" guess was exactly right. |
| Band 1 lower bound of 100% | `fromPct: 100` | `applicable-percentage.2026.json:26` | **See notes** ⚠️ | https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm | 2026-08-15 | Rev. Proc. 2025-25 says "Less than 133%" with no floor; the 100% floor comes from § 36B(c)(1)(A). Separately, OBBBA § 71302 **struck § 36B(c)(1)(B)** effective for tax years after 31 Dec 2025 — the provision that treated certain lawfully-present aliens below 100% FPL as being at 100%. Any below-100% PTC path in `ptc.ts` must be re-checked against post-OBBBA law. Not a numeric change to this file. |
| Required Contribution Percentage 2026 (affordability) | not encoded | — | **9.96%** ℹ️ | https://www.irs.gov/pub/irs-drop/rp-25-25.pdf | 2026-08-15 | Rev. Proc. 2025-25 § 3.02, for § 36B(c)(2)(C)(i)(II). Not currently in the engine; needed if employer-coverage affordability is ever modeled. Recorded here so it is not re-researched. |

**Status change warranted:** `verificationStatus` can move from `UNVERIFIED` to
`VERIFIED` with no value edits. This is the only file in the set where that is true.

---

## `packages/engine/src/rules/fpl.2025.json`

**Controlling source found and fetched:** the HHS annual update notice as printed
in the Federal Register, retrieved from govinfo (the file's placeholder citation
pointed at `federalregister.gov/`, which is bot-blocked; the govinfo URL below is
the durable replacement).

Exact citation: **90 Fed. Reg. 5917 (Jan. 17, 2025)**, FR Doc. 2025-01377,
"Annual Update of the HHS Poverty Guidelines", `DATES: January 15, 2025`.

| Figure | Current value | File:line | Correct value | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Contiguous 48 + DC, first person | $15,650 (`1565000`) | `fpl.2025.json:21` | **$15,650** ✅ | https://www.govinfo.gov/content/pkg/FR-2025-01-17/pdf/2025-01377.pdf | 2026-08-15 | Table: "1 …… $15,650" |
| Contiguous 48 + DC, each additional | $5,500 (`550000`) | `fpl.2025.json:21` | **$5,500** ✅ | same | 2026-08-15 | "For families/households with more than 8 persons, add $5,500 for each additional person." Also confirmed by the table's constant increment (21,150 − 15,650 = 5,500). |
| Alaska, first person | $19,550 (`1955000`) | `fpl.2025.json:22` | **$19,550** ✅ | same | 2026-08-15 | Alaska table: "1 …… $19,550" |
| Alaska, each additional | $6,880 (`688000`) | `fpl.2025.json:22` | **$6,880** ✅ | same | 2026-08-15 | "add $6,880"; increment 26,430 − 19,550 = 6,880 |
| Hawaii, first person | $17,990 (`1799000`) | `fpl.2025.json:23` | **$17,990** ✅ | same | 2026-08-15 | Hawaii table: "1 …… $17,990" |
| **Hawaii, each additional** | **$6,330 (`633000`) — ✅ FIXED 2026-08-15, was `632500`** | `fpl.2025.json:23` | **$6,330 (`633000`)** ✅ **CORRECTION APPLIED** | same | 2026-08-15 | The notice says "add **$6,330** for each additional person", and the printed table increments confirm it: 24,320 − 17,990 = 6,330; 30,650 − 24,320 = 6,330. The file is **$5 per additional person low**. Understates the poverty line for every multi-person Hawaii household, which *understates* the credit and *overstates* how close the household is to the cliff. Small, but wrong, and it compounds with family size. |
| Linearity assumption | `note` line 19 | `fpl.2025.json:19` | **Correct** ✅ | same | 2026-08-15 | The printed tables are exactly linear in family size for all three groups, and the notice states the ">8 persons" add-on rule explicitly. The engine's `firstPerson + (n−1) × additional` reproduces every published row. |
| Puerto Rico / territories | not handled | — | **Correctly out of scope** ℹ️ | same | 2026-08-15 | Notice: "the poverty guidelines are not defined for Puerto Rico or other outlying jurisdictions." `stateGroupFor` mapping everything non-AK/HI to CONTIGUOUS_48 is only safe because the product is 50-states+DC. Worth an explicit guard. |

---

## `packages/engine/src/rules/repayment-limits.2026.json`

### ⛔ This file encoded a rule that no longer exists in 2026. **FIXED 2026-08-15 (Batch A) — see the disposition note at the end of this section.**

**Primary source, read verbatim** (govinfo, One Big Beautiful Bill Act,
Pub. L. 119-21, enacted 4 July 2025):

> **SEC. 71305. ELIMINATING LIMITATION ON RECAPTURE OF ADVANCE PAYMENT OF PREMIUM TAX CREDIT.**
> (a) In General.—Section 36B(f)(2) is amended by striking subparagraph (B).
> …
> (c) Effective Date.—The amendments made by this section shall apply to taxable
> years beginning after December 31, 2025.

**Corroborated independently** by Rev. Proc. 2025-32 § 2.04:

> ".04 Section 71305 of the OBBBA removes § 36B(f)(2)(B), which limited the tax
> increase from excess advance payments for certain households, effective for
> taxable years beginning after December 31, 2025. Accordingly, the inflation
> adjustment to § 36B(f)(2)(B) is removed from this revenue procedure."

That is also why no 2026 indexed repayment table exists anywhere to be found: the
IRS deliberately stopped publishing one.

| Figure | Current value | File:line | Correct value | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Band `<200%` FPL cap | $400 / $800 | `repayment-limits.2026.json:21` | **NO CAP — band must be deleted** ❌ | https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm | 2026-08-15 | § 36B(f)(2)(B) struck for TY2026+. Full repayment applies. |
| Band `200–300%` FPL cap | $1,000 / $2,000 | `repayment-limits.2026.json:22` | **NO CAP — band must be deleted** ❌ | same | 2026-08-15 | as above |
| Band `300–400%` FPL cap | $1,650 / $3,300 | `repayment-limits.2026.json:23` | **NO CAP — band must be deleted** ❌ | same | 2026-08-15 | as above |
| Structural rule: no cap at ≥400% FPL | asserted in `note` | `repayment-limits.2026.json:19` | **True but now trivially so** ⚠️ | same | 2026-08-15 | The statement is not wrong, it is just no longer the interesting case. For 2026 there is no cap **anywhere**. The `note` must be rewritten or it will actively mislead: as written it tells a reader at 250% FPL that their clawback is capped at $1,000, which is false and is exactly the kind of number a user would act on. |
| Conforming amendment | n/a | — | ℹ️ | same | 2026-08-15 | § 71305(b) also rewrites § 36B(f)(2) to read "advance payments.—If the advance payments…" (removing the subparagraph split) and conforms § 35(g)(12)(B)(ii). Confirms the repeal is total, not a re-lettering. |
| Rev. Proc. citation in file | "Rev. Proc. 2025-25 indexed repayment limits" | `repayment-limits.2026.json:14` | **Wrong document** ❌ | https://www.irs.gov/pub/irs-drop/rp-25-25.pdf | 2026-08-15 | Rev. Proc. 2025-25 covers **only** the applicable-percentage table and the required-contribution percentage. It contains no repayment table. The repayment limits historically lived in the annual omnibus inflation Rev. Proc. (2026 edition: Rev. Proc. 2025-32), which now expressly omits them. |

**Recommended disposition** (for user approval, not applied): keep the file for
provenance, set `bands: []`, add an explicit `"limitationRepealed": true` flag and
a `repealedBy` citation, and make `clawback.ts` fail loudly rather than silently
returning an uncapped number by coincidence. The engine currently reaches the
right answer above 400% FPL and the **wrong** answer below it.

**DISPOSITION APPLIED 2026-08-15 (Batch A).** All three band rows above are
**FIXED**: the bands are gone from the live rule. The file now carries

```json
"limitation": { "inEffect": false, "bands": [] }
```

with the old three bands preserved under `_repealedStructure` (labelled
provenance-only, not read by the engine, and warning that those cents values were
never sourced figures). `citations` now points at Pub. L. 119-21 §71305 on
govinfo, Rev. Proc. 2025-32 §2.04, and the post-OBBBA §36B text — the **wrong
Rev. Proc. 2025-25 citation row above is FIXED** by deletion. The misleading
`note` is rewritten to say plainly that a household at 250% of the poverty line
repays every excess dollar. `verificationStatus` moved `UNVERIFIED` →
`VERIFIED_STATUTORY`, and `ruleSetVersion` to
`aptc-repayment-limits-2026.repealed-1`.

`clawback.ts` reads `limitation.inEffect` rather than assuming: when false it
returns a full, uncapped repayment at every income; when a future ruleset says
true but ships no bands it **throws** ("refusing to guess a repayment cap")
rather than reaching an uncapped answer by coincidence. Whether a cap exists is
now data, so a reinstatement is a new dated rules file, not a code change.

---

## `packages/engine/src/rules/csr-bands.json`

**Fully verified against statute and regulation.** This file was already marked
`VERIFIED_STATUTORY` and the marking holds up — but note the two eCFR citations in
it point at `ecfr.gov`, which is bot-blocked; durable govinfo replacements are
given below.

| Figure | Current value | File:line | Correct value | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| 94% AV band, 100–150% FPL | `fromPct 100, toPct 150, 9400 bps` | `csr-bands.json:20` | **94% AV, 100–150% FPL** ✅ | https://www.govinfo.gov/link/uscode/42/18071?link-type=html | 2026-08-15 | 42 U.S.C. § 18071(c)(2)(A): "not less than 100 percent but not more than 150 percent … increase the plan's share … to 94 percent". |
| 87% AV band, 151–200% FPL | `fromPct 151, toPct 200, 8700 bps` | `csr-bands.json:21` | **87% AV, >150% to 200% FPL** ✅ | same | 2026-08-15 | § 18071(c)(2)(B): "more than 150 percent but not more than 200 percent … 87 percent". The file's `151` is the correct discretization of "more than 150" once the Form-8962 whole-percent truncation is applied. |
| 73% AV band, 201–250% FPL | `fromPct 201, toPct 250, 7300 bps` | `csr-bands.json:22` | **73% AV, >200% to 250% FPL** ✅ | same | 2026-08-15 | § 18071(c)(2)(C): "more than 200 percent but not more than 250 percent … 73 percent". Same discretization logic. |
| Silver-only restriction | `note` line 18 | `csr-bands.json:18` | **Confirmed** ✅ | same | 2026-08-15 | § 18071(b)(1): eligible insured must be "enrolled in a qualified health plan in the **silver level** of coverage in the individual market offered through an Exchange". |
| 250% FPL ceiling | `note` line 18 | `csr-bands.json:18` | **Confirmed** ✅ | https://www.govinfo.gov/content/pkg/CFR-2025-title45-vol2/xml/CFR-2025-title45-vol2-sec155-305.xml | 2026-08-15 | 45 C.F.R. § 155.305(g)(1)(i)(C): household income "does not exceed 250 percent of the FPL". § 155.305(g)(1)(ii) restates the silver-only rule for non-Indians. |
| 94/87/73 AV as plan variations | implicit | — | **Confirmed** ✅ | https://www.govinfo.gov/content/pkg/CFR-2025-title45-vol2/xml/CFR-2025-title45-vol2-sec156-420.xml | 2026-08-15 | 45 C.F.R. § 156.420(a)(1)–(3) requires issuers to file silver variations at 94%, 87%, and 73% AV "plus or minus the de minimis variation", keyed to § 155.305(g)(2)(i)–(iii). The **de minimis variation** means a real enrollee's plan is only *approximately* 94/87/73 — if the UI presents these as exact, it should say "approximately". |
| Lower edge at exactly 100% FPL | `fromPct 100` | `csr-bands.json:20` | **Minor tension** ⚠️ | https://www.govinfo.gov/link/uscode/42/18071?link-type=html | 2026-08-15 | § 18071(b)(2) says household income must **exceed** 100 percent, while § 18071(c)(2)(A) says "not less than 100 percent". § 155.305(g)(2)(i) resolves it operationally as "greater than or equal to 100 percent". The file's `100` matches the regulation. No change needed; flagged only so it is not "fixed" later. |
| `effectiveFrom: 2014-01-01` | 2014-01-01 | `csr-bands.json:3` | **Still in force** ✅ | same | 2026-08-15 | § 18071 was not amended by OBBBA. CSR remains available in 2026. Note that CSR eligibility inherits § 36B eligibility via § 155.305(g)(1)(i)(B), so the OBBBA § 71301–71304 restrictions flow through to CSR. |

---

## `packages/engine/src/rules/contribution-limits.2026.json`

**Controlling sources found and fetched:** IRS Notice 2025-67 (2026 retirement
plan COLAs), Rev. Proc. 2025-19 (2026 HSA amounts), and the SSA cost-of-living
notice as printed in the Federal Register (retrieved via the govinfo API, since
`ssa.gov` returns HTTP 403 to non-browser clients).

Nine of eleven placeholder values turned out to be right. One is wrong. One is
missing entirely.

| Figure | Current value | File:line | Correct value | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| 401(k)/403(b) elective deferral | $24,500 (`2450000`) | `contribution-limits.2026.json:29` | **$24,500** ✅ | https://www.irs.gov/pub/irs-drop/n-25-67.pdf | 2026-08-15 | Notice 2025-67: "The limitation under section 402(g)(1) … is increased from $23,500 to $24,500." |
| 457(b) deferral (same field) | $24,500 | `contribution-limits.2026.json:29` | **$24,500** ✅ | same | 2026-08-15 | "The limitation on deferrals under section 457(e)(15) … is increased from $23,500 to $24,500." Confirms the engine's single shared field is safe for 401(k)/403(b)/457. |
| Age-50 catch-up (employer plan) | $8,000 (`800000`) | `contribution-limits.2026.json:30` | **$8,000** ✅ | same | 2026-08-15 | "The limitation under section 414(v)(2)(B)(i) … is increased from $7,500 to $8,000." |
| **SECURE 2.0 age 60–63 "super catch-up"** | **not modeled — STILL UNRESOLVED after Batch A (explicitly out of scope)** | — | **$11,250** ❌ **MISSING** | same | 2026-08-15 | "The limitation under section 414(v)(2)(E)(i) … that applies for individuals who attain **age 60, 61, 62, or 63 in 2026 remains $11,250**." This is real, in force for 2026, and **$3,250 more MAGI reduction** than the engine currently offers a 60–63-year-old — precisely the demographic most likely to be a pre-Medicare marketplace enrollee near the cliff. This is the single largest missed lever in the product. Applies *instead of*, not in addition to, the $8,000. |
| HSA self-only | $4,400 (`440000`) | `contribution-limits.2026.json:31` | **$4,400** ✅ | https://www.irs.gov/pub/irs-drop/rp-25-19.pdf | 2026-08-15 | Rev. Proc. 2025-19 § 2.01(1): § 223(b)(2)(A) self-only limit for CY2026 is $4,400. |
| HSA family | $8,750 (`875000`) | `contribution-limits.2026.json:32` | **$8,750** ✅ | same | 2026-08-15 | § 223(b)(2)(B) family limit for CY2026 is $8,750. |
| HSA catch-up 55+ | $1,000 (`100000`) | `contribution-limits.2026.json:33` | **$1,000** ✅ | https://www.govinfo.gov/content/pkg/USCODE-2024-title26/html/USCODE-2024-title26-subtitleA-chap1-subchapB-partVII-sec223.htm | 2026-08-15 | § 223(b)(3)(B): the additional contribution amount is $1,000 for taxable years beginning after 2008. Statutory, not indexed — the file's own claim was right. |
| Traditional IRA limit | $7,500 (`750000`) | `contribution-limits.2026.json:34` | **$7,500** ✅ | https://www.irs.gov/pub/irs-drop/n-25-67.pdf | 2026-08-15 | "The deductible amount under section 219(b)(5)(A) … is increased from $7,000 to $7,500." |
| IRA catch-up 50+ | $1,100 (`110000`) | `contribution-limits.2026.json:35` | **$1,100** ✅ | same | 2026-08-15 | "The deductible amount pursuant to section 219(b)(5)(B)(ii) … is increased from $1,000 to $1,100." |
| SEP / DC-plan overall cap | $72,000 (`7200000`) | `contribution-limits.2026.json:36` | **$72,000** ✅ | same | 2026-08-15 | "The limitation for defined contribution plans under section 415(c)(1)(A) is increased in 2026 from $70,000 to $72,000." |
| Social Security wage base | $184,500 (`18450000`) | `contribution-limits.2026.json:38` | **$184,500** ✅ | https://api.govinfo.gov/packages/FR-2025-11-03/granules/2025-19763/htm | 2026-08-15 | SSA, "Cost-of-Living Increase and Other Determinations for 2026", 90 FR (3 Nov 2025), FR Doc. 2025-19763: "The OASDI contribution and benefit base is **$184,500** for remuneration paid in 2026." Shown work in the notice: $184,548.71 rounded to the nearest $300. |
| **IRA phase-out, single covered, from** | **$81,000 (`8100000`) — ✅ FIXED 2026-08-15, was `7900000`** | `contribution-limits.2026.json:45` | **$81,000 (`8100000`)** ✅ **CORRECTION APPLIED** | https://www.irs.gov/pub/irs-drop/n-25-67.pdf | 2026-08-15 | "the deduction … is phased out for single individuals and heads of household who are active participants … between **$81,000 and $91,000**, increased from between $79,000 and $89,000." The file holds the **2025** range. |
| **IRA phase-out, single covered, to** | **$91,000 (`9100000`) — ✅ FIXED 2026-08-15, was `8900000`** | `contribution-limits.2026.json:46` | **$91,000 (`9100000`)** ✅ **CORRECTION APPLIED** | same | 2026-08-15 | Same sentence. Consequence: a single filer with MAGI between $89k and $91k is currently told their traditional IRA deduction is fully phased out when it is not — the engine hides a live, legal MAGI-reduction lever from exactly the income band that sits near the cliff for a one-person household. |
| IRA phase-out, MFJ covered, from/to | $129,000–$149,000 | `contribution-limits.2026.json:47-48` | **$129,000–$149,000** ✅ | same | 2026-08-15 | "For married couples filing jointly, if the spouse who makes the IRA contribution is an active participant, the income phase-out range is between $129,000 and $149,000." |
| IRA phase-out, spouse-covered, from/to | $242,000–$252,000 | `contribution-limits.2026.json:49-50` | **$242,000–$252,000** ✅ | same | 2026-08-15 | "For an IRA contributor who is not an active participant and is married to someone who is an active participant, the deduction is phased out if the couple's income is between $242,000 and $252,000." |
| IRA phase-out, MFS covered, from/to | $0–$10,000 | `contribution-limits.2026.json:51-52` | **$0–$10,000** ✅ | same | 2026-08-15 | "For a married individual filing a separate return who is an active participant, the phase-out range is **not subject to an annual cost-of-living adjustment and remains $0 to $10,000**." Confirms this pair should never be indexed. |
| SEP employer contribution % | 25% (`2500` bps) | `contribution-limits.2026.json:37` | **25%** ✅ | https://www.govinfo.gov/link/uscode/26/404?link-type=html | 2026-08-15 | IRC § 404(h)(1)(C): "The amount deductible in a taxable year for a simplified employee pension shall not exceed **25 percent** of the compensation paid to the employees during the calendar year…". Statutory, not indexed. **Caveat this audit did not test:** 25% of *net* self-employment income is arithmetically ~20% of pre-contribution net earnings, because the contribution reduces its own base. Whether `levers.ts` applies the right base is a code question, not a rules question. |
| SE OASDI rate 12.4% | `1240` bps | `contribution-limits.2026.json:40` | **12.4%** ✅ | https://www.govinfo.gov/content/pkg/USCODE-2024-title26/html/USCODE-2024-title26-subtitleA-chap2-sec1401.htm | 2026-08-15 | IRC § 1401(a): "a tax equal to **12.4 percent** of the amount of the self-employment income". |
| SE Medicare rate 2.9% | `290` bps | `contribution-limits.2026.json:41` | **2.9%** ✅ | same | 2026-08-15 | IRC § 1401(b)(1): "a tax equal to **2.9 percent**". |
| SE combined rate 15.3% | `1530` bps | `contribution-limits.2026.json:39` | **15.3%** ✅ | same | 2026-08-15 | 12.4 + 2.9. Consistent with the two statutory rates above. |
| Additional Medicare Tax 0.9% | not modeled | — | **0.9% above $250k MFJ / $200k other** ℹ️ | same | 2026-08-15 | IRC § 1401(b)(2)(A). Not modeled, and correctly so for this product: the thresholds sit far above the 400% FPL cliff for every household size, so it cannot affect a cliff decision. Recorded to close the question. |
| SE net-earnings factor 92.35% | `9235` bps | `contribution-limits.2026.json:42` | **92.35%** ✅ | https://www.govinfo.gov/content/pkg/USCODE-2024-title26/html/USCODE-2024-title26-subtitleA-chap2-sec1402.htm | 2026-08-15 | IRC § 1402(a)(12): a deduction equal to net earnings × "**one-half of the sum of the rates imposed by subsections (a) and (b) of section 1401** … (determined without regard to the rate imposed under paragraph (2) of section 1401(b))". Half of 15.3% is 7.65%; 100% − 7.65% = **92.35%**. Note the parenthetical: the 0.9% additional tax is expressly excluded from this computation, so 92.35% is correct at *all* income levels, not just below the threshold. |

**Also captured while in Notice 2025-67**, for whoever builds the next lever set —
these are verified 2026 figures the engine does not currently use:
DB annual benefit § 415(b)(1)(A) $290,000 · SIMPLE deferral $17,000 (or $18,100
under § 408(p)(2)(E)(i)(I)–(II)) · SIMPLE age-50 catch-up $4,000 · SIMPLE age-60–63
catch-up $5,250 · Roth catch-up wage threshold $150,000 · excepted-benefit HRA
$2,200 (Rev. Proc. 2025-19 § 2.02) · 2026 HDHP minimum deductible $1,700 self-only
/ $3,400 family and out-of-pocket maximum $8,500 / $17,000 (Rev. Proc. 2025-19
§ 2.01(2)) — **the HDHP definition is a genuine eligibility gate on the HSA lever
and the engine does not appear to check it.**

---

## `packages/engine/src/rules/medicaid-expansion.2026.json`

**All 51 flags verified correct against a CMS primary dataset.**

The method matters here, because there is no CMS page that simply lists "expansion
states". What CMS *does* publish is the **CMS-64 VIII Group Break Out Report** —
enrollment in the § 1902(a)(10)(A)(i)(VIII) "New Adult Group", which is the
expansion group itself. CMS's own dataset description states the decision rule
explicitly:

> "The VIII Group is only applicable for states that have expanded their Medicaid
> programs by adopting the VIII Group. VIII Group enrollment information for the
> states that have not expanded their Medicaid program is noted as 'N/A'."

I downloaded the full file (7,854 rows, all 50 states + DC + territories) and took
each state's most recent reporting period. Exactly **ten** states report no VIII
Group enrollment:

**AL · FL · GA · KS · MS · SC · TN · TX · WI · WY**

That is character-for-character the set the file already encodes as `false`. The
other 41 jurisdictions (40 states + DC) all report VIII Group enrollment.

| Figure | Current value | File:line | Correct value | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| All 51 `expanded` flags | 41 `true`, 10 `false` | `medicaid-expansion.2026.json:21-31` | **41 `true`, 10 `false` — identical** ✅ | https://download.medicaid.gov/data/medicaid-enrollment-new-adult-group-02052026.csv | 2026-08-15 | CMS "Medicaid Enrollment – New Adult Group" (CMS-64 VIII Group Break Out Report), file dated 5 Feb 2026. Non-expansion set derived as described above. |
| Dataset currency | — | — | **Latest enrollment period: June 2025** ⚠️ | same | 2026-08-15 | The file was *published* Feb 2026 but its newest enrollment period is 2025-06. It therefore cannot by itself rule out a state expanding between July 2025 and today. |
| Currency cross-check | — | — | **Still 10, as of 21 May 2026** ✅ | https://www.kff.org/status-of-state-medicaid-expansion-decisions/ | 2026-08-15 | **SECONDARY SOURCE — labelled as such.** KFF's tracker, page-dated 21 May 2026, states "41 states (including DC) have adopted the Medicaid expansion" and "10 states have not adopted the expansion". Since expansion is a one-way door in practice (no state has ever rescinded), a count that is still 10 in May 2026 combined with a primary list of exactly those 10 through June 2025 closes the gap. |
| DC treated as a state | `"DC": true` | `medicaid-expansion.2026.json:22` | **Correct** ✅ | https://download.medicaid.gov/data/medicaid-enrollment-new-adult-group-02052026.csv | 2026-08-15 | DC reports VIII Group enrollment. Note DC covers adults well above 138% FPL, which the boolean flattens — see the caveat below. |
| Statutory basis, 138% FPL | `note` line 19 | `medicaid-expansion.2026.json:19` | **Correct** ✅ | https://www.medicaid.gov/medicaid/national-medicaid-chip-program-information/medicaid-childrens-health-insurance-program-basic-health-program-eligibility-levels/index.html | 2026-08-15 | CMS's MAGI eligibility table lists expansion states at **133%** with the note that "The MAGI-based rules generally include adjusting an individual's income by an amount equivalent to a **5% FPL disregard**" — which is why the operative figure is 138%. The file's note is right; the 133/138 relationship is worth stating in the methodology page, since users who look up "133%" will otherwise think the engine is wrong. |

### Three caveats the boolean cannot express

1. **Georgia is not simply "not expanded."** Georgia operates *Pathways to Coverage*,
   a partial program covering adults to 100% FPL conditioned on 80 hours/month of
   work or qualifying activity. A Georgia user at 90% FPL is told by a `false` flag
   that they are in the coverage gap; they may in fact be Medicaid-eligible. The
   engine's advice for them is wrong in a way that matters.
2. **Wisconsin is the classic edge case.** Wisconsin never adopted the VIII Group —
   correctly `false` — but covers childless adults to 100% FPL under a waiver, so it
   has **no coverage gap** despite being a non-expansion state. CMS's own eligibility
   table renders Wisconsin's adult column as "No/95%". A blanket "you're in the
   coverage gap below 100% FPL" message is wrong for Wisconsin.
3. **Several expansion states go well above 138%** (CMS table: DC 210%, Minnesota
   200%, New York 200%). The `true` flag is still correct for PTC purposes, but any
   copy that says "Medicaid up to 138% in your state" is understated for these three.

None of these require a numeric change. They require the *interpretation layer* to
stop treating a boolean as the whole answer — which is a product decision for the
user, flagged here rather than acted on.

---

## `packages/engine/src/rules/slcsp-sample.2026.json`

Two very different things live in this file. **The invented part is untouched — I
did not attempt to verify sample data, per instruction. The real part verified
perfectly.**

### The age curve: all 65 factors verified exactly

The file's own note claims the encoded curve is "the federal default curve." It is —
exactly. I found the controlling guidance (CCIIO Insurance Standards Bulletin,
16 Dec 2016, *Guidance Regarding Age Curves and State Reporting*), extracted its
Appendix I, and diffed all 65 entries programmatically against the JSON.
**Zero mismatches.**

| Figure | Current value | File:line | Correct value | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| All 65 age factors (ages 0–64) | `765` … `3000` permille | `slcsp-sample.2026.json:29-39` | **All 65 match Appendix I exactly** ✅ | https://www.cms.gov/cciio/resources/regulations-and-guidance/downloads/final-guidance-regarding-age-curves-and-state-reporting-12-16-16.pdf | 2026-08-15 | Programmatic diff, 65/65 identical: 0–14 = 0.765, 15 = 0.833, 20 = 0.970, 21–24 = 1.000, 25 = 1.004 … 63 = 2.952, 64 and older = 3.000. |
| 3:1 maximum age variation | implied by 1000 → 3000 | `slcsp-sample.2026.json:29-39` | **Confirmed** ✅ | https://www.govinfo.gov/content/pkg/CFR-2025-title45-vol2/xml/CFR-2025-title45-vol2-sec147-102.xml | 2026-08-15 | 45 C.F.R. § 147.102(a)(1)(iii): the rate "may not vary by more than 3:1 for like individuals of different age who are age 21 and older", and variation under 21 "must be actuarially justified". The curve's exact 1.000 → 3.000 span is the binding maximum. |
| Age-band structure | 0–14 flat, 15–20 single years, 21–63 single years, 64 terminal | `slcsp-sample.2026.json:29-39` | **Confirmed** ✅ | same | 2026-08-15 | 45 C.F.R. § 147.102(d): single band 0–14; one-year bands 15–20; one-year bands 21–63; single band **64 and older**. The engine's key `"64"` must be read as "64 **and older**" — if any code path can pass age 65+, it needs to clamp to 64 rather than fall through. |
| Federal curve is a *default*, not a mandate | `note` line 19 | `slcsp-sample.2026.json:19` | **Correct, and understated** ✅ | same | 2026-08-15 | § 147.102(e): the federal curve applies only where a state has not established its own. The file's "states may vary" note is right. |
| Current per-state age curves | not encoded | — | **UNRESOLVED** | https://www.cms.gov/cciio/programs-and-initiatives/health-insurance-market-reforms/state-rating | 2026-08-15 | CMS's "State Specific Rating Variations" table is the authoritative list, but the page is stamped **"Updated December 10, 2021"** — nearly five years stale, and there is no newer version. It shows **New York and Vermont at a 1:1 individual-market age ratio** — meaning premiums there do **not vary by age at all** — plus state-established curves in several other states. Applying the federal curve to a New York or Vermont enrollee would be materially wrong. Since the sample file contains no NY/VT county this is latent today, but it becomes live the moment real data lands. |

### The benchmark premiums: correctly declared sample data — do not verify, replace

The six `age21BaseMonthlyCents` values are invented. Per instruction I made no
attempt to check them, and no attempt should be made: there is nothing to check.
They must be *replaced*, and here is the pipeline to do it.

**The production source — located, URLs confirmed live (HTTP 200, `application/zip`):**

| File | URL (PY2026 confirmed to exist) | Supplies |
|---|---|---|
| Rate PUF | `https://download.cms.gov/marketplace-puf/2026/rate-puf.zip` | Per-plan premium by rating area and individual age — the actual dollar figures |
| Plan Attributes PUF | `https://download.cms.gov/marketplace-puf/2026/plan-attributes-puf.zip` | Metal level (to isolate **Silver**), on/off-exchange flag, plan type, CSR variation IDs |
| Service Area PUF | `https://download.cms.gov/marketplace-puf/2026/service-area-puf.zip` | County (FIPS) ↔ rating area ↔ plan availability |
| Benefits & Cost Sharing PUF | `https://download.cms.gov/marketplace-puf/2026/benefits-and-cost-sharing-puf.zip` | Only if CSR plan variations are ever surfaced |

Landing page (fetched, lists PY2026 data dictionaries):
`https://www.cms.gov/marketplace/resources/data/public-use-files`

**The pipeline, and where it will bite:**

1. Join Rate × Plan Attributes × Service Area to get, for each **county**, the set of
   **Silver** plans actually available to a consumer there.
2. Sort by premium at a fixed reference age and take the **second lowest**. That is
   the SLCSP. "Second lowest" is a per-county ranking, not a national one, and it can
   change with a single issuer exit — this is why the number must be re-ingested
   annually, not patched.
3. **The PUFs only cover HealthCare.gov states.** The ~20 State-Based Marketplaces
   (CA, NY, CO, WA, MA, …) publish their own files in their own formats, or none at
   all. The engine's sample list includes **Los Angeles County, CA** — a state whose
   data is *not* in these files. Any plan that assumes one national ingest will fail
   on roughly a third of the population. Budget for per-SBM adapters or scope v1 to
   HealthCare.gov states and say so in the UI.
4. **Do not store an age-21 base and re-derive.** The engine currently models
   `age21Base × ageFactor`, which is only valid where the federal default curve
   applies. The Rate PUF gives the premium *at each age directly*. Store the actual
   per-age premium and the age-curve multiplication disappears — along with the
   New York / Vermont problem in the row above.
5. A single county's rating area can contain multiple counties and vice versa; join
   on rating area, then map to counties, never the reverse.

Until this lands, the file's `SAMPLE_DATA` status and the UI's sample-data labelling
are the only things standing between a user and a fabricated dollar figure. Both must
stay.

---

## Cross-cutting: the 400% cliff and the Form 8962 conventions

This is scope item 2 and it does not belong to any single rules file, so it gets its
own section.

### The cliff is real for 2026 — confirmed by the absence of the thing that removed it

The ARPA/IRA enhancement worked by suspending the 400% ceiling and substituting a
different applicable-percentage table that extended above 400% FPL. Three
independent pieces of fetched evidence show it is gone for 2026:

1. **Rev. Proc. 2025-25** publishes an Applicable Percentage Table whose top row is
   "At least 300% but **not more than 400%**". A table that terminates at 400% is a
   table with a cliff. There is no row above 400%.
2. The same document indexes under **§ 36B(b)(3)(A)(i)** — the permanent provision —
   not the ARPA subparagraph, and states the failsafe exception of
   § 36B(b)(3)(A)(ii)(III) applies for 2026.
3. **Rev. Proc. 2025-32** ("2026 Adjusted Items") contains no § 36B enhancement at
   all; the only § 36B entry is the *removal* of the repayment limitation.

Contrast with the **2025** Form 8962 instructions, which still say in terms: "For tax
year 2025, taxpayers with household income that **exceeds 400%** of the federal
poverty line for their family size may be allowed a PTC." That sentence describes the
enhancement, and it applies to 2025 — not to the year this engine models.

**No phase-out above 400% exists for 2026.** The credit goes to zero at the edge.

### ⚠️ The truncation convention — the engine had this wrong. **FIXED 2026-08-15 (Batch A).**

| Figure | Current behaviour | File:line | Correct behaviour | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Form 8962 line 5 FPL percentage | **✅ FIXED — two-step: ceiling test then truncation.** Was a bare `Math.floor(magi·100/fpl)` with a comment asserting "400.9% is still 400" | `packages/engine/src/fpl.ts` | **Two-step, not one-step** ✅ **APPLIED** | https://www.irs.gov/pub/irs-pdf/i8962.pdf | 2026-08-15 | Worksheet 2 step 4 tests **first**: "Is the amount on line 1 more than the amount on line 3 [= FPL × 4.0]? • **Yes.** … Enter **401** here and on line 5". Truncation is only reached in the "No" branch. So an income of 400.9% of FPL never becomes 400 — it becomes 401. |
| Pre-ARPA confirmation of the same rule | — | — | **Identical wording in 2020** ✅ | https://www.irs.gov/pub/irs-prior/i8962--2020.pdf | 2026-08-15 | Fetched the last pre-ARPA instructions, because those reflect the law that returns in 2026. Worksheet 2 is word-for-word the same, and Line 6 spells out the consequence: "**If the amount on line 5 is 401%, you are not eligible for the PTC.**" Two independent tax years, same rule. |
| `magiAtPctEdge(fpl, 400)` | **✅ FIXED — returns `4 × fpl` at the ceiling** (via the new `cliffEdgeMagi`), was `ceil(401·fpl/100) − 1` | `packages/engine/src/fpl.ts` | **`4 × fpl` (in cents)** ✅ **APPLIED** | same | 2026-08-15 | The formula is right for *interior* band edges (150%, 200%, 250%, 300%) where truncation genuinely governs. It is wrong for the 400% cliff specifically, because the cliff is not a truncation boundary — it is a strict "more than 4.0 × FPL" test applied before truncation. |
| Truncation itself | `Math.floor`, no rounding | `packages/engine/src/fpl.ts:49` | **Correct** ✅ | https://www.irs.gov/pub/irs-pdf/i8962.pdf | 2026-08-15 | "Do not round; instead, multiply this number by 100 … and then **drop any numbers after the decimal point**. For example, for 0.9984, enter 99; for 1.8565, enter 185; and for 3.997, enter **399**." Floor, not round — the engine is right, and the worked examples confirm it. |
| Below-100% handling | see notes | `packages/engine/src/ptc.ts` | **Re-check against post-OBBBA law** ⚠️ | https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm | 2026-08-15 | The 2025 instructions describe two below-100% paths: the Marketplace-estimate path and the "Alien lawfully present" path. OBBBA § 71302 **struck § 36B(c)(1)(B)** for TY2026+, which is the statutory hook for the second one. Whatever `ptc.ts` does below 100% needs re-derivation for 2026. |

**Magnitude.** For a single filer in the lower 48, 1% of FPL is $156.50; for a family
of four, $321.50. The engine currently treats up to that much income above the true
cliff as still credit-eligible. At the cliff the credit is worth thousands of dollars,
so this is not a rounding nicety — it is the difference between "you're fine" and
"you just lost your entire subsidy", delivered to a user who is standing on exactly
the edge the product exists to find. **Fix before launch.**

*(Flagged only — no code was changed, per the scope of this pass.)*

**FIXED 2026-08-15 (Batch A).** `fplPercentForm8962` now runs Worksheet 2 in
order — "is household income more than FPL × 4.0?" first, truncation only in the
"No" branch — and returns the 401 sentinel when the ceiling test fails.
`magiAtPctEdge` returns exactly 4.0 × FPL at the ceiling and keeps
`ceil((maxPct+1)·fpl/100) − 1` for interior boundaries, which is still the right
rule for the 250% CSR ledge and the applicable-percentage band edges. Two new
helpers, `cliffEdgeMagi(fpl, rules)` and `eligibilityCeilingPct(rules)`, keep the
threshold out of `.ts`: the multiple (`40000` bps) and the sentinel (`401`) now
live in `applicable-percentage.2026.json → eligibilityCeiling`, cited to the
2025 and 2020 Form 8962 instructions and §36B(c)(1)(A) on govinfo. Downstream,
`ptc.ts`, `levers.ts` and `analyzeHousehold` compare against the ceiling from
rules rather than the literal 400, and `overCliff` is now a MAGI comparison
against 4.0 × FPL rather than a percentage comparison. The concrete effect: the
single-filer edge moved from $62,756.49 to **$62,600.00**, and the family-of-four
edge from $128,921.49 to **$128,600.00**. Both are locked by golden tests.

---

## Still unresolved

Two items, both honestly unresolvable rather than un-attempted. **Both remain
UNRESOLVED after Batch A**, along with two items that are resolvable but were
deliberately excluded from that batch and are recorded here so they are not
lost: the **SECURE 2.0 age 60–63 catch-up** ($11,250, verified, simply not
modelled — see the contribution-limits table above) and the **invented SLCSP
county premiums** (declared sample data; the CMS PUF ingest above is the fix).

| Item | Why unresolved | What would resolve it |
|---|---|---|
| **2026 Form 8962 and its instructions** | Not yet published. The IRS releases a tax year's Form 8962 around January of the *following* year, so the 2026 edition is due ~Jan 2027. The truncation and cliff conventions above are established from the 2025 and 2020 editions, which agree word-for-word across an ARPA boundary — strong, but not the 2026 document itself. | Re-fetch `https://www.irs.gov/pub/irs-pdf/i8962.pdf` after Jan 2027 and re-confirm Worksheet 2 and Line 6. Also confirm the 2026 Table 2 applicable-figure values against Rev. Proc. 2025-25. |
| **Current state-specific age rating curves** | CMS's "State Specific Rating Variations" page is the authoritative list and is stamped **Updated December 10, 2021**. No newer version exists. States file updates to CMS by 1 February of the prior year under 45 C.F.R. § 147.103, but CMS has not republished the summary. | Per-state DOI filings, or the state-specific rate tables inside the CMS Rate PUF, which reflect whatever curve each state actually used. The PUF ingest makes this moot: store per-age premiums and never apply a curve. |

---

## Sources that could not be reached

| Source | Behaviour | Consequence |
|---|---|---|
| `ecfr.gov` | Bot-blocked (302 to an identical block page on every path — a 200 response from it proves nothing) | Two citations in `csr-bands.json` and one in `slcsp-sample.2026.json` point here. **Replace with the govinfo CFR URLs given above**, which are authenticated GPO XML. |
| `federalregister.gov` | Bot-blocked, same pattern | The placeholder citation in `fpl.2025.json:15` points at the bare domain. Replace with the govinfo FR PDF URL. |
| `congress.gov` | HTTP 403 | Not needed — govinfo served the full Public Law text. |
| `uscode.house.gov` | Connection refused (75s timeout) | Not needed — govinfo US Code and the govinfo link service both worked. |
| `ssa.gov` | HTTP 403 to curl and to WebFetch, including with a browser User-Agent | Worked around via the govinfo API copy of SSA's Federal Register notice, which is the authoritative published text anyway and a better citation. |
| `law.cornell.edu` (LII) | Not attempted | Cited five times across the rules files. LII is a **secondary** source. All five citations should be repointed at the govinfo US Code URLs used in this audit. |

### Sources that did work, for the next person

- **govinfo.gov is the workhorse.** It served the full Public Law text, US Code
  sections, CFR sections as GPO XML, and Federal Register notices. Its link service
  (`govinfo.gov/link/uscode/{title}/{section}?link-type=html`) resolves a citation
  without needing to know the granule path, which is worth remembering when the
  long `USCODE-…-secNNN.htm` guess 404s.
- **The govinfo search API accepts `DEMO_KEY`** and is the only reliable way to find
  a Federal Register document by content:
  `POST https://api.govinfo.gov/search?api_key=DEMO_KEY` with
  `{"query":"collection:(FR) AND publishdate:range(YYYY-MM-DD,YYYY-MM-DD) AND \"phrase\""}`.
  This is how the SSA wage base was recovered after `ssa.gov` refused every request.
  Granule text then comes from
  `https://api.govinfo.gov/packages/{pkg}/granules/{granule}/htm?api_key=DEMO_KEY`.
- **`irs.gov/pub/irs-drop/` and `/pub/irs-pdf/` are open.** Revenue Procedures follow
  `rp-YY-NN.pdf`, Notices `n-YY-NN.pdf`, form instructions `i8962.pdf`, and prior-year
  forms `/pub/irs-prior/i8962--YYYY.pdf`. No blocking encountered.
- **`data.medicaid.gov` has a public DKAN API** (`/api/1/search/?fulltext=…`) and open
  CSV downloads — a far better expansion-status source than any narrative page.
- **`download.cms.gov/marketplace-puf/{year}/{file}.zip` is a stable URL pattern**
  that works for years never linked on the current landing page.
- **PDF handling:** none of `pdftotext`, `mutool`, `qpdf`, or `poppler` is installed
  on this machine, and the summarising fetch tool mangles or hallucinates tabular PDF
  content — it misreported Rev. Proc. **2025-25** as "2025-21" with an entirely
  fabricated applicable-percentage table (0.00/2.00, 2.00/4.00, …) that would have
  been catastrophic to trust. **Extract PDF text yourself** (`pip install pypdf` in a
  venv) and read the table. Every figure in this audit was read from extracted text,
  never from a summary.

---

## Annual re-verification checklist

In publication order, so a single pass each autumn covers everything.

| When | What | Where |
|---|---|---|
| Mid-January | HHS poverty guidelines for year *N* → drive coverage year *N+1* | `aspe.hhs.gov`, then the Federal Register notice on govinfo for the citable version |
| ~May | HSA limits for year *N+1* (Rev. Proc.) | `irs.gov/pub/irs-drop/` |
| ~July–August | § 36B applicable-percentage table and required contribution percentage for year *N+1* (Rev. Proc.) | `irs.gov/pub/irs-drop/` |
| ~October | Retirement/IRA COLAs for year *N+1* (Notice) | `irs.gov/pub/irs-drop/` |
| ~October–November | SSA contribution and benefit base for year *N+1* | Federal Register via the govinfo search API — **not** `ssa.gov` |
| ~October–November | Marketplace PUFs for plan year *N+1* | `download.cms.gov/marketplace-puf/{N+1}/` |
| Quarterly | Medicaid expansion status | `data.medicaid.gov` New Adult Group CSV; KFF as a secondary currency check |
| Continuously | Legislation amending § 36B | govinfo `PLAW-*` — this audit found a repeal the build-time notes had no idea about |

**The lesson of item 4:** the placeholder *numbers* were mostly fine, but a statute
had been repealed underneath them and nobody was watching. Indexed values drift
predictably; statutory structure does not. Watch the law, not just the tables.

