import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy — Student Loan Rule Verification",
  description:
    "Standards behind the student loan engine: primary sources only, credentialed review before launch, a public corrections process, full funding disclosure.",
  alternates: { canonical: "/loans/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">Editorial policy</h1>
      </header>

      <section aria-labelledby="ep-sources">
        <h2 id="ep-sources" className="mb-2">Primary sources only</h2>
        <p>
          Rules enter the engine from regulation (eCFR, Federal Register), statute
          (Congress.gov), or agency guidance (StudentAid.gov, HHS) — never from secondary
          commentary. Each rule file carries its citations and the date we last verified them;
          the <Link href="/loans/sources" className="underline underline-offset-4">sources page</Link>{" "}
          renders from those files directly. A rule we cannot cite does not ship.
        </p>
      </section>

      <section aria-labelledby="ep-review">
        <h2 id="ep-review" className="mb-2">Credentialed review</h2>
        <p>
          Before public launch, the engine&apos;s rules and this site&apos;s guidance are
          reviewed by a named, credentialed student loan professional (CSLP or attorney). No
          reviewer, no launch. The reviewer&apos;s name and credentials will appear on the{" "}
          <Link href="/loans/about" className="underline underline-offset-4">about page</Link> and on
          every guide they review.
        </p>
      </section>

      <section aria-labelledby="ep-corrections">
        <h2 id="ep-corrections" className="mb-2">Corrections</h2>
        <p>
          When a computed figure or stated rule is wrong, we correct the rule file, re-run the
          full golden test suite, and publish a dated{" "}
          <Link href="/loans/changelog" className="underline underline-offset-4">changelog</Link>{" "}
          entry describing what changed, why, and which results it affected — within 48 hours
          of confirming the error. Report an error and we will credit the report unless you
          ask otherwise.
        </p>
      </section>

      <section aria-labelledby="ep-ai">
        <h2 id="ep-ai" className="mb-2">Where AI is and is not used</h2>
        <p>
          No AI computes, estimates, or adjusts any number on this site — the calculation
          engine is deterministic, dependency-free code with its purity enforced in continuous
          integration. Planned AI features (reading an uploaded statement into the form,
          explaining your results in plain language) always place a human review screen
          between the AI and the engine, and never publish a number the engine did not
          produce.
        </p>
      </section>

      <section aria-labelledby="ep-funding">
        <h2 id="ep-funding" className="mb-2">Funding disclosure</h2>
        <p>
          This section is independent. No lender, servicer, or debt-relief company pays us,
          and nothing influences the ranking — it is arithmetic. Planned revenue is
          advertising on content pages (never inside the tool), an optional paid PDF report,
          and clearly-labelled affiliate links shown only when the engine determines they
          serve you and always with forfeited benefits disclosed at equal visual weight.
        </p>
      </section>
    </div>
  );
}
