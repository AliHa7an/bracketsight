import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/property/about" },
  title: "About the Appeal Toolkit — Assistance, Not Advice",
  description:
    "What the property tax appeal toolkit is, what it is not, and the launch bar it holds itself to — credentialed review of every method and county playbook.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        About Fineprint
      </h1>
      <p>
        Homeowners are routinely over-assessed and almost never appeal,
        because every county has different deadlines, forms, and evidence
        standards — and the services that will handle it for you take 25–50%
        of your savings. Fineprint is the self-service path: check your
        assessment in two minutes, see the evidence, and file your own appeal
        with your county&apos;s actual rules in front of you.
      </p>

      <section className="space-y-3">
        <h2>
          What Fineprint is not
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Not a law firm.</strong> Nothing here is legal advice or
            legal representation. Fineprint provides assistance preparing
            your own appeal.
          </li>
          <li>
            <strong>Not an appraisal.</strong> The check is a statistical
            comparison to similar homes, documented on the{" "}
            <Link href="/property/methodology" className="underline underline-offset-2">
              methodology page
            </Link>
            — useful evidence, not a certified valuation.
          </li>
          <li>
            <strong>Not a promise of savings.</strong> Appeal boards decide
            appeals. We tell you honestly when the evidence is thin —
            including telling most users their assessment looks fair.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>
          Pre-launch status
        </h2>
        <p>
          This is a v1 build running on a clearly labelled synthetic demo
          neighborhood. Before launch, policy requires: a named, credentialed
          property-tax reviewer for the methodology and each county playbook;
          primary-source verification of every county rule currently flagged
          &ldquo;awaiting verification&rdquo;; and real parcel data for each
          launch county. None of these are optional.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Privacy
        </h2>
        <p>
          The assessment check runs entirely in your browser. Nothing you type
          is uploaded, stored, or logged. When document upload ships in a
          later phase, files will be processed in memory and never persisted —
          that promise is a product feature, not a footnote.
        </p>
      </section>
    </div>
  );
}
