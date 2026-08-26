# KEYWORD RESEARCH — the topic-cluster map

**Compiled 26 Aug 2026.** Input to the 50+ article programme registered in
`content/CONTENT-LOG.md`. This document chooses what gets written and in what
order. It does not write anything.

---

## 0. THE HONESTY RULE THIS DOCUMENT RUNS UNDER

**There is no keyword tool behind this file.** No Ahrefs, no Semrush, no
Keyword Planner export. Every statement about demand in this document is
therefore one of two things, and each row says which:

| Marker | Means |
|---|---|
| `EVIDENCED` | A source URL is given. A Reddit thread with visible engagement, a People Also Ask box observed in a live result set, a related-searches phrase, or an agency FAQ entry that exists *because the agency kept being asked*. The URL is the evidence; the inference from it to "demand" is still a judgement. |
| `INFERRED — no measurement` | Reasoning from intent and from how the rule change is structured. No source. Nothing here should be read as a volume estimate. |

**No monthly search volume appears anywhere in this file.** Not a range, not a
band, not a "high/medium/low" that is secretly a volume claim. Where this file
ranks clusters it ranks them on *four named factors* (§8), each of which is
itself either evidenced or inferred, and the ranking is a judgement about
those four — not a traffic forecast.

### How to replace inference with measurement later

The structure is built so a real export is a find-and-replace, not a rewrite:

1. Every cluster carries a **Primary keyword** line on its own. Paste the
   measured volume and KD onto that line; do not restructure the cluster.
2. Every cluster carries a **Demand evidence** line that begins with either
   `EVIDENCED —` or `INFERRED — no measurement`. Replacing the second with a
   measured figure is a one-line edit.
3. The prioritisation table (§8) scores `D` (demand) on a 1–5 scale that is
   explicitly *not* volume. When real volume lands, recompute `D` from it and
   leave `I`, `A` and `F` alone — they do not depend on volume.
4. Nothing downstream of this file (slugs, cluster ids, `CONTENT-LOG` rows)
   encodes a demand number, so re-scoring cannot invalidate work already done.

### A second honesty rule, specific to this site

A cluster is only worth writing **if the site can answer it with a real, cited
figure or a real engine computation.** Every cluster below therefore carries a
**Backed by** line naming the `figures.ts` id or the engine entry point it
rests on, and a **Gap risk** line naming any open item in `KNOWN-GAPS.md`
sitting underneath it. Three states are possible:

- **CLEAR** — the central figure is wired and carries no open gap.
- **DISCLOSE** — the figure is wired, an open gap sits under it, and
  `<KeyFigure>` will render the register's own words beside the number. The
  article is writable *provided it writes around the uncertainty honestly*.
- **BLOCKED** — the central figure does not exist, or the engine refuses to
  produce the answer. The article waits. It is listed here so it is not
  re-invented, and so the unblocking work is visible.

---

## 1. WHAT THE ENGINES CAN ACTUALLY ANSWER

Read before choosing a cluster. `src/lib/content/figures.ts` registers
**47 scalar figures and 5 tables**, and they are not evenly distributed:

| Tool | Scalar figures | Tables | Verdict |
|---|---:|---:|---|
| `loans` | 24 | 2 | **Deep.** Nearly every rule a borrower asks about is wired. |
| `aca` | 9 | 2 | **Deep enough.** The cliff, the applicable-percentage table, the CSR bands and the uncapped clawback are all wired. |
| `paycheck` | 8 | 0 | **Adequate.** All four OBBBA deductions have their caps and thresholds wired; no table figure exists yet. |
| `property` | 3 | 0 | **Thin.** Cook assessment level, Cook estimated tax rate, NJ common level range corridor. That is the whole numeric surface. |
| `trades` | 2 | 1 | **Thinnest.** CA and NY contract thresholds, plus the by-state threshold table. All pricing data is placeholder. |

**But `figures.ts` is not the whole surface.** An article that needs a
*computed* result calls the engine in its own page. That materially widens
what `property` and `trades` can support, and it is the only way those two
sections get written at all this year:

| Engine | Computes | Article uses it for |
|---|---|---|
| `repayment` | `simulateAllPlans` — nine plans, month by month, ranked by lifetime cost; nine warning codes including `RAP_ONE_WAY_DOOR`, `RAP_EXCEEDS_STANDARD`, `PAYE_ICR_SUNSET`, `RAP_EXTRA_PAYMENT_BACKFIRE`, `PARENT_PLUS_RAP_INELIGIBLE` | Crossover points, "at what income does RAP overtake Standard", forfeiture cost |
| `paycheck` | `computeDeductions`, `overtimePremiumCents`, `phaseOutReduction`, `searchOccupations` over **71 qualified tip occupations in 8 categories** | "what my deduction is actually worth", the half-time premium gap, occupation eligibility |
| `aca` | `analyzeHousehold`, `reconcileAdvanceCredit`, and the **six-lever** engine (`TRADITIONAL_401K`, `HSA`, `TRADITIONAL_IRA`, `SEP_SOLO_401K`, `SE_HEALTH_INSURANCE`, `INCOME_TIMING`) with `amountToClearCliff` per lever | "one dollar over" cost, exact clawback, the cheapest way back under 400% |
| `property` | `runAssessmentCheck`, `common-level-range.ts` (Chapter 123 fully implemented), `deadline.ts`, `fees.ts`, `comps.ts` | Cook-specific mechanics; the NJ *rule*, not an NJ *verdict* |
| `trades` | `selectClauses` per state, `untranscribedClauses`, `canGenerateContract`, `buildEstimate` | **Which clauses a state requires** — available for all five states even where the *text* is blocked |

**The trades asymmetry matters and is under-appreciated.** `canGenerateContract`
returns false for CA, TX, FL and NY, so those states cannot produce a document.
But `selectClauses` still enumerates *which* clauses the statute requires and at
what dollar trigger, and the rule files carry verified rules that are not yet
`figures.ts` ids — CA's down-payment cap (`lesser of $1,000 or 10% of contract
price`, marked VERIFIED in `ca.json`), PA's one-third cap, NY's deposit-escrow
obligation, the per-state right-to-cancel windows. **Those are writable today.**
What is not writable today is any article whose payload is the notice text
itself, or any article whose payload is a dollar cost.

---

## 2. THE FRESHNESS CALENDAR — the site's strongest lever

Every cluster's `F` score in §8 traces to a row here. This is the whole
strategic case: the incumbents rank on head terms with content written before
these dates, and none of it has been rewritten.

| Date | What changed | Which tool | Still true on 26 Aug 2026? |
|---|---|---|---|
| 1 Jul 2026 | **RAP live.** RISE final rule, 91 Fed. Reg. 23768. Nine plans become the real choice set. | loans | Live 8 weeks |
| 1 Jul 2026 | A new federal loan disbursed after this date can restrict the borrower to **RAP only** | loans | Live |
| 1 Jul 2028 | **PAYE and ICR sunset.** Any 20-year projection must model forced migration | loans | 22 months out |
| TY 2025–2028 | **OBBBA deductions** — tips, overtime, senior, car-loan interest. Four-year window; TY2025 was the first filing season, TY2026 the first year with W-2 reporting | paycheck | In year 2 of 4 |
| 31 Dec 2025 | **ARPA/IRA enhanced premium credits expired.** The 400% FPL cliff is back for coverage year 2026 | aca | Live |
| TY after 2025 | **OBBBA § 71305 struck IRC § 36B(f)(2)(B)** — the clawback repayment caps are gone. Crossing 400% now repays the *entire* year's advance credit, uncapped | aca | Live, and badly under-covered |
| **1 Nov – 15 Dec 2026** | **2027 open enrolment, and it is shorter.** The 2025 Marketplace Integrity and Affordability final rule sets the federal-platform OEP at 1 Nov–15 Dec beginning with plan year 2027 — no 15 Jan deadline any more | aca | **9 weeks away. This is the single hardest deadline in the document.** |
| Every 1 April | NJ Chapter 123 Director's Ratios republished, per municipality | property | Next: 1 Apr 2027 |
| Annual, per township | Cook County appeal windows, published each session (2026 Group 1: opened 3 Aug, closed 1 Sep, evidence due 11 Sep) | property | Rolling |
| ~Jan 2027 | 2026 Form 8962 and instructions publish — closes GAP-033 | aca | Pending |

Sources for the OEP change: [CMS 2025 Marketplace Integrity and Affordability
Final Rule fact sheet](https://www.cms.gov/newsroom/fact-sheets/2025-marketplace-integrity-and-affordability-final-rule)
· [Federal Register 2025-11606](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability)

---

## 3. LOANS — 14 clusters

The deepest section: 24 wired scalar figures, 2 tables, a nine-plan simulator and
nine warning codes. It is also the section where the incumbents are most
comprehensively out of date, because RAP is 8 weeks old and every "which
repayment plan" page written before 1 Jul 2026 describes a choice set that no
longer exists.

**A note on the competitive field that applies to every loans cluster below.**
The head terms are not held by NerdWallet alone. A specialist tier has already
moved on RAP and is publishing fast: `thecollegeinvestor.com`,
`studentloanplanner.com`, `tateesq.com` (a student-loan lawyer),
`studentloansherpa.com`. These are *not* stale and should not be dismissed as
such. What they do not have is a nine-plan deterministic simulator with cited
rule provenance behind every number — they publish prose with worked examples.
The generalists (NerdWallet, Bankrate, Investopedia, Forbes Advisor) are the
stale ones, and they are the ones holding the highest-volume head terms.
Every difficulty read below distinguishes the two tiers.

---

### L1 · Which repayment plan is cheapest for me, now that there are nine

- **Primary keyword** — `best student loan repayment plan 2026`
- **Secondary / long-tail** — `which student loan repayment plan should I choose` · `compare federal student loan repayment plans` · `cheapest student loan repayment plan` · `student loan repayment plan comparison calculator` · `all federal repayment plans 2026` · `9 federal repayment plans` · `lowest total cost student loan plan` · `student loan plan comparison RAP IBR standard` · `loan simulator alternative` · `which repayment plan saves the most money`
- **Intent** — comparison, high commercial value, tool-shaped
- **PAA / sections** — Which repayment plan has the lowest monthly payment? · Which has the lowest *total* cost, and why are those different questions? · Which plans still exist after 1 Jul 2026? · Can I switch plans later, and is any switch irreversible? · Does my loan type restrict which plans I can use? · What does the government's own Loan Simulator not tell me?
- **Demand evidence** — `EVIDENCED`. studentaid.gov maintains a dedicated Loan Simulator comparison article, which is a strong signal the query is high-traffic enough for ED to build a tool around it: https://studentaid.gov/articles/compare-student-loan-repayment-plans-calculator/ . Competing calculators exist at Bankrate and NerdWallet: https://www.bankrate.com/loans/student-loans/student-loan-calculator/
- **Difficulty** — **Hard.** studentaid.gov holds the top slot with its own tool and cannot be outranked on brand. Bankrate/NerdWallet hold the commercial slots with calculators that are payment calculators, not ranking engines. The opening is precision, not volume: their calculators answer "what is my payment", ours answers "which of nine costs least over 30 years and which choice cannot be undone". Do not expect position 1; expect the long tail.
- **Feeds** — `/loans`. The article *is* the tool's thesis; the CTA is the simulator with a pre-filled scenario via `encodeScenario`.
- **Backed by** — `simulateAllPlans` (computed), `loans.tieredStandard.terms` table, `PLAN_NAMES`
- **Gap risk** — DISCLOSE. `GAP-034` (ICR income-percentage factor hardcoded to 1.0) makes ICR rank slightly better than it should for higher incomes; `GAP-048`/`GAP-049` (unmodelled second limbs of the PAYE and IBR new-borrower tests) can over-admit plans. A whole-field ranking article must say so.
- **Freshness** — The choice set changed on 1 Jul 2026 and changes again on 1 Jul 2028. Any competitor page whose plan list includes SAVE is wrong on its face.

---

### L2 · RAP vs IBR — the crossover, not the summary

- **Primary keyword** — `RAP vs IBR`
- **Secondary / long-tail** — `is RAP better than IBR` · `should I switch from IBR to RAP` · `RAP or IBR for my income` · `RAP vs IBR calculator` · `RAP 30 year forgiveness vs IBR 20 year` · `IBR vs RAP monthly payment` · `RAP vs IBR high income` · `RAP vs IBR low income` · `which is cheaper RAP or IBR` · `RAP vs new IBR vs old IBR`
- **Intent** — comparison
- **PAA / sections** — At what income does IBR become cheaper than RAP? · Does the shorter IBR forgiveness clock beat RAP's interest waiver? · Which IBR am I on — old or new? · Is RAP's payment really uncapped? · If I am close to IBR forgiveness, is switching ever right?
- **Demand evidence** — `EVIDENCED`. Three specialist publishers have dedicated RAP-vs-IBR pages, which is what a contested query looks like: https://thecollegeinvestor.com/60115/rap-vs-ibr/ · https://www.tateesq.com/learn/ibr-vs-rap · https://www.nerdwallet.com/student-loans/learn/what-is-the-new-repayment-assistance-plan-rap-for-student-loans . The College Investor states a crossover "around $90,000 AGI" — an unsourced round number that our engine can compute exactly, which is the whole opening.
- **Difficulty** — **Medium-hard.** The specialist tier is fresh and competent here; this is not a stale-content play. It is a *precision* play: they assert a crossover, we compute one from the borrower's own balance and rate and show the month it happens. Cite their round number and beat it with an exact one.
- **Feeds** — `/loans`. The tool produces the crossover for the reader's actual numbers.
- **Backed by** — `loans.rap.brackets` table, `loans.ibrOld.rate`, `loans.ibrNew.rate`, `loans.ibrOld.forgivenessPayments`, `loans.ibrNew.forgivenessPayments`, `loans.rap.forgivenessPayments`, `loans.idr.povertyMultiplier`, `simulateAllPlans`
- **Gap risk** — DISCLOSE. `GAP-049` — the IBR new-borrower test's second limb is unmodelled, so a 2014–2026 borrower who takes a post-2026 loan is ranked on New IBR terms when Old IBR applies. That is exactly the borrower this article is for.
- **Freshness** — RAP live 1 Jul 2026. The crossover did not exist as a question before that date.

---

### L3 · RAP has no payment cap — when the newest plan is the most expensive

- **Primary keyword** — `RAP payment cap`
- **Secondary / long-tail** — `does RAP have a payment cap` · `RAP payment higher than standard` · `RAP vs standard repayment` · `is RAP capped at 10 year standard` · `RAP high income payment` · `RAP more expensive than standard` · `RAP 10% of AGI` · `RAP payment calculator high earner`
- **Intent** — comparison
- **PAA / sections** — Is the RAP payment capped like IBR's? · At what income does RAP overtake the 10-year Standard payment? · Does the interest waiver make up for it? · Should a high earner with a moderate balance ever choose RAP?
- **Demand evidence** — `INFERRED — no measurement`. Derived from the rule structure, not from an observed query. This is the product's central insight and the least-covered fact about RAP; the coverage gap is itself the reason there is no visible query yet.
- **Difficulty** — **Easy to rank, hard to earn clicks.** Almost nobody has written it. That cuts both ways: low competition and low existing demand. Treat as an authority/linkable asset, not a traffic play.
- **Feeds** — `/loans`. `RAP_EXCEEDS_STANDARD` is a live warning code the simulator already emits.
- **Backed by** — `loans.rap.paymentCapped`, `loans.rap.topRate`, `loans.rap.brackets`, warning `RAP_EXCEEDS_STANDARD`
- **Gap risk** — CLEAR.
- **Freshness** — RAP live 1 Jul 2026.
- **Status** — **already written** as the pipeline proof `rap-can-cost-more-than-standard`. Keep it, re-review it, and treat it as the cluster hub rather than writing a second one.

---

### L4 · Switching to RAP forfeits your payment credit — the one-way door

- **Primary keyword** — `does switching to RAP reset my forgiveness clock`
- **Secondary / long-tail** — `switching from IBR to RAP lose payments` · `do IDR payments carry over to RAP` · `RAP payment count reset` · `can I switch back from RAP` · `is switching to RAP permanent` · `RAP forgiveness clock restart` · `years of IBR payments wasted RAP` · `RAP one way door`
- **Intent** — informational, extremely high stakes
- **PAA / sections** — Do my SAVE/PAYE/IBR payments count toward RAP's 360? · Is a *forced* migration in 2028 treated differently from a *voluntary* switch now? · Can I switch back to IBR after electing RAP? · How much does the forfeiture actually cost, in dollars?
- **Demand evidence** — `EVIDENCED`, and **the sources contradict each other and possibly contradict us**, which is the story. General coverage asserts flatly that "forgiveness credit carries between all income-driven repayment plans": https://thecollegeinvestor.com/74466/paye-and-icr-are-ending-what-borrowers-should-do/ · https://www.edcapny.org/student-loan-changes-2025-2028/ . The sharpest post-final-rule analysis found describes the asymmetry running the *other way* from the engine's model — prior IBR/PAYE/ICR credit carrying **into** RAP's 360, while RAP months do **not** count back toward legacy IDR forgiveness — and calls this the final rule's "major unexpected change", reversing draft expectations: https://vinfoundation.org/repayment-assistance-plan-rap-rules-finalized-major-unexpected-change-coming/ (6 May 2026).
- ⚠️ **ENGINE PRE-CONDITION, not just an article note.** If the VIN Foundation reading is right, the door is still one-way but hinged the opposite way, and both `warnings.ts` (`RAP_ONE_WAY_DOOR`) and the CLAUDE.md invariant are pointed the wrong direction. **This must be resolved against 34 C.F.R. § 685.209(k)(8) on govinfo before the article is written**, and the resolution belongs in `KNOWN-GAPS.md` GAP-035 either way. Do not write this article to whichever answer the engine currently holds.
- **Difficulty** — **Medium.** Nobody has written the *disagreement*. An article that lays out § 685.209(k)(8)(i)(C)(5), states precisely what is and is not settled, and shows the dollar cost either way is genuinely unique.
- **Feeds** — `/loans`. Warning `RAP_ONE_WAY_DOOR` (severity `IRREVERSIBLE`) is the only oxide-red item on the results page for this borrower.
- **Backed by** — warning `RAP_ONE_WAY_DOOR`, `loans.rap.forgivenessPayments`, `simulateAllPlans` with and without `priorQualifyingPayments`
- **Gap risk** — **DISCLOSE, hard.** `GAP-035` is the register's own regulatory-ambiguity row on exactly this question. The article must not assert; it must set out both readings, name the engine's conservative choice, and say the ambiguity is unresolved. Written that way it is the strongest trust asset in the programme. Written as an assertion it is the worst liability.
- **Freshness** — Live now; decisive between now and 1 Jul 2028.

---

### L5 · SAVE forbearance is ending — pick a plan before 30 September 2026

- **Primary keyword** — `SAVE forbearance ending what do I do`
- **Secondary / long-tail** — `SAVE plan ending 2026` · `SAVE forbearance September 30 2026` · `what happens if I don't pick a repayment plan` · `SAVE borrowers 90 day notice` · `moved from SAVE to standard repayment` · `SAVE plan interest accruing since August 2025` · `SAVE to IBR or RAP` · `my payment went from $0 to hundreds`
- **Intent** — informational, urgent, deadline-driven
- **PAA / sections** — What is the actual deadline? · What happens if I do nothing? · Did any of the forbearance months count toward forgiveness? · My SAVE payment was $0 — what will it be now? · Should a former SAVE borrower choose IBR or RAP?
- **Demand evidence** — `EVIDENCED`. Servicers began issuing 90-day notices on 1 Jul 2026 and the forbearance ends 30 Sep 2026, with automatic placement on Standard from 1 Oct 2026: https://thecollegeinvestor.com/77630/save-plan-forbearance-ending-what-to-know/ · https://www.nerdwallet.com/student-loans/learn/save-lawsuits . A mass mailing to millions of borrowers is about as reliable a demand signal as exists without a keyword tool.
- **Difficulty** — **Medium.** Well covered by the specialist tier and by news. Our angle is not "what is happening" — it is "here is the ranked answer for *your* balance and income, before 30 September".
- **Feeds** — `/loans`. This is the highest-conversion cluster in the section: a dated forced decision with a nine-plan answer.
- **Backed by** — `simulateAllPlans`, `loans.tieredStandard.terms`, `loans.rap.brackets`
- **Gap risk** — CLEAR for the mechanism. DISCLOSE where it recommends between IBR variants (`GAP-049`).
- **Freshness** — **5 weeks.** Deadline 30 Sep 2026. This cluster decays to near-zero value after that date and must be rewritten, not deleted, into "I was auto-enrolled in Standard — what now".

---

### L6 · The RAP interest waiver and the $50 principal match, precisely

- **Primary keyword** — `RAP $50 principal match`
- **Secondary / long-tail** — `RAP interest waiver how it works` · `does RAP cancel unpaid interest` · `RAP balance cannot grow` · `RAP principal reduction minimum` · `RAP interest subsidy vs SAVE` · `will my balance go down on RAP` · `RAP negative amortization` · `RAP $10 minimum payment`
- **Intent** — informational
- **PAA / sections** — Is the waived interest ever capitalised later? · What if my payment is less than $50? · Does the match apply if I pay late? · How is this different from SAVE's interest subsidy? · Can my balance still grow on RAP?
- **Demand evidence** — `EVIDENCED`. ED's own fact sheet leads on the interest and principal features: https://www.ed.gov/about/news/press-release/fact-sheet-trump-administration-simplifying-student-loan-repayment . The College Investor built a page around the match specifically: https://thecollegeinvestor.com/79015/how-the-repayment-assistance-plan-rap-works/
- **Difficulty** — **Medium.** Covered, but usually as one bullet inside a "what is RAP" explainer. A dedicated piece with the month-by-month arithmetic is differentiable.
- **Feeds** — `/loans`
- **Backed by** — `loans.rap.interestWaiver`, `loans.rap.principalMatch`, `loans.rap.minimumMonthlyPayment`
- **Gap risk** — CLEAR.
- **Freshness** — Live 8 weeks.

---

### L7 · Paying extra on RAP can cost you money

- **Primary keyword** — `should I pay extra on RAP`
- **Secondary / long-tail** — `extra payments RAP interest waiver` · `paying ahead student loans RAP` · `does paying extra cancel the RAP match` · `RAP paid one day late lose benefits` · `RAP late payment penalty` · `advance due date student loan RAP` · `pay more than required RAP` · `RAP extra payment mistake`
- **Intent** — informational, counter-intuitive
- **PAA / sections** — Where does an above-required payment go on RAP? · Does paying ahead lose me the waiver and the match? · Does it still count toward the 360? · Is paying extra ever right on RAP? · What does one late payment cost?
- **Demand evidence** — `EVIDENCED`, and unusually well. CNBC ran a dated piece on RAP's late-payment behaviour on 12 Jul 2026: https://www.cnbc.com/2026/07/12/student-loans-rap-late-payment.html . TheStreet followed: https://www.thestreet.com/personal-finance/rap-student-loan-late-payment-penalty . National business press covering a mechanical rule detail is a demand signal.
- **Difficulty** — **Medium-easy.** The press covered the *late payment* half; almost nobody has covered the *extra payment* half, and they are the same mechanism seen from two sides.
- **Feeds** — `/loans`. Warning `RAP_EXTRA_PAYMENT_BACKFIRE` already exists.
- **Backed by** — warning `RAP_EXTRA_PAYMENT_BACKFIRE`, `loans.rap.principalMatch`, `loans.rap.interestWaiver`
- **Gap risk** — CLEAR.
- **Freshness** — Live 8 weeks; press coverage July 2026.

---

### L8 · Parent PLUS after the 30 June 2026 deadline

- **Primary keyword** — `Parent PLUS loan options 2026`
- **Secondary / long-tail** — `missed Parent PLUS consolidation deadline` · `Parent PLUS income driven repayment 2026` · `is Parent PLUS eligible for RAP` · `double consolidation loophole closed` · `Parent PLUS consolidation June 30 2026` · `can't afford Parent PLUS loans` · `Parent PLUS tiered standard plan` · `consolidation containing Parent PLUS` · `Parent PLUS ICR after 2028`
- **Intent** — informational, distressed
- **PAA / sections** — Is Parent PLUS eligible for RAP? (No — and not via consolidation either.) · What if my consolidation was applied for but not disbursed by 30 Jun 2026? · What is left: Tiered Standard, and what does it cost? · What happens to a Parent-PLUS consolidation on ICR when ICR sunsets in 2028? · Does the double-consolidation route still exist?
- **Demand evidence** — `EVIDENCED`. A deadline that has just passed and left a cohort permanently locked out generates sustained "what now" search. Multiple specialist pages exist specifically for the *missed* deadline, which only gets written when people are asking: https://www.tateesq.com/learn/missed-parent-plus-consolidation-deadline · https://studentloanborrowerassistance.org/do-you-have-parent-plus-loans-act-now-to-lower-your-payments-before-options-disappear/ · https://www.edcapny.org/resources-for-borrowers/parent-plus-consolidate-now/
- **Difficulty** — **Medium.** tateesq and studentloanplanner are strong here. Our differentiator is the taint model: the engine carries `underlyingHadParentPlus` and `parentPlusConsolidationTaintException`, so we can answer the messy sub-case ("my consolidation contains one Parent PLUS among four loans") that prose pages generalise past.
- **Feeds** — `/loans`. Warnings `PARENT_PLUS_RAP_INELIGIBLE` and `PARENT_PLUS_CONSOLIDATION_RAP_EXCEPTION`.
- **Backed by** — `loans.tieredStandard.terms`, `loans.icr.sunsetDate`, both Parent PLUS warning codes
- **Gap risk** — DISCLOSE. `GAP-003` sits under the sunset dates (P.L. 119-21 citation unfetched; the terms themselves are verified via 34 C.F.R. §§ 685.208–685.209 on govinfo).
- **Freshness** — The deadline passed 30 Jun 2026. The 2028 ICR sunset is the second shoe.

---

### L9 · PAYE and ICR end on 1 July 2028

- **Primary keyword** — `PAYE ending 2028`
- **Secondary / long-tail** — `ICR ending 2028` · `what happens when PAYE ends` · `PAYE sunset what plan am I moved to` · `should I leave PAYE now` · `ICR sunset Parent PLUS` · `PAYE to RAP or IBR` · `when does PAYE enrollment close` · `PAYE 2028 forced migration`
- **Intent** — informational, forward-planning
- **PAA / sections** — What exactly happens on 1 Jul 2028? · Which plan am I moved to, and do I get to choose? · Do my PAYE payments carry over? · When does *enrollment* close, as opposed to the plan itself? · Is it better to move now or wait?
- **Demand evidence** — `EVIDENCED`. Dedicated explainers exist across the specialist tier and the nonprofit tier: https://thecollegeinvestor.com/74466/paye-and-icr-are-ending-what-borrowers-should-do/ · https://ticas.org/affordability-2/upcoming-changes-to-income-driven-repayment-plans/ · https://finnita.com/blog/paye-icr-sunset-2028/
- **Difficulty** — **Medium.** Well covered in prose. Nobody models it: a 20-year projection that silently continues PAYE past 2028 is wrong, and every generic calculator does exactly that. Our simulator models the forced migration. That is a demonstrable, checkable superiority.
- **Feeds** — `/loans`. Warning `PAYE_ICR_SUNSET` fires on both plans.
- **Backed by** — `loans.paye.sunsetDate`, `loans.icr.sunsetDate`, `loans.post2026RestrictionDate`, `sunset.ts`
- **Gap risk** — DISCLOSE (`GAP-003` on the citation) and note `GAP-034` where ICR is being compared.
- **Freshness** — 22 months out. Long-lived cluster; the least perishable in the section.

---

### L10 · Forgiveness is taxable again — what the bill actually is

- **Primary keyword** — `student loan forgiveness tax bomb 2026`
- **Secondary / long-tail** — `is IBR forgiveness taxable` · `is RAP forgiveness taxable` · `1099-C student loan forgiveness` · `how much tax on forgiven student loans` · `is PSLF taxable` · `student loan forgiveness taxable 2026` · `insolvency exclusion student loans` · `state tax on forgiven student loans` · `save for the tax bomb`
- **Intent** — informational, financially consequential
- **PAA / sections** — Which forgiveness is taxable and which is not? · How large is the bill on a $180,000 forgiven balance? · Does PSLF escape it? · What is the insolvency exclusion and who qualifies? · Do states tax it too? · How much should I be setting aside each month?
- **Demand evidence** — `EVIDENCED`. Enough demand that at least one publisher built a dedicated *calculator*, which is what happens when an explainer stops satisfying the query: https://thecollegeinvestor.com/61018/student-loan-tax-bomb-calculator-and-estimator/ · https://thecollegeinvestor.com/61056/student-loan-tax-bomb-returning-in-2026/ · https://studentloansherpa.com/preparing-ibr-tax-bomb-student-loan-forgiveness/ · https://www.elfi.com/the-impending-tax-bomb-for-some-federal-loan-borrowers-in-2026/
- **Difficulty** — **Medium-hard.** Genuinely competitive and the specialist tier is fresh. Our differentiator is that tax is already inside the ranking, not bolted on: `estimateTaxOnForgiveness` feeds total lifetime cost, so the tax bomb changes which plan *wins*, not merely what the final bill is.
- **Feeds** — `/loans`
- **Backed by** — `loans.tax.nonPslfForgivenessTaxable`, `loans.tax.pslfForgivenessTaxable`, `loans.tax.assumedMarginalRate`, `estimateTaxOnForgiveness`
- **Gap risk** — **DISCLOSE, doubly.** `GAP-004` — the taxability flag rests on the 2024 U.S. Code edition of 26 U.S.C. § 108(f) and a post-2024 amendment cannot be ruled out. `GAP-046` — the 22% marginal rate is an explicit modelling assumption, not a rule. Both must be visible in the article, and the second argues for shipping a user-override before this publishes.
- **Freshness** — The ARPA exclusion lapsed 31 Dec 2025. First taxable forgiveness year is 2026 — now.

---

### L11 · PSLF under the new plan set

- **Primary keyword** — `does RAP count for PSLF`
- **Secondary / long-tail** — `which repayment plans qualify for PSLF 2026` · `RAP or IBR for PSLF` · `PSLF qualifying payments RAP` · `best plan for PSLF 2026` · `PSLF 120 payments RAP` · `PSLF after SAVE ended` · `lowest payment for PSLF` · `PSLF and the 2028 sunset`
- **Intent** — comparison
- **PAA / sections** — Is RAP a qualifying plan? · If I am chasing PSLF, does the lowest payment always win? · Do RAP's interest waiver and match matter at all when the balance is forgiven anyway? · What happens to my PSLF count when PAYE sunsets? · Is PSLF still tax-free?
- **Demand evidence** — `EVIDENCED`. Multiple 2026-dated pages built around the plan-by-plan PSLF question, including a dedicated RAP-vs-IBR-for-PSLF page: https://www.tateesq.com/learn/pslf-repayment-plans-qualify · https://www.tateesq.com/learn/rap-pslf · https://thecollegeinvestor.com/77357/pslf-strategy-in-2026/ · https://www.cbsnews.com/news/which-student-loan-borrowers-qualify-public-service-loan-forgiveness-2026/
- **Difficulty** — **Hard.** PSLF head terms are held by studentaid.gov and NerdWallet and the specialist tier is active. Win on the sub-question — "for a PSLF borrower the ranking criterion inverts: minimise payments made, not lifetime cost" — which the simulator can show directly.
- **Feeds** — `/loans`
- **Backed by** — `loans.pslf.payments`, `loans.tax.pslfForgivenessTaxable`, `simulateAllPlans`
- **Gap risk** — CLEAR.
- **Freshness** — Plan set changed 1 Jul 2026; SAVE's exit removed the plan most PSLF borrowers were using.

---

### L12 · The RAP marriage penalty and filing separately

- **Primary keyword** — `married filing separately student loans RAP`
- **Secondary / long-tail** — `RAP marriage penalty` · `does RAP use spouse income` · `student loan payment married filing separately 2026` · `RAP AGI joint return` · `is filing separately worth it student loans` · `RAP dependents filing separately` · `MFS student loan calculator` · `RAP vs IBR married`
- **Intent** — comparison, decision-shaped
- **PAA / sections** — Does RAP use household AGI or my AGI? · How much does filing separately save on the payment? · What does it cost in tax? · Does the $50-per-dependent reduction survive filing separately? · Where is the break-even?
- **Demand evidence** — `EVIDENCED`, and current: CNBC published on the RAP marriage penalty on 10 Aug 2026, two weeks ago: https://www.cnbc.com/2026/08/10/student-loan-marriage-penalty-rap.html . Long-standing specialist coverage of the general question: https://www.studentloanplanner.com/married-filing-separate-paye-and-ibr/ · https://thecollegeinvestor.com/17807/the-math-behind-married-filing-separately-for-ibr-or-paye/
- **Difficulty** — **Medium.** The general MFS question is well covered; the RAP-specific version is two weeks old. Move fast.
- **Feeds** — `/loans` primarily. **Genuine cross-tool link to `/paycheck`** — filing status changes MAGI, which changes the OBBBA phase-outs. One of very few real cross-engine stories the site has.
- **Backed by** — `loans.rap.dependentReduction`, `loans.rap.brackets`, `householdAgi`, `simulateAllPlans`
- **Gap risk** — CLEAR on the loans side. The *tax* cost of filing separately is not modelled by any engine — the article must send that half to a tax professional rather than compute it.
- **Freshness** — RAP live 8 weeks; national coverage 10 Aug 2026.

---

### L13 · Post-2026 borrowers: two plans, and Tiered Standard is one of them

- **Primary keyword** — `new standard repayment plan 2026 terms`
- **Secondary / long-tail** — `tiered standard repayment plan` · `repayment plans for loans after July 2026` · `am I restricted to RAP` · `new borrower repayment options 2026` · `standard plan 25 years balance` · `student loan borrowing caps 2026` · `grad PLUS eliminated` · `what plans can new borrowers use`
- **Intent** — informational
- **PAA / sections** — Which plans exist for a loan disbursed after 1 Jul 2026? · How is the term set by balance? · Does one post-2026 loan restrict *all* my loans? · Is Tiered Standard ever cheaper than RAP? · Is there forgiveness on Tiered Standard? (No.)
- **Demand evidence** — `EVIDENCED`. Institutional financial-aid offices have published dedicated pages, which is a reliable proxy for repeated student questions: https://sfs.harvard.edu/changes-federal-student-loans · https://students-residents.aamc.org/premed-navigator/preparing-upcoming-student-loan-changes-information-aspiring-medical-students · https://www.accesslex.org/news-tools-and-resources/new-rules-law-school-loans-limits-repayment-plans-and-what-you-need-know
- **Difficulty** — **Easy-medium.** Coverage is mostly institutional and descriptive; nobody computes the Tiered-Standard-vs-RAP comparison for a specific balance.
- **Feeds** — `/loans`. Warning `POST_2026_LOANS_RESTRICTED`.
- **Backed by** — `loans.tieredStandard.terms` table, `loans.post2026RestrictionDate`, `tieredTermMonths`
- **Gap risk** — DISCLOSE (`GAP-003`).
- **Freshness** — Effective 1 Jul 2026; the affected cohort grows with every disbursement.

---

### L14 · High balance, low income: residents, associates and the 30-year clock

- **Primary keyword** — `best repayment plan for medical residents 2026`
- **Secondary / long-tail** — `law school loans repayment 2026` · `RAP for residents` · `high student loan balance low income plan` · `$300k student loans repayment plan` · `grad PLUS repayment 2026` · `RAP vs IBR for doctors` · `residency income driven repayment` · `professional school loan repayment changes`
- **Intent** — comparison, profession-shaped
- **PAA / sections** — During residency, which plan gives the lowest payment? · Does that answer flip when the attending salary arrives? · Does RAP's uncapped payment hurt a high earner with a $400k balance? · Is PSLF still the dominant strategy? · What does the 30-year clock mean for someone finishing training at 32?
- **Demand evidence** — `EVIDENCED`. AAMC, AccessLex, the ABA and Harvard SFS all publish on it, and specialist publishers have residency-specific RAP pages: https://www.studentloanplanner.com/medical-residency-rap-payment/ · https://www.americanbar.org/groups/law_students/resources/student-lawyer/personal-financial/future-law-school-loans-one-big-beautiful-bill-act/
- **Difficulty** — **Medium.** studentloanplanner owns the high-balance professional niche and is fresh. Our angle is the two-phase simulation — low income now, high income later — which is precisely where a single-snapshot calculator misleads.
- **Feeds** — `/loans`. Natural seed for later profession pages, but note the four publish gates: a profession page must produce a unique computed number, not a re-skin.
- **Backed by** — `simulateAllPlans` over an income path, `loans.rap.brackets`, `loans.pslf.payments`
- **Gap risk** — DISCLOSE (`GAP-046` — the assumed marginal rate matters most for exactly this cohort's forgiven balance).
- **Freshness** — Grad PLUS limits and the RAP-only restriction both bite from 1 Jul 2026.

---

### L15 · The RAP bracket cliff — the $1 raise that raises your payment

- **Primary keyword** — `RAP income brackets`
- **Secondary / long-tail** — `RAP payment brackets table` · `RAP 1% to 10% of AGI chart` · `why did my RAP payment jump` · `does a raise increase my RAP payment` · `RAP bracket cutoffs` · `RAP marginal or flat rate` · `RAP payment at $100,000 income` · `RAP bracket boundary` · `RAP notch effect` · `should I decline a raise student loans`
- **Intent** — informational; the highest engine-differentiation value in the section
- **PAA / sections** — Is the RAP rate applied marginally or to the whole AGI? · How much can a $1 raise cost per month? · Where are the boundaries? · Does a bonus push me into a higher bracket for the whole year? · Which side of a boundary does an AGI landing exactly on it fall? (The lower band — the rule reads "more than $X and not more than $Y".)
- **Demand evidence** — `EVIDENCED`. Policy analysts have named the effect: TICAS writes that the structure "could cancel the benefit of a salary increase and even lead to a net loss in discretionary income, creating 'cliffs'": https://ticas.org/affordability-2/rap-income-protection-reconciliation-2025/ · https://www.brookings.edu/articles/income-driven-repayment-for-federal-student-loans-from-icr-to-rap/ . A specialist page states the same mechanic in borrower language: https://www.tateesq.com/learn/federal-student-loan-payment-increase
- **Difficulty** — **Easy-medium, and the most under-defended SERP in the section.** A crowded floor of thin affiliate RAP calculators and a policy-think-tank ceiling, with nothing credible in between. No competitor models the notch.
- **Feeds** — `/loans`. A "find your cliff" output is unique computed content that satisfies publish gate 2 on its own.
- **Backed by** — `loans.rap.brackets` table (already generated from `bracketStartPct` · `bracketMaxPct` · `bracketStepCents`, so it redraws itself when the rule changes), `rapBracketPct`, `rapMonthlyPayment`
- **Gap risk** — CLEAR on the figures. **But verify the bracket application model first:** the table note in `figures.ts` documents the boundary convention, and the engine must be confirmed to apply the rate to total AGI rather than marginally before an article asserts a cliff exists. If the engine is marginal and the statute is flat, the article is wrong *and so is the engine*.
- **Freshness** — RAP live 1 Jul 2026; the notch is a direct consequence of the bracket design and is essentially uncovered.

---

### L16 · The $10 minimum — there is no $0 payment any more

- **Primary keyword** — `RAP $10 minimum payment`
- **Secondary / long-tail** — `can I get a $0 payment on RAP` · `no income student loan payment 2026` · `what do I pay on RAP if I am unemployed` · `RAP zero income` · `$0 payment plans still available 2026` · `RAP economic hardship deferment` · `unemployment deferment ending 2027` · `what if I cannot pay $10 a month` · `minimum payment income driven repayment 2026` · `RAP dependents $50 reduction`
- **Intent** — informational, distressed
- **PAA / sections** — Is there any way to get a true $0 payment under RAP? · Which plans still allow $0? · What happened to the $0 payments under SAVE and PAYE? · Is the $10 floor statutory or policy? · What if I genuinely cannot pay $10? · Does a $10 payment still count toward the 360 and toward PSLF?
- **Demand evidence** — `EVIDENCED`, and it is the best-shaped question set found for the whole tool. A consumer Q&A site whose entire model is answering reader mail published a FAQ built explicitly around the misconception "if I have no income, my payment should be zero", on 21 Aug 2026 — five days ago: https://getoutofdebt.org/269184/they-said-zero-income-means-a-zero-student-loan-payment-under-rap-you-still-owe-10-a-month . Supporting policy work: https://www.brookings.edu/articles/minimum-payments-in-income-driven-repayment-plans/ · https://edtrust.org/blog/how-the-repayment-assistance-plan-rap-works/
- **Difficulty** — **Easy-medium.** Consumer Q&A, think tanks and one advocacy blog. No commercial incumbent.
- **Feeds** — `/loans`
- **Backed by** — `loans.rap.minimumMonthlyPayment`, `loans.rap.dependentReduction`, `loans.rap.brackets`
- **Gap risk** — CLEAR for the floor itself. **Research flag:** the removal of economic-hardship and unemployment deferments for Direct Loans made on or after 1 Jul 2027 was surfaced in research but is **not** in the rule files or `KNOWN-GAPS.md`. Verify against the RISE rule on govinfo and, if real, open a gap row before this article leans on it.
- **Freshness** — RAP live 1 Jul 2026; the deferment change bites 1 Jul 2027.

---

### L17 · Consolidation in 2026 — the advice inverted on 1 July

- **Primary keyword** — `should I consolidate my student loans in 2026`
- **Secondary / long-tail** — `consolidating after July 2026 only RAP` · `does consolidation reset my forgiveness count` · `never consolidate Parent PLUS with student loans` · `FFEL Perkins consolidation to get RAP` · `should I consolidate for PSLF 2026` · `consolidation resets 120 payments` · `do not consolidate class of 2026` · `consolidation weighted average interest rate` · `Perkins cancellation vs consolidation`
- **Intent** — transactional decision, irreversible
- **PAA / sections** — Does consolidating after 1 Jul 2026 restrict me to RAP and Tiered Standard? · Does it reset my PSLF count? · My FFEL/Perkins loans cannot use RAP — is consolidating the fix, and what does it cost? · Why must Parent PLUS never be consolidated with my own loans? · Is there any case where consolidating still helps?
- **Demand evidence** — `EVIDENCED`, with visible urgency framing: https://vinfoundation.org/urgent-for-class-of-2026-do-not-consolidate-your-federal-student-loans/ · https://thecollegeinvestor.com/83302/why-consolidating-your-student-loans-in-2026-can-set-you-back/ · https://freestudentloanadvice.org/should-i-consolidate-my-loans/ · https://mohela.studentaid.gov/DL/resourceCenter/consolidation.aspx
- **Difficulty** — **Medium, with the best staleness arbitrage in the section.** The pre-deadline "consolidate before June 2026" pages are still ranking and now give advice that actively harms the reader. Servicer and nonprofit pages hold the informational slots but do not compute the cost of the reset.
- **Feeds** — `/loans`. Warnings `FFEL_PERKINS_HEAL_EXCLUDED` and `POST_2026_LOANS_RESTRICTED` both fire here.
- **Backed by** — `loans.post2026RestrictionDate`, `loans.tieredStandard.terms`, `aggregateLoans` (the weighted-average rate), `simulateAllPlans` before and after consolidation
- **Gap risk** — DISCLOSE (`GAP-003`).
- **Freshness** — The advice reversed on 1 Jul 2026 and the obsolete version still ranks.

---

**Loans cluster count: 17.** One (L3) is already written.
CLEAR: 7 · DISCLOSE: 10 · BLOCKED: 0 — the loans engine has no cluster it
cannot answer at all. Two clusters (L4, L15) carry an **engine pre-condition**
that must be resolved before writing, not merely disclosed while writing.

**A field note that belongs on the homepage, not in an article.** studentaid.gov's
own Loan Simulator carries a disclaimer that it "cannot predict payments with
100% accuracy" and "does not account for past payments", and Forbes reported on
28 Jul 2026 that borrowers were being forced to reapply after servicer
calculation errors: https://www.forbes.com/sites/adamminsky/2026/07/31/ . That
is the clearest available statement of why a deterministic, cited, reproducible
engine exists. It is positioning copy, not a cluster.

## 4. PAYCHECK — 14 clusters

Eight wired scalar figures, no table figure yet, plus `computeDeductions`, the
federal bracket table with standard deduction, `overtimePremiumCents`,
`phaseOutReduction`, and a searchable list of **71 qualified tip occupations
across 8 categories**. The rule files carry more than `figures.ts` exposes —
all four deductions have `phaseOut.thresholdSingleCents` / `thresholdJointCents`
/ `reductionPer1000Cents`, the senior deduction carries `percentOfExcessBps`
and `requireJointIfMarried`, and `car-loan.2026.json` carries
`requiresFinalAssemblyInUS`, `requiresNewVehicle`, `requiresPersonalUse` and
`loanOriginatedOnOrAfter`. **Three of those are unwired figure ids that should
be added before this section is written**, because several clusters below turn
on a threshold that has no id today.

**The one thing that governs this whole section.** IRS **FS-2026-13 / IR-2026-88,
issued 6 August 2026 — 20 days ago** — supersedes FS-2026-01 and *deletes the
2025-only transition relief*, including the self-calculation methods that let a
worker derive their own overtime premium. It adds Q20 (an employee "may not
consider any amount in excess of what is reported on Form W-2, box 12, code
TT"), Q22 (employer must file W-2c; the employee is barred from claiming
unreported amounts) and Q23 (Form 4852 and daily logs cannot substitute).
https://www.irs.gov/newsroom/irs-updates-faqs-on-qualified-overtime-deduction ·
https://www.irs.gov/pub/taxpros/fs-2026-13.pdf ·
https://www.currentfederaltaxdevelopments.com/blog/2026/8/6/the-evolution-of-qualified-overtime-compensation-deductions-analyzing-irs-fact-sheet-fs-2026-13-and-its-practical-implications

The consequence is that **the "divide your overtime by three" instruction — the
most-repeated line in the entire ranking corpus — is dead for tax year 2026**,
and the IRS's own older overtime FAQ page still serves the superseded FS-2026-01.
TurboTax's overtime page was updated 7 Aug 2026, the day after, still leads with
the ÷3 method, and does not cite FS-2026-13. That is a dateable, three-week-old
gap on a head term, and it is the strongest single opening in the programme.

**A field-wide difficulty note.** The four head terms are brand-dense (Fidelity,
TurboTax, H&R Block, Kiplinger, CNBC, Wikipedia, Congress.gov). The
**calculator** variants of the same queries are not: `no tax on overtime
calculator` and `no tax on tips calculator` return microsites
(ustax.tools — which served HTTP 403 to a plain fetch — nationaltaxtools.com,
notaxovertimecalculator.com, countrytaxcalc.com, plootus, taxsaveiq) with no
NerdWallet, no Bankrate, no ADP, no Intuit present. The IRS informational page
ranking #1 for a *calculator* query is an unsatisfied-intent signal. That gap
between the explainer SERP and the calculator SERP is where this section lives.

---

### P1 · Why your overtime deduction is smaller than your overtime pay

- **Primary keyword** — `why is my overtime deduction less than my overtime pay`
- **Secondary / long-tail** — `no tax on overtime only half` · `is the overtime deduction the whole overtime check` · `how much of my overtime is deductible` · `overtime premium vs overtime pay deduction` · `do I deduct time and a half or just the half` · `$12,500 overtime deduction how many hours` · `does double time count for the overtime deduction` · `holiday pay overtime deduction` · `is my $20,000 of overtime deductible` · `one third of overtime rule 2026`
- **Intent** — informational → calculator. The moment of peak frustration and the highest tool-conversion point in the section.
- **PAA / sections** — *"What is qualified overtime compensation for purposes of the deduction?"* (IRS FAQ Q1, verbatim) · *"How do I determine whether I am covered by and not exempt from the FLSA?"* (Q2) · *"What is the deduction amount? Are there limits to the deduction?"* (Q4) · Does double time count? · If I earned $30,000 of overtime, why is my deduction $10,000?
- **Demand evidence** — `EVIDENCED`, strongly. Yahoo Finance ran a debunk headline verbatim: *"The Overtime Tax Break Only Counts the 'Half,' Not the 'Time-and-a-Half.' Most Workers Are Overestimating It by Double"* — https://finance.yahoo.com/economy/policy/articles/overtime-tax-break-only-counts-201822251.html . A national outlet writing a correction headline is direct evidence of mass misconception. Separately, **six employer and university payroll offices built standing FAQ pages** because staff kept asking: https://payroll.ku.edu/overtime-tax-deduction · https://www.purdue.edu/hr/buspur/tax/OBBA-FAQ.php · https://controller.brown.edu/payroll/no-tax-overtime-provision · https://www.ncosc.gov/Overtime2025 · https://www.gfoa.org/no-tax-on-overtime-faqs · https://www.ou.edu/content/dam/payroll/docs/tax-documents/2025%20W2%20OBBBA%20Overtime%20FAQ.pdf . Policy debunks: https://policymattersohio.org/research/no-tax-on-overtime-is-misleading/ · https://www.epi.org/publication/everything-you-need-to-know-about-no-tax-on-overtime/
- **Difficulty** — **Medium on the explainer, easy on the calculator.** TaxSlayer, Patriot Software, TaxAct, TurboTax and GFOA hold the explainer slots and are all pre-FS-2026-13 in substance. The calculator SERP has no brand in it at all.
- **Feeds** — `/paycheck`. `overtimePremiumCents` is the exact function the reader wants run.
- **Backed by** — `paycheck.overtime.premiumShare`, `paycheck.overtime.capSingle`, `paycheck.overtime.capJoint`, `overtimePremiumCents`, `computeDeductions`
- **Gap risk** — DISCLOSE. `GAP-005` sits on all three overtime figures: no Treasury regulation implementing IRC § 225 was located and *its absence is not established*, so the engine rests on Notice 2025-69 and FS-2026-13 only. Say so.
- **Freshness** — ÷3 was 2025-only relief, deleted 6 Aug 2026. For TY2026 the deductible amount is whatever Box 12 code TT reports.

---

### P2 · Box 12 code TT now caps what you can claim

- **Primary keyword** — `box 12 code TT overtime deduction`
- **Secondary / long-tail** — `W-2 box 12 TT meaning` · `code TT vs code TP` · `can I deduct more overtime than box 12 TT shows` · `employer didn't report qualified overtime on my W-2` · `W-2c qualified overtime` · `Form 4852 overtime deduction` · `FS-2026-13 what changed` · `overtime deduction 2026 rules vs 2025` · `employer won't report code TT` · `box 14b treasury tipped occupation code`
- **Intent** — informational, high-anxiety; peaks Jan–Apr 2027, so **publish now to age in**
- **PAA / sections** — *"Will qualified overtime compensation be separately reported… Doesn't qualified overtime have to be separately reported in order for an individual to take the deduction?"* (IRS FAQ Q6, verbatim) · *"I did not receive information from my employer on how much qualified overtime compensation I received…"* (Q7, verbatim) · Can I use my pay stubs instead? (For 2026: no.) · What if my employer reports the wrong number?
- **Demand evidence** — `EVIDENCED`. The IRS itself issued a news release specifically to update these FAQs, which is what happens when guidance is being misapplied at scale: https://www.irs.gov/newsroom/irs-updates-faqs-on-qualified-overtime-deduction (IR-2026-88, 6 Aug 2026). Practitioner coverage: https://keystone.cpa/2026/08/13/irs-updates-guidance-on-the-new-qualifed-overtime-deduction/ · https://www.calpublicagencylaboremploymentblog.com/public-sector-2/the-overtime-tax-deduction-gets-real-what-public-agencies-need-to-know-about-the-irss-new-guidance/ · W-2 instructions carrying the codes: https://www.irs.gov/pub/irs-pdf/iw2w3.pdf
- **Difficulty** — **Easy.** Everything currently ranking (beancount.io 4 Jun 2026, eintime.com, tipfort.com, usapaycheck.com, 1099online.com, ietaxattorney.com) predates FS-2026-13. No consumer brand is present.
- **Feeds** — `/paycheck`. The tool's role shifts here: it computes what the W-2 *should* say so the reader can check theirs and demand a W-2c.
- **Backed by** — `overtimePremiumCents` (as an expected-value check against Box 12), `paycheck.overtime.premiumShare`
- **Gap risk** — DISCLOSE (`GAP-005`). **Also an engine input gap:** nothing in `HouseholdInput` currently represents "the amount my employer reported", so the compare-to-your-W-2 flow needs a field before this article's CTA is honest.
- **Freshness** — 20 days old, uncovered, and it *reverses* the prevailing advice. Highest-leverage single page in the programme.

---

### P3 · Is my occupation on the tip list?

- **Primary keyword** — `does my job qualify for no tax on tips`
- **Secondary / long-tail** — `IRS list of tipped occupations` · `Treasury tipped occupation code lookup` · `do hairstylists qualify for no tax on tips` · `do nurses qualify for the tip deduction` · `massage therapist tip deduction` · `tattoo artist tip deduction` · `do golf caddies qualify` · `what is my TTOC code` · `do dog groomers qualify` · `do tutors and nannies qualify for the tip deduction`
- **Intent** — navigational / eligibility lookup. **Perfect tool intent** — a searchable table beats every prose article, and the engine already has `searchOccupations`.
- **PAA / sections** — Is my job on the list? · What is a TTOC code and where does it go on the return? · My job is similar to one on the list — does that count? · Which common tipped jobs are *not* on it? · Does being on the list guarantee the deduction? (No — see P4.)
- **Demand evidence** — `EVIDENCED`. The IRS maintains a dedicated occupation list page, updated 28 Jun 2026: https://www.irs.gov/forms-pubs/occupations-that-customarily-and-regularly-received-tips-on-or-before-dec-31-2024 . Both a professional body and a national outlet built pages around the eligibility question: *"Who makes the cut for 'no tax on tips'?"* https://www.natptax.com/news-insights/blog/who-makes-the-cut-for-no-tax-on-tips/ · *"Which Jobs Are On The List To Benefit From The 'No Tax On Tips' Deduction?"* https://www.forbes.com/sites/kellyphillipserb/2025/09/03/which-jobs-are-on-the-list-to-benefit-from-the-no-tax-on-tips-deduction/
- **Difficulty** — **Medium-easy.** The ranking set is law-firm and CPA-firm alerts (Ogletree, Littler, Paylocity, PBMares, NSTP, RSM) **written for employers, not workers**, and several still describe the September 2025 *preliminary* list that the final regulations superseded.
- **Feeds** — `/paycheck` and specifically `/paycheck/occupations`, which already exists as a route. This is the cluster with the tightest article-to-tool fit in the whole programme.
- **Backed by** — `searchOccupations`, `findOccupationByCode`, `occupations.2026.json` (71 occupations, 8 categories)
- **Gap risk** — CLEAR, with one caveat: confirm the engine's 71 entries reconcile against the 28 Jun 2026 IRS refresh before publishing a page whose entire value is list accuracy.
- **Freshness** — TD 10044 final 13 Apr 2026; IRS list refreshed 28 Jun 2026. Any page still saying "preliminary list" is provably stale.

---

### P4 · On the list and still disqualified — the SSTB trap

- **Primary keyword** — `SSTB tip deduction exclusion`
- **Secondary / long-tail** — `specified service trade or business tips` · `massage therapist SSTB tip deduction` · `do spa employees qualify for the tip deduction` · `salon SSTB tips` · `personal trainer tip deduction SSTB` · `199A SSTB tips` · `my employer is an SSTB can I deduct tips` · `Notice 2025-69 SSTB relief` · `performing arts SSTB musicians tips`
- **Intent** — informational, high-stakes, very low competition
- **PAA / sections** — What is an SSTB and why does it matter for tips? · Does an SSTB employer disqualify me even though my occupation is listed? · Is a med-spa an SSTB? · Is this settled law right now? (No.)
- **Demand evidence** — `INFERRED — no measurement` for the query itself. What is `EVIDENCED` is that the *rule* exists and only professional-services firms have written about it: https://rsmus.com/insights/tax-alerts/2026/no-tax-tips-final-rules-confirm-qualifying-occupations-tip-definition.html · https://www.crowe.com/insights/tax-news-highlights/irs-issues-final-regulations-on-qualified-tips · https://kpmg.com/us/en/taxnewsflash/news/2026/04/final-regulations-occupations-definition-qualified-tips.html
- **Difficulty** — **Easy to rank, low volume.** A genuine content void: no consumer page addresses it. Treat as a section-grade insight, and see the cannibalisation note in §9 — this is a strong candidate to fold into P3 rather than stand alone.
- **Feeds** — `/paycheck`
- **Backed by** — nothing wired. The engine models six gates on tips but **does not model SSTB status**, and there is no `figures.ts` id for it.
- **Gap risk** — **BLOCKED, and correctly so.** Notice 2025-69 suspends enforcement of SSTB disqualification pending SSTB-specific final regulations, so a masseuse's eligibility is *genuinely undetermined today*. Do not publish a definitive answer. If written at all, this must be an explicit "unsettled" page, and it needs a new `KNOWN-GAPS.md` row first.
- **Freshness** — Live and unresolved. Watch item.

---

### P5 · Withholding is not the deduction — why your paycheck did not change

- **Primary keyword** — `will my paycheck be bigger with no tax on tips`
- **Secondary / long-tail** — `does no tax on overtime change my withholding` · `why is my overtime still taxed on my paycheck` · `when do I get the no tax on tips money` · `2026 W-4 tips overtime` · `W-4 step 4(b) overtime deduction` · `do I get it at tax time or each paycheck` · `employer still withholding tax on my tips` · `how to adjust withholding for the tip deduction`
- **Intent** — informational. Structurally the **best-converting paycheck-calculator intent in the section**, because it is literally a per-paycheck question.
- **PAA / sections** — Why is tax still being withheld from my overtime? · Do I need a new W-4 to feel it in my paycheck? · How much should I put on Step 4(b)? · What happens if I over-adjust and under-withhold?
- **Demand evidence** — `EVIDENCED`. IRS FAQ Q8 in FS-2026-13 tells employees to submit an updated W-4 Step 4(b): https://www.irs.gov/pub/irs-pdf/fw4.pdf . KU's payroll page states plainly that the provision has "no impact on employee paychecks" and "does not immediately reduce federal withholding": https://payroll.ku.edu/overtime-tax-deduction . Employer-side coverage of the 2026 W-4: https://www.cbiz.com/insights/article/understanding-the-2026-form-w-4-key-updates-and-employer-action-steps · https://www.experian.com/blogs/employer-services/irs-finalizes-form-w-4/
- **Difficulty** — **Easy-medium.** Everything ranking (Patriot, Gusto, AccuPay, Complete Payroll) is written **for employers**. Nobody has built the "how much should I put on Step 4(b)" tool.
- **Feeds** — `/paycheck`
- **Backed by** — `computeDeductions`, `taxOn`, `marginalRateBps`, `taxSavings` — the annual saving divided across pay periods is exactly the Step 4(b) figure
- **Gap risk** — CLEAR on the arithmetic. **Scope flag:** the engine computes federal tax saved; it does not model withholding tables, so the article must frame Step 4(b) as "the deduction amount to declare", not "your new take-home".
- **Freshness** — 2026 is the first year a worker can opt into ratable withholding for these deductions.

---

### P6 · California daily overtime produces a $0 federal deduction

- **Primary keyword** — `california daily overtime tax deduction`
- **Secondary / long-tail** — `does California 8 hour overtime qualify for the federal deduction` · `state overtime vs FLSA overtime deduction` · `4/10 schedule overtime deduction` · `double time Sunday deduction qualify` · `union contract overtime tax deduction` · `collective bargaining overtime deduction` · `Alaska Nevada daily overtime deduction` · `why is my qualified overtime zero`
- **Intent** — informational, extremely specific, near-zero competition, very large affected population
- **PAA / sections** — I worked nine-hour days but under 40 hours — do I get anything? ($0.) · Does my CBA's daily overtime count? (Only hours past 40 in the workweek.) · Which states have daily overtime and why does it not help? · Does double time qualify?
- **Demand evidence** — `INFERRED — no measurement` on volume, but the mechanism is `EVIDENCED` and one small publisher has already staked the exact claim in a title: *"California Daily Overtime Tax Deduction | $0 on a 4/10 Week"* https://morkelfinancial.com/blog/california-daily-overtime-tax-deduction . FS-2026-13 analysis confirms state overtime premiums exceeding the FLSA minimum are excluded by definition, and that a CBA paying time-and-a-half after 8 hours a day produces qualified overtime only for hours past 40 in the workweek.
- **Difficulty** — **Easy.** One small financial blog plus employment-law pages that discuss California overtime without the tax angle. Effectively unclaimed.
- **Feeds** — `/paycheck`. A calculator that returns **$0** to a Californian on a 4/10 schedule is a high-shareability, zero-competition asset — and it is an honest refusal, which is this site's house style.
- **Backed by** — `paycheck.overtime.premiumShare`, `overtimePremiumCents` driven from FLSA weekly hours
- **Gap risk** — DISCLOSE (`GAP-005`). **Engine check required:** confirm `overtimePremiumCents` derives the premium from hours over 40 in a *workweek* and cannot be fed a daily-overtime figure that silently qualifies.
- **Freshness** — FS-2026-13, 6 Aug 2026, confirmed the exclusion explicitly.

---

### P7 · Cash tips, gig work, and no 1099

- **Primary keyword** — `no tax on tips self employed no 1099`
- **Secondary / long-tail** — `cash tips deduction without a 1099` · `Venmo Zelle tips deduction` · `DoorDash tips deduction` · `Uber driver no tax on tips` · `hairstylist booth renter tips deduction` · `Form 4137 unreported tips` · `tip log records IRS` · `self-employed tip deduction limited to net income` · `TurboTax won't let me claim the tip deduction`
- **Intent** — transactional / problem-solving
- **PAA / sections** — *"New TIP Deduction — Self Employed No 1099's"* · *"Where to enter tip deduction info for 1099 worker?"* · Do cash tips count without a 1099? · Is the self-employed deduction capped at net business income? (Yes — before the deduction.) · Why does my software refuse to let me claim it?
- **Demand evidence** — `EVIDENCED`, and this is the **strongest verified real-user-confusion evidence in the whole programme**, with visible engagement counts: an Intuit community thread titled *"New TIP Deduction - Self Employed No 1099's"* with **30 replies / 534 views**, posted 16 Jan 2026 — https://ttlc.intuit.com/community/tax-credits-deductions/discussion/new-tip-deduction-self-employed-no-1099-s/00/3726488 — and *"Where to enter tip deduction info for 1099 worker?"* with **11 replies / 245 views**, 20 Jan 2026 — https://ttlc.intuit.com/community/tax-credits-deductions/discussion/where-to-enter-tip-deduction-info-for-1099-worker/00/3729295 . In the first thread a mobile dog groomer with roughly $13,000 of Venmo/Zelle/cash tips is blocked by the software; a forum moderator says the law requires 1099 reporting while another user cites IRS guidance that a self-employed person needs only contemporaneous records. **Software and guidance are in open conflict and no ranking page resolves it.** IRS recordkeeping authority: https://www.irs.gov/businesses/small-businesses-self-employed/tip-recordkeeping-and-reporting
- **Difficulty** — **Easy-medium.** Small CPA blogs and thin calculator sites. Major brands cover W-2 tipped workers and skip the 1099/cash case entirely.
- **Feeds** — `/paycheck`
- **Backed by** — `computeTipsDeduction`, `paycheck.tips.cap`
- **Gap risk** — DISCLOSE, and **scope-flag hard.** The engine's tips path does not model the self-employment net-income limitation, and `GAP-047` means MAGI is a proxy with no subtraction term — which is worst exactly for a Schedule C filer with above-the-line adjustments. Either model the limitation first or state plainly that the tool covers the W-2 case.
- **Freshness** — For 2025 only, payors were not required to separately identify tips on 1099-NEC/1099-K.

---

### P8 · How much do I actually get back?

- **Primary keyword** — `how much will I save with no tax on tips`
- **Secondary / long-tail** — `no tax on tips calculator` · `tip deduction tax bracket savings` · `$25,000 tip deduction actual refund` · `will I get a bigger refund with the tips deduction` · `do I still pay social security on tips` · `FICA on tips deduction` · `tip deduction if I make $30,000` · `no tax on overtime calculator`
- **Intent** — **transactional. Pure calculator intent.**
- **PAA / sections** — *"Did you earn tips last year? See how much this new tax break could save you."* (CBS News headline) · Do I still pay Social Security and Medicare on tips? (Yes, 7.65%.) · Is the deduction the same as a refund? · Does my bracket change what it is worth?
- **Demand evidence** — `EVIDENCED`. CBS MoneyWatch, 23 Feb 2026: https://www.cbsnews.com/news/income-tax-on-tips-refund-irs-2026/ — roughly 6 million workers report tipped wages; average saving around $1,400; only about 3% of taxpayers expected to claim it. NPR, 25 Feb 2026: https://www.npr.org/2026/02/25/nx-s1-5684227/trump-tax-tips-state-union . Bipartisan Policy Center explainer: https://bipartisanpolicy.org/explainer/how-does-no-tax-on-tips-work-in-the-one-big-beautiful-bill/
- **Difficulty** — **Easy on the calculator SERP** (see the section header). Hard on the explainer head term.
- **Feeds** — `/paycheck`
- **Backed by** — `computeDeductions`, `taxSavings` (computed twice on the bracket table, never as rate × deduction — that is a real accuracy claim the methodology page already makes), `paycheck.tips.cap`
- **Gap risk** — DISCLOSE (`GAP-047` on MAGI; `GAP-036` on the unstated sub-dollar rounding convention, worth about a dollar).
- **Freshness** — 2026 is the first year with real filed-return data behind the estimate.

---

### P9 · The deduction is worth nothing to a lot of tipped workers

- **Primary keyword** — `tip deduction if I don't owe federal income tax`
- **Secondary / long-tail** — `is the tip deduction refundable` · `deduction vs credit tips` · `I already pay no federal income tax on tips` · `standard deduction covers my income tips` · `part time server tip deduction worthless` · `does the tip deduction affect EITC` · `low income tipped worker no benefit`
- **Intent** — informational, expectation-correcting. A trust and E-E-A-T play more than a traffic play.
- **PAA / sections** — Is the deduction refundable? (No.) · I made $18,000 — do I get $25,000 back? · At what income does it start being worth anything? · What is a $100 deduction actually worth at each bracket?
- **Demand evidence** — `EVIDENCED`. CBS notes that many lower-paid tipped workers claiming the standard deduction already owe no federal income tax; BPC gives the arithmetic — a $100 deduction is worth $10 at the 10% rate and $37 at 37%: https://bipartisanpolicy.org/explainer/how-does-no-tax-on-tips-work-in-the-one-big-beautiful-bill/ . NPR headline, observed: *"Tipped workers expect tax boon this year, but not a long-term fix"* https://www.npr.org/2026/02/25/nx-s1-5684227/trump-tax-tips-state-union
- **Difficulty** — **Easy.** Held by think tanks and news. The tax-prep brands avoid this framing because it undercuts their hook — that is the opening.
- **Feeds** — `/paycheck`. The tool returning "this is worth $0 to you" is the same honest-refusal pattern as P6.
- **Backed by** — `taxOn`, `marginalRateBps`, `brackets.2026.json` (which carries `standardDeductionCents`)
- **Gap risk** — CLEAR.
- **Freshness** — Measurable now against real filing data rather than projections.

---

### P10 · Senior deduction versus the extra standard deduction

- **Primary keyword** — `senior deduction vs extra standard deduction over 65`
- **Secondary / long-tail** — `$6,000 senior deduction who qualifies` · `can I claim both the senior deduction and the extra standard deduction` · `is social security tax free now for seniors` · `senior deduction phase out $75,000` · `$12,000 if both spouses are 65` · `senior deduction married filing separately` · `do I need to be collecting social security to claim it` · `born before January 2 1961 deduction`
- **Intent** — informational
- **PAA / sections** — *"How does the new $6,000 deduction for seniors phase out?"* (observed as a page title) · Do the two deductions stack? (Yes.) · Is Social Security untaxed now? (**No** — this is the core conflation.) · What happens if I file separately? (Ineligible.) · Do I have to be receiving Social Security? (No.)
- **Demand evidence** — `EVIDENCED`. IRS runs a seniors-specific filing-season page: https://www.irs.gov/newsroom/2026-filing-season-updates-and-resources-for-seniors . A **member of Congress publishes a standing FAQ page** on it, which only happens under constituent pressure: https://meuser.house.gov/resources/enhanced-deduction-seniors-frequently-asked-questions-faq . Academic and practitioner coverage: https://crr.bc.edu/new-tax-break-for-seniors/ · https://tax.thomsonreuters.com/blog/breaking-down-the-obbbas-social-security-tax-deduction/ · https://www.mariscpa.com/news/senior-deduction-phase-out
- **Difficulty** — **Hard.** The most contested of the four deductions: CNBC Select, Kiplinger, H&R Block, TurboTax, Jackson Hewitt. The clearest staleness signal in the section is that Kiplinger's **pre-OBBBA** evergreen on the additional standard deduction still ranks on the old concept. The *stacking* question is the under-served sub-query — take that, not the head term.
- **Feeds** — `/paycheck`
- **Backed by** — `paycheck.senior.amount`, `paycheck.senior.qualifyingAge`, `senior.2026.json` (`percentOfExcessBps`, `phaseOutIsPerPerson`, `requireJointIfMarried`, `distinctFrom`), `computeSeniorDeduction`
- **Gap risk** — CLEAR on the figures. **Unwired-figure flag:** the senior phase-out thresholds and the per-person reduction rate have no `figures.ts` id, and the article cannot state them without one.
- **Freshness** — Two separate deductions that stack, plus a live public controversy over how the benefit was described. No stacking calculator exists.

---

### P11 · Does my car qualify for the loan-interest deduction?

- **Primary keyword** — `does my car qualify for the car loan interest deduction`
- **Secondary / long-tail** — `VIN decoder car loan interest deduction` · `US final assembly vehicle list 2026` · `used car loan interest deduction` · `lease car loan interest deduction` · `refinance car loan interest deduction` · `Form 1098-VLI` · `$10,000 car loan interest deduction phase out` · `motorcycle ATV car loan interest deduction` · `RV camper car loan interest deduction`
- **Intent** — **eligibility check — inherently a tool, not an article**
- **PAA / sections** — Does a used car qualify? (No — original use must begin with you.) · How do I check final assembly from my VIN? · Do leases count? (No.) · Does refinancing break it? · What is Form 1098-VLI and when will I get one?
- **Demand evidence** — `EVIDENCED`, and the ranking set is the evidence: purpose-built checker microsites (usacarcheck.com, vehicleloaninterest.com) *and car dealership websites* rank for the checker queries. Treasury/IRS guidance: https://www.irs.gov/newsroom/treasury-irs-provide-guidance-on-the-new-deduction-for-car-loan-interest-under-the-one-big-beautiful-bill . NHTSA VIN decoder: https://www.nhtsa.gov/vin-decoder . CNBC, 13 Feb 2026: https://www.cnbc.com/2026/02/13/interest-on-new-car-loans-tax-deductible.html
- **Difficulty** — **Hard on the head term, easy on the checker.** CNBC, TurboTax, TaxAct, H&R Block and US Bank hold `car loan interest deduction`. Dealership sites holding the *eligibility-check* queries is an unclaimed SERP.
- **Feeds** — `/paycheck`
- **Backed by** — `paycheck.carLoan.cap`, `computeCarLoanDeduction`, and `car-loan.2026.json`'s `requiresFinalAssemblyInUS` / `requiresNewVehicle` / `requiresPersonalUse` / `loanOriginatedOnOrAfter`
- **Gap risk** — **DISCLOSE, and read `eligibilityCriteriaNotModelled` in the rule file before writing.** The engine knows the criteria *exist*; it does not carry a VIN decoder or a US-final-assembly vehicle list, so it can ask the user the questions but cannot verify the answers. The article must not imply a VIN check the tool does not perform. Note also that this deduction's phase-out ($100k/$200k) is **lower** than tips and overtime, and that threshold has no `figures.ts` id today.
- **Freshness** — Form 1098-VLI is brand new for TY2026, furnished by 31 Jan 2027. Almost nothing consumer-facing covers it yet.

---

### P12 · Four deductions, four different phase-outs

- **Primary keyword** — `no tax on tips income limit married filing jointly`
- **Secondary / long-tail** — `tip deduction MAGI phase out calculator` · `$150,000 tip deduction limit` · `overtime deduction income limit joint` · `why can't I claim the tip deduction married filing separately` · `MAGI vs AGI tips deduction` · `both spouses overtime $25,000 cap` · `phase out $100 per $1,000` · `fully phased out at $400,000 tips` · `do I need an SSN for these deductions`
- **Intent** — informational → calculator
- **PAA / sections** — *"Are there other rules that apply to the deduction?"* (IRS FAQ Q5, verbatim) · Can I claim these married filing separately? (No.) · Why do the four deductions phase out at different incomes? · What is my marginal rate in the phase-out band? · Does one deduction reduce MAGI for another's phase-out? (**No** — Schedule 1-A computes MAGI once at line 3 and Parts II–V all read it.)
- **Demand evidence** — `EVIDENCED` for the underlying confusion: the IRS maintains separate consumer pages per deduction, updated 5 Mar 2026 and 2 Jul 2026 respectively — https://www.irs.gov/newsroom/what-the-no-tax-on-tips-deduction-means-for-you · https://www.irs.gov/newsroom/what-to-know-about-the-no-tax-on-overtime-deduction . `INFERRED — no measurement` that the *unified* query is searched; what is evidenced is that no single page unifies the four.
- **Difficulty** — **Medium.** Fragmented: each provision is covered separately by TurboTax, H&R Block and Jackson Hewitt. No interaction calculator exists anywhere.
- **Feeds** — `/paycheck`. This is the cluster where the engine's whole shape is the differentiator — one MAGI, four phase-outs, computed together.
- **Backed by** — `computeDeductions`, `phaseOutReduction`, `phaseOutStatus`, `fullyPhasedOutAt`, `thresholdFor`, `paycheck.tips.phaseOutSingle`, `paycheck.tips.phaseOutJoint`
- **Gap risk** — **DISCLOSE, twice.** `GAP-047` — MAGI is an income proxy with no subtraction term, so it **overstates** MAGI for anyone with above-the-line adjustments, which understates their deduction *near a phase-out edge* — precisely this article's subject. `GAP-005` on the overtime side. The senior and car-loan thresholds are unwired ids.
- **Freshness** — Four interacting phase-outs on one Schedule 1-A is genuinely non-obvious computed output — a clean pass on publish gate 2.

---

### P13 · Schedule 1-A, and the 2028 expiry

- **Primary keyword** — `schedule 1-A form 1040`
- **Secondary / long-tail** — `how to fill out schedule 1-A` · `do these deductions expire in 2028` · `will no tax on tips be extended` · `can I claim tips deduction and the standard deduction` · `above the line vs below the line OBBBA deductions` · `is no tax on tips permanent` · `OBBBA what expires when` · `SALT cap 2026`
- **Intent** — informational + how-to. The section's **hub page**.
- **PAA / sections** — Can I take these *and* the standard deduction? (Yes, all four.) · Do they expire? (After TY2028.) · Which line does each deduction go on? · How is TY2026's Schedule 1-A different from TY2025's? · Which OBBBA provisions expire on *different* dates?
- **Demand evidence** — `EVIDENCED`. IRS release on the new schedule: https://www.irs.gov/newsroom/irs-published-schedule-taxpayers-will-use-to-claim-deductions-on-no-tax-on-tips-no-tax-on-overtime-no-tax-on-car-loans-no-tax-on-seniors · https://www.journalofaccountancy.com/news/2026/mar/new-schedule-1-a-for-tips-ot-car-loans-and-seniors-deductions-published/ . Observed headline capturing the live confusion: *"No tax on tips touted as permanent, expires in 2028"* https://www.mysuncoast.com/2026/04/15/no-tax-tips-touted-permanent-expire-2028/ · https://ogletree.com/insights-resources/blog-posts/its-official-no-tax-on-tips-no-tax-on-overtime-through-2028/
- **Difficulty** — **Medium.** Held by accounting trade press written for practitioners. Consumer-facing walkthroughs are thin.
- **Feeds** — `/paycheck`
- **Backed by** — every paycheck figure carries `sunset` in its rule file, so the expiry date is rule-file-owned rather than prose. `SUPPORTED_TAX_YEARS` drives which year the figures resolve to.
- **Gap risk** — CLEAR. **Conflation warning to encode in the article:** tips, overtime, senior and car-loan expire after TY2028; the SALT cap change is on a *different* schedule. Merging them is the common error and the correction is the article's value.
- **Freshness** — TY2026's Schedule 1-A differs from TY2025's (VIN entry; code TT-driven amounts; no self-calculation relief).

---

### P14 · Your state may not follow the federal deduction

- **Primary keyword** — `is overtime still taxed by my state`
- **Secondary / long-tail** — `which states conform to no tax on tips` · `California no tax on tips state tax` · `Illinois add-back tips overtime` · `state decoupling OBBBA 2026` · `do I still pay state tax on tips` · `Colorado overtime deduction decoupled` · `New York tips deduction state tax`
- **Intent** — informational, and naturally 50-state programmatic
- **PAA / sections** — Does my state honour the tip deduction? · Why did my federal refund rise but not my state one? · Which states decoupled and when? · Does my state start from federal AGI or taxable income?
- **Demand evidence** — `EVIDENCED` at policy level: https://itep.org/tips-overtime-income-tax-deduction-state-budgets/ · https://tax.thomsonreuters.com/blog/state-decoupling-from-federal-tax-provisions/ · https://taxfoundation.org/research/all/state/2026-state-tax-changes/ . These are analyst-framed, not taxpayer-framed, which is the gap.
- **Difficulty** — **Easy-medium** on substance; the field is thin microsites plus policy institutes.
- **Feeds** — `/paycheck`
- **Backed by** — **nothing.** `brackets.2026.json` is federal only; there is no state rule file, no state figure, and no state code path in the engine.
- **Gap risk** — **BLOCKED.** This cluster requires a new, dated, cited state-conformity rule set — a real engineering and verification project, not an article. It is listed so it is not mistaken for cheap programmatic volume. **And note the CLAUDE.md constraint directly: 50 templated state pages with no unique computed number per page is the doorway-page pattern.** Each state page would need its own computed output to pass gate 1.
- **Freshness** — State sessions ran through spring 2026; conformity is still moving.

---

**Paycheck cluster count: 14.** CLEAR: 3 · DISCLOSE: 9 · BLOCKED: 2 (P4 SSTB,
P14 state conformity). Three clusters (P2, P7, P11) additionally need an
**engine input or scope change** before their call-to-action is honest, and
four thresholds the section needs to quote — senior phase-out single/joint,
car-loan phase-out single/joint — have **no `figures.ts` id today**. Adding
those four ids is the cheapest unblock in the programme.

## 5. ACA — 14 clusters

Nine wired scalar figures, two tables, `analyzeHousehold`,
`reconcileAdvanceCredit`, a fully-audited 51-state Medicaid expansion flag set,
and the **six-lever** engine that returns `amountToClearCliff` per lever. On
figures alone this is the second-deepest section.

**One gap governs the whole section and must be read before anything is
planned.** `GAP-039`: the six county benchmark premiums in
`slcsp-sample.2026.json` are **invented** — plausible-magnitude numbers made up
so the engine and UI could be built. There is nothing to verify; they must be
*replaced*. The practical rule that falls out of that:

> **An ACA article may state a percentage, a threshold, an applicable
> percentage, a clawback amount as a share of credit received, or an FPL
> dollar line. It may not state a premium.** Every premium-denominated figure
> in this section is fabricated sample data until the CMS Marketplace PUFs are
> ingested, and the `SAMPLE_DATA` labelling is the only thing standing between
> a reader and a made-up number.

That is less limiting than it sounds, because the highest-value clusters below
are about *thresholds and repayment*, not premiums.

**The competitive picture, stated precisely.** Two incumbents matter and they
sit at opposite ends of the staleness spectrum:

- **KFF's subsidy calculator is fresh and strong.** It states on its own page
  that it "was updated on March 16, 2026, with premiums for 2026 plans" and it
  explicitly models results without the enhanced credits. https://www.kff.org/interactive/subsidy-calculator/
  **Do not attack KFF head-on on generic "subsidy calculator".** Beat it on the
  decision layer it does not model: the uncapped clawback, the crossover, and
  the ranked levers.
- **The IRS's own reconciliation page is stale and materially wrong for TY2026.**
  Last reviewed 9 Aug 2026, it still says excess APTC "may be limited if your
  household income is less than 400 percent of the applicable federal poverty
  line" — a sub-400% limitation that OBBBA § 71305 repealed for tax years after
  2025. https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit-claiming-the-credit-and-reconciling-advance-credit-payments
  The live Form 8962 instructions are still the **2025** edition and still carry
  Table 5, the repayment limitation table. https://www.irs.gov/instructions/i8962

**When the top authority on a question is out of date and every downstream tax
blog is copying it, that is the opening.** Note also that NerdWallet and
Investopedia did not surface on the ACA head terms searched — unlike loans and
paycheck, the big generalists are not defending this space.

**A live accuracy hole worth exploiting, carefully.** Ranking pages disagree
about the actual 400% line — roughly $62,600 versus $63,840 for a single filer
— which is 2025-versus-2026 FPL-table mixing, and eligibility keys off the
**prior** year's table. Content is also still circulating the dead ARPA 8.5%
cap as if it were current law. The site's advantage here is structural: the
engine reads `fpl.2025.json` for coverage year 2026 and the methodology page
already explains the lag, so it can show the line *and* name the table year
*and* cite it. That is a trust win the competitors cannot copy without rebuilding.

---

### A1 · What you repay when you go over — the uncapped clawback

- **Primary keyword** — `how much do I have to pay back if I underestimated my income for ACA`
- **Secondary / long-tail** — `premium tax credit repayment cap 2026` · `is there still a repayment limit on excess APTC` · `repay entire premium tax credit no cap` · `what happens if I underestimate my income for Obamacare` · `excess advance premium tax credit repayment 2026` · `OBBBA premium tax credit repayment change` · `Form 8962 line 28 repayment limitation 2026` · `$1,625 repayment cap gone` · `ACA subsidy payback calculator` · `do I pay back the whole year or just the excess`
- **Intent** — transactional. They want a dollar figure. **The strongest calculator intent in the section.**
- **PAA / sections** — *"If my income last year was higher than expected, do I have to pay back some of the advance premium tax credits?"* (a standing FAQ page title) · Is the repayment cap really gone? · Do I repay the whole year's credit or only the excess? · Does it matter which month I went over? · Can the IRS put me on a payment plan?
- **Demand evidence** — `EVIDENCED`, and the best-sourced cluster in the programme. KFF Health News, 3 Apr 2026, carries a named worked case: a client earning just over $50,000 owed **$1,625** because the cap held — and **$4,000 without it**. It quotes Jason Levitis of Urban directly: *"If taking that extra shift means putting you over the line of 400% of the federal poverty level and that's going to cost you $10,000 in repayments, maybe don't take that shift."* https://kffhealthnews.org/insurance/tax-tips-aca-affordable-care-act-obamacare-subsidies-income-owing/ . **The syndication breadth is itself the demand signal** — the same piece ran at CNN on 12 Apr 2026 (https://www.cnn.com/2026/04/12/health/tax-time-surprises-aca-subsidies), CPA Practice Advisor, The Lund Report and others. CNBC, 6 Jan 2026: *"ACA subsidy cliff may mean 'astronomical tax bills' for many"* https://www.cnbc.com/2026/01/06/aca-subsidy-cliff-tax-bills.html . The Taxpayer Advocate maintains a standing tax tip on excess APTC: https://www.taxpayeradvocate.irs.gov/news/tax-tips/tas-tax-tips-taxpayers-with-an-excess-advance-premium-tax-credit/2021/05/
- **Difficulty** — **Medium, with the best authority-staleness arbitrage on the site.** The IRS page is wrong (above); the Form 8962 instructions are the 2025 edition; a high-ranking personal-finance post is titled *"2025 2026 Cap on Paying Back ACA Health Insurance Subsidy"*, asserting a 2026 cap in the ranking snippet itself. A tail of accountant blogs has caught up but none has a calculator.
- **Feeds** — `/aca`. `reconcileAdvanceCredit` is exactly this computation.
- **Backed by** — `aca.clawback.capped` (whose note already cites OBBBA § 71305 striking IRC § 36B(f)(2)(B)), `reconcileAdvanceCredit`, `aca.applicablePercentage.bands`
- **Gap risk** — CLEAR on the rule. **DISCLOSE on any dollar output** — the repayment amount scales with the advance credit received, so express it as a share of credit received or take the credit as a user input. **Do not derive it from `slcsp-sample.2026.json` (`GAP-039`).**
- **Freshness** — Live for tax year 2026, first reconciled on returns filed in early 2027.

---

### A2 · The 400% cliff is back

- **Primary keyword** — `ACA subsidy cliff 2026`
- **Secondary / long-tail** — `what happens if I go one dollar over 400% FPL` · `400% federal poverty level 2026 income limit` · `subsidy cliff is back 2026` · `Obamacare income limit 2026 single person` · `401% FPL no subsidy` · `how close am I to the subsidy cliff` · `income limit for Obamacare 2026 family of four` · `enhanced premium tax credits expired what now` · `marginal cost of one extra dollar of income ACA`
- **Intent** — informational → tool
- **PAA / sections** — *"How much can I earn and qualify for premium tax credits in the Marketplace?"* (KFF standing FAQ) · Is it 400% of this year's or last year's poverty guideline? · Does the cliff apply per person or per household? · What is the exact dollar line for my household size? · How much does the last dollar cost?
- **Demand evidence** — `EVIDENCED`. **Congress itself wrote an FAQ**: CRS R48290, *"Enhanced Premium Tax Credit and 2026 Exchange Premiums: Frequently Asked Questions"* https://www.congress.gov/crs-product/R48290 . CBS on the size of the shock: https://www.cbsnews.com/news/aca-health-subsidies-insurance-prices/ . Urban Institute projection: https://www.urban.org/research/publication/48-million-people-will-lose-coverage-2026-if-enhanced-premium-tax-credits . KFF's standing FAQ is itself the evidence *and* the weakness — published 29 Sep 2025, it gives the income **floor** and does not mention the 400% ceiling or the cliff's return: https://www.kff.org/faqs/faqs-health-insurance-marketplace-and-the-aca/help-paying-marketplace-premiums-defining-income-and-household/how-much-can-i-earn-and-qualify-for-premium-tax-credits-in-the-marketplace/
- **Difficulty** — **Hard.** healthinsurance.org holds the head term and KFF's calculator is fresh. Compete on the *exact line plus its FPL table year plus its citation*, and on the marginal-cost-of-one-dollar framing.
- **Feeds** — `/aca`
- **Backed by** — `aca.cliff.ceilingMultiple`, `aca.fpl.firstPerson`, `aca.fpl.additionalPerson`, `aca.applicablePercentage.top`, `aca.applicablePercentage.bands`, `analyzeHousehold`
- **Gap risk** — DISCLOSE (`GAP-033` — the 2026 Form 8962 and instructions are unpublished, so the ceiling derivation rests on the 2025 and 2020 editions, which agree word-for-word across the ARPA boundary). Strong, but not the 2026 document, and the article should say so.
- **Freshness** — Enhanced credits lapsed 31 Dec 2025. This is the section's anchor page.
- **Status** — **already written** as the pipeline proof `aca-subsidy-cliff-400-percent`. Keep it as the cluster hub; do not write a second.

---

### A3 · The exact edge — Form 8962 line 5, truncation, and "401"

- **Primary keyword** — `Form 8962 line 5 401`
- **Secondary / long-tail** — `how is household income as a percentage of the federal poverty line calculated` · `Form 8962 enter 401` · `does 400.4% count as over the cliff` · `does the IRS round or truncate the FPL percentage` · `Form 8962 Worksheet 2` · `am I at 399% or 400%` · `one dollar over the ACA cliff rounding`
- **Intent** — high-precision informational; the reader is standing on the line
- **PAA / sections** — If I am at 400.6%, do I lose everything? · Does the IRS round up? · What exactly goes on line 5? · Where does Worksheet 2 sit in the calculation? · Does truncation give me any room?
- **Demand evidence** — `INFERRED — no measurement` for the query. What is `EVIDENCED` is the rule, read directly from the live instructions: *"Do not round; instead, multiply this number by 100 (to express it as a percentage) and then drop any numbers after the decimal point"*, and *"The amount on line 1 above is more than 400% of the federal poverty line. Enter 401 here and on line 5 of Form 8962."* https://www.irs.gov/instructions/i8962
- **Difficulty** — **Easy.** The ranking set is generic Form 8962 walkthroughs (teachmepersonalfinance, accountably, pilot.com). **None** connects truncation to the cliff decision — that truncation gives a sliver of room below 401% and zero mercy above it — and none reflects that Table 5 is dead for TY2026.
- **Feeds** — `/aca`
- **Backed by** — `aca.cliff.ineligibleSentinel` (the literal 401 entry), `aca.cliff.ceilingMultiple` (whose note already records that the ceiling is a strict "more than" test applied *before* the whole-percent truncation — the exact subtlety this article exists to explain), `fpl.ts`
- **Gap risk** — DISCLOSE (`GAP-033` sits on both figures). Since the whole article is about the precise edge, the gap disclosure is not a weakness here — it is the article's honesty, and it names the January 2027 re-verification date.
- **Freshness** — The 2026 instructions are not out yet; being first is available.

---

### A4 · Estimating income when it is variable or self-employed

- **Primary keyword** — `how to estimate income for marketplace health insurance self employed`
- **Secondary / long-tail** — `what if my income is unpredictable ACA` · `estimating net self-employment income for healthcare.gov` · `what income do I put on my marketplace application` · `reporting an income change to the marketplace mid year` · `1099 income ACA subsidy estimate` · `should I overestimate or underestimate my marketplace income` · `gig worker ACA subsidy` · `what if I don't know my income next year`
- **Intent** — transactional, seasonal, peaking at open enrolment
- **PAA / sections** — What figure do I enter if my income swings? · Should I estimate high or low now that the caps are gone? · When must I report a change mid-year? · What happens in a data-matching issue? · What does a bad estimate cost in each direction?
- **Demand evidence** — `EVIDENCED`, institutionally and strongly. **CMS built a navigator training module for exactly this**: *"Reporting Income Module 3: Assisting a Household with Unpredictable Income"* https://marketplace.cms.gov/technical-assistance-resources/unpredictable-income . Plus healthcare.gov's own pages https://www.healthcare.gov/self-employed/income/ · https://www.healthcare.gov/income-and-household-information/ and a CMS consumer booklet on income data-matching issues https://www.cms.gov/marketplace/outreach-and-education/household-income-data-matching-issues.pdf . Real user voice, quoted in the KFF Health News piece: *"I can make anywhere between $20,000 and $45,000 next year. I just don't know."*
- **Difficulty** — **Medium.** healthcare.gov owns the informational slots and HealthSherpa's blog owns the commercial one. **None of them prices the downside asymmetry now that the caps are gone** — the old advice to estimate slightly low was defensible when a cap softened the landing, and is now actively dangerous.
- **Feeds** — `/aca`. A risk band across a plausible income range is genuinely novel output.
- **Backed by** — `analyzeHousehold` run across a range, `reconcileAdvanceCredit`, `buildMagi`
- **Gap risk** — DISCLOSE. Express exposure as a share of advance credit received, never in premium dollars (`GAP-039`).
- **Freshness** — The safety margin changed on 1 Jan 2026. Publish before 1 Nov 2026.

---

### A5 · The levers — how to get back under the line

- **Primary keyword** — `how to lower MAGI for ACA subsidy`
- **Secondary / long-tail** — `does a traditional IRA contribution reduce ACA income` · `HSA contribution to qualify for a subsidy` · `solo 401k to lower MAGI self employed` · `SEP IRA ACA subsidy` · `can I contribute to an IRA after year end to get a subsidy` · `401k deferrals reduce marketplace income` · `deadline to lower MAGI for last year's subsidy` · `self-employed health insurance deduction circular calculation` · `what deductions lower MAGI for the premium tax credit`
- **Intent** — commercial / tool. The highest willingness to act in the section.
- **PAA / sections** — *"MAGI question about ACA subsidies, Roth contribution, HSA & solo 401k"* · *"Do pre-tax IRA contributions reduce MAGI for ACA subsidy eligibility?"* · Is it too late to fix last year? · Does a Roth contribution help? (**No** — a high-frequency misconception.) · Which lever is cheapest per dollar of credit recovered?
- **Demand evidence** — `EVIDENCED`. A Bogleheads thread exists on the exact multi-lever question (https://www.bogleheads.org/forum/viewtopic.php?t=468641 — title and URL observed in live results; the host returned 403, so **engagement counts are unverified and none is asserted**). A dedicated Q&A page: https://claimyr.com/government-services/irs/Do-Pre-Tax-IRA-contributions-reduce-MAGI-for-ACA-subsidy-eligibility-in-2025/2025-04-11 . **A fact-checking site covered it**, which only happens for repeatedly-asked questions: https://factually.co/fact-checks/finance/do-ira-hsa-401k-reduce-magi-premium-tax-credits-2025-594f10
- **Difficulty** — **Medium.** A swarm of thin 2026-dated affiliate pages plus one real Fidelity page. **None models the self-employed-health-insurance-deduction circularity** — the deduction depends on the credit which depends on the deduction, the Pub 974 iterative calculation — and the engine has an `SE_HEALTH_INSURANCE` lever precisely for it. That is a deterministic-computation moat.
- **Feeds** — `/aca`. `levers.ts` already ranks by credit recovered per dollar committed, which is the article's headline table.
- **Backed by** — the six-lever engine with `amountToClearCliff` and `maxAvailable` per lever, `contribution-limits.2026.json`
- **Gap risk** — **DISCLOSE, and one lever is materially incomplete.** `GAP-050`: the SECURE 2.0 age 60–63 super catch-up is **not modelled**, which the source audit calls the single largest missed lever in the product — and 60-to-63-year-olds are the likeliest pre-Medicare marketplace enrollees near the cliff. The 2026 HDHP definition is also unmodelled, so the HSA lever's eligibility gate is not checked. **Both should be closed before this article publishes**; the figure is verified and needs no further research, only implementation.
- **Freshness** — Every dollar of MAGI reduction is worth more than at any time since 2020, because no cap softens the landing. Also encode the deadline split: SEP-IRA and HSA run to the filing deadline; solo-401(k) employee deferrals must be elected by 31 December.

---

### A6 · Roth conversions, early retirement, and the cliff

- **Primary keyword** — `Roth conversion vs ACA subsidy`
- **Secondary / long-tail** — `how much can I convert without losing my subsidy` · `ACA subsidy early retirement 2026` · `Roth conversion ladder and the 400% cliff` · `is it worth converting if I lose the subsidy` · `managing MAGI in early retirement` · `ACA subsidy vs the 0% capital gains bracket` · `bridge to Medicare health insurance cost` · `should I stop Roth conversions in 2026`
- **Intent** — high-value commercial; an audience with assets
- **PAA / sections** — Should I convert to the top of a bracket or stop at 400% FPL? · Do qualified Roth withdrawals count in MAGI? (**No** — the key planning fact.) · What does the conversion cost once the lost credit is priced in? · How does this change in the years approaching 65?
- **Demand evidence** — `EVIDENCED`. A Bogleheads thread on conversions versus ACA premiums (https://www.bogleheads.org/forum/viewtopic.php?t=452624 — observed in results, host 403, engagement unverified) and a headline of exactly the shape that gets written *from* forum threads: *"The Roth Conversion Mistake That Cost an Early Retiree Couple $86,400 in ACA Premium Tax Credits…"*, 28 May 2026 https://247wallst.com/personal-finance/2026/05/28/the-roth-conversion-mistake-that-cost-an-early-retiree-couple-86400-in-aca-premium-tax-credits-before-they-realized-they-lost-the-subsidy/
- **Difficulty** — **Easy-medium.** The field is thin 2026-dated advisory blogs and none runs a multi-year simulation. **Structurally identical to the loans thesis**: a multi-year deterministic engine against a field of single-year calculators.
- **Feeds** — `/aca`
- **Backed by** — `analyzeHousehold`, `INCOME_TIMING` lever, `reconcileAdvanceCredit`
- **Gap risk** — DISCLOSE. `GAP-039` again on premium dollars, and note that a *multi-year* projection needs a stated assumption about future applicable-percentage tables, which are re-struck annually — that assumption must be visible, not buried.
- **Freshness** — The breakeven moved twice in 2026: the credit is worth more, and the downside of a mis-estimate is uncapped.

---

### A7 · The second cliff — cost-sharing reductions at 250% FPL

- **Primary keyword** — `250% FPL cost sharing reduction cliff`
- **Secondary / long-tail** — `do I lose CSR if I go over 250% FPL` · `cost sharing reduction income limit 2026` · `silver plan CSR 94% 87% 73%` · `why is my silver plan deductible so high now` · `CSR only on silver plans` · `200% FPL CSR drop off` · `enhanced silver plan eligibility` · `CSR vs premium tax credit difference`
- **Intent** — informational, sophisticated
- **PAA / sections** — Do I lose CSR mid-year if my income rises? · Do I have to pay CSR back like APTC? (**No** — CSRs are not reconciled on Form 8962. A genuinely valuable, near-unpublished asymmetry.) · Why is the 200% step bigger than the 250% one? · Does CSR apply to bronze or gold? (No.)
- **Demand evidence** — `INFERRED — no measurement` on the query. `EVIDENCED` on the mechanism and its behavioural bite: CRS R44425 on the premium tax credit and cost-sharing reductions https://www.congress.gov/crs-product/R44425 , and reported data showing silver plan selection dropping suddenly just above 200% FPL — behavioural proof of which step actually matters.
- **Difficulty** — **Easy. The least-contested cluster in the section.** Glossary-grade evergreen content, none of it decision-oriented.
- **Feeds** — `/aca`
- **Backed by** — `aca.csr.bands` table, `aca.csr.topActuarialValue`, `computeCsr`, `csrTopPct` — and the ACA methodology page already carries a heading on CSR stopping and "taking the whole band with them", so the internal link is pre-built
- **Gap risk** — CLEAR on the bands. DISCLOSE if the article quantifies the deductible difference in dollars, which requires plan data the engine does not have.
- **Freshness** — Two cliffs interacting — 250% and 400% — is exactly the non-obvious insight publish gate 2 asks for.

---

### A8 · Capital gains and the subsidy

- **Primary keyword** — `do capital gains count toward the ACA subsidy`
- **Secondary / long-tail** — `selling stock and losing my Obamacare subsidy` · `capital gains push me over 400% FPL` · `0% capital gains rate but lost my subsidy` · `selling a rental property ACA subsidy` · `tax loss harvesting to stay under the cliff` · `does a house sale count for marketplace income` · `RSU vesting ACA subsidy` · `one-time capital gain marketplace insurance`
- **Intent** — high-value, decision-shaped
- **PAA / sections** — If my gain is taxed at 0%, does it still count? (Yes.) · Can I undo it? · Must I report a stock sale to the marketplace mid-year? · What is the true marginal rate on the dollar that crosses the line?
- **Demand evidence** — `EVIDENCED`. CNBC, 18 Nov 2025: *"ACA subsidy cliff: How to keep premium tax credits"* https://www.cnbc.com/2025/11/18/aca-subsidies-cliff-premium-tax-credits.html . Purpose-built pages exist on the exact question (quantcalc.app), and Fidelity has a real "what to do after ACA premiums go up" page.
- **Difficulty** — **Easy-medium.**
- **Feeds** — `/aca`
- **Backed by** — `buildMagi`, `analyzeHousehold`, `INCOME_TIMING` lever
- **Gap risk** — DISCLOSE (`GAP-039` on any dollar denominated in premium).
- **Freshness** — Post-§ 71305, a December stock sale can generate a clawback with no ceiling, so the ubiquitous "harvest to the top of the 0% bracket" advice is now **conditionally wrong** for marketplace enrollees. That correction is the article.

---

### A9 · The benchmark plan, SLCSP and silver loading

- **Primary keyword** — `second lowest cost silver plan SLCSP`
- **Secondary / long-tail** — `how do I find my SLCSP` · `SLCSP for Form 8962 column B blank` · `what is silver loading` · `why is bronze cheaper than silver after the subsidy` · `should I buy bronze or silver 2026` · `benchmark plan explained` · `my 1095-A column B is wrong` · `gold cheaper than silver 2026`
- **Intent** — informational + tool
- **PAA / sections** — What is the benchmark plan and why is it a plan I may never enrol in? · Where do I find my SLCSP if column B is blank? · Why can bronze or gold be cheaper than silver? · What is silver loading and who pays for it?
- **Demand evidence** — `EVIDENCED`. **A tax-software vendor wrote a support article** — which only happens when filers hit it constantly: https://support.taxslayer.com/hc/en-us/articles/360015708892-What-is-Second-Lowest-Cost-Silver-Plan-SLCSP-Obamacare-ACA . A state exchange publishes SLCSP lookup charts in multiple languages, which states only do for repeatedly-needed documents.
- **Difficulty** — **Medium.** But note a **live misinformation opening**: content ranking for this query asserts that "your expected contribution remains capped at 8.5% of your household income" — the dead ARPA rule. For 2026 the applicable percentage tops at 9.96% under Rev. Proc. 2025-25 *and* there is a hard cliff. Currently-ranking content is stating the opposite of the law.
- **Feeds** — `/aca`
- **Backed by** — `aca.applicablePercentage.top` (9.96%), `aca.applicablePercentage.bands`, and the methodology page's existing "the benchmark is a plan you may never enrol in" section
- **Gap risk** — **DISCLOSE, heavily.** This is the cluster sitting most directly on top of `GAP-039` — the SLCSP *concept* is wired and citable, the SLCSP *values* are invented. The article can explain the benchmark and correct the 8.5% zombie; it cannot tell a reader what their SLCSP is. `GAP-040` (state age-rating curves; New York and Vermont are 1:1) compounds this the moment real data lands.
- **Freshness** — The 8.5% correction is dated and citable to Rev. Proc. 2025-25.

---

### A10 · What counts as income for ACA

- **Primary keyword** — `what counts as income for ACA subsidies`
- **Secondary / long-tail** — `does social security count as income for marketplace insurance` · `is non-taxable social security included in MAGI` · `do 401k withdrawals count as income for Obamacare` · `does an inheritance affect my ACA subsidy` · `tax-exempt interest MAGI ACA` · `does unemployment count` · `is ACA MAGI the same as IRS MAGI` · `household income vs my income marketplace` · `do I include my adult child's income`
- **Intent** — informational, evergreen, broad top-of-funnel
- **PAA / sections** — *"What's included as income"* (healthcare.gov's own heading) · Does non-taxable Social Security count? (**Yes — the full Title II benefit, not just the taxable portion.**) · Is this the same MAGI as for IRA deductibility or IRMAA? (No — and that is why people get it wrong.) · Whose income goes in the household total?
- **Demand evidence** — `EVIDENCED`. healthcare.gov maintains a dedicated page https://www.healthcare.gov/income-and-household-information/income/ and **CBPP maintains a standing FAQ specifically on income definitions** https://www.healthreformbeyondthebasics.org/key-facts-income-definitions-for-marketplace-and-medicaid-coverage/ — a policy centre keeping a permanent explainer is a durable-demand signal.
- **Difficulty** — **Hard to outrank, easy to use.** healthcare.gov and CBPP own it and are accurate but definitional. **Treat this as the section's internal-linking hub feeding A1, A5 and A8**, not as a ranking target.
- **Feeds** — `/aca`
- **Backed by** — `buildMagi`, the ACA methodology page's existing "MAGI is AGI plus three add-backs, and nothing is subtracted" section, and the `/glossary#magi` entry
- **Gap risk** — CLEAR.
- **Freshness** — Evergreen. The weakest freshness score in the section and that is fine for a hub.

---

### A11 · Premium shock — why it went up and what to do mid-year

- **Primary keyword** — `why did my health insurance premium go up so much 2026`
- **Secondary / long-tail** — `ACA premiums 2026 increase percentage` · `my marketplace premium tripled` · `lost my subsidy 2026 what now` · `can I switch plans mid year if I lose my subsidy` · `cheapest health insurance without a subsidy` · `is it worth keeping marketplace coverage without a subsidy` · `dropping marketplace coverage 2026`
- **Intent** — urgent informational, panic-driven
- **PAA / sections** — Why did it rise so much? · Can I change plans now or must I wait? · Does a change in subsidy eligibility open a special enrolment period? · **If I stop paying and get terminated, can I re-enter?** (Non-payment termination is not a qualifying event — a genuine trap.)
- **Demand evidence** — `EVIDENCED`. CBS on 2026 price rises for subsidised enrollees: https://www.cbsnews.com/news/aca-health-subsidies-insurance-prices/ . CNN, 18 Dec 2025: https://www.cnn.com/2025/12/18/politics/aca-subsidies-cheap-plans-enrollment . Peterson-KFF on the premium-versus-deductible trade-off: https://www.healthsystemtracker.org/brief/higher-premium-payments-or-higher-deductibles-the-tradeoffs-aca-enrollees-face/
- **Difficulty** — **Medium.** Heavy news coverage of the *event*, little on the *decision*.
- **Feeds** — `/aca`
- **Backed by** — `analyzeHousehold`, the lever engine
- **Gap risk** — **DISCLOSE, hard.** The reader wants a premium comparison and the engine's premium data is `GAP-039` sample data. Write this as triage and eligibility, not price shopping. Consider whether it should be a section inside A2 rather than its own article — see §9.
- **Freshness** — Points directly at the 1 Nov 2026 window.

---

### A12 · Below 100% FPL and the Medicaid gap

- **Primary keyword** — `Medicaid coverage gap non-expansion states 2026`
- **Secondary / long-tail** — `too poor for an Obamacare subsidy` · `income below 100% FPL no subsidy` · `Medicaid gap Texas Florida Georgia` · `what if I make less than I estimated ACA` · `do I have to pay back the subsidy if my income dropped below 100% FPL` · `which states have not expanded Medicaid 2026` · `138% FPL Medicaid expansion`
- **Intent** — informational, high-consequence
- **PAA / sections** — *"How many uninsured are in the coverage gap?"* (KFF's standing explainer title) · What happens if I estimated 120% FPL and landed below 100%? · Which states have not expanded? · Why does the floor exist at all?
- **Demand evidence** — `EVIDENCED`. KFF maintains a standing explainer: https://www.kff.org/medicaid/how-many-uninsured-are-in-the-coverage-gap-and-how-many-could-be-eligible-if-all-states-adopted-the-medicaid-expansion/
- **Difficulty** — **Medium.** KFF is authoritative; the rest is a farm of thin eligibility-calculator domains. Compete on the *interaction* logic, not on state limit tables.
- **Feeds** — `/aca`
- **Backed by** — `medicaid-expansion.2026.json` — **all 51 flags were audited on 15 Aug 2026 and confirmed correct**, which is a genuinely strong, citable position — plus `aca.fpl.firstPerson` and `fpl.ts`
- **Gap risk** — CLEAR on the flags, with a maintenance obligation: expansion status changes by state action at any time and the file's own note requires quarterly re-verification. **The under-covered mirror-image insight to own:** the *downward* miss. Estimate 120% FPL, take advance credit, land below 100%, and in a non-expansion state the good-faith-estimate rule generally lets you **keep** it rather than repay — the exact inverse of A1, and almost nobody explains both directions on one page.
- **Freshness** — Steady, with a quarterly re-check.

---

### A13 · Reconciliation mechanics — 1095-A and Form 8962

- **Primary keyword** — `Form 8962 how to fill out`
- **Secondary / long-tail** — `where do I get my 1095-A` · `1095-A not received 2026` · `do I have to file 8962 if I got a subsidy` · `IRS rejected my return missing 8962` · `1095-A column B blank what do I enter` · `reconciling advance premium tax credit` · `net premium tax credit refund` · `shared policy allocation 8962 divorce`
- **Intent** — transactional, sharply seasonal
- **PAA / sections** — Where does the 1095-A come from and when? · What if column B is blank? · Why was my return rejected? · How does reconciliation actually work, line by line? · What changed for tax year 2026?
- **Demand evidence** — `EVIDENCED`. The IRS keeps a dedicated reconciliation page (reviewed 9 Aug 2026) and **a land-grant university extension office publishes a consumer guide on it** — grassroots-demand evidence of a good kind: https://www.porh.psu.edu/tax-credit-reconciliation-for-marketplace-consumers
- **Difficulty** — **Medium, with the same staleness arbitrage as A1.** The entire ranking set describes the Table 5 repayment limits, and several are explicitly the 2025 edition.
- **Feeds** — `/aca`
- **Backed by** — `reconcileAdvanceCredit`, `aca.clawback.capped`, `aca.cliff.ineligibleSentinel`
- **Gap risk** — DISCLOSE (`GAP-033`).
- **Freshness** — **Filing season 2027 is a dated, foreseeable content event** — the first with no caps. Publish now so it is indexed and aged by February.

---

### A14 · Open enrolment for 2027 — and it is shorter

- **Primary keyword** — `when is open enrollment for 2027 health insurance`
- **Secondary / long-tail** — `ACA open enrollment 2027 dates` · `healthcare.gov deadline December 15 2026` · `did open enrollment get shorter` · `state exchange deadlines 2027` · `deadline for January 1 2027 coverage` · `can I still enroll after December 15` · `Idaho Georgia Massachusetts early open enrollment`
- **Intent** — navigational, urgent. **The single most time-critical publish in the entire programme.**
- **PAA / sections** — What are the dates? · Did the deadline change? · Is 15 January still a thing? (Not on the federal platform.) · Which state exchanges differ? · What happens if I miss it?
- **Demand evidence** — `EVIDENCED`, and the evidence is a **live contradiction in the ranking set**: some top results say 2027 open enrolment runs 1 Nov 2026 – 15 Jan 2027, others say 1 Nov – 15 Dec 2026 with the period shortened by a month. Both rank simultaneously. The primary source resolves it: the 2025 Marketplace Integrity and Affordability final rule sets the federal-platform OEP at **1 Nov – 15 Dec** beginning with plan year 2027 — https://www.cms.gov/newsroom/fact-sheets/2025-marketplace-integrity-and-affordability-final-rule · https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability
- **Difficulty** — **Easy.** No strong incumbent; the field is low-authority broker blogs contradicting each other. A correctly-cited, per-state date table wins on accuracy alone.
- **Feeds** — `/aca`. Thin on engine output — this is a **navigational asset that feeds every other ACA cluster**, and it earns its place on internal-linking value rather than on computed output.
- **Backed by** — nothing computed. **Flag against publish gate 1:** this cluster does not produce a unique engine number on its own. It must either carry a computed element (a per-household "what you must do before 15 Dec" output) or be folded into A2 as a dated banner section.
- **Gap risk** — CLEAR, with a verification duty: confirm the end date against CMS or healthcare.gov directly before publishing, because the corpus is contradictory and this file's own note is second-hand on state-exchange variations.
- **Freshness** — **Nine weeks. Publish by mid-October 2026 or miss the season entirely.**

---

**ACA cluster count: 14.** One (A2) is already written. CLEAR: 4 ·
DISCLOSE: 10 · BLOCKED: 0 outright — but **every premium-denominated figure in
the section is blocked by `GAP-039`**, and two clusters (A5, A9) are materially
weakened by it and by `GAP-050`. A14 fails publish gate 1 as a standalone and
needs either a computed element or a merge.

## 6. PROPERTY — 11 clusters, of which 5 are writable today

**The honest headline first.** Property has **three wired scalar figures and no
table**: the Cook residential assessment level, the Cook estimated tax rate, and
the New Jersey common level range corridor. All three carry open gaps
(`GAP-013`, `GAP-014`, `GAP-041`). The corridor figure is a **constant, not
data** — it is the ±15% band, not any municipality's ratio — which makes it the
least useful of the three.

**The New Jersey engine cannot produce a verdict at all.** `GAP-041`:
`commonLevelRange.municipalities` is deliberately empty because no municipal
Director's Ratio has been read from a primary source and none is invented, so
every Bergen result returns `CANNOT_DETERMINE` naming the missing input. That is
the register's model row and the right behaviour — and it means **no New Jersey
article can promise an answer.**

I asked for eleven clusters and I am reporting eleven, but I am not going to
pretend they are equally shippable. **Five are writable now. Six are blocked or
badly weakened**, and for each I name the specific data that unblocks it. That
is a more useful document than eleven equal-looking rows.

**The single highest-leverage unblock on the site.** The 2026 Chapter 123 table
is one published PDF at a known URL —
https://www.nj.gov/treasury/taxation/pdf/lpt/chap123/2026CH123.pdf — carrying
the three columns the engine needs (`AVERAGE RATIO`, `LOWER LIMIT`,
`UPPER LIMIT`) for roughly 70 Bergen municipalities, stamped *"AS AMENDED BY TAX
COURT OF NEW JERSEY"*. Loading it unblocks **five clusters**. It is not a
quarter of work.
⚠️ **A real extraction hazard, verified:** the PDF uses subset fonts. In a test
extraction the municipality **names** decoded with a character offset while the
**numeric columns did not** — they sit in a second font subset with a different
mapping. Anyone loading this file must confirm the digits independently, because
a silently mis-decoded ratio is a wrong statutory verdict, not a cosmetic bug.

**Two premises in the current brief that I could not verify and that are
load-bearing.** Both must be resolved before any Cook deadline content ships:

1. **The separate Cook evidence deadline.** `GAP-009` records it and it is the
   central "trap" hook for Cook. `cookcountyassessoril.gov` returns 403, and a
   mirror calendar consulted during this research showed *no* separate
   documentation deadlines distinct from appeal closing dates. The register and
   the mirror disagree. **Verify from a primary source before publishing an
   article whose whole value is that deadline.**
2. **The township window dates.** The brief's "Group 1 opened 3 Aug, closed
   1 Sep" may be a *Board of Review hearing* window rather than an *Assessor
   filing* window; a mirror showed different per-township spans (Lyons 23 Jul –
   3 Sep, Bremen 12 Aug – 24 Sep, Lemont 17 Aug – 29 Sep, Calumet 20 Aug –
   2 Oct). `GAP-008` already says the engine's whole deadline *model*
   (`NOTICE_RELATIVE`, 30 days) is wrong and needs a `TOWNSHIP_CALENDAR` kind
   that does not exist. **Cook deadline content is blocked on a schema change,
   not just on data.**

**The competitive picture.** Contingency-fee appeal operators own these SERPs —
`ownwell.com` (25%, nine states including Illinois but **not** New Jersey),
`cutmytaxes.com`, `cookcountytaxappeal.com` — behind a thick layer of apparent
programmatic content farms and a layer of law firms. **Not one of them ships a
computed conditional verdict.** They publish deadline tables and how-to prose,
then a lead form. Nobody in the field will ever tell a homeowner *not* to file,
because their revenue depends on filing. Chapter 123 is a deterministic pass/fail
test where the correct answer is often "do not file" — the board is *required* to
deny relief inside the corridor. **That asymmetry is the entire product thesis
for this section**, and it is worth more than any deadline table.

---

### R1 · Is appealing worth it, and what are my odds — **WRITABLE**

- **Primary keyword** — `is it worth appealing property taxes`
- **Secondary / long-tail** — `what are my odds of winning a property tax appeal` · `can appealing property taxes backfire` · `does appealing property taxes raise your assessment` · `how much can you save appealing property taxes` · `what percentage of property tax appeals are successful` · `do I have a case for a property tax appeal` · `what happens if I lose my property tax appeal` · `property tax appeal worth the time`
- **Intent** — commercial investigation / decision. **The highest intent-match to the product of any cluster in this section.**
- **PAA / sections** — *"Is it worthwhile to appeal?"* and *"What are the chances that my appeal will be successful?"* — both **verbatim headings on the Cook County Board of Review's own FAQ**. · Can my taxes go up if I appeal? · What does filing cost me in time and fees? · When is the honest answer "no"?
- **Demand evidence** — `EVIDENCED`, and this is the strongest signal in the section: a county board of review wrote both questions into a standing public FAQ, which happens only under repeated asking. https://www.cookcountyboardofreview.com/about/frequently-asked-questions . Two commercial operators hold pages on the identical title: https://www.ownwell.com/blog/is-it-worth-appealing-property-taxes · https://www.ownwell.com/blog/appeal-property-taxes-worth-it
- **Difficulty** — **Medium.** Ownwell holds two URLs plus Kiplinger and Fox. Generic essays. **Beatable only with a computed per-user verdict, not another essay** — two competing pages already own the title you would otherwise write.
- **Feeds** — `/property/check`. `verdict.ts` returns `STRONG_CASE` / `WORTH_FILING` / `NOT_WORTH_IT` / `CANNOT_DETERMINE`, and `fees.ts` compares savings against the filing fee. The article's payload is the existence of an honest "not worth it".
- **Backed by** — `runAssessmentCheck`, `verdict.ts`, `fees.ts`, `confidence.ts`, `property.cook.assessmentRatio`, `property.cook.estimatedTaxRate`
- **Gap risk** — DISCLOSE. `GAP-014` — the estimated Cook tax rate is a self-described rough estimate collapsing three separately-published factors into one constant, and it feeds the headline "estimated annual overpayment" directly. `GAP-007` — the claim that the first-level Assessor appeal is free is only half verified, so a "worth it" verdict computed against a $0 fee may be wrong. Both must be visible.
- **Freshness** — Evergreen, refreshed per cycle. Cook is live right now; New Jersey is closed until roughly February 2027.

---

### R2 · Do I need a lawyer, and what do the contingency firms cost — **WRITABLE**

- **Primary keyword** — `do I need a lawyer to appeal property taxes Cook County`
- **Secondary / long-tail** — `property tax appeal lawyer percentage cook county` · `property tax attorney contingency fee illinois` · `can I appeal my property taxes myself` · `is a property tax appeal lawyer worth it` · `do property tax appeal companies work` · `cook county pro se property tax appeal` · `property tax appeal contingency 25 vs 30 percent` · `does the attorney fee eat my savings`
- **Intent** — commercial investigation. **This is the cluster where the site's independence *is* the product.**
- **PAA / sections** — *"Do I need an attorney?"* (main Cook BoR FAQ) and *"Do I need an attorney to file an appeal on my behalf?"* (District 3 FAQ) — **the same county asks it twice on two pages.** · Can I file myself? (Individuals may; corporation- or LLC-held property may not.) · What does 25–30% of the saving actually cost me? · Does the fee recur every year the reduction holds?
- **Demand evidence** — `EVIDENCED`. https://www.cookcountyboardofreview.com/about/frequently-asked-questions · https://www.cookcountyboardofreview.com/district-3-faq · local press on the appeal-lawyer economy: https://www.axios.com/local/chicago/2023/05/24/cook-county-property-tax-appeal-lawyers
- **Difficulty** — **Easy, and structurally so.** Every page answering "do you need a lawyer?" is published by a lawyer or an appeal firm. The field is conflicted by construction. **The trap nobody surfaces well:** some contracts bill the percentage *every year the reduction holds*, so a three-year lock at 25% is effectively triple the headline fee.
- **Feeds** — `/property/check`. The article's computed payload is the saving net of a contingency fee versus net of a filing fee.
- **Backed by** — `fees.ts`, `property.cook.estimatedTaxRate`, `property.cook.assessmentRatio`
- **Gap risk** — DISCLOSE (`GAP-014`, `GAP-007`). No new data required. **Shippable now.**
- **Freshness** — Annual fee-benchmark refresh.

---

### R3 · My assessment went up and nothing about my house changed — **WRITABLE**

- **Primary keyword** — `why did my property assessment go up when nothing changed`
- **Secondary / long-tail** — `assessment increased but I made no improvements` · `my neighbour's assessment is lower than mine` · `assessment went up but my home value went down` · `is my assessment based on my neighbours' sales` · `uniformity appeal vs overvaluation appeal` · `trending assessment increase explained`
- **Intent** — informational, emotional, converts hard into R1
- **PAA / sections** — *"Why did my assessment go up?"* and *"Why are my property taxes increasing while my property value is decreasing?"* — **both verbatim on the Cook BoR District 3 FAQ**, and the second is an unusually good question. · Is my complaint that the value is wrong, or that it is *unequal*? · Which theory should I actually file under?
- **Demand evidence** — `EVIDENCED`. https://www.cookcountyboardofreview.com/district-3-faq · https://www.cookcountyboardofreview.com/about/frequently-asked-questions
- **Difficulty** — **Easy. One of the most beatable SERPs found** — largely out-of-state results, extension-service articles and forum threads.
- **Feeds** — `/property/check`
- **Backed by** — `ratio.ts`, `comps.ts`, `stats.ts`, `property.cook.assessmentRatio`
- **Gap risk** — **DISCLOSE, and this one is sharp.** `GAP-011` is the register's highest-stakes Cook row: `primaryArgument: "UNIFORMITY"` is *unconfirmed*, and `primaryArgument` selects the entire ratio model in `ratio.ts`. This article's central distinction — uniformity versus market value — is exactly the thing the engine may have wrong. **The article can teach the distinction; it must not assert which one Cook actually runs on.** Written honestly, that disclosure is the article's credibility.
- **Freshness** — 2026 is the south/west triad reassessment year in Cook.

---

### R4 · Cook 2026 reassessment — why the notice arrived — **WRITABLE**

- **Primary keyword** — `Cook County reassessment 2026`
- **Secondary / long-tail** — `is my township being reassessed in 2026` · `cook county triennial reassessment schedule` · `why did my cook county assessment go up` · `south suburbs reassessment 2026` · `cook county reassessment notice what to do` · `my assessment doubled cook county` · `when will I get my reassessment notice`
- **Intent** — informational, panic-driven, feeds R1 and R3
- **PAA / sections** — Which townships are in the 2026 triad? · Does a reassessment automatically raise my bill? (No — it changes the share.) · What is the difference between assessed value, equalised value and the bill? · What do I do in the window after the notice?
- **Demand evidence** — `EVIDENCED`, including two dated news hooks worth building around: the Cook County Assessor **lost the March 2026 Democratic primary**, reportedly driven by the areas hardest hit by increases (https://www.wbez.org/government-politics/elections/2026/03/23/cook-county-assessor-fritz-kaegi-lyons-township-dan-hynes-democratic-primary-property-tax-increase-factor), and the Sun-Times reported on **24 Aug 2026 — two days ago** — that total Cook County taxes billed rose for the **32nd consecutive year** (https://chicago.suntimes.com/politics/2026/08/24/cook-county-treasurer-maria-pappas-report-property-tax-bills-rise-32nd-consecutive-year).
- **Difficulty** — **Easy-medium.** A competing firm syndicated a press release about the 2026 reassessment to wire services — a PR-distribution play, easy to outrank on substance.
- **Feeds** — `/property/counties/il/cook`
- **Backed by** — `property.cook.assessmentRatio`, `property.cook.estimatedTaxRate`, `runAssessmentCheck`
- **Gap risk** — DISCLOSE (`GAP-013` on the 10% assessment level, which rests only on secondary summaries because the Classification Ordinance could not be reached from any official host; `GAP-014` on the rate). **Needs a small static township→triad map that does not exist yet.**
- **Freshness** — Annual, and currently live.

---

### R5 · What evidence a property tax appeal actually needs — **WRITABLE, with a caveat**

- **Primary keyword** — `what evidence do I need for a property tax appeal`
- **Secondary / long-tail** — `how to find comparable sales for a property tax appeal` · `do I need an appraisal to appeal property taxes` · `how many comps do I need` · `what makes a good comparable property` · `property tax appeal evidence checklist` · `photos for a property tax appeal` · `does a recent purchase price count as evidence`
- **Intent** — informational, mid-funnel
- **PAA / sections** — *"What is good evidence to convince the Tax Board to reconsider an assessment?"* · *"If the property was recently purchased, how is this purchase considered?"* · *"Who is an expert witness?"* (all three **verbatim on Bergen County's official FAQ**) · *"How do I find comparable properties?"* · *"Do I need a picture?"* · *"For residential properties, is it necessary to submit evidence?"* (all three **verbatim on the Cook BoR FAQ**)
- **Demand evidence** — `EVIDENCED`, from two county governments. https://bergencountynj.gov/faq/tax-appeals/ · https://www.cookcountyboardofreview.com/about/frequently-asked-questions
- **Difficulty** — **Easy-medium**, and there are **two contrarian facts worth owning**: the Cook Board of Review does its own comparable research and evidence is *not required* from an individual residential filer — which contradicts nearly every "you must gather comps" article ranking — and New Jersey comps are weighed against the **1 October pre-tax-year valuation date**, so a July sale is weak evidence for the following year.
- **Feeds** — `/property/check`
- **Backed by** — `comps.ts` (the `IS_SUBJECT` / `DIFFERENT_CLASS` / `OUTSIDE_AREA` / `SIZE_OUT_OF_RANGE` / `NO_SALE` / `DATA_TOO_OLD` rejection reasons are genuinely useful article content), `confidence.ts`
- **Gap risk** — **DISCLOSE, substantially.** `GAP-010` — the Cook evidence standard asserts comparable-count and photograph rules that no reachable source states; the BoR's official rules set no quota and the FAQ merely calls photographs "strongly encouraged". `GAP-012` and `GAP-038` — the 18-month and 24-month comparable windows are unsourced defaults in both counties. `GAP-037` — the "up to five comparable sales" limit has no legal basis and was already removed from user-facing prose. **Write the rules the engine can source and label the windows as modelling choices.** The article must not invent a quota, which is precisely what the competing articles do.
- **Caveat** — **Comparable sales data itself is a licensing problem, not a scraping problem.** Ship the *rules of admissibility* without the comps.

---

### R6 · Chapter 123 and the common level range — **FLAGSHIP, BLOCKED**

- **Primary keyword** — `Chapter 123 New Jersey property tax appeal`
- **Secondary / long-tail** — `what is the common level range NJ` · `chapter 123 ratio explained` · `NJ 15 percent rule property tax appeal` · `how to calculate if I qualify for a NJ tax appeal` · `common level range lower limit upper limit` · `why was my NJ tax appeal denied` · `chapter 123 calculator` · `does my assessment fall within the common level range` · `equalized value vs assessed value NJ`
- **Intent** — decision. **The single highest-value cluster in this section and possibly on the site**, because it is a deterministic statutory pass/fail that a homeowner cannot do in their head, and because the correct output is frequently "do not file".
- **PAA / sections** — *"How do I know if my assessment is fair?"* and *"What is the basis for my assessment?"* (**verbatim, Bergen County FAQ**) · What is the Director's Ratio and where does mine come from? · What does the ±15% corridor mean in dollars for my assessment? · Can the board *increase* my assessment? (Yes — below the lower limit, a statutory increase is the outcome.) · Why would a lawyer file anyway?
- **Demand evidence** — `EVIDENCED`. The Division of Taxation states the rule plainly — *"The common level range for a taxing district is that range which is plus or minus 15% of the average ratio for that district"* — https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml . Substantive law-firm treatments exist (https://www.skoloffwolfe.com/insights/equalization-ratios-and-property-tax-assessments/ · https://www.mirnelaw.com/articles/equalization-ratios-are-crucial-in-determining-the-feasibility-o/) and a nonprofit has done the best public data work on it (https://civicparent.org/2016/05/06/property-revaluation-401-tax-appeal-math-chapter-123-law/).
- **Difficulty** — **Very beatable.** Everyone explains the formula; nobody runs it on the reader's house.
- **Feeds** — `/property/check`
- **Backed by** — `common-level-range.ts` — **Chapter 123 is fully implemented**: the ±15% multiplicative corridor, clauses (1)–(4), the statutory relief basis, and the symmetric increase below the lower limit. Plus `property.bergen.commonLevelCorridor`.
- **Gap risk** — ⛔ **BLOCKED by `GAP-041`.** The logic is built and the data table is empty, so every Bergen result is `CANNOT_DETERMINE`. **The article can explain the rule today; it cannot deliver a verdict.** Load the Chapter 123 table and this becomes the strongest page on the site. Note the annual duty: republished every 1 April, re-pull yearly.
- **Freshness** — Ratios republished 1 April; the 2026 table was certified 1 Oct 2025 and **amended by the New Jersey Tax Court on 30 Jan 2026** — mid-year amendment is itself a freshness hook, and a reason the citation needs a date.

---

### R7 · What is my town's equalization ratio — **BLOCKED, and governance-flagged**

- **Primary keyword** — `[town] NJ equalization ratio 2026`
- **Secondary / long-tail** — `Teaneck equalization ratio` · `Fort Lee director's ratio 2026` · `Hackensack common level range` · `Ridgewood NJ average ratio` · `how to find my town's equalization ratio` · `NJ director's ratio table 2026` · `Bergen County equalization ratios by town` · `what does a 62% ratio mean for my assessment`
- **Intent** — navigational + calculation
- **PAA / sections** — `INFERRED — no measurement`. No government FAQ was observed at municipal granularity; the demand is inferred from the fact that every Bergen homeowner needs one specific number that is published only inside a PDF.
- **Demand evidence** — `INFERRED — no measurement` on volume. `EVIDENCED` that the data exists and is poorly served: the source is a single state PDF (https://www.nj.gov/treasury/taxation/pdf/lpt/chap123/2026CH123.pdf) and the alternatives are municipal .gov pages that are largely unoptimised and often stale.
- **Difficulty** — **The most beatable SERP in this section.**
- **Feeds** — `/property/counties/nj/bergen`
- **Backed by** — nothing today.
- **Gap risk** — ⛔ **BLOCKED by `GAP-041`**, plus `GAP-043` (the county-average tax rate estimate, when New Jersey rates are struck per municipality per year) for any dollar output.
- ⚠️ **Governance flag, and it is not optional.** Seventy auto-generated town pages is **structurally the doorway-page pattern CLAUDE.md bans** for `/scenarios/[balance]-[income]`. They pass gate 1 (a unique computed number per page) trivially and **fail gates 2, 3 and 4** without real per-town work. If this ships at all it ships as a handful of hand-curated municipality pages, not seventy templates.
- **Freshness** — 1 April republication plus Tax Court amendments.

---

### R8 · How to appeal in New Jersey and the April 1 deadline — **WEAKENED + OUT OF SEASON**

- **Primary keyword** — `how to appeal property taxes in NJ`
- **Secondary / long-tail** — `NJ property tax appeal deadline 2026` · `april 1 property tax appeal NJ` · `45 days from notification of assessment` · `NJ revaluation year May 1 deadline` · `Bergen County Board of Taxation appeal form` · `NJ tax appeal filing fee` · `October 1 valuation date NJ` · `can I appeal to NJ Tax Court directly`
- **Intent** — transactional, seasonal
- **PAA / sections** — *"When are the tax appeal hearings held?"* · *"Is a hearing always necessary?"* · *"What is a tax appeal hearing and who will hear my appeal?"* · *"May I further appeal the judgment of the Tax Board if I am still dissatisfied?"* · *"Will the appeal be private?"* — **all five verbatim on Bergen County's FAQ.**
- **Demand evidence** — `EVIDENCED`. https://bergencountynj.gov/faq/tax-appeals/ · https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml
- **Difficulty** — **Medium.** Appeal farms, NJ law firms and municipal sites. **The deadline is genuinely harder than anyone renders it** — the standard 1 April, the 45-days-after-bulk-mailing extension, 1 May in revaluation years, and per-municipality variation. A single-source claim of five distinct 2026 Bergen deadlines surfaced in research; **it is unverified against the county and must not be published as fact.**
- **Feeds** — `/property/counties/nj/bergen`
- **Backed by** — `deadline.ts`
- **Gap risk** — **DISCLOSE, and the engine is knowingly wrong in two ways.** `GAP-051` — weekend/holiday rollover is not modelled, so the countdown can show a deadline earlier than the law allows. `GAP-052` — the 45-day bulk-mailing extension cannot be computed because there is no bulk-mailing date input, so a homeowner in a late-mailing municipality is told they have less time than they do. `GAP-015` — the statute citation is a bare site root. All three are fixable and none is a research problem.
- **Freshness** — ⏸ **The 2026 New Jersey window closed months ago.** Build now, publish for February 2027.

---

### R9 · NJ relief programmes are not appeals — **WRITABLE, and in season**

- **Primary keyword** — `NJ ANCHOR vs property tax appeal`
- **Secondary / long-tail** — `Stay NJ eligibility 2026` · `NJ senior freeze vs ANCHOR` · `PAS-1 application deadline` · `do I have to apply for ANCHOR every year` · `can I get ANCHOR and appeal my assessment` · `NJ property tax relief 2026 income limit`
- **Intent** — informational, and consequential because people **substitute one remedy for the other**
- **PAA / sections** — Do relief programmes and appeals stack? (**Yes** — relief cuts the bill, an appeal cuts the assessment.) · Which programme am I eligible for? · One application or three? · What is the deadline?
- **Demand evidence** — `EVIDENCED`. The state maintains dedicated programme and FAQ pages: https://www.nj.gov/treasury/taxation/propertytaxrelieffaq.shtml · https://www.nj.gov/treasury/taxation/staynj/index.shtml . Consumer press is actively covering possible cuts: https://www.kiplinger.com/taxes/new-jersey-property-tax-relief-could-get-cut
- **Difficulty** — **Medium.** nj.gov and Kiplinger rank; the rest is alert-farm content.
- **Feeds** — `/property`. **Thin on engine output** — this is eligibility rules, not computation, so it must either carry a computed element or serve as an internal-linking asset. Flag against publish gate 1.
- **Backed by** — nothing wired. Needs a small, cited eligibility rule set — but **no Director's Ratio**, which is why it is shippable while R6 is not.
- **Gap risk** — CLEAR of existing gaps; requires new (easy, well-published) rules.
- **Freshness** — ⏰ **The only New Jersey cluster that is both in season and not blocked.** A single PAS-1 covers the programmes and the deadline reported in research is **2 November 2026 — about ten weeks out**. Verify that date against nj.gov before publishing.

---

### R10 · After the Board of Review — PTAB — **WRITABLE, narrow**

- **Primary keyword** — `PTAB appeal Illinois how it works`
- **Secondary / long-tail** — `PTAB vs circuit court illinois` · `how long does PTAB take` · `30 days to file PTAB after board of review` · `is PTAB worth it for a house` · `can I appeal a board of review decision` · `PTAB filing fee residential`
- **Intent** — narrow, sophisticated, low competition
- **PAA / sections** — *"Are there any additional venues to appeal my assessment?"* · *"Can I file an appeal for a prior year?"* · *"How often can I appeal the assessed value of my property with the Board of Review?"* — **all verbatim on the Cook BoR FAQ.** · What is the deadline after a written decision? · When will PTAB actually decide? (Typically after taxes are due — a real expectation-setting gap.)
- **Demand evidence** — `EVIDENCED`. https://www.cookcountyboardofreview.com/about/frequently-asked-questions
- **Difficulty** — **Easy.** Thin field: the PTAB site itself, an encyclopaedia entry, one county FAQ.
- **Feeds** — `/property/counties/il/cook`. Completes the Assessor → Board of Review → PTAB ladder the engine already models in `levels`.
- **Backed by** — `il-cook.json` `levels`, `fees.ts`
- **Gap risk** — DISCLOSE (`GAP-006` — the PTAB citation URL never resolved; not confirmed dead, just unreachable, so the third appeal level is named with a link nobody has confirmed).
- **Freshness** — Low. A durable, low-maintenance asset.

---

### R11 · Cook exemptions versus appeals — **WEAKENED**

- **Primary keyword** — `Cook County homeowner exemption vs appeal`
- **Secondary / long-tail** — `cook county senior freeze exemption income limit` · `do I have to reapply for the senior exemption every year` · `homeowner exemption cook county how much` · `can I get an exemption and appeal` · `missed my homeowner exemption can I get it back` · `senior exemption vs senior freeze exemption`
- **Intent** — informational, adjacent and frequently conflated with appeals
- **PAA / sections** — *"How do I fix property description errors and request exemptions?"* (Cook BoR District 3 FAQ) · Do exemptions and a successful appeal stack? (Yes.) · Which exemptions must be renewed annually? (Senior Freeze must; the plain Senior Exemption need not.) · What is the deadline?
- **Demand evidence** — `EVIDENCED`. County-run pages exist for each programme: https://www.cookcountyil.gov/service/property-tax-exemptions · https://www.cookcountytreasurer.com/exemptions.aspx
- **Difficulty** — **Medium.** County sites rank well and appeal firms are attacking exemption queries as top-of-funnel for appeal leads.
- **Feeds** — `/property/counties/il/cook`
- **Backed by** — nothing wired. Needs exemption values and the equalised-assessed-value arithmetic — small and static, but absent.
- **Gap risk** — **WEAKENED.** Also depends on `GAP-014`, since the state equalization factor is one of the three factors that constant collapses. Closing `GAP-014` properly — modelling assessment level × state equalization factor × composite local rate explicitly — unblocks this cluster *and* fixes the headline dollar figure for R1, R2 and R4. **It is the highest-value property engineering task after the Chapter 123 table.**
- **Freshness** — Annual.

---

**Property cluster count: 11.** WRITABLE now: 5 (R1, R2, R3, R4, R10) plus R5
with heavy disclosure and R9 pending a small new rule set. **BLOCKED: 2**
(R6 — the flagship — and R7, both on `GAP-041`). **WEAKENED: 3** (R5, R8, R11).
Nine of the eleven carry at least one open gap. **This section cannot support
ten strong articles today and should not pretend to**; it can support five good
ones now, and eight to ten once the Chapter 123 table is loaded and `GAP-014` is
modelled properly.

## 7. TRADES — 10 clusters, of which 6 are writable today

**The honest headline first.** Trades has **two wired scalar figures** — the
California and New York home improvement contract thresholds — and one table of
thresholds by state. Both scalars carry `GAP-053`. Beyond that:

- **All pricing data is placeholder.** `GAP-031`: every assembly unit cost,
  labour-hour figure, waste factor, access multiplier, range spread and
  `taughtDefaults` value in the three trade files is invented reference data.
  Its own citation URL is `https://example.invalid/pricing-methodology`, a
  reserved TLD that will never resolve, and its `staleAfterDays: 120` from
  `effectiveFrom: 2026-08-01` means **the data is already past its own staleness
  window**. `GAP-032`: no BLS OEWS wage figure was ever captured, so the labour
  half of every estimate rests on unsourced rates whose regional multipliers are
  identical across all three trades — itself a tell that they are modelled, not
  measured.
- **Contract generation fails closed for four of five states.** `GAP-023`
  through `GAP-026`: California, Texas, Florida and New York all prescribe
  *verbatim* statutory notice wording that has not been transcribed, and
  `canGenerateContract` correctly returns false. **Only Pennsylvania generates.**
  And `GAP-029` means CA, FL and TX stay blocked *even after transcription*,
  because nothing downstream can set a per-clause point size, produce a separate
  signed-and-dated notice page, or supply a detachable duplicate form.

**What that leaves is better than it sounds, and it is the legal side.**
`selectClauses` enumerates which clauses each state requires and at what dollar
trigger for **all five states**, and the rule files carry verified rules that
simply have no `figures.ts` id yet — California's down-payment cap (`ca.json`
records it as VERIFIED: *"lesser of $1,000 or 10 percent of the contract
price"*), Pennsylvania's cap, New York's `deposit-escrow` obligation, the
per-state right-to-cancel windows, and `prohibitedTerms`. **Adding figure ids
for those is the cheapest unblock in this section.**

**Three findings that should change the plan for this section.**

1. **A direct competitor already exists and is executing this exact strategy.**
   `bid-lens.com` describes itself as a homeowner resource platform that
   analyses contractor bids against state regulations. Its New York deposit
   page cites Lien Law § 71-a and GBL §§ 771, 771-b, carries an FAQ block and a
   county-level licensing table, and it offers a free upload-your-bid analysis:
   https://bid-lens.com/guides/contractor-deposit-laws-new-york . This is the
   product hypothesis, already shipped and indexed. **Assess it properly before
   committing** — the question is not "is there an opening" but "can we beat a
   named incumbent".
2. **California § 7159 changed on 1 January 2026, and the rule files may not
   know.** SB 517 (Chapter 585, signed 10 Oct 2025) and AB 1327 (chaptered
   6 Oct 2025) both amend Bus & Prof Code § 7159 operative 1 Jan 2026: a
   subcontractor-use disclosure with a prescribed disclaimer and naming
   requirements where a sub performs more than half the estimated cost; the
   contractor's email and phone and the general liability carrier's phone in the
   contract; and **cancellation by email now permitted**, with the prescribed
   Right-to-Cancel form updated to carry the contractor's email.
   https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB517 ·
   https://calconstructionlawblog.com/2026/01/04/2026-construction-law-update/ ·
   https://www.smithcurrie.com/publications/common-sense-contract-law/new-california-home-improvement-contract-laws-for-2026/
   ⚠️ **This is an engine correctness item, not a content angle.** `ca.json`
   must be re-verified against the current § 7159 before any California article
   ships — and the notice text to be transcribed under `GAP-023` is now the
   *amended* text, which means transcribing the pre-2026 version would be a
   fresh defect.
3. **The incumbents publish advice that is illegal in California.** LegalZoom's
   general contractor agreement guide states it is "normal to pay one-third to
   one-half of the total bill at the time the contract is signed as a deposit":
   https://www.legalzoom.com/articles/general-contractor-agreement-how-to-guide .
   In California that exceeds the § 7159.5 cap. **The generic template tier is
   not merely thin; it is demonstrably and citably wrong.** That is the most
   beatable competitive surface in the section.

**A note on the cost SERPs, stated plainly.** Angi and HomeAdvisor own "how much
does X cost" outright, with Fixr, HomeGuide, NerdWallet, This Old House and
Thumbtack behind them, refreshed annually with "[2026 Data]" title tags built on
millions of real quotes. **We would be publishing invented numbers against their
measured ones.** In a money niche that is the fastest available way to lose
trust and rankings at the same time. The cost clusters below are listed and then
explicitly deferred.

---

### T1 · Pennsylvania HICPA contract requirements — **THE ONE FULLY-BACKED CLUSTER**

- **Primary keyword** — `pennsylvania home improvement contract requirements`
- **Secondary / long-tail** — `HICPA contract requirements` · `PA contractor registration number lookup` · `do I need to be registered to do home improvement in PA` · `PA home improvement contract void unenforceable` · `PA 3 day rescission` · `73 P.S. 517.7 checklist` · `PA home improvement contract template` · `contractor didn't have a HIC number` · `PA home improvement down payment limit`
- **Intent** — contractor-side compliance (high commercial) and homeowner verification
- **PAA / sections** — What must a Pennsylvania home improvement contract contain? · What happens if a required item is missing? (Under § 517.7(a) the contract is **void and unenforceable against the homeowner** — the contractor cannot collect.) · Who must register, and at what annual volume? · What is the rescission right and does it depend on where I signed? (It does not.) · How do I check a registration number?
- **Demand evidence** — `EVIDENCED`, institutionally. The Pennsylvania Attorney General runs a dedicated **Contractor Frequently Asked Questions** page, a registration portal, a **public registration search tool** and a consumer hotline: https://www.attorneygeneral.gov/resources/home-improvement-contractor-registration/contractor-frequently-asked-questions/ · https://hic.attorneygeneral.gov/ · https://hicsearch.attorneygeneral.gov/ . A state builds a search tool and a hotline because volume forces it to. Substantive treatments: https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-7/ · https://www.levelset.com/blog/pennsylvania-home-improvement-consumer-protection-act/
- **Difficulty** — **Medium.** The AG dominates the informational slot and law firms hold the rest, but **nobody in the SERP produces a compliant contract.** That is the gap and it is the one place the product is currently whole.
- **Feeds** — `/trades/contracts/pa` and `/trades/contract`. **This is the only state where the tool can deliver on its full promise today.**
- **Backed by** — `selectClauses`, `canGenerateContract` (true for PA only), `pa.json` (`hicpa-contract-contents`, `rescission-right`, `downpayment-cap`, `registration-number`), `trades.homeImprovementThresholds` table
- **Gap risk** — **DISCLOSE, and fix two things first.** `GAP-054` — the string `"UNVERIFIED — ATTORNEY REVIEW REQUIRED"` still sits **inside the `text` field of every DRAFTED clause**, which is the field rendered into a contract, and it is **latent for the four blocked states but live for Pennsylvania**. `GAP-030` — the PA contract-contents clause omits the transaction date, liability insurance amounts, subcontractor information, the toll-free number and the notice of rescission, and cites § 517.7(a) for a $500 threshold that lives in § 517.2. `GAP-019` and `GAP-021` — PA's authority is a consumer FAQ page that returns 403, and all PA content currently rests on a secondary source. **Publishing a "we generate a compliant PA contract" article while GAP-054 can print a warning into the document is not acceptable.**
- **Freshness** — Re-verify annually and after any session amending HICPA.

---

### T2 · How much can a California contractor ask for up front — **WRITABLE**

- **Primary keyword** — `how much can a contractor ask for up front in california`
- **Secondary / long-tail** — `california contractor deposit limit` · `is a 50% deposit legal in california` · `10% or $1,000 whichever is less` · `BPC 7159.5` · `contractor wants half down california` · `max down payment california remodel` · `contractor asking for a $10,000 deposit` · `california deposit law violation penalty`
- **Intent** — homeowner, urgent, pre-signature or immediately post-payment. **Very high intent and the crispest single number in the section.**
- **PAA / sections** — *"Is there a schedule of payments?"* — a **verbatim question on the CSLB's own homeowner checklist**, which also instructs that the down payment be "no more than 10% of the contract price or $1,000, whichever is less". · Is it illegal for a contractor to ask for 50% up front? · What do I do if I already paid too much? · How does the cap interact with the progress-payment schedule?
- **Demand evidence** — `EVIDENCED`. https://www.cslb.ca.gov/Consumers/Hire_A_Contractor/Home_Improvement_Contracts/Homeowner_Checklists.aspx · a question-shaped Q&A page exists precisely because people ask it: https://www.levelset.com/payment-help/question/california--limit-to-down-payment-request/ · CSLB industry bulletin on progress payment restrictions: https://www.cslb.ca.gov/Resources/IndustryBulletins/2022/Industry_Bulletin_Progress_Payment_Restrictions.pdf
- ⚠️ **Do not describe AB 559 as law.** It was ordered to the inactive file on 3 Sep 2025 and did not pass.
- **Difficulty** — **Easy.** CSLB, Levelset, contractor-licensing schools and small firms. Most state the number without the payment-schedule interaction.
- **Feeds** — `/trades/contract`
- **Backed by** — `ca.json` `downpaymentCapRule` (recorded VERIFIED), `trades.ca.homeImprovementThreshold`
- **Gap risk** — DISCLOSE (`GAP-053` — the threshold comparators are off by one; § 7159 reads "exceeds $500" but the clause triggers use `>=`, so a contract at exactly the threshold fires a clause the statute does not require). **Unwired-figure flag: the down-payment cap has no `figures.ts` id and the article cannot state it without one.** Add `trades.ca.downpaymentCap`.
- **Freshness** — § 7159 amended operative 1 Jan 2026 — see the section header. Verify `ca.json` first.

---

### T3 · The three-day right to cancel, and why it differs by state — **WRITABLE**

- **Primary keyword** — `3 day right to cancel contractor contract`
- **Secondary / long-tail** — `can I cancel a contract with a contractor after signing` · `3 day right to cancel california` · `how to write a cancellation letter to a contractor` · `does the 3 day rule apply if I signed at their office` · `5 day cancellation seniors california` · `cancel by email california 2026` · `notice of cancellation form` · `rescind home improvement contract pennsylvania`
- **Intent** — homeowner, extremely urgent, a 72-hour window. **The best conversion moment in the section.**
- **PAA / sections** — *"Does the 3-day right to cancel a contract apply to you?"* and *"Does the 5-day right to cancel a contract (for those 65 and older) apply to you?"* — **both verbatim on the CSLB homeowner checklist.** · Does it depend on where I signed? · How do I actually deliver the cancellation? · What must the contractor have given me?
- **Demand evidence** — `EVIDENCED`. https://www.cslb.ca.gov/Consumers/Hire_A_Contractor/Home_Improvement_Contracts/Homeowner_Checklists.aspx · a state Attorney General runs a dedicated rescission page: https://www.texasattorneygeneral.gov/consumer-protection/home-real-estate-and-travel/door-door-sales-3-day-right-rescission · legal aid maintains a consumer article: https://texaslawhelp.org/article/the-3-day-right-to-cancel-a-purchase
- **Difficulty** — **Medium on the comparative framing, hard per state** (AG pages will hold their own states). **The non-obvious insight this cluster owns is that the trigger differs and most pages get it wrong:** Texas Chapter 601 applies only to *home solicitation* away from the merchant's place of business, not to all home improvement contracts; Pennsylvania § 517.7(b) applies **regardless of where the contract was signed**; California now permits cancellation by email and most states do not. That is precisely the "eligibility interaction a reader could not derive" that publish gate 2 asks for.
- **Feeds** — `/trades/contracts/[state]`
- **Backed by** — `selectClauses` across all five states, `trades.homeImprovementThresholds`, the per-state right-to-cancel clauses
- **Gap risk** — DISCLOSE (`GAP-028` — New York's right-to-cancel clause cites GBL § 771(1)(g) when the cancellation provision is § 771(1)(**h**), the Personal Property Law cross-cite was never verified, and the statutory bona fide emergency exception is unmodelled; the *substance* is right, the authority printed beside it is wrong). Also `GAP-025` — the Texas cancellation *form* is untranscribed, so the article may describe the right but must not imply the tool produces the form.
- **Freshness** — California's email-cancellation change is dated 1 Jan 2026 and most ranking pages predate it.

---

### T4 · California home improvement contract requirements — **WRITABLE as explainer only**

- **Primary keyword** — `california home improvement contract requirements`
- **Secondary / long-tail** — `what must a california home improvement contract include` · `BPC 7159 checklist` · `california contract 12 point boldface notice` · `SB 517 subcontractor disclosure` · `AB 1327 email cancellation` · `CSLB contract requirements 2026` · `california home improvement contract over $500` · `is my california contract legal` · `california change order requirements`
- **Intent** — split: contractors seeking compliance, homeowners auditing
- **PAA / sections** — *"Does the contract tell you when work will start and end?"* · *"Does the contract include a detailed description of the work to be done, the material to be used, and equipment to be installed?"* · *"Does the contract require the contractor get any needed permits before the work starts?"* · *"Did you know changes or additions to your contract must all be in writing?"* — **all four verbatim on the CSLB homeowner checklist.** · What changed on 1 January 2026?
- **Demand evidence** — `EVIDENCED`. https://www.cslb.ca.gov/Consumers/Hire_A_Contractor/Home_Improvement_Contracts/Homeowner_Checklists.aspx plus a thick layer of law-firm treatments of the 2026 amendments.
- **Difficulty** — **Medium.** CSLB is unbeatable on brand but publishes a checklist, not a generator. The law-firm layer is static and offers no output.
- **Feeds** — `/trades/contracts/ca`
- **Backed by** — `selectClauses`, `ca.json`, `trades.ca.homeImprovementThreshold`
- **Gap risk** — ⛔ **Explainer writable; generator BLOCKED.** `GAP-023` (four untranscribed verbatim notices, and note the senior five-day cancellation is a **distinct, unmodelled notice** that must not be merged into the standard one), `GAP-029` (typography cannot be rendered even after transcription), `GAP-030` (the written-contract clause covers roughly two of the thirteen elements § 7159(d) enumerates, and cites the wrong subsection). **The article must not imply a California contract can be produced.**
- **Freshness** — Exceptional, and time-boxed: most ranking pages predate 1 Jan 2026.

---

### T5 · New York contract requirements, deposits and escrow — **WRITABLE as explainer**

- **Primary keyword** — `new york home improvement contract requirements`
- **Secondary / long-tail** — `GBL 771 contract provisions` · `NY contractor escrow requirement lien law 71-a` · `NYC DCWP home improvement contractor license` · `do I need a license to remodel in NY` · `NY progress payment reasonable relationship` · `Nassau Suffolk Westchester contractor license` · `NY roofing deposit ban 771-b`
- **Intent** — split, compliance and verification
- **PAA / sections** — What must the contract contain? · Must my deposit be held in escrow? · Do I need a licence, and whose? (County or city — a New York City licence does not work in Suffolk.) · What is a "reasonable relationship" progress payment schedule?
- **Demand evidence** — `EVIDENCED`, and unusually so: **a county consumer-protection office maintains two separate pages on one statute** — https://www3.erie.gov/consumerprotection/home-improvement-contract-requirements and https://www3.erie.gov/consumerprotection/featured/general-business-law-ss771-new-york-state-home-improvement-contract-provisions . Plus the state Attorney General's consumer publication: https://ag.ny.gov/publications/hiring-home-improvement-contractor · statute text: https://law.justia.com/codes/new-york/gbs/article-36-a/771/
- **Difficulty** — **Medium-hard here specifically**, because `bid-lens.com` is already strong on New York deposits. The licence-aggregator spam tier is trivially beatable. **A non-obvious insight worth owning: the thresholds conflict in the wild** — the state statute keys to $500 while New York City rules key to $200, and sources visibly disagree. That confusion is itself the page.
- **Feeds** — `/trades/contracts/ny`
- **Backed by** — `selectClauses`, `ny.json` (`written-contract-terms`, `mechanics-lien-notice`, `right-to-cancel`, `deposit-escrow`, `progress-payment-schedule`), `trades.ny.homeImprovementThreshold`
- **Gap risk** — ⛔ **Explainer writable; generator BLOCKED**, though New York is the **cheapest state to unblock** — `GAP-026` says it is the only one of the four with no typography blocker beyond boldface, so transcription alone unblocks it, and the source (nysenate.gov) is reachable. Also `GAP-027` — the progress-payment clause cites § 771(1)(d), which is wrong and **collides** with the legitimately-new mechanics-lien clause that really does own (1)(d); the correct cite is § 771(1)(f). And a prior audit found `licenseDisplayRequired: true` for New York is wrong, since GBL § 771(1)(a) says "if applicable" and NY licensing is county or municipal — upstate contractors are currently told to print a number that does not exist.
- **Freshness** — Annual re-verification.

---

### T6 · Mechanics liens — how a homeowner protects themselves — **WRITABLE, hardest field**

- **Primary keyword** — `how to protect against a mechanics lien as a homeowner`
- **Secondary / long-tail** — `lien waiver before paying contractor` · `conditional vs unconditional lien waiver` · `subcontractor filed a lien but I paid the contractor` · `how to remove a mechanics lien on my house` · `preliminary notice / notice to owner meaning` · `joint check agreement contractor` · `can a subcontractor lien my home if I paid in full`
- **Intent** — homeowner, high anxiety, often post-crisis
- **PAA / sections** — *"Did your contractor give you a 'Notice to Owner,' a warning notice describing liens and ways to prevent them?"* — **verbatim on the CSLB checklist.** · Can a sub lien me after I paid the general? · What clause protects me in the contract? · What does a waiver actually waive?
- **Demand evidence** — `EVIDENCED`. **A state licensing board publishes an entire consumer guide on it**: https://cslb.ca.gov/Resources/GuidesAndPublications/HomeownersGuideToPreventingMechanicsLiens.pdf
- **Difficulty** — **Hard. The hardest legal cluster in the section.** Levelset (owned by Procore) has a decade of topical authority and an actual lien product. **Compete only on the narrow "what clause goes in the contract" angle**, which is what the engine models — not on lien filing, which it does not.
- **Feeds** — `/trades/contract`
- **Backed by** — `selectClauses` — the lien notices are required clauses in CA, FL, NY and TX and the engine knows which apply at what trigger
- **Gap risk** — **DISCLOSE.** The clause *triggers* are modelled; the notice *text* is not (`GAP-023`, `GAP-024`, `GAP-026`). `GAP-053` — Florida is **inconsistent with itself**: `lien-law-notice` uses `>=` while `recovery-fund-notice` uses `>` for the same $2,500, so the same contract gets one notice and not the other at the same price. That is a one-character fix and it should be made before this publishes.
- **Freshness** — Low; a durable asset.

---

### T7 · Texas — no licence, but real disclosure duties — **WRITABLE as explainer**

- **Primary keyword** — `texas home improvement contract requirements`
- **Secondary / long-tail** — `TX Property Code 53.255 disclosure statement` · `do you need a license to remodel in texas` · `texas 3 day right to cancel contractor` · `601.052 notice of cancellation form` · `texas residential construction disclosure before signing` · `texas contractor lien homeowner` · `texas contractor no license recourse`
- **Intent** — informational, both audiences
- **PAA / sections** — Is there a statewide residential remodeler licence? (No.) · So do I have any protection? (Yes — § 53.255 requires a disclosure statement **before the contract is executed**.) · When does the three-day cancellation right attach? (Only for home-solicitation sales.) · What is the homestead lien notice?
- **Demand evidence** — `EVIDENCED`. Legal aid maintains a consumer article and the state bar maintains a consumer-protection resource section: https://texaslawhelp.org/article/the-3-day-right-to-cancel-a-purchase · https://www.texasattorneygeneral.gov/consumer-protection/home-real-estate-and-travel/door-door-sales-3-day-right-rescission
- **Difficulty** — **Easy-medium.** Thin coverage, mostly statute mirrors with no synthesis. **The best "trap" in the section:** no licence + real disclosure duties + a conditional cancellation right is an interaction a reader genuinely cannot derive, which is a clean publish-gate-2 pass.
- **Feeds** — `/trades/contracts/tx`
- **Backed by** — `selectClauses`, `tx.json` (six clauses including `homestead-lien-notice` and `final-bills-paid-affidavit`)
- **Gap risk** — ⛔ **Explainer writable; generator BLOCKED** (`GAP-025`, `GAP-029`). **And one clause must not be repeated in prose:** `GAP-020` — the `disclosure-no-general-license` clause asserts that Texas does not license general residential construction contractors statewide, cited only to "Tex. Occ. Code (trade-specific chapters)", with nothing fetched confirming it. **An uncited negative assertion about licensing law is the single riskiest sentence in the trades engine**, and this article's headline fact is that same assertion. Cite it properly or do not write the article. `GAP-017` — no Texas rule in the engine has been read from a State of Texas host.
- **Freshness** — Annual.

---

### T8 · Florida's two notices at the same dollar figure — **WRITABLE as explainer**

- **Primary keyword** — `florida construction lien law notice contract requirement`
- **Secondary / long-tail** — `FL 713.015 notice to owner` · `florida contract over $2,500 lien warning` · `florida recovery fund notice 489.1425` · `does my florida contract need the lien warning` · `florida notice to owner signed by owner` · `what if the contractor omitted the lien notice florida` · `florida DBPR contractor complaint`
- **Intent** — informational, both audiences
- **PAA / sections** — Which notices does my contract need? · Why are there two at $2,500? · Must I sign and date the lien notice separately? · What is the penalty for omitting the recovery fund notice?
- **Demand evidence** — `EVIDENCED` for the confusion specifically: a construction firm publishes a page titled in **all caps**, *"THE NOTICE OF HOMEOWNER'S CONSTRUCTION INDUSTRY RECOVERY FUND DOES NOT APPLY TO ALL CONTRACTORS"* — an all-caps corrective title is a direct artefact of repeated misunderstanding: https://www.theconstructionlawyers.com/word/articles/Homeowner'sRecoveryFund.htm . Statute: https://www.flsenate.gov/Laws/Statutes/2025/0713.015
- **Difficulty** — **Medium.** Statute mirrors, construction law firms, and lien-service vendors with real depth. **The non-obvious insight:** two different notices from two different chapters, both keyed to $2,500, and most pages cover one.
- **Feeds** — `/trades/contracts/fl`
- **Backed by** — `selectClauses`, `fl.json` (`lien-law-notice`, `recovery-fund-notice`, `license-number`)
- **Gap risk** — ⛔ **Explainer writable; generator BLOCKED** (`GAP-024`, `GAP-029`). `GAP-022` — it is unresolved whether § 489.1425 prescribes *wording* or only *substance*; if wording, Florida is currently generating a non-compliant notice rather than failing closed, and the board contact details are "as established by board rule" and cannot be templated. `GAP-053` — the self-inconsistent comparators noted in T6. `GAP-018` — Florida rests entirely on a secondary source.
- **Freshness** — Annual.

---

### T9 · Contractor pricing for contractors — rate, markup, overhead — **WRITABLE, and the one cost-adjacent cluster that works**

- **Primary keyword** — `how much should a contractor charge per hour`
- **Secondary / long-tail** — `contractor markup percentage on materials` · `overhead and profit calculation` · `how to calculate my hourly rate as a contractor` · `flat rate vs hourly pricing` · `labor burden multiplier` · `how much profit should I make on a job` · `contractor pricing calculator`
- **Intent** — contractor-side, commercial
- **PAA / sections** — What do I actually need to charge to cover burden, overhead and profit? · Do overhead and profit add or compound? (**They compound** — the pricing methodology page already says so.) · Flat rate or hourly? · What is a normal markup on materials?
- **Demand evidence** — `INFERRED — no measurement` on volume. `EVIDENCED` that the field is weak: the ranking set is small tool and SaaS sites with no major consumer brand present, because Angi and HomeAdvisor compete for homeowners, not contractors.
- **Difficulty** — **Easy. The softest cost-adjacent SERP found.**
- **Feeds** — `/trades`. ⭐ **The key insight for this section: a rate calculator is arithmetic over the *user's own* inputs — their burden, their overhead, their target margin — so it needs no proprietary market data and is therefore untouched by `GAP-031` and `GAP-032`.** It is the only cost-adjacent thing shippable now.
- **Backed by** — `regional.ts`, the overhead/profit compounding logic, and the existing `/trades/pricing-methodology` page
- **Gap risk** — CLEAR **provided the article takes rates as input and never quotes a rate as fact.** The moment it publishes a benchmark hourly rate it inherits `GAP-032` and is asserting an unsourced number.
- **Freshness** — Low. ⚠️ Do not repeat unsourced circulating claims about flat-rate profitability gains.

---

### T10 · How much should this job cost — **DEFERRED, and it should be**

- **Primary keyword** — `how much does it cost to build a deck` (also `cost to paint interior of house`, `bathroom remodel cost`)
- **Secondary / long-tail** — `cost to build a 12x16 deck` · `composite vs pressure treated deck cost` · `labor cost per square foot deck` · `cost to paint a 2000 sq ft house interior` · `small bathroom remodel cost` · `bathroom remodel cost per square foot` · `is $30,000 too much for a bathroom` · `is my contractor quote too high` · `how to tell if a contractor is overcharging`
- **Intent** — informational → commercial. Real, large, and genuinely served by the incumbents.
- **PAA / sections** — `INFERRED — no measurement` throughout.
- **Demand evidence** — `EVIDENCED` that demand exists and is contested: Angi holds the top organic slot for both deck and interior painting with annually-refreshed "[2026 Data]" title tags. Trade forums show real pricing-fairness argument, e.g. threads titled *"your number is way out of line"* and *"Beat out on quote by 'legit' contractor"* on the Mike Holt electrical forums: https://forums.mikeholt.com/threads/your-number-is-way-out-of-line.50798/latest
- **Difficulty** — **Very high, effectively closed on head terms.** Angi and HomeAdvisor have millions of real quotes. Long-tail and geo-modified variants are winnable **by a site with real data**.
- **Feeds** — `/trades`
- **Backed by** — `buildEstimate` over **placeholder data**.
- **Gap risk** — ⛔ **DEFER.** `GAP-031` and `GAP-032`. Publishing invented prices against Angi's measured prices, on a site whose entire proposition is cited determinism, is self-defeating. **The salvageable half is the compliance review of a quote** — "this California contract is missing the subcontractor disclosure and demands an illegal deposit" — which requires **no pricing data at all** and is the natural bridge from T2/T4 into the estimate tool. That is also precisely `bid-lens.com`'s wedge, so enter it deliberately.
- **Freshness** — Real 2026 cost movement exists (labour shortage, tariffs on cabinetry and fixtures) but we cannot measure it.

---

**Trades cluster count: 10.** WRITABLE now: 6 (T1, T2, T3, T6, T9, and T7/T8/T4/T5
as **explainers only**). Generator-BLOCKED: 4 states (T4, T5, T7, T8). DEFERRED
on data: 1 (T10). **Every single trades cluster carries at least one open gap** —
this is the most gap-encumbered section on the site, and the count of ten should
not be read as ten shippable articles. Three fixes change the picture
disproportionately: `GAP-054` (move the attorney-review warning out of the
rendered `text` field — live for PA today), `GAP-053` (change `>=` to `>` in
three states), and transcribing New York's § 771(1)(d) notice, which is the only
state that transcription alone unblocks.

## 8. PRIORITISATION — all 66 clusters ranked

**66 clusters:** loans 17 · paycheck 14 · aca 14 · property 11 · trades 10.

### How the score works, and what it is not

Four factors, each 1–5, summed to a maximum of 20. **None of them is a traffic
forecast and none encodes a search volume**, because no search volume was
measured. When a real keyword export lands, recompute `D` from it and leave
`I`, `A` and `F` untouched — they do not depend on volume.

| Factor | Question it answers | 5 means | 1 means |
|---|---|---|---|
| **D** — evident demand | How good is the *evidence*, not the size? | A government body or the IRS wrote the question into a standing FAQ, or a national outlet ran a correcting headline, or a forum thread with visible engagement | `INFERRED — no measurement`; reasoning from intent alone |
| **I** — intent match | Does answering it *require* our engine? | The answer is a number only a simulation or a cited rule set can produce, and the tool is the obvious next click | An explainer anyone could write; the tool adds nothing |
| **A** — achievable difficulty | Can we realistically rank, and is the field stale? | Weak or conflicted incumbents, or a demonstrably wrong authority | studentaid.gov / IRS / KFF / Angi holding it with fresh, competent content |
| **F** — rule-change freshness | Is there a dated change the incumbents have not absorbed? | A change inside the last 90 days, or a hard deadline inside 90 days | Evergreen; nothing changed |

**Gap column:** `CLEAR` · `DISC` (writable with disclosure) · `BLOCK` (cannot be
written to its promise today) · `PRE` (an engine correctness question must be
resolved *before* writing, not merely disclosed).

### The first 25 to write

Ordered by score, then by deadline urgency. Every one of these is writable today
with the disclosures noted in its cluster entry.

| # | Cluster | Tool | D | I | A | F | **Σ** | Gap | One-line reason |
|---:|---|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 1 | **L5** SAVE forbearance ending | loans | 5 | 5 | 3 | 5 | **18** | CLEAR | A forced decision for millions with a hard 30 Sep 2026 deadline five weeks out, and we answer it with a ranked nine-plan result instead of news. |
| 2 | **P2** Box 12 code TT / FS-2026-13 | paycheck | 5 | 4 | 5 | 5 | **19** | DISC | Guidance 20 days old that *reverses* the prevailing advice, and not one ranking page cites it. |
| 3 | **P1** The half-time premium trap | paycheck | 5 | 5 | 4 | 5 | **19** | DISC | A national outlet ran a headline saying workers overestimate this "by double"; the engine computes the real figure exactly. |
| 4 | **A1** The uncapped clawback | aca | 5 | 5 | 4 | 5 | **19** | DISC | The IRS's own page (reviewed 9 Aug 2026) still describes repealed caps — top authority, materially wrong, highest stakes. |
| 5 | **A14** 2027 open enrolment dates | aca | 4 | 2 | 5 | 5 | **16** | CLEAR | Top results contradict each other on the end date; the primary source resolves it, and the season closes 15 Dec 2026. |
| 6 | **L2** RAP vs IBR crossover | loans | 5 | 5 | 3 | 5 | **18** | DISC | The specialist tier asserts a crossover "around $90,000"; we compute the exact one from the reader's own balance. |
| 7 | **L17** Consolidation inverted on 1 Jul | loans | 4 | 5 | 4 | 5 | **18** | DISC | The still-ranking "consolidate before June 2026" pages now give advice that actively harms the reader. |
| 8 | **P3** Is my occupation on the tip list | paycheck | 5 | 5 | 4 | 4 | **18** | CLEAR | Pure lookup intent, 71 occupations already in the engine, `/paycheck/occupations` already routed, and the incumbents wrote for employers. |
| 9 | **L8** Parent PLUS after 30 Jun 2026 | loans | 5 | 4 | 4 | 5 | **18** | DISC | The whole ranking corpus tells parents to do something they can no longer do; we model the consolidation taint. |
| 10 | **A5** The levers | aca | 4 | 5 | 4 | 4 | **17** | DISC | Six ranked levers with `amountToClearCliff`, including the SEHI circularity nobody models — but close `GAP-050` first. |
| 11 | **L9** PAYE and ICR sunset 2028 | loans | 5 | 5 | 3 | 4 | **17** | DISC | Every competitor calculator silently projects PAYE past 2028; ours models the forced migration, which is checkable. |
| 12 | **A4** Estimating variable income | aca | 5 | 4 | 4 | 4 | **17** | DISC | CMS built a navigator module for this exact problem, and the old "estimate a bit low" advice became dangerous on 1 Jan 2026. |
| 13 | **L15** The RAP bracket cliff | loans | 4 | 5 | 5 | 4 | **18** | PRE | "The $1 raise that costs you $80 a month" is unique computed output — but confirm the engine's bracket model first. |
| 14 | **P8** How much will I actually save | paycheck | 5 | 5 | 4 | 3 | **17** | DISC | The IRS ranking #1 for a *calculator* query is unsatisfied intent, and no major brand has shipped one. |
| 15 | **P6** California daily overtime is $0 | paycheck | 3 | 5 | 5 | 5 | **18** | DISC | Effectively unclaimed, enormous affected population, and the answer is an honest $0 — this site's house style. |
| 16 | **A3** Form 8962 line 5 and truncation | aca | 3 | 4 | 5 | 4 | **16** | DISC | Nobody connects the truncation rule to the cliff decision, and the 2026 instructions are not out yet. |
| 17 | **L16** The $10 minimum | loans | 5 | 4 | 4 | 4 | **17** | CLEAR | A consumer Q&A site published a six-question FAQ built on this exact misconception five days ago. |
| 18 | **R1** Is appealing worth it | property | 5 | 5 | 3 | 3 | **16** | DISC | The Cook Board of Review asks both questions verbatim on its own FAQ, and no commercial operator will ever answer "don't file". |
| 19 | **T1** Pennsylvania HICPA | trades | 4 | 5 | 4 | 2 | **15** | DISC | The only state where the product is whole — but fix `GAP-054` before claiming compliant generation. |
| 20 | **P7** Cash tips, gig work, no 1099 | paycheck | 5 | 4 | 4 | 3 | **16** | DISC | The only demand evidence on the site with visible engagement counts, and software and IRS guidance are in open conflict. |
| 21 | **R2** Do I need a lawyer | property | 5 | 4 | 5 | 2 | **16** | DISC | Every page answering "do you need a lawyer" is written by a lawyer or an appeal firm; the field is conflicted by construction. |
| 22 | **T2** California deposit cap | trades | 4 | 4 | 5 | 4 | **17** | DISC | The crispest single number in the section, LegalZoom publishes advice that breaks it — add the figure id first. |
| 23 | **A7** The 250% CSR cliff | aca | 3 | 4 | 5 | 3 | **15** | CLEAR | The least-contested cluster in the section, and two interacting cliffs is a clean publish-gate-2 pass. |
| 24 | **L12** The RAP marriage penalty | loans | 5 | 5 | 3 | 5 | **18** | CLEAR | CNBC covered it 16 days ago; it is a genuine joint optimisation and one of the few real cross-tool stories. |
| 25 | **P12** Four deductions, four phase-outs | paycheck | 3 | 5 | 4 | 3 | **15** | DISC | One MAGI, four different phase-outs, computed together — an interaction no page unifies. |

**Balance of the 25:** loans 8 · paycheck 7 · aca 6 · property 2 · trades 2.
That distribution is deliberate and it mirrors where the figures actually are.
Forcing property and trades to five each would mean writing articles the engines
cannot back.

### Next 10 (26–35), and why each is just outside

| # | Cluster | Tool | Σ | Why not top 25 |
|---:|---|---|:-:|---|
| 26 | **A13** 1095-A and Form 8962 mechanics | aca | 15 | Same staleness arbitrage as A1 but seasonal — must be live by January 2027, not August. |
| 27 | **R4** Cook 2026 reassessment | property | 15 | Strong and live, but needs a township→triad map that does not exist yet. |
| 28 | **T3** Three-day right to cancel | trades | 15 | Excellent insight and urgency, but state AG pages hold their own states; win the comparative frame only. |
| 29 | **L14** Residents and high-balance professionals | loans | 15 | Strong, but profession pages are Phase 5 and must clear all four publish gates. |
| 30 | **A8** Capital gains and the subsidy | aca | 15 | High value, smaller audience; folds naturally under A5's lever framing. |
| 31 | **L11** RAP and PSLF | loans | 14 | studentaid.gov plus a fresh specialist tier; win the inverted-criterion sub-question, not the head term. |
| 32 | **P10** Senior deduction stacking | paycheck | 14 | The most contested of the four deductions; needs the unwired threshold ids first. |
| 33 | **R3** Assessment went up, nothing changed | property | 14 | Very beatable SERP, but `GAP-011` sits directly on its central distinction. |
| 34 | **P11** Does my car qualify | paycheck | 14 | Checker SERP is wide open, but the engine cannot verify a VIN and must not imply it can. |
| 35 | **A6** Roth conversions vs subsidy | aca | 14 | Genuinely strong multi-year story; wants the lever engine hardened first. |

### Explicitly held back, with the reason

These are not low-value. They are **blocked, pre-conditioned, or governed**, and
listing them here is how they stay visible instead of being quietly re-invented.

| Cluster | Tool | Status | What unblocks it |
|---|---|---|---|
| **L4** Switching to RAP forfeits credit | loans | **PRE** — highest-value insight in the loans section, and **the engine may have it backwards.** Post-final-rule analysis describes credit carrying *into* RAP while RAP months do not count back — the opposite of the current model. | Resolve `GAP-035` against 34 C.F.R. § 685.209(k)(8) on govinfo. **This is the single most important pre-writing task in the programme**, because the invariant, the warning copy and the article all depend on the same answer. |
| **R6** Chapter 123 common level range | property | **BLOCK** — the flagship. Logic fully implemented, table deliberately empty, every Bergen verdict returns `CANNOT_DETERMINE`. | Load `2026CH123.pdf` (~70 Bergen rows). Watch the subset-font digit-decoding hazard. Unblocks five clusters. |
| **R7** Per-town equalization ratios | property | **BLOCK** + **governance** — 70 templated pages is the doorway pattern CLAUDE.md bans. | `GAP-041`, then hand-curate a handful rather than templating seventy. |
| **T4 / T5 / T7 / T8** CA, NY, TX, FL contracts | trades | **Explainer writable, generator BLOCKED.** | Transcribe the notices (`GAP-023`–`GAP-026`); CA/FL/TX additionally need typography rendering (`GAP-029`). **New York is the cheapest — transcription alone unblocks it.** |
| **T10** How much should this job cost | trades | **DEFER.** Placeholder pricing against Angi's measured pricing. | `GAP-031` + `GAP-032`, i.e. a data licence. Ship the *compliance* review of a quote instead — it needs no pricing data. |
| **P14** State conformity to OBBBA | paycheck | **BLOCK** + **governance.** No state rule set exists; 50 templated pages is the doorway pattern again. | A new dated, cited state-conformity rule set — a verification project, not an article. |
| **P4** The SSTB trap | paycheck | **BLOCK, correctly.** Notice 2025-69 suspends enforcement pending SSTB-specific final regs, so eligibility is genuinely undetermined. | Nothing yet. Open a `KNOWN-GAPS.md` row and watch. Meanwhile fold into P3. |
| **R8** NJ appeal deadline | property | **WEAK + out of season** — the engine is knowingly wrong twice (`GAP-051`, `GAP-052`). | Fix both, verify the deadline set, publish February 2027. |

### Gap exposure, counted

Counted from the per-section summaries, not estimated:

| | loans | paycheck | aca | property | trades | **Total** | Share |
|---|---:|---:|---:|---:|---:|---:|---:|
| **CLEAR** — central figure wired, no open gap | 7 | 3 | 4 | 1 | 1 | **16** | 24% |
| **DISCLOSE** — writable, the gap renders beside the number | 10 | 9 | 10 | 8 | 4 | **41** | 62% |
| **BLOCKED / DEFERRED** — cannot be written to its promise today | 0 | 2 | 0 | 2 | 5 | **9** | 14% |
| **Total clusters** | 17 | 14 | 14 | 11 | 10 | **66** | |

**PRE** is an overlay on the above, not a fourth bucket: **2 clusters** (L4, L15)
carry an engine-correctness question that must be resolved *before* writing
rather than disclosed while writing.

**50 of 66 clusters — 76% — are touched by an open item in `KNOWN-GAPS.md`.** That is
not a reason to write fewer articles; the disclosure component already exists in
`<KeyFigure>` and a disclosed uncertainty on a YMYL money page is an asset. It
*is* a reason to sequence the cheap unblocks first. Ranked by clusters freed per
unit of work:

1. **Resolve `GAP-035`** (RAP payment-credit direction) — unblocks L4, corrects a
   CLAUDE.md invariant and the warning copy. Research task.
2. **Load the NJ Chapter 123 table** (`GAP-041`) — unblocks R6 and R7 and
   strengthens R1 and R8. One PDF.
3. **Add six missing `figures.ts` ids** — senior phase-out single/joint, car-loan
   phase-out single/joint, CA down-payment cap, PA down-payment cap. Six clusters
   currently cannot state their central number. Hours of work.
4. **Fix `GAP-054` and `GAP-053`** — move the attorney-review warning out of the
   rendered `text` field (live for PA today) and change three `>=` comparators to
   `>`. Both are one-line fixes gating T1.
5. **Model `GAP-014` properly** — Cook assessment level × state equalization
   factor × composite rate, instead of one collapsed constant. Fixes the headline
   dollar figure in R1, R2 and R4 and unblocks R11.
6. **Close `GAP-050`** — the age 60–63 super catch-up, described in the audit as
   the largest missed lever in the ACA product, affecting exactly the pre-Medicare
   cohort nearest the cliff. Figure already verified; needs implementation.

---

## 9. CANNIBALISATION CHECK

`CONTENT-LOG.md` rule 1: one primary keyword per row, and no keyword twice. Two
articles chasing one intent split their own signal and neither ranks. Every pair
below was close enough to check. **In each case one wins and the other becomes a
named section inside it** — which is also how `RelatedArticles` stays coherent,
since a cluster with no siblings is an article nothing links to.

### Resolved — merge the loser in as a section

| Pair | Winner | Loser becomes | Why |
|---|---|---|---|
| **L2** RAP vs IBR ↔ **L1** Which plan is cheapest | **L2** | L1 → a hub/pillar page that links out, not a competing comparison | Both answer "which plan". L2 is the real decision for the overwhelming majority (the two IDR plans that survive 2028); L1 tries to rank nine and dilutes into an index. Keep L1 only as the section's pillar with no keyword overlap — target `all federal repayment plans 2026`, not `best repayment plan`. |
| **L2** RAP vs IBR ↔ **L3** RAP has no payment cap | **Both stand** | — | Different intents: L2 is *which do I choose*, L3 is *why can the new plan be worse than Standard*. L3 is already written and is the cluster's proof-of-thesis. Guard the boundary: L3 must not creep into general RAP-vs-IBR comparison. |
| **L6** Interest waiver and $50 match ↔ **L7** Paying extra backfires | **L7** | L6 → the mechanism section inside L7 | Same mechanism, two viewpoints. L7 carries the decision, the warning code and the CNBC hook. L6 alone is an explainer with no action. **If both are written, L6 must target `RAP interest waiver` only and never `should I pay extra`.** |
| **L9** PAYE/ICR sunset ↔ **L17** Consolidation traps | **Both stand** | — | Close but genuinely distinct: L9 is a *forced* future migration, L17 is a *voluntary* present action. Cross-link hard; do not let L17 absorb the sunset explanation. |
| **L16** $10 minimum ↔ **L15** Bracket cliff | **Both stand** | — | L16 is the *floor*, L15 is the *steps*. Same table, opposite ends. Each must reference `loans.rap.brackets` without re-explaining the other. |
| **P1** Half-time premium ↔ **P2** Box 12 code TT | **Both stand, in this order** | — | The nearest call in the document. P1 is *how the deduction is computed*; P2 is *what you are allowed to claim regardless of the computation*. They were one question in 2025 and FS-2026-13 split them into two on 6 Aug 2026. **Write P2 first**, because for TY2026 the W-2 governs — then P1 as "how to check the number your employer reported". If only one is written, write P2. |
| **P3** Occupation list ↔ **P4** SSTB trap | **P3** | P4 → an "on the list and still disqualified" section inside P3, flagged unsettled | Same intent: *am I eligible*. P4 cannot stand alone anyway — it is BLOCKED on genuine regulatory ambiguity, and a whole article whose answer is "nobody knows" is a worse experience than a caveat inside the eligibility page. |
| **P8** How much will I save ↔ **P9** Worth nothing to many | **P8** | P9 → the "and for some readers the answer is zero" section inside P8 | Both answer *what is this worth to me*. Splitting them lets P8 be the optimistic page and P9 the pessimistic one, which is exactly the split that makes a site look inconsistent. One page that answers honestly in both directions is stronger and is the house style. |
| **P12** Four phase-outs ↔ **P13** Schedule 1-A | **P13** as hub, **P12** as the computation | — | P13 is the *form*; P12 is the *interaction*. Distinct enough to coexist, but P13 must not include a phase-out table and P12 must not include a line-by-line walkthrough. Enforce that boundary in the outline, not in review. |
| **A1** Uncapped clawback ↔ **A13** Form 8962 mechanics | **A1** | A13 stands, but strictly as the *how to file* page | Same underlying event, different moment: A1 is *what will I owe* (decision, year-round), A13 is *how do I complete the form* (procedure, Feb–Apr). Real risk of collision on `repayment limitation`. **A1 owns every repayment-amount keyword; A13 owns no dollar keyword at all.** |
| **A2** The 400% cliff ↔ **A11** Premium shock | **A2** | A11 → the mid-year triage section inside A2, or a dated companion | A11's payload is a premium comparison the engine cannot honestly produce (`GAP-039`). Its non-price content — the non-payment-termination trap, special enrolment eligibility — is genuinely valuable and belongs inside A2 rather than in a page that promises prices. |
| **A2** The 400% cliff ↔ **A3** Line 5 truncation | **Both stand** | — | A2 is *where is the line and what does crossing cost*; A3 is *how is the percentage computed to the decimal*. A3 is deliberately narrow and technical. Boundary rule: A2 never explains truncation; A3 never estimates a clawback. |
| **A2** ↔ **A14** Open enrolment dates | **A2** | A14 → a dated banner section inside A2 **unless** it carries a computed element | A14 fails publish gate 1 alone — no unique engine number. Either give it a per-household "what you must do before 15 Dec" output, or fold it in. **Decide before writing, not after.** |
| **A5** Levers ↔ **A8** Capital gains ↔ **A6** Roth conversions | **A5** as hub | A8 and A6 stand as spokes | All three are "manage MAGI". A5 owns the *contribution* levers, A8 owns *realisation* timing, A6 owns *conversion* timing. The shared keyword risk is `reduce MAGI for ACA` — **A5 owns it exclusively**; A6 and A8 must target conversion- and gains-specific phrasings only. |
| **A10** What counts as income ↔ **A5** Levers | **A10** as hub | — | A10 defines MAGI; A5 changes it. A10 is explicitly not a ranking target — it is the internal-linking hub. It must not carry lever recommendations, or it will compete with A5 for the query that actually converts. |
| **R1** Is it worth appealing ↔ **R2** Do I need a lawyer | **Both stand** | — | Close, and the distinction matters: R1 is *should I do this at all*, R2 is *should I pay someone to do it*. R2 is the more defensible SERP because the field is conflicted. Boundary: R1 owns the verdict, R2 owns the fee arithmetic. |
| **R1** ↔ **R3** Assessment went up ↔ **R4** Reassessment year | **R1** | R3 and R4 stand as feeders | R3 and R4 are *why did this happen* (emotional, top of funnel); R1 is *what should I do* (decision). Distinct intents, and the funnel is the point. Neither R3 nor R4 may contain a "should I appeal" verdict — they link to R1. |
| **R6** Chapter 123 ↔ **R7** Per-town ratio | **R6** | R7 → hand-curated municipality pages *under* R6, never a template farm | Same test, different granularity. R6 explains and runs the rule; R7 supplies one town's input. Templating R7 across 70 towns is the doorway pattern. |
| **R9** NJ relief programmes ↔ **R6/R8** | **R9 stands** | — | Genuinely different remedy: relief cuts the *bill*, an appeal cuts the *assessment*, and they stack. The cannibalisation risk runs the other way — R9 must be explicit that it is **not** an appeal, or readers substitute one for the other. |
| **T2** CA deposit cap ↔ **T4** CA contract requirements | **T4** as the state hub, **T2** as the high-intent spoke | — | T2 is one crisp number with urgent intent; T4 is the full checklist. They coexist only if T4 links to T2 for the deposit question and does not restate the cap as a headline. Given T4's generator is blocked and T2's is not, **write T2 first.** |
| **T3** Three-day cancellation ↔ **T4/T5/T7/T8** state pages | **T3** owns the multi-state comparison | State pages own their own state's cancellation clause | The insight in T3 *is* the comparison — that the trigger differs by state. Each state page must describe its own rule and link to T3 rather than attempting the comparison, or five pages compete for `3 day right to cancel`. |
| **T6** Mechanics liens ↔ **T8** Florida lien notice | **T6** national, **T8** Florida-specific | — | T6 is *how a homeowner protects themselves*; T8 is *which notices Florida requires in the contract*. Boundary: T6 never enumerates a state's notices, T8 never gives general lien-protection advice. |
| **T9** Contractor rate calculator ↔ **T10** Job cost | **T9** | T10 deferred anyway | Opposite audiences — T9 serves the contractor setting a price, T10 the homeowner checking one. No real overlap, but they must not share a "pricing" hub page, because T9 ships on user inputs and T10 cannot ship at all. |

### Cross-tool collisions

Three pairs sit in different sections and could still collide:

- **L12** (RAP marriage penalty) ↔ **P12** (four phase-outs). Both involve filing
  status changing MAGI. **L12 owns filing status for loan payments; P12 owns it
  for OBBBA deductions.** Neither computes the other's half, and each must say so
  — this is the site's one genuine cross-engine story and it is spoiled if both
  pretend to answer the whole question.
- **L10** (taxable forgiveness) ↔ **A1** (clawback). Both are "a tax bill you did
  not expect". Different taxes entirely; the only shared risk is a generic
  "surprise tax bill" framing. **Neither may use that framing in a title.**
- **A5**/`SE_HEALTH_INSURANCE` ↔ **P7** (self-employed tips). Both address the
  Schedule C filer. Keep the boundary at the form: A5 is about MAGI reduction for
  a health credit; P7 is about a deduction on Schedule 1-A.

### Two clusters that fail a publish gate as written

Recorded here so they are not written and then rejected at build time:

- **A14** (open enrolment dates) — fails **gate 1**, unique computed output. Give
  it a computed element or fold it into A2.
- **R9** (NJ relief programmes) — same problem: eligibility rules, no computation.
  Either compute an eligibility verdict from a new cited rule set, or treat it as
  an internal-linking asset and accept it will not pass the gate alone.

`P14` and `R7` fail the **doorway-page test** rather than a numbered gate, and
are held back in §8 for that reason.

---

## 10. WHAT THIS DOCUMENT IS HONEST ABOUT

**Evidence quality across all 66 clusters:**

Counted mechanically from the `Demand evidence` line of all 66 clusters:

| | Clusters | Share |
|---|---:|---:|
| `EVIDENCED` — the line opens with at least one supporting source URL | 58 | 88% |
| `INFERRED — no measurement` — the line opens with no source | 8 | 12% |

The eight inferred clusters are **L3, P4, P6, P12, A3, A7, R7, T9**. Several of
those are *rule-evidenced but query-inferred* — the mechanism is cited and the
demand for the phrasing is not — and each says so in place.

**But read that 88% precisely, because it is not what a keyword tool gives you.**
The evidence is overwhelmingly of two kinds: *institutional standing FAQs* —
the Cook County Board of Review, Bergen County, the CSLB, the Pennsylvania
Attorney General, the IRS, CMS, KFF, CBPP, and a member of Congress — and
*dated corrective headlines* from national outlets. Both are strong evidence
that a question is asked repeatedly. **Neither tells you how often.** Every
ranking judgement in §8 is a judgement, not a measurement, and the `D` column
exists to be overwritten.

**Three specific weaknesses a reader should know about:**

1. **Reddit is entirely absent.** Every attempt to reach `reddit.com` during
   this research failed at the fetch layer. Given how much conversational
   long-tail demand in personal finance sits in forum threads, **the community
   layer of this research is missing**, and no thread, title or engagement count
   has been invented to cover the hole. The nearest substitutes obtained were
   Intuit community threads (with real, quoted reply and view counts — the only
   engagement figures in this document), Bogleheads and Mike Holt thread titles
   observed in results but whose bodies returned 403, and the institutional FAQ
   layer. **A Reddit pass with browser access remains outstanding.**
2. **No People Also Ask box was observed directly.** The search tooling returns
   titles and URLs, not SERP features. Where this document says a question is
   observed, it means the literal string was read on a fetched page — an agency
   FAQ heading or a published FAQ block, which publishers build *from* PAA. That
   is arguably better evidence, but it is not the same thing and is not labelled
   as if it were.
3. **Several load-bearing facts are single-source and flagged in place** — the
   Cook separate-evidence deadline, the Bergen multi-deadline claim, the NJ
   relief application deadline, and the state-exchange open-enrolment variations.
   Each carries a verify-before-publishing note in its cluster entry. None should
   reach an article without a primary source.

**What this document does not contain:** a single search volume, a single
difficulty score copied from a tool, or a single traffic projection.
