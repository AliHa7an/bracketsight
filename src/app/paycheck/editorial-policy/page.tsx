import type { Metadata } from "next";
import { ErrorState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Editorial Policy — OBBBA Rule Verification",
  description:
    "How these pages are written, reviewed, corrected and funded — primary sources only, credentialed review before launch, and corrections within 48 hours.",
  alternates: { canonical: "/paycheck/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <article className="flex flex-col gap-8">
      <h1>Editorial policy</h1>

      <section className="density-reading">
        <h2>Sourcing</h2>
        <p>
          Every rule the engine computes with is encoded from a primary source — the statute
          (P.L. 119-21), Treasury regulations, or published IRS guidance — never from
          secondary coverage. If we cannot cite it, we do not ship it.
        </p>
      </section>

      <section className="density-reading">
        <h2>Review</h2>
        <p>
          Tax logic is reviewed by a credentialed reviewer (EA or CPA) before launch and after
          every rule change.
        </p>
        <ErrorState
          cause="No reviewer has been engaged yet."
          fix="This site does not launch until one signs off on the encoded rules and the worked examples."
        />
      </section>

      <section className="density-reading">
        <h2>Corrections</h2>
        <p>
          Errors are corrected within 48 hours of confirmation, logged on the changelog with
          what changed and why, and the affected pages carry an updated verification date.
          Report an error through the contact on the About page.
        </p>
      </section>

      <section className="density-reading">
        <h2>Funding and independence</h2>
        <p>
          This section is planned to be advertising- and affiliate-supported. Advertisers and
          affiliates never influence a computed result: the engine is deterministic, published
          in full on the methodology page, and computes identically whether or not any partner
          exists.
        </p>
      </section>

      <section className="density-reading">
        <h2>What AI does — and doesn&apos;t do</h2>
        <p>
          No AI computes, estimates, or adjusts any number on this site. Every figure comes
          from deterministic, unit-tested arithmetic over cited rules. Any future AI feature,
          such as a plain-language explanation, will be validated number-for-number against
          engine output and will fail closed to a deterministic template.
        </p>
      </section>
    </article>
  );
}
