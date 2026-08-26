import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { OccupationsExplorer } from "@/components/paycheck/OccupationsExplorer";
import { resolveRules } from "@/engines/paycheck";
import { usd } from "@/lib/paycheck/format";
import { AnswerBox, FactTable, LastVerified } from "@/components/ui";
import { rulesMeta, TAX_YEAR } from "@/lib/paycheck/rules-meta";
import { ContentsRail } from "@/components/content";
import { AdPlacement } from "@/lib/ads";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/paycheck/occupations");

const link =
  "text-ink underline decoration-rule underline-offset-4 hover:decoration-current";

interface CategorySummary {
  category: string;
  count: number;
  firstCode: string;
  lastCode: string;
}

/** Category summaries in the order the rule file lists them. Never typed by hand. */
function summarise(occupations: { code: string; category: string }[]): CategorySummary[] {
  const order: string[] = [];
  const byCategory = new Map<string, CategorySummary>();

  for (const occupation of occupations) {
    const existing = byCategory.get(occupation.category);
    if (!existing) {
      order.push(occupation.category);
      byCategory.set(occupation.category, {
        category: occupation.category,
        count: 1,
        firstCode: occupation.code,
        lastCode: occupation.code,
      });
      continue;
    }
    existing.count += 1;
    if (occupation.code < existing.firstCode) existing.firstCode = occupation.code;
    if (occupation.code > existing.lastCode) existing.lastCode = occupation.code;
  }

  return order.flatMap((category) => {
    const summary = byCategory.get(category);
    return summary ? [summary] : [];
  });
}

export default function OccupationsPage() {
  const meta = rulesMeta();
  const rules = resolveRules(TAX_YEAR);
  const occupations = rules.occupations.occupations;
  const categories = summarise(occupations);
  const keywordCount = occupations.reduce(
    (total, occupation) => total + occupation.keywords.length,
    0,
  );
  const qualifyingCount = occupations.filter((occupation) => occupation.qualified).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1>Is your job a qualified tipped occupation?</h1>
        <AnswerBox>
          The tips deduction — up to{" "}
          <span className="num">{usd(rules.tips.capCents)}</span> a year — applies only to
          occupations on the IRS qualified list: wait staff, bartenders, salon workers,
          rideshare and delivery drivers, and dozens more. Search below; each occupation
          carries the official code your tax forms reference.
        </AnswerBox>
        <LastVerified
          date={meta.lastVerified}
          ruleSetVersion={meta.shortVersion}
          citation={{ label: meta.primary.label, url: meta.primary.url }}
        />
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Pre-launch: this is a representative encoding of the Treasury occupation list, not
          yet reconciled against the final IRS publication. Codes and titles may change.
        </p>
        <p style={{ fontSize: "var(--text-step--1)" }}>
          Found your code?{" "}
          <Link href="/paycheck" className={link}>
            Run the calculator
          </Link>{" "}
          to see the deduction and the tax it saves.
        </p>
      </header>

      <ContentsRail />

      <section className="density-reading">
        <h2>The test is what the occupation received, not what you received</h2>
        <p>
          An occupation qualifies because it customarily and regularly received tips on or
          before <span className="num">31 Dec 2024</span>. That is a fact about the job, fixed
          at a date in the past, and it does not turn on your employer, your shift, your
          tenure or how much you were actually tipped last year. A newly created tipping
          arrangement in a job the list does not cover does not bring that job inside it, and a
          quiet year in a listed occupation does not push you out.
        </p>
        <p>
          Being in a listed occupation is the first of four conditions, and the other three are
          where most claims are lost. The tips have to be properly reported — through the tip
          box on a W-2, a tip report to your employer, an allocation form, or self-employment
          income on a return. A married filer has to file a joint return; married filing
          separately bars the deduction outright. And a self-employed tip earner cannot deduct
          more than net income from the business the tips came from, which is the limit that
          catches gig drivers with a thin year. Each of these gates is checked in order by the
          engine, and the{" "}
          <Link href="/paycheck/methodology" className={link}>
            methodology page
          </Link>{" "}
          states the order.
        </p>
        <p>
          One thing the list does not do is make the money tax-free. A qualified tip still pays
          Social Security and Medicare tax in full, and most states still tax it. What the list
          controls is whether the tip can be deducted against federal income tax.
        </p>
      </section>

      <section className="density-reading">
        <h2>A three-digit code, where the first digit is the category</h2>
        <p>
          Every entry carries a Treasury Tipped Occupation Code. It is three digits: the
          leading digit identifies one of{" "}
          <span className="num">{categories.length}</span> categories and the last two identify
          the occupation within it, so a code beginning with <span className="num">1</span> is
          always food and drink service and a code beginning with{" "}
          <span className="num">8</span> is always transport or delivery. The encoded list
          holds <span className="num">{occupations.length}</span> occupations, all{" "}
          <span className="num">{qualifyingCount}</span> of them qualifying — the list is a
          whitelist, so there is no &ldquo;not qualified&rdquo; row to find and an occupation
          that is absent is simply absent.
        </p>
        <FactTable
          className="mt-3"
          captionVisible
          caption="Categories, occupation counts and code ranges"
          rows={categories.map((summary) => ({
            key: summary.category,
            value: `${String(summary.count)} · codes ${summary.firstCode}–${summary.lastCode}`,
          }))}
        />
        <p className="mt-3">
          The code is not decoration. For tax year <span className="num">2026</span> the
          employer reports it on the W-2 in new box <span className="num">14b</span>, up to two
          codes, with total cash tips in box <span className="num">12</span> under code{" "}
          <span className="num">TP</span> and qualified overtime under code{" "}
          <span className="num">TT</span>. That is what lets you check a figure against your own
          paperwork instead of reconstructing it. For tax year{" "}
          <span className="num">2025</span> no such boxes existed, so a{" "}
          <span className="num">2025</span> amount reaches you as free text on the W-2 or in a
          separate employer statement, and reconstructing it from pay stubs is the normal case
          rather than the exception.
        </p>
      </section>

      <OccupationsExplorer />

      <section className="density-reading">
        <h2>A search that finds nothing is not a ruling that your job is excluded</h2>
        <p>
          The search box above is deterministic string matching, not judgement. It scores your
          query against each occupation&apos;s title and against{" "}
          <span className="num">{keywordCount}</span> hand-written keywords across the{" "}
          <span className="num">{occupations.length}</span> entries, ranks by score, and breaks
          ties by code. There is no fuzzy model behind it and nothing about it can be trained
          on what you meant. Type a job title nobody thought to add as a keyword and you get
          nothing back, whether or not the occupation is on the official list.
        </p>
        <p>
          The regulation is explicit that the job titles listed under each code are
          illustrative and not exhaustive, and that an unlisted job fitting a code&apos;s
          description falls within it. So the useful question is not whether this search
          matched your job title. It is whether your work fits the description of one of the{" "}
          <span className="num">{occupations.length}</span> codes. Three practical steps, in
          order: read the codes in the category your work belongs to rather than searching for
          your exact title; check what your employer actually reported, because a code on your
          W-2 settles the question faster than any search; and read the official IRS list
          itself, which is linked from the{" "}
          <Link href="/paycheck/sources" className={link}>
            sources page
          </Link>
          , before concluding that your occupation is absent.
        </p>
        <p>
          Where the answer genuinely is no, it is worth knowing what that costs. Tips earned in
          an occupation the list does not cover are ordinary taxable income: they are reported
          as normal, they are taxed as normal, and no part of them is deductible. The other
          three OBBBA deductions are unaffected — an unlisted occupation has no bearing on
          overtime, on the senior deduction or on car-loan interest, and a household that loses
          the tips line may still have three others in range.
        </p>
      </section>

      <section className="density-reading">
        <h2>Where these titles still differ from the official strings</h2>
        <p>
          The count and the code ranges in the table above were reconciled against the
          published list on <span className="num">15 Aug 2026</span>, and both matched. Several
          titles did not. Rows outside the entertainment block still carry this engine&apos;s
          shortened singular forms where the official list uses plurals, which is cosmetic, and
          two differences go further than that: this file reads{" "}
          <span className="num">506</span> as a pet caretaker where the official title covers
          show animals as well, and <span className="num">103</span> as a non-restaurant food
          server where the official title covers beverages too. In both cases the official
          wording is wider than what you see here, so read the official entry before ruling
          yourself out on a title.
        </p>
        <p>
          One earlier defect is worth stating plainly because it shows what this kind of error
          looks like. The entertainment block was off by one from code{" "}
          <span className="num">205</span> onward, so a W-2 carrying code{" "}
          <span className="num">205</span> would have been rendered here under the wrong
          occupation entirely — correct arithmetic performed against the wrong job. It was
          corrected and the block realigned. That is why the list is versioned and every change
          to it is dated, and why the unverified flag above stays on until the titles match the
          published strings as well as the codes do.
        </p>
      </section>

      {/* Foot only: the explorer and the whole occupation list are above, and
          nothing stands between a reader and the code they came to look up.
          See src/lib/ads/placements.ts, "index-foot". */}
      <AdPlacement id="index-foot" />
    </div>
  );
}
