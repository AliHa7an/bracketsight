import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "@/components/paycheck/Calculator";
import { AnswerBox, LastVerified } from "@/components/ui";
import { rulesMeta } from "@/lib/paycheck/rules-meta";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "OBBBA Deductions Calculator — Tips, Overtime, Senior, Car",
  description:
    "All four OBBBA deductions on one household MAGI — tips, overtime premium, senior, car-loan interest — with the phase-out math and the federal tax saved.",
  alternates: { canonical: "/paycheck" },
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OBBBA Deduction Engine",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  url: absoluteUrl("/paycheck"),
  description:
    "Computes all four OBBBA deductions — tips, overtime premium, senior and car-loan interest — against one household MAGI, with the shared phase-outs and the estimated federal tax saved.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/* Only the questions this page visibly answers are marked up. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is overtime really tax-free now?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No, and neither are tips. The OBBBA deductions reduce federal income tax only. Every tipped and overtime dollar still pays Social Security and Medicare, and most states still tax it. What changed is that the FLSA overtime premium — the extra half in time-and-a-half — and qualified tips up to $25,000 became deductible on your 1040 even if you do not itemise.",
      },
    },
    {
      "@type": "Question",
      name: "Why do all four OBBBA deductions have to be computed together?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All four phase out against the same MAGI. A raise, a spouse's new job or a run of extra shifts can shrink several at once, so near a threshold the next $1,000 of income is taxed well above your bracket. A single-deduction tool only ever sees one phase-out and cannot state that marginal rate.",
      },
    },
    {
      "@type": "Question",
      name: "When do the OBBBA tips and overtime deductions expire?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "They run for tax years 2025 through 2028 unless Congress extends them. If you missed the 2025 deduction because your W-2 had no box for it, you can still amend: reconstruct the overtime premium from your pay stubs as hours times regular rate times 0.5, and file Form 1040-X.",
      },
    },
  ],
};

export default function HomePage() {
  const meta = rulesMeta();

  return (
    <div className="flex flex-col gap-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* The hero is the instrument. One line of framing, then the tool. */}
      <header className="flex flex-col gap-3">
        <h1>Which OBBBA deductions does your household actually get?</h1>
        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          Four deductions, one shared MAGI, interacting phase-outs. Enter your household once
          and read the whole picture off one pay statement.
        </p>
        <LastVerified
          date={meta.lastVerified}
          ruleSetVersion={meta.shortVersion}
          citation={{ label: meta.primary.label, url: meta.primary.url }}
        />
      </header>

      <Calculator />

      <div className="hairline-t flex flex-col gap-8 pt-10">
        <AnswerBox>
          A single server earning{" "}
          <span className="num">$30,000</span> in wages plus <span className="num">$8,000</span>{" "}
          in reported tips deducts the full <span className="num">$8,000</span> and saves about{" "}
          <span className="num">$960</span> of federal tax at the{" "}
          <span className="num">12%</span> bracket. Tips and overtime deductions shrink once
          MAGI passes <span className="num">$150,000</span> single or{" "}
          <span className="num">$300,000</span> joint.
        </AnswerBox>

        <section className="density-reading">
          <h2>Is overtime really tax-free now?</h2>
          <p>
            No — and neither are tips. The OBBBA deductions reduce <em>federal income tax</em>{" "}
            only. Every tipped and overtime dollar still pays Social Security and Medicare
            (FICA), and most states still tax it. What changed is that the FLSA overtime{" "}
            <em>premium</em> — the extra half in time-and-a-half — and qualified tips up to{" "}
            <span className="num">$25,000</span> became deductible on your 1040, even if you
            don&apos;t itemise.
          </p>

          <h2>Why do all four OBBBA deductions have to be computed together?</h2>
          <p>
            All four deductions phase out against the same MAGI. A raise, a spouse&apos;s new
            job, or a run of extra shifts can shrink several at once — so near a threshold the
            next <span className="num">$1,000</span> of income is taxed well above your
            bracket. The calculator states that marginal rate explicitly, which no
            single-deduction tool can, because it only ever sees one phase-out.
          </p>

          <h2>When do the OBBBA tips and overtime deductions expire?</h2>
          <p>
            The OBBBA deductions run tax years <span className="num">2025</span> to{" "}
            <span className="num">2028</span> unless Congress extends them. If you missed the{" "}
            <span className="num">2025</span> deduction because your W-2 had no box for it, you
            can still amend: reconstruct the overtime premium from your pay stubs (hours ×
            regular rate × 0.5) and file Form 1040-X.
          </p>

          <p>
            <Link
              href="/paycheck/methodology"
              className="text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
            >
              Every formula, stated exactly as the engine runs it →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
