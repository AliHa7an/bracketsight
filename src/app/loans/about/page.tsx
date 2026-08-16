import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About the Student Loan Repayment Engine",
  description:
    "How this section simulates all nine federal repayment plans from your real loan mix and ranks them by lifetime cost. Every rule cited. No lender pays us.",
  alternates: { canonical: "/loans/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">About the student loan engine</h1>
        <p className="text-dim mt-1">
          The independent second opinion on your student loan repayment plan. Every rule
          cited. Every number dated. No lender pays us.
        </p>
      </header>

      <section aria-labelledby="a-what">
        <h2 id="a-what" className="mb-2">What this is</h2>
        <p>
          A decision engine, not a payment calculator. You enter your real loan mix; the
          engine simulates all nine federal repayment plans month by month over up to 30 years
          and returns a ranked recommendation by total lifetime cost — with the irreversible
          choices flagged before you make them. Roughly 7 million former SAVE borrowers are
          choosing a plan under deadline right now, and the cheapest monthly payment is
          frequently the most expensive plan. Showing that conflict is the point.
        </p>
      </section>

      <section aria-labelledby="a-how">
        <h2 id="a-how" className="mb-2">How it works</h2>
        <p>
          The math runs entirely in your browser: no account, no upload, no server-side
          storage. Every rate and threshold comes from a versioned rule file citing its
          primary source — see the{" "}
          <Link href="/loans/methodology" className="underline underline-offset-4">methodology</Link>{" "}
          and{" "}
          <Link href="/loans/sources" className="underline underline-offset-4">sources</Link>. When
          rules change, the{" "}
          <Link href="/loans/changelog" className="underline underline-offset-4">changelog</Link>{" "}
          says what changed and when.
        </p>
      </section>

      <section aria-labelledby="a-review">
        <h2 id="a-review" className="mb-2">Review</h2>
        <p>
          This section launches publicly only after review by a named, credentialed student
          loan professional (CSLP or attorney); their name and credentials will appear here.
          Until then, treat this as a rigorous pre-release tool: the engine is fully
          unit-tested against published worked examples, and every figure it cannot yet verify
          against a live primary source is flagged on the sources page.
        </p>
      </section>

      <section aria-labelledby="a-disclaimer">
        <h2 id="a-disclaimer" className="mb-2">What this is not</h2>
        <p>
          Not your servicer, not financial advice, not tax advice. Estimates run under current
          rules and your stated assumptions. Confirm any plan change with your servicer, and
          any tax question with a professional, before acting.
        </p>
      </section>
    </div>
  );
}
