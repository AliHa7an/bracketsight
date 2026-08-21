import Link from "next/link";
import { formatDate } from "@/lib/paycheck/format";
import { rulesMeta } from "@/lib/paycheck/rules-meta";
import { SectionRail } from "@/components/tool/SectionRail";

/**
 * The paycheck section.
 *
 * `data-section="paycheck"` on the wrapper is the entire theming mechanism: it
 * redefines the six semantic colour tokens for this subtree (globals.css), so
 * every `@/components/ui` component below renders in the paystub identity
 * without knowing a section exists. No colour value appears in this tree.
 *
 * Amber here means "money you're about to leave behind" — a deduction going
 * unclaimed. Nothing in this section is irreversible, so nothing in it claims
 * to be.
 */

export default function PaycheckLayout({ children }: { children: React.ReactNode }) {
  const meta = rulesMeta();

  return (
    <div data-section="paycheck" className="flex min-h-full flex-col">
      <SectionRail section="paycheck" label="Paycheck section" />

      {/*
        NO CONTAINER HERE ANY MORE. The section used to supply one measure for
        all seven of its pages, which meant the tool page could not lay out a
        band of its own — a masthead and an ink verdict inside a 64rem column
        with 16px of padding are a box, not a band. Every other page in the
        section now carries the same `max-w-5xl px-4 py-8` it was written
        inside, stated on its own root element, which is what /loans, /aca and
        /property already did.
      */}
      <div className="flex-1">{children}</div>

      <div className="hairline-t mt-16">
        <div
          className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-dim"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <p>
            <span className="num">
              Rules verified{" "}
              <time dateTime={meta.lastVerified}>{formatDate(meta.lastVerified)}</time>
            </span>{" "}
            · P.L. 119-21 (OBBBA) ·{" "}
            <Link
              href="/paycheck/methodology"
              className="underline underline-offset-4 hover:text-ink"
            >
              How every deduction is computed →
            </Link>
          </p>

          <p style={{ maxWidth: "var(--measure)" }}>
            This is an independent estimate engine, not tax advice and not your
            employer&apos;s payroll department. Every rule is cited on Sources and every
            formula is on Methodology. Confirm your numbers before you file. What you type
            stays in your browser.
          </p>

          {meta.unverified.length > 0 ? (
            <p className="hairline-t pt-3">
              Pre-launch build: <span className="num">{meta.unverified.length}</span> rule
              files still carry placeholder values pending IRS primary-source verification.
              Figures are illustrative until they clear.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
