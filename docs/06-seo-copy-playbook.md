# SEO & Copy Playbook — applies to every page of every tool

This is how every title, paragraph, and button in the portfolio is written. Claude Code: when generating any page content, follow this file exactly. It exists because "SEO-optimized" in 2026 means something specific — and it is not keyword stuffing, which now gets sites demoted or manually actioned, especially in YMYL.

## The 2026 reality this playbook is built for

AI Overviews appear on ~48% of queries and cut organic CTR by up to 61% where present. Cited brands earn ~35% more clicks than uncited ones. Zero-click is the majority of searches. Therefore every page has **three simultaneous jobs**: (1) rank in classic results, (2) be the source an AI Overview quotes, (3) convert the click it does get into a tool session. Write for all three at once.

## The page skeleton — every content page, in this exact order

```
1. <h1>            The question or comparison, in the searcher's words
2. <AnswerBox>     The direct answer in ≤60 words. See rules below.
3. <LastVerified>  "Rules verified [date] · [ruleset version] · [primary citation]"
4. <FactTable>     ONE clean table with the key numbers. Machine-parseable.
5. Body            H2s phrased as the actual follow-up questions
6. Live mini-tool  The embedded calculator relevant to this page
7. <SourceCitation> Every rule → its primary source
8. <RelatedTools>  3–6 contextual internal links, resolved programmatically
```

## The AnswerBox — the most important 60 words on the page

This is the passage an AI Overview lifts and the featured-snippet candidate. Rules:

- **Answer first, qualify second.** "Under RAP, a single borrower earning $55,000 with no dependents pays about $229/month — 5% of AGI divided by 12. Payments range from a $10 floor to 10% of AGI, minus $50 per dependent." Not: "There are many factors that determine..."
- One concrete number minimum. Numbers are what get quoted.
- Self-contained: it must make sense with zero surrounding context, because that's how it will be excerpted.
- Present tense, active voice, no brand mention (AI Overviews strip brands from lifted text anyway; the citation link is where the brand travels).
- Never hedge-stack. One qualifier maximum ("under current 2026 rules").

## Titles and meta descriptions

**Title (≤60 chars):** primary keyword front-loaded + the differentiator. The differentiator is what wins the click *against* an AI Overview sitting above you.
- ✅ `RAP vs IBR: Which Costs Less Over 30 Years? (2026)`
- ✅ `RAP Calculator — All 9 Plans Compared, Rules Cited`
- ❌ `Repayment Atlas | The Best Student Loan Calculator Online` (brand-first, superlative, no specificity)

**Meta description (140–160 chars):** lead with the thing the AI Overview *can't* do — your computed, personalized, cited answer.
- ✅ `See your exact payment under all 9 federal plans, ranked by 30-year total cost. Every rule cited to the regulation. Free, no signup.`

**H2s are real questions**, verbatim from People-Also-Ask patterns: "Does RAP payment history transfer to IBR?" not "Payment History Considerations."

## Writing rules — every paragraph

1. **One idea per paragraph, answer in the first sentence.** Passage-ranking indexes paragraphs, not pages; each paragraph should be able to rank alone.
2. **Keyword discipline:** the primary keyword appears in the H1, the AnswerBox, one H2, and naturally in body — and that's it. Synonyms and entity variants everywhere else (repayment plan / IDR / income-driven / RAP). Density-chasing is a 2015 tactic that now reads as spam to both Google and humans.
3. **Specific beats general, always.** "$229/month at $55,000 AGI" outranks and out-converts "an affordable monthly payment." Every vague sentence gets rewritten with a number or deleted.
4. **Cite in-line, not in a footer.** "Under 34 C.F.R. § 685.209, unpaid interest is waived" — the citation adjacency is an E-E-A-T signal and makes the passage quotable-with-authority.
5. **Short sentences for facts, longer for reasoning.** Fact sentences under ~20 words extract cleanly into snippets.
6. **No filler openers.** Delete "In today's world," "It's important to note," "When it comes to." First sentence = information.
7. **Plain words.** utilize→use, in order to→to, individuals→people, prior to→before. The audience is stressed people making money decisions, not other SEOs.
8. **Numbers as numerals** ($10, 30 years, 9 plans) — scannable and extractable.
9. **Never promise outcomes.** "Estimate," "under current rules," "confirm with your servicer." In YMYL, overclaiming is both a rankings risk and a legal one.
10. **Every page earns its existence.** If a page's unique value can't be stated in one sentence, it doesn't ship. (This is the human-readable version of the four publish gates in CLAUDE.md.)

## Structured data — per page type

| Page type | JSON-LD |
|---|---|
| Tool / calculator | `WebApplication` + `FAQPage` (only real FAQs shown on-page) |
| Guide / comparison | `Article` with `author` (real person) + `reviewedBy` (credentialed) + `dateModified` |
| Every page | `BreadcrumbList`, `Organization` (site-level) |
| Rule/data tables | `Dataset` where genuinely applicable |

All typed via `schema-dts`. Never mark up content that isn't visibly on the page.

## Internal linking

- Resolved programmatically (`lib/seo/internal-links.ts`) from the current page's entities — never a static "related posts" blob.
- Anchor text = the target's primary keyword or a close variant, in a natural sentence.
- Every page: ≥3 internal outlinks, ≥2 inlinks (CI-enforced, zero orphans).
- Results pages deep-link to the comparison and situation pages matching *that user's computed result* — the highest-converting internal links on the site.

## UI copy (buttons, errors, empty states)

- Buttons say what happens: "Compare all 9 plans," not "Submit." The same verb persists through the flow ("Download memo" → "Memo downloaded").
- Errors: direct, cause + fix, never apologetic. "This PDF has no readable text layer. Upload a clearer scan, or enter your loans manually →"
- Empty states are invitations with one action, not illustrations.
- The flag color's copy is always concrete: "Switching to RAP forfeits your 34 qualifying payments. This cannot be undone." Never "Warning: please review carefully."

## Freshness discipline

- `<LastVerified>` on every page, driven by ruleset version — not a fake-updated date. Google and users both detect fake freshness.
- `/changelog` entry within 48h of any rule change; the affected pages' `dateModified` and sitemap `lastModified` update automatically via ISR revalidation.
- Quarterly content audit: any page with impressions but no clicks for 60 days gets improved or removed.

## What is banned

Keyword stuffing · doorway/scenario pages at scale · auto-published AI content (drafting is fine; publishing without human review is not — scaled-content abuse draws manual actions in YMYL) · fake review counts or schema · clickbait titles the page doesn't cash · "SEO content" written for crawlers that a stressed human wouldn't thank you for. The entire strategy is: be the page that deserves the citation.
