import type { Metadata } from "next";
import Link from "next/link";

import { AnswerBox, FactTable } from "@/components/ui";

import {
  CONTACT_EMAIL,
  MAINTAINER,
  SECTIONS,
  SITE_NAME,
  sectionHref,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "About — who builds these engines and how the rules get verified",
  description:
    "How five US money-rule engines are built, funded and corrected: deterministic arithmetic, cited primary sources, 468 tests, and a published register of 55 unverified items.",
  alternates: { canonical: "/about" },
};

/**
 * The site-level About page.
 *
 * Each section already carries its own about page, because each answers to a
 * different rule-maker. What none of them could carry is the thing a reader —
 * and a reviewer at an ad network, and Google's YMYL quality guidance — asks
 * before trusting any of the figures: who operates this, how does a number get
 * onto it, who pays for it, and what does it admit it does not know.
 *
 * Everything asserted here is checkable against the repository: the test
 * counts, the gap register, the two refusal behaviours, the absence of a
 * credentialed reviewer. Nothing is aspirational and nothing is rounded up.
 *
 * The attribution block renders only when `MAINTAINER` is set in
 * `src/lib/site.ts`. It is deliberately not filled with a placeholder — see
 * the comment there.
 */

/* The gap register, summarised from KNOWN-GAPS.md (compiled 2026-08-15). The
   counts are transcribed, not computed, so they carry the compile date rather
   than a live one. */
const GAP_GROUPS: readonly { group: string; unblockedBy: string; count: number }[] = [
  { group: "A", unblockedBy: "Blocked source access", count: 22 },
  { group: "B", unblockedBy: "Manual statutory transcription", count: 8 },
  { group: "C", unblockedBy: "Commercial data licence", count: 2 },
  { group: "D", unblockedBy: "Not yet published by the agency", count: 2 },
  { group: "E", unblockedBy: "Regulatory ambiguity", count: 4 },
  { group: "F", unblockedBy: "Data pipeline work", count: 6 },
  { group: "G", unblockedBy: "Documented simplification", count: 3 },
  { group: "H", unblockedBy: "Verified but not yet built", count: 8 },
];

const GAP_TOTAL = GAP_GROUPS.reduce((sum, row) => sum + row.count, 0);

const link = "rounded-atlas underline underline-offset-4 hover:text-ink";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="max-w-[26ch]">About {SITE_NAME}</h1>

      <AnswerBox className="mt-6">
        {SITE_NAME} runs <span className="num">5</span> independent engines over US federal and
        local money rules. Every figure is computed by deterministic code from rules stored in
        versioned JSON with a primary citation and a verification date. No language model
        computes any number shown to a reader.
      </AnswerBox>

      <h2 className="mt-12">What this site is</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        Five tools, each answering a decision rather than an arithmetic question. A payment
        calculator tells you what one plan costs. These tell you which option costs least, which
        of them cannot be undone, and where the rule that decides it is written down.
      </p>

      <ul className="mt-4 max-w-[68ch] list-disc space-y-2 pl-5 text-dim">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <Link href={sectionHref(section)} className={`${link} text-ink`}>
              {section.name}
            </Link>{" "}
            — {section.tagline}
          </li>
        ))}
      </ul>

      <h2 className="mt-12">How a number gets onto this site</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        A rate, threshold, bracket, deadline or statutory term is never written into the code that
        uses it. It goes into a versioned rules file carrying the date it takes effect, the date it
        stops, and at least one citation with a URL and the date somebody last opened that URL and
        read the value off it. The engine reads the file; the page reads the engine. When a rule
        changes, one file changes and every page that depends on it recomputes — which is why a
        correction can be published the same day it is confirmed rather than hunted through prose.
      </p>

      <p className="mt-4 max-w-[68ch] text-dim">
        The arithmetic itself is plain TypeScript with no dependencies and no network access.
        Money is held in integer cents and rates in basis points, because 360 iterations of
        floating-point drift produces a wrong answer at the end of a 30-year simulation. The five
        engines carry <span className="num">399</span> tests between them and the app another{" "}
        <span className="num">69</span>. Where an agency has published worked examples — the eight
        for the Repayment Assistance Plan, for instance — those examples are encoded as tests, so
        the engine has to reproduce the government&rsquo;s own arithmetic before it ships.
      </p>

      <h2 className="mt-12">Where AI is used, and where it is not</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        No language model touches a calculation, an eligibility test, a ranking or a clause
        selection. That is enforced in the build, not promised in prose: the engine packages have
        zero dependencies, so there is nothing for an AI call to be made through. The planned uses
        for AI are reading an uploaded document to fill a form in, and explaining a result in plain
        language — and in the second case every numeral and date in the generated text is checked
        against the engine&rsquo;s own output before it renders, with a deterministic template
        shown instead on any mismatch. Neither feature is live today.
      </p>

      <h2 className="mt-12">What is not verified</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        This is a pre-launch build and it says so on the pages it affects.{" "}
        <span className="num">{GAP_TOTAL}</span> items across the five engines are recorded as
        unverified, grouped by what would unblock each one. No gap is filled with an estimate, a
        remembered figure or a plausible substitute: where a value could not be read off a primary
        source, the engine keeps what it had, the gap is recorded, and the page carrying it warns
        the reader. A gap closes only against a primary source — a secondary source may cross-check
        a value but may never close it.
      </p>

      <FactTable
        className="mt-6 max-w-[68ch]"
        caption="Unverified items by what would unblock them, as compiled 2026-08-15"
        captionVisible
        rows={GAP_GROUPS.map((row) => ({
          key: `${row.group}. ${row.unblockedBy}`,
          value: String(row.count),
        })).concat([{ key: "Total open items", value: String(GAP_TOTAL) }])}
      />

      <p className="mt-6 max-w-[68ch] text-dim">
        Two of the tools refuse to answer rather than answer badly. Contract generation is blocked
        for any state whose statutory notice text has not been transcribed word for word, because a
        paraphrased statutory notice is not a notice. And a New Jersey assessment verdict is
        withheld when the Director&rsquo;s Ratio that governs the county is unavailable, because
        the ratio is what decides whether the appeal has a case at all. In both places the tool
        says what is missing instead of producing something that looks like an answer.
      </p>

      <h2 className="mt-12">No credentialed reviewer has signed off yet</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        The editorial policy for each section names the review it requires before launch — an
        enrolled agent or CPA for the tax and subsidy engines, a construction attorney for each
        state&rsquo;s contract clause language, working contractors for the pricing data. None of
        those reviews has been completed. Until they are, every affected page carries the warning
        and the numbers are illustrative. Naming this here rather than only in a repository file is
        the point: a reader deciding whether to trust a figure should not have to go looking for
        the caveat.
      </p>

      <h2 className="mt-12">Who is behind it</h2>

      {MAINTAINER ? (
        <>
          <p className="mt-4 max-w-[68ch] text-dim">
            <span className="font-semibold text-ink">{MAINTAINER.name}</span>
            {MAINTAINER.entity ? `, ${MAINTAINER.entity}` : null} — {MAINTAINER.role}.
          </p>
          <p className="mt-3 max-w-[68ch] text-dim">{MAINTAINER.background}</p>
          {MAINTAINER.profileUrl ? (
            <p className="mt-3 max-w-[68ch]">
              <a
                href={MAINTAINER.profileUrl}
                rel="me noopener"
                className={`${link} text-ink`}
              >
                {MAINTAINER.profileUrl}
              </a>
            </p>
          ) : null}
        </>
      ) : null}

      <p className="mt-4 max-w-[68ch] text-dim">
        The verification process that stands behind every figure — what a primary source is
        allowed to be, what a pass over <span className="num">315</span> individual values found,
        and which professional reviews have not yet happened — is set out on{" "}
        <Link href="/authors" className={`${link} text-ink`}>
          who writes and checks this
        </Link>
        .
      </p>

      <p className="mt-4 max-w-[68ch] text-dim">
        {SITE_NAME} is independent. It is not a lender, a servicer, an insurer, a marketplace, a
        payroll provider, a county assessor or a contractor, and none of those pays for placement,
        ranking or mention anywhere on it. No tool recommends a named commercial product, and no
        result changes based on who is reading it.
      </p>

      <h2 className="mt-12">How it is paid for</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        The tools are free and require no account. Planned revenue is advertising, an unbranded
        document upgrade in the trades tool, and clearly labelled software affiliations. None of
        those can reach a computed figure: advertising is served by a network that receives no
        input from the engines, and there is no code path by which a sponsor could alter a ranking,
        a clause list or a recommendation. No advertising runs on the site today.
      </p>

      <h2 className="mt-12">What happens to what you type</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        Nothing you enter is sent to a server, because there is no server to send it to. There is
        no account, no signup wall and no database. Work is saved to your own browser&rsquo;s
        storage, and a shared scenario link carries its numbers in the URL fragment, which browsers
        never transmit. The full detail is in the{" "}
        <Link href="/privacy" className={`${link} text-ink`}>
          privacy notice
        </Link>
        .
      </p>

      <h2 className="mt-12">How to get something corrected</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        Write to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className={`num ${link} text-ink`}>
          {CONTACT_EMAIL}
        </a>
        . A report is checked against the primary source before anything changes; if it holds, the
        rule file is updated, the pages recompute, and the change is recorded in that
        tool&rsquo;s changelog with the date and the source. Corrections are never taken on a
        secondary source, however confident it sounds. What to include, and what this address
        cannot do, is on the{" "}
        <Link href="/contact" className={`${link} text-ink`}>
          contact page
        </Link>
        .
      </p>

      <p className="hairline-t mt-10 max-w-[68ch] pt-6 text-step--1 text-dim">
        These tools produce estimates from published rules. They are not financial, tax or legal
        advice — see the{" "}
        <Link href="/terms" className={`${link} text-ink`}>
          terms and disclaimer
        </Link>
        .
      </p>
    </div>
  );
}
