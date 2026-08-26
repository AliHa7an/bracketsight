import type { Metadata } from "next";

import { POLICY_UPDATED, pageMetadata } from "@/lib/seo";
import Link from "next/link";

import { PolicyPage, type PolicySection } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL, SECTIONS } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/terms");

/**
 * Terms and disclaimer.
 *
 * The wording is unchanged from the version this replaces — every disclosure,
 * every hedge and every named limitation is the same sentence it was. What
 * changed is the shape: a measure, a contents rail, a date, and one heading
 * level. See `@/components/layout/PolicyPage`.
 *
 * BUMP `UPDATED` IN THE SAME EDIT that changes any wording below. A dated
 * disclaimer carrying a stale date is worse than an undated one.
 */
/* The visible "Last updated" stamp AND the sitemap's <lastmod> for this
   page, from one constant. Four policy pages each held their own copy of this
   date, which is four chances for the stamp a reader sees to disagree with the
   date submitted to a crawler. See src/lib/seo/routes.ts. */
const UPDATED = POLICY_UPDATED;

export default function TermsPage() {
  const sections: readonly PolicySection[] = [
    {
      id: "how-much-to-trust",
      heading: "How much should I trust a number on this site?",
      children: (
        <p>
          Enough to ask a better question with it, not enough to act on alone. Every figure is
          computed by deterministic code from rule data that carries a citation and a verification
          date. No language model touches a calculation. But rules change, our reading of one can
          be wrong, and your own situation will contain facts the form never asked for. Confirm
          anything that matters with the body that actually decides it — your loan servicer, the
          marketplace, the county board, a licensed professional.
        </p>
      ),
    },
    {
      id: "verified",
      heading: "Are all the underlying figures verified?",
      children: (
        <p>
          No, and we publish exactly which ones are not. Each engine records what was checked
          against a primary source and what could not be. There are <strong className="num">55</strong> open items
          across the five engines today, grouped by what would unblock each; the summary is on the{" "}
          <Link href="/about">
            about page
          </Link>{" "}
          and the specifics are on each tool&rsquo;s sources and changelog pages. Where a figure
          could not be verified we say so on the page that shows it, rather than filling the gap
          with a plausible guess. In two places the tools refuse to answer at all rather than
          answer wrongly: contract generation is blocked in states whose statutory notice text has
          not been transcribed, and a New Jersey assessment verdict is withheld when the governing
          ratio is unavailable.
        </p>
      ),
    },
    {
      id: "finished",
      heading: "Is this a finished product?",
      children: (
        <p>
          Not yet, and the site says so where it matters. This is a pre-launch build: several rule
          values are placeholders awaiting verification against their primary sources, and no
          credentialed reviewer &mdash; an enrolled agent or CPA for the tax and subsidy engines, a
          construction attorney for the contract clause language, working contractors for the
          trades pricing data &mdash; has signed off on any section. Every page affected by that
          carries the warning. Treat the figures as illustrative of the method until it is lifted.
        </p>
      ),
    },
    {
      id: "advertising",
      heading: "Does advertising affect what the tools tell me?",
      children: (
        <p>
          No, and it cannot. No advertising runs on the site today. If it is enabled, the ad
          network receives nothing you type &mdash; the arithmetic happens in your browser and
          never leaves it &mdash; and there is no code path by which an advertiser could change a
          computed figure, a ranking, a clause list or a recommendation. No lender, insurer,
          employer, servicer, marketplace or county pays for placement or mention anywhere here.
          The{" "}
          <Link href="/privacy">
            privacy notice
          </Link>{" "}
          sets out the cookie and personalisation position in full.
        </p>
      ),
    },
    {
      id: "what-each-tool-says",
      heading: "What is each tool actually telling me?",
      children: (
        <>
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.slug}>
                <Link href={`/${s.slug}`}>
                  {s.name}
                </Link>{" "}
                — {s.tagline}
              </li>
            ))}
          </ul>
          <p>
            Estimates from the trades tool are estimates, never a binding quote: prices are
            reference data, not a live market feed, and a quote you send a customer is a number you
            have to honour. The documents it generates are templates, not legal advice — have an
            attorney review a contract before you sign it.
          </p>
        </>
      ),
    },
    {
      id: "responsibility",
      heading: "Who is responsible if a number is wrong?",
      children: (
        <>
          <p>
            You remain responsible for your own decisions. These tools are provided as-is, without
            warranty of any kind, and we accept no liability for loss arising from reliance on
            them. That is the honest position for a free tool computing high-stakes numbers from
            rules that change.
          </p>
          <p>
            It is also why corrections matter more to us than traffic. If you find a wrong figure,
            tell us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            and we will check it against the primary source and publish the change in that
            tool&rsquo;s changelog.
          </p>
        </>
      ),
    },
    {
      id: "commercial-use",
      heading: "Can I use these tools commercially?",
      children: (
        <p>
          Yes — quote a job, plan a filing, advise a client, as long as you verify the figures
          yourself first. Do not represent the output as a professional opinion, an appraisal, or a
          determination by any agency.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Terms of use"
      title="Terms and disclaimer"
      standfirst={
        <>
          Everything here is an <strong>estimate produced from published rules</strong>. It is not
          financial advice, not tax advice, not legal advice, and not an appraisal. Nobody here is
          your accountant, attorney, servicer or agent, and using these tools creates no
          professional relationship.
        </>
      }
      updated={UPDATED}
      stamps={["Pre-launch build", "No credentialed sign-off yet"]}
      sections={sections}
      footnote={
        <>
          See also the{" "}
          <Link href="/privacy">privacy notice</Link>, which explains why nothing you type leaves
          your browser.
        </>
      }
    />
  );
}
