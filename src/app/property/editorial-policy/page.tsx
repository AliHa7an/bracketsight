import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/property/editorial-policy");

export default function EditorialPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        Editorial policy
      </h1>

      <section className="space-y-3">
        <h2>
          What decides a verdict, and what only explains it?
        </h2>
        <p>
          A deterministic engine decides; prose explains. Comparable selection,
          ratios, dispersion, confidence and the verdict itself are pure
          TypeScript with no dependencies and no network access, computing in
          integer cents so a hearing officer can re-run the arithmetic by hand
          and get the same answer. Content pages are written against the same
          versioned county rules files the engine reads, which is what keeps
          prose and computation from drifting apart. Where a figure appears in a
          sentence on this site, it came from the engine or from a cited rules
          file.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          How rules get onto this site
        </h2>
        <p>
          County rules are encoded from primary sources only — the county
          authority, the state statute, or the state tax court — never from
          another website&apos;s summary. Each rule carries its citation and a
          last-verified date, visible on every{" "}
          <Link href="/property/counties" className="underline underline-offset-2">
            county page
          </Link>
          . A rule we cannot cite does not ship; a rule we have drafted but
          not yet confirmed is labelled &ldquo;awaiting primary-source
          verification&rdquo; until it is.
        </p>
        <p>
          Each county file carries a ruleset version and effective dates, so a
          rule change is a new dated file rather than an edit to code. The
          loader enforces the citation requirement rather than trusting the
          author: a New Jersey Director&apos;s Ratio entry without its own
          citation is rejected outright, which is one reason that table is
          currently empty rather than populated from memory.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          What closes a verification gap?
        </h2>
        <p>
          A primary source that was actually fetched and read. A secondary
          source may cross-check a value; it may never close a gap, and rows
          resting on one stay labelled until the authoritative document is read.
          Where a source is unreachable, the encoded value is left alone and the
          gap is recorded — not quietly improved with a plausible substitute.
          That is why several Cook County values remain flagged: the
          Assessor&apos;s own site could not be read from the verification
          environment at all, so its residential assessment level, its appeal
          fee and its evidence rules are recorded as unresolved rather than
          filled in.
        </p>
        <p>
          The point of the rule is that a county&apos;s own page is authoritative
          for its own procedure, and only for that. Bergen County&apos;s FAQ
          gives <span className="num">$750,000</span> as the threshold for filing
          directly with the Tax Court; the Division of Taxation&apos;s handbook
          gives <span className="num">$1,000,000</span> for a regular valuation
          appeal, and the county figure is the separate added-and-omitted
          threshold. The engine carries <span className="num">$1,000,000</span>.
          Being a county source does not make a statement right about a state
          statute.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Where AI is used — and where it never is
        </h2>
        <p>
          The calculation engine contains no AI: comparable selection, ratios,
          confidence, and verdicts are deterministic statistics, unit-tested,
          with zero network access. AI is never permitted to compute a value,
          select a comparable, or decide a verdict. In later phases AI may
          help read documents you upload (always behind a review screen you
          confirm) and draft narrative text (with every number validated
          against the engine&apos;s output). Nothing you enter in the checker
          today leaves your browser.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Corrections
        </h2>
        <p>
          Found a wrong deadline, fee, or formula? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
          . Confirmed errors are fixed in the rules data, noted in the{" "}
          <Link href="/property/changelog" className="underline underline-offset-2">
            changelog
          </Link>{" "}
          within <span className="num">48</span> hours, and the affected pages
          update automatically. A wrong number here can cost a real person a
          real appeal window — we treat corrections as the highest-priority work
          there is.
        </p>
        <p>
          Corrections are published rather than quietly applied, including the
          embarrassing ones. Bergen&apos;s filing fee shipped as a flat{" "}
          <span className="num">$25</span> when the statutory schedule runs to{" "}
          <span className="num">$150</span>, and the fee is verdict-affecting
          because estimated savings are compared against it — a home above{" "}
          <span className="num">$1,000,000</span> assessed was being quoted a
          fee six times too low. Both New Jersey appeal form links returned{" "}
          <span className="num">404</span>. Both were fixed on{" "}
          <span className="num">15 August 2026</span> and recorded with what
          changed and why.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Funding and independence
        </h2>
        <p>
          Bracketsight plans to earn revenue from advertising on content pages,
          a one-time paid appeal packet, and clearly labelled referrals to
          contingency services for counties we do not yet cover. None of these
          influence a verdict: the engine has no knowledge of monetization,
          takes no input from it, and an honest &ldquo;not worth filing&rdquo;
          is the product&apos;s core promise. Ads never appear inside the tool.
          The incentive runs the wrong way on purpose — the tool tells most
          users their assessment looks fair, and refuses to give a New Jersey
          verdict at all, neither of which is the revenue-maximising answer.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Who has reviewed the county playbooks?
        </h2>
        <p>
          Nobody yet. Launch policy requires a named, credentialed property-tax
          consultant or attorney to review the methodology and every county
          playbook, and no such reviewer is engaged today. The verification pass
          that produced the citations on this site checked whether encoded
          values match their cited sources — a much narrower question than
          whether a county playbook is legally sufficient to act on. Until that
          review is complete, this site is a pre-launch build and says so — see{" "}
          <Link href="/property/about" className="underline underline-offset-2">
            about
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          How often is each rule re-checked?
        </h2>
        <p>
          On the cadence each publisher actually keeps. New Jersey&apos;s
          Chapter <span className="num">123</span> average ratios are
          republished every <span className="num">1 April</span> and must be
          re-pulled annually. Cook County&apos;s township open and close
          calendars are republished each session, so a deadline verified last
          year proves nothing about this one. New Jersey&apos;s filing-fee tiers
          and its Tax Court threshold change only by statute. Form revision
          codes change without notice, which is why the PDF links are re-fetched
          each year rather than assumed — two of them were already dead when
          they were last checked.
        </p>
      </section>
    </div>
  );
}
