import type { Metadata } from "next";

import { faqPage, pageMetadata, renderJsonLdAll, webApplication } from "@/lib/seo";
import Link from "next/link";
import { resolveRules } from "@/engines/repayment";
import { CalculatorApp } from "@/components/loans/CalculatorApp";
import { ToolLinks } from "@/components/content";
import { ToolShell } from "@/components/tool/ToolShell";
import { AnswerBox, FactTable, LastVerified, SourceCitation } from "@/components/ui";
import { formatDate, usd } from "@/components/ui";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/loans");

/*
 * The tool, and the questions this page visibly answers.
 *
 * Both go through the builders in `src/lib/seo/schema.ts`, which validate the
 * node before it is serialised and fail the build on a missing property. The
 * FAQ entries are the page's own H2s and the first paragraph under each, so a
 * reader sees every sentence that is marked up — `scripts/seo-check.mjs`
 * re-checks that against the emitted HTML after the build.
 */
const TOOL_APP = webApplication({
  name: "Student Loan Repayment Decision Engine",
  path: "/loans",
  category: "FinanceApplication",
  description:
    "Simulates all nine federal student loan repayment plans month-by-month over 30 years and ranks them by total lifetime cost, with irreversible choices flagged.",
  features: [
    "Simulates all nine federal repayment plans month by month",
    "Ranks plans by total lifetime cost, including tax on forgiveness",
    "Flags irreversible choices before you make one",
  ],
});

const FAQ_ITEMS = [
    {
      question: "Why is the cheapest monthly payment often the most expensive plan?",
      answer: "A smaller payment stretches repayment across more years of interest. On plans with no interest waiver that unpaid interest compounds against you, so a plan that starts cheaper each month can finish tens of thousands of dollars more expensive. The engine simulates each plan month by month and ranks by total lifetime cost, including the estimated tax on any forgiven balance.",
    },
    {
      question: "Can RAP cost more than the Standard plan?",
      answer: "Yes. RAP has no cap at the 10-year Standard payment, and IBR does. At $120,000 AGI with one dependent RAP is about $950 a month whatever the balance, which on a $30,000 loan is nearly three times the Standard payment. High income with a moderate balance is the profile where an income-driven plan quietly becomes the expensive choice.",
    },
    {
      question: "Does RAP payment history transfer back to IBR?",
      answer: "No. Payments made on IBR, PAYE or ICR count toward those plans' forgiveness clocks, and switching to RAP forfeits that credit permanently. PSLF credit is tracked separately and survives the switch.",
    },
    {
      question: "What happens to PAYE and ICR after 1 July 2028?",
      answer: "They end under P.L. 119-21. If you do not choose a plan by then, 34 C.F.R. § 685.209(c)(7)(iii)(A) places you on RAP for whichever loans qualify for it, and on IBR for the loans that do not. Any projection running past that date models that move rather than projecting a plan that no longer exists.",
    },
] as const;

/**
 * The three sources this page's prose rests on, read from the rule files
 * themselves rather than transcribed.
 *
 * They were transcribed once, and the first of them rotted: the RAP citation
 * carried `federalregister.gov/documents/2026/07/01/rise-final-rule`, a
 * placeholder slug built from the rule's *effective* date. The rule published
 * on 1 May 2026, federalregister.gov bot-blocks every path, and the URL
 * resolved to nothing for a reader who clicked it. The rule file had already
 * been corrected to the GPO text; the page had not, because it held its own
 * copy. It no longer holds one.
 *
 * `lastVerified` comes across with the URL, so a citation cannot claim a
 * verification date the rule file does not have.
 */
type PageSource = { label: string; url: string; lastVerified: string };

function pageSources(rules: ReturnType<typeof resolveRules>): PageSource[] {
  const rap = rules.rap.citations[0];
  const sunset = rules.planTerms.citations.find((citation) =>
    citation.label.includes("P.L. 119-21"),
  );
  const tax = rules.tax.citations[0];

  return [rap, sunset, tax].filter((citation): citation is PageSource => Boolean(citation));
}

export default function HomePage() {
  const asOf = new Date().toISOString().slice(0, 10);
  const rules = resolveRules(asOf);
  const primaryCitation = rules.rap.citations[0];
  const SOURCES = pageSources(rules);

  const facts = [
    {
      key: "RAP payment",
      value: `${rules.rap.bracketStartPct}%–${rules.rap.bracketMaxPct}% of AGI ÷ 12`,
    },
    { key: "RAP floor", value: `${usd(rules.rap.minimumMonthlyPaymentCents)} / month` },
    {
      key: "RAP reduction per dependent",
      value: `${usd(rules.rap.dependentReductionCents)} / month`,
    },
    {
      key: "RAP principal match",
      value: `${usd(rules.rap.principalMatchCents)} / month minimum`,
    },
    {
      key: "RAP forgiveness",
      value: `${rules.rap.forgivenessAfterPayments} payments`,
    },
    {
      key: "New IBR forgiveness",
      value: `${rules.planTerms.ibrNew.forgivenessAfterPayments} payments`,
    },
    {
      key: "Old IBR forgiveness",
      value: `${rules.planTerms.ibrOld.forgivenessAfterPayments} payments`,
    },
    { key: "PSLF forgiveness", value: `${rules.planTerms.pslfPayments} payments, untaxed` },
    { key: "PAYE and ICR end", value: formatDate(rules.planTerms.paye.sunsetDate) },
    {
      key: "New loans restricted from",
      value: formatDate(rules.planTerms.post2026RestrictionDate),
    },
    {
      key: "Assumed tax on non-PSLF forgiveness",
      value: `${rules.tax.assumedMarginalRatePct}%`,
    },
  ];

  return (
    /*
     * The frame is <ToolShell>, shared with the other four tools — masthead,
     * workbench, reading band — so the loans page cannot drift away from them
     * again. The words are still this page's own; the shell adds no content.
     */
    <ToolShell
      section="loans"
      title="Which repayment plan actually costs you least?"
      standfirst="Nine federal plans, your loans, thirty years of arithmetic — ranked as you type."
      readingLabel="The workings"
      readingMeta={`rules verified ${formatDate(primaryCitation?.lastVerified ?? asOf)}`}
      reading={
        <>
          <AnswerBox>
          Under RAP a single borrower earning <span className="num">$55,000</span> pays about{" "}
          <span className="num">$229</span> a month — <span className="num">5%</span> of AGI
          divided by <span className="num">12</span>, minus <span className="num">$50</span>{" "}
          per dependent, floor <span className="num">$10</span>. RAP has no cap at the
          10-year Standard payment, so a high income on a moderate balance can make it the
          costliest of the nine.
        </AnswerBox>

        <LastVerified
          className="mt-3"
          date={primaryCitation?.lastVerified ?? asOf}
          ruleSetVersion={rules.ruleSetVersion.replace(/\+/g, " + ")}
          citation={{
            label: primaryCitation?.label ?? "34 C.F.R. § 685.209",
            url: primaryCitation?.url ?? "/loans/sources",
          }}
        />

        <div className="hairline-all mt-6 rounded-atlas">
          <FactTable
            caption="The numbers behind every plan on this page"
            captionVisible
            rows={facts}
          />
        </div>

        <article className="density-reading mt-12">
          <section>
            <h2>Why is the cheapest monthly payment often the most expensive plan?</h2>
            <p>
              A smaller payment stretches repayment across more years of interest. On plans
              with no interest waiver that unpaid interest compounds against you, so a plan
              that starts cheaper each month can finish tens of thousands of dollars more
              expensive. The engine simulates every plan month by month — payment, interest,
              waiver, principal — and ranks by total lifetime cost, including the estimated
              tax on any forgiven balance. The two rankings disagree often; the toggle above
              the results table shows both, and the Fork marks the month the cheaper payment
              becomes the costlier plan.
            </p>
          </section>

          <section>
            <h2>Can RAP cost more than the Standard plan?</h2>
            <p>
              Yes. RAP has no cap at the 10-year Standard payment, and IBR does
              <SourceCitation
                index={1}
                label={SOURCES[0]!.label}
                url={SOURCES[0]!.url}
                lastVerified={SOURCES[0]!.lastVerified}
              />
              . At <span className="num">$120,000</span> AGI with one dependent RAP is about{" "}
              <span className="num">$950</span> a month whatever the balance, which on a{" "}
              <span className="num">$30,000</span> loan is nearly three times the Standard
              payment. High income with a moderate balance is exactly the profile where an
              income-driven plan quietly becomes the expensive choice, and the engine flags
              the crossover whenever it appears in your own numbers.
            </p>
          </section>

          <section>
            <h2>Does RAP payment history transfer back to IBR?</h2>
            <p>
              No — and this is the decision to get right the first time. Payments made on IBR,
              PAYE or ICR count toward those plans&rsquo; forgiveness clocks, and switching to
              RAP forfeits that credit permanently. Enter{" "}
              <span className="num">34</span> prior qualifying payments and you will see
              IBR&rsquo;s clock shorten by <span className="num">34</span> months while
              RAP&rsquo;s does not. PSLF credit is tracked separately and survives the switch.
            </p>
          </section>

          <section>
            <h2>What happens to PAYE and ICR after 1 July 2028?</h2>
            <p>
              They end
              <SourceCitation
                index={2}
                label={SOURCES[1]!.label}
                url={SOURCES[1]!.url}
                lastVerified={SOURCES[1]!.lastVerified}
              />
              . If you do not choose a plan by then, the Department places you on RAP for
              whichever loans qualify for it and on IBR for the loans that do not. Any
              projection running past that date models that move rather than pretending the
              plan survives. If your plan dies mid-projection, the results say so and the
              warning names both the date and the plan you land on.
            </p>
          </section>

          <section>
            <h2>Is forgiven student loan debt taxable?</h2>
            <p>
              Outside PSLF, yes, under current federal law
              <SourceCitation
                index={3}
                label={SOURCES[2]!.label}
                url={SOURCES[2]!.url}
                lastVerified={SOURCES[2]!.lastVerified}
              />
              . A balance forgiven under RAP or IBR is income in the year it is discharged,
              which is the part borrowers are most often blindsided by, so it is added into
              every lifetime cost on this page rather than mentioned in a footnote. PSLF
              forgiveness is not taxed. State treatment varies and is not modelled.
            </p>
          </section>

          <section>
            <h2>Where do these numbers come from?</h2>
            <p>
              Every rate, bracket and threshold lives in a versioned rule file citing a
              primary source — the regulation, the statute, the Federal Register — with the
              date it was last verified. Read the{" "}
              <Link href="/loans/methodology" className="underline underline-offset-4">
                methodology
              </Link>
              , check the{" "}
              <Link href="/loans/sources" className="underline underline-offset-4">
                sources
              </Link>
              , or follow the{" "}
              <Link href="/loans/changelog" className="underline underline-offset-4">
                changelog
              </Link>{" "}
              for rule changes. No AI computes any number here; the simulation is
              deterministic arithmetic you can audit.
            </p>
          </section>

          <section>
            <h2>Sources</h2>
            <ol className="density-instrument list-none p-0">
              {SOURCES.map((source, index) => (
                <li key={source.url} className="hairline-b py-2">
                  <span className="num text-dim">[{index + 1}]</span>{" "}
                  <a href={source.url} className="underline underline-offset-4">
                    {source.label}
                  </a>{" "}
                  <span className="num text-dim">
                    · verified {formatDate(source.lastVerified)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          </article>

          {/* The pillar end of the internal link model: this tool's guides, the
              glossary terms it uses, and its own workings — all resolved from
              metadata, never a hand-kept list. See src/lib/seo/links.ts. */}
          <ToolLinks tool="loans" />
        </>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLdAll([TOOL_APP, faqPage(FAQ_ITEMS)]) }}
      />

      {/*
       * The hero is the instrument, and the answer is the first thing in it —
       * the reader arrived from a search result with one question, and showing
       * the answer forming beats promising it. Everything written is below.
       */}
      <CalculatorApp />
    </ToolShell>
  );
}
