import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SECTIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Disclaimer — Estimates, Not Advice",
  description:
    "These tools produce estimates from published rules, not financial, tax or legal advice. What each figure is, what it is not, and where the known gaps are documented.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1>Terms and disclaimer</h1>

      <div className="density-reading mt-6">
        <p>
          Everything here is an <strong>estimate produced from published rules</strong>.
          It is not financial advice, not tax advice, not legal advice, and not an
          appraisal. Nobody here is your accountant, attorney, servicer or agent, and
          using these tools creates no professional relationship.
        </p>

        <h2>How much should I trust a number on this site?</h2>
        <p>
          Enough to ask a better question with it, not enough to act on alone. Every
          figure is computed by deterministic code from rule data that carries a citation
          and a verification date. No language model touches a calculation. But rules
          change, our reading of one can be wrong, and your own situation will contain
          facts the form never asked for. Confirm anything that matters with the body that
          actually decides it — your loan servicer, the marketplace, the county board, a
          licensed professional.
        </p>

        <h2>Are all the underlying figures verified?</h2>
        <p>
          No, and we publish exactly which ones are not. Each engine records what was
          checked against a primary source and what could not be, and the open items are
          tracked in <span className="num">KNOWN-GAPS.md</span> in the source repository.
          Where a figure could not be verified we say so rather than filling the gap with
          a plausible guess. In two places the tools refuse to answer at all rather than
          answer wrongly: contract generation is blocked in states whose statutory notice
          text has not been transcribed, and a New Jersey assessment verdict is withheld
          when the governing ratio is unavailable.
        </p>

        <h2>What is each tool actually telling me?</h2>
        <ul className="pl-5" style={{ listStyle: "disc" }}>
          {SECTIONS.map((s) => (
            <li key={s.slug} className="mt-2">
              <Link className="text-ink underline underline-offset-2" href={`/${s.slug}`}>
                {s.name}
              </Link>{" "}
              — <span className="text-dim">{s.tagline}</span>
            </li>
          ))}
        </ul>
        <p>
          Estimates from the trades tool are estimates, never a binding quote: prices are
          reference data, not a live market feed, and a quote you send a customer is a
          number you have to honour. The documents it generates are templates, not legal
          advice — have an attorney review a contract before you sign it.
        </p>

        <h2>Who is responsible if a number is wrong?</h2>
        <p>
          You remain responsible for your own decisions. These tools are provided as-is,
          without warranty of any kind, and we accept no liability for loss arising from
          reliance on them. That is the honest position for a free tool computing
          high-stakes numbers from rules that change.
        </p>
        <p>
          It is also why corrections matter more to us than traffic. If you find a wrong
          figure, tell us at{" "}
          <a className="text-ink underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          and we will check it against the primary source and publish the change in that
          tool&rsquo;s changelog.
        </p>

        <h2>Can I use these tools commercially?</h2>
        <p>
          Yes — quote a job, plan a filing, advise a client, as long as you verify the
          figures yourself first. Do not represent the output as a professional opinion,
          an appraisal, or a determination by any agency.
        </p>

        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          See also the{" "}
          <Link className="text-ink underline underline-offset-2" href="/privacy">
            privacy notice
          </Link>
          , which explains why nothing you type leaves your browser.
        </p>
      </div>
    </div>
  );
}
