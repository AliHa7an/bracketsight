import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/aca/editorial-policy");

export default function EditorialPolicyPage() {
  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Editorial policy</h1>

      <section className="space-y-2">
        <h2>What decides a number here, and what only explains it?</h2>
        <p className="text-ink">
          A dependency-free TypeScript engine decides; prose explains. Money is
          held in integer cents and rates in basis points, so no floating-point
          drift can reach a result, and the calculation path has no AI, no
          network access and no third-party packages in it. Content pages are
          written against the same versioned rules files the engine reads, which
          is what stops the prose and the arithmetic from drifting apart. If a
          sentence on this site states a figure, the figure came out of the
          engine or out of a cited rules file — never out of a language model.
        </p>
      </section>

      <section className="space-y-2">
        <h2>How does a rule get onto this site?</h2>
        <p className="text-ink">
          Every rule is encoded from a primary source — statute, regulation, IRS
          guidance, or an HHS publication — never from a blog or a
          competitor&apos;s calculator. Each rules file carries its citations
          and a last-verified date, published on{" "}
          <Link href="/aca/sources" className="underline underline-offset-4">
            /sources
          </Link>
          . A rule we cannot cite does not ship.
        </p>
        <p className="text-ink">
          Rules are also dated rather than constant. Each file records an
          effective range and a ruleset version, so a change in the law is a new
          dated file rather than an edit to code. That is not a stylistic
          preference: when Pub. L. <span className="num">119-21</span> §<span className="num">71305</span>{" "}
          struck the advance-credit repayment cap for tax years after{" "}
          <span className="num">31 December 2025</span>, the fix was to record
          in data that no limitation is in effect — and the reconciliation code
          now refuses to run at all if a future ruleset claims a cap exists but
          ships no bands, rather than reaching an uncapped answer by accident.
        </p>
      </section>

      <section className="space-y-2">
        <h2>What closes a verification gap?</h2>
        <p className="text-ink">
          A primary source, fetched and read — nothing else. A secondary source
          may cross-check a value but may never close a gap, and any row resting
          on one is labelled as secondary until the authoritative document is
          read. Where a source could not be reached, the value is left alone and
          the gap is recorded rather than quietly improved: no row in the
          register carries a guessed figure or a plausible-looking substitute.
          Closing a gap means editing the code and the register entry together;
          deleting a row without a fetched URL and a verification date does not
          count.
        </p>
        <p className="text-ink">
          One episode explains why the bar is set there. While the
          applicable-percentage table was being checked, a summarising fetch
          layer misreported Rev. Proc. <span className="num">2025-25</span> as
          &ldquo;<span className="num">2025-21</span>&rdquo; and returned a
          completely fabricated percentage table. The engine&apos;s table was
          already correct, and trusting that summary would have turned a right
          answer into garbage. Every figure is therefore read from extracted PDF
          or statute text, never from a summary of one.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Who has reviewed the tax logic?</h2>
        <p className="text-ink">
          Nobody yet, and that is a launch blocker rather than a detail.
          Bracketsight launches only with a named enrolled agent or CPA
          reviewing the subsidy and tax logic and the content built on it. No
          such reviewer is engaged for this section today. A verification pass
          checked whether encoded values match their cited sources, which is a
          much narrower question than whether the output is sound tax advice —
          and nothing published here substitutes for that review. When it
          happens, this page will carry the reviewer&apos;s name, credential and
          review dates. Until then the site says it is a pre-launch build,
          everywhere it matters.
        </p>
      </section>

      <section className="space-y-2">
        <h2>How are corrections handled?</h2>
        <p className="text-ink">
          Errors are corrected within <span className="num">48</span> hours of
          confirmation, logged on the{" "}
          <Link href="/aca/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          with what changed and why, and affected pages carry updated
          verification dates. Report an error to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          ; a wrong threshold on a cliff page can cost a household its entire
          credit, so corrections outrank features. A correction that changes a
          number also re-derives the affected tests by hand, from the authority,
          rather than snapshotting whatever the engine now prints.
        </p>
      </section>

      <section className="space-y-2">
        <h2>How is the site funded, and can that reach a number?</h2>
        <p className="text-ink">
          Bracketsight plans to earn from clearly separated display advertising
          and an optional paid planning PDF — never from insurance commissions.
          We do not sell or recommend specific insurance plans, we are not a
          brokerage, and no revenue source can influence a computed result: the
          engine has no knowledge of monetization, takes no input from it, and
          would produce the same figure with every ad slot removed. Any future
          enrollment-partner affiliation will be disclosed on the page where it
          appears, at equal visual weight.
        </p>
      </section>

      <section className="space-y-2">
        <h2>How often is each rule re-checked?</h2>
        <p className="text-ink">
          On the schedule the publishers actually keep. HHS poverty guidelines
          arrive in mid-January and drive the following coverage year; HSA
          limits around May; the §<span className="num">36B</span>{" "}
          applicable-percentage table in mid-summer; retirement and IRA
          cost-of-living figures around October; the CMS marketplace public use
          files for the next plan year around October and November; Medicaid
          expansion status quarterly. Legislation amending §<span className="num">36B</span>{" "}
          is watched continuously, because that is the failure mode this
          discipline exists for — the verification pass found a repayment cap
          that Congress had already repealed underneath a rules file nobody was
          watching. Indexed values drift predictably; statutory structure does
          not.
        </p>
      </section>

      <section className="space-y-2">
        <h2>What we never publish</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>AI-generated numbers or auto-published AI content.</li>
          <li>Outcome promises — everything is an estimate under current rules.</li>
          <li>Advice to time income — that conversation belongs with your tax professional.</li>
          <li>
            A figure without its source. Sample or placeholder data stays
            labelled as sample data on every surface it reaches.
          </li>
        </ul>
      </section>
    </article>
  );
}
