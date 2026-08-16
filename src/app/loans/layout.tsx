import Link from "next/link";
import { listRuleCitations } from "@/engines/repayment";

/**
 * The loans section.
 *
 * `data-section="loans"` on the wrapper is the entire theming mechanism: it
 * redefines the six semantic colour tokens for this subtree (globals.css), so
 * every `@/components/ui` component below renders in the ledger identity without
 * knowing a section exists. No colour value appears in this tree.
 *
 * The sub-nav is section-scoped and sits under the site nav: a reader inside
 * the loans tool needs this section's methodology, not the site index of five.
 * It also keeps every trust page two clicks from every other one, which is the
 * internal-linking floor the publish gates ask for.
 */

const SECTION_NAV = [
  { href: "/loans", label: "The tool" },
  { href: "/loans/methodology", label: "Methodology" },
  { href: "/loans/sources", label: "Sources" },
  { href: "/loans/changelog", label: "Changelog" },
  { href: "/loans/editorial-policy", label: "Editorial policy" },
  { href: "/loans/about", label: "About" },
  { href: "/loans/privacy", label: "Your loan data" },
];

export default function LoansLayout({ children }: { children: React.ReactNode }) {
  const citations = listRuleCitations(new Date().toISOString().slice(0, 10));
  const lastVerified = citations
    .flatMap((rule) => rule.citations.map((citation) => citation.lastVerified))
    .sort()
    .pop();

  return (
    <div data-section="loans" className="flex min-h-full flex-col">
      <nav aria-label="Student loans section" className="hairline-b">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-0 px-4">
          {SECTION_NAV.map((item) => (
            <li key={item.href}>
              {/* min-h-11 clears the 44px touch floor — a 17px line of text is
                  a legal link and an unusable one on a phone. */}
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

      <div className="flex-1">{children}</div>

      <div className="hairline-t mt-16">
        <div
          className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-dim"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          {lastVerified ? (
            <p>
              <span className="num">
                Rules verified <time dateTime={lastVerified}>{lastVerified}</time>
              </span>{" "}
              · 34 C.F.R. § 685.209 ·{" "}
              <Link
                href="/loans/methodology"
                className="underline underline-offset-4 hover:text-ink"
              >
                How every plan is simulated →
              </Link>
            </p>
          ) : null}
          <p style={{ maxWidth: "var(--measure)" }}>
            This is an independent decision engine, not your loan servicer and not financial
            or tax advice. Estimates run under current federal rules — confirm any plan
            change with your servicer before acting. Your loan data never leaves your
            browser.
          </p>

          {/* Named specifically rather than as a generic hedge. A reader
              choosing between plans needs to know which of the three figures
              in front of them rests on something unresolved, not that
              "some values are unverified". */}
          <p className="hairline-t pt-3" style={{ maxWidth: "var(--measure)" }}>
            Pre-launch build. Three things here are not fully settled and are worth knowing
            before you act on a ranking. The tax on a forgiven balance is estimated at a flat
            assumed marginal rate, which is a modelling choice and not a regulatory figure — it
            is labelled as an assumption wherever it is used. The eligibility test for PAYE
            models only part of the two-part new-borrower rule, so the engine can show PAYE to a
            borrower a servicer would turn down. And the Tiered Standard step interval is a
            servicer convention rather than a term the regulation prescribes. Each is set out
            on{" "}
            <Link
              href="/loans/methodology"
              className="underline underline-offset-4 hover:text-ink"
            >
              methodology
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
