import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@fineprint/ui";

export const metadata: Metadata = {
  title: "About the OBBBA Deduction Engine",
  description:
    "A deterministic OBBBA deduction engine: tips, overtime, senior and car-loan deductions on one household MAGI, every rule cited to its primary source.",
  alternates: { canonical: "/paycheck/about" },
};

const link =
  "text-ink underline decoration-rule underline-offset-4 hover:decoration-current";

export default function AboutPage() {
  return (
    <article className="flex flex-col gap-8">
      <h1>About the deduction engine</h1>

      <div className="density-reading">
        <p>
          New deductions arrived with the One Big Beautiful Bill Act, and the first filing
          season was chaos: W-2s without boxes for them, workers self-calculating from pay
          stubs, and money left on the table. This section answers one question precisely —{" "}
          <em>what does your household actually get?</em> — including the phase-out
          interactions no single-deduction calculator can model, because it only ever sees one
          deduction.
        </p>
        <p>
          It is a decision engine, not a calculator. Output is cited, dated, and traceable to
          the line of statute it came from, with the money-you&apos;re-about-to-leave-behind
          cases marked in amber. Formulas are public on{" "}
          <Link href="/paycheck/methodology" className={link}>
            Methodology
          </Link>
          , citations on{" "}
          <Link href="/paycheck/sources" className={link}>
            Sources
          </Link>
          , and every rule change lands on the{" "}
          <Link href="/paycheck/changelog" className={link}>
            Changelog
          </Link>
          .
        </p>
        <p>
          Your inputs never leave your browser. There are no accounts, no uploads, and no
          database: the engine runs client-side and state persists only in your own
          localStorage.
        </p>
      </div>

      <ErrorState
        cause="This is a pre-launch build."
        fix="Several rule values are placeholders pending verification against IRS primary sources, and the credentialed (EA or CPA) reviewer our editorial policy requires has not yet signed off. Treat every number here as illustrative."
      />
    </article>
  );
}
