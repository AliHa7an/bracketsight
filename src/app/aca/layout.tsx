import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getRules } from "@/engines/aca";
import { SectionRail } from "@/components/tool/SectionRail";

/**
 * The ACA section — "the clinical margin".
 *
 * The wrapper's `data-section="aca"` attribute is the entire theming
 * mechanism. `globals.css` redefines the six semantic colour tokens
 * (`--paper --ink --rule --dim --signal --flag`) for this subtree, so every
 * ported component changes identity without a single line of component code
 * changing. There are no colour values in this file and no per-section CSS
 * import — a seventh token, or a literal hex here, would break that contract.
 *
 * `flex-1` is a no-op when the shell's `<main>` is not a flex column and makes
 * the section's paper fill the viewport when it is; either way the attribute
 * repaints the ground under everything below it.
 */

export const metadata: Metadata = {
  title: {
    default: "ACA Subsidy Cliff Calculator — Distance to 400% FPL",
    template: "%s · Health cover · Bracketsight",
  },
  description:
    "Your household's exact distance to the 400% federal poverty line subsidy cliff, what one more dollar costs, and every legal lever back under it. Free, no signup.",
};

/**
 * The section footer.
 *
 * Every page in this section carries it, not just the tool. The benchmark
 * premium is the single input every credit figure on the site multiplies
 * through, and the table it comes from is marked `SAMPLE_DATA` in the rules
 * file — the six county base premiums are invented so the engine could be
 * built and tested. A reader who lands on the methodology or the changelog from
 * a search result must be told that before they read a dollar figure, and
 * before this existed only the tool page said it.
 *
 * The status and the county count are read from the rule file, so the warning
 * disappears on its own the day the real CMS landscape file is ingested and
 * cannot be left behind by hand.
 */
export default function AcaSectionLayout({ children }: { children: ReactNode }) {
  const rules = getRules();
  const slcspIsSample = rules.slcsp.verificationStatus === "SAMPLE_DATA";
  const countyCount = rules.slcsp.counties.length;

  return (
    <div data-section="aca" className="flex min-h-full flex-1 flex-col">
      <SectionRail section="aca" label="Health cover section" />

      <div className="flex-1">{children}</div>

      <div className="hairline-t mt-16">
        <div
          className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-dim"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <p style={{ maxWidth: "var(--measure)" }}>
            This is an independent estimate engine. It is not the Marketplace, not your
            insurer and not tax advice, and it cannot see your actual plan or your actual
            enrolment. Confirm any figure with{" "}
            <a
              href="https://www.healthcare.gov/"
              rel="noopener"
              className="underline underline-offset-4 hover:text-ink"
            >
              healthcare.gov
            </a>{" "}
            or your state exchange before you act on it. Nothing you enter leaves your browser.
          </p>

          {slcspIsSample ? (
            <p className="hairline-t pt-3" style={{ maxWidth: "var(--measure)" }}>
              Pre-launch build, and one limitation matters more than the rest. The
              second-lowest-cost Silver premium — the benchmark every credit on this site is
              calculated from — is <strong className="text-ink">sample data</strong>. The{" "}
              <span className="num">{countyCount}</span> county base premiums in the rule file
              are plausible invented figures, put there so the arithmetic could be built and
              tested; the real table is the annual CMS public-use landscape file, county by
              county, and it has not been ingested. The percentages, poverty guidelines,
              repayment limits and cost-sharing bands around it are verified against their
              primary sources, so the shape of the cliff and the direction of every lever are
              right — the dollar amounts are not yours until that table lands. The age curve
              the premiums are scaled by is the federal default and has been checked value by
              value. What is settled and what is not is set out on{" "}
              <Link href="/aca/sources" className="underline underline-offset-4 hover:text-ink">
                sources
              </Link>{" "}
              and{" "}
              <Link
                href="/aca/methodology"
                className="underline underline-offset-4 hover:text-ink"
              >
                methodology
              </Link>
              .
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
