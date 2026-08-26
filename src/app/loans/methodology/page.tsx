import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/loans/methodology");

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="font-data text-[0.85rem] surface-raised border border-rule rounded-atlas p-3 overflow-x-auto whitespace-pre-wrap">
      {children}
    </pre>
  );
}

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">Methodology</h1>
        <p className="text-dim mt-1">
          Every formula the engine runs, every rounding rule, every assumption — and every
          simplification, stated plainly. The engine is deterministic arithmetic: no AI
          computes, estimates, or adjusts any number on this site.
        </p>
      </header>

      <section aria-labelledby="m-money">
        <h2 id="m-money" className="mb-2">How money is handled</h2>
        <p>
          All money is integer cents; interest rates are integer basis points (6.39% → 639).
          Fractional intermediates are rounded exactly once per derived figure, half away from
          zero. Monthly interest is computed fresh each month from the integer balance —
          <span className="font-data"> round(balance × bps ÷ 10,000 ÷ 12)</span> — so floating
          point error cannot accumulate across 360 iterations. Fixed (level) payments round up
          to the next cent so a stated term is honoured; the final payment absorbs the
          difference.
        </p>
      </section>

      <section aria-labelledby="m-rap">
        <h2 id="m-rap" className="mb-2">
          RAP — Repayment Assistance Plan
        </h2>
        <p>
          Authority: 34 C.F.R. § 685.209 as amended by the RISE final rule, 91 Fed. Reg.
          23768, effective 1 Jul 2026 (P.L. 119-21).
        </p>
        <Formula>
          {`AGI ≤ $10,000            → annual base $120  ($10/month)
$10,000 < AGI ≤ $20,000  → 1% of AGI
each further $10,000     → +1 percentage point
AGI > $100,000           → 10% of AGI (cap)

monthly = max( annualBase ÷ 12 − $50 × dependents claimed , $10 )`}
        </Formula>
        <ul className="list-disc ml-5 space-y-1">
          <li>
            <strong>Interest waiver:</strong> unpaid interest on an on-time payment is waived,
            never capitalised. The balance cannot grow.
          </li>
          <li>
            <strong>$50 principal match:</strong> principal falls by at least $50/month on an
            on-time payment — or by the payment amount when the payment is under $50.
          </li>
          <li>
            <strong>No payment cap:</strong> unlike IBR, RAP is never limited to the 10-year
            Standard amount. High income + moderate balance can make RAP the expensive plan.
          </li>
          <li>
            <strong>Forgiveness:</strong> after 360 qualifying payments (30 years); PSLF still
            at 120.
          </li>
          <li>
            <strong>Spousal income:</strong> included when filing jointly, excluded when
            filing separately; the payment is prorated by your share of the couple&apos;s
            combined federal loan balance when your spouse also has federal loans.
          </li>
          <li>
            <strong>One-way door:</strong> prior IBR/PAYE/ICR qualifying payments do not count
            toward RAP&apos;s 360. The engine models the forfeiture and flags it in oxide.
          </li>
          <li>
            <strong>Extra payments:</strong> amounts above the required payment are applied to
            interest first and can cancel the waiver and the match for that month. The engine
            simulates required payments and warns about this trap.
          </li>
        </ul>
      </section>

      <section aria-labelledby="m-idr">
        <h2 id="m-idr" className="mb-2">IBR, PAYE, ICR</h2>
        <Formula>
          {`Old IBR: 15% × (AGI − 150% × poverty guideline) ÷ 12 · forgiveness at 300 payments · capped at 10-yr Standard
New IBR: 10% × (AGI − 150% × poverty guideline) ÷ 12 · forgiveness at 240 payments · capped at 10-yr Standard · first loan on/after 1 Jul 2014
PAYE:    10% × (AGI − 150% × poverty guideline) ÷ 12 · forgiveness at 240 payments · capped · sunsets 1 Jul 2028
ICR:     lesser of 20% × (AGI − 100% × poverty guideline) ÷ 12
         or a 12-year fixed amortisation · forgiveness at 300 · sunsets 1 Jul 2028`}
        </Formula>
        <p>
          On these plans, unpaid interest accrues in a separate bucket and does not itself
          bear interest (Direct loan interest does not compound monthly). Simulations that
          cross 1 Jul 2028 model the forced migration. Both plans go to the same place:
          34 C.F.R. § 685.209(c)(7)(iii)(A) puts a borrower who has not chosen a plan on RAP
          for loans eligible for RAP, and on IBR for loans that are not. A borrower eligible
          for neither — a Parent PLUS consolidation outside the § 685.209(b)(6)(ii)
          carve-out — falls back to a 10-year Standard amortisation, which is our assumption,
          not a rule: the regulation does not address that case. Outstanding unpaid interest
          capitalises at the migration, consistent with historical plan-exit rules.
          Forgiveness credit does not simply carry across: payments made before the move
          count toward RAP&apos;s 360 only because the engine models every payment at the
          required amount (§ 685.209(k)(8)(i)(C)(5)), while payments made under RAP never
          count toward IBR, PAYE, or ICR forgiveness (§ 685.209(k)(4)(i)(A)).
        </p>
      </section>

      <section aria-labelledby="m-fixed">
        <h2 id="m-fixed" className="mb-2">
          Standard, Tiered Standard, Graduated, Extended
        </h2>
        <Formula>
          {`Standard 10:     level payment, 120 months
Tiered Standard: level payment; term by balance — <$25k: 10 yr · $25–50k: 15 yr · $50–100k: 20 yr · ≥$100k: 25 yr
Graduated:       10-yr term, steps every 24 months, first payment ≥ interest-only, final ≤ 3× first
Extended:        level payment, 300 months, requires >$30,000 in eligible loans`}
        </Formula>
        <p>
          The graduated schedule solves for the lowest starting payment whose stepped schedule
          (geometric steps, final = 3 × first) retires the loan within the term — servicers
          vary slightly in how they set the steps, so treat graduated figures as close
          estimates.
        </p>
      </section>

      <section aria-labelledby="m-tax">
        <h2 id="m-tax" className="mb-2">Tax on forgiveness</h2>
        <p>
          Under current federal law (the ARPA exclusion expired 31 Dec 2025), balances
          forgiven outside PSLF are taxable income in the year of discharge; PSLF forgiveness
          is excluded under 26 U.S.C. § 108(f)(1). The engine estimates the tax at a flat
          assumed marginal rate of 22%, stored in dated, cited configuration — it is an
          estimate for ranking purposes, not tax advice. State treatment diverges and is not
          modelled in v1.
        </p>
      </section>

      <section aria-labelledby="m-simplifications">
        <h2 id="m-simplifications" className="mb-2">
          Documented simplifications
        </h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>
            Loans are aggregated to one balance at a balance-weighted average rate. Servicers
            amortise per loan; the difference is small relative to plan-level divergence.
          </li>
          <li>
            A plan is shown as eligible only when <em>every</em> entered loan can use it. Real
            borrowers can sometimes hold different plans per loan.
          </li>
          <li>
            Poverty guidelines are held constant across the projection — conservative, since a
            growing guideline would lower income-driven payments over time.
          </li>
          <li>
            ICR&apos;s income-percentage factor is simplified to 1.0; the 12-year alternative
            amortisation is otherwise exact.
          </li>
          <li>
            AGI grows at your chosen annual rate, recomputed at each annual recertification.
          </li>
          <li>
            PAYE eligibility tests only one limb of the two-part new-borrower rule in{" "}
            <span className="font-data">34 C.F.R. § 685.209(b)(13)(i)</span>: whether you took a
            Direct loan on or after 1 Oct 2011. It does not test the other limb — that you had no
            outstanding Direct or FFEL balance as of 1 Oct 2007 — because nothing on the form asks
            for it. The engine therefore <strong>over-admits</strong> to PAYE: it can rank a plan a
            servicer would turn you down for. If PAYE comes out ahead, confirm your new-borrower
            status with your servicer before you count on it.
          </li>
          <li>
            The Tiered Standard step interval of 24 months is a servicer convention, not a
            regulatory term. <span className="font-data">§ 685.208(b)(6)(i)</span> prescribes only
            &ldquo;payments at two or more levels&rdquo;. The term lengths and the
            final-to-first ratio <em>are</em> verified; the step spacing cannot be, in principle.
          </li>
          <li>
            The tax on a forgiven balance uses a flat assumed marginal rate. That is a modelling
            estimate for ranking purposes, not a regulatory figure — it is labelled as an
            assumption wherever the engine uses it, and your real rate in the forgiveness year
            depends on facts this form never asks for.
          </li>
        </ul>
        <p className="mt-2">
          Anything that could not be verified against a live primary source is listed on the{" "}
          <Link href="/loans/sources" className="underline underline-offset-4">
            sources page
          </Link>
          , and summarised across all five tools on{" "}
          <Link href="/about" className="underline underline-offset-4">
            about
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
