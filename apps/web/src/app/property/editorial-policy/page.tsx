import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/property/editorial-policy" },
  title: "Property Tax Editorial Policy — Review, Corrections",
  description:
    "Who writes the county playbooks, how each deadline and fee is verified, how corrections work, how the site is funded, and where AI is and is not used.",
};

export default function EditorialPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        Editorial policy
      </h1>

      <section className="space-y-3">
        <h2>
          How rules get onto this site
        </h2>
        <p>
          County rules are encoded from primary sources only — the county
          authority, the state statute, or the state tax court — never from
          another website&apos;s summary. Each rule carries its citation and a
          last-verified date, visible on every{" "}
          <Link href="/property/counties" className="underline underline-offset-2">
            county page
          </Link>
          . A rule we cannot cite does not ship; a rule we have drafted but
          not yet confirmed is labelled &ldquo;awaiting primary-source
          verification&rdquo; until it is.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Where AI is used — and where it never is
        </h2>
        <p>
          The calculation engine contains no AI: comparable selection, ratios,
          confidence, and verdicts are deterministic statistics, unit-tested,
          with zero network access. AI is never permitted to compute a value,
          select a comparable, or decide a verdict. In later phases AI may
          help read documents you upload (always behind a review screen you
          confirm) and draft narrative text (with every number validated
          against the engine&apos;s output). Nothing you enter in the checker
          today leaves your browser.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Corrections
        </h2>
        <p>
          Found a wrong deadline, fee, or formula? Email{" "}
          <a href="mailto:corrections@fairparcel.example" className="underline underline-offset-2">
            corrections@fairparcel.example
          </a>
          . Confirmed errors are fixed in the rules data, noted in the{" "}
          <Link href="/property/changelog" className="underline underline-offset-2">
            changelog
          </Link>{" "}
          within 48 hours, and the affected pages update automatically. A
          wrong number here can cost a real person a real appeal window — we
          treat corrections as the highest-priority work there is.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Funding and independence
        </h2>
        <p>
          Fineprint plans to earn revenue from advertising on content pages,
          a one-time paid appeal packet, and clearly labelled referrals to
          contingency services for counties we do not yet cover. None of these
          influence a verdict: the engine has no knowledge of monetization,
          and an honest &ldquo;not worth filing&rdquo; is the product&apos;s
          core promise. Ads never appear inside the tool.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Review
        </h2>
        <p>
          Launch policy requires a named, credentialed property-tax reviewer
          for the methodology and every county playbook. Until that review is
          complete, this site is a pre-launch build and says so — see{" "}
          <Link href="/property/about" className="underline underline-offset-2">
            about
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
