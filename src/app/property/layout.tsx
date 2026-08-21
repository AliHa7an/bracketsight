import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { counties } from "@/engines/property";
import { SectionRail } from "@/components/tool/SectionRail";

/**
 * The property-tax section — "the plat book".
 *
 * `data-section="property"` is the whole theme switch: `globals.css` redefines
 * the six semantic colour tokens for this subtree and nothing else moves. No
 * colour values live in this file, and no per-section stylesheet is imported.
 *
 * The section footer exists for the same reason the loans and paycheck ones
 * do, and it was the last of the five to get one. This section returns a
 * verdict — file, or do not bother — and the dollar figure that verdict is
 * gated on multiplies through a per-county tax-rate constant that
 * `VERIFICATION-STATUS.md` records as unresolved for both covered counties.
 * A confidence meter on the comparables says nothing about that, because the
 * uncertainty is in the rate, not the comps. Saying so on every page in the
 * section is the only honest way to show the figure at all.
 */

export const metadata: Metadata = {
  title: {
    default: "Property Tax Assessment Check — Is Your Home Over-Assessed?",
    template: "%s · Property tax · Bracketsight",
  },
  description:
    "Compare your assessment against comparable homes using the median-ratio statistics assessors use, then get your county's deadline, fee and forms. Free.",
};

export default function PropertySectionLayout({ children }: { children: ReactNode }) {
  return (
    <div data-section="property" className="flex min-h-full flex-1 flex-col">
      <SectionRail section="property" label="Property tax section" />

      <div className="flex-1">{children}</div>

      <div className="hairline-t mt-16">
        <div
          className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-dim"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <p>
            <span className="num">{counties.length}</span> counties encoded ·{" "}
            <Link
              href="/property/methodology"
              className="underline underline-offset-4 hover:text-ink"
            >
              How the verdict is reached →
            </Link>{" "}
            ·{" "}
            <Link href="/property/counties" className="underline underline-offset-4 hover:text-ink">
              Which counties are covered →
            </Link>{" "}
            ·{" "}
            <Link href="/property/sources" className="underline underline-offset-4 hover:text-ink">
              Every rule and its source →
            </Link>
          </p>

          <p style={{ maxWidth: "var(--measure)" }}>
            This is an independent estimate engine. It is not your county assessor, not an
            appraisal and not legal or tax advice. Deadlines and fees are strict and set locally —
            confirm both with your county before you rely on them. Nothing you enter leaves your
            browser.
          </p>

          <p className="hairline-t pt-3" style={{ maxWidth: "var(--measure)" }}>
            Pre-launch build. The estimated annual overpayment, and the filing-fee comparison the
            verdict is gated on, multiply through a per-county property tax rate that has not been
            verified against a primary source for either county — so treat the dollar figure as
            illustrative of the method and the ranking, not as what you would recover. Several Cook
            County values remain unresolved because the Assessor&rsquo;s site is unreachable from
            the verification environment, and a New Jersey verdict is withheld entirely when the
            governing Director&rsquo;s Ratio is unavailable, which today is every New Jersey
            municipality. What is verified and what is not is listed on{" "}
            <Link href="/property/sources" className="underline underline-offset-4 hover:text-ink">
              sources
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
