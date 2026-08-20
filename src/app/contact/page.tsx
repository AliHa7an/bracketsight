import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, DISCLAIMER, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — report a wrong figure or a changed rule",
  description:
    "Email a correction, a rule that has changed, or a figure that looks wrong. Every report is checked against the primary source and the fix is logged in the changelog.",
  alternates: { canonical: "/contact" },
};

/**
 * Contact.
 *
 * One reachable address, rendered as visible text as well as a mailto: link —
 * an address hidden behind a button is not a contact method a reviewer (or a
 * screen reader) can find. No form: a form that posts nowhere is worse than no
 * form, and this site has no server to post it to.
 */

const WRITE_ABOUT: readonly { heading: string; body: string }[] = [
  {
    heading: "A figure that looks wrong",
    body: "Send the inputs you used and the number you expected. Nothing you type into a tool is stored here, so the inputs are the only way to reproduce what you saw. A reproducible case is fixed faster than a description.",
  },
  {
    heading: "A rule that has changed",
    body: "A new poverty guideline, a revised phase-out threshold, a county deadline that moved, a statute amended. A link to the primary source — the regulation, the notice, the county page — is the whole message.",
  },
  {
    heading: "A rule that is missing",
    body: "A state clause, a county, an occupation code or an edge case the engine does not model yet. Say which one and what it should do.",
  },
  {
    heading: "Anything else",
    body: "Press, licensing, a broken page, an accessibility problem. Accessibility reports go to the front of the queue.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="max-w-[24ch]">Report a wrong figure or a rule that changed</h1>

      <p className="mt-4 max-w-[68ch] text-step-1">
        Email{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="num rounded-atlas text-ink underline decoration-signal decoration-2 underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>
        . It is a real address, read by the person who maintains the rule sets, and it is the only
        way to reach {SITE_NAME}.
      </p>

      <p className="mt-4 max-w-[68ch] text-dim">
        Every correction is checked against the primary source — the regulation, the IRS notice,
        the HHS guideline, the county assessor's own page — before anything changes. If the report
        holds, the rule file is updated, the pages that depend on it recompute, and the change is
        recorded in that tool's changelog with the date and the source. A correction is never taken on a secondary source, however
        confident it sounds.
      </p>

      <h2 className="mt-12">What should you write about?</h2>

      <dl className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        {WRITE_ABOUT.map((item) => (
          <div key={item.heading} className="min-w-0">
            <dt className="font-semibold text-ink">{item.heading}</dt>
            <dd className="mt-1 max-w-[56ch] text-step--1 text-dim">{item.body}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12">What this address cannot do</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        No one here can look up your account, change your repayment plan, file your appeal, submit
        your return or speak to your servicer, employer, insurer or county on your behalf. There is
        no login to reset, because there are no accounts. Do not send account numbers, Social
        Security numbers, or loan or policy documents — they are not needed to fix a figure, and
        nothing sent by email can be processed under the no-storage promise the tools run on.
      </p>

      <h2 className="mt-12">Who is on the other end?</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        {SITE_NAME} is independent — not a lender, servicer, insurer, marketplace, payroll
        provider, county or contractor, and none of those pays for placement anywhere on it. How a
        rule gets from a regulation into a number here, how the site is funded, and which figures
        are still recorded as unverified are all set out on the{" "}
        <Link href="/about" className="rounded-atlas underline underline-offset-4 hover:text-ink">
          about page
        </Link>
        , and the verification process itself — including the reviews that have not happened yet
        — on{" "}
        <Link href="/authors" className="rounded-atlas underline underline-offset-4 hover:text-ink">
          who writes and checks this
        </Link>
        .
      </p>

      <h2 className="mt-12">What happens after you send it</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        A report about a figure is reproduced first: the inputs you sent are run through the same
        engine you used, and the result is compared with what you saw. If they differ, the bug is
        in the application; if they match, the question moves to the rule file behind the figure
        and the document that rule cites. Either way the answer names the document that was read
        and what it said, so a report that turns out to be wrong still tells you why.
      </p>

      <p className="mt-4 max-w-[68ch] text-dim">
        A confirmed rule change is a smaller job than it sounds, and deliberately so. The value
        lives in one versioned file with its citation and its verification date; editing that file
        moves every page that depends on it at the next build, and the change is written into the
        relevant changelog with the date and the source. Nothing has to be hunted through prose,
        which is the reason corrections here are measured in hours rather than release cycles.
      </p>

      <p className="hairline-t mt-8 max-w-[68ch] pt-6 text-step--1 text-dim">{DISCLAIMER}</p>

      <p className="mt-6">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-atlas px-4 font-medium text-paper"
          style={{ background: "var(--ink)", borderRadius: "var(--radius-atlas)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
            <path d="m2 4.5 6 4 6-4" />
          </svg>
          Email {CONTACT_EMAIL}
        </a>
      </p>

      {/* No dead ends. A reader who arrived here to check whether the site is
          answerable has two better next steps than the back button: the record
          of what is already known to be unverified, and the log of what has
          been corrected. Both answer "is anyone maintaining this?" without an
          email round trip. */}
      <p className="hairline-t mt-8 max-w-[68ch] pt-6 text-dim">
        Before you write: the{" "}
        <Link
          href="/about"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          register of unverified items
        </Link>{" "}
        may already list what you found, and each section keeps its own changelog of
        corrections —{" "}
        <Link
          href="/loans/changelog"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          student loans
        </Link>
        ,{" "}
        <Link
          href="/paycheck/changelog"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          paycheck
        </Link>
        ,{" "}
        <Link
          href="/aca/changelog"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          health cover
        </Link>
        ,{" "}
        <Link
          href="/property/changelog"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          property tax
        </Link>{" "}
        and{" "}
        <Link
          href="/trades/changelog"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          trades
        </Link>
        . Terms the tools use are defined in the{" "}
        <Link
          href="/glossary"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        >
          glossary
        </Link>
        .
      </p>
    </div>
  );
}
