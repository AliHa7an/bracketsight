import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ErrorState } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/paycheck/about");

const link =
  "text-ink underline decoration-rule underline-offset-4 hover:decoration-current";

export default function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <h1>About the deduction engine</h1>

      <div className="density-reading">
        <p>
          New deductions arrived with the One Big Beautiful Bill Act, and the first filing
          season was chaos: W-2s without boxes for them, workers self-calculating from pay
          stubs, and money left on the table. This section answers one question precisely —{" "}
          <em>what does your household actually get?</em> — including the phase-out
          interactions no single-deduction calculator can model, because it only ever sees one
          deduction.
        </p>
        <p>
          It is a decision engine, not a calculator. Output is cited, dated, and traceable to
          the line of statute it came from, with the money-you&apos;re-about-to-leave-behind
          cases marked in amber. Formulas are public on{" "}
          <Link href="/paycheck/methodology" className={link}>
            Methodology
          </Link>
          , citations on{" "}
          <Link href="/paycheck/sources" className={link}>
            Sources
          </Link>
          , and every rule change lands on the{" "}
          <Link href="/paycheck/changelog" className={link}>
            Changelog
          </Link>
          .
        </p>
      </div>

      <section className="density-reading">
        <h2>Why can&apos;t a single-deduction calculator answer this?</h2>
        <p>
          Because all four deductions phase out against the same income figure. Schedule 1-A
          computes modified adjusted gross income once, at line <span className="num">3</span>,
          and Parts <span className="num">II</span> through <span className="num">V</span> each
          read that one number — so a single raise can shrink the tips deduction, the overtime
          deduction, the senior deduction and the car-loan deduction at the same time. A
          calculator that models one of them sees a gentle slope where a household with three
          of them is on a cliff.
        </p>
        <p>
          The deductions do not reduce MAGI themselves, which is what makes the interaction
          sharp rather than self-correcting. They sit below the line: Form{" "}
          <span className="num">1040</span> reaches AGI at line{" "}
          <span className="num">11a</span>, and the Schedule 1-A total lands at line{" "}
          <span className="num">13b</span>, after it. So no deduction can soften another&apos;s
          phase-out, and the engine reports the marginal effect of the next{" "}
          <span className="num">$1,000</span> of income rather than only the level.
        </p>
      </section>

      <section className="density-reading">
        <h2>Which rules does it encode?</h2>
        <p>
          Four deductions, each from the statute that created it in{" "}
          <span className="num">P.L. 119-21</span>, with Schedule 1-A (Form{" "}
          <span className="num">1040</span>) as the computation of record.
        </p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          <li className="hairline-b pb-2">
            <strong>Qualified tips</strong> — <span className="num">IRC § 224</span>, added by{" "}
            <span className="num">§ 70201</span>. A <span className="num">$25,000</span> cap per
            return regardless of filing status, reduced by <span className="num">$100</span> for
            each full <span className="num">$1,000</span> of MAGI over{" "}
            <span className="num">$150,000</span> single or{" "}
            <span className="num">$300,000</span> joint. Requires a qualified occupation and a
            joint return if you are married.
          </li>
          <li className="hairline-b pb-2">
            <strong>Qualified overtime</strong> — <span className="num">IRC § 225</span>, added
            by <span className="num">§ 70202</span>. Only the FLSA premium qualifies: the
            &ldquo;half&rdquo; of time-and-a-half, not the whole overtime paycheque. Capped at{" "}
            <span className="num">$12,500</span> single and{" "}
            <span className="num">$25,000</span> joint, with the same{" "}
            <span className="num">$100</span> per <span className="num">$1,000</span> phase-out.
          </li>
          <li className="hairline-b pb-2">
            <strong>Seniors</strong> — <span className="num">IRC § 151(d)(5)(C)</span>, added by{" "}
            <span className="num">§ 70103</span>. It lives in the personal-exemption section
            rather than <span className="num">§ 63</span>, which is why it is easy to miss.{" "}
            <span className="num">$6,000</span> for each person who reaches{" "}
            <span className="num">65</span> before the year ends, reduced by{" "}
            <span className="num">6%</span> of MAGI over <span className="num">$75,000</span>{" "}
            single or <span className="num">$150,000</span> joint.
          </li>
          <li className="hairline-b pb-2">
            <strong>Car-loan interest</strong> — <span className="num">IRC § 163(h)(4)</span>,
            added by <span className="num">§ 70203</span>. Up to{" "}
            <span className="num">$10,000</span> of interest on a first-lien loan for a new
            personal-use vehicle assembled in the United States, reduced by{" "}
            <span className="num">$200</span> for each <span className="num">$1,000</span> over{" "}
            <span className="num">$100,000</span> or <span className="num">$200,000</span>.
          </li>
        </ul>
        <p>
          Two supporting tables come from separate sources. The{" "}
          <span className="num">2026</span> brackets and standard deduction are the published
          inflation-adjusted figures, and the qualified-occupation list holds all{" "}
          <span className="num">71</span> Treasury Tipped Occupation Codes across{" "}
          <span className="num">8</span> categories.{" "}
          <Link href="/paycheck/occupations" className={link}>
            The list is browsable
          </Link>
          . The job titles listed under each code are illustrative examples, and the final
          regulation states they are not exhaustive — so a title the search does not match is
          not a disqualification.
        </p>
      </section>

      <section className="density-reading">
        <h2>Why do the three phase-outs round differently?</h2>
        <p>
          Because the statutes differ, and harmonising them would be a bug. For tips and
          overtime, Schedule 1-A lines <span className="num">11</span> and{" "}
          <span className="num">19</span> say to decrease a fractional step to the next lower
          whole number, and neither <span className="num">§ 224</span> nor{" "}
          <span className="num">§ 225</span> contains the words &ldquo;or portion
          thereof&rdquo;. For car-loan interest,{" "}
          <span className="num">§ 163(h)(4)(C)(ii)(I)</span> does contain them, and line{" "}
          <span className="num">28</span> says to increase a fraction to the next higher whole
          number.
        </p>
        <p>
          So an identical <span className="num">$3,500</span> of excess income produces{" "}
          <span className="num">3</span> steps under the tips rule and{" "}
          <span className="num">4</span> under the car-loan rule. The engine holds the two
          conventions in separate rule files, and a regression test asserts they stay apart —
          it is the kind of asymmetry a tidy-minded refactor deletes.
        </p>
      </section>

      <section className="density-reading">
        <h2>What does it deliberately not model?</h2>
        <p>
          MAGI is an approximation. The engine builds it from wages, other income, tips and
          gross overtime, with no subtraction term — where the statutory figure is AGI, which is
          gross income less above-the-line adjustments such as HSA and traditional IRA
          contributions, deductible self-employment tax, self-employed health insurance and
          student-loan interest. The result overstates MAGI for anyone who has those, which can
          understate a deduction near a phase-out edge. It is a stated v1 limit, not an accident.
        </p>
        <p>
          Four things are absent outright. The long-standing extra standard deduction for people{" "}
          <span className="num">65</span> and over is not modelled, and it stacks with the{" "}
          <span className="num">$6,000</span> senior deduction rather than replacing it, so a
          senior household&apos;s total deduction here is understated. Several car-loan
          eligibility conditions — the gross vehicle weight limit, the first-lien requirement,
          the exclusions for leases, fleet sales, salvage vehicles and related-party loans, the
          refinancing cap and the VIN reporting requirement — are described but not enforced by
          the engine, so it will not stop you claiming a vehicle that does not qualify. Credits
          and itemised deductions are out of scope. State income tax is not modelled at all.
        </p>
        <p>
          One thing is worth stating plainly because the popular framing gets it wrong: these
          are federal income tax deductions. Tips and overtime remain subject to Social Security
          and Medicare tax, and may be taxed by your state. &ldquo;No tax on tips&rdquo; does not
          mean tax-free tips.
        </p>
      </section>

      <section className="density-reading">
        <h2>What is the verification state of this section?</h2>
        <p>
          All six rule sets still read <span className="num">unverified</span>, and that is the
          launch gate. A primary-source pass on <span className="num">15 Aug 2026</span> read the
          enrolled public law, the <span className="num">2026</span> inflation-adjustment
          revenue procedure, the tips final regulation, Schedule 1-A and its instructions, and
          the official occupation list — and confirmed the great majority of encoded values
          against them. What has not happened is the follow-through: the citation entries inside
          the rule files still point at placeholder addresses rather than the documents actually
          read, so the files cannot honestly be flipped to verified yet.
        </p>
        <p>
          One question is unresolved outright rather than merely outstanding. No source states a
          sub-dollar rounding convention for these four computations. Schedule 1-A prescribes the{" "}
          <span className="num">$1,000</span>-step rounding and the{" "}
          <span className="num">6%</span> senior multiplication, but says nothing about cents.
          The engine works in integer cents and rounds half-up, which is defensible and is not
          something the IRS has stated; it can move a result by about a dollar.
        </p>
        <p>
          That pass also found real defects, which is the argument for running it. Two of them
          moved money: the tips and overtime phase-outs were rounding the{" "}
          <span className="num">$1,000</span> step the wrong way, understating those deductions,
          and a joint return with two spouses over <span className="num">65</span> was
          over-credited — at <span className="num">$200,000</span> of MAGI the engine returned{" "}
          <span className="num">$9,000</span> where the form produces{" "}
          <span className="num">$6,000</span>. Both were corrected and are now covered by
          regression tests.
        </p>
      </section>

      <ErrorState
        cause="This is a pre-launch build with no credentialed reviewer."
        fix="No EA or CPA has been engaged, and the review our editorial policy requires before launch has not taken place. All six rule sets still carry unverified citations. Treat every number here as illustrative, and take anything that matters to a tax professional."
      />

      <section className="density-reading">
        <h2>How should you use it?</h2>
        <p>
          Use it to find out which of the four deductions your household is even in range for,
          and which one a change in income would cost you. Every figure opens its own formula and
          rule version, so you can check the arithmetic rather than trust it. Take the result to
          whoever prepares your return.
        </p>
        <p>
          Do not use it to file. It is not tax advice, it does not know your above-the-line
          adjustments, and it cannot see the W-2 boxes your employer will actually report. Your
          inputs never leave your browser: there are no accounts, no uploads and no database, and
          state persists only in your own localStorage. Found something wrong? Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </article>
  );
}
