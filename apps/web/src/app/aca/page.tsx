import type { Metadata } from "next";
import Link from "next/link";
import { formatUsd, fplFor, getRules, magiAtPctEdge } from "@fineprint/engine-aca";
import { Planner } from "@/components/aca/Planner";
import { AnswerBox, FactTable, LastVerified, SourceCitation } from "@fineprint/ui";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "ACA Subsidy Cliff Calculator — Distance to 400% FPL",
  description:
    "See exactly how far your household is from the 400% FPL subsidy cliff, what one more dollar of income costs, and which legal levers pull you back under. Free, no signup.",
  alternates: { canonical: "/aca" },
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Fineprint ACA subsidy cliff planner",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  // The origin is configuration, never a literal — a hardcoded production
  // hostname here would make every preview deployment claim to be production.
  url: absoluteUrl("/aca"),
  description:
    "Computes a household's position against the 400% federal poverty line subsidy cliff, the premium tax credit at stake, the advance-credit repayment risk, and every legal MAGI-reduction lever ranked by dollars of credit recovered.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/* Only questions this page visibly answers are marked up. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What happens if I go one dollar over 400% of the federal poverty line?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For 2026 the premium tax credit stops completely. There is no phase-out above 400% of the poverty line: a household at 400.00% receives a credit and a household at 400.01% receives nothing. For an older couple that single dollar can cost more than $10,000 a year.",
      },
    },
    {
      "@type": "Question",
      name: "What counts as MAGI for an ACA subsidy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Marketplace MAGI is adjusted gross income plus tax-exempt interest, excluded foreign earned income, and the non-taxable portion of Social Security benefits. Municipal bond interest and untaxed Social Security count even though neither appears in taxable income, which is how households cross the cliff by accident.",
      },
    },
    {
      "@type": "Question",
      name: "Do I have to pay back my advance premium tax credit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For 2026, yes — all of it, at any income. The statutory repayment limitation that used to cap the damage below 400% of the poverty line was repealed for tax years after 2025 (Pub. L. 119-21 §71305), so Form 8962 reclaims every excess advance dollar whether you finish at 250% or at 405%.",
      },
    },
    {
      "@type": "Question",
      name: "How can I lower my MAGI before 31 December?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional 401(k), HSA, deductible IRA and SEP-IRA contributions each reduce MAGI dollar for dollar. Self-employed people can also claim the health-insurance deduction, which is circular with the credit and has to be solved iteratively. Income timing is a professional conversation, not a computed move.",
      },
    },
  ],
};

const SOURCES = [
  {
    label: "IRC §36B — the premium tax credit, the 400% limit and the applicable percentage",
    url: "https://www.law.cornell.edu/uscode/text/26/36B",
    lastVerified: "2026-08-08",
  },
  {
    label:
      "Pub. L. 119-21 §71305 — repeal of the advance-credit repayment limitation, effective for tax years after 2025",
    url: "https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm",
    lastVerified: "2026-08-15",
  },
  {
    label: "HHS poverty guidelines — the poverty line used for 2026 coverage",
    url: "https://aspe.hhs.gov/poverty-guidelines",
    lastVerified: "2026-08-08",
  },
];

export default function HomePage() {
  const rules = getRules();
  const fpl1 = fplFor(1, "CONTIGUOUS_48", rules);
  const fpl4 = fplFor(4, "CONTIGUOUS_48", rules);
  const topBand = rules.applicablePct.bands[rules.applicablePct.bands.length - 1];
  const primary = rules.applicablePct.citations[0];

  const facts = [
    { key: "Poverty line, 1 person (48 states)", value: formatUsd(fpl1) },
    { key: "Poverty line, family of 4", value: formatUsd(fpl4) },
    { key: "The cliff, 1 person", value: `${formatUsd(magiAtPctEdge(fpl1, 400, rules))} of MAGI` },
    { key: "The cliff, family of 4", value: `${formatUsd(magiAtPctEdge(fpl4, 400, rules))} of MAGI` },
    {
      key: "Cost-sharing ledge, 1 person",
      value: `${formatUsd(magiAtPctEdge(fpl1, 250, rules))} of MAGI`,
    },
    {
      key: "Top applicable percentage",
      value: topBand ? `${(topBand.highBps / 100).toFixed(2)}% of MAGI` : "—",
    },
    { key: "Advance-credit repayment cap", value: "None at any income — full clawback" },
    { key: "Cost-sharing bands (Silver only)", value: "94% / 87% / 73% actuarial value" },
    {
      key: "Form 8962 rounding",
      value: "FPL % truncated to a whole percent — but the 400% test comes first",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/*
       * The hero is the instrument. One line of title, one line of orientation,
       * then the live MAGI builder and an answer that is already on screen —
       * because the reader arrived from a search result with one question, and
       * showing the answer forming beats promising it. Everything written is
       * below the tool.
       */}
      <h1>How close are you to the ACA subsidy cliff?</h1>
      <p className="mt-1 mb-6 text-dim" style={{ fontSize: "var(--text-step-1)" }}>
        Your income, the 400% edge, and every legal lever back under it — recomputed as you
        type.
      </p>

      <Planner />

      <div className="hairline-t mt-16 pt-10">
        <AnswerBox>
          At <span className="num">400%</span> of the federal poverty line —{" "}
          <span className="num">{formatUsd(magiAtPctEdge(fpl1, 400, rules))}</span> for one person in
          2026 — the premium tax credit stops completely. There is no phase-out: one dollar
          more costs an older enrollee over <span className="num">$10,000</span> a year, and
          any advance credit taken is repaid in full.
        </AnswerBox>

        <LastVerified
          className="mt-3"
          date={primary?.lastVerified ?? "2026-08-08"}
          ruleSetVersion={rules.ruleSetVersion}
          citation={{
            label: primary?.label ?? "IRC §36B",
            url: primary?.url ?? "/aca/sources",
          }}
        />

        <div className="hairline-all mt-6 rounded-atlas">
          <FactTable
            caption="The numbers behind every figure on this page"
            captionVisible
            rows={facts}
          />
        </div>

        <article className="density-reading mt-12">
          <section>
            <h2>What happens if I go one dollar over 400% of the poverty line?</h2>
            <p>
              The credit stops — all of it
              <SourceCitation
                index={1}
                label={SOURCES[0]!.label}
                url={SOURCES[0]!.url}
                lastVerified={SOURCES[0]!.lastVerified}
              />
              . The enhanced credits expired on 31 December 2025, and for 2026 IRC §36B is
              back to a hard limit rather than a taper. A household at{" "}
              <span className="num">400.00%</span> of the poverty line receives a credit; a
              household at <span className="num">400.01%</span> receives nothing. The Cliff
              Meter above draws that as what it is: a shelf that ends in a sheer face. The
              distance is stated in dollars of income because dollars are the unit the
              decision gets made in — an invoice, a bonus, a Roth conversion, a capital gain.
            </p>
          </section>

          <section>
            <h2>What counts as MAGI for the marketplace?</h2>
            <p>
              Adjusted gross income, plus tax-exempt interest, plus excluded foreign earned
              income, plus the non-taxable portion of Social Security benefits. Those three
              add-backs are how people cross the edge without noticing: municipal bond
              interest and untaxed Social Security both count toward the marketplace figure
              even though neither is taxed. Marketplace MAGI is also not the same MAGI that
              governs IRA deductibility, which is a second reliable source of expensive
              surprises. The builder above walks each box and shows the running total.
            </p>
          </section>

          <section>
            <h2>Do I have to pay back my advance premium tax credit?</h2>
            <p>
              For <span className="num">2026</span>, every excess dollar of it — at any income
              <SourceCitation
                index={2}
                label={SOURCES[1]!.label}
                url={SOURCES[1]!.url}
                lastVerified={SOURCES[1]!.lastVerified}
              />
              . The statutory repayment limitation that used to cap the damage for lower
              incomes was struck outright for tax years beginning after{" "}
              <span className="num">31 December 2025</span>, so a household at{" "}
              <span className="num">250%</span> of the poverty line now repays the whole
              overpayment just as a household one dollar over the edge does. Enter the advance
              credit you already receive and the planner shows the exact exposure, flagged in
              red, while there is still time to act on it.
            </p>
          </section>

          <section>
            <h2>How do I lower my MAGI before 31 December?</h2>
            <p>
              With pre-tax money, usually. Traditional 401(k), HSA, deductible IRA and SEP-IRA
              contributions each reduce MAGI dollar for dollar, and the self-employed can also
              claim the health-insurance deduction — which is circular with the credit itself
              and has to be solved by the IRS iterative method rather than in one pass. The
              ranked table above orders every lever by cents of credit recovered per dollar
              committed, using the room you actually have left this year. Income timing is
              flagged for a conversation with a professional and never auto-advised.
            </p>
          </section>

          <section>
            <h2>What about the 250% cost-sharing boundary?</h2>
            <p>
              A second, smaller ledge
              <SourceCitation
                index={3}
                label={SOURCES[2]!.label}
                url={SOURCES[2]!.url}
                lastVerified={SOURCES[2]!.lastVerified}
              />
              . Below <span className="num">250%</span> of the poverty line, a Silver plan
              carries a cost-sharing reduction worth <span className="num">94%</span>,{" "}
              <span className="num">87%</span> or <span className="num">73%</span> actuarial
              value — lower deductibles and lower out-of-pocket maximums, not a lower premium.
              Cross it and the premium credit continues while the cost-sharing help stops. It
              appears on the meter as the step in the ground under the credit curve.
            </p>
          </section>

          <section>
            <h2>Where do these numbers come from?</h2>
            <p>
              A deterministic engine with no AI anywhere in the calculation path. Money is held
              in integer cents, percentages in basis points, and every threshold, band and
              limit lives in versioned JSON with a citation and a verification date — so when
              Congress changes the rule, one file changes and every page follows. Benchmark
              Silver premiums in this build are sample data for six counties while the CMS
              county file is wired up, and the{" "}
              <Link href="/aca/sources" className="underline underline-offset-4 hover:text-ink">
                sources page
              </Link>{" "}
              lists exactly which figures are still awaiting primary-source verification. Read
              the{" "}
              <Link href="/aca/methodology" className="underline underline-offset-4 hover:text-ink">
                methodology
              </Link>{" "}
              for every formula, including the iterative self-employed health-insurance case.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
