import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/property/about");

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1>
        About the property assessment check
      </h1>
      <p>
        Homeowners are routinely over-assessed and almost never appeal,
        because every county has different deadlines, forms, and evidence
        standards — and the services that will handle it for you take 25–50%
        of your savings. Bracketsight is the self-service path: check your
        assessment in two minutes, see the evidence, and file your own appeal
        with your county&apos;s actual rules in front of you.
      </p>

      <section className="space-y-3">
        <h2>What does this tool decide, and why can a calculator not do it?</h2>
        <p>
          It decides two things a number alone cannot: whether your assessment
          is out of line with comparable homes, and whether filing is worth the
          fee and the effort. A calculator multiplies an assessment by a tax
          rate. An appeal turns on a statistical comparison, a county-specific
          procedure, and — in some states — a statutory test that overrides the
          comparison entirely. All three have to agree before &ldquo;file&rdquo;
          is the right answer, which is why the honest output is often
          &ldquo;your assessment looks fair&rdquo; or &ldquo;we cannot
          determine this.&rdquo;
        </p>
      </section>

      <section className="space-y-3">
        <h2>Which rules does the engine encode?</h2>
        <p>
          The statistical method first: four hard comparable filters, a median
          assessment ratio, and the IAAO coefficient of dispersion, with fewer
          than <span className="num">3</span> surviving comparables producing no
          verdict at all. Every step is set out on the{" "}
          <Link href="/property/methodology" className="underline underline-offset-2">
            methodology page
          </Link>
          , and every figure is reproducible by hand — the engine is pure
          TypeScript with no dependencies, no network access and no AI in the
          calculation path.
        </p>
        <p>
          Then the county procedure. Two counties ship today: Cook County,
          Illinois, where residential appeals commonly rest on uniformity, and
          Bergen County, New Jersey, where they rest on market value. Bergen
          carries the statutory filing-fee schedule —{" "}
          <span className="num">$5</span> under{" "}
          <span className="num">$150,000</span> assessed,{" "}
          <span className="num">$25</span> to under{" "}
          <span className="num">$500,000</span>, <span className="num">$100</span>{" "}
          to under <span className="num">$1,000,000</span>, and{" "}
          <span className="num">$150</span> at or above it — a{" "}
          <span className="num">1 April</span> deadline that the county board
          must have in hand rather than postmarked, <span className="num">1 May</span>{" "}
          where a municipality is revaluing, and direct filing with the Tax
          Court above <span className="num">$1,000,000</span> of assessed value.
        </p>
        <p>
          And where a statute overrides the statistics, the statute wins. New
          Jersey&apos;s Chapter <span className="num">123</span> compares your
          assessment-to-true-value ratio against your municipality&apos;s
          Director&apos;s Ratio ± <span className="num">15%</span>, multiplied
          rather than added: an average ratio of{" "}
          <span className="num">78.00%</span> gives a corridor of{" "}
          <span className="num">66.30%</span> to <span className="num">89.70%</span>.
          Inside that corridor the board may grant no reduction however large
          the comparables gap looks. Below it, the assessment is raised — that
          is the statutory outcome, not a risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2>When does it refuse to answer?</h2>
        <p>
          Every New Jersey check, right now. Chapter <span className="num">123</span>{" "}
          is implemented, but the table of municipal Director&apos;s Ratios is
          deliberately empty: not one has been read from a primary source, and
          none is invented. So every Bergen County result returns &ldquo;cannot
          determine&rdquo; and names the missing input, instead of falling back
          to the generic gap thresholds — which would tell a homeowner sitting
          inside the corridor they have a strong case on an appeal the board is
          required by statute to deny. The ratios are republished by the
          Division of Taxation every <span className="num">1 April</span>, per
          municipality, and each one needs its own citation before the engine
          will accept it.
        </p>
      </section>

      <section className="space-y-3">
        <h2>What is verified, and what is still unconfirmed?</h2>
        <p>
          Bergen&apos;s deadline, its fee schedule, its forms and the Chapter{" "}
          <span className="num">123</span> rule itself were read from the New
          Jersey Division of Taxation&apos;s assessors&apos; handbook and the
          Division&apos;s own appeal page. Cook County is thinner, because the
          Assessor&apos;s site could not be read at all from the verification
          environment. Specifically, and each of these is live today:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Cook&apos;s deadline is modelled as{" "}
            <span className="num">30</span> days after your notice. The real
            rule is a close date the Board of Review publishes for each of the{" "}
            <span className="num">38</span> townships each session, with{" "}
            <span className="num">30</span> days only a stated minimum —{" "}
            <span className="num">2026</span> Group{" "}
            <span className="num">1</span> opened <span className="num">3 August</span>{" "}
            and closed <span className="num">1 September</span>, a span of{" "}
            <span className="num">29</span> days. Check your township&apos;s
            published dates, not our countdown.
          </li>
          <li>
            Cook has a separate evidence-submission deadline after the filing
            deadline — <span className="num">11 September</span> for that same{" "}
            <span className="num">2026</span> group — and the engine has no
            concept of one, so it cannot warn you.
          </li>
          <li>
            Cook&apos;s <span className="num">10%</span> residential assessment
            level rests only on secondary summaries, and its estimated tax rate
            is a self-described rough estimate that collapses three separately
            published factors into one constant. Both feed the estimated annual
            overpayment.
          </li>
          <li>
            The sample neighborhood is synthetic, and no sample parcel is
            attached to a real New Jersey municipality, because attaching one
            would imply a real place.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>How should you use it?</h2>
        <p>
          Use it to find out whether you have a case worth building and to
          gather the comparables and the evidence you would bring. Confirm the
          deadline, the fee and the evidence rules with your county board before
          you rely on either — county calendars change every session, and one of
          the two shipped counties is currently modelled on the wrong deadline
          shape. Nothing here is an appraisal or a filing.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          What Bracketsight is not
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Not a law firm.</strong> Nothing here is legal advice or
            legal representation. Bracketsight provides assistance preparing
            your own appeal.
          </li>
          <li>
            <strong>Not an appraisal.</strong> The check is a statistical
            comparison to similar homes, documented on the{" "}
            <Link href="/property/methodology" className="underline underline-offset-2">
              methodology page
            </Link>
            — useful evidence, not a certified valuation.
          </li>
          <li>
            <strong>Not a promise of savings.</strong> Appeal boards decide
            appeals. We tell you honestly when the evidence is thin —
            including telling most users their assessment looks fair.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>
          Pre-launch status
        </h2>
        <p>
          This is a v1 build running on a clearly labelled synthetic demo
          neighborhood. Before launch, policy requires: a named, credentialed
          property-tax reviewer for the methodology and each county playbook;
          primary-source verification of every county rule currently flagged
          &ldquo;awaiting verification&rdquo;; and real parcel data for each
          launch county. None of these are optional, and none of them has
          happened yet — no property-tax consultant or attorney is engaged for
          this section today. Every citation and its verification date is listed
          on{" "}
          <Link href="/property/sources" className="underline underline-offset-2">
            sources
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Privacy
        </h2>
        <p>
          The assessment check runs entirely in your browser. Nothing you type
          is uploaded, stored, or logged. When document upload ships in a
          later phase, files will be processed in memory and never persisted —
          that promise is a product feature, not a footnote.
        </p>
      </section>
    </div>
  );
}
