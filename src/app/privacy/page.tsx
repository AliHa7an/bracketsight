import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage, type PolicySection } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy and cookies — nothing you enter leaves your browser",
  description:
    "Every calculation runs in your browser: no account, no database, no server-side storage. What is stored, what advertising changes, and how to refuse it.",
  alternates: { canonical: "/privacy" },
};

/**
 * Privacy and cookies.
 *
 * Every disclosure below is the same sentence it was before this page was
 * re-laid-out: the AdSense publisher ID, the two Google policy links, the two
 * opt-out routes, the UK/EU lawful-basis paragraph, the server-log paragraph
 * and the uploaded-document position. Nothing was shortened and nothing was
 * merged. Only the shape changed — see `@/components/layout/PolicyPage`.
 *
 * BUMP `UPDATED` IN THE SAME EDIT that changes any wording below, and rewrite
 * the advertising section on the day advertising actually goes live: it is
 * written in the future tense because that is currently true, and leaving it in
 * the future tense once ads are serving would be a false statement about
 * personal data.
 */
const UPDATED = "2026-08-19";

export default function PrivacyPage() {
  const sections: readonly PolicySection[] = [
    {
      id: "what-you-type",
      heading: "What happens to what I type?",
      children: (
        <p>
          It stays on your own device. Each tool saves your work to your browser&rsquo;s{" "}
          <code>localStorage</code> so you can close the tab and come back, and it is stored under
          a key belonging to that tool. Clearing your browser&rsquo;s site data deletes it. Nobody
          else can read it, including us.
        </p>
      ),
    },
    {
      id: "shared-links",
      heading: "What about the link I can share?",
      children: (
        <p>
          Some tools let you share a scenario as a link. That scenario is encoded in the URL{" "}
          <em>fragment</em> — the part after the <code>#</code> — and browsers never transmit the
          fragment to a server. It is not in our access logs because it never reaches us. Anyone
          you send the link to can read those numbers, so treat the link itself as the private
          thing.
        </p>
      ),
    },
    {
      id: "cookies",
      heading: "Do you use cookies?",
      children: (
        <>
          <p>
            No cookies of our own, and no analytics that identify you. No advertising runs on this
            site today and no ad network&rsquo;s script is loaded on any page — you can confirm
            that by viewing the source of any page and searching it for the word{" "}
            <code>googlesyndication</code>. Nothing will be found.
          </p>
          <p>
            What the site does store, it stores on your own device, and there are only two things:
          </p>
          <ul>
            <li>
              <strong>Your work in a tool.</strong> Written to <code>localStorage</code> under a key
              belonging to that tool, so you can close the tab and come back. It is your own input,
              it is read by nothing except the tool that wrote it, and it is never transmitted.
              This is storage you asked for by using the calculator, so it is not gated behind a
              consent prompt — gating it would break the tool for the sake of a banner.
            </li>
            <li>
              <strong>Your cookie choice.</strong> One entry recording whether you accepted or
              refused advertising cookies, and when. Storing a refusal is the only way to stop
              asking you.
            </li>
          </ul>
          <p>
            Clearing your browser&rsquo;s site data deletes both. Neither reaches a server, because
            there is no server to reach.
          </p>
        </>
      ),
    },
    {
      id: "consent-banner",
      heading: "How the consent banner works",
      children: (
        <>
          <p>
            On a first visit a banner appears at the foot of the page with two choices,{" "}
            <strong>Reject</strong> and <strong>Accept</strong>, in that order, the same size and
            the same weight. Nothing is pre-selected and nothing is hidden behind a &ldquo;manage
            preferences&rdquo; screen. Every page, every tool and every figure on this site works
            identically whichever you choose, because no content here depends on advertising.
          </p>
          <p>
            Until you accept, advertising storage is refused: that is the default, and closing the
            banner with the Escape key or ignoring it leaves the refusal in place. Silence is not
            consent. The banner is served from this site — there is no consent-management vendor,
            no third-party script and no request to anyone else in order to ask you the question.
          </p>
          <p>
            You can change or withdraw the choice at any time from the{" "}
            <strong>Cookie choices</strong> control in the footer of every page, which also shows
            what you currently have set. Withdrawing takes the same single click as giving.
          </p>
        </>
      ),
    },
    {
      id: "advertising",
      heading: "What happens when advertising is enabled?",
      children: (
        <>
          <p>
            The intended provider is Google AdSense, under publisher account{" "}
            <code>pub-1973018352310576</code>. When it is switched on, Google and its partners will
            serve ads here and, like any ad network, will use cookies and similar identifiers to do
            it. This page will be rewritten to say that advertising is live on the day it goes
            live, rather than describing it in the future tense as it does now.
          </p>
          <p>
            Third-party vendors, Google included, use cookies to serve ads based on a user&rsquo;s
            prior visits to this and other websites. Google&rsquo;s use of advertising cookies
            enables it and its partners to serve ads to you based on your visit to this site and
            other sites on the internet. How Google uses the information it collects from sites
            that use its services is set out at{" "}
            <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">
              policies.google.com/technologies/partner-sites
            </a>
            , and its advertising practices at{" "}
            <a href="https://policies.google.com/technologies/ads" rel="noopener">
              policies.google.com/technologies/ads
            </a>
            .
          </p>
          <p>
            You can opt out of personalised advertising by Google at{" "}
            <a href="https://www.google.com/settings/ads" rel="noopener">
              google.com/settings/ads
            </a>
            , and out of a third-party vendor&rsquo;s use of cookies for personalised advertising
            at{" "}
            <a href="https://www.aboutads.info/choices/" rel="noopener">
              aboutads.info/choices
            </a>{" "}
            or, in Europe, at{" "}
            <a href="https://www.youronlinechoices.eu/" rel="noopener">
              youronlinechoices.eu
            </a>
            . Refusing personalisation does not remove the ads; it means they are chosen from the
            content of the page and your approximate location rather than from a profile of you.
          </p>
          <p>
            One thing will not change: an ad network never receives what you type into a tool. Your
            income, balances, assessed values and job costs are computed in your own browser and
            are never sent anywhere, so there is nothing for an advertiser to be given. No result,
            ranking or recommendation changes because of an advertiser, and no ad can be placed
            inside a calculator — the component that reserves ad space refuses to render inside a
            tool panel and throws in development if anyone tries.
          </p>
        </>
      ),
    },
    {
      id: "uk-eu",
      heading: "If you are in the UK or the EU",
      children: (
        <>
          <p>
            The lawful basis for the advertising storage described above is your consent, given
            through the banner, and you may withdraw it at any time from the footer without giving
            a reason and without losing access to anything. The lawful basis for storing your work
            in a tool is that it is necessary to provide the calculator you asked to use.
          </p>
          <p>
            The site holds no account and no profile, so the rights of access, rectification,
            erasure and portability have very little to operate on. The only thing recorded
            server-side is the ordinary web request log described below, which contains an IP
            address and no financial input of any kind; everything else lives on your own device,
            and clearing your site data erases it. If you want to know what a log holds for a given
            date, or want it purged, write to the address below and say so.
          </p>
        </>
      ),
    },
    {
      id: "uploads",
      heading: "Will you ever process a document I upload?",
      children: (
        <p>
          Not today. A planned feature would read a statement or notice you upload to fill the form
          in for you. If it ships, the file will be processed in memory and never written to disk
          or object storage, its contents will never be logged, and the extracted figures will
          always be shown to you for confirmation before anything is calculated. That is a design
          constraint, not a preference.
        </p>
      ),
    },
    {
      id: "collected",
      heading: "What do you collect at all?",
      children: (
        <p>
          Ordinary web server request logs — the page requested, a timestamp, a browser user-agent,
          and an IP address — which are what any web host records in order to serve a page. They
          contain none of your financial inputs.
        </p>
      ),
    },
    {
      id: "contact",
      heading: "How do I ask a question or have something removed?",
      children: (
        <p>
          Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Since we hold nothing that
          identifies you, there is generally nothing to remove — but if you think otherwise, say so
          and we will look.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Privacy notice"
      title="Privacy and cookies"
      standfirst={
        <>
          Every calculator on this site runs entirely in your browser. The numbers you type —
          income, loan balances, assessed values, job costs — are never sent to a server, because
          there is no server to send them to. There is no account, no login and no database.
        </>
      }
      updated={UPDATED}
      stamps={["No advertising live today", "No consent vendor, no third-party script"]}
      sections={sections}
      footnote={
        <>
          See also the <Link href="/terms">terms and disclaimer</Link>, which explain what these
          estimates are and are not.
        </>
      }
    />
  );
}
