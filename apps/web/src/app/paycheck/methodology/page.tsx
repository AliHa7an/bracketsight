import type { Metadata } from "next";
import Link from "next/link";
import { resolveRules } from "@fineprint/engine-paycheck";
import { formatBps, usd } from "@/lib/paycheck/format";
import { rulesMeta, TAX_YEAR } from "@/lib/paycheck/rules-meta";
import { AnswerBox, FactTable, LastVerified, SourceCitation } from "@fineprint/ui";

export const metadata: Metadata = {
  title: "OBBBA Deduction Methodology — Every Formula",
  description:
    "The exact formulas behind the OBBBA tips, overtime, senior and car-loan deductions: caps, shared-MAGI phase-outs, the bracket table, and integer-cent rounding.",
  alternates: { canonical: "/paycheck/methodology" },
};

export default function MethodologyPage() {
  const rules = resolveRules(TAX_YEAR);
  const meta = rulesMeta(TAX_YEAR);

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1>Methodology</h1>
        <AnswerBox>
          Every figure comes from a deterministic engine — plain arithmetic in integer cents
          over versioned, cited rule files. No AI touches a calculation. This page states the
          formulas exactly as the engine runs them, for tax year{" "}
          <span className="num">{TAX_YEAR}</span>.
        </AnswerBox>
        <LastVerified
          date={meta.lastVerified}
          ruleSetVersion={meta.shortVersion}
          citation={{ label: meta.primary.label, url: meta.primary.url }}
        />
      </header>

      <section className="density-reading">
        <h2>MAGI (v1 approximation)</h2>
        <p>
          <span className="num">MAGI = base wages + tips + gross overtime pay + other income</span>
          . The OBBBA deductions never reduce MAGI themselves, which is exactly why one raise
          can shrink several of them at once.
        </p>
      </section>

      <section>
        <h2>Qualified tips deduction</h2>
        <p className="density-reading mt-2">
          <span className="num">deduction = min(reported tips, {usd(rules.tips.capCents)})</span>,
          then reduced by <span className="num">$100</span> for each{" "}
          <span className="num">$1,000</span> — or fraction of one — of MAGI over the
          threshold.
          <SourceCitation
            index={1}
            label={rules.tips.citations[0]?.label ?? "P.L. 119-21 (OBBBA) § 70201"}
            url={rules.tips.citations[0]?.url ?? meta.primary.url}
            lastVerified={rules.tips.citations[0]?.lastVerified ?? meta.lastVerified}
          />{" "}
          Requires a qualified occupation (
          <Link
            href="/paycheck/occupations"
            className="text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
          >
            the list
          </Link>
          ), properly reported tips, and a joint return if married.
        </p>
        <FactTable
          className="mt-3"
          caption="Qualified tips deduction parameters"
          rows={[
            { key: "Annual cap", value: usd(rules.tips.capCents) },
            {
              key: "Phase-out threshold (single)",
              value: usd(rules.tips.phaseOut.thresholdSingleCents),
            },
            {
              key: "Phase-out threshold (joint)",
              value: usd(rules.tips.phaseOut.thresholdJointCents),
            },
            { key: "Rule set", value: rules.tips.ruleSetVersion },
          ]}
        />
      </section>

      <section>
        <h2>Qualified overtime deduction</h2>
        <p className="density-reading mt-2">
          Only the FLSA premium qualifies:{" "}
          <span className="num">premium = overtime hours × regular rate × 0.5</span>, or total
          time-and-a-half pay ÷ 3. The whole time-and-a-half paycheck is not deductible, and
          this is the single most common error on a return.
          <SourceCitation
            index={2}
            label={rules.overtime.citations[1]?.label ?? "29 U.S.C. § 207"}
            url={rules.overtime.citations[1]?.url ?? meta.primary.url}
            lastVerified={rules.overtime.citations[1]?.lastVerified ?? meta.lastVerified}
          />
        </p>
        <FactTable
          className="mt-3"
          caption="Qualified overtime deduction parameters"
          rows={[
            { key: "Cap (single)", value: usd(rules.overtime.capSingleCents) },
            { key: "Cap (joint)", value: usd(rules.overtime.capJointCents) },
            {
              key: "Deductible share of the hour",
              value: formatBps(rules.overtime.premiumShareOfRegularRateBps),
            },
            {
              key: "Phase-out threshold (single)",
              value: usd(rules.overtime.phaseOut.thresholdSingleCents),
            },
            { key: "Rule set", value: rules.overtime.ruleSetVersion },
          ]}
        />
      </section>

      <section>
        <h2>Senior deduction (65+)</h2>
        <p className="density-reading mt-2">
          <span className="num">{usd(rules.senior.amountPerQualifyingPersonCents)}</span> per
          person aged <span className="num">{rules.senior.qualifyingAge}</span> or over,
          reduced by a percentage of MAGI over the threshold — a different phase-out model
          from the tips and overtime step.
        </p>
        <FactTable
          className="mt-3"
          caption="Senior deduction parameters"
          rows={[
            { key: "Qualifying age", value: rules.senior.qualifyingAge },
            {
              key: "Amount per person",
              value: usd(rules.senior.amountPerQualifyingPersonCents),
            },
            {
              key: "Phase-out threshold (single)",
              value: usd(rules.senior.phaseOut.thresholdSingleCents),
            },
            {
              key: "Phase-out threshold (joint)",
              value: usd(rules.senior.phaseOut.thresholdJointCents),
            },
            { key: "Rule set", value: rules.senior.ruleSetVersion },
          ]}
        />
      </section>

      <section>
        <h2>Car-loan interest deduction</h2>
        <p className="density-reading mt-2">
          Interest up to <span className="num">{usd(rules.carLoan.capCents)}</span> on a loan
          for a new, personal-use vehicle with final assembly in the United States, originated
          on or after <span className="num">{rules.carLoan.loanOriginatedOnOrAfter}</span>.
          Miss any one of those conditions and the whole deduction goes.
        </p>
        <FactTable
          className="mt-3"
          caption="Car-loan interest deduction parameters"
          rows={[
            { key: "Annual cap", value: usd(rules.carLoan.capCents) },
            {
              key: "Loan originated on or after",
              value: rules.carLoan.loanOriginatedOnOrAfter,
            },
            {
              key: "Phase-out threshold (single)",
              value: usd(rules.carLoan.phaseOut.thresholdSingleCents),
            },
            { key: "Rule set", value: rules.carLoan.ruleSetVersion },
          ]}
        />
      </section>

      <section className="density-reading">
        <h2>Estimated federal tax saved</h2>
        <p>
          Taxable income is <span className="num">MAGI − standard deduction</span>. The engine
          computes tax on the bracket table before and after the combined deduction and reports
          the difference — exact bracket math, never marginal rate × deduction. Credits,
          itemising, and the pre-existing 65+ extra standard deduction are out of scope in v1.
          All money is integer cents; all rates are basis points.
        </p>
        <p>
          The per-line &ldquo;worth $X at your bracket&rdquo; annotations on the pay statement
          are the deduction valued at the top rate, so they will not always sum to the exact
          headline saving. The headline is the one to trust; the annotations exist to show
          which line is doing the work.
        </p>

        <h2>What this engine never does</h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          <li className="hairline-b pb-2">
            No AI computes, estimates, or adjusts any number.
          </li>
          <li className="hairline-b pb-2">
            No figure ships without a citation — see{" "}
            <Link
              href="/paycheck/sources"
              className="text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
            >
              Sources
            </Link>
            .
          </li>
          <li className="hairline-b pb-2">
            Your inputs never leave your browser: no accounts, no database, localStorage only.
          </li>
        </ul>
      </section>
    </article>
  );
}
