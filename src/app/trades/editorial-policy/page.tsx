import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/trades/editorial-policy");

export default function EditorialPolicyPage() {
  return (
    <article className="density-reading mx-auto px-4 py-6">
      <h1>Editorial policy</h1>

      <h2>What decides, what explains</h2>
      <p>
        Every number on this site is computed by a deterministic engine from versioned,
        cited rules files. No AI computes prices, selects contract clauses, or writes legal
        language. Content pages are drafted by humans against the same rules files the
        engine uses, so prose and computation cannot drift apart.
      </p>
      <p>
        The separation is enforced rather than promised. Money is held in integer cents and
        rates in basis points; a deposit cap of one-third is evaluated as exact integer
        thirds rather than as <span className="num">33%</span>, because on a{" "}
        <span className="num">$9,000</span> job the difference between the two is{" "}
        <span className="num">$30</span> of lawful deposit. Clause selection is a small
        trigger grammar evaluated against the job facts, and an expression the engine does
        not recognise throws an error instead of being interpreted charitably. Where a rule
        is not fully known, the engine produces nothing rather than something plausible.
      </p>

      <h2>How does a rule get onto this site?</h2>
      <p>
        From the statute, into a dated rules file, with a citation. Each state file carries a
        ruleset version and an effective date, so a legislative change is a new file rather
        than an edit to code, and each required clause records whether its wording is drafted
        or prescribed by statute. The loader enforces that distinction: a clause whose wording
        is prescribed must carry the URL to transcribe from, and is rejected if it carries any
        text at all. That rule exists because a paraphrase sitting in a text field is a
        paraphrase that gets rendered into a contract and signed.
      </p>

      <h2>What closes a verification gap?</h2>
      <p>
        A primary source — the state&apos;s own text — fetched and read. A secondary source
        may cross-check a value but may never close a gap, and rows resting on one stay
        labelled until the authoritative document is read. That distinction is live here:
        California and New York were verified against the states&apos; own legislative sites,
        while Texas, Florida and Pennsylvania rest entirely on secondary hosts because the
        state legislature sites could not be reached. Prescribed notice wording gets a
        stricter rule still — it is transcribed character-for-character from the statute, never
        paraphrased, summarised, or reconstructed from recall. Nine notices across four states
        are outstanding for exactly that reason, and those states generate no contract until
        the text exists. The open items are listed on{" "}
        <Link href="/trades/sources" className="underline underline-offset-4">
          sources
        </Link>
        .
      </p>

      <h2>Who has reviewed the clause language and the pricing?</h2>
      <p>
        Nobody has, and both reviews are launch gates rather than aspirations. The pricing
        data must be sanity-checked by two working contractors, and each state&apos;s contract
        clause language must be signed off by a construction attorney before it loses its
        unverified marker. Neither review is engaged today. What has happened is narrower: a
        verification pass checked whether encoded values and citations match their sources,
        which is not the same question as whether a generated contract is legally sufficient
        or a price is what the work actually costs. Until both gates are passed, every page
        and every generated document carries the warning, and reviewer names and credentials
        will be published on the{" "}
        <Link href="/trades/about" className="underline underline-offset-4">
          about
        </Link>{" "}
        page when they are secured.
      </p>

      <h2>Corrections</h2>
      <p>
        A wrong number is fixed within <span className="num">48</span> hours of confirmation,
        with a dated entry in the{" "}
        <Link href="/trades/changelog" className="underline underline-offset-4">
          changelog
        </Link>{" "}
        naming what changed and why. Rules data is never silently edited. Report an error to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <p>
        Corrections are published even when they are unflattering. The Pennsylvania
        down-payment cap was cited to a subsection that contains no down-payment limit at all,
        and now cites the prohibited-acts section that actually imposes it. Its trigger fired
        on any deposit above <span className="num">33%</span> of the price, which was wrong in
        both directions: the statutory cap applies only to contracts over{" "}
        <span className="num">$5,000</span>, and it is one-third of the price{" "}
        <em>plus</em> the cost of special-order materials, so the old trigger raised false
        alarms on every job with special-order materials. The clause prose had been right the
        whole time; the machine-readable trigger beside it disagreed with it.
      </p>

      <h2>Funding disclosure</h2>
      <p>
        Bracketsight is free and requires no signup. Planned revenue — advertising,
        unbranded-document upgrades, and clearly labeled software affiliations — never
        influences a computed estimate, a clause selection, or a recommendation. It cannot:
        the engine has no knowledge of monetization and takes no input from it, and clause
        selection is decided entirely by the statute and the job facts. The commercially
        inconvenient behaviour is the proof — four of five states currently produce no
        contract, which is the opposite of what a revenue-maximising rule would do.
      </p>

      <h2>How often is each ruleset re-checked?</h2>
      <p>
        All five state statutes are re-verified annually, and again after any legislative
        session in which a consumer-protection or lien bill passes — statutes change by
        session, not by calendar. Some details drift faster than the statute: Florida&apos;s
        recovery-fund contact information is set by board rule and can change with no
        statutory amendment at all. The federal wage series that will anchor labor rates
        republishes annually each spring on a May reference date, so the release year is
        recorded alongside every figure. Pricing rulesets carry their own staleness window and
        flag every estimate they produce once it lapses.
      </p>
    </article>
  );
}
