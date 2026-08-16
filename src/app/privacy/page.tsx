import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy — Nothing You Enter Leaves Your Browser",
  description:
    "Every calculation runs in your browser. No account, no database, no server-side storage of what you type. What that means in practice, and the two exceptions.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1>Privacy</h1>

      <div className="density-reading mt-6">
        <p>
          Every calculator on this site runs entirely in your browser. The numbers you
          type — income, loan balances, assessed values, job costs — are never sent to a
          server, because there is no server to send them to. There is no account, no
          login and no database.
        </p>

        <h2>What happens to what I type?</h2>
        <p>
          It stays on your own device. Each tool saves your work to your browser&rsquo;s{" "}
          <code className="num">localStorage</code> so you can close the tab and come
          back, and it is stored under a key belonging to that tool. Clearing your
          browser&rsquo;s site data deletes it. Nobody else can read it, including us.
        </p>

        <h2>What about the link I can share?</h2>
        <p>
          Some tools let you share a scenario as a link. That scenario is encoded in the
          URL <em>fragment</em> — the part after the <span className="num">#</span> — and
          browsers never transmit the fragment to a server. It is not in our access logs
          because it never reaches us. Anyone you send the link to can read those numbers,
          so treat the link itself as the private thing.
        </p>

        <h2>Do you use cookies?</h2>
        <p>
          We set no cookies of our own and run no analytics that identify you. No
          advertising runs on this site today, and no ad network&rsquo;s script is loaded
          on any page &mdash; you can confirm that by viewing the page source. The section
          below sets out what changes if advertising is switched on, so it is on the
          record before it happens rather than after.
        </p>

        <h2>What happens when advertising is enabled?</h2>
        <p>
          The intended provider is Google AdSense. When it is switched on, Google and its
          partners will serve ads on this site and, like any ad network, they use cookies
          and similar identifiers to do it. This page will be updated to say that
          advertising is live on the day it goes live, rather than describing it in the
          future tense as it does now.
        </p>
        <p>
          Third-party vendors, Google included, use cookies to serve ads based on a
          user&rsquo;s prior visits to this and other websites. Google&rsquo;s use of
          advertising cookies lets it and its partners serve ads based on your visits to
          this site and other sites on the internet.
        </p>
        <p>
          You can turn off personalised advertising for Google at{" "}
          <a
            className="text-ink underline underline-offset-2"
            href="https://www.google.com/settings/ads"
            rel="noopener"
          >
            google.com/settings/ads
          </a>
          , and opt out of a third-party vendor&rsquo;s use of cookies for personalised
          advertising at{" "}
          <a
            className="text-ink underline underline-offset-2"
            href="https://www.aboutads.info/choices/"
            rel="noopener"
          >
            aboutads.info/choices
          </a>
          . Ads that are not personalised still appear; they are chosen from the page
          content and your general location rather than from a profile.
        </p>
        <p>
          One thing will not change: an ad network never receives what you type into a
          tool. Your income, balances, assessed values and job costs are computed in your
          own browser and are never sent anywhere, so there is nothing for an advertiser to
          be given. No result, ranking or recommendation changes because of an advertiser,
          and no ad slot sits inside a calculator where it could be mistaken for part of
          the tool.
        </p>

        <h2>Will you ever process a document I upload?</h2>
        <p>
          Not today. A planned feature would read a statement or notice you upload to fill
          the form in for you. If it ships, the file will be processed in memory and never
          written to disk or object storage, its contents will never be logged, and the
          extracted figures will always be shown to you for confirmation before anything
          is calculated. That is a design constraint, not a preference.
        </p>

        <h2>What do you collect at all?</h2>
        <p>
          Ordinary web server request logs — the page requested, a timestamp, a browser
          user-agent, and an IP address — which are what any web host records in order to
          serve a page. They contain none of your financial inputs.
        </p>

        <h2>How do I ask a question or have something removed?</h2>
        <p>
          Write to{" "}
          <a className="text-ink underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . Since we hold nothing that identifies you, there is generally nothing to
          remove — but if you think otherwise, say so and we will look.
        </p>

        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          See also the{" "}
          <Link className="text-ink underline underline-offset-2" href="/terms">
            terms and disclaimer
          </Link>
          , which explain what these estimates are and are not.
        </p>
      </div>
    </div>
  );
}
