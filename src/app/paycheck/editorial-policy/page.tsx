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
export const metadata: Metadata = pageMetadata("/paycheck/editorial-policy");

const link =
  "text-ink underline decoration-rule underline-offset-4 hover:decoration-current";

export default function EditorialPolicyPage() {
  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <h1>Editorial policy</h1>

      <section className="density-reading">
        <h2>What decides, and what only explains?</h2>
        <p>
          The engine decides; the prose explains. Every dollar figure on these pages comes from
          deterministic code with zero dependencies, no network access and no AI anywhere in the
          calculation path. Money is held in integer cents and rates in basis points, so a
          phase-out computed at the same MAGI returns the same cents every time. The writing can
          describe a result or warn about it; it cannot move it.
        </p>
      </section>

      <section className="density-reading">
        <h2>Where do the rules come from?</h2>
        <p>
          From the statute as enacted and the forms that compute it. The four deductions are read
          from <span className="num">P.L. 119-21</span> itself — sections{" "}
          <span className="num">70103</span>, <span className="num">70201</span>,{" "}
          <span className="num">70202</span> and <span className="num">70203</span>, which add{" "}
          <span className="num">IRC §§ 151(d)(5)(C)</span>, <span className="num">224</span>,{" "}
          <span className="num">225</span> and <span className="num">163(h)(4)</span>. The
          computation of record is Schedule 1-A (Form <span className="num">1040</span>) and its
          line-by-line instructions, because that is what a return is actually filled in against.
        </p>
        <p>
          Four further primary documents carry specific pieces: the{" "}
          <span className="num">2026</span> inflation-adjustment revenue procedure for the
          bracket table and standard deduction; the final tips regulation for the occupation
          list, the phase-out ordering and the confirmation that the{" "}
          <span className="num">$25,000</span> cap is per return rather than per spouse; the IRS
          notice and fact sheet that are the operative guidance on qualified overtime; and the
          W-2 instructions that establish where an employer reports these amounts. Nothing enters
          the engine from secondary coverage. Every citation and its last-verified date is on the{" "}
          <Link href="/paycheck/sources" className={link}>
            Sources
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="density-reading">
        <h2>What closes a verification gap?</h2>
        <p>
          A primary source, read directly. A secondary source may cross-check a figure and may
          never close a gap. Where a source could not be reached, the row stays open and the
          engine keeps whatever it already had — no value is filled in from recall, and no row
          is quietly improved with a plausible substitute.
        </p>
        <p>
          One method rule comes from a near miss rather than a principle. Figures are read from
          statute text or from PDF text extracted locally, never from a summarising layer. During
          this same verification programme, a summarising fetch tool misnumbered a revenue
          procedure and returned a completely fabricated table for another engine on this site.
          The encoded values were already correct; acting on that summary would have replaced a
          right answer with garbage.
        </p>
        <p>
          Blocked sources are disclosed rather than papered over. Several official hosts refuse
          automated requests, so where a citation points at a mirror or at the enrolled bill
          instead of the code section, it is because that is the document that was actually
          opened. No source relevant to these four deductions was lost to a block, with one
          exception worth naming: no Treasury regulation implementing the overtime section could
          be located, and because the Federal Register&apos;s own search could not be browsed,
          its absence is not established.
        </p>
      </section>

      <section className="density-reading">
        <h2>What review gate has not been met?</h2>
        <p>
          Credentialed review. Tax logic must be reviewed by a credentialed reviewer — an
          enrolled agent or a CPA — before launch and after every rule change, and their name and
          credentials must appear on the pages they signed off.
        </p>
        <ErrorState
          cause="No reviewer has been engaged, and no review has taken place."
          fix="This section does not launch until one signs off on the encoded rules and the worked examples. Nobody is named here because there is nobody to name — verification so far has confirmed that encoded values match their cited sources, which is a narrower question than whether the output is right for any particular household."
        />
      </section>

      <section className="density-reading">
        <h2>How are errors corrected, and how fast?</h2>
        <p>
          Within <span className="num">48</span> hours of confirming one, in a fixed sequence:
          correct the rule file, add a regression test that fails on the old behaviour, re-run
          the suite, then publish a dated{" "}
          <Link href="/paycheck/changelog" className={link}>
            changelog
          </Link>{" "}
          entry naming the source the change was made against and which results moved.
        </p>
        <p>
          Two corrections already on that record show the standard. The tips and overtime
          phase-outs were rounding the <span className="num">$1,000</span> step up where
          Schedule 1-A lines <span className="num">11</span> and{" "}
          <span className="num">19</span> require it rounded down, which understated both
          deductions by up to <span className="num">$100</span> each. And the senior deduction
          applied its <span className="num">6%</span> reduction once to a doubled amount, where
          the form applies it per person and enters the result twice — a joint return with two
          spouses over <span className="num">65</span> at <span className="num">$200,000</span>{" "}
          of MAGI was returning <span className="num">$9,000</span> against the form&apos;s{" "}
          <span className="num">$6,000</span>. Both were fixed and both are now pinned by tests.
        </p>
        <p>
          Report an error to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
            {CONTACT_EMAIL}
          </a>
          , with the inputs you used if you can. We will credit the report unless you ask
          otherwise.
        </p>
      </section>

      <section className="density-reading">
        <h2>How are rule changes versioned?</h2>
        <p>
          One dated file per rule set per tax year, each carrying its own version string, an{" "}
          <span className="num">effectiveFrom</span> and{" "}
          <span className="num">effectiveTo</span> date, a{" "}
          <span className="num">verified</span> flag, and citations with the date each was last
          checked. Six files back this section: one for each of the four deductions, one for the
          bracket table and standard deduction, and one for the occupation list. The bundle
          version shown on these pages is derived from the files rather than typed by hand, and
          the date beside it is the oldest last-verified date across the whole bundle — the
          honest figure, not the flattering one.
        </p>
        <p>
          A new tax year gets new files, never an edit in place, and these files must not be
          cloned past tax year <span className="num">2028</span>: the tips deduction allows
          nothing for a taxable year beginning after <span className="num">31 Dec 2028</span>,
          and the senior and car-loan deductions carry the same sunset. A file that outlived its
          statute is worse than a missing one.
        </p>
      </section>

      <section className="density-reading">
        <h2>Who pays, and can they reach a number?</h2>
        <p>
          This section is planned to be advertising- and affiliate-supported. No advertising runs
          today and no ad network script is loaded on any page. Advertisers and affiliates cannot
          influence a computed result, and the guarantee is structural rather than a promise: the
          engine has no dependencies and makes no network calls, so there is nowhere inside a
          calculation for a partner&apos;s code or data to sit. Every formula is published in
          full on the{" "}
          <Link href="/paycheck/methodology" className={link}>
            Methodology
          </Link>{" "}
          page, and the arithmetic runs identically whether or not any partner exists. No ad slot
          sits inside the tool, where it could be mistaken for part of a result.
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
