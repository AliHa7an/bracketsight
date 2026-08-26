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
export const metadata: Metadata = pageMetadata("/loans/about");

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">About the student loan engine</h1>
        <p className="text-dim mt-1">
          The independent second opinion on your student loan repayment plan. Every rule
          cited. Every number dated. No lender pays us.
        </p>
      </header>

      <section aria-labelledby="a-what">
        <h2 id="a-what" className="mb-2">What this is</h2>
        <p>
          A decision engine, not a payment calculator. You enter your real loan mix; the
          engine simulates all nine federal repayment plans month by month over up to 30 years
          and returns a ranked recommendation by total lifetime cost — with the irreversible
          choices flagged before you make them. The cheapest monthly payment is frequently the
          most expensive plan, because a smaller payment stretches repayment across more years
          of interest. Showing that conflict — and the plan switches that cannot be undone — is
          the point.
        </p>
      </section>

      <section aria-labelledby="a-calculator">
        <h2 id="a-calculator" className="mb-2">
          Why can&apos;t a single-plan calculator answer this?
        </h2>
        <p>
          Because the plans interact, and the cheapest month is not the cheapest decade. RAP
          has no payment cap: <span className="num">34 C.F.R. § 685.209(f)(5)</span> simply
          omits the &ldquo;lesser of&rdquo; clause that paragraphs{" "}
          <span className="num">(f)(2)</span> and <span className="num">(f)(3)</span> carry for
          IBR and PAYE, so a high income with a moderate balance can make RAP cost more than
          the <span className="num">10</span>-year Standard plan. A calculator that only knows
          one plan cannot show you that crossover, and neither can one that stops at the
          monthly figure.
        </p>
        <p className="mt-2">
          Three further interactions decide real cases and only appear when every plan is run
          side by side: forgiveness outside PSLF is taxable income under current federal law,
          so a plan that forgives more is not automatically cheaper; PAYE and ICR end on{" "}
          <span className="num">1 Jul 2028</span>, so any projection past that date has to
          model the forced move rather than quietly project PAYE for{" "}
          <span className="num">20</span> years; and switching to RAP forfeits qualifying
          payments already made toward IBR, PAYE or ICR forgiveness. The engine ranks the
          plans on total lifetime cost, and marks that forfeiture as the one irreversible
          result it reports.
        </p>
      </section>

      <section aria-labelledby="a-encodes">
        <h2 id="a-encodes" className="mb-2">Which rules does it encode?</h2>
        <p>
          Every rate, bracket, term and threshold comes from a versioned rule file citing its
          primary source. The governing document is the RISE final rule —{" "}
          <span className="num">91 Fed. Reg. 23768</span>, published{" "}
          <span className="num">1 May 2026</span> (FR Doc. <span className="num">2026-08556</span>
          ), effective <span className="num">1 Jul 2026</span> — which amends{" "}
          <span className="num">34 C.F.R. parts 674, 682 and 685</span>.
        </p>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li>
            <strong>RAP:</strong> eleven AGI bands from{" "}
            <span className="num">§ 685.209(b)(2)</span>, running from a flat{" "}
            <span className="num">$120</span> annual base at or below{" "}
            <span className="num">$10,000</span> of AGI to <span className="num">10%</span>{" "}
            above <span className="num">$100,000</span>; a <span className="num">$50</span>{" "}
            monthly reduction per dependent; a <span className="num">$10</span> monthly floor;
            the interest waiver at <span className="num">§ 685.209(h)(4)(i)</span>; the{" "}
            <span className="num">$50</span> principal match; forgiveness at{" "}
            <span className="num">360</span> payments; PSLF at{" "}
            <span className="num">120</span>.
          </li>
          <li>
            <strong>The income-driven plans:</strong> Old IBR at{" "}
            <span className="num">15%</span> of discretionary income with forgiveness at{" "}
            <span className="num">300</span> payments; New IBR and PAYE at{" "}
            <span className="num">10%</span> with forgiveness at{" "}
            <span className="num">240</span>; ICR at <span className="num">20%</span> measured
            against <span className="num">100%</span> of the poverty guideline rather than{" "}
            <span className="num">150%</span>, with a <span className="num">12</span>-year
            alternative amortisation.
          </li>
          <li>
            <strong>The fixed plans:</strong> Standard over{" "}
            <span className="num">120</span> months; Tiered Standard over{" "}
            <span className="num">120</span>, <span className="num">180</span>,{" "}
            <span className="num">240</span> or <span className="num">300</span> months by
            balance; Graduated over <span className="num">120</span> months with no payment
            more than <span className="num">3×</span> any other; Extended over{" "}
            <span className="num">300</span> months, available above{" "}
            <span className="num">$30,000</span>.
          </li>
          <li>
            <strong>The poverty guidelines:</strong> the <span className="num">2026</span> HHS
            table — <span className="num">$15,960</span> for the first person in the
            contiguous <span className="num">48</span> states and DC plus{" "}
            <span className="num">$5,680</span> for each additional person, with separate
            figures for Alaska (<span className="num">$19,950</span> /{" "}
            <span className="num">$7,100</span>) and Hawaii (
            <span className="num">$18,360</span> / <span className="num">$6,530</span>).
          </li>
        </ul>
      </section>

      <section aria-labelledby="a-not-modelled">
        <h2 id="a-not-modelled" className="mb-2">What does it deliberately not model?</h2>
        <p>
          State tax treatment of forgiven balances is out of scope in v1, and the rule file
          says so rather than assuming a rate. Your loans are aggregated into one balance at a
          balance-weighted average rate, where a servicer amortises each loan separately. A
          plan is shown as eligible only when every loan you entered can use it, though real
          borrowers can sometimes hold different plans on different loans. Poverty guidelines
          are held flat across the projection, which is the conservative direction — a rising
          guideline would lower income-driven payments over time. The full list, with the
          reasoning for each, is on the{" "}
          <Link href="/loans/methodology" className="underline underline-offset-4">
            methodology page
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="a-placeholders">
        <h2 id="a-placeholders" className="mb-2">
          Which figures are still unverified, and against what?
        </h2>
        <p>
          Six, listed below with the source that would close each one. Nothing has been filled
          in with an estimate. The same register, summarised across all five tools, is on{" "}
          <Link href="/about" className="underline underline-offset-4">
            about Bracketsight
          </Link>
          .
        </p>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li>
            The assumed marginal tax rate of <span className="num">22%</span> used to estimate
            tax on forgiveness is a flat modelling estimate, not a regulatory figure. The
            correct rate is borrower-specific, because the forgiven amount stacks on top of
            other income.
          </li>
          <li>
            ICR&apos;s income-percentage factor is fixed at{" "}
            <span className="num">1.0</span>.{" "}
            <span className="num">34 C.F.R. § 685.209(f)(4)(i)(A)</span> multiplies the{" "}
            <span className="num">12</span>-year amortisation by a factor the Secretary sets in
            a Federal Register notice published annually, and the{" "}
            <span className="num">2026</span> notice has not been located. Until it is, ICR is
            understated for higher incomes.
          </li>
          <li>
            Graduated repayment&apos;s <span className="num">24</span>-month step interval has
            no regulatory basis at all. <span className="num">§ 685.208(b)(6)(i)</span>{" "}
            prescribes only &ldquo;payments at two or more levels&rdquo;; the interval is a
            servicer convention. The <span className="num">10</span>-year term and the{" "}
            <span className="num">3×</span> ratio around it are verified.
          </li>
          <li>
            The taxability of non-PSLF forgiveness rests on the{" "}
            <span className="num">2024</span> U.S. Code edition of{" "}
            <span className="num">26 U.S.C. § 108(f)</span>, because no current official
            edition could be retrieved. A <span className="num">2025–26</span> amendment cannot
            be ruled out from a primary source.
          </li>
          <li>
            Three citations point at congress.gov, which refuses automated requests, so none of
            the three has been read. Every figure they would support is independently verified
            against the RISE rule text.
          </li>
          <li>
            The new-borrower tests for PAYE and IBR each model one limb of a two-limb rule. The
            engine can therefore offer PAYE to someone who held a balance on{" "}
            <span className="num">1 Oct 2007</span>, and can apply New IBR&apos;s terms to
            someone who has taken a loan on or after <span className="num">1 Jul 2026</span>.
            Both need an input field the form does not yet collect.
          </li>
        </ul>
      </section>

      <section aria-labelledby="a-review">
        <h2 id="a-review" className="mb-2">Has a credentialed professional reviewed this?</h2>
        <p>
          No. No student loan professional has been engaged, and no review has taken place.
          The engine is unit-tested, with eight worked RAP examples held as golden cases, and
          every rule file records the primary source it was read from and the date it was last
          checked — but confirming that an encoded value matches its cited source is a much
          narrower question than whether the output is sound for your situation.
        </p>
        <ErrorState
          className="mt-3"
          cause="This is a pre-launch build with no credentialed reviewer."
          fix="A named, credentialed student loan professional (CSLP or attorney) must sign off on the encoded rules before this section launches publicly. That has not happened. Treat every figure here as an estimate to check with your servicer, not as a decision."
        />
      </section>

      <section aria-labelledby="a-use">
        <h2 id="a-use" className="mb-2">How should you use it?</h2>
        <p>
          Use it to narrow nine plans to two or three, and to find the questions worth asking.
          The ranking is arithmetic over published rules, so it is reproducible: every figure
          opens its own formula, inputs and rule version. Take the shortlist and the flagged
          irreversible steps to your servicer and confirm them against your actual account
          before you elect anything.
        </p>
        <p className="mt-2">
          Do not use it as a record of your loans. It does not connect to StudentAid.gov or to
          any servicer, cannot see your payment history, and knows only what you typed. If your
          balances, rates or disbursement dates are approximate, so is everything downstream of
          them.
        </p>
      </section>

      <section aria-labelledby="a-disclaimer">
        <h2 id="a-disclaimer" className="mb-2">What this is not</h2>
        <p>
          Not your servicer, not financial advice, not tax advice. Estimates run under current
          rules and your stated assumptions. Confirm any plan change with your servicer, and
          any tax question with a professional, before acting. Found an error? Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>{" "}
          — the{" "}
          <Link href="/loans/editorial-policy" className="underline underline-offset-4">
            editorial policy
          </Link>{" "}
          sets out what happens next, and the{" "}
          <Link href="/loans/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          records every rule change that follows.
        </p>
      </section>
    </div>
  );
}
