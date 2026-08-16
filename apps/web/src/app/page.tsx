import type { Metadata } from "next";
import Link from "next/link";

import { AnswerBox } from "@fineprint/ui";

import { SECTIONS, SECTION_PAGES, type SectionSlug, sectionHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Five decision engines for US money rules (2026)",
  description:
    "Compare 9 federal loan repayment plans, check OBBBA deductions, measure your distance to the 400% ACA cliff, test a property assessment, price a trade job. Free, cited.",
  alternates: { canonical: "/" },
};

/**
 * The hub.
 *
 * This is a portfolio of decision engines, not a link farm. One h1, one
 * sentence saying what the site does, then one card per section that names the
 * question that tool answers and the concrete number it turns on. A visitor
 * should be able to pick their tool in a single screen without reading prose.
 *
 * Every card is derived from `SECTIONS`; the copy below is keyed by slug and
 * typed `Record<SectionSlug, …>`, so adding a sixth section is a type error
 * until it has a card here as well as an entry in the nav, footer and sitemap.
 */

type SectionCard = {
  /** ≤40 words. Concrete, with the number the decision actually turns on. */
  body: string;
  /** Button label naming the outcome, never "Learn more". */
  cta: string;
};

const CARDS: Record<SectionSlug, SectionCard> = {
  loans: {
    body: "Enter your loan mix once. All 9 plans are simulated month by month and ranked by 30-year total cost, with the one-way doors flagged: switching to RAP forfeits every qualifying payment already credited under IBR, PAYE or ICR.",
    cta: "Compare all 9 plans",
  },
  paycheck: {
    body: "Tips up to $25,000 and the overtime premium up to $12,500 single or $25,000 joint run off one MAGI, so a raise can phase out several deductions at once. See what the next $1,000 of income costs — and what your W-2 should show.",
    cta: "Check your deductions",
  },
  aca: {
    body: "At 400.00% of the federal poverty level a household gets a premium tax credit. At 400.01% it gets $0, and any advance credit taken during the year is repaid in full. Levers are ranked by dollars recovered per dollar committed.",
    cta: "Measure your cliff distance",
  },
  property: {
    body: "Comparable assessments, a median ratio and a confidence score produce one honest verdict: strong case, worth filing, or not worth the fee. If it is worth filing you get the evidence packet and your county's form — no 25–50% contingency cut.",
    cta: "Test your assessment",
  },
  trades: {
    body: "A job description becomes an itemised estimate that shows the basis for every line, then a matching invoice and a contract carrying your state's required clauses — right to cancel, down-payment caps, lien warnings. No signup, no monthly fee.",
    cta: "Price a job",
  },
};

const TRUST_POINTS: readonly { heading: string; body: string }[] = [
  {
    heading: "Every rule is cited and dated",
    body: "Rates, thresholds, brackets and deadlines live in versioned JSON with a link to the regulation and the date it was last checked against it. When a rule changes, one file changes and every page that depends on it updates.",
  },
  {
    heading: "No AI touches the arithmetic",
    body: "The five engines are plain TypeScript with zero dependencies and no network access. AI reads uploaded documents and explains results in plain language; it never computes a number you are shown, and any figure it writes is checked against the engine output before it renders.",
  },
  {
    heading: "Nothing you enter is stored",
    body: "No account, no signup wall, no database. Figures stay in your browser, and an uploaded document is read in memory and discarded — it is never written to disk.",
  },
  {
    heading: "Estimates, not promises",
    body: "Every figure is an estimate under current rules. Irreversible choices are flagged in red before you make them, and the site says plainly when a case is one to take to your servicer, your county or a licensed adviser.",
  },
];

export default function HubPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="max-w-[22ch]">Work out what the rule actually costs you</h1>

      <AnswerBox className="mt-6">
        Five decision engines for US money rules. Each takes your real numbers, runs every option
        under the rules in force today — all <span className="num">9</span> federal repayment
        plans, every OBBBA deduction, both sides of the <span className="num">400%</span> ACA
        cliff — and ranks them by what you actually pay, with irreversible choices flagged and
        every rule cited.
      </AnswerBox>

      <h2 className="mt-16">Which question are you trying to answer?</h2>

      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => {
          const card = CARDS[section.slug];
          const href = sectionHref(section);
          return (
            <li key={section.id} data-section={section.dataSection} className="min-w-0">
              {/*
                The card carries the section's own six colour tokens, so the
                grid previews the five identities before you are inside one.
              */}
              <div className="hairline-all flex h-full flex-col rounded-atlas p-6">
                <p className="micro-label">{section.name}</p>

                <h3 className="mt-2 max-w-[30ch] text-ink">
                  <Link
                    href={href}
                    className="rounded-atlas underline decoration-rule decoration-2 underline-offset-4 hover:decoration-current"
                  >
                    {section.tagline}
                  </Link>
                </h3>

                <p className="mt-3 max-w-[52ch] flex-1 text-step--1 text-dim">{card.body}</p>

                <p className="mt-4">
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center gap-2 rounded-atlas font-medium text-signal underline-offset-4 hover:underline"
                  >
                    {card.cta}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M3 8h9" />
                      <path d="M8.5 4.5 12 8l-3.5 3.5" />
                    </svg>
                  </Link>
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-16">Why trust a number from here?</h2>

      <dl className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        {TRUST_POINTS.map((point) => (
          <div key={point.heading} className="min-w-0">
            <dt className="font-semibold text-ink">{point.heading}</dt>
            <dd className="mt-1 max-w-[56ch] text-step--1 text-dim">{point.body}</dd>
          </div>
        ))}
      </dl>

      {/*
        Each tool answers to a different rule-maker, so the workings live with
        the tool rather than in one site-wide page that would belong to none of
        them. These links are computed from SECTION_PAGES, so none of them can
        point at a page that was never built.
      */}
      <h2 className="mt-16">Where are the workings?</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        Every tool carries its own methodology, its own list of primary sources and its own
        changelog, because each one answers to a different rule-maker — the Department of
        Education, the IRS, HHS, a county assessor, a state contractor board. Start with the
        methodology for the tool you are using:
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-0">
        {SECTIONS.map((section) => {
          const methodology = SECTION_PAGES[section.slug].find((page) => page.trust);
          if (!methodology) return null;
          return (
            <li key={section.id}>
              <Link
                href={`/${section.slug}${methodology.href}`}
                className="inline-flex min-h-11 items-center rounded-atlas underline underline-offset-4 hover:text-ink"
              >
                {section.name}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 max-w-[68ch] text-step--1 text-dim">
        Found a figure that is wrong?{" "}
        <Link href="/contact" className="rounded-atlas underline underline-offset-4 hover:text-ink">
          Report it and it gets fixed
        </Link>{" "}
        — checked against the primary source, then logged in that tool's changelog.
      </p>
    </div>
  );
}
