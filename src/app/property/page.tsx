import type { Metadata } from "next";
import Link from "next/link";
import { counties, filingFeeSummary } from "@/engines/property";
import { CheckTool } from "@/components/property/CheckTool";
import { FactTable } from "@/components/ui";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Is Your Home Over-Assessed? Free Property Tax Check",
  description:
    "Run your assessment against comparable homes with the same median-ratio statistics an assessor uses. Most people are told not to file — that is the point.",
  alternates: { canonical: "/property" },
};

/**
 * The hero is data, not a headline: the check is the first thing on the page,
 * because the visitor arrived from a search with a question and watching the
 * answer form is a stronger opening than promising one. The argument for the
 * product comes after it.
 */
/*
 * `WebApplication` for the tool root, matching /loans, /paycheck and /aca.
 * Only claims what is visibly on the page: what the tool does, that it is
 * free, and where it lives. No FAQPage here — the H2s on this page are
 * statements rather than questions, and marking up an FAQ that is not visibly
 * an FAQ is exactly the structured-data abuse the policy prohibits.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Property Tax Assessment Check",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  url: absoluteUrl("/property"),
  description:
    "Compares a home's assessment against comparable assessments using the median-ratio statistics assessors use, scores the confidence, and returns one verdict: strong case, worth filing, or not worth the fee.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="pt-8 pb-10">
        <h1 className="max-w-[20ch]">Is your home over-assessed?</h1>
        <p className="mt-3 max-w-[68ch]" style={{ fontSize: "var(--text-step-1)" }}>
          Change a detail and the verdict below changes with it. Most homeowners will read
          &ldquo;your assessment looks fair&rdquo; — that is the point. A tool that talks you out of
          filing is the one to believe when it tells you to file.
        </p>
        <div className="mt-8">
          <CheckTool variant="compact" />
        </div>
      </section>

      <section className="hairline-t py-10">
        <h2>How the check works</h2>
        <p className="mt-2 max-w-[68ch] text-dim">
          Four steps, all arithmetic. No model, no estimate, no AI anywhere near a number — the
          same median-ratio statistics an assessor uses, run in your browser.
        </p>
        <ol className="mt-6 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "You describe your home",
              "Living area, beds, baths, lot, year built, and the assessed value printed on your notice.",
            ],
            [
              "We pick the comparables",
              "Same kind of property, same neighbourhood, within ±20% of your size, assessed or sold inside your county's evidence window. Every rejection shows its reason.",
            ],
            [
              "Statistics, not opinion",
              "The median assessment ratio of those homes implies what yours should be assessed at. The gap between that and your notice is the case.",
            ],
            [
              "An honest verdict",
              "Strong case, worth filing, or not worth it — with the filing fee, the real deadline, and how much the evidence is actually worth.",
            ],
          ].map(([title, body], i) => (
            <li key={title} className="hairline-t pt-3">
              <p className="micro-label">
                Step <span className="num">{String(i + 1).padStart(2, "0")}</span>
              </p>
              <h3 className="mt-1">{title}</h3>
              <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                {body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="hairline-t py-10">
        <h2>County playbooks</h2>
        <p className="mt-2 max-w-[68ch] text-dim">
          Every county has its own deadline, fee, forms and evidence standard, and getting one
          wrong costs you the year. Bracketsight encodes each county&apos;s rules as versioned, cited
          data — starting with two, expanding one county at a time. A county page only publishes
          once its rules are complete.
        </p>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {counties.map((county) => (
            <div key={county.countyId}>
              <h3>
                <Link
                  href={`/property/counties/${county.state.toLowerCase()}/${county.countyId.split("-")[1]}`}
                  className="underline decoration-rule underline-offset-4 hover:decoration-current"
                >
                  {county.countyName}, {county.stateName}
                </Link>
              </h3>
              <FactTable
                className="mt-2"
                caption={`${county.countyName} appeal facts`}
                rows={[
                  {
                    key: "Deadline",
                    value:
                      county.appealWindow.deadlineKind === "FIXED_ANNUAL"
                        ? "1 April, every year"
                        : "About 30 days after your township opens",
                    mono: false,
                  },
                  {
                    key: "Filing fee",
                    value: filingFeeSummary(county),
                    mono: county.filingFee.amountCents !== 0,
                  },
                  {
                    key: "The argument",
                    value:
                      county.primaryArgument === "MARKET_VALUE"
                        ? "Market value, against comparable sales"
                        : "Uniformity, against comparable assessments",
                    mono: false,
                  },
                ]}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="hairline-t py-10">
        <div className="density-reading">
          <h2>Why this is free</h2>
          <p className="text-dim">
            Contingency services charge 25–50% of your first-year savings, and the evidence they
            file is largely the analysis on this page. The check and the comparables exhibit stay
            free. A complete, county-ready appeal packet — filled form, narrative, checklist — is
            planned as a one-time purchase for people who want the paperwork done too.
          </p>
          <p className="text-dim">
            Bracketsight is assistance with an appeal you file yourself. It is not a law firm, does
            not represent you, and does not produce an appraisal. Read the{" "}
            <Link href="/property/methodology" className="underline underline-offset-4">
              methodology
            </Link>{" "}
            before you rely on a number, and confirm your deadline with the county before you file.
          </p>
        </div>
      </section>
    </div>
  );
}
