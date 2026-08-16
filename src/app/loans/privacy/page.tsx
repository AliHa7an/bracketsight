import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Your Loan Data Never Leaves Your Browser",
  description:
    "Nothing about your loans is stored server-side: balances, income and results live in your browser's localStorage and in the link fragment you choose to share.",
  alternates: { canonical: "/loans/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">How your loan data is handled</h1>
        <p className="text-dim mt-1">
          Effective 8 Aug 2026. This page covers the student loan tool specifically — the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            site privacy policy
          </Link>{" "}
          covers everything else.
        </p>
      </header>

      <section aria-labelledby="p-data">
        <h2 id="p-data" className="mb-2">
          Your loan data never leaves your browser
        </h2>
        <p>
          The simulation runs entirely client-side. Your loans, income, household details, and
          results are stored in your browser&apos;s localStorage under the key{" "}
          <span className="num">fineprint.loans.scenario.v1</span> — on your device, under your
          control — and nowhere else. There are no accounts, no server-side database, and no
          transmission of your financial details to us or anyone. Clearing your browser
          storage erases everything.
        </p>
      </section>

      <section aria-labelledby="p-share">
        <h2 id="p-share" className="mb-2">Share links</h2>
        <p>
          The address bar carries your scenario after the <span className="num">#</span> — in
          the URL <em>fragment</em>, which browsers never send to a server. Copy the address
          and the recipient&apos;s browser re-runs the same simulation; the balances and income
          in it reached no server on the way. Anyone with the link can read those inputs, so
          share it as you would the numbers themselves.
        </p>
      </section>

      <section aria-labelledby="p-uploads">
        <h2 id="p-uploads" className="mb-2">Future document upload</h2>
        <p>
          A planned feature will read a StudentAid.gov summary you upload. When it ships,
          files will be processed in memory and never written to disk, object storage, or
          logs — the privacy promise is part of the product, and it is enforced in code.
        </p>
      </section>

      <section aria-labelledby="p-analytics">
        <h2 id="p-analytics" className="mb-2">Analytics</h2>
        <p>
          If we add analytics, they will measure page performance and feature use only. Your
          AGI, balances, and results are never sent to an analytics provider — at most,
          coarse bucketed ranges. No advertising identifiers are attached to tool inputs.
        </p>
      </section>
    </div>
  );
}
