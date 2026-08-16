# VERIFICATION-STATUS

Phase 1 primary-source verification of every numeric constant in `packages/engine/src/rules/*.json`.

**Summary: 54 verified · 9 corrections identified · 10 unresolved · 1 not applicable (74 rows).**

Each row below either carries a URL that was fetched and returned the cited content, or the word
UNRESOLVED. No figure in this document was supplied from model recall.

---

## Batch A remediation — 2026-08-15

The verification pass itself changed no code. **Batch A applied the corrections.** Every row it
touched is marked **FIXED** inline below, with what changed; every row it deliberately left alone
still reads UNRESOLVED. No row has been deleted.

| # | Correction | Status | Where |
|---|---|---|---|
| 1 | Six 2026 poverty-guideline values | **FIXED** | `rules/poverty-guidelines.2026.json` |
| 2 | Poverty citation label ("2025 values pending") | **FIXED** | same file |
| 3 | 2028 sunset destination: RAP first, then IBR | **FIXED** | new `plans/sunset.ts`; `plans/paye.ts`, `plans/icr.ts`, `eligibility.ts` |
| 4 | Asymmetric payment-credit carryover | **FIXED** | `idrCreditCarries()` in `plans/sunset.ts`; `runPlanTwoPhase` in `plans/shared.ts` |
| 5 | § 685.209(b)(6)(ii) Parent PLUS consolidation carve-out | **FIXED** | `Loan.repaidUnderIdrInWindow`; `checkRap`; `rules/rap.*.json`; Zod schema and loan form |
| 6 | Five citation URLs → govinfo | **FIXED** | `rap.*.json` [0]; `plan-terms.*.json` [0] and [1]; `tiered-standard-terms.*.json` [0] and [1] |
| — | ICR income-percentage factor | UNRESOLVED — untouched | `plans/icr.ts` |
| — | `graduated.stepMonths` = 24 | UNRESOLVED — untouched (no primary source exists) | `plan-terms.*.json` |
| — | 26 U.S.C. § 108 post-2024 edition re-check | UNRESOLVED — untouched | `tax.2026.json` |
| — | IBR new-borrower second limb | UNRESOLVED — untouched | `plan-terms.*.json` |
| — | PAYE new-borrower limb (A) | UNRESOLVED — untouched | `plan-terms.*.json` |
| — | Three congress.gov citations | UNRESOLVED — untouched (no fetched substitute exists) | `rap.*.json` [1] [2]; `plan-terms.*.json` [2] |

**Effect on results.** Raising the poverty guideline raises protected income and therefore *lowers*
every IBR/PAYE/ICR payment. RAP is untouched — it uses gross AGI with no poverty offset — and all
eight RAP golden cases are byte-for-byte unchanged. The sunset correction is larger than the
poverty one for anyone whose projection crosses 1 Jul 2028: a RAP-eligible PAYE borrower now moves
onto RAP's 360-payment clock with its interest waiver and $50 principal match, not onto New IBR's
240.

**One tension left open deliberately.** § 685.209(k)(8)(i)(C)(5) credits pre-2028 income-contingent
payments toward RAP's 360 where each met the required amount. The engine applies that to payments
it simulates before the sunset, but *not* to `Strategy.priorQualifyingPayments`, whose amounts it
cannot know — and CLAUDE.md treats the forfeiture of those on a voluntary switch to RAP as a
product invariant. Whether a voluntary election should also carry credit under (k)(8)(i)(C)(5) is a
regulatory question this batch did not answer. Flagged rather than guessed.

## The primary source

The governing document is the **RISE final rule** — *Reimagining and Improving Student Education—Federal
Student Loan Program Final Regulations*, **91 Fed. Reg. 23768** (Dept. of Education, published
**1 May 2026**, FR Doc. 2026-08556, effective 1 July 2026), amending 34 C.F.R. parts 674, 682, and 685.

`federalregister.gov` and `ecfr.gov` both bot-block every request (HTTP 302 to
`https://unblock.federalregister.gov/`), so the rule was retrieved in full from **govinfo.gov**, which
serves the identical GPO text:

> https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm — fetched 2026-08-15, 959,524 bytes, pages 23768–23901.

All "RISE final rule" citations below were read from that retrieved text. Paragraph cites are to
34 C.F.R. §§ 685.208, 685.209, 685.219 as revised by the rule.

---

## HEADLINE FINDING — the RAP bracket boundary is RESOLVED

**An AGI landing exactly on a $10,000 multiple falls in the LOWER band. The engine's `ceil()`
implementation is correct. The spec's `floor()` pseudocode is wrong.**

34 C.F.R. § 685.209(b)(2), as revised by the RISE final rule (91 Fed. Reg. at 23888), defines the
RAP base payment verbatim:

> (2) *Base payment*, under the Repayment Assistance Plan, means the amount of the applicable base payment for a borrower with an adjusted gross income—
> (i) Not more than $10,000, is $120;
> (ii) More than $10,000 and not more than $20,000, is 1 percent of such adjusted gross income;
> (iii) More than $20,000 and not more than $30,000, is 2 percent of such adjusted gross income;
> (iv) More than $30,000 and not more than $40,000, is 3 percent of such adjusted gross income;
> (v) More than $40,000 and not more than $50,000, is 4 percent of such adjusted gross income;
> (vi) More than $50,000 and not more than $60,000, is 5 percent of such adjusted gross income;
> (vii) More than $60,000 and not more than $70,000, is 6 percent of such adjusted gross income;
> (viii) More than $70,000 and not more than $80,000, is 7 percent of such adjusted gross income;
> (ix) More than $80,000 and not more than $90,000, is 8 percent of such adjusted gross income;
> (x) More than $90,000 and not more than $100,000, is 9 percent of such adjusted gross income; and
> (xi) More than $100,000, is 10 percent of such adjusted gross income.

The construction is uniformly **"More than $X and not more than $Y"** — a half-open interval closed at
the top. Consequences, each read directly off the table:

| AGI | Governing clause | Percent | Annual base | Monthly (no dependents) |
|---|---|---|---|---|
| $10,000 | (b)(2)(i) — "not more than $10,000" | flat $120/yr | $120 | **$10** |
| $60,000 | (b)(2)(vi) — "more than $50,000 and not more than $60,000" | **5%** | $3,000 | **$250** |
| $60,001 | (b)(2)(vii) | 6% | $3,600.06 | $300.01 |
| $100,000 | (b)(2)(x) — "not more than $100,000" | **9%** | $9,000 | $750 |
| $100,001 | (b)(2)(xi) — "more than $100,000" | 10% | $10,000.10 | $833.34 |

The engine's `rapBracketPct` in `packages/engine/src/plans/rap.ts:46-49` computes
`ceil((agi − 10,000) / 10,000)` capped at 10 and floored at 1. At $60,000 that is `ceil(5.0) = 5` → 5%
→ $250/month, and at $100,000 `ceil(9.0) = 9` → 9%. Both match the regulation exactly. `$10,000` is
routed to the flat-$120 branch before the bracket function is reached, matching clause (i).

`PRODUCT-SPEC.md` §11.5's pseudocode `floor((AGI − 10,000)/10,000)` yields 6% at $60,000 ($300/month)
and 10% at $100,000. **The spec pseudocode contradicts the regulation and should be corrected to
match the engine, not the reverse.** The $50/month the spec's pseudocode would have overcharged a
$60,000 borrower is confirmed as a spec defect, not an engine defect.

Note the boundary direction is **opposite** to the Tiered Standard balance brackets, which use
"Equal to or greater than $X but less than $Y" (boundary goes to the *higher* tier). Both engine
implementations already handle their respective direction correctly. This asymmetry is a live
footgun for future edits and is now recorded in both rule files' `_verificationNote`.

Also confirmed from the same paragraph: the base payment is an **annual** figure, and § 685.209(f)(5)
applies the dependent reduction **after** dividing by 12 — `(i) the borrower's applicable base
payment, divided by 12; minus (ii) $50 for each dependent of the borrower`. The engine's ordering in
`rapMonthlyPayment` matches.

---

## `packages/engine/src/rules/rap.2026-07-01.json`

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| `minimumMonthlyPaymentCents` | 1000 | rap…json:23 | 1000 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(g)(3)(ii). Preamble at 23839 confirms $10 minimum is statutory, HEA § 455(q)(4)(B)(ii). Final payment may be less than $10 — engine does not model this de-minimis case. |
| `lowIncomeThresholdCents` | 1000000 | rap…json:24 | 1000000 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(2)(i), "$10,000". |
| `lowIncomeAnnualBaseCents` | 12000 | rap…json:25 | 12000 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(2)(i) — "$120", an annual base, /12 = $10/mo. Engine treats it as annual. Correct. |
| `bracketStepCents` | 1000000 | rap…json:26 | 1000000 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | Every clause (ii)–(x) steps by exactly $10,000. |
| `bracketStartPct` | 1.0 | rap…json:27 | 1.0 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(2)(ii). Also serves as the per-step increment; both are 1. |
| `bracketMaxPct` | 10.0 | rap…json:28 | 10.0 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(2)(xi), "More than $100,000, is 10 percent". |
| **Bracket boundary rule (`ceil`)** | ceil | plans/rap.ts:46-49 | **ceil — VERIFIED CORRECT** | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | See headline finding. Exact multiples fall in the LOWER band. Spec's `floor()` pseudocode is wrong; fix the spec. |
| `dependentReductionCents` | 5000 | rap…json:29 | 5000 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(5)(ii), "$50 for each dependent". Applied to the monthly figure, after /12 — engine ordering matches. "Dependent" defined at § 685.209(b)(3) by IRC § 152 and actually claimed on the return. |
| `forgivenessAfterPayments` | 360 | rap…json:30 | 360 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(k)(7)–(8); preamble at 23842 cites HEA § 455(q)(1)(E), "360 monthly payments, or the equivalent, over a period of at least 30 years". |
| `pslfPayments` | 120 | rap…json:31 | 120 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.219(e)(1), "120 monthly qualifying payments … while working the 120 months of qualifying service". |
| `interestWaiver` | true | rap…json:32 | true — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(h)(4)(i): "the Secretary does not charge the borrower's account for any accrued interest that is not covered by the borrower's on-time payment". Waived, not capitalised. |
| `principalMatchCents` | 5000 | rap…json:33 | 5000 — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | Preamble at 23843: match applies if the on-time payment covers less than $50 of principal, and equals "the lesser of $50 or the total monthly payment minus the on-time payment repaid by the borrower". Matches the CLAUDE.md rule. |
| `paymentCappedAtStandard` | false | rap…json:34 | false — VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(5) contains no "lesser of" clause, unlike (f)(2)/(f)(3) for IBR/PAYE. Confirms the product's central insight: RAP is uncapped. |
| `eligibleLoanTypes` | Direct Sub/Unsub/GradPLUS/Consolidation | rap…json:35-40 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(c)(6): "Any Direct Loan borrower may repay under the Repayment Assistance Plan if the borrower has loans eligible for repayment under the plan"; excepted PLUS and excepted consolidation loans excluded per (b)(6)–(b)(8). |
| `excludedLoanTypes` | ParentPLUS/FFEL/Perkins/HEAL | rap…json:41 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | Preamble at 23841 (HEA § 455(d)): excepted PLUS / excepted consolidation borrowers "are not eligible for the Repayment Assistance Plan, irrespective of whenever they obtained" the loan. FFEL/Perkins/HEAL are not Direct Loans, so out unless consolidated. |
| `parentPlusConsolidationTaint` | true | rap…json:42 | true — VERIFIED; gap **FIXED** | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | Taint confirmed. **Gap found, now closed (Batch A):** § 685.209(b)(6)(ii) carves out a tainted consolidation loan that "was being repaid under the ICR, PAYE, or IBR plans on any date on or after July 4, 2025, through and including June 30, 2028" (at least one payment made). Such a loan is NOT an excepted consolidation loan, so it IS RAP-eligible. The engine's flag was unconditional and wrongly denied RAP to this cohort. **FIXED:** new optional `Loan.repaidUnderIdrInWindow` (defaults false, so the taint still applies unless the borrower affirms the condition), consumed by `taintExceptionApplies()`/`checkRap()` in `eligibility.ts`; window dates and an `enabled` gate added to `rap.*.json` as `parentPlusConsolidationTaintException`; surfaced in the Zod schema, the URL-state bitfield and the loan form as a plain-English question. The carve-out is RAP-only — it does not open IBR or PAYE, whose bar comes from HEA § 493C. |
| citation[0] URL | `federalregister.gov/documents/2026/07/01/rise-final-rule` | rap…json:8 | **FIXED** → `https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm` | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | **FIXED in Batch A** — URL swapped, label rewritten to name the publication date and FR Doc. number, `lastVerified` moved to 2026-08-15. Placeholder. The date component (2026/07/01) was the rule's *effective* date; it published **2026-05-01**. Canonical FR permalink is `federalregister.gov/documents/2026/05/01/2026-08556/…`, but federalregister.gov bot-blocks, so cite govinfo, which was fetched successfully. |
| citation[0] `fedRegCite` | "91 Fed. Reg. 23768" | rap…json:9 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | Retrieved document header reads "[Federal Register Volume 91, Number 84 (Friday, May 1, 2026)] … [Pages 23768-23901]". Start page 23768 confirmed. |
| citation[1] CRS IF13075 URL | `congress.gov/crs-product/IF13075` | rap…json:14 | STILL UNRESOLVED — untouched by Batch A | — (congress.gov returns HTTP 403 to all clients) | 2026-08-15 | The product ID appears in search results with the matching title ("The Repayment Assistance Plan (RAP) in P.L. 119-21, the FY2025 Reconciliation Law"), but the page could not be fetched, so the citation is unconfirmed. Every figure it would support is independently verified against the RISE rule; consider dropping this citation rather than shipping an unverified one. |
| citation[2] P.L. 119-21 URL | `congress.gov/bill/119th-congress/house-bill/1` | rap…json:19 | STILL UNRESOLVED — untouched by Batch A (the suggested govinfo `PLAW-119publ21` substitute was never fetched, so swapping to it would repeat the error being fixed) | — (congress.gov returns HTTP 403) | 2026-08-15 | Not fetchable. Note the RISE rule consistently calls P.L. 119-21 the **"Working Families Tax Cuts Act"**, not the "One Big Beautiful Bill Act" as the citation label states — the label should be re-checked when the URL is resolved. Suggest govinfo `PLAW-119publ21` as a fetchable substitute. |

---

## `packages/engine/src/rules/poverty-guidelines.2026.json`

All six values were the **2025** guidelines carried forward and wrong for 2026. The 2026 table was
published in the Federal Register on **15 January 2026** and is live on ASPE.

**ALL SIX FIXED in Batch A**, together with the citation label. Golden coverage added in
`packages/engine/tests/poverty-guidelines.test.ts`, which asserts each of the six values, the
`fplCents` family-size arithmetic for all three regions, and names the three stale 2025 figures so a
future carry-forward is caught.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| `CONTIGUOUS_48.firstPersonCents` | 1596000 ($15,960) | poverty…json:22 | **FIXED → 1596000 ($15,960)** | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-08-15 | 2026 guideline, 48 contiguous states + DC. |
| `CONTIGUOUS_48.additionalPersonCents` | 568000 ($5,680) | poverty…json:22 | **FIXED → 568000 ($5,680)** | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-08-15 | Per additional person. |
| `ALASKA.firstPersonCents` | 1995000 ($19,950) | poverty…json:23 | **FIXED → 1995000 ($19,950)** | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-08-15 | |
| `ALASKA.additionalPersonCents` | 710000 ($7,100) | poverty…json:23 | **FIXED → 710000 ($7,100)** | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-08-15 | |
| `HAWAII.firstPersonCents` | 1836000 ($18,360) | poverty…json:24 | **FIXED → 1836000 ($18,360)** | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-08-15 | |
| `HAWAII.additionalPersonCents` | 653000 ($6,530) | poverty…json:24 | **FIXED → 653000 ($6,530)** | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-08-15 | |
| citation[0] ASPE URL | aspe.hhs.gov/…/poverty-guidelines | poverty…json:8 | VERIFIED; label **FIXED** | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-08-15 | Resolves and serves the 2026 table. **FIXED in Batch A:** label rewritten to "2026 table, published in the Federal Register 15 Jan 2026", `lastVerified` moved to 2026-08-15, and the file `note` now records that student-loan IDR uses the guidelines *currently in effect* (§ 685.209(b)(14) / 42 U.S.C. 9902(2)) — not the prior-year table the ACA uses. |

Supporting regulatory hook: § 685.209(b)(14) defines "poverty guideline" as the HHS figures published
annually under 42 U.S.C. 9902(2), and directs that borrowers not resident in a listed State use the
48-contiguous-States figure — the engine's three-region model matches the regulation's own structure.

**These six corrections changed every IBR, PAYE, and ICR payment the engine computes.** They do not
affect RAP, which uses gross AGI with no poverty-line offset (§ 685.209(f)(5); preamble at 23841
confirms "there is no exempted income under the Repayment Assistance Plan").

---

## `packages/engine/src/rules/tiered-standard-terms.2026-07-01.json`

Verified verbatim against 34 C.F.R. § 685.208(c)(1)(iii) (loans made on/after 1 Jul 2026) and the
identically-worded § 685.208(b)(8)(iii) (split pre-/post-2026 borrowers). The spec's claim was correct.

> (A) Less than $25,000 … within 10 years; (B) Equal to or greater than $25,000 but less than $50,000 … within 15 years; (C) Equal to or greater than $50,000 but less than $100,000 … within 20 years; (D) Equal to or greater than $100,000 … within 25 years.

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| tier 1 | `<$25,000` → 120 mo | tiered…json:19 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(c)(1)(iii)(A). |
| tier 2 | `<$50,000` → 180 mo | tiered…json:20 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(c)(1)(iii)(B). |
| tier 3 | `<$100,000` → 240 mo | tiered…json:21 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(c)(1)(iii)(C). |
| tier 4 | `null` → 300 mo | tiered…json:22 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(c)(1)(iii)(D), 25 years. |
| **Boundary semantics** | strict `<` | plans/tiered-standard.ts:19 | **VERIFIED CORRECT** | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | Regulation is "Equal to or greater than $X but less than $Y", so a balance landing exactly on a boundary takes the **higher** tier. `balance < tier.maxBalanceCents` produces exactly that: $25,000 → 180 mo. Opposite direction to the RAP AGI brackets — do not "harmonise" the two. |
| `excludedLoanTypes` | FFEL/Perkins/HEAL | tiered…json:24 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208 governs Direct Loans only; both Tiered Standard paragraphs are scoped to "Direct Loan borrowers". |
| citation[0] P.L. 119-21 URL | congress.gov/bill/119…/house-bill/1 | tiered…json:8 | **FIXED** → govinfo FR URL | — (congress.gov HTTP 403) | 2026-08-15 | Same as rap.json citation[2]. Brackets are independently verified against the RISE rule, so this citation was redundant. **FIXED in Batch A:** replaced with the govinfo FR URL and relabelled to cite § 685.208(c)(1)(iii) directly. |
| citation[1] StudentAid.gov URL | studentaid.gov/manage-loans/repayment/plans | tiered…json:13 | **FIXED** → govinfo FR URL | — (studentaid.gov HTTP 403) | 2026-08-15 | Not fetchable from this environment. Secondary/explanatory source only. **FIXED in Batch A:** replaced with the govinfo FR URL and relabelled to cite § 685.208(b)(8)(iii), the identically worded paragraph for split pre-/post-2026 borrowers; the file `note`'s "verify before launch" caveat is dropped, since all four tiers are verified verbatim. |

---

## `packages/engine/src/rules/plan-terms.2026-07-01.json`

Payment formulas verified against § 685.209(f); forgiveness counts against § 685.209(k)(1)–(2);
fixed-plan terms against § 685.208(b).

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| `ibrOld.discretionaryPct` | 15 | plan-terms…json:23 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(3)(i), "15 percent of the borrower's discretionary income, divided by 12" for borrowers who are not new borrowers. |
| `ibrOld.povertyMultiplierPct` | 150 | plan-terms…json:24 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(4)(ii), IBR and PAYE use 150 percent of the poverty guideline. |
| `ibrOld.forgivenessAfterPayments` | 300 | plan-terms…json:25 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(k)(1), "300 monthly payments … over a period of at least 25 years". |
| `ibrOld.paymentCappedAtStandard` | true | plan-terms…json:26 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(3)(ii), lesser of 15% or the 10-year standard amount fixed at plan entry. |
| `ibrNew.discretionaryPct` | 10 | plan-terms…json:29 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(2)(i). |
| `ibrNew.povertyMultiplierPct` | 150 | plan-terms…json:30 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(4)(ii). |
| `ibrNew.forgivenessAfterPayments` | 240 | plan-terms…json:31 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(k)(2), "240 monthly payments … over a period of at least 20 years". |
| `ibrNew.paymentCappedAtStandard` | true | plan-terms…json:32 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(2)(ii). |
| `ibrNew.firstLoanOnOrAfter` | 2014-07-01 | plan-terms…json:33 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(13)(ii): IBR "new borrower" = no outstanding Direct/FFEL balance before **July 1, 2014**, and obtains no new loan on/after July 1, 2026. **The second limb is not modelled** — a 2014–2026 borrower who takes a post-2026 loan loses new-borrower status. Flag for Phase 2. |
| `paye.discretionaryPct` | 10 | plan-terms…json:36 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(2)(i), PAYE shares the new-IBR formula. |
| `paye.povertyMultiplierPct` | 150 | plan-terms…json:37 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(4)(ii). |
| `paye.forgivenessAfterPayments` | 240 | plan-terms…json:38 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(k)(2). |
| `paye.paymentCappedAtStandard` | true | plan-terms…json:39 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(2)(ii). |
| `paye.newBorrowerProxyDate` | 2011-10-01 | plan-terms…json:40 | **STILL UNRESOLVED** — proxy confirmed incomplete, untouched by Batch A | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(13)(i) states the full two-part test verbatim: (A) no outstanding Direct/FFEL balance as of **1 Oct 2007** (or none on the date a new loan is taken after that date), **and** (B) a disbursement on/after **1 Oct 2011**, with a consolidation-loan carve-out. The engine tests only limb (B), so it will over-admit borrowers who held a balance on 1 Oct 2007. Capturing the extra input is now specified, not speculative. |
| `paye.sunsetDate` | 2028-07-01 | plan-terms…json:41 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(c)(7) and (d)(1): PAYE available "through June 30, 2028"; elected plan begins 1 Jul 2028. |
| `icr.discretionaryPct` | 20 | plan-terms…json:44 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(4)(i)(B), "20 percent of the borrower's discretionary income, divided by 12". |
| `icr.povertyMultiplierPct` | 100 | plan-terms…json:45 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(b)(4)(iii), ICR uses 100 percent of the poverty guideline. |
| `icr.forgivenessAfterPayments` | 300 | plan-terms…json:46 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(k)(1) lists ICR with the 300-payment / 25-year cohort. |
| `icr.alternativeAmortisationMonths` | 144 | plan-terms…json:47 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(f)(4)(i)(A), "fixed monthly payments over a **12-year** repayment period" = 144 months. |
| ICR income-percentage factor | 1.0 (in `icr.ts`) | plans/icr.ts | STILL UNRESOLVED — untouched by Batch A | — | 2026-08-15 | § 685.209(f)(4)(i)(A) multiplies the 12-year amount by "a percentage based on the borrower's income as established by the Secretary in a Federal Register notice **published annually**". The 2026 notice was not located; it is a separate FR document from the RISE rule. Until fetched, 1.0 remains an unverified simplification that understates ICR payments for higher incomes. |
| `icr.sunsetDate` | 2028-07-01 | plan-terms…json:48 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(c)(7)(i)(F), ICR available "through June 30, 2028". |
| `standard10.termMonths` | 120 | plan-terms…json:50 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(b)(1)(i), "repay a loan in full within ten years". |
| `graduated.termMonths` | 120 | plan-terms…json:52 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(b)(6)(i), "a period of time not to exceed ten years". |
| `graduated.stepMonths` | 24 | plan-terms…json:53 | STILL UNRESOLVED — untouched by Batch A | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | The regulation says only "payments at two or more levels" (§ 685.208(b)(6)(i)) and prescribes no step interval. 24 months is a servicer convention, not a rule. Correctly labelled a simplification; it cannot be verified because no primary source specifies it. |
| `graduated.maxFinalToFirstRatio` | 3 | plan-terms…json:54 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(b)(6)(iii), "No single payment under this plan will be more than three times greater than any other payment." |
| `extended.termMonths` | 300 | plan-terms…json:57 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(b)(4)(i), "a period not to exceed 25 years". |
| `extended.minimumBalanceCents` | 3000000 | plan-terms…json:58 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.208(b)(4)(i), "a new borrower with **more than** $30,000 in outstanding Direct Loans accumulated on or after October 7, 1998". Threshold is exclusive — confirm the engine uses `>` not `>=`. The "new borrower as of 7 Oct 1998" condition is a separate, unmodelled limb. |
| `pslfPayments` | 120 | plan-terms…json:60 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.219(e)(1). |
| `post2026RestrictionDate` | 2026-07-01 | plan-terms…json:61 | VERIFIED | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | Every fixed plan in § 685.208(b) is conditioned on the borrower having "not received a Direct Loan on or after July 1, 2026"; § 685.220(h)(2) limits post-2026 consolidations to Tiered Standard/RAP. |
| `note` — sunset migration destinations | "PAYE→New IBR, ICR→Old IBR, or Standard if IBR-ineligible" | plan-terms…json:62 | **FIXED** → RAP first, then IBR | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(c)(7)(iii)(A): a borrower who does not elect by 1 Jul 2028 is placed in **(1) the Repayment Assistance Plan for Direct Loans eligible for it; or (2) the IBR plan for loans ineligible for RAP.** The engine's default destination was wrong for both PAYE and ICR. **FIXED in Batch A:** `sunsetDestination()` in `eligibility.ts` implements the two-step routing (RAP → IBR_NEW → IBR_OLD), and the new `plans/sunset.ts` builds the destination's payment function, its own forgiveness clock, and — where the destination is RAP — its interest waiver and $50 principal match, which `runPlanTwoPhase` previously hard-coded off. `plans/paye.ts` and `plans/icr.ts` both now defer to it, so the two plans can no longer drift apart. The `note` and `openItems` in this file were rewritten to match. A borrower eligible for neither destination falls back to a Standard amortisation, now labelled in code and in /methodology as a modelling residual with no regulatory basis rather than as a rule. |
| — payment-credit carryover at migration | prior payments carry over | plan-terms…json:62 (`note`) | **FIXED** — asymmetry now modelled | govinfo FR-2026-05-01/2026-08556 | 2026-08-15 | § 685.209(k)(4)(i)(A) as amended: credit toward PAYE/ICR/IBR forgiveness comes from "making a payment under an IDR plan **except the Repayment Assistance Plan**". Conversely § 685.209(k)(8)(i)(C)(5) counts pre-1 Jul 2028 income-contingent payments toward RAP's 360 only if they were "not less than the monthly payment required under the applicable plan". Credit flow is asymmetric and conditional, not the flat carryover the note described. **FIXED in Batch A:** `idrCreditCarries(from, to, paymentsMetRequiredAmount)` in `plans/sunset.ts` encodes both halves — credit flows into RAP only from a non-RAP income-driven plan and only at the required amount, and never flows out of RAP into IBR/PAYE/ICR. `runPlanTwoPhase` takes the destination's own clock plus a `phaseACreditCarries` flag instead of subtracting phase-A payments unconditionally. The engine's simulated pre-sunset payments satisfy the (k)(8)(i)(C)(5) condition by construction (it models required payments only), which is stated explicitly in `SIMULATED_PAYMENTS_MEET_REQUIRED_AMOUNT` rather than left implicit. `Strategy.priorQualifyingPayments` is deliberately NOT credited — see the tension noted at the top of this file. Counted once, with the row above. |
| citation[0] eCFR § 685.209 | ecfr.gov/…/section-685.209 | plan-terms…json:8 | **FIXED** → govinfo FR URL | — (ecfr.gov 302 → unblock page for all URLs) | 2026-08-15 | Bot-blocked; existence not confirmable from here. The section's *content* is fully verified via govinfo. **FIXED in Batch A:** URL replaced with the govinfo FR text that was actually fetched, label rewritten to name the rule and its publication date, `fedRegCite` added, `lastVerified` moved to 2026-08-15. |
| citation[1] eCFR § 685.208 | ecfr.gov/…/section-685.208 | plan-terms…json:13 | **FIXED** → govinfo FR URL | — (ecfr.gov 302 → unblock page) | 2026-08-15 | Same. **FIXED in Batch A**, identically to citation[0]. |
| citation[2] P.L. 119-21 URL | congress.gov/bill/119…/house-bill/1 | plan-terms…json:18 | STILL UNRESOLVED — untouched by Batch A | — (congress.gov HTTP 403) | 2026-08-15 | Same as rap.json citation[2]; short-title label likely wrong (see that row). |

---

## `packages/engine/src/rules/tax.2026.json`

| Figure | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| `nonPslfForgivenessTaxable` | true | tax…json:18 | true — VERIFIED | https://www.govinfo.gov/content/pkg/USCODE-2024-title26/html/USCODE-2024-title26-subtitleA-chap1-subchapB-partIII-sec108.htm and https://www.irs.gov/taxtopics/tc431 | 2026-08-15 | 26 U.S.C. § 108(f)(5) excludes discharges only "after December 31, 2020, and before January 1, 2026". The window has closed, so IDR forgiveness in 2026+ is cancellation-of-debt income. IRS Topic 431 (live page) still describes the exclusion with the same closing date, corroborating that it was not extended. **Caveat:** the statutory text fetched is the 2024 U.S. Code edition; a post-OBBBA official edition was not available (uscode.house.gov refused connection), so a 2025–26 amendment to § 108(f) cannot be ruled out from a primary source. Re-check before launch. **Untouched by Batch A — STILL UNRESOLVED.** |
| `pslfForgivenessTaxable` | false | tax…json:19 | false — VERIFIED | https://www.govinfo.gov/content/pkg/USCODE-2024-title26/html/USCODE-2024-title26-subtitleA-chap1-subchapB-partIII-sec108.htm | 2026-08-15 | § 108(f)(1) excludes discharge "pursuant to a provision of such loan under which all or part of the indebtedness … would be discharged if the individual worked for a certain period of time in certain professions for any of a broad class of employers" — the PSLF basis. Permanent; no sunset. IRS Topic 431 lists the same exception. Note the citation *label* in the file cites (f)(5) for the expiry and (f)(1) for PSLF in the `note` — both correct as written. |
| `assumedMarginalRatePct` | 22 | tax…json:20 | UNRESOLVED (deliberate assumption) | — | 2026-08-15 | Not a regulatory figure and not verifiable as one. It is a flat modelling estimate; 22% is a real federal bracket rate but the correct rate is borrower-specific and depends on the forgiven amount stacking on top of other income. **If it stays, the UI must label it an assumption (CLAUDE.md already requires this) and ideally let the user override it.** To make it defensible, cite the IRS Rev. Proc. setting 2026 brackets and state the filing status and income assumed. |
| `stateTreatmentModelled` | false | tax…json:21 | N/A — declared scope limit | — | 2026-08-15 | A stated modelling boundary, not a figure requiring a source. Ensure the UI discloses it, as the file's `note` requires. |
| citation[0] Cornell 26 U.S.C. § 108 | law.cornell.edu/uscode/text/26/108 | tax…json:8 | VERIFIED (resolves) | https://www.law.cornell.edu/uscode/text/26/108 | 2026-08-15 | Fetched and served § 108(f). Cornell is an unofficial mirror — prefer the govinfo USCODE URL above as the primary citation and keep Cornell as convenience. |
| citation[1] IRS Topic 431 | irs.gov/taxtopics/tc431 | tax…json:13 | VERIFIED (resolves) | https://www.irs.gov/taxtopics/tc431 | 2026-08-15 | Fetched; content matches the label. Confirms both the employment-based exception and the 2021–2025 window. |

---

## Sources that could not be reached

| Source | Result | Effect |
|---|---|---|
| `ecfr.gov` (all URLs) | HTTP 302 → `unblock.federalregister.gov` | Two citations unverifiable. Content obtained from govinfo instead, so no figure is unverified because of this. |
| `federalregister.gov` (all URLs) | HTTP 302 → `unblock.federalregister.gov` | Same. A 302 is returned for *every* path, so a response code from this host proves nothing about whether a document exists — the placeholder URL and the real one behave identically. |
| `congress.gov` (bill and CRS pages) | HTTP 403 | Three citations unverifiable. P.L. 119-21 short title in the labels remains unconfirmed. |
| `studentaid.gov/manage-loans/repayment/plans` | HTTP 403 | One secondary citation unverifiable; the figure it supports is verified from the regulation. |
| `uscode.house.gov` | Connection refused (ECONNREFUSED) | No post-2024 official U.S. Code edition of § 108 obtainable; see the tax caveat above. |
| Annual ICR income-percentage-factor FR notice | Not located | ICR factor remains at 1.0, unverified. |

## Recommended order of work after review

1. ~~**Poverty guidelines**~~ — **DONE in Batch A.** Six values corrected; every IBR/PAYE/ICR figure moved.
2. ~~**PAYE/ICR sunset destination**~~ — **DONE in Batch A.** Both plans now route through `sunsetDestination()`.
3. ~~**Parent PLUS consolidation carve-out** (§ 685.209(b)(6)(ii))~~ — **DONE in Batch A.** New `Loan.repaidUnderIdrInWindow` input, defaulting to the taint.
4. ~~**Citation URLs**~~ — **DONE in Batch A** for the five citations with a govinfo substitute that was actually fetched. Three congress.gov citations remain unresolved: no substitute for them has been retrieved, and swapping in an unfetched URL would repeat the error.
5. **PAYE new-borrower second limb** and **IBR new-borrower post-2026 limb** — STILL OPEN. Both are specified exactly above; both need an extra input. Left untouched by Batch A by instruction.
6. **Fix `PRODUCT-SPEC.md` §11.5 pseudocode** to `ceil()` so the spec stops contradicting the regulation and the engine. STILL OPEN.
7. **ICR income-percentage factor** — STILL OPEN. Needs ED's annual Federal Register notice, which has not been located.
8. **Re-check 26 U.S.C. § 108(f)** against a post-2024 official U.S. Code edition before launch. STILL OPEN.
9. **Resolve the (k)(8)(i)(C)(5) tension** described at the top of this file: does a *voluntary* election to RAP carry pre-2028 IDR payment credit, as the forced migration does? CLAUDE.md's one-way-door invariant says no; the regulation's text is not conclusive either way from what has been retrieved.

**No RAP bracket, term, count, or percentage requires any change.** The RAP core is correct as built.
