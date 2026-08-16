import Link from "next/link";
import { formatDate } from "@/lib/paycheck/format";
import { rulesMeta } from "@/lib/paycheck/rules-meta";

/**
 * The paycheck section.
 *
 * `data-section="paycheck"` on the wrapper is the entire theming mechanism: it
 * redefines the six semantic colour tokens for this subtree (globals.css), so
 * every `@fineprint/ui` component below renders in the paystub identity
 * without knowing a section exists. No colour value appears in this tree.
 *
 * Amber here means "money you're about to leave behind" — a deduction going
 * unclaimed. Nothing in this section is irreversible, so nothing in it claims
 * to be.
 */

const SECTION_NAV = [
  { href: "/paycheck", label: "The tool" },
  { href: "/paycheck/occupations", label: "Occupations" },
  { href: "/paycheck/methodology", label: "Methodology" },
  { href: "/paycheck/sources", label: "Sources" },
  { href: "/paycheck/changelog", label: "Changelog" },
  { href: "/paycheck/editorial-policy", label: "Editorial policy" },
  { href: "/paycheck/about", label: "About" },
];

export default function PaycheckLayout({ children }: { children: React.ReactNode }) {
  const meta = rulesMeta();

  return (
    <div data-section="paycheck" className="flex min-h-full flex-col">
      <nav aria-label="Paycheck section" className="hairline-b">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-0 px-4">
          {SECTION_NAV.map((item) => (
            <li key={item.href}>
              {/* min-h-11 clears the 44px touch floor. */}
              <Link
                href={item.href}
                className="rounded-atlas inline-flex min-h-11 items-center text-dim underline-offset-4 hover:text-ink hover:underline"
                style={{ fontSize: "var(--text-step--1)" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* The measure the section was designed at. Its pages carry no container
          of their own — they were written inside one. */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>

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
