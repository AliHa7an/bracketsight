# VERIFICATION-STATUS — Phase 1 master

Primary-source verification of every numeric constant and encoded legal rule across
all five engines. Compiled 15 Aug 2026.

**No numeric value in any engine was changed by this pass.** Every correction below is
recorded for review only. Per-repo detail, with a source URL on every row, lives in each
repo's own `VERIFICATION-STATUS.md`.

## Totals

| Repo | Rows | Verified | Corrections | Unresolved | Detail |
|---|---:|---:|---:|---:|---|
| repayment-atlas | 74 | 54 | 9 | 10 | [detail](repayment-atlas/VERIFICATION-STATUS.md) |
| clearpaycheck | 98 | 80 | 17 | 1 | [detail](clearpaycheck/VERIFICATION-STATUS.md) |
| cliffcheck | 56 | 41 | 7 | 2 | [detail](cliffcheck/VERIFICATION-STATUS.md) |
| fairparcel | 38 | 13 | 13 | 12 | [detail](fairparcel/VERIFICATION-STATUS.md) |
| jobpaper | 49 | 15 | 23 | 11 | [detail](jobpaper/VERIFICATION-STATUS.md) |
| **Total** | **315** | **203** | **69** | **36** | |

Seven further rows are sample or synthetic data that is not verifiable by design
(CliffCheck's six invented county premiums; one N/A row in repayment-atlas).

## The evidence rule this pass ran under

Every row carries either a URL that was fetched and returned the cited content, or the
word UNRESOLVED. No figure came from model recall. Where a source was unreachable the
item stayed unresolved rather than being filled in — 36 times.

**A tool-reliability warning that justifies the whole approach.** While verifying the
ACA applicable-percentage table, the summarising fetch layer misreported Rev. Proc.
**2025-25** as "2025-21" and returned a **completely fabricated** percentage table
(0.00/2.00, 2.00/4.00, …). The engine's existing table was already correct; trusting
that summary would have "corrected" a right answer into garbage. Every figure in these
documents was read from PDF or statute text extracted directly, not from a summary.

## Source access

Reachable: `govinfo.gov` (the workhorse — full GPO text of the Federal Register, the
U.S. Code and enrolled public laws), `aspe.hhs.gov`, `irs.gov`, `leginfo.legislature.ca.gov`,
`nysenate.gov`, `nj.gov`, `bergencountynj.gov`, `cms.gov`.

Blocked: `ecfr.gov` and `federalregister.gov` (302 to a bot-block on **every** path — a
response from these hosts proves nothing, since a placeholder URL and a real one behave
identically), `congress.gov` (403), `uscode.house.gov` (refused), `ssa.gov` (403),
`bls.gov` (403 on every path), the Texas / Florida / Pennsylvania legislature sites, and
`cookcountyassessoril.gov`.

Consequence: Texas, Florida and Pennsylvania statutes are verified only through
secondary sources, labelled `[SECONDARY]` on every affected row. Cook County
Assessor-side values and all BLS wage anchors remain unresolved.

---

## Findings that are defects, not documentation gaps

Ordered by how much harm they do if shipped.

### 1. JobPaper generates legally deficient contracts

Four of five states prescribe **verbatim** statutory notice text with type-size and
placement requirements. The placeholders get all of it wrong, and two required notices
are missing entirely.

| State | Defect |
|---|---|
| NY | GBL §771(1)(d) mechanic's lien notice — **absent entirely** |
| TX | Bus. & Com. §601.053 Notice of Cancellation form — **absent**, yet `right-to-cancel-solicitation` tells the customer it is attached |
| TX | Prop. Code §53.255 disclosure statement — absent |
| FL | §713.015(1) notice — encoded text is **truncated mid-notice** |
| CA | Four §7159 notices — all paraphrased; three carry 12-pt type rules the schema cannot express |

Also: `licenseDisplayRequired: true` for New York is wrong (GBL §771(1)(a) says "if
applicable"; NY licensing is county/municipal, so upstate contractors are told to print a
number that does not exist). PA's down-payment cap cites §517.7(e) instead of §517.9, and
its `> 33%` trigger contradicts the clause's own prose. TX §53.259 has no dollar
threshold, so the encoded `> $5,000` suppresses a required clause on smaller contracts.

The statutory notice texts were deliberately **not** transcribed: the fetch tool caps
direct quotation at 125 characters, and writing statutory language from recall is exactly
the failure this pass exists to prevent. Each row carries the URL to transcribe from.

### 2. CliffCheck states a repayment cap that Congress repealed

`repayment-limits.2026.json` encodes IRC §36B(f)(2)(B). **OBBBA (Pub. L. 119-21) §71305
struck that provision outright**, effective for tax years after 31 Dec 2025. For 2026
there is **no repayment cap at any income level** — full clawback for everyone, not only
at or above 400% FPL. The file currently tells a household at 250% FPL their exposure is
capped at $1,000. It is not. Verified twice: statute text on govinfo, and Rev. Proc.
2025-32 §2.04 removing the indexing.

### 3. CliffCheck's cliff edge is off by up to a full percentage point

`fpl.ts:43` asserts "400.9% is still 400" and uses a bare `Math.floor`. Form 8962
**Worksheet 2** tests *first* whether income exceeds 4.0 × FPL and enters **401**
(ineligible) if so; truncation is only reached in the "No" branch. `magiAtPctEdge(fpl, 400)`
therefore overstates the last eligible MAGI by up to ~1% of FPL — about **$321 for a
family of four**, at precisely the edge this product exists to locate.

### 4. Repayment Atlas sends 2028 migrants to the wrong plan

34 C.F.R. §685.209(c)(7)(iii)(A) places a non-electing PAYE/ICR borrower into **RAP**
where their loans qualify, otherwise IBR. The engine models "PAYE → New IBR, ICR → Old
IBR". Payment-credit carryover is also asymmetric in the regulation, not flat.

### 5. Repayment Atlas wrongly denies RAP to a real cohort

§685.209(b)(6)(ii): a consolidation containing Parent PLUS that was repaid under
ICR/PAYE/IBR between 4 Jul 2025 and 30 Jun 2028 is **not** an excepted consolidation loan,
so it **is** RAP-eligible. The `underlyingHadParentPlus` taint is unconditional. Needs a
new input field.

### 6. ClearPaycheck rounds the phase-out the wrong way, twice

Schedule 1-A lines 11 and 19 require the step count to be **decreased** to the next lower
whole number. `fractionCountsAsFullStep` is `true` (rounds up), and the `false` branch in
`phase-out.ts:29-31` is `roundHalfUpToCent` — round-half-up, not floor. **Flipping the
flag alone does not fix it.**

Car-loan is deliberately the opposite (IRC §163(h)(4)(C)(ii)(I), "or portion thereof";
Schedule 1-A line 28 rounds up) and must **not** be harmonised with the other two.

### 7. ClearPaycheck over-pays two-senior joint returns

The 6% reduction runs against the *per-person* $6,000 and is then entered once per
qualifying spouse. At $200,000 MAGI the correct deduction is $6,000; `senior.ts` returns
$9,000. Married-filing-separately is also not barred, though IRC §151(d)(5)(C)(v) bars it.

### 8. FairParcel does not implement New Jersey's Chapter 123

Verified precisely: Common Level Range = Average Ratio ±15%, multiplicative. Inside the
range there is **no reduction**; below it the assessment is **increased** by statute. A
grep finds the rule only as prose in `nj-bergen.json:58` — `verdict.ts` decides New Jersey
on a generic 5%/10% threshold. So a homeowner inside the corridor is told STRONG_CASE when
the appeal is non-actionable, and one below it is warned of "review risk" rather than a
statutory increase. Requires a per-municipality Director's Ratio, republished each 1 April,
for which the schema has no field.

---

## Corrections to values (no code changed)

| Repo | Figure | Current | Correct | Source |
|---|---|---|---|---|
| repayment-atlas | Poverty guideline, 48 states | $15,650 / $5,500 | **$15,960 / $5,680** | ASPE 2026 |
| repayment-atlas | Poverty guideline, Alaska | $19,550 / $6,880 | **$19,950 / $7,100** | ASPE 2026 |
| repayment-atlas | Poverty guideline, Hawaii | $17,990 / $6,325 | **$18,360 / $6,530** | ASPE 2026 |
| cliffcheck | 2025 FPL, Hawaii additional person | $6,325 | **$6,330** | 90 FR 5917 |
| clearpaycheck | Occupation code 205 | "Musician or singer" | **"Dancers"** — list off by one from 205 on | TD 10044 |
| clearpaycheck | Occupation count | 66 | **71** official | 26 CFR §1.224-1(h) |
| cliffcheck | IRA single deductibility phase-out | $79k–$89k (2025) | **$81,000–$91,000** | IRS 2026 |
| fairparcel | Bergen filing fee | flat $25 | **tiered $5 / $25 / $100 / $150** | N.J.S.A. 54:3-21.3 |
| fairparcel | NJ form URLs | both 404 | `petappl.pdf`, `a1compsales.pdf` | nj.gov |

Not modelled at all, and each understates a real user's position: the §63(f) aged
additional standard deduction ($1,650, or $2,050 unmarried) which **stacks** with the
$6,000 senior deduction; the SECURE 2.0 age 60–63 catch-up ($11,250); eight car-loan
eligibility rules (GVWR under 14,000 lbs, first-lien, lease/fleet/salvage/related-party
exclusions, refinancing cap, VIN on return, negative-equity); Cook County's separate
evidence deadline.

---

## Verified correct — worth recording

These were flagged as suspect and turned out to be right. Two would have been broken by a
well-meaning "fix".

- **RAP's bracket boundary.** §685.209(b)(2) uses intervals closed at the top — *"More
  than $50,000 and not more than $60,000, is 5 percent"*. $60,000 → 5% → **$250/month**.
  The engine's `ceil()` is correct; **`PRODUCT-SPEC.md` §11.5's `floor()` pseudocode is
  wrong and should be corrected to match the code.**
- **Tiered Standard uses the opposite convention** (*"equal to or greater than $25,000 but
  less than $50,000"* — boundary goes to the higher tier). Both are correct for their own
  direction. Do not harmonise them.
- **CliffCheck's `fpl.2025.json` is correct by design.** ACA uses the guidelines published
  in the prior calendar year: 2026 coverage → 2025 guidelines. The 2026 ASPE figures are
  the **2027** numbers. Upgrading the file now would shift the cliff ~$620 for a single
  filer in the wrong direction.
- **CliffCheck's applicable-percentage table is exact** — all six bands verified against
  Rev. Proc. 2025-25 §3.01 (2.10/2.10, 3.14/4.19, 4.19/6.60, 6.60/8.44, 8.44/9.96,
  9.96/9.96), top band terminating at "not more than 400%".
- **ClearPaycheck's 2026 brackets are the real published figures**, not projections — all
  28 match Rev. Proc. 2025-32 §4.01.
- **The senior and car-loan deductions were fully verifiable**, contrary to their own
  `VERIFICATION-NEEDED.md`, and every placeholder amount was already correct. Senior lives
  at IRC §151(d)(5)(C), not §63.
- **RAP's core mechanics** — $10 floor, $50/dependent, $50 principal match, interest
  waiver, 360 payments, PSLF 120, and no payment cap (§685.209(f)(5) simply omits the
  "lesser of" clause that (f)(2) and (f)(3) carry).
- **Medicaid expansion flags**: all 51 correct. **CSR bands**: verified against
  42 U.S.C. §18071(c)(2). **SLCSP age curve**: all 65 factors match CMS Appendix I.
- **Deduction ordering**: Schedule 1-A computes MAGI once at line 3; no feedback loop.
- **Extended plan threshold** is exclusive (`> $30,000`), matching the regulation.

---

## Unresolved — 36 items needing manual confirmation

**Blocked by source access:** Cook County's residential assessment level (10%) and $0
Assessor fee; the Cook per-township deadline calendar and its separate evidence deadline;
all Texas, Florida and Pennsylvania statutory text (secondary sources only); all BLS wage
anchors for JobPaper's labour rates.

**Not yet published:** the 2026 Form 8962 (expected ~Jan 2027); the ED annual Federal
Register notice setting the ICR income-percentage factor (hardcoded 1.0).

**Unverifiable in principle:** JobPaper's entire pricing dataset — every unit cost,
labour-hour figure and regional multiplier — pending a commercial licence (RSMeans /
Craftsman). OEWS is the labour anchor but reports **employee wages, not billable rates**.
Graduated repayment's 24-month step interval has no regulatory basis at all (the rule says
only "two or more levels"), so it is a documented simplification rather than an unverified
figure.

**Cannot be ruled out:** a 2025–26 amendment to 26 U.S.C. §108 (only the 2024 edition was
obtainable); a Treasury regulation implementing IRC §225 (absence is not established,
since federalregister.gov could not be browsed).

**Data-pipeline gaps:** real CMS SLCSP benchmark premiums (the six encoded counties are
invented); current state-specific age curves — CMS's table is stamped Dec 2021 and shows
**NY and VT at 1:1**, meaning no age rating at all, which would break the encoded curve on
real data.
