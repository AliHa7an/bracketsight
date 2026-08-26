import type { Metadata } from "next";

import { faqPage, pageMetadata, renderJsonLdAll, webApplication } from "@/lib/seo";
import Link from "next/link";
import { Calculator } from "@/components/paycheck/Calculator";
import { ToolLinks } from "@/components/content";
import { ToolShell } from "@/components/tool/ToolShell";
import { AnswerBox, LastVerified } from "@/components/ui";
import { formatDate } from "@/lib/paycheck/format";
import { rulesMeta } from "@/lib/paycheck/rules-meta";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/paycheck");

/*
 * The tool, and the questions this page visibly answers.
 *
 * Both go through the builders in `src/lib/seo/schema.ts`, which validate the
 * node before it is serialised and fail the build on a missing property. Every
 * FAQ entry below is one of this page's own H2s and the paragraph under it, so
 * a reader sees every sentence that is marked up — `scripts/seo-check.mjs`
 * re-checks that against the emitted HTML after the build.
 */
const TOOL_APP = webApplication({
  name: "OBBBA Deduction Engine",
  path: "/paycheck",
  category: "FinanceApplication",
  description:
    "Computes all four OBBBA deductions — tips, overtime premium, senior and car-loan interest — against one household MAGI, with the shared phase-outs and the estimated federal tax saved.",
  features: [
    "Computes all four OBBBA deductions against one household MAGI",
    "Shows the interacting phase-outs and the true marginal rate",
    "States the expected W-2 entries for tips and overtime",
  ],
});

const FAQ_ITEMS = [
  {
    question: "Is overtime really tax-free now?",
    answer:
      "No, and neither are tips. The OBBBA deductions reduce federal income tax only. Every tipped and overtime dollar still pays Social Security and Medicare, and most states still tax it. What changed is that the FLSA overtime premium — the extra half in time-and-a-half — and qualified tips up to $25,000 became deductible on your 1040 even if you do not itemise.",
  },
  {
    question: "Why do all four OBBBA deductions have to be computed together?",
    answer:
      "All four phase out against the same MAGI. A raise, a spouse's new job or a run of extra shifts can shrink several at once, so near a threshold the next $1,000 of income is taxed well above your bracket. A single-deduction tool only ever sees one phase-out and cannot state that marginal rate.",
  },
  {
    question: "When do the OBBBA tips and overtime deductions expire?",
    answer:
      "They run for tax years 2025 through 2028 unless Congress extends them. If you missed the 2025 deduction because your W-2 had no box for it, you can still amend: reconstruct the overtime premium from your pay stubs as hours times regular rate times 0.5, and file Form 1040-X.",
  },
] as const;

export default function HomePage() {
  const meta = rulesMeta();

  return (
    /* One frame, shared with the other four tools. See ToolShell. */
    <ToolShell
      section="paycheck"
      title="Which OBBBA deductions does your household actually get?"
      standfirst="Four deductions, one shared MAGI, interacting phase-outs. Enter your household once and read the whole picture off one pay statement."
      meta={
        <LastVerified
          date={meta.lastVerified}
          ruleSetVersion={meta.shortVersion}
          citation={{ label: meta.primary.label, url: meta.primary.url }}
        />
      }
      readingLabel="The workings"
      readingMeta={"rules verified " + formatDate(meta.lastVerified)}
      reading={
        <div className="flex flex-col gap-8">
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

          {/* The pillar end of the internal link model: this tool's guides, the
              glossary terms it uses, and its own workings — all resolved from
              metadata, never a hand-kept list. See src/lib/seo/links.ts. */}
          <ToolLinks tool="paycheck" />
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLdAll([TOOL_APP, faqPage(FAQ_ITEMS)]) }}
      />
      {/* The hero is the instrument. The verdict band leads it. */}
      <Calculator />
    </ToolShell>
  );
}
