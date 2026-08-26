import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ErrorState } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/loans/editorial-policy");

export default function EditorialPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">Editorial policy</h1>
        <p className="text-dim mt-1">
          What decides a number here, what only describes one, and what has to be true before
          either ships.
        </p>
      </header>

      <section aria-labelledby="ep-split">
        <h2 id="ep-split" className="mb-2">What decides, and what only explains?</h2>
        <p>
          The engine decides; the prose explains. Every figure you see is produced by
          deterministic code with zero dependencies, no network access and no AI in the
          calculation path — money is held in integer cents and interest rates in basis points,
          so <span className="num">360</span> months of arithmetic cannot drift. The writing
          around it can describe a result, warn about it or link to the rule behind it, but it
          can never adjust it. When prose and engine disagree, the engine is what ran.
        </p>
      </section>

      <section aria-labelledby="ep-sources">
        <h2 id="ep-sources" className="mb-2">Where do the rules come from?</h2>
        <p>
          From the regulation itself, read in full. The governing document for every plan on
          this site is the RISE final rule, <span className="num">91 Fed. Reg. 23768</span>,
          published <span className="num">1 May 2026</span> as FR Doc.{" "}
          <span className="num">2026-08556</span> and effective{" "}
          <span className="num">1 Jul 2026</span>, amending{" "}
          <span className="num">34 C.F.R. parts 674, 682 and 685</span>. The poverty guidelines
          come from the HHS table published each January; the tax treatment of forgiveness from{" "}
          <span className="num">26 U.S.C. § 108(f)</span>.
        </p>
        <p className="mt-2">
          Where a citation points somewhere unexpected, that is deliberate. Both eCFR and the
          Federal Register&apos;s own site refuse automated requests and redirect every path to
          a block page — which means a response from either host proves nothing, since a real
          URL and a mistyped one behave identically. The rule text was therefore retrieved from
          govinfo.gov, which serves the identical GPO text, and that is the URL the rule files
          cite. Citing the document that was actually read matters more than citing the
          prettier link.
        </p>
      </section>

      <section aria-labelledby="ep-gaps">
        <h2 id="ep-gaps" className="mb-2">What closes a verification gap?</h2>
        <p>
          A primary source, and nothing else. A secondary source — a law-school mirror, a
          research summary, a commercial code site — may cross-check a value, but it may never
          close a gap; any value resting on one is labelled as such. Where a source could not be
          reached, the engine keeps whatever it already had and the gap is recorded openly. No
          row is filled with a plausible-looking substitute, a recalled figure, or an estimate.
        </p>
        <p className="mt-2">
          Closing a gap means editing the code and the register entry together. Deleting an open
          item without a fetched URL and a date is not closing it, and a citation that has never
          been opened is treated as an open item even when the figure it would support is
          verified elsewhere. Three citations on this site are in exactly that state, and the{" "}
          <Link href="/loans/about" className="underline underline-offset-4">
            about page
          </Link>{" "}
          names them.
        </p>
        <p className="mt-2">
          One further rule comes from experience rather than principle: figures are read from
          extracted statute or PDF text, never from a summarising layer. During the same
          verification programme, a summarising fetch tool misnumbered a revenue procedure and
          returned an entirely fabricated table for another engine on this site. The encoded
          values were already correct; trusting the summary would have replaced a right answer
          with a wrong one.
        </p>
      </section>

      <section aria-labelledby="ep-review">
        <h2 id="ep-review" className="mb-2">What review gate has not been met?</h2>
        <p>
          Credentialed review. Before public launch, the encoded rules and the guidance on these
          pages must be reviewed by a named, credentialed student loan professional — a CSLP or
          an attorney — and their name and credentials must appear on the about page and on
          every guide they signed off. No reviewer, no launch.
        </p>
        <ErrorState
          className="mt-3"
          cause="No reviewer has been engaged, and no review has taken place."
          fix="Nobody is named on this page because there is nobody to name. Verification so far has confirmed that encoded values match their cited sources — a narrower question than whether the output is legally or financially sufficient for any particular borrower."
        />
      </section>

      <section aria-labelledby="ep-corrections">
        <h2 id="ep-corrections" className="mb-2">How are errors corrected, and how fast?</h2>
        <p>
          Within <span className="num">48</span> hours of confirming one. The sequence is fixed:
          correct the rule file, re-run the full test suite, then publish a dated{" "}
          <Link href="/loans/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          entry stating what changed, which primary source it was changed against, and which
          results moved. Because every page renders from the same rule files, a single edit
          updates the tool, the methodology page and the sources table together — there is no
          second copy of a number to forget.
        </p>
        <p className="mt-2">
          Report an error to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          . Include the inputs you used if you can; a scenario link carries them. We will credit
          the report unless you ask otherwise. A report we cannot reproduce still gets an answer.
        </p>
      </section>

      <section aria-labelledby="ep-versioning">
        <h2 id="ep-versioning" className="mb-2">How are rule changes versioned?</h2>
        <p>
          Every rule set is a separate dated file with its own version string, its own{" "}
          <span className="num">effectiveFrom</span> and{" "}
          <span className="num">effectiveTo</span>, and at least one citation carrying a URL and
          the date it was last verified. The engine resolves which file applies from the
          simulation date, so an old scenario keeps computing under the rules that were in force
          when it ran.
        </p>
        <p className="mt-2">
          A rule set that changes gets a new dated file rather than an edit in place. That is
          why the annual poverty guidelines and the plan terms carry different date shapes: the
          guidelines are republished every January and the plan terms took effect with the RISE
          rule on <span className="num">1 Jul 2026</span>. The{" "}
          <Link href="/loans/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          lists the five current version strings, and the{" "}
          <Link href="/loans/sources" className="underline underline-offset-4">
            sources page
          </Link>{" "}
          renders straight from the files, so it cannot drift from what the engine computed.
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
        <h2 id="ep-funding" className="mb-2">Who pays, and can they reach a number?</h2>
        <p>
          No lender, servicer, or debt-relief company pays us, and none can influence the
          ranking, because the ranking is arithmetic. The structural guarantee is stronger than
          the promise: the engine has no dependencies and makes no network calls, so there is no
          place inside a calculation for a partner&apos;s code or data to sit.
        </p>
        <p className="mt-2">
          No advertising runs on this site today and no ad network script is loaded on any page.
          Planned revenue is advertising on content pages — never inside the tool, where an ad
          could be mistaken for part of the result — an optional paid PDF report, and clearly
          labelled affiliate links shown only when the engine determines they serve you, always
          with any forfeited benefit disclosed at equal visual weight. The{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            site privacy policy
          </Link>{" "}
          states what changes on the day advertising is switched on.
        </p>
      </section>
    </div>
  );
}
