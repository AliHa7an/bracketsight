# VERIFICATION-STATUS — Phase 1 primary-source verification

**Date of this pass: 2026-08-15.** Verifier: automated research pass against IRS /
Treasury / GPO primary sources only.

> ## Summary: **80 verified · 7 FIXED · 10 corrected-not-yet-applied · 1 unresolved** (98 rows)
>
> Originally **80 verified · 17 corrected-value-identified · 1 unresolved**.
> Batch A (2026-08-15) applied 7 of the 17 corrections; the row count is
> unchanged and no row was deleted.
>
> | Rules file | Verified | FIXED (Batch A) | Corrected, not yet applied | Unresolved |
> |---|---|---|---|---|
> | `tips.2026.json` | 8 | 1 | 0 | 0 |
> | `overtime.2026.json` | 10 | 1 | 0 | 0 |
> | `senior.2026.json` | 9 | 2 | 0 | 0 |
> | `car-loan.2026.json` | 11 | 0 | 8 | 0 |
> | `brackets.2026.json` | 33 | 0 | 1 | 0 |
> | `occupations.2026.json` | 5 | 3 | 0 | 0 |
> | Ordering / MAGI (cross-cutting) | 4 | 0 | 1 | 0 |
> | Cross-cutting rounding | 0 | 0 | 0 | 1 |
> | **Total** | **80** | **7** | **10** | **1** |
>
> The 10 still outstanding are the eight unencoded car-loan eligibility rules,
> the § 63(f) aged/blind additional standard deduction, and the documented MAGI
> proxy approximation. All three are feature additions rather than wrong
> values, and were deliberately left for a later batch.
>
> As originally written, no numeric value was changed. "Corrected" meant the
> correct value was established and stated in the row, awaiting approval.
> **Batch A (2026-08-15) has since applied a subset of those corrections** —
> see the remediation log immediately below. Rows that were applied are now
> marked **FIXED**; every other row is unchanged.

---

## Batch A remediation log — 2026-08-15

Four defects were corrected in code. Nothing was researched afresh; every change
below is the application of a correction already established in this document.

| # | Defect | Files changed | Outcome |
|---|---|---|---|
| 1 | Tips/overtime phase-out rounded **up**, and the `false` branch was half-up rather than floor | `phase-out.ts`, `tips.2026.json`, `overtime.2026.json` | **FIXED.** `fractionCountsAsFullStep` flipped `true → false` in both rules files, **and** the `false` branch of `phaseOutReduction` changed from `roundHalfUpToCent(excess / stepCents)` to `Math.floor(excess / stepCents)`. Both changes were required — flipping the flag alone would have left half-up rounding in place. |
| 2 | Two-senior joint returns over-paid: 6% applied once to the doubled `$12,000` | `deductions/senior.ts` | **FIXED.** The phase-out now runs against the per-person `$6,000` and the reduced figure is summed once per qualifying spouse (Schedule 1-A lines 33-37). Joint, both 65+, MAGI `$200,000` now returns **`$6,000`**, previously `$9,000`. `fullyPhasedOutAtCents` is now the per-person figure (`$250,000` joint) rather than a spouse-count-dependent one. |
| 3 | MFS not barred from the senior deduction | `senior.2026.json`, `types.ts`, `deductions/senior.ts` | **FIXED.** `requireJointIfMarried: true` added to the rules file and to `SeniorRules`; `computeSeniorDeduction` now refuses `MARRIED_SEPARATE`, matching how tips and overtime already do. |
| 4 | Occupation 200-block off by one from code 205; six titles missing | `occupations.2026.json` | **FIXED.** 205 is now "Dancers" and the six entries formerly at 205-210 shifted to 206-211. Added 509 Visual Artists, 510 Floral Designers, 611 Shoe and Leather Workers and Repairers, 810 Gas Pump Attendant. Count 66 → **71**, and the per-category counts now match the official 10/11/4/9/10/11/6/10. Only codes and titles recorded in this document were used; nothing was invented. |

**Explicitly NOT changed in Batch A:**

- **`car-loan.2026.json` rounding.** `fractionCountsAsFullStep` remains `true`
  and the car-loan phase-out still rounds **UP**. The asymmetry with tips and
  overtime is statutory (IRC § 163(h)(4)(C)(ii)(I) "or portion thereof";
  Schedule 1-A line 28 "increase the result to the next higher whole number")
  and is now guarded by a regression test that asserts an identical `$3,500`
  excess floors to 3 steps for tips and ceils to 4 steps for car-loan interest.
  The `roundingIsDeliberatelyDifferent` notes in the rules files were preserved.
- **The § 8 unresolved sub-dollar rounding question.** Still **UNRESOLVED**.
- **The § 63(f) aged/blind additional standard deduction** (`$1,650` / `$2,050`).
  Not modelled at all — a feature addition, not a correction. Still open.
- **The eight unencoded car-loan eligibility rules.** Still open, same reason.
- **`verified: false` flags** on all six rules files. Left as-is; unrelated
  corrections remain outstanding, so the launch gate must stay shut.

Gates after Batch A: `npm run typecheck` clean · `npm test` 63 passed (was 52) ·
engine purity check OK (no dependencies, no AI, no network, no env).

## Governing rule applied

Every row below carries either (a) a URL that was actually fetched and returned
content in this session, or (b) the word **UNRESOLVED**. No figure was filled in
from recall. Where a source was retrieved but did not state the figure, the row
says UNRESOLVED rather than guessing.

**No numeric value in any rules file was changed in this pass.** Each rules file
gained a `_verificationNote` key only. The corrections below are proposals for
the user to approve.

## Status vocabulary

| Status | Meaning |
|---|---|
| **VERIFIED** | Engine value confirmed identical to the primary source. |
| **CORRECTED** | Primary source gives a different value, or requires a rule the engine does not encode. The correct value is stated. |
| **UNRESOLVED** | No authoritative primary source located that states this figure. |
| **FIXED** | The correction stated in the row was applied in code on 2026-08-15 (Batch A). The row records what changed. |

## The three findings that block launch — all three FIXED on 2026-08-15

*(Kept verbatim below for the record. See the Batch A remediation log above for
what was done about each.)*

1. **`fractionCountsAsFullStep` is backwards for tips and overtime.** Schedule 1-A
   lines 11 and 19 require a partial `$1,000` step to be **dropped** (round the
   quotient **down**). The engine rounds **up**. This overstates the phase-out by
   up to `$100` per deduction and understates the user's deduction. The same flag
   is *correct* for car-loan interest, where the statute says "or portion
   thereof" and Schedule 1-A line 28 rounds **up** — the asymmetry is real and
   deliberate, and the three flags must not be harmonised.
2. **`senior.2026.json` has no `requireJointIfMarried`,** but IRC 151(d)(5)(C)(v)
   bars married-filing-separately taxpayers entirely. Separately, the 6%
   reduction runs against the **per-person** `$6,000`, then is entered once per
   qualifying spouse — so a two-senior joint return loses 12% of the excess, not
   6%. `senior.ts` applies it once against the doubled amount.
3. **`occupations.2026.json` is misaligned with the final published list.** The
   official list has 71 occupations; the file has 66, and the 200-block codes are
   off by one from 205 onward.

---

## 1. `packages/engine/src/rules/tips.2026.json`

Statutory basis: IRC § 224, added by P.L. 119-21 § 70201. Implementing rules:
Treasury Decision **TD 10044**, 26 CFR § 1.224-1, scheduled for Federal Register
publication 2026-04-13. Computation of record: **Schedule 1-A (Form 1040), Part II**.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Annual cap `capCents` | `2500000` ($25,000) | tips.2026.json:35 | **VERIFIED** $25,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 224(b)(1) as enacted: "The amount allowed as a deduction under this section for any taxable year shall not exceed $25,000." Independently confirmed on Schedule 1-A line 7. |
| Is the cap the same for joint filers? | single value, no joint variant | tips.2026.json:35 | **VERIFIED** — yes, `$25,000` regardless of filing status, and it is **per return, not per spouse** | https://public-inspection.federalregister.gov/2026-07104.pdf | 2026-08-15 | § 1.224-1(b)(1): "shall not exceed $25,000, **regardless of filing status**." The preamble rejects commenters who asked for a per-spouse cap: "the maximum deduction for an individual or a joint return is $25,000." Reg Example 3: two tipped spouses with $15,000 + $20,000 are cut to $25,000 combined. Engine's single `capCents` field is the right shape. |
| MAGI threshold, single `thresholdSingleCents` | `15000000` ($150,000) | tips.2026.json:38 | **VERIFIED** $150,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 224(b)(2)(A). Confirmed on Schedule 1-A line 9. |
| MAGI threshold, joint `thresholdJointCents` | `30000000` ($300,000) | tips.2026.json:39 | **VERIFIED** $300,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 224(b)(2)(A), "in the case of a joint return." Confirmed on Schedule 1-A line 9. |
| Phase-out **rate** `reductionPer1000Cents` | `10000` ($100 per $1,000) | tips.2026.json:40 | **VERIFIED** $100 per $1,000 of MAGI over the threshold | https://public-inspection.federalregister.gov/2026-07104.pdf | 2026-08-15 | § 1.224-1(b)(2) verbatim: "shall be further reduced (but not below zero) by $100 for each $1,000 by which the taxpayer's modified adjusted gross income exceeds $150,000 ($300,000 in the case of a joint return)." Reg Example 1 works it: MAGI $200,000, excess $50,000, ÷ $1,000 = 50, × $100 = $5,000 reduction. |
| Phase-out **rounding** `fractionCountsAsFullStep` | was `true`, now **`false`** | tips.2026.json:42 | **FIXED 2026-08-15 → `false`, and the false branch now FLOORS.** Flag flipped in `tips.2026.json`; `phase-out.ts` `false` branch changed from `roundHalfUpToCent(excess / stepCents)` to `Math.floor(excess / stepCents)`. Both were required. Regression tests added: `$150,001` MAGI → `$0` reduction (was `$100`); `$150,500.01` → `$0` (proves floor, not half-up); `$151,500` → `$100` (the form's own "decrease 1.5 to 1" example); `$153,500` on `$5,000` tips → `$4,700` deduction (was `$4,600`). | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | Schedule 1-A **line 11** verbatim: "Divide line 10 by $1,000. If the resulting number isn't a whole number, **decrease the result to the next lower whole number**. (For example, decrease 1.5 to 1, and decrease 0.05 to 0.)" The statute says "for each $1,000" with **no** "or portion thereof" — contrast § 163(h)(4)(C)(ii)(I) for car loans, which does say it. Neither TD 10044 nor the statute discusses fractions; the form is the operative instruction. **Second defect:** `phase-out.ts` implements the `false` branch as `roundHalfUpToCent(excess / stepCents)`, which is round-half-up, not floor. Flipping the flag alone is insufficient — the branch must become `Math.floor`. |
| Married-must-file-jointly `requireJointIfMarried` | `true` | tips.2026.json:43 | **VERIFIED** true | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 224(f): "If the taxpayer is a married individual (within the meaning of section 7703), this section shall apply only if the taxpayer and the taxpayer's spouse file a joint return for the taxable year." TD 10044 preamble: "the deduction is not available for a taxpayer who is married and files separately." |
| Phase-out applies **after** the cap (`model: PER_1000_STEP` ordering) | cap then phase-out | tips.2026.json:36-42 | **VERIFIED** cap first, then phase-out | https://public-inspection.federalregister.gov/2026-07104.pdf | 2026-08-15 | § 1.224-1(b)(2): "**After the application of the limitation in paragraph (b)(1)**…". TD 10044 preamble: "the phaseout based on MAGI is applied after applying the $25,000 limit." Schedule 1-A line 13 subtracts line 12 from line 7 (the capped amount). Engine ordering is correct. |
| Is the $25,000 cap inflation-indexed for 2026? | not indexed (fixed in the 2026 file) | tips.2026.json:35 | **VERIFIED** not indexed | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | IRC § 224 contains no inflation clause, and Rev. Proc. 2025-32 (the 2026 inflation adjustments) has **no** § 224 entry — its table of contents runs .01 through .63 and § 224 does not appear. The 2026 figures equal the 2025 statutory figures. |

---

## 2. `packages/engine/src/rules/overtime.2026.json`

Statutory basis: IRC § 225, added by P.L. 119-21 § 70202. No Treasury regulation
has been located; the operative guidance is **IRS Notice 2025-69** and IRS fact
sheet **FS-2026-13** (August 2026). Computation of record: **Schedule 1-A
(Form 1040), Part III**.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Cap, single `capSingleCents` | `1250000` ($12,500) | overtime.2026.json:35 | **VERIFIED** $12,500 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 225(b)(1): "shall not exceed $12,500 ($25,000 in the case of a joint return)." Confirmed on Schedule 1-A line 15 and FS-2026-13 A2. |
| Cap, joint `capJointCents` | `2500000` ($25,000) | overtime.2026.json:36 | **VERIFIED** $25,000 | https://www.irs.gov/pub/taxpros/fs-2026-13.pdf | 2026-08-15 | FS-2026-13 A2: "up to $12,500 of qualified overtime compensation earned for the year per individual tax return ($25,000 in the case of a joint return)." Unlike tips, overtime **does** have a distinct joint cap — the engine is right to carry two fields. |
| Only the FLSA § 7 **premium** qualifies `premiumShareOfRegularRateBps` | `5000` (0.5×) | overtime.2026.json:37 | **VERIFIED** — only the excess over the regular rate qualifies, i.e. the "half" of time-and-a-half | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 225(c)(1): "'qualified overtime compensation' means overtime compensation paid to an individual **required under section 7 of the Fair Labor Standards Act of 1938 that is in excess of the regular rate** at which such individual is employed." Notice 2025-69: "the 'half' portion of the 'one and one-half times' amount (the FLSA Overtime Premium)." The full 1.5× does **not** qualify. |
| Assumed pay multiplier `payMultiplierBps` | `15000` (1.5×) | overtime.2026.json:38 | **VERIFIED for the FLSA-required case only** — see notes | https://www.irs.gov/pub/irs-drop/n-25-69.pdf | 2026-08-15 | Correct for statutory time-and-a-half. But Notice 2025-69 is explicit that (a) pay **above** the FLSA-required premium does not qualify — "while the additional one-half times portion required by the FLSA may be qualified overtime, payments in excess of the FLSA-required premium are not", so under a double-time contract only the 0.5× is deductible; and (b) overtime paid to an **FLSA-ineligible** employee under state law or a CBA "is not qualified overtime compensation … regardless of applicable State law provisions." A fixed 1.5× input model silently mis-states both cases. Not a wrong constant — a missing eligibility gate. |
| MAGI threshold, single `thresholdSingleCents` | `15000000` ($150,000) | overtime.2026.json:41 | **VERIFIED** $150,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 225(b)(2)(A). Confirmed on Schedule 1-A line 17. |
| MAGI threshold, joint `thresholdJointCents` | `30000000` ($300,000) | overtime.2026.json:42 | **VERIFIED** $300,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 225(b)(2)(A). Confirmed on Schedule 1-A line 17 and FS-2026-13 A2. |
| Phase-out **rate** `reductionPer1000Cents` | `10000` ($100 per $1,000) | overtime.2026.json:43 | **VERIFIED** $100 per $1,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 225(b)(2)(A) is word-for-word identical to § 224(b)(2)(A): "reduced (but not below zero) by $100 for each $1,000 by which the taxpayer's modified adjusted gross income exceeds $150,000 ($300,000 in the case of a joint return)." Confirmed on Schedule 1-A line 20. |
| Phase-out **rounding** `fractionCountsAsFullStep` | was `true`, now **`false`** | overtime.2026.json:45 | **FIXED 2026-08-15 → `false`, and the false branch now FLOORS.** Same two-part fix as tips: flag flipped in `overtime.2026.json`, and the shared `phase-out.ts` `false` branch is now `Math.floor`. Guarded by a test asserting `overtime.phaseOut.fractionCountsAsFullStep === false`. | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | Schedule 1-A **line 19** verbatim: "Divide line 18 by $1,000. If the resulting number isn't a whole number, **decrease the result to the next lower whole number**. (For example, decrease 1.5 to 1, and decrease 0.05 to 0.)" Same defect and same fix as tips, including the `roundHalfUpToCent` vs `Math.floor` problem in `phase-out.ts`. |
| Married-must-file-jointly `requireJointIfMarried` | `true` | overtime.2026.json:46 | **VERIFIED** true | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 225(e), same wording as § 224(f). Notice 2025-69: "the deduction is not available for a taxpayer who is married and files separately." |
| Phase-out applies after the cap | cap then phase-out | overtime.2026.json:39-45 | **VERIFIED** cap first | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | § 225(b)(2)(A) "(after application of paragraph (1))". Schedule 1-A line 21 subtracts line 20 from line 15 (the capped amount). |
| Are the caps inflation-indexed for 2026? | not indexed | overtime.2026.json:35-36 | **VERIFIED** not indexed | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | IRC § 225 has no inflation clause and Rev. Proc. 2025-32 has no § 225 entry. 2026 = 2025 statutory figures. |

---

## 3. `packages/engine/src/rules/senior.2026.json`

**Every figure in this file was a placeholder. All of them could be verified.**
The deduction was located at **IRC § 151(d)(5)(C)**, added by P.L. 119-21 § 70103
— note it lives in the personal-exemption section, not § 63, which is why it is
easy to miss. Computation of record: **Schedule 1-A (Form 1040), Part V**.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Qualifying age `qualifyingAge` | `65` | senior.2026.json:31 | **VERIFIED** 65 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(ii): qualified individual = "the taxpayer, if the taxpayer **has attained age 65 before the close of the taxable year**". Note the test is age at year end, not age on a given date. The 2025 form phrases it "born before January 2, 1961"; for tax year 2026 the equivalent is **born before January 2, 1962**. The Schedule 1-A instructions add that a person reaches 65 on the **day before** their 65th birthday, and that someone who dies mid-year before reaching 65 does not qualify. |
| Amount per qualifying person `amountPerQualifyingPersonCents` | `600000` ($6,000) | senior.2026.json:32 | **VERIFIED** $6,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(i): "there shall be allowed a deduction in an amount equal to **$6,000 for each qualified individual** with respect to the taxpayer." Schedule 1-A instructions: "The maximum amount of the enhanced deduction for seniors is $6,000 per person … if both you and your spouse were born before January 2, 1961 … the maximum amount … is $12,000." The placeholder was right. |
| Phase-out model `PERCENT_OF_EXCESS` | percent of excess | senior.2026.json:34 | **VERIFIED** — a straight percentage of the excess, not a $1,000-step | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(iii)(I) reduces "by 6 percent of so much of the taxpayer's modified adjusted gross income as exceeds…". No stepping, no rounding convention. Schedule 1-A line 34: "Multiply line 33 by 6% (0.06)." Engine model choice is correct. |
| MAGI threshold, single `thresholdSingleCents` | `7500000` ($75,000) | senior.2026.json:35 | **VERIFIED** $75,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(iii)(I). Confirmed on Schedule 1-A line 32. The Schedule 1-A instructions state $75,000 applies to "Single, Head of household, or Qualifying surviving spouse" — matching the engine's rule that everything except MARRIED_JOINT uses the single threshold. |
| MAGI threshold, joint `thresholdJointCents` | `15000000` ($150,000) | senior.2026.json:36 | **VERIFIED** $150,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(iii)(I), "in the case of a joint return." Confirmed on Schedule 1-A line 32. |
| Phase-out rate `percentOfExcessBps` | `600` (6%) | senior.2026.json:37 | **VERIFIED** 6% | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(iii)(I): "reduced (but not below zero) by **6 percent** of so much of the taxpayer's modified adjusted gross income as exceeds $75,000 ($150,000 in the case of a joint return)." |
| Married-filing-separately treatment | was absent, now **`requireJointIfMarried: true`** | senior.2026.json:41 | **FIXED 2026-08-15 — `"requireJointIfMarried": true` added to the rules file, the field added to `SeniorRules` in `types.ts`, and `computeSeniorDeduction` now returns ineligible for `MARRIED_SEPARATE` with the reason "Married filing separately can't claim the senior deduction — the law requires a joint return for married filers." Matches the existing tips/overtime gate. Regression test added.** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(v) MARRIED INDIVIDUALS: "If the taxpayer is a married individual (within the meaning of section 7703), this subparagraph shall apply **only if** the taxpayer and the taxpayer's spouse file a joint return for the taxable year." Schedule 1-A instructions, Part V: "If you are married, you must file a joint return with your spouse to claim this deduction." The engine currently grants this deduction to a MARRIED_SEPARATE filer. `SeniorRules` in `types.ts` also lacks the field. |
| Must **both** spouses be 65+ on a joint return? | engine counts each qualifying spouse | senior.2026.json:32, `deductions/senior.ts` | **VERIFIED** — no, each 65+ spouse independently adds one $6,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(ii)(I)–(II) lists the taxpayer and, on a joint return, the spouse, each conditioned separately on attaining 65. Schedule 1-A lines 36a and 36b are independent. Engine's `qualifyingPersons` counter is the right shape. |
| **Order of operations**: is the 6% reduction applied per person or once to the doubled amount? | was once, to `qualifyingPersons × $6,000`; now **per person, then summed** | `deductions/senior.ts` | **FIXED 2026-08-15 — `computeSeniorDeduction` now calls `phaseOutStatus` with the per-person `$6,000`, subtracts, then multiplies by `qualifyingPersons`. Joint / both 65+ / MAGI `$200,000` returns `$6,000` (was `$9,000`); one senior on the same return returns `$3,000`. `phaseOut.reductionCents` is reported as the household total (`qualifyingPersons × per-person reduction`) so `cappedAmount − reduction = deduction` still holds, while `fullyPhasedOutAtCents` is now the per-person `$250,000` joint figure instead of a spouse-count-dependent `$350,000`. Three regression tests added.** | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | Schedule 1-A lines 33-37: line 34 = 6% of the excess; line 35 = **$6,000** − line 34; lines 36a **and** 36b each enter line 35; line 37 adds them. So a two-senior joint return loses **2 × 6% = 12%** of the excess. The statute agrees: § 151(d)(5)(C)(iii)(I) reduces "the $6,000 amount in clause (i)", which is the per-individual amount. **Worked example:** joint, both 65+, MAGI $200,000. Per the form: excess $50,000 → line 34 $3,000 → line 35 $3,000 → line 37 **$6,000**. Per `senior.ts`: amount $12,000 − 6% × $50,000 = **$9,000**. A **$3,000** overstatement of the deduction. |
| Is $6,000 / $75,000 / $150,000 inflation-indexed for 2026? | not indexed | senior.2026.json:32,35,36 | **VERIFIED** not indexed | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | § 151(d)(5)(C) contains no inflation clause; Rev. Proc. 2025-32 has no entry for it (its § 63 entry, section 4.14, covers only the standard deduction and the § 63(f) aged/blind amounts). Fixed for tax years 2025-2028. |
| Sunset | not encoded beyond `effectiveTo` 2026-12-31 | senior.2026.json:5 | **VERIFIED** — deduction allowed only for a taxable year beginning before 2029-01-01 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 151(d)(5)(C)(i). Also effective only for taxable years beginning after 2024-12-31 (§ 70103(c)). The per-year file naming already handles this; do not clone this file past tax year 2028. |

---

## 4. `packages/engine/src/rules/car-loan.2026.json`

**Every figure in this file was a placeholder. All of them could be verified, and
every one of them was already correct.** The deduction is at **IRC § 163(h)(4)**,
added by P.L. 119-21 § 70203 — it operates by carving qualified passenger vehicle
loan interest out of the definition of non-deductible "personal interest."
Computation of record: **Schedule 1-A (Form 1040), Part IV**.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Annual cap `capCents` | `1000000` ($10,000) | car-loan.2026.json:31 | **VERIFIED** $10,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(C)(i) DOLLAR LIMIT: "The amount of interest taken into account by a taxpayer under subparagraph (B) for any taxable year shall not exceed $10,000." Confirmed on Schedule 1-A line 24 and in the Schedule 1-A instructions: "You can't deduct more than $10,000 of the QPVLI you paid or accrued." |
| MAGI threshold, single `thresholdSingleCents` | `10000000` ($100,000) | car-loan.2026.json:34 | **VERIFIED** $100,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(C)(ii)(I). Confirmed on Schedule 1-A line 26; the instructions say "All other filing statuses—$100,000." |
| MAGI threshold, joint `thresholdJointCents` | `20000000` ($200,000) | car-loan.2026.json:35 | **VERIFIED** $200,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(C)(ii)(I), "in the case of a joint return." Confirmed on Schedule 1-A line 26; instructions: "Married filing jointly—$200,000." |
| Phase-out **rate** `reductionPer1000Cents` | `20000` ($200 per $1,000) | car-loan.2026.json:36 | **VERIFIED** $200 per $1,000 | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(C)(ii)(I): "reduced (but not below zero) by **$200 for each $1,000 (or portion thereof)** by which the modified adjusted gross income of the taxpayer for the taxable year exceeds $100,000 ($200,000 in the case of a joint return)." Confirmed on Schedule 1-A line 29. Rate is **double** the tips/overtime rate — 5× steeper relative to the cap. |
| Phase-out **rounding** `fractionCountsAsFullStep` | `true` | car-loan.2026.json:37 | **VERIFIED true — UNCHANGED by Batch A and still rounds UP.** Confirmed byte-for-byte untouched on 2026-08-15 while tips and overtime were flipped to `false`. Now protected by two tests: one asserting `carLoan.phaseOut.fractionCountsAsFullStep === true`, and one showing an identical `$3,500` excess produces 3 steps under the tips rule and 4 steps under the car-loan rule. The `roundingIsDeliberatelyDifferent` note in the rules file was preserved. | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | The statute's "**(or portion thereof)**" has no counterpart in § 224 or § 225. Schedule 1-A **line 28** confirms: "Divide line 27 by $1,000. If the resulting number isn't a whole number, **increase the result to the next higher whole number**. (For example, increase 1.5 to 2, and increase 0.05 to 1.)" Do not "harmonise" this flag with the other two files — the asymmetry is in the statute. |
| Loan origination date `loanOriginatedOnOrAfter` | `"2025-01-01"` | car-loan.2026.json:39 | **VERIFIED** — equivalent to the statute's "incurred after December 31, 2024" | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(B)(i): "indebtedness incurred by the taxpayer **after December 31, 2024**". Schedule 1-A instructions requirement 1: "Your loan was originated after December 31, 2024." The engine's inclusive 2025-01-01 boundary is arithmetically identical. |
| New-vehicle requirement `requiresNewVehicle` | `true` | car-loan.2026.json:40 | **VERIFIED** true | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(D)(i): "the original use of which commences with the taxpayer." Schedule 1-A instructions: "The original use of the vehicle starts with you (**a used vehicle does not qualify**)." |
| US final assembly `requiresFinalAssemblyInUS` | `true` | car-loan.2026.json:41 | **VERIFIED** true | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(D) flush text: "Such term shall not include any vehicle the final assembly of which did not occur within the United States." "Final assembly" is defined at § 163(h)(4)(E)(i). |
| Personal-use requirement `requiresPersonalUse` | `true` | car-loan.2026.json:42 | **VERIFIED** true | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(B)(i): "for the purchase of, and that is secured by a first lien on, an applicable passenger vehicle **for personal use**." Schedule 1-A instructions gloss it as "you don't expect it to be used predominantly for business or commercial use." |
| **GVWR limit** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — add: gross vehicle weight rating must be under 14,000 lbs** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(D)(vi): "which has a gross vehicle weight rating of **less than 14,000 pounds**." Confirmed in the Schedule 1-A instructions. |
| **Vehicle class limit** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — must be a car, minivan, van, SUV, pickup truck or motorcycle, with at least 2 wheels, manufactured primarily for public roads (not rail), and a motor vehicle for Clean Air Act title II purposes** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(D)(ii)–(v). Confirmed in the Schedule 1-A instructions. |
| **First-lien requirement** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — the loan must be secured by a first lien on the vehicle** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(B)(i). Schedule 1-A instructions requirement 5: "Your loan is secured by a first lien on the purchased APV." |
| **Lease exclusion** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — lease financing is excluded outright** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(B)(ii)(III): "Any lease financing." Schedule 1-A instructions requirement 3: "(lease payments do not qualify)." |
| **Other statutory exclusions** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — also excluded: fleet-sale loans; commercial vehicles not used personally; salvage-title vehicles; vehicles bought for scrap or parts; loans owed to a related party under § 267(b)/§ 707(b)(1)** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(B)(ii)(I),(II),(IV),(V) and § 163(h)(4)(E)(iii). |
| **Refinancing treatment** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — refinancing qualifies, but only up to the outstanding balance of the refinanced loan and only if the new loan is first-lien secured on the same vehicle** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4)(E)(ii): "…but only to the extent the amount of such resulting indebtedness does not exceed the amount of such refinanced indebtedness." Schedule 1-A instructions: "The loan amount is limited to the outstanding balance of the refinanced loan as of the date of the refinancing." |
| **VIN / assembly substantiation** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — the VIN of every applicable vehicle must appear on the return; final assembly may be substantiated from the vehicle information label on the dealer's premises** | https://www.irs.gov/pub/irs-pdf/i1040gi.pdf | 2026-08-15 | § 163(h)(4)(B)(iii) VIN REQUIREMENT: "Interest shall not be treated as qualified passenger vehicle loan interest … unless the taxpayer includes the vehicle identification number … on the return of tax." Schedule 1-A line 22 has VIN entry columns. Instructions on assembly: "The location of final assembly will be listed on the vehicle information label attached to each vehicle on a dealer's premises. You can rely on that information label." Instructions also address a lemon-law replacement vehicle's VIN and a change of obligor on death, citing **Proposed Regulations § 1.163-16** — a final regulation should be watched for. |
| **Financeable amounts** | **not encoded** | car-loan.2026.json (no key) | **CORRECTED — qualifying principal includes items customarily financed in the purchase (service plans, extended warranties, sales tax, vehicle fees) but NOT liability insurance, a trailer, or rolled-in negative equity from a trade-in** | https://www.irs.gov/pub/irs-pdf/i1040gi.pdf | 2026-08-15 | Schedule 1-A instructions, "Loan amount." Matters for any UI that asks the user for their loan balance. |
| Married-must-file-jointly | field absent | car-loan.2026.json (no key) | **VERIFIED — correctly absent; there is no joint-filing requirement and no SSN requirement for this deduction** | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf | 2026-08-15 | § 163(h)(4) contains no analogue to § 224(f) / § 225(e) / § 151(d)(5)(C)(v). This is the **only one of the four** deductions a married-filing-separately taxpayer can claim — a genuinely non-obvious product insight, and worth surfacing. |
| Are $10,000 / $100,000 / $200,000 inflation-indexed for 2026? | not indexed | car-loan.2026.json:31,34,35 | **VERIFIED** not indexed | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | § 163(h)(4) has no inflation clause; Rev. Proc. 2025-32 has no entry for it. Applies to taxable years beginning after 2024-12-31 and before 2029-01-01 (§ 163(h)(4)(A)). |

---

## 5. `packages/engine/src/rules/brackets.2026.json`

**The real published inflation adjustments were found.** They are in **Rev. Proc.
2025-32**, issued 2025-10-09, published in Internal Revenue Bulletin 2025-45 —
section **4.01 Tax Rate Tables** (Tables 1-4) and section **4.14 Standard
Deduction**. The PDF was downloaded and its text extracted directly; the tables
were read verbatim.

**Result: every one of the 28 numbers in this file matches the published
figures.** What the file called "projected" turned out to be correct. Rev. Proc.
2025-32's Table 1 = MARRIED_JOINT, Table 2 = HEAD_OF_HOUSEHOLD, Table 3 = SINGLE,
Table 4 = MARRIED_SEPARATE.

Primary source for every row in this section, fetched 2026-08-15:
**https://www.irs.gov/pub/irs-drop/rp-25-32.pdf**
Cross-checked against the IRS newsroom release (IR-2025-103):
**https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill**
and the bulletin HTML: **https://www.irs.gov/irb/2025-45_IRB**

### Standard deduction (Rev. Proc. 2025-32 § 4.14(1))

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Standard deduction, SINGLE | `1610000` ($16,100) | brackets.2026.json:28 | **VERIFIED** $16,100 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | "Unmarried Individuals (other than Surviving Spouses and Heads of Households) (§ 1(j)(2)(C)) — $16,100". |
| Standard deduction, MARRIED_JOINT | `3220000` ($32,200) | brackets.2026.json:29 | **VERIFIED** $32,200 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | "Married Individuals Filing Joint Returns and Surviving Spouses (§ 1(j)(2)(A)) — $32,200". |
| Standard deduction, MARRIED_SEPARATE | `1610000` ($16,100) | brackets.2026.json:30 | **VERIFIED** $16,100 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | "Married Individuals Filing Separate Returns (§ 1(j)(2)(D)) — $16,100". |
| Standard deduction, HEAD_OF_HOUSEHOLD | `2415000` ($24,150) | brackets.2026.json:31 | **VERIFIED** $24,150 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | "Heads of Households (§ 1(j)(2)(B)) — $24,150". |

### Bracket boundaries (Rev. Proc. 2025-32 § 4.01)

All rates verified as 10 / 12 / 22 / 24 / 32 / 35 / 37 percent for all four
statuses (`rateBps` 1000/1200/2200/2400/3200/3500/3700), matching the four tables.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| SINGLE 10%→12% boundary | `1240000` ($12,400) | brackets.2026.json:35 | **VERIFIED** $12,400 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 3, "Not over $12,400". |
| SINGLE 12%→22% | `5040000` ($50,400) | brackets.2026.json:36 | **VERIFIED** $50,400 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 3. |
| SINGLE 22%→24% | `10570000` ($105,700) | brackets.2026.json:37 | **VERIFIED** $105,700 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 3. |
| SINGLE 24%→32% | `20177500` ($201,775) | brackets.2026.json:38 | **VERIFIED** $201,775 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 3. Note the odd $25 — not a typo. |
| SINGLE 32%→35% | `25622500` ($256,225) | brackets.2026.json:39 | **VERIFIED** $256,225 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 3. |
| SINGLE 35%→37% | `64060000` ($640,600) | brackets.2026.json:40 | **VERIFIED** $640,600 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 3, "Over $640,600 — $192,979.25 plus 37%…". |
| SINGLE top bracket open-ended | `null` | brackets.2026.json:41 | **VERIFIED** | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 3 has no upper bound. |
| MARRIED_JOINT 10%→12% | `2480000` ($24,800) | brackets.2026.json:44 | **VERIFIED** $24,800 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 1, "Not over $24,800". |
| MARRIED_JOINT 12%→22% | `10080000` ($100,800) | brackets.2026.json:45 | **VERIFIED** $100,800 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 1. |
| MARRIED_JOINT 22%→24% | `21140000` ($211,400) | brackets.2026.json:46 | **VERIFIED** $211,400 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 1. |
| MARRIED_JOINT 24%→32% | `40355000` ($403,550) | brackets.2026.json:47 | **VERIFIED** $403,550 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 1. |
| MARRIED_JOINT 32%→35% | `51245000` ($512,450) | brackets.2026.json:48 | **VERIFIED** $512,450 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 1. |
| MARRIED_JOINT 35%→37% | `76870000` ($768,700) | brackets.2026.json:49 | **VERIFIED** $768,700 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 1, "Over $768,700 — $206,583.50 plus 37%…". |
| MARRIED_JOINT top bracket open-ended | `null` | brackets.2026.json:50 | **VERIFIED** | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 1. |
| MARRIED_SEPARATE 10%→12% | `1240000` ($12,400) | brackets.2026.json:53 | **VERIFIED** $12,400 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 4. |
| MARRIED_SEPARATE 12%→22% | `5040000` ($50,400) | brackets.2026.json:54 | **VERIFIED** $50,400 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 4. |
| MARRIED_SEPARATE 22%→24% | `10570000` ($105,700) | brackets.2026.json:55 | **VERIFIED** $105,700 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 4. |
| MARRIED_SEPARATE 24%→32% | `20177500` ($201,775) | brackets.2026.json:56 | **VERIFIED** $201,775 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 4. |
| MARRIED_SEPARATE 32%→35% | `25622500` ($256,225) | brackets.2026.json:57 | **VERIFIED** $256,225 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 4. |
| MARRIED_SEPARATE 35%→37% | `38435000` ($384,350) | brackets.2026.json:58 | **VERIFIED** $384,350 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 4, "Over $384,350 — $103,291.75 plus 37%…". This is the one boundary where MFS is **not** half-or-equal to SINGLE's — MFS enters 37% far earlier ($384,350 vs $640,600). Confirmed distinct. |
| MARRIED_SEPARATE top bracket open-ended | `null` | brackets.2026.json:59 | **VERIFIED** | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 4. |
| HEAD_OF_HOUSEHOLD 10%→12% | `1770000` ($17,700) | brackets.2026.json:62 | **VERIFIED** $17,700 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 2, "Not over $17,700". |
| HEAD_OF_HOUSEHOLD 12%→22% | `6745000` ($67,450) | brackets.2026.json:63 | **VERIFIED** $67,450 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 2. |
| HEAD_OF_HOUSEHOLD 22%→24% | `10570000` ($105,700) | brackets.2026.json:64 | **VERIFIED** $105,700 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 2. |
| HEAD_OF_HOUSEHOLD 24%→32% | `20175000` ($201,750) | brackets.2026.json:65 | **VERIFIED** $201,750 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 2. Note: **$201,750**, deliberately $25 below SINGLE's $201,775. The engine already has this right. |
| HEAD_OF_HOUSEHOLD 32%→35% | `25620000` ($256,200) | brackets.2026.json:66 | **VERIFIED** $256,200 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 2. Again $25 below SINGLE's $256,225. |
| HEAD_OF_HOUSEHOLD 35%→37% | `64060000` ($640,600) | brackets.2026.json:67 | **VERIFIED** $640,600 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 2, "Over $640,600 — $191,171 plus 37%…". |
| HEAD_OF_HOUSEHOLD top bracket open-ended | `null` | brackets.2026.json:68 | **VERIFIED** | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Table 2. |

### The 65+ additional standard deduction — separate from the senior deduction

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| § 63(f) additional standard deduction for the aged/blind | **not modelled** | brackets.2026.json (no key) | **STILL OPEN after Batch A — deliberately deferred.** This is a real gap, but the amount is not modelled *at all*, so closing it is a feature addition rather than a correction to a wrong figure. Not in Batch A scope. Original finding kept verbatim: **CORRECTED — $1,650 for 2026, increased to $2,050 if the individual is also unmarried and not a surviving spouse. It is SEPARATE from and STACKS WITH the new $6,000 senior deduction.** | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Rev. Proc. 2025-32 § 4.14(3) "Aged or blind": "the additional standard deduction amount under § 63(f) for the aged or the blind is **$1,650**. The additional standard deduction amount is increased to **$2,050** if the individual is also unmarried and not a surviving spouse." That these are two different deductions is confirmed structurally: the § 63(f) amount is part of the standard deduction on Form 1040 line 12, whereas the enhanced senior deduction flows through Schedule 1-A line 37 → line 38 → Form 1040 line 13b, and is available whether or not the taxpayer itemises. **Impact:** every 65+ scenario's "tax saved" is currently computed off an understated total deduction — for a single 65+ filer by $1,650-$2,050 of deduction, and by up to $3,300 for a joint return with two 65+ spouses. This changes the marginal rate a deduction is valued at, so it can change a headline number. |
| Dependent standard deduction, § 63(c)(5) | not modelled | — | Informational: for 2026 the greater of $1,350 or earned income + $450 | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf | 2026-08-15 | Rev. Proc. 2025-32 § 4.14(2). Out of v1 scope; recorded so it is not rediscovered. |

---

## 6. `packages/engine/src/rules/occupations.2026.json`

### Is the official list published in final form? **Yes.**

- **Official IRS list page (the canonical URL to cite):**
  https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024
  (short URL `https://www.irs.gov/tippedoccupations` redirects here; page footer
  reads "Page Last Reviewed or Updated: 28-Jun-2026")
- **Final regulation:** Treasury Decision **TD 10044**, RIN **1545-BR63**,
  *Occupations that Customarily and Regularly Received Tips; Definition of
  Qualified Tips*, 26 CFR § 1.224-1(h) Table 1. Scheduled for Federal Register
  publication **2026-04-13**, effective 60 days after publication. Full text:
  https://public-inspection.federalregister.gov/2026-07104.pdf
- **Status: final rule, not proposed.** The ACTION line reads "Final rule."

### Code system

Three-digit **Treasury Tipped Occupation Code (TTOC)**: leading digit = category,
last two digits = the occupation within it. Each row also carries an occupation
description, illustrative examples, and a related BLS **Standard Occupational
Classification (SOC)** code. TD 10044's preamble is explicit that the illustrative
examples are **not** exhaustive — "There may be other occupations that fall within
a TTOC that are not listed as an illustrative example" — so the engine's
`keywords` matching approach is directionally right, but a non-match must never be
presented to a user as a disqualification.

**Eight categories, 71 occupations total:**
101-110 Beverage and Food Service (10) · 201-211 Entertainment and Events (11) ·
301-304 Hospitality and Guest Services (4) · 401-409 Home Services (9) ·
501-510 Personal Services (10) · 601-611 Personal Appearance and Wellness (11) ·
701-706 Recreation and Instruction (6) · 801-810 Transportation and Delivery (10).

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Is an official list published, and is it final? | file assumes "representative subset", `verified: false` | occupations.2026.json:6 | **VERIFIED — yes, published and final** | https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 | 2026-08-15 | Both the IRS list page and TD 10044 § 1.224-1(h) Table 1 were fetched and the codes enumerated programmatically from each; both yield the same 71 codes. |
| Number of occupations | was 66 entries, now **71** | occupations.2026.json:`occupations[]` | **FIXED 2026-08-15 → 71.** Per-category counts now 10/11/4/9/10/11/6/10, matching the official ranges exactly. A test asserts the count is 71 with no duplicate codes. | https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 | 2026-08-15 | Counted by extracting every three-digit code from the fetched page (71) and independently from the TD 10044 PDF table (71). |
| Codes present in the engine but not on the official list | none | — | **VERIFIED — no invalid codes** | https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 | 2026-08-15 | Set difference computed: every engine code exists on the official list. Nothing has to be removed. |
| Missing occupations | was 5 codes absent, now **none** | occupations.2026.json:`occupations[]` | **FIXED 2026-08-15 — added 205 Dancers, 509 Visual Artists, 510 Floral Designers, 611 Shoe and Leather Workers and Repairers, 810 Gas Pump Attendant; 211 Locker Room, Coatroom, and Dressing Room Attendants arrived via the 200-block shift (see next row). Codes and titles taken verbatim from this document; `keywords[]` are search aids only, not authoritative, and were written to match each title. No code/title pair not recorded here was invented.** | https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 | 2026-08-15 | Six titles are missing; five codes show as absent because the 200-block is shifted (see next row), which masks 205. 66 + 5 absent codes = 71. |
| **200-block code alignment** | was off by one from 205 onward, now **aligned** | occupations.2026.json:`occupations[]` | **FIXED 2026-08-15 — 205 is now "Dancers" and the six entries formerly at 205-210 shifted to 206 Musicians and Singers, 207 Disc Jockeys Except Radio, 208 Entertainers and Performers, 209 Digital Content Creators, 210 Ushers Lobby Attendants and Ticket Takers, 211 Locker Room Coatroom and Dressing Room Attendants — official plural titles adopted verbatim for the whole block. The "dancer" keyword moved off 208 onto 205 so search resolves correctly too. Regression test: code 205 → "Dancers".** | https://public-inspection.federalregister.gov/2026-07104.pdf | 2026-08-15 | Official: 205 Dancers · 206 Musicians and Singers · 207 Disc Jockeys, Except Radio · 208 Entertainers and Performers · 209 Digital Content Creators · 210 Ushers, Lobby Attendants, and Ticket Takers · 211 Locker Room, Coatroom, and Dressing Room Attendants. Engine: 205 "Musician or singer" · 206 "Disc jockey (except radio)" · 207 "Entertainer or performer" · 208 "Digital content creator" · 209 "Usher…" · 210 "Locker room…" · (no 211). **This is the highest-severity item in this file** — a user whose W-2 box 14b reads TTOC 205 would be shown "Musician or singer" by this app when the IRS means "Dancers". Codes 101-110, 201-204, 301-304, 401-409, 501-508, 601-610, 701-706 and 801-809 all align correctly. |
| Titles for codes 100-110, 301-409, 601-610, 701-810 | engine's shortened singular titles | occupations.2026.json:`occupations[]` | **VERIFIED as the same occupations**; official titles are plural (e.g. "Bartenders", "Nannies and Babysitters") | https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 | 2026-08-15 | Cosmetic only, but adopting the official strings verbatim is advisable so a user can match what they see on IRS.gov. Two substantive wording gaps: official 506 is "Pet **and show animal** caretakers" (engine: "Pet caretaker") and official 103 is "Food **or beverage** servers, non-restaurant". |
| Category names | 8 categories, ampersand form ("Beverage & Food Service") | occupations.2026.json:`occupations[].category` | **VERIFIED — the 8 categories and their code ranges match**; official form spells out "and" | https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 | 2026-08-15 | Category set and boundaries are correct. |
| W-2 linkage for the TTOC | not modelled in this file | — | **VERIFIED — for tax year 2026 the employer reports the TTOC in new Form W-2 box 14b (up to two codes), with total cash tips in box 12 code TP and qualified overtime in box 12 code TT** | https://www.irs.gov/pub/irs-pdf/iw2w3.pdf | 2026-08-15 | 2026 General Instructions for Forms W-2 and W-3: "New box 12, code TP, will be used to report the total…", "New box 12, code TT, will be used to report the total…", "New box 14b will be used to report the Treasury Tipped Occupation Code(s)… Enter up to two code(s)." This also resolves the generic "dedicated entry" wording flagged as item 6 of VERIFICATION-NEEDED.md, at least for the box/code question. For **tax year 2025** there are no such boxes at all — Notice 2025-69 confirms no 2025 form changes, so 2025 amounts arrive via box 14 free text or a separate employer statement. |

---

## 7. Ordering — do these deductions reduce MAGI?

**The engine's assumption is CORRECT. They do not.** Not for their own phase-out,
and not for each other's. This was verified structurally on the actual forms
rather than inferred.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Do the four OBBBA deductions reduce MAGI for their own phase-out? | assumed **no** | `magi.ts` (module docstring) | **VERIFIED — no** | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | Schedule 1-A **Part I** computes MAGI once, at line 3, from Form 1040 line 11b plus § 911/931/933 exclusions (lines 2a-2e). Parts II-V then each read that single line-3 figure (lines 8, 16, 25, 31). Nothing computed in Parts II-V feeds back into Part I. |
| Do they reduce MAGI for **each other's** phase-outs? | assumed **no** | `magi.ts` | **VERIFIED — no** | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | All four parts read the same line 3. There is no sequencing between Parts II, III, IV and V — they are independent, and the deductions can be computed in any order. |
| Are they below-the-line (do they sit outside AGI)? | assumed yes | `magi.ts` | **VERIFIED — yes** | https://www.irs.gov/pub/irs-pdf/f1040.pdf | 2026-08-15 | Form 1040 line **11a** = "This is your adjusted gross income"; line **11b** = "Amount from line 11a (adjusted gross income)". Schedule 1-A line 38 lands on Form 1040 line **13b**; line 14 adds 12e + 13a + 13b; line 15 subtracts line 14 from line **11b** to reach taxable income. So the deductions are subtracted **after** AGI, and each statute defines MAGI as AGI + § 911/931/933 — a definition that cannot include them. |
| Are they available to non-itemizers? | engine treats them as always available | `deductions/*.ts` | **VERIFIED — yes, all four** | https://www.irs.gov/pub/irs-pdf/i1040gi.pdf | 2026-08-15 | Instructions for Schedule 1-A: "You can claim these deductions whether you claim the standard deduction or itemize deductions on Schedule A." Statutory basis: P.L. 119-21 §§ 70201(b), 70202(b), 70203(b) each add a paragraph to IRC § 63(b) (paragraphs (5), (6), (7) respectively). |
| Engine's MAGI proxy = wages + other income + tips + gross overtime | income proxy, not AGI | `magi.ts:36-50` | **Documented approximation, not a verified figure — see notes** | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf | 2026-08-15 | The statutory MAGI is **AGI** + § 911/931/933 exclusions. AGI is gross income *less* above-the-line adjustments (Schedule 1 Part II: HSA contributions, deductible self-employment tax, self-employed health insurance, traditional IRA and SEP/SIMPLE contributions, student-loan interest, educator expenses…). The engine's proxy has no subtraction term, so it **overstates MAGI** for anyone with such adjustments and can therefore understate their deduction near a phase-out edge. This is flagged in the `magi.ts` docstring as a documented v1 approximation; it is a scope decision for the user, not a wrong constant. |

---

## 8. Unresolved

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Sub-dollar rounding convention for all four deduction computations | engine computes in integer cents, `roundHalfUpToCent` | `money.ts`, `phase-out.ts` | **STILL UNRESOLVED after Batch A — deliberately not touched.** Batch A changed only the `$1,000`-*step* rounding in `phase-out.ts`, which the sources do state. The sub-dollar/whole-dollar question below is a different question and no source was consulted for it in Batch A. | — | 2026-08-15 | Schedule 1-A and its instructions specify the **$1,000-step** rounding for tips, overtime and car loan (verified above) and the 6% multiplication for seniors, but state no rule for cents. The Form 1040 instructions offer optional whole-dollar rounding generally; whether the IRS expects Schedule 1-A entries rounded to whole dollars, and at which line, was not stated in any source fetched. Practically this can move a result by a dollar. Marked UNRESOLVED rather than assumed. To close it: read the "Rounding off to whole dollars" passage in the Form 1040 instructions and the Schedule 1-A line-by-line instructions for any explicit statement, and confirm against a worked IRS example. |

### Questions asked that were answered, and are therefore NOT unresolved

- Tips/overtime phase-out **rate**: confirmed $100 per $1,000 (statute + TD 10044 + Schedule 1-A).
- Tips/overtime phase-out **rounding**: confirmed round **down** (Schedule 1-A lines 11 and 19) — engine is wrong.
- Senior deduction: **every** placeholder confirmed correct in value; two structural defects found.
- Car-loan deduction: **every** placeholder confirmed correct in value; eight unencoded eligibility rules found.
- 2026 brackets and standard deduction: real published figures found in Rev. Proc. 2025-32; all 28 numbers already correct.
- Ordering: confirmed the deductions do not reduce MAGI.
- Occupation list: confirmed published and final, 71 occupations, URL recorded.

---

## Sources actually fetched in this pass

Every URL below returned content that was read in this session. PDFs were
downloaded and their text extracted locally, so quotations are from the documents
themselves, not from search-result snippets.

| # | Document | URL |
|---|---|---|
| 1 | **P.L. 119-21 (OBBBA) as enacted**, 139 Stat. 72 — §§ 70103, 70201, 70202, 70203 read verbatim | https://www.govinfo.gov/content/pkg/PLAW-119publ21/pdf/PLAW-119publ21.pdf |
| 2 | **Rev. Proc. 2025-32** — 2026 inflation adjustments; §§ 4.01 and 4.14 read verbatim | https://www.irs.gov/pub/irs-drop/rp-25-32.pdf |
| 3 | IRS newsroom release IR-2025-103 announcing the 2026 adjustments | https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill |
| 4 | Internal Revenue Bulletin 2025-45 (contains Rev. Proc. 2025-32) | https://www.irs.gov/irb/2025-45_IRB |
| 5 | **TD 10044** — final regulations, 26 CFR § 1.224-1, occupations + definition of qualified tips (108 pp.) | https://public-inspection.federalregister.gov/2026-07104.pdf |
| 6 | **Schedule 1-A (Form 1040), Additional Deductions** — the computation of record for all four deductions | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf |
| 7 | Draft Schedule 1-A (confirmed still the 2025 revision; no 2026 form published yet) | https://www.irs.gov/pub/irs-dft/f1040s1a--dft.pdf |
| 8 | **Instructions for Form 1040** incl. the Instructions for Schedule 1-A (126 pp.) | https://www.irs.gov/pub/irs-pdf/i1040gi.pdf |
| 9 | **Form 1040** — confirmed line 11a = AGI, 11b = AGI, 13b = Schedule 1-A total | https://www.irs.gov/pub/irs-pdf/f1040.pdf |
| 10 | **Notice 2025-69** — guidance on qualified tips and qualified overtime for TY2025 | https://www.irs.gov/pub/irs-drop/n-25-69.pdf |
| 11 | **FS-2026-13** (Aug 2026) — IRS FAQ on the qualified overtime deduction; supersedes FS-2026-01 | https://www.irs.gov/pub/taxpros/fs-2026-13.pdf |
| 12 | **Official list of tipped occupations** — all 71 TTOCs enumerated from the page itself | https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 |
| 13 | **2026 General Instructions for Forms W-2 and W-3** — box 12 codes TP/TT, new box 14b | https://www.irs.gov/pub/irs-pdf/iw2w3.pdf |

## Sources that were unreachable

| Source | Failure | Worked around by |
|---|---|---|
| `ecfr.gov` | Bot-block redirect (pre-calibrated; not retried) | TD 10044 full text from public-inspection.federalregister.gov |
| `congress.gov` CRS HTML | 403 (pre-calibrated; not retried) | Statute read from the enrolled public law on govinfo.gov |
| `www.federalregister.gov` document pages | HTTP 302 to `unblock.federalregister.gov` — bot block. The final-rule page for TD 10044 could not be fetched from this host. | `https://public-inspection.federalregister.gov/2026-07104.pdf` served the identical 108-page document and was fully readable |
| `uscode.house.gov` | TCP connect timeout after 75 s, repeatedly, for §§ 224, 225, 163 and 63 | P.L. 119-21 as enacted (govinfo.gov) gives the same operative text; every § 224/§ 225/§ 163(h)(4)/§ 151(d)(5)(C) quotation in this document comes from the enrolled bill |

**Nothing material was lost to these blocks.** Every figure in scope was reached
through an alternative primary source, with the single exception noted in § 8.

**Note on the § 225 (overtime) rulemaking:** no Treasury regulation implementing
IRC § 225 was located. The operative published guidance is Notice 2025-69 and
FS-2026-13. Because `federalregister.gov` search could not be browsed directly,
absence of a regulation is **not** established — re-check before launch.

---

## Recommended follow-up, in severity order

Items 1-4 were **DONE in Batch A on 2026-08-15**; kept for the record with their
outcome. Items 5-7 remain outstanding.

1. ~~`phase-out.ts` — tips and overtime must **floor** the $1,000 step. Two changes:
   flip `fractionCountsAsFullStep` to `false` in `tips.2026.json` and
   `overtime.2026.json`, **and** change the `false` branch from
   `roundHalfUpToCent(excess / stepCents)` to `Math.floor(excess / stepCents)`.
   Leave `car-loan.2026.json` at `true`.~~ **DONE.** Both changes applied;
   `car-loan.2026.json` left at `true`. Tests added at an exact multiple, at
   fractional excesses in both directions, at the form's own 1.5→1 example, and
   a paired tips-vs-car-loan test on an identical excess.
2. ~~`senior.ts` — apply the 6% reduction to the per-person $6,000, then multiply by
   the number of qualifying persons.~~ **DONE.** Joint, both 65+, MAGI $200,000
   now returns $6,000.
3. ~~`senior.2026.json` + `types.ts` — add `requireJointIfMarried: true` and gate
   MARRIED_SEPARATE.~~ **DONE.**
4. ~~`occupations.2026.json` — 71 official rows; fix the 200-block.~~ **DONE**, but
   note the method differs from the original recommendation: the file was
   **hand-patched, not replaced wholesale**, because only the codes and titles
   recorded in this document could be used without re-fetching the IRS page.
   The 200-block, the four additions, and the count are all correct. **Still
   outstanding:** rows outside the 200-block keep the engine's shortened
   singular titles, including the two substantive wording gaps (official 506
   "Pet **and show animal** caretakers", official 103 "Food **or beverage**
   servers, non-restaurant"). Adopt the official strings verbatim in a later pass.
5. `brackets.2026.json` — flip `verified` to `true`; every number is confirmed.
   Decide whether to model the § 63(f) $1,650 / $2,050 aged-blind amount.
   **Still outstanding.**
6. `car-loan.2026.json` — encode the eight unmodelled eligibility rules, or gate
   the deduction behind an explicit eligibility checklist in the UI.
   **Still outstanding** — deliberately out of Batch A scope.
7. Update `citations[]` in each file with the URLs in the table above, replacing
   the placeholder `https://www.irs.gov/newsroom` and `https://www.irs.gov/` entries.
   **Still outstanding.** Note that all six rules files also still carry
   `verified: false`, so `meta.unverifiedRuleSets` remains non-empty and the
   launch gate stays shut — correctly, given items 5-7.
