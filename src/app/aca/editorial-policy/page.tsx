import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/aca/editorial-policy" },
  title: "ACA Editorial Policy — Review, Corrections, Funding",
  description:
    "How the subsidy cliff pages are written, who reviews the tax rules, how a correction reaches the changelog, and exactly where the money comes from.",
};

export default function EditorialPolicyPage() {
  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Editorial policy</h1>

      <section className="space-y-2">
        <h2>How rules get on this site</h2>
        <p className="text-ink">
          Every rule is encoded from a primary source — statute, regulation,
          IRS guidance, or HHS publication — never from a blog or a
          competitor&apos;s calculator. Each rules file carries its citations
          and a last-verified date, published on{" "}
          <Link href="/aca/sources" className="underline underline-offset-4">
            /sources
          </Link>
          . A rule we cannot cite does not ship.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Credentialed review</h2>
        <p className="text-ink">
          Bracketsight launches only with a named EA/CPA reviewer for the tax
          logic and content. Reviewer engagement is in progress; this page
          will carry their name, credential, and review dates before launch.
          Until then the site is a pre-launch build and says so.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Corrections</h2>
        <p className="text-ink">
          Errors are corrected within 48 hours of confirmation, logged on the{" "}
          <Link href="/aca/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          with what changed and why, and affected pages carry updated
          verification dates. To report an error, open an issue or email the
          address on the{" "}
          <Link href="/aca/about" className="underline underline-offset-4">
            about page
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2>Funding and conflicts</h2>
        <p className="text-ink">
          Bracketsight plans to earn from clearly separated display advertising
          and an optional paid planning PDF — never from insurance
          commissions. We do not sell or recommend specific insurance plans,
          we are not a brokerage, and no revenue source influences a computed
          result. Any future enrollment-partner affiliation will be disclosed
          on the page where it appears, at equal visual weight.
        </p>
      </section>

      <section className="space-y-2">
        <h2>What we never publish</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>AI-generated numbers or auto-published AI content.</li>
          <li>Outcome promises — everything is an estimate under current rules.</li>
          <li>Advice to time income — that conversation belongs with your tax professional.</li>
        </ul>
      </section>
    </article>
  );
}
