import type { Metadata } from "next";
import Link from "next/link";
import { getRules } from "@fineprint/engine-aca";

export const metadata: Metadata = {
  alternates: { canonical: "/aca/methodology" },
  title: "Methodology — How the Premium Tax Credit Is Computed",
  description:
    "Every formula in the engine: the §36B credit, Form 8962 truncation, the applicable-percentage table, and the iterative self-employed health insurance calculation.",
};

export default function MethodologyPage() {
  const rules = getRules();
  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Methodology</h1>
      <p className="text-ink">
        Every number Fineprint shows is produced by a deterministic,
        open-formula engine with zero AI in the calculation path. Money is
        integer cents; rates are basis points; every threshold lives in
        versioned JSON with citations (
        <Link href="/aca/sources" className="underline underline-offset-4">
          sources
        </Link>
        ). Current ruleset:{" "}
        <span className="num">{rules.ruleSetVersion}</span>.
      </p>

      <section className="space-y-3">
        <h2>
          The premium tax credit (IRC §36B)
        </h2>
        <pre className="num hairline-all rounded-atlas overflow-x-auto p-4" style={{ fontSize: "var(--text-step--1)", background: "var(--paper-sunken)" }}>
          {`if MAGI > 4.0 × FPL:  fplPct = 401                — Form 8962
                                                 Worksheet 2, step 4
else:                 fplPct = MAGI ÷ FPL, truncated to a whole
                                                 percent (line 5)
if fplPct > 400:  PTC = 0                        — THE CLIFF (2026 rules)
if fplPct < 100:  Medicaid / coverage-gap logic by state expansion status
applicablePct   = table lookup, linearly interpolated within its band
expectedContrib = MAGI × applicablePct
PTC             = max(0, benchmarkSilverPremium − expectedContrib)`}
        </pre>
        <p className="text-ink">
          The order of those two steps is worth real money. Form 8962
          Worksheet 2 asks first whether household income is more than 4.0 ×
          the poverty line; if it is, you write 401 on line 5 and stop, and
          line 6 says you are not eligible. Truncation is reached only in the
          &ldquo;no&rdquo; branch. So there is no grace band above the edge:
          400.9% of FPL is 401, not 400, and the last eligible income is
          exactly four times the poverty line — for a family of four that is
          $321 lower than a bare truncation would suggest. Truncation still
          governs every interior boundary, including the 250% cost-sharing
          ledge. The engine reports both the precise percentage (for the
          meter) and the Form 8962 one (for eligibility). MAGI here is the
          §36B definition: AGI + tax-exempt interest + excluded foreign earned
          income + non-taxable Social Security.
        </p>
        <p className="text-ink">
          <strong>Benchmark premiums:</strong> the second-lowest-cost Silver
          plan for your county and ages, per-member age-rated on the federal
          default 3:1 curve (45 C.F.R. §147.102). The v1 build ships six
          sample counties with clearly labelled illustrative premiums; the
          production data source is the annual CMS public-use file.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Cost-sharing reductions — the 250% ledge
        </h2>
        <p className="text-ink">
          At or below 250% FPL, Silver plans carry cost-sharing reductions:
          94% actuarial value through 150% FPL, 87% through 200%, 73% through
          250% (ACA §1402; 45 C.F.R. §156.420). One dollar past a band
          boundary drops the whole band — a second, smaller cliff the meter
          draws as a ledge.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          Advance-credit reconciliation
        </h2>
        <p className="text-ink">
          Advance payments are reconciled on Form 8962. For 2026 there is{" "}
          <strong>no cap on repayment at any income level</strong>: the
          statutory limitation of IRC §36B(f)(2)(B), which used to cap the
          damage below 400% FPL, was struck by Pub. L. 119-21 §71305 for tax
          years beginning after 31 December 2025. A household at 250% of the
          poverty line repays the entire excess advance, exactly as one at 405%
          does. Whether a limitation exists is carried in the dated rules file,
          so a future reinstatement is a data change rather than a code change.
          Fineprint surfaces this as the clawback warning whenever you enter a
          monthly advance amount.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          The self-employed health insurance deduction — the circular
          calculation
        </h2>
        <p className="text-ink">
          The SEHI deduction and the credit define each other: the deduction
          lowers MAGI, a lower MAGI raises the credit, a higher credit lowers
          the out-of-pocket premium that is deductible, which raises MAGI
          again. Rev. Proc. 2014-41 blesses an iterative method. Fineprint
          iterates <span className="num">d ← min(premium − PTC(MAGI − d), earned-income limit)</span>{" "}
          until successive values differ by no more than $1.00, capped at 50
          iterations. Because the credit multiplies each step by roughly the
          applicable percentage (≈0.10), the sequence contracts and converges
          in a handful of steps in ordinary cases.
        </p>
        <p className="text-ink">
          <strong>The cliff-edge oscillation:</strong> when the deduction is
          the only thing holding the household under 400%, the iteration can
          bounce between an over-the-cliff and an under-the-cliff answer. When
          that two-cycle is detected, the engine returns the smaller
          (conservative) deduction and flags the result for professional
          review rather than picking the flattering answer.
        </p>
      </section>

      <section className="space-y-3">
        <h2>The lever engine</h2>
        <p className="text-ink">
          Each lever's remaining legal room is computed from the rules file
          (elective-deferral limits and catch-ups, HSA limits by HDHP tier,
          IRA deductibility phase-outs, the SEP 25%-net-of-contribution
          ceiling with the ½-SE-tax adjustment). Levers are ranked by dollars
          of credit recovered per dollar committed at the modeled amount.
          Income timing is listed advisory-only and never carries computed
          advice.
        </p>
        <p className="text-ink">
          <strong>Documented simplifications (v1):</strong> the IRA phase-out
          uses §36B MAGI as a proxy for the IRA-specific MAGI; the SEP lever
          models the employer contribution only (a Solo 401(k) employee
          deferral can add more); HSA catch-up is modeled for the primary
          taxpayer only; state-specific age curves and premium rating areas
          arrive with the CMS data.
        </p>
      </section>

      <section className="space-y-3">
        <h2>What Fineprint never does</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>No AI computes, adjusts, or sanity-checks any number.</li>
          <li>No specific insurance plan is ever recommended.</li>
          <li>Income timing is never auto-advised.</li>
          <li>Nothing you enter leaves your browser — no accounts, no database.</li>
        </ul>
      </section>
    </article>
  );
}
