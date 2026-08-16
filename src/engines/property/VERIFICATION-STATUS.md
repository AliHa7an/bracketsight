# VERIFICATION-STATUS

Phase 1 verification pass against primary sources. This document records what the
encoded values *should* be, and — since Batch A — which of them have been fixed.

**Date of verification pass: 2026-08-15.**
**Date of Batch A remediation: 2026-08-15.** Changelog entry: `/changelog`, 2026-08-15.

## Batch A remediation — what changed

Applied 2026-08-15. **No row below was deleted.** Rows fixed in this batch are marked
**FIXED** in place with what changed; everything else stands as originally recorded.

| # | Item | Status after Batch A |
|---|---|---|
| 1 | NJ Chapter 123 not implemented | **FIXED (code) / STILL UNRESOLVED (data).** The corridor test is implemented in `packages/engine/src/common-level-range.ts` and routed through a new per-county `reliefModel` flag (`GAP` vs `COMMON_LEVEL_RANGE`), so `verdict.ts` carries no "if NJ" branch. The Director's Ratio table (`commonLevelRange.municipalities`) is **deliberately empty** — no municipal ratio has been read from a primary source. Every NJ verdict therefore returns `CANNOT_DETERMINE` with the reason, never the generic threshold. |
| 2 | Bergen filing fee flat $25 | **FIXED.** Now a banded schedule ($5 / $25 / $100 / $150) read through `filingFeeFor(county, assessedValue)`. |
| 3 | Both NJ form URLs dead (404) | **FIXED.** `petappl.pdf` and `a1compsales.pdf`; the stale `co.bergen.nj.us` citation replaced with `bergencountynj.gov`. |
| 4 | NJ deadline: received-by vs postmark | **FIXED.** Encoded as `appealWindow.filingCutoff: "RECEIVED_BY"` with a quoted note, surfaced on the verdict block and the evidence summary. |
| 5 | Cook deadline model, Cook assessment level, Cook Assessor fee, Cook evidence deadline | **STILL UNRESOLVED — untouched by design.** The Assessor's site remains hard-blocked. `il-cook.json` was changed only to add the `reliefModel: "GAP"` schema field, which asserts no Cook value. No township calendar was invented. |
| 6 | `estimatedTaxRateOnAssessedBps` (both counties) | **STILL UNRESOLVED.** Unchanged. |

## Summary

**38 items checked — 13 verified, 13 corrected, 12 unresolved.**
**Of the 13 corrected: 6 applied in Batch A, 7 still pending (all Cook-side).**

Governing rule for this document: every row carries a URL that was **actually fetched
and returned content**, or it is marked UNRESOLVED. Nothing here is recalled or
inferred. Rows citing a non-government host are labelled **[SECONDARY]** and are a
cross-check only — they do not discharge the "cite or don't ship" invariant.

### Headline findings

1. **NJ Chapter 123 is confirmed, precisely specified, and — since Batch A —
   implemented.** *(Original finding preserved below; see "Batch A" note at the end of
   this item.)* The
   statutory test is fetched and quoted below. `packages/engine/src` mentions
   "Chapter 123" in exactly one place — a prose string in `nj-bergen.json:58`. There
   is no code path for it (`grep -riE "chapter ?123|averageRatio|commonLevel"` over
   `packages/engine/src` returns only that string). `verdict.ts` decides NJ outcomes
   on a generic 5% / 10% over-assessment threshold that has no relationship to the
   test New Jersey actually applies. **Every NJ verdict is currently capable of
   telling a user to file an appeal that the county board is required by statute to
   deny.** See "NJ Chapter 123" section below.
   **FIXED 2026-08-15 (code):** `packages/engine/src/common-level-range.ts` implements
   §§1105.19–1105.20 including clauses (3) and (4); `verdict.ts` branches on the new
   per-county `reliefModel` flag. **STILL UNRESOLVED (data):** no municipal Director's
   Ratio is encoded, so every NJ verdict is `CANNOT_DETERMINE`.
2. **The Bergen filing fee is wrong in a way that changes verdicts. FIXED 2026-08-15.**
   `verdict.ts`
   gates `NOT_WORTH_IT` on `county.filingFee.amountCents`. The encoded flat $25 is
   the second of four statutory tiers; the real fee reaches $150. Homes above
   $1,000,000 assessed are quoted a fee 6× too low.
   **FIXED:** `filingFee.bands` encodes all four tiers; `filingFeeFor()` selects on
   assessed value and every fee display reads through it. Regression test:
   "the tiered fee blocks a case the old flat $25 would have let through".
3. **Both encoded NJ form URLs are dead (HTTP 404).** Confirmed by direct fetch.
   **FIXED 2026-08-15** — replaced with `petappl.pdf` and `a1compsales.pdf`.
4. **The Cook deadline model is structurally wrong. STILL UNRESOLVED — untouched.**
   Cook is not "30 days after
   notice". It is a per-township close date published by each body, with 30 days as a
   *floor*, plus a separate later evidence-submission deadline the engine has no
   concept of.
5. **`estimatedTaxRateOnAssessedBps` is unverified in both counties. STILL
   UNRESOLVED.** It is the
   direct multiplier for the "estimated annual overpayment" dollar figure shown to
   users (`verdict.ts`). Both remain UNRESOLVED.

### Sources that were unreachable from this environment

Recorded so the next pass does not repeat the attempts:

| Host | Failure |
|---|---|
| `ptab.illinois.gov` | DNS — `getaddrinfo ENOTFOUND` |
| `tax.illinois.gov`, `www.illinois.gov` | DNS — `getaddrinfo ENOTFOUND` |
| `ilga.gov` | connection timeout |
| `www.cookcountyassessoril.gov` | HTTP 403 bot-block (WebFetch and curl with browser UA) |
| `www.cookcountyclerkil.gov` | HTTP 403 |
| `www.njleg.state.nj.us` | `ECONNREFUSED` |
| `www.co.bergen.nj.us` | connection timeout (stale domain — county has moved to `bergencountynj.gov`) |
| `law.justia.com` | HTTP 403 |
| `co.ocean.nj.us` | `ECONNREFUSED` |

Consequence: **the Cook County Assessor's own site could not be read at all.** Every
Assessor-side value below is therefore either unresolved or corroborated only from the
Board of Review's site. The Illinois classification ordinance and the state
equalization factor could not be reached from any official host.

---

## Cook County (`packages/engine/src/rules/counties/il-cook.json`)

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Assessor citation URL | `https://www.cookcountyassessor.com/appeals` | il-cook.json:10 | **CORRECTED** → `https://www.cookcountyassessoril.gov/appeals` | `https://www.cookcountyassessor.com/appeals` (returned 301 Moved Permanently to the `.gov` host) | 2026-08-15 | Domain migrated to `.gov`. The redirect was confirmed; the target itself is 403 bot-blocked, so its *content* is unverified. |
| Board of Review citation URL | `https://www.cookcountyboardofreview.com/` | il-cook.json:16 | **VERIFIED** — resolves, is the authority | `https://www.cookcountyboardofreview.com/` | 2026-08-15 | HTTP 200, content fetched. |
| PTAB citation URL | `https://www.ptab.illinois.gov/` | il-cook.json:22 | **UNRESOLVED** | — | 2026-08-15 | Host DNS-unreachable from this environment. Not confirmed dead — confirm from a different network. |
| `appealWindow.deadlineRule` | "About 30 days after your township opens…" | il-cook.json:30 | **CORRECTED** — the operative deadline is the **close date published by the body for that township**, not an interval. BOR Rule 7: a complaint "must be filed on or before the date established by the Board" for each of the 38 townships. | `https://www.cookcountyboardofreview.com/board-review-official-rules` | 2026-08-15 | "About 30 days" describes the typical window but is not the rule. The rule is a published date. |
| `appealWindow.deadlineKind` | `NOTICE_RELATIVE` | il-cook.json:31 | **CORRECTED** → a published per-township calendar date, not a notice-relative interval | `https://www.cookcountyboardofreview.com/board-review-official-rules` | 2026-08-15 | Needs a new `deadlineKind` (e.g. `TOWNSHIP_CALENDAR`) plus a per-township date table. |
| `appealWindow.daysAfterNotice` | `30` | il-cook.json:32 | **CORRECTED** — 30 is a **minimum**, not the value. BOR FAQ: "All townships are opened a minimum of 30 days." | `https://www.cookcountyboardofreview.com/about/frequently-asked-questions` | 2026-08-15 | Confirmed against the 2026 calendar: Group 1 (Evanston, New Trier, Norwood Park, Oak Park, River Forest, Riverside, Rogers Park) opened 8/3/2026 and closed 9/1/2026 — a 29-day span. Counting down 30 days from a notice will overshoot the real deadline for some townships. |
| `filingFee.amountCents` (Board of Review) | `0` | il-cook.json:35 | **VERIFIED** — $0. BOR FAQ: "At the Board of Review filing is free and the staff will help you with any aspect of your appeal." | `https://www.cookcountyboardofreview.com/about/frequently-asked-questions` | 2026-08-15 | Verified for the Board of Review only. |
| `filingFee.waiverConditions` (claims $0 at **Assessor** too) | "No fee … with the Assessor's Office or the Board of Review" | il-cook.json:36 | **UNRESOLVED** for the Assessor's Office | — | 2026-08-15 | Assessor site 403-blocked. The BOR half of this sentence is verified; the Assessor half is not. |
| `appealBody` | "Cook County Assessor's Office, then the Cook County Board of Review" | il-cook.json:38 | **VERIFIED** | `https://www.cookcountyboardofreview.com/about/frequently-asked-questions` | 2026-08-15 | BOR is confirmed as a distinct second-level body with its own calendar. |
| `levels` (PTAB / Circuit Court are alternatives) | Assessor → BOR → PTAB **or** Circuit Court | il-cook.json:39–43 | **VERIFIED** — they are alternatives, not sequential. BOR FAQ: "you may choose to appeal further to the Cook County Circuit Court or the Property Tax Appeal Board (PTAB)." | `https://www.cookcountyboardofreview.com/about/frequently-asked-questions` | 2026-08-15 | The encoded ordering and the "or" are both correct. |
| `forms[ccao-online].pdfUrl` | `https://www.cookcountyassessor.com/online-appeals` | il-cook.json:48 | **CORRECTED** — stale domain (see row 1) | `https://www.cookcountyassessor.com/appeals` (301) | 2026-08-15 | Target path not independently confirmed; Assessor site unreadable. |
| `forms[bor-complaint].pdfUrl` | `https://www.cookcountyboardofreview.com/` (site root) | il-cook.json:54 | **CORRECTED** → `https://appeals.cookcountyboardofreview.com/SubmitAppeal/AppealPage1` | `https://www.cookcountyboardofreview.com/assessment-appeals/residential` | 2026-08-15 | Filing is via an online portal; there is no residential PDF complaint form at the encoded URL. |
| `evidenceStandard` — evidence deadline | not modelled | il-cook.json:58 | **CORRECTED / GAP** — there is a **separate evidence-submission deadline after the filing deadline** | `https://www.cookcountyboardofreview.com/sites/g/files/ywwepo261/files/document/file/2026-08/2026TOWNSHIPOPEN-CLOSE.pdf` | 2026-08-15 | 2026 Group 1: filing closes 9/1/2026, **evidence submission deadline 9/11/2026**. The engine has no evidence-deadline concept, so it cannot warn a user who files on time and then misses the evidence date. |
| `evidenceStandard` — comp counts, photo rules | "Photographs and comparable assessment printouts are accepted" | il-cook.json:58 | **UNRESOLVED** | `https://www.cookcountyboardofreview.com/board-review-official-rules` | 2026-08-15 | BOR Official Rules set no comparable-count quota (Rule 14 requires a brief with "Valuation Evidence relied upon"). FAQ says photographs are "strongly encouraged", not required. Assessor-side rules unreadable. |
| `argumentTypes` / `primaryArgument` | `["UNIFORMITY","MARKET_VALUE"]`, primary `UNIFORMITY` | il-cook.json:59–60 | **UNRESOLVED** | `https://www.cookcountyboardofreview.com/board-review-official-rules` | 2026-08-15 | The Official Rules do not enumerate permissible grounds. The BOR home page frames its role as appeals of "the over-valuation of property assessments" — wording that supports MARKET_VALUE and does **not** confirm UNIFORMITY as the primary residential ground. Since `primaryArgument` selects the whole ratio model in `ratio.ts`, this is a high-stakes unresolved item. |
| `compsWindowMonths` | `18` | il-cook.json:61 | **UNRESOLVED** | — | 2026-08-15 | No published standard found in any reachable source. Remains an unsourced default. |
| `assessmentLevelPctOfMarket` | `10` | il-cook.json:62 | **UNRESOLVED** | — | 2026-08-15 | The Cook County Classification Ordinance could not be reached (`ilga.gov`, `tax.illinois.gov`, `illinois.gov`, `cookcountyassessoril.gov` all unreachable). Only secondary summaries support 10%. **Not verified — do not flip the citation flag on this.** |
| `estimatedTaxRateOnAssessedBps` | `2000` | il-cook.json:63 | **UNRESOLVED** | — | 2026-08-15 | Self-described as a rough estimate. Cook's effective burden is *assessment level × state equalization factor × composite local rate*; the equalizer alone moves annually and no official source for it was reachable. This value is multiplied directly into the user-facing "estimated annual overpayment" in `verdict.ts`. Model the factors explicitly rather than collapsing them into one constant. |

---

## Bergen County (`packages/engine/src/rules/counties/nj-bergen.json`)

Primary source for most rows: the **NJ Division of Taxation, *Handbook for New Jersey
Assessors*, Chapter 11 (Tax Appeals)** — a State Division of Taxation publication.
Fetched from a New Jersey municipal `.gov` host because `nj.gov`'s own copy of this
chapter was not located; the document is the Division's, and its section numbering
(§1105.01–§1105.20) and statutory references are quoted below.

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Bergen County citation URL | `https://www.co.bergen.nj.us/board-of-taxation` | nj-bergen.json:10 | **FIXED 2026-08-15** — now `https://bergencountynj.gov/faq/tax-appeals/`, `verified: true` | `https://bergencountynj.gov/faq/tax-appeals/` | 2026-08-15 | `co.bergen.nj.us` times out; the county's current official site is `bergencountynj.gov`. |
| N.J.S.A. 54:3-21 citation URL | `https://www.njleg.state.nj.us/` | nj-bergen.json:16 | **STILL UNRESOLVED** — left in place, `verified: false` | — | 2026-08-15 | `njleg.state.nj.us` refuses connections from this environment. Note the encoded URL is a bare site root, not a deep link to the section — it would not satisfy the citation invariant even if reachable. |
| Form A-1 citation URL | `https://www.nj.gov/treasury/taxation/pdf/other_forms/lpt/a1.pdf` | nj-bergen.json:22 | **FIXED 2026-08-15** — now `https://www.nj.gov/treasury/taxation/pdf/other_forms/lpt/petappl.pdf` | HTTP 404 confirmed on the encoded URL; HTTP 200 `application/pdf` confirmed on `petappl.pdf` | 2026-08-15 | **Dead link.** Current revision is "Form A-1 (6-26)". The Division's own handbook links `petappl.pdf`. |
| `appealWindow.deadline` / `fixedMonth` / `fixedDay` | 2027-04-01 / 4 / 1 | nj-bergen.json:29, 32–33 | **VERIFIED** — April 1 | `https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml` | 2026-08-15 | "Petitions must be filed and received on or before April 1st." |
| Deadline "whichever is later" (45-day) condition | described in `deadlineRule` | nj-bergen.json:30 | **VERIFIED** — "an appeal to the county board must be filed by April 1 or 45 days from the date the Notification of Assessment is mailed by the taxing district, whichever is later" (N.J.S.A. 54:3-21) | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` (NJ Div. of Taxation handbook); corroborated at `https://www.paramusborough.gov/251/Tax-Appeals` | 2026-08-15 | The handbook adds the mechanism the rules file omits: the deadline extends past April 1 "whenever a municipality has not completed the bulk mailing … at least 45 days prior to April 1", based on the certification of bulk mailing filed with the county board. The engine cannot currently model this — it has no bulk-mailing date input. |
| Postmark vs received-by | not encoded | nj-bergen.json:30 | **FIXED 2026-08-15** — `appealWindow.filingCutoff: "RECEIVED_BY"` + `filingCutoffNote`, carried on `DeadlineInfo` and stated in the verdict block and evidence summary | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.01 | 2026-08-15 | Handbook §1105.01: "The word 'filed' has been interpreted by the courts to mean received in the office of the County Board of Taxation by April 1. **A postmark of a mailed petition is not sufficient.**" This is a user-harming omission — a countdown that implies "mail it by April 1" is wrong. |
| Weekend / holiday rollover | not encoded | nj-bergen.json:27–34 | **STILL UNRESOLVED / GAP** — not modelled in Batch A — "If the last day for filing falls on a Saturday, Sunday, or legal holiday, then the filing deadline is the first business day thereafter." | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.01 | 2026-08-15 | Not modelled in `deadline.ts`. |
| May 1 revaluation deadline | described in `deadlineRule` | nj-bergen.json:30 | **VERIFIED** | `https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml` | 2026-08-15 | "Where a municipal revaluation or reassessment has been undertaken, petitions must be filed and received by May 1st." |
| `filingFee.amountCents` | `2500` (flat $25) | nj-bergen.json:36 | **FIXED 2026-08-15** — `filingFee.bands` now encodes the four statutory tiers and `filingFeeFor(county, assessedValue)` selects among them; the scalar survives only as the no-parcel fallback. The fee is **tiered**, not flat. Under $150,000 → **$5**; $150,000 to <$500,000 → **$25**; $500,000 to <$1,000,000 → **$100**; $1,000,000 or more → **$150**. (N.J.S.A. 54:3-21.3; N.J.A.C. 18:12A-1.6(d) and 1.7) | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.04 | 2026-08-15 | **Verdict-affecting.** `verdict.ts` compares estimated savings against this fee. Also unencoded: classification-only appeals are $25 per reclassification; appeals other than valuation/classification are a flat $25; and **no fee** is charged for appeals from denial of veteran, surviving-spouse, senior/disabled, or disabled-veteran deductions and exemptions. A scalar cannot express this — the field needs to become a schedule. |
| `filingFee.waiverConditions` (tier description) | "approximately $5 / $25 / $100 / $150" | nj-bergen.json:37 | **FIXED 2026-08-15** — "approximately" dropped; the deduction/exemption fee waiver added to the prose | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.04 | 2026-08-15 | Drop "approximately". The tiers are exact and statutory. The prose is right; the machine-readable scalar above it is wrong. |
| `appealBody` | "Bergen County Board of Taxation" | nj-bergen.json:39 | **VERIFIED** | `https://bergencountynj.gov/faq/tax-appeals/` | 2026-08-15 | County site also uses the short form "Bergen County Tax Board". |
| `levels` + direct-to-Tax-Court threshold | County Board → Tax Court (direct if > $1,000,000) | nj-bergen.json:40–43 | **VERIFIED** — $1,000,000 | `https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml`; `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.01 | 2026-08-15 | "If the assessed valuation of the property being appealed exceeds $1,000,000, the taxpayer … may file a petition of appeal directly with the Tax Court." **Caution:** `bergencountynj.gov` states $750,000 — that figure is the *added/omitted assessment* threshold (aggregate assessed valuation over $750,000), not the regular threshold. Do not adopt the county FAQ's number. Also unencoded: appeal from a county board judgment to the Tax Court is due within **45 days** of the judgment's mailing. |
| `forms[A-1].pdfUrl` | `…/lpt/a1.pdf` | nj-bergen.json:48 | **FIXED 2026-08-15** → `https://www.nj.gov/treasury/taxation/pdf/other_forms/lpt/petappl.pdf` | HTTP 404 on encoded URL; HTTP 200 `application/pdf` (1,077,529 bytes) on `petappl.pdf` | 2026-08-15 | **Dead link.** Form name "Petition of Appeal (Form A-1)" is correct (handbook §1105.03). |
| `forms[A-1-comp-sales].pdfUrl` | `…/lpt/a1compsale.pdf` | nj-bergen.json:54 | **FIXED 2026-08-15** → `https://www.nj.gov/treasury/taxation/pdf/other_forms/lpt/a1compsales.pdf` (plural), and renamed to the official "A-1 Comp. Sale" | HTTP 404 on encoded URL; HTTP 200 `application/pdf` (242,968 bytes) on `a1compsales.pdf` | 2026-08-15 | **Dead link.** Official form name is "**A-1 Comp. Sale**" (handbook §1105.03), not "Comparable Sales Analysis attachment". |
| `evidenceStandard` — 7-day rule | "submitted at least 7 days before the hearing" | nj-bergen.json:58 | **PARTIAL** — the 7-day rule is confirmed as an obligation **on the assessor**, not (from this source) on the taxpayer | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1103.02 | 2026-08-15 | "seven days prior to the hearing date, the assessor must provide the taxpayer all evidence to be presented." The county site confirms a 7-day rule for **appraisal reports** filed by the taxpayer. The general taxpayer-side rule lives in N.J.A.C. 18:12A-1.9 — **not fetched**. Confirm before telling a user this is their deadline. |
| `evidenceStandard` — "up to five comparable sales" | "commonly up to five" | nj-bergen.json:58 | **STILL UNRESOLVED** — the unsourced "five" and "24 months" figures were REMOVED from the prose rather than left asserted | — | 2026-08-15 | No count found in the handbook or on the county site. The figure appears to derive from the row count on the A-1 Comp. Sale form, which is not the same as a legal limit. |
| Valuation date (October 1 of the pre-tax year) | in `evidenceStandard` prose | nj-bergen.json:58 | **VERIFIED** | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.18 | 2026-08-15 | "True value … the price a willing buyer would pay a willing seller at private contract on **October 1 of the pretax year**." (N.J.S.A. 54:1-35a, 1-35b, 4-23.) Encoded as prose only; not enforced in `comps.ts`. |
| **Chapter 123 ±15% corridor** | described in prose; **not modelled** | nj-bergen.json:58 | **FIXED 2026-08-15 (code) / STILL UNRESOLVED (data)** — rule implemented; ratio table empty | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §§1105.19–1105.20; `https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml`; `https://bergencountynj.gov/faq/tax-appeals/` | 2026-08-15 | See the dedicated section below. **This is the single largest correctness gap in the NJ ruleset.** |
| `argumentTypes` / `primaryArgument` | `["MARKET_VALUE"]` only | nj-bergen.json:59–60 | **PARTLY FIXED 2026-08-15** — `evidenceStandard` no longer claims relief *requires* falling outside the corridor. `argumentTypes` still lists MARKET_VALUE only: the separate discrimination ground is real but is not modelled | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.02(A) | 2026-08-15 | "**Discrimination appeals.** Where a taxpayer alleges discrimination **other than the Common Level** in his assessment it must indicate so on the petition of appeal." Confirmed by *North Brunswick Twp. v. Gochal*, 27 N.J. Tax 31 (Tax Ct. 2012), quoted in the handbook: "While Chapter 123 is not the exclusive remedy for discrimination in assessment, 'a taxpayer's right to relief should be determined in accordance with Chapter 123 in all but the most extreme or severe circumstances'." So MARKET_VALUE-only is *nearly* right and right for the product's purposes, but the flat statement in `evidenceStandard` that relief *requires* falling outside the corridor is an overstatement of an otherwise-correct rule. |
| `compsWindowMonths` | `24` | nj-bergen.json:61 | **STILL UNRESOLVED** — unchanged | — | 2026-08-15 | No sale-recency window found in any fetched source. Unsourced default. |
| `assessmentLevelPctOfMarket` | `100` | nj-bergen.json:62 | **STILL UNRESOLVED** — but no longer load-bearing: the per-municipality lookup it was standing in for now exists at `commonLevelRange.municipalities`, and the verdict path does not read this field | `https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF` §1105.19 | 2026-08-15 | Each municipality has its own Director's Ratio, published annually on April 1; 100% holds only in a district at exactly the county percentage level. Bergen County contains 70 municipalities with differing ratios. This must become a per-municipality lookup, not a county constant. |
| `estimatedTaxRateOnAssessedBps` | `230` | nj-bergen.json:63 | **STILL UNRESOLVED** — unchanged | — | 2026-08-15 | Self-described county-average estimate. General tax rates are struck per municipality per year. Feeds the user-facing overpayment figure in `verdict.ts`. |

---

## NJ Chapter 123 — the rule, and what the engine does about it

> **STATUS AFTER BATCH A (2026-08-15).** The rule below is now implemented in
> `packages/engine/src/common-level-range.ts`, including clauses (3) and (4). The
> county rules schema gained `reliefModel` (`GAP` | `COMMON_LEVEL_RANGE`) and a
> `commonLevelRange` block carrying the corridor width (1500 bps, multiplicative), the
> county percentage level (10000 bps), the 1 April republication cadence, the re-fetch
> URL, and a per-municipality `municipalities[]` table of dated, cited Director's
> Ratios. **That table is empty.** No municipal ratio has been read from a primary
> source, so `applyCommonLevelRange` returns `CANNOT_DETERMINE` and `decideVerdict`
> returns a `CANNOT_DETERMINE` verdict naming the missing input — it does not fall back
> to the generic threshold. The original finding is preserved verbatim below.

### The original finding (2026-08-15 verification pass)

**Statutory basis:** N.J.S.A. 54:1-35a (average ratio); N.J.S.A. 54:3-22(c) (limits the
relief a county board may grant); N.J.S.A. 54:51A-6 (the same limit on the Tax Court).
Source fetched: NJ Division of Taxation, *Handbook for New Jersey Assessors*, ch. 11,
§§1105.19–1105.20 —
`https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF`

### The rule as published

> **§1105.19** On April 1 each year the Director, Division of Taxation publishes an
> "Average Ratio" and a "Common Level Range" for each municipality. … The "Common
> Level Range" for a taxing district is that range which is calculated to be 15% plus
> and minus the Average Ratio. For example, where the average ratio is found to be
> 78.00%, the Common Level Range would be: Lower Limit — 66.30%, Upper Limit — 89.70%.

Note the arithmetic: the ±15% is **multiplicative on the ratio**, not 15 percentage
points. 78.00 × 0.85 = 66.30; 78.00 × 1.15 = 89.70.

> **§1105.20 Calculation of Chapter Relief.** A ratio is struck by dividing the
> assessed value of the property under appeal by the true value of the property as
> determined by the hearing body. This ratio is called "Subject Property Ratio."
>
> 1. If the Subject Property Ratio falls **within** the Common Level Range, **no
>    reduction is to be made** in the assessed value of the appealed property, subject
>    to (3) and (4) below.
> 2. If the Subject Property Ratio **exceeds the Upper Limit** … **or falls below the
>    Lower Limit** …, the assessment is to be determined by **multiplying the Average
>    Ratio for the taxing district … times the true value** for the subject property as
>    determined by the hearing body, subject to (3) and (4) below.
> 3. If the Subject Property Ratio exceeds the County Percentage Level (100%) and the
>    district's Average Ratio is below the County Percentage Level (100%), the
>    assessment is determined by multiplying the Average Ratio … times the true value.
> 4. If the Subject Property Ratio exceeds the County Percentage Level (100%) and the
>    district Average Ratio also exceeds the County Percentage Level (100%), the
>    assessment is determined by multiplying the County Percentage Level times the true
>    value.

Three consequences the engine did not capture before Batch A, and now does:

1. **A gap can be real and still non-actionable.** If the Subject Property Ratio lands
   inside the corridor, the board grants nothing — regardless of how large the
   over-assessment looks. `verdict.ts` will happily return `STRONG_CASE` on a 12%
   over-assessment that Chapter 123 requires the board to deny.
   **FIXED** — outcome `NO_RELIEF` → `NOT_WORTH_IT`, relief reported as $0. Test:
   "inside the corridor: no relief, however over-assessed the comparables make it look"
   (13.3% raw gap, ratio 85.00% inside 66.30–89.70).
2. **The relief amount is not the over-assessment.** When relief *is* due, the new
   assessment is `Average Ratio × true value` — not the engine's
   `impliedFairAssessmentCents` from `ratio.ts`. The dollar figure shown to the user is
   computed on the wrong basis even when the verdict direction is right.
   **FIXED** — `statutoryAssessmentCents = applyBps(trueValue, averageRatioBps)`, and
   `verdict.overAssessmentCents` carries the statutory relief. Test asserts the two
   figures differ ($92,000 statutory vs $110,000 from the comparables).
3. **Falling below the lower limit triggers an increase.** Clause 2 is symmetric, and
   `bergencountynj.gov` states it plainly: "If assessment-to-value ratio exceeds the
   average by 15%, the assessment is automatically reduced to common level. If below
   common level, the assessment is increased to match it." `verdict.ts` currently warns
   about review risk only in the `overCents <= 0` branch, in prose. In New Jersey the
   increase is not a risk — it is the statutory outcome.
   **FIXED** — outcome `INCREASE`, headline "Do not file: Chapter 123 would raise your
   assessment by $X", and an `irreversible`-severity warning in the verdict block (the
   flag colour is reserved for exactly this kind of one-way harm).

### Required inputs the engine does not have

- The municipality's **Average Ratio (Director's Ratio)** for the tax year. Published
  annually on 1 April, per municipality. Current tables:
  `https://www.state.nj.us/treasury/taxation/lpt/chapter123.shtml` (linked from the
  handbook; **not fetched** — confirm the live path under `nj.gov` before encoding).
  **STILL UNRESOLVED.** The schema slot exists and is empty. Recorded in the rules file
  as `commonLevelRange.sourceUrl` so the next pass knows where to look.
- The **County Percentage Level** (100%). **ENCODED** as
  `countyPercentageLevelBps: 10000`.
- A per-municipality identifier on the parcel. `assessmentLevelPctOfMarket: 100` at the
  county level cannot stand in for this. **ENCODED** as optional
  `Property.municipalityId`; absent → `CANNOT_DETERMINE` with that stated as the reason.

**Recommendation for this phase — now satisfied in code:** no NJ verdict is presented
as filing guidance. The NJ path returns `CANNOT_DETERMINE`, the verdict block carries a
caution stating that the corridor test cannot be run, and the methodology page explains
the rule and why no New Jersey answer is published yet.

### What to do next on this item

1. Fetch the Chapter 123 table from `nj.gov` (confirm the live path) and encode Bergen's
   ~70 municipalities into `commonLevelRange.municipalities`, each with
   `averageRatioBps`, `taxYear`, `effectiveFrom`/`effectiveTo` and a citation. The rules
   loader rejects any entry without one.
2. Add a municipality selector to the check form so `Property.municipalityId` is
   populated.
3. Re-pull the table every 1 April.

---

## Cross-cutting

- **`packages/engine/src/data/sample-parcels.json` remains synthetic.** Unchanged by
  this pass and by Batch A; the existing labelling in the file, the engine exports, and
  the UI is still required and still present. No parcel was given a `municipalityId`,
  because attaching a real New Jersey municipality to a fictional parcel would imply a
  real place.
- **Credentialed reviewer** (property-tax consultant or attorney) still not secured.
  Portfolio invariant 8 is unsatisfied. Nothing in this document substitutes for that
  review: this pass checked whether encoded values match their sources, which is not
  the same as confirming they are legally sufficient.
- **No values were changed by the verification pass itself.** `_verificationNote` keys
  were added to both county rules files recording what each value depends on and where
  to re-check it. **Batch A (2026-08-15) then changed exactly the six items listed at
  the top of this document.** `il-cook.json` was touched only to add the
  `reliefModel: "GAP"` schema field — no Cook value, calendar, fee or assessment level
  was altered or invented.
- **Re-check cadence:** Cook township calendars are republished each session (the 2026
  Board of Review calendar is dated 2026-08); NJ filing-fee tiers and the
  direct-to-Tax-Court threshold change only by statute, but the Chapter 123 average
  ratios are republished **every 1 April** and must be re-pulled annually.
