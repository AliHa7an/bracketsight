import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/loans/privacy");

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">How your loan data is handled</h1>
        <p className="text-dim mt-1">
          Effective 8 Aug 2026. This page covers the student loan tool specifically — the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            site privacy policy
          </Link>{" "}
          covers everything else.
        </p>
      </header>

      <section aria-labelledby="p-data">
        <h2 id="p-data" className="mb-2">
          Your loan data never leaves your browser
        </h2>
        <p>
          The simulation runs entirely client-side. Your loans, income, household details, and
          results are stored in your browser&apos;s localStorage under the key{" "}
          <span className="num">bracketsight.loans.scenario.v1</span> — on your device, under your
          control — and nowhere else. There are no accounts, no server-side database, and no
          transmission of your financial details to us or anyone. Clearing your browser
          storage erases everything.
        </p>
      </section>

      <section aria-labelledby="p-keys">
        <h2 id="p-keys" className="mb-2">Which storage keys does this tool write?</h2>
        <p>
          Two, and both are readable in your browser&apos;s developer tools if you want to check.{" "}
          <span className="num">bracketsight.loans.scenario.v1</span> holds the scenario
          currently in the form and is rewritten on every change.{" "}
          <span className="num">bracketsight.pins.v1</span> holds the scenarios you pin for
          comparison, capped at <span className="num">6</span>. One further key is read but never
          written: <span className="num">atlas.scenario.v1</span>, the name this tool used before
          the five calculators moved onto one domain, so a scenario saved under the old name is
          not lost. The next change writes it back under the current key.
        </p>
        <p className="mt-2">
          Every key is namespaced and versioned on purpose. Namespaced, because five tools now
          share one browser origin and must not read each other&apos;s state. Versioned, because
          a stored shape that changes should orphan old data rather than misread it — a wrong
          scenario is worse than no scenario.
        </p>
      </section>

      <section aria-labelledby="p-share">
        <h2 id="p-share" className="mb-2">Share links</h2>
        <p>
          The address bar carries your scenario after the <span className="num">#</span> — in
          the URL <em>fragment</em>, which browsers never send to a server. Copy the address
          and the recipient&apos;s browser re-runs the same simulation; the balances and income
          in it reached no server on the way. Anyone with the link can read those inputs, so
          share it as you would the numbers themselves.
        </p>
        <p className="mt-2">
          The fragment rather than a query string is the whole point. A query string travels to
          the server in the request line and lands in ordinary web-server logs; a fragment is
          stripped by the browser before the request is sent. &ldquo;Your loan data never leaves
          your browser&rdquo; has to be true in the network tab, not only in the copy on this
          page. Links minted with a <span className="num">?s=</span> query parameter before that
          change still decode, so nobody&apos;s saved link broke.
        </p>
      </section>

      <section aria-labelledby="p-link-contents">
        <h2 id="p-link-contents" className="mb-2">What exactly is in a share link?</h2>
        <p>
          Everything you typed into the three steps, and nothing else: each loan&apos;s balance,
          interest rate, type and first disbursement date; your AGI, filing status, family size
          and dependents claimed; and your PSLF answer with any prior qualifying payment count.
          It is compacted into a positional format and base64url-encoded, which makes the link
          shorter — it is not encryption, and it is not meant to be. Treat the link as the
          private thing.
        </p>
        <p className="mt-2">
          The format carries a version number. A link produced by a future version of the tool
          decodes to nothing and the form falls back to the example borrower, rather than
          decoding into numbers that are subtly not yours. The fragment is rewritten on a short
          delay after you stop typing, so a burst of keystrokes leaves one history entry rather
          than forty.
        </p>
      </section>

      <section aria-labelledby="p-not-held">
        <h2 id="p-not-held" className="mb-2">What is not held anywhere?</h2>
        <p>
          There is no account, so there is no email address, name, password or profile. The tool
          never asks for a Social Security number, a servicer login, a loan account number or a
          date of birth, and no field exists to type one into. It does not connect to
          StudentAid.gov or to any servicer, so it cannot retrieve your real balances and cannot
          send anything to them either.
        </p>
        <p className="mt-2">
          This is structural rather than a policy. The calculation engine has zero dependencies
          and makes no network calls of any kind, so there is no endpoint that could receive a
          balance even by mistake. There is no database in this version of the site for anything
          to be written to.
        </p>
      </section>

      <section aria-labelledby="p-uploads">
        <h2 id="p-uploads" className="mb-2">Future document upload</h2>
        <p>
          A planned feature will read a StudentAid.gov summary you upload. When it ships,
          files will be processed in memory and never written to disk, object storage, or
          logs — the privacy promise is part of the product, and it is enforced in code.
        </p>
        <p className="mt-2">
          Two further constraints are already designed and will ship with it. The extracted loan
          table is always shown to you for confirmation before anything is simulated — at every
          confidence level, with no &ldquo;looks right, skip this&rdquo; path — so a
          misread balance is caught by you rather than acted on. And no figure read out of a
          document is ever presented as a result: the confirmed table is fed to the same
          deterministic engine that runs when you type the numbers in by hand. Nothing about the
          feature is live today, and this page will say so on the day it is.
        </p>
      </section>

      <section aria-labelledby="p-analytics">
        <h2 id="p-analytics" className="mb-2">Analytics</h2>
        <p>
          If we add analytics, they will measure page performance and feature use only. Your
          AGI, balances, and results are never sent to an analytics provider — at most,
          coarse bucketed ranges. No advertising identifiers are attached to tool inputs.
        </p>
        <p className="mt-2">
          No advertising runs on this site today and no ad network script is loaded on any page.
          When advertising is switched on, one thing will not change: an ad network cannot
          receive what you type here, because it never leaves your browser and there is nothing
          to hand over. No ad slot sits inside the tool, where it could be mistaken for part of
          a result. The{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            site privacy policy
          </Link>{" "}
          sets out the advertising position in full.
        </p>
      </section>

      <section aria-labelledby="p-questions">
        <h2 id="p-questions" className="mb-2">How do I have my data removed?</h2>
        <p>
          Clear your browser&apos;s site data for this domain, and it is gone — there is no
          server copy to restore it from, and nothing was ever sent to be deleted. If you shared
          a scenario link, delete the message containing it; the numbers live in the link itself,
          not in an account we could close. Questions to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
