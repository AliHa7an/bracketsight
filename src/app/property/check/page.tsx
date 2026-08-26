import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CheckTool } from "@/components/property/CheckTool";
import { AnswerBox } from "@/components/ui";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/property/check");

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1>Check your assessment</h1>

      <AnswerBox className="mt-4">
        Your home is over-assessed if its assessed value sits above what comparable homes imply.
        Compare at least <span className="num">3</span> similar homes, take the median assessment
        ratio, and multiply. A gap under <span className="num">5%</span> is normal appraisal noise
        and rarely worth filing.
      </AnswerBox>

      <p className="mt-4 max-w-[68ch] text-dim">
        The method is documented on the{" "}
        <Link href="/property/methodology" className="underline underline-offset-4">
          methodology page
        </Link>
        , and each county&apos;s deadline, fee and forms are cited on its{" "}
        <Link href="/property/counties" className="underline underline-offset-4">
          county page
        </Link>
        . There is no signup and no Calculate button — the verdict is already below.
      </p>

      <div className="mt-8">
        <CheckTool />
      </div>
    </div>
  );
}
