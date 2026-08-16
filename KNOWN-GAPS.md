# KNOWN-GAPS — the unresolved register

**Compiled 2026-08-15.** Source of truth for every verification item that the Phase 1
primary-source pass and the Batch A remediation left open across the five engines.

## The rule this register runs under

1. **Nothing here is filled with an estimate.** No row carries a guessed value, a
   recalled figure, or a plausible-looking substitute. Where a value could not be
   sourced, the engine keeps whatever it already had and the gap is recorded — it is
   not quietly improved.
2. **A gap closes only against a primary source.** A secondary source (`texas.public.law`,
   `codes.findlaw.com`, `law.cornell.edu`, KFF) may cross-check a row; it may never
   close one. Rows resting on secondary sources are marked `[SECONDARY]`.
3. **A gap is closed by editing the code and the row together.** Deleting a row without
   a fetched URL and a `lastVerified` date is not closing it.
4. **Every gap with a code location carries a `KNOWN-GAP GAP-nnn` marker there** — a
   comment in `.ts`, a `_knownGap` sibling key in rules JSON. Grep `KNOWN-GAP` across
   `packages/engine-*` to find them all. The register and the markers must not drift.

**This is a documentation pass. No value, name, or engine behaviour was changed to
produce it.** All 399 engine tests pass unchanged (repayment 107 · paycheck 63 ·
aca 67 · property 92 · trades 70).

## Package name map

| Origin repo | Package in this monorepo |
|---|---|
| repayment-atlas | `packages/engine-repayment` |
| clearpaycheck | `packages/engine-paycheck` |
| cliffcheck | `packages/engine-aca` |
| fairparcel | `packages/engine-property` |
| jobpaper | `packages/engine-trades` |

## Count

| Group | What unblocks it | Gaps |
|---|---|---:|
| A | Blocked source access | 22 |
| B | Manual statutory transcription | 8 |
| C | Commercial data licence | 2 |
| D | Not yet published | 2 |
| E | Regulatory ambiguity | 4 |
| F | Data pipeline | 6 |
| G | Documented simplification | 3 |
| H | Verified but unbuilt (outside the A–G taxonomy) | 8 |
| | **Total** | **55** |

Reconciliation with `VERIFICATION-STATUS.md`: the master counts **36 unresolved
rows**. This register carries more because (a) it splits multi-value rows that need
separate code markers — the three congress.gov citations, the seven Cook County
constants — and (b) it also carries items the per-repo *Batch A remediation* sections
mark STILL UNRESOLVED that were never counted as verification rows (group H, and the
sample-parcel and reviewer items). Nothing here is new: every row traces to a line in
one of the six verification documents.

---

## A. Blocked source access

Needs a human, or a network path these hosts do not refuse. Blocked from the
verification environment: `ecfr.gov` and `federalregister.gov` (302 to a bot-block on
**every** path, so a response from either host proves nothing), `congress.gov` (403),
`uscode.house.gov` (connection refused), `ssa.gov` (403), `bls.gov` (403 on every
path), `statutes.capitol.texas.gov` and `capitol.texas.gov` (DNS), `flsenate.gov` and
`leg.state.fl.us` (DNS / refused), `legis.state.pa.us` and `attorneygeneral.gov`
(refused / 403), `njleg.state.nj.us` (refused), `ptab.illinois.gov`, `ilga.gov`,
`tax.illinois.gov` (DNS / timeout), `cookcountyassessoril.gov` (403).

Where an alternative primary source existed — govinfo.gov above all — the *figure* was
verified and only the *citation URL* remains open. Those rows say so.

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-001 | `citations[1]`, CRS IF13075, is cited but was never fetched. | `engine-repayment/src/rules/rap.2026-07-01.json` | `/sources` lists a citation nobody has read. Every RAP figure it would support is independently verified against the RISE final rule, so no number is affected — the citation itself is the gap. | Fetch congress.gov from a network it does not 403, or drop the citation rather than ship an unverified one. | https://www.congress.gov/crs-product/IF13075 |
| GAP-002 | `citations[2]` P.L. 119-21 unfetched, **and its short title is probably wrong** — the label says "One Big Beautiful Bill Act"; the RISE rule consistently calls P.L. 119-21 the "Working Families Tax Cuts Act". | `engine-repayment/src/rules/rap.2026-07-01.json` | A user reading /sources sees a public law under a name the governing regulation does not use. | congress.gov, or the govinfo `PLAW-119publ21` package — which must actually be fetched, not swapped in on faith. | https://www.congress.gov/bill/119th-congress/house-bill/1 |
| GAP-003 | `citations[2]` P.L. 119-21 unfetched (same URL as GAP-002). | `engine-repayment/src/rules/plan-terms.2026-07-01.json` | As GAP-002. All plan terms are independently verified against 34 C.F.R. §§ 685.208–685.209 via govinfo. | As GAP-002. | https://www.congress.gov/bill/119th-congress/house-bill/1 |
| GAP-004 | `nonPslfForgivenessTaxable: true` rests on the **2024** U.S. Code edition of 26 U.S.C. § 108(f). A 2025–26 amendment cannot be ruled out. | `engine-repayment/src/rules/tax.2026.json` | If § 108(f)(5) was extended after 2024, the engine is taxing forgiveness that is in fact excluded — which changes the ranking of every non-PSLF IDR plan. IRS Topic 431 (live) still states the 2021–2025 window, which is corroboration, not proof. | A current official U.S. Code edition. `uscode.house.gov` refused connection; govinfo carries only the 2024 edition. | https://www.govinfo.gov/content/pkg/USCODE-2024-title26/html/USCODE-2024-title26-subtitleA-chap1-subchapB-partIII-sec108.htm |
| GAP-005 | No Treasury regulation implementing IRC § 225 (overtime) was located, and **its absence is not established** — federalregister.gov could not be browsed. Operative guidance is Notice 2025-69 and FS-2026-13 only. | `engine-paycheck/src/rules/overtime.2026.json` | If a final § 225 regulation exists, it may narrow "qualified overtime" further than Notice 2025-69 does — the engine would then over-state the deduction for some workers. Contrast tips, where TD 10044 was read in full. | A browsable federalregister.gov search, or the printed Federal Register index. | https://www.irs.gov/pub/irs-drop/n-25-69.pdf |
| GAP-006 | `citations[2]` PTAB URL never resolved (DNS `ENOTFOUND` — not confirmed dead, just unreachable). | `engine-property/src/rules/counties/il-cook.json` | The third appeal level is named on the county page with a link nobody has confirmed. | Reach `ptab.illinois.gov` from a different network. | https://www.ptab.illinois.gov/ |
| GAP-007 | `filingFee.waiverConditions` claims $0 at the **Assessor's Office** as well as the Board of Review. Only the Board of Review half is verified. | `engine-property/src/rules/counties/il-cook.json` | A Cook homeowner is told the first-level appeal is free. If the Assessor charges, `verdict.ts` compares savings against a fee of $0 and can return a "worth it" verdict that is not. | Read `cookcountyassessoril.gov/appeals` (403 bot-block). | https://www.cookcountyboardofreview.com/about/frequently-asked-questions |
| GAP-008 | `appealWindow.deadlineKind: "NOTICE_RELATIVE"` / `daysAfterNotice: 30` is the wrong **model**. The real rule is a per-township close date published each session; 30 days is a stated *minimum*. | `engine-property/src/rules/counties/il-cook.json` | The countdown overshoots for any township with a shorter window — 2026 Group 1 opened 3 Aug and closed 1 Sep, a 29-day span. A user counting 30 days from notice files a day late and is dismissed. Needs a `TOWNSHIP_CALENDAR` kind plus a per-township date table; neither exists. | The Board of Review calendar (reachable) plus the Assessor's calendar (403). Both must be encoded, not one. | https://www.cookcountyboardofreview.com/board-review-official-rules |
| GAP-009 | There is a **separate evidence-submission deadline after the filing deadline**, and the engine has no concept of one. | `engine-property/src/rules/counties/il-cook.json` | A Cook user who files on time and then misses the evidence date loses, and the app never warned them. 2026 Group 1: filing closed 1 Sep, evidence due 11 Sep. | Same calendar sources as GAP-008, plus a schema field. | https://www.cookcountyboardofreview.com/sites/g/files/ywwepo261/files/document/file/2026-08/2026TOWNSHIPOPEN-CLOSE.pdf |
| GAP-010 | `evidenceStandard` asserts comparable-count and photograph rules that no reachable source states. BOR Official Rules set no quota; the FAQ calls photographs "strongly encouraged". | `engine-property/src/rules/counties/il-cook.json` | The evidence checklist shown to a Cook user is partly invented convention. It is not wrong so much as unsourced. | Assessor-side rules (403) and any BOR practice note. | https://www.cookcountyboardofreview.com/board-review-official-rules |
| GAP-011 | `primaryArgument: "UNIFORMITY"` is unconfirmed. The BOR frames its role as appeals of "over-valuation", which supports MARKET_VALUE and does not establish UNIFORMITY. | `engine-property/src/rules/counties/il-cook.json` | **Highest-stakes Cook row.** `primaryArgument` selects the entire ratio model in `ratio.ts`, so if this is wrong every Cook verdict is computed on the wrong basis — not merely presented with the wrong label. | An enumeration of permissible grounds from the Assessor (403) or a BOR rule that states them. | https://www.cookcountyboardofreview.com/board-review-official-rules |
| GAP-012 | `compsWindowMonths: 18` is an unsourced default — no published standard was found in any reachable source. | `engine-property/src/rules/counties/il-cook.json` | Comparable sales are filtered on a window nobody has authority for; a stale-but-legal comp may be excluded, or a fresh-but-inadmissible one included. | Assessor or BOR evidence rules. | — |
| GAP-013 | `assessmentLevelPctOfMarket: 10` rests only on secondary summaries. The Cook County Classification Ordinance could not be reached from any official host. `[SECONDARY]` | `engine-property/src/rules/counties/il-cook.json` | Converts market value to assessed value in every Cook computation. If 10% is wrong, every Cook dollar figure is wrong by the same proportion. | The Classification Ordinance itself (`ilga.gov`, `tax.illinois.gov`, `illinois.gov`, `cookcountyassessoril.gov` all unreachable). | — |
| GAP-014 | `estimatedTaxRateOnAssessedBps: 2000` is a self-described rough estimate that collapses three separately-published factors into one constant. | `engine-property/src/rules/counties/il-cook.json` | Multiplied directly into the user-facing "estimated annual overpayment" in `verdict.ts` — the headline dollar figure a Cook user acts on. Cook's real burden is assessment level × the Illinois state equalization factor (re-struck annually) × the composite local rate. | The IDOR equalization factor and the composite rate, then modelling the three factors explicitly. | — |
| GAP-015 | `citations[3]` for N.J.S.A. 54:3-21 is a **bare site root**, not a deep link, and the host refuses connections. It would not satisfy the citation invariant even if reachable. | `engine-property/src/rules/counties/nj-bergen.json` | The statute behind New Jersey's whole deadline rule is cited to a homepage. The deadline itself is verified from the Division of Taxation handbook, so no date is wrong — the citation is. | Reach `njleg.state.nj.us`, and deep-link the section. | https://www.njleg.state.nj.us/ |
| GAP-016 | The 7-day evidence rule is confirmed only as an obligation **on the assessor** (handbook §1103.02). The taxpayer-side rule lives in N.J.A.C. 18:12A-1.9, which was not fetched. | `engine-property/src/rules/counties/nj-bergen.json` | The app is close to telling a New Jersey homeowner that 7 days is *their* deadline, on the strength of a rule that binds the other party. | Fetch N.J.A.C. 18:12A-1.9. | https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF |
| GAP-017 | Both `citations[]` URLs point at `statutes.capitol.texas.gov`, which is DNS-unreachable. Every Texas figure below rests on `texas.public.law`. `[SECONDARY]` | `engine-trades/src/rules/states/tx.json` | No Texas rule in the engine has been read from the State of Texas. The content is corroborated; the authority is not. | Reach the Texas Legislature site from another network. | https://statutes.capitol.texas.gov/Docs/PR/htm/PR.53.htm |
| GAP-018 | Both `citations[]` URLs point at `flsenate.gov` (DNS-unreachable); `leg.state.fl.us` refuses connections. Florida rests on `codes.findlaw.com`. `[SECONDARY]` | `engine-trades/src/rules/states/fl.json` | As GAP-017, for Florida. | Reach a Florida legislature host. | https://www.flsenate.gov/Laws/Statutes/2025/713.015 |
| GAP-019 | `citations[0]` points at a PA Attorney General **consumer-information page, not the statute**, and that page returns 403. Wrong *kind* of source even if reachable. | `engine-trades/src/rules/states/pa.json` | Pennsylvania is the one state that currently generates a contract (see group B), and its authority is a consumer FAQ nobody could open. All PA content rests on `codes.findlaw.com`. `[SECONDARY]` | Reach `legis.state.pa.us` for 73 P.S. §§ 517.2, 517.7, 517.9. | https://www.attorneygeneral.gov/protect-yourself/home-improvement/ |
| GAP-020 | Clause `disclosure-no-general-license` asserts "Texas does not license general residential construction contractors statewide", cited only to "Tex. Occ. Code (trade-specific chapters)" — not a section. Nothing fetched confirms it. | `engine-trades/src/rules/states/tx.json` | An uncited **negative** assertion about licensing law is printed into a contract. If a licensing duty exists, the contract tells the customer the opposite. | Cite a specific provision or delete the clause. | — |
| GAP-021 | Clause `registration-number` asserts an **advertising** display duty. The statute cite is now correct for *contract* display (§ 517.7(a)(1)); no fetched source supports the advertising half. | `engine-trades/src/rules/states/pa.json` | Half of a rendered sentence has no authority behind it. | Locate the provision, or drop that half of the sentence. | https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-7/ |
| GAP-022 | Clause `recovery-fund-notice` — unresolved whether § 489.1425 prescribes **wording** or only **substance**, and the CILB contact details are "as established by board rule", so they cannot be templated. | `engine-trades/src/rules/states/fl.json` | If the wording is prescribed, this clause is `DRAFTED` when it should be `VERBATIM_REQUIRED_NOT_TRANSCRIBED` — i.e. Florida would be generating a non-compliant notice rather than failing closed. The address may also be stale without any statutory amendment. | The Florida statute from a state host, plus the current CILB board rule. | https://codes.findlaw.com/fl/title-xxxii-regulation-of-professions-and-occupations/fl-st-sect-489-1425/ |

---

## B. Manual statutory transcription

Nine statutory notices whose **wording is prescribed** — where a paraphrase is not a
weaker clause but a non-compliant contract, running in several of these states to lien
invalidity, unenforceability, or a homeowner's statutory cause of action. Batch A did
the right thing: it deleted every paraphrase and left the `text` field **empty** with a
`textStatus` of `VERBATIM_REQUIRED_NOT_TRANSCRIBED` (or
`SUBSTANTIALLY_SIMILAR_REQUIRED_NOT_TRANSCRIBED` for TX § 53.255, where substantial
compliance suffices). The rules loader now rejects any file where such a clause carries
text at all.

**Consequence today: `engine-trades` fails closed for CA, TX, FL and NY. Only
Pennsylvania generates a contract** — the one launch state where no provision
prescribes wording. This batch of work is what unblocks four states.

Each notice must be transcribed **character-for-character from the statute URL in its
row**. Do not reconstruct from memory: the fetch tool used in the verification pass caps
direct quotation at ~125 characters, which is precisely why none of this text exists yet.

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-023 | Four California notices untranscribed: `right-to-cancel` (§ 7159(e)(6)(B)(i), verbatim, **12-pt boldface**), `downpayment-cap` (§ 7159(d)(8), verbatim, 12-pt boldface capitalised), `mechanics-lien-warning` (§ 7159(e)(4), verbatim), `cslb-notice` (§ 7159(e)(5), verbatim, 12-pt). | `engine-trades/src/rules/states/ca.json` | No California contract can be generated at any job size. Note the senior-citizen five-day cancellation window is a **distinct, unmodelled notice** and must not be merged into the standard one, as the deleted placeholder did. | Transcribe from leginfo. Even then CA stays blocked on GAP-029 (typography). | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7159 |
| GAP-024 | Florida `lien-law-notice` (§ 713.015(1)) untranscribed — verbatim, **12-pt capitalised boldface**, on the front page or a separate page **signed and dated by the owner**. The deleted placeholder was truncated mid-notice. | `engine-trades/src/rules/states/fl.json` | No Florida contract can be generated. | Transcribe from a Florida legislature host (see GAP-018). Even then FL stays blocked on GAP-029. | https://codes.findlaw.com/fl/title-xl-real-and-personal-property/fl-st-sect-713-015/ `[SECONDARY]` |
| GAP-025 | Three Texas notices untranscribed: `right-to-cancel-solicitation` (§ 601.052, verbatim, **10-pt boldface**, near the signature space), `notice-of-cancellation-form` (§ 601.053, verbatim, 10-pt boldface, **in duplicate**, **easily detachable**), `residential-construction-disclosure-statement` (§ 53.255, substantially similar). | `engine-trades/src/rules/states/tx.json` | No Texas contract can be generated. Before Batch A this was worse than absence: the § 601.052 clause told the customer a cancellation form was attached, and the engine never produced one. | Transcribe from the Texas Legislature (see GAP-017). Even then TX stays blocked on GAP-029. | https://texas.public.law/statutes/tex._bus._and_com._code_section_601.053 `[SECONDARY]` |
| GAP-026 | New York `mechanics-lien-notice` (GBL § 771(1)(d)) untranscribed — prescribed text in "clear and conspicuous **bold face type**". It was **absent entirely** before Batch A. | `engine-trades/src/rules/states/ny.json` | No New York contract can be generated. NY is the only one of the four with no typography blocker beyond boldface, so transcription alone unblocks it. | Transcribe from nysenate.gov — which is reachable. | https://www.nysenate.gov/legislation/laws/GBS/771 |
| GAP-027 | `progress-payment-schedule.statute` cites **GBL § 771(1)(d), which is wrong** — the progress-payment schedule is § 771(1)(f) ((1)(e) is the deposit obligation, (1)(g) the time-and-materials carve-out). The cite now **collides** with the legitimately-new `mechanics-lien-notice` clause, which really does own (1)(d). | `engine-trades/src/rules/states/ny.json` | Two clauses in one file claim the same subsection, and one of them is describing an entirely different requirement. Anyone auditing the NY contract against the statute finds a contradiction. **User-added to this batch.** | Correct the cite to § 771(1)(f) while the transcriber has § 771 open. | https://www.nysenate.gov/legislation/laws/GBS/771 |
| GAP-028 | `right-to-cancel.statute` cites GBL § 771(1)(**g**); the cancellation provision is § 771(1)(**h**). The `Pers. Prop. Law § 428` cross-cite was never verified. The statutory **bona fide emergency exception** (requiring the owner's signed, handwritten waiver) is unmodelled. | `engine-trades/src/rules/states/ny.json` | The clause's *substance* is right — midnight of the third business day — so no customer is misinformed; the authority printed beside it is wrong. | Same visit to § 771 as GAP-026/027; resolve or drop the Pers. Prop. Law cross-cite. | https://www.nysenate.gov/legislation/laws/GBS/771 |
| GAP-029 | **Recording a formatting requirement is not being able to render it.** `formatting` now carries `minPointSize`, `boldface`, `capitalized`, `placement`, `ownerSignatureAndDateRequired`, `copies`, `easilyDetachable` — and nothing downstream can set a per-clause point size, produce a separate signed-and-dated notice page, or supply a detachable duplicate form. | `engine-trades/src/rules/states/{ca,fl,tx}.json` (`formatting` blocks) | **CA, FL and TX stay blocked even after their text is transcribed.** A 12-pt boldface notice rendered at body size is as non-compliant as a paraphrase. | A contract-rendering capability, not a source. Tracked here because it gates the same four states. | — |
| GAP-030 | Three drafted contract-contents clauses list **fewer required elements than their statutes enumerate**: CA `written-contract` (§ 7159(d) has 13; the clause covers ~2, and cites (c), which is the writing requirement, not the contents obligation); NY `written-contract-terms` (missing the licence number "if applicable", the contingencies statement, material make/model, and the property-and-casualty insurance disclosure added 23 Apr 2022); PA `hicpa-contract-contents` (missing transaction date, liability insurance amounts, subcontractor information, toll-free number, notice of rescission — and the clause asserts a $500 threshold that lives in § 517.2, not the § 517.7(a) it cites). | `engine-trades/src/rules/states/{ca,ny,pa}.json` | Generated contracts are **incomplete**, not misworded. No verbatim wording is prescribed for these, so they may be drafted — they simply need to enumerate what the statute enumerates. PA is the live case, since PA is the only state currently generating. | Read each statute's contents list and extend the clause. | https://www.nysenate.gov/legislation/laws/GBS/771 · https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7159 · https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-7/ `[SECONDARY]` |

---

## C. Commercial data licence

**Decision on record: pricing stays framed as an "estimate only, not a binding quote"
rather than blocking the product.** These two rows are therefore not launch blockers —
they are permanent disclosure obligations until a licence lands.

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-031 | **The entire pricing dataset is placeholder reference data.** Every assembly unit cost, labour-hour figure, waste factor, access multiplier, range spread and `taughtDefaults` value. `citations[0].url` is `https://example.invalid/pricing-methodology` — a reserved TLD that will never resolve. `staleAfterDays: 120` from `effectiveFrom: 2026-08-01` means this data is **already past its own staleness window**. | `engine-trades/src/rules/trades/{decks,interior-paint,bathroom-remodel}.json` | Every dollar figure JobPaper produces is modelled, not measured. The "estimate only, not a binding quote" framing is what makes this shippable; it must stay on every surface, and the staleness flag must be confirmed as actually firing in the UI. | A licence for RSMeans (Gordian) or the Craftsman National Construction Estimator. Both are purchases, not research tasks, and **their figures may not be redistributed as raw data** — resolve licensing *before* building an ingestion path. | https://www.rsmeans.com/ · https://www.craftsman-book.com/ |
| GAP-032 | **No BLS OEWS wage figure was captured.** `bls.gov` returned HTTP 403 on every path, to both the fetch tool and curl with a browser user-agent. `laborRateCentsPerHour` (6200 / 5500 / 6800) and `regionalMultipliersBps` are unsourced. The regional multipliers are **identical across all three trades**, which is itself a tell that they are modelled rather than measured — regional cost spread differs by trade. | `engine-trades/src/rules/trades/*.json` | The labour half of every estimate rests on placeholder rates. | OEWS from a network BLS does not block, or the BLS public API with verified series IDs — SOC **47-2031** Carpenters, **47-2141** Painters, **47-2152** Plumbers, **47-2111** Electricians, **47-2044** Tile and Stone Setters, **47-2061** Construction Laborers. OEWS is a **May-reference annual series**; record the release year with every figure. **Caveat that survives the licence: OEWS reports employee wages, not billable contractor rates.** The gap between them — payroll burden, insurance, overhead, profit — is currently folded into `taughtDefaults`. Document that multiplier explicitly when real data lands, or the labour side will be wrong by a large and consistent factor while looking rigorously sourced. Bathroom remodel has no single OEWS analogue and needs a documented weighted basket. | https://www.bls.gov/oes/ |

---

## D. Not yet published

Nothing is blocked by access or effort. The document does not exist yet.

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-033 | The **2026 Form 8962 and its instructions** are unpublished. The IRS releases a tax year's Form 8962 around January of the following year, so the 2026 edition is due ~Jan 2027. | `engine-aca/src/fpl.ts`, `engine-aca/src/rules/applicable-percentage.2026.json` (`eligibilityCeiling`) | The cliff edge — the product's central number — is derived from Worksheet 2 as printed in the **2025 and 2020** editions, which agree word-for-word across the ARPA boundary. Strong, but not the 2026 document. If Worksheet 2's step order changes, the single-filer edge (currently exactly $62,600.00) and the family-of-four edge ($128,600.00) move. | Re-fetch after Jan 2027 and re-confirm Worksheet 2 and Line 6, plus the 2026 Table 2 applicable figures against Rev. Proc. 2025-25. | https://www.irs.gov/pub/irs-pdf/i8962.pdf |
| GAP-034 | The **ICR income-percentage factor is hardcoded to 1.0**. 34 C.F.R. § 685.209(f)(4)(i)(A) multiplies the 12-year amortisation by "a percentage based on the borrower's income as established by the Secretary in a Federal Register notice **published annually**". The 2026 notice was not located — it is a separate FR document from the RISE rule. | `engine-repayment/src/plans/icr.ts` (the `alternative` term), `engine-repayment/src/rules/plan-terms.2026-07-01.json` | ICR's alternative amortisation is understated for higher incomes, so ICR ranks better than it should for exactly the borrowers for whom the factor exceeds 1.0. This is the **one figure in `plan-terms` needing a yearly re-check**. | ED's annual income-contingent repayment notice. Search govinfo's Federal Register collection each year — `federalregister.gov` bot-blocks. | https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm (the RISE rule; the factor notice is a separate document) |

---

## E. Regulatory ambiguity

Genuinely unsettled, not merely unverified. Each of these has been looked for and the
law does not resolve it. **Current behaviour is deliberate and stays as-is.**

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-035 | **34 C.F.R. § 685.209(k)(8)(i)(C)(5) — voluntary RAP election and `priorQualifyingPayments`.** The paragraph credits pre-1 Jul 2028 income-contingent payments toward RAP's 360 where each met the required amount. The engine applies that to payments it *simulates* before the sunset (which satisfy the condition by construction — `SIMULATED_PAYMENTS_MEET_REQUIRED_AMOUNT`), but **not** to `Strategy.priorQualifyingPayments`, whose per-month amounts it cannot know. Whether a **voluntary** election should carry the same credit as the forced migration is not settled by the retrieved text either way. | `engine-repayment/src/plans/sunset.ts` (`idrCreditCarries`), `engine-repayment/src/plans/rap.ts`, `engine-repayment/src/plans/shared.ts`, `engine-repayment/src/types.ts` (`Strategy.priorQualifyingPayments`) | **Behaviour stays as-is: prior IDR payments are forfeited on a voluntary switch to RAP**, per the existing CLAUDE.md one-way-door invariant, and the engine warns hard about it. If the regulation in fact carries credit, the engine over-states the cost of switching to RAP for anyone with a long IDR history — a conservative error, but an error. **This is regulatory ambiguity, not a bug.** | A second source on § 685.209(k)(8)(i)(C)(5) — ED guidance, the RISE preamble discussion, or servicer implementation guidance. The user is confirming this separately. | https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm |
| GAP-036 | **No source states a sub-dollar rounding convention** for the four OBBBA deductions. Schedule 1-A prescribes the $1,000-*step* rounding (verified, and now correct in both directions) and the 6% senior multiplication, but says nothing about cents. The Form 1040 instructions offer optional whole-dollar rounding generally, without saying whether Schedule 1-A entries are expected rounded, or at which line. | `engine-paycheck/src/money.ts` (`roundHalfUpToCent`), `engine-paycheck/src/phase-out.ts` | Can move a result by about a dollar. The engine computes in integer cents and rounds half-up, which is a defensible convention — it is simply not one the IRS has stated. | Read the "Rounding off to whole dollars" passage in the Form 1040 instructions and the Schedule 1-A line-by-line instructions for any explicit statement, and confirm against a worked IRS example. | https://www.irs.gov/pub/irs-pdf/i1040gi.pdf |
| GAP-037 | The "up to five comparable sales" limit has **no legal basis** — no count appears in the NJ Assessors Handbook or on the county site. The figure appears to derive from the row count on the A-1 Comp. Sale form, which is not a limit. | `engine-property/src/rules/counties/nj-bergen.json` (`evidenceStandard`) | Batch A **removed** the claim from the user-facing prose rather than leaving it asserted, so nobody is currently told a false limit. The gap is that the engine has no principled comparable count for New Jersey. | N.J.A.C. 18:12A, or confirmation that no limit exists — in which case this closes as "no rule". | https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF |
| GAP-038 | `compsWindowMonths: 24` — no sale-recency window was found in any fetched New Jersey source. Unsourced default. | `engine-property/src/rules/counties/nj-bergen.json` | Comparable sales are filtered on a window with no authority. The October 1 pre-tax-year **valuation date** is verified and is the rule that actually governs; the recency window is a modelling choice sitting beside it. | N.J.A.C. 18:12A-1.9, or confirmation that recency is a matter of weight rather than admissibility. | — |

---

## F. Data pipeline

Real data exists and is reachable. It has not been ingested. Each of these is an
ingest job, not a research question.

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-039 | **The six county benchmark premiums are invented.** `travis-tx`, `los-angeles-ca`, `cook-il`, `maricopa-az`, `miami-dade-fl`, `denver-co` carry plausible-magnitude `age21BaseMonthlyCents` values that were made up so the engine and UI could be built. There is nothing to verify — they must be *replaced*. | `engine-aca/src/rules/slcsp-sample.2026.json` (`counties[]`) | Every premium, credit and cliff dollar figure derived from these counties is fabricated. The file's `SAMPLE_DATA` status and the UI's sample-data labelling are the only things between a user and a fabricated number — both must stay until this closes. | The CMS Marketplace PUFs for PY2026 (confirmed live, HTTP 200 `application/zip`): rate-puf, plan-attributes-puf, service-area-puf. Join Rate × Plan Attributes × Service Area for the Silver plans actually available per county, sort, take the second lowest. **Four traps:** (1) the PUFs cover only HealthCare.gov states — the ~20 State-Based Marketplaces, including **California, which is in this sample list**, publish separately or not at all, so one national ingest fails for roughly a third of the population; (2) do **not** keep the `age21Base × ageFactor` model — the Rate PUF gives the premium at each age directly, which also closes GAP-040; (3) SLCSP is a per-county ranking that flips when one issuer exits, so re-ingest annually, never patch; (4) a rating area can span multiple counties — join on rating area then map to counties, never the reverse. | https://download.cms.gov/marketplace-puf/2026/rate-puf.zip · https://www.cms.gov/marketplace/resources/data/public-use-files |
| GAP-040 | **Current state-specific age rating curves are unavailable.** The 65 encoded factors are the federal default curve and are verified exactly (0/65 mismatches against CCIIO Appendix I). But 45 C.F.R. § 147.102(e) makes that curve a **default**, applying only where a state has not set its own — and CMS's "State Specific Rating Variations" table is stamped **Updated December 10, 2021**, with no newer version. That table shows **New York and Vermont at a 1:1 individual-market age ratio**, i.e. premiums there do not vary by age at all. | `engine-aca/src/rules/slcsp-sample.2026.json` (`ageFactorsPermille`) | Applying this curve to a New York or Vermont enrollee would be materially wrong. **Latent today** — the sample list contains no NY or VT county — and **live the moment real data lands.** Also note the key `"64"` means "64 and older": any path that can receive age 65+ must clamp to 64, not fall through. | Per-state DOI filings, or the state-specific rate tables inside the CMS Rate PUF. GAP-039 trap (2) makes this moot: store per-age premiums and the curve disappears. | https://www.cms.gov/cciio/programs-and-initiatives/health-insurance-market-reforms/state-rating |
| GAP-041 | **`commonLevelRange.municipalities` is deliberately empty.** Chapter 123 is fully implemented in `common-level-range.ts` — the ±15% multiplicative corridor, clauses (1)–(4), the statutory relief basis, and the symmetric increase below the lower limit — but **no municipal Director's Ratio has been read from a primary source, and none is invented.** | `engine-property/src/rules/counties/nj-bergen.json` (`commonLevelRange.municipalities`), `engine-property/src/common-level-range.ts` | **The engine cannot determine a New Jersey verdict without a Director's Ratio, and says so.** Every Bergen result returns `CANNOT_DETERMINE` naming the missing input, with the methodology page explaining the rule — rather than falling back to the generic 5%/10% threshold, which would tell a homeowner inside the corridor they have a `STRONG_CASE` on an appeal the board is required by statute to deny, and warn a homeowner below the corridor of "review risk" when a statutory **increase** is the outcome. This is the register's model row: an empty table producing an honest refusal. | Fetch the Division of Taxation Chapter 123 table (confirm the live `nj.gov` path first), encode Bergen's ~70 municipalities with `averageRatioBps`, `taxYear`, `effectiveFrom`/`effectiveTo` and a citation each — the loader rejects any entry without one — and add a municipality selector so `Property.municipalityId` is populated. **Republished every 1 April; re-pull annually.** | https://www.state.nj.us/treasury/taxation/lpt/chapter123.shtml |
| GAP-042 | `assessmentLevelPctOfMarket: 100` is unresolved and wrong as a modelling assumption — every municipality has its own Director's Ratio; 100% holds only in a district exactly at the county percentage level, and Bergen contains ~70 municipalities. | `engine-property/src/rules/counties/nj-bergen.json` | **No longer load-bearing** — the verdict path reads `commonLevelRange` instead, so this constant is informational only. It becomes dangerous again if any future code path reads it. | Superseded by GAP-041. Delete or relabel once the ratio table lands. | https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF |
| GAP-043 | `estimatedTaxRateOnAssessedBps: 230` is a self-described county-average estimate. New Jersey general tax rates are struck **per municipality, per year**. | `engine-property/src/rules/counties/nj-bergen.json` | Feeds the user-facing "estimated annual overpayment" in `verdict.ts` — currently unreachable in Bergen because of GAP-041, and live the moment the ratio table lands. | The per-municipality general tax rate table, encoded alongside the Director's Ratios. | — |
| GAP-044 | `sample-parcels.json` is synthetic and remains so. No parcel was given a `municipalityId`, because attaching a real New Jersey municipality to a fictional parcel would imply a real place. | `engine-property/src/data/` | Demo and test parcels are not real properties. The labelling in the file, the engine exports and the UI is required and present — it must stay. | Nothing; this is correct by design. Recorded so the labelling is never quietly dropped. | — |

---

## G. Documented simplification

Unverifiable **in principle** rather than merely unverified. No source will ever close
these; the obligation is disclosure, not research.

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-045 | `graduated.stepMonths: 24` has **no regulatory basis at all**. 34 C.F.R. § 685.208(b)(6)(i) says only "payments at two or more levels" and prescribes no step interval. 24 months is a servicer convention. | `engine-repayment/src/rules/plan-terms.2026-07-01.json` (`graduated.stepMonths`) | Graduated repayment's month-by-month schedule is a plausible convention, not the rule. The 10-year term and the "no payment more than three times any other" ratio **are** verified, so the envelope is right even where the steps inside it are a choice. | Nothing — no primary source specifies it. This closes only by being labelled a simplification, which it is. | https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm |
| GAP-046 | `assumedMarginalRatePct: 22` is **not a regulatory figure and cannot be verified as one.** It is a flat modelling estimate; the correct rate is borrower-specific and depends on the forgiven amount stacking on top of other income. | `engine-repayment/src/rules/tax.2026.json` | Drives the tax hit on non-PSLF forgiveness, which is part of total lifetime cost and therefore of the ranking. 22% is a real federal bracket rate, but no single rate is right for every borrower. **The UI must label it an assumption** (CLAUDE.md already requires this) and should let the user override it. | Not a source — a product decision: cite the Revenue Procedure setting the tax-year brackets, state the filing status and income assumed, and expose an override. | https://www.irs.gov/taxtopics/tc431 |
| GAP-047 | The MAGI model is an **income proxy with no subtraction term**: wages + other income + tips + gross overtime. Statutory MAGI is **AGI** + §§ 911/931/933 exclusions, and AGI is gross income *less* above-the-line adjustments (HSA contributions, deductible SE tax, self-employed health insurance, traditional IRA and SEP/SIMPLE contributions, student-loan interest, educator expenses…). | `engine-paycheck/src/magi.ts` (`computeMagiCents`) | **Overstates MAGI** for anyone with above-the-line adjustments, which can understate their deduction near a phase-out edge. Documented in the module docstring and on /methodology as a v1 approximation. Note what is *not* wrong: the deductions genuinely do not reduce MAGI for their own or each other's phase-outs — Schedule 1-A computes MAGI once at line 3 and Parts II–V all read it. | A scope decision, not a source: either collect above-the-line adjustments as input, or keep the approximation and keep disclosing it. | https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf |

---

## H. Verified but unbuilt — outside the A–G taxonomy

**This group is an addition to the requested A–G grouping**, recorded because the
per-repo Batch A remediation sections mark these rows STILL UNRESOLVED and burying them
would defeat the register's purpose. They do not fit A–G because **no source blocks
them**: the rule is verified, cited, and simply not implemented. What unblocks each is
engineering, sometimes plus a new input field.

| id | Gap | Package / file | User-visible impact | What unblocks it | Source |
|---|---|---|---|---|---|
| GAP-048 | PAYE's new-borrower test is **two limbs and only one is modelled**. § 685.209(b)(13)(i): (A) no outstanding Direct/FFEL balance as of **1 Oct 2007** (or none on the date a new loan is taken after that date), **and** (B) a disbursement on/after **1 Oct 2011**, with a consolidation carve-out. `newBorrowerProxyDate` tests only limb (B). | `engine-repayment/src/rules/plan-terms.2026-07-01.json` (`paye.newBorrowerProxyDate`) | **Over-admits** borrowers who held a balance on 1 Oct 2007 — they are shown PAYE as an option they cannot actually elect. The requirement is specified exactly, not speculative; it needs a new input. | An extra input field capturing the 1 Oct 2007 balance condition, plus the eligibility check. | https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm |
| GAP-049 | IBR's new-borrower test likewise has an unmodelled second limb. § 685.209(b)(13)(ii): no outstanding Direct/FFEL balance before **1 Jul 2014** **and** no new loan obtained on/after **1 Jul 2026** — a 2014–2026 borrower who takes a post-2026 loan **loses** new-borrower status. | `engine-repayment/src/rules/plan-terms.2026-07-01.json` (`ibrNew.firstLoanOnOrAfter`) | A borrower with a post-2026 loan is ranked on New IBR's 10% / 240-payment terms when Old IBR's 15% / 300 apply. That is a large lifetime-cost error in the wrong direction (too optimistic). | An extra input, plus the eligibility check. | https://www.govinfo.gov/content/pkg/FR-2026-05-01/html/2026-08556.htm |
| GAP-050 | The **SECURE 2.0 age 60–63 "super catch-up" is not modelled.** IRC § 414(v)(2)(E)(i) is **$11,250 for 2026**, confirmed in Notice 2025-67, and applies *instead of* — not in addition to — the $8,000 age-50 catch-up. | `engine-aca/src/rules/contribution-limits.2026.json` | **$3,250 of MAGI reduction unavailable** to 60–63-year-olds, who are the likeliest pre-Medicare marketplace enrollees near the cliff. Described in the source audit as the single largest missed lever in the product. Also unmodelled from the same source: the 2026 HDHP definition ($1,700 / $3,400 minimum deductible; $8,500 / $17,000 out-of-pocket maximum), which is a genuine eligibility gate on the HSA lever the engine does not check. | A new field and a levers change. The figure is verified and needs no further research. | https://www.irs.gov/pub/irs-drop/n-25-67.pdf |
| GAP-051 | **Weekend / holiday rollover is not modelled.** NJ Assessors Handbook §1105.01: if the last day for filing falls on a Saturday, Sunday or legal holiday, the deadline is the first business day thereafter. | `engine-property/src/deadline.ts`, `engine-property/src/rules/counties/nj-bergen.json` | The countdown can show a deadline a day or more earlier than the law allows, pushing a homeowner to rush or to conclude they have missed it. Errs safe, but is wrong. | Implement the rollover in `deadline.ts` and encode the holiday calendar. Rule is verified. | https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF |
| GAP-052 | **The 45-day bulk-mailing extension cannot be computed.** N.J.S.A. 54:3-21: the deadline is April 1 **or 45 days from the mailing of the Notification of Assessment, whichever is later**, extended whenever a municipality has not completed bulk mailing at least 45 days before April 1, per the certification filed with the county board. The engine has no bulk-mailing date input. | `engine-property/src/rules/counties/nj-bergen.json` (`appealWindow`), `engine-property/src/deadline.ts` | A homeowner in a late-mailing municipality is shown 1 April when they in fact have longer — the app understates their remaining time. The April 1 date, the "whichever is later" condition and the May 1 revaluation deadline are all verified. | A bulk-mailing date input, or a per-municipality certification feed. | https://www.nj.gov/treasury/taxation/lpt/lpt-appeal.shtml |
| GAP-053 | **Threshold comparators are off by one in three states.** CA GBL-equivalent § 7159 ("exceeds $500"), NY GBL § 770 ("exceeds five hundred dollars") and FL § 713.015 ("over $2,500") all use strict inequality; the clause triggers use `total >= threshold`. Florida is additionally **inconsistent with itself** — `lien-law-notice` uses `>=` while `recovery-fund-notice` uses `>` for the same $2,500. | `engine-trades/src/rules/states/{ca,ny,fl}.json` (clause `trigger` fields) | A contract at **exactly** the threshold fires a clause the statute does not require. Over-inclusion rather than omission, so it is the safe direction — but it is wrong, and the FL self-inconsistency means the same contract gets one notice and not the other at the same price. | Change `>=` to `>`. Fully verified; no source needed. | https://www.nysenate.gov/legislation/laws/GBS/770 |
| GAP-054 | The string `"UNVERIFIED — ATTORNEY REVIEW REQUIRED"` still sits **inside the `text` field of every DRAFTED clause** — the field that gets rendered into a contract. Batch A removed it from the nine prescribed-text clauses only by deleting their text entirely. | `engine-trades/src/rules/states/*.json` (DRAFTED clauses) | If a drafted clause ever reaches a generated document, the warning is printed in the contract. It is not a safe place to carry the warning. Currently latent for CA/TX/FL/NY (they fail closed) and **live for Pennsylvania**, the one state that generates. | Move the warning out of `text` into a sibling field, and confirm it can never reach a generated document. | — |
| GAP-055 | **No credentialed reviewer is secured** for either legal-domain engine: a property-tax consultant or attorney for `engine-property`, a construction attorney for `engine-trades`. Portfolio invariant 8 is unsatisfied in both. | *(no code location)* | The verification pass checked whether encoded values match their cited sources. That is a much narrower question than whether the output is legally sufficient, and nothing in these documents substitutes for the review. | Engaging two named professionals. | — |

---

## Re-verification cadence

Gaps close; sources also drift. In publication order:

| When | What | Where |
|---|---|---|
| Every 1 April | NJ Chapter 123 Director's Ratios (GAP-041) — republished annually, per municipality | nj.gov Division of Taxation |
| Mid-January | HHS poverty guidelines for year *N* → drive ACA coverage year *N+1* | aspe.hhs.gov, then the FR notice on govinfo for the citable version |
| ~January | The prior tax year's Form 8962 and instructions (GAP-033) | irs.gov |
| ~May | HSA limits for year *N+1* | irs.gov/pub/irs-drop/ |
| ~Spring | BLS OEWS (GAP-032), a May-reference annual series | bls.gov/oes/ |
| ~Jul–Aug | § 36B applicable-percentage table and required contribution percentage | irs.gov/pub/irs-drop/ |
| ~October | Retirement / IRA COLAs for year *N+1* | irs.gov/pub/irs-drop/ |
| ~Oct–Nov | SSA contribution and benefit base — via the govinfo search API, **not** ssa.gov (403) | govinfo |
| ~Oct–Nov | CMS Marketplace PUFs for plan year *N+1* (GAP-039) | download.cms.gov/marketplace-puf/{year}/ |
| Annually, and after any session passing a consumer-protection or lien bill | All five JobPaper state statutes | state legislature sites |
| Every session | Cook County township calendars (GAP-008, GAP-009) — republished each session | cookcountyboardofreview.com |
| Each 1 July | RAP and the RISE rule | govinfo FR |
| Continuously | Legislation amending 26 U.S.C. § 36B, § 108, §§ 224/225, § 163(h)(4) | govinfo `PLAW-*` |

**The lesson from the pass that produced this register:** indexed values drift
predictably; statutory structure does not. The verification found a repayment cap that
Congress had **repealed** underneath a rules file nobody was watching. Watch the law,
not just the tables.

## A tool-reliability warning that justifies all of the above

While verifying the ACA applicable-percentage table, the summarising fetch layer
misreported Rev. Proc. **2025-25** as "2025-21" and returned a **completely fabricated**
percentage table. The engine's existing table was already correct; trusting that summary
would have "corrected" a right answer into garbage. Every figure in the verification
documents was read from PDF or statute text extracted directly, never from a summary.
Close gaps the same way.
