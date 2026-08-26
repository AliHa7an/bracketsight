import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { listRuleCitations, resolveRules } from "@/engines/repayment";
import { formatDate, formatMonths, usd } from "@/components/ui";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/loans/sources");

export default function SourcesPage() {
  const asOf = new Date().toISOString().slice(0, 10);
  const groups = listRuleCitations(asOf);
  const rules = resolveRules(asOf);
  const { rap, planTerms, tieredStandard, poverty, tax } = rules;
  const contiguous = poverty.guidelines.CONTIGUOUS_48;
  const alaska = poverty.guidelines.ALASKA;
  const hawaii = poverty.guidelines.HAWAII;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">Sources</h1>
        <p className="text-dim mt-1">
          Every parameter in the engine lives in a versioned rule file citing a primary source
          — regulation, statute, or agency guidance, never a blog. This table renders directly
          from those files, so it cannot drift from what the engine actually computes.
        </p>
      </header>

      <div className="overflow-x-auto border border-rule rounded-atlas surface-raised">
        <table className="w-full text-[0.9rem] border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-rule text-left text-[0.75rem] uppercase tracking-wide text-dim">
              <th scope="col" className="px-3 py-2 font-medium">Rule set</th>
              <th scope="col" className="px-3 py-2 font-medium">Primary sources</th>
              <th scope="col" className="px-3 py-2 font-medium">Last verified</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) =>
              g.citations.map((c, i) => (
                <tr key={`${g.ruleSet}-${c.label}`} className="border-b border-rule align-top">
                  {i === 0 && (
                    <th
                      scope="rowgroup"
                      rowSpan={g.citations.length}
                      className="px-3 py-2.5 text-left font-data font-normal"
                    >
                      {g.ruleSet}
                    </th>
                  )}
                  <td className="px-3 py-1">
                    {/* The cell's padding used to carry the row height while
                        the link itself was a 17px strip. Moving the height onto
                        the link makes the thing you tap the thing that is 44px,
                        at the same row rhythm. */}
                    <a
                      href={c.url}
                      rel="noopener noreferrer"
                      className="rounded-atlas flex min-h-11 items-center underline underline-offset-4 hover:text-signal"
                    >
                      {c.label}
                    </a>
                    {/* A Federal Register cite is an identifier, and the system
                        puts codes and IDs in the data face alongside numbers. */}
                    {c.fedRegCite ? (
                      <span className="text-dim">
                        {" · "}
                        <span className="num">{c.fedRegCite}</span>
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 font-data">{c.lastVerified}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="s-rise">
        <h2 id="s-rise" className="mb-2">
          One document settles most of the numbers on this site
        </h2>
        <p>
          The RISE final rule — <span className="num">91 Fed. Reg. 23768</span>, FR Doc.{" "}
          <span className="num">2026-08556</span>, published{" "}
          <span className="num">1 May 2026</span> and effective{" "}
          <span className="num">1 Jul 2026</span> — rewrote{" "}
          <span className="num">34 C.F.R. parts 674, 682 and 685</span>, and three of the five
          rule sets above are read from it. It was retrieved in full from govinfo.gov, which
          serves the identical GPO text, because eCFR and the Federal Register&apos;s own site
          redirect every automated request to a block page.
        </p>
        <p className="mt-2">
          What it settles, verbatim: RAP&apos;s bracket table at{" "}
          <span className="num">§ 685.209(b)(2)</span> — a flat{" "}
          <span className="num">{usd(rap.lowIncomeAnnualBaseCents)}</span> a year at or below{" "}
          <span className="num">{usd(rap.lowIncomeThresholdCents)}</span> of adjusted gross
          income, then <span className="num">{rap.bracketStartPct}%</span> rising by a point per{" "}
          <span className="num">{usd(rap.bracketStepCents)}</span> to a{" "}
          <span className="num">{rap.bracketMaxPct}%</span> ceiling. The{" "}
          <span className="num">{usd(rap.dependentReductionCents)}</span> per-dependent reduction
          and the fact that it is applied to the monthly figure rather than the annual one. The{" "}
          <span className="num">{usd(rap.minimumMonthlyPaymentCents)}</span> floor. The interest
          waiver at <span className="num">§ 685.209(h)(4)(i)</span>, which waives rather than
          capitalises. The <span className="num">{usd(rap.principalMatchCents)}</span> principal
          match. RAP&apos;s <span className="num">{rap.forgivenessAfterPayments}</span>-payment
          clock, and the absence of any &ldquo;lesser of&rdquo; clause capping RAP at the
          Standard payment — the omission that makes the plan uncapped, which is the single
          most consequential fact the engine encodes.
        </p>
        <p className="mt-2">
          The same document settles the older plans: old IBR at{" "}
          <span className="num">{planTerms.ibrOld.discretionaryPct}%</span> of discretionary
          income over <span className="num">{planTerms.ibrOld.forgivenessAfterPayments}</span>{" "}
          payments, new IBR and PAYE at{" "}
          <span className="num">{planTerms.ibrNew.discretionaryPct}%</span> over{" "}
          <span className="num">{planTerms.ibrNew.forgivenessAfterPayments}</span>, ICR at{" "}
          <span className="num">{planTerms.icr.discretionaryPct}%</span> against a{" "}
          <span className="num">{planTerms.icr.povertyMultiplierPct}%</span> poverty multiplier,
          with an alternative amortisation running{" "}
          <span className="num">{formatMonths(planTerms.icr.alternativeAmortisationMonths)}</span>;
          the four Tiered Standard balance tiers, the last running{" "}
          <span className="num">
            {formatMonths(tieredStandard.tiers[tieredStandard.tiers.length - 1]?.termMonths ?? 0)}
          </span>
          ; the <span className="num">{formatDate(planTerms.paye.sunsetDate)}</span> end of PAYE
          and ICR; where a borrower who does not elect a plan is placed on that date; and the
          restriction that limits anyone with a loan disbursed on or after{" "}
          <span className="num">{formatDate(planTerms.post2026RestrictionDate)}</span> to RAP or
          the Tiered Standard.
        </p>
        <p className="mt-2">
          What it does not settle, and cannot: ICR&apos;s income-percentage factor, which{" "}
          <span className="num">§ 685.209(f)(4)(i)(A)</span> assigns to a Federal Register
          notice the Department publishes <em>annually</em> — a separate document that has not
          been located, leaving that factor at an unverified{" "}
          <span className="num">1.0</span> in the engine. The Graduated plan&apos;s step
          interval, because the regulation prescribes only &ldquo;payments at two or more
          levels&rdquo; and sets no spacing; the{" "}
          <span className="num">{planTerms.graduated.stepMonths}</span>-month step is a servicer
          convention. And anything to do with tax, which lives in a different title of the code.
          Last read <span className="num">{formatDate(rap.citations[0]?.lastVerified ?? asOf)}</span>
          . What would move it: a new Department rulemaking or an amendment to the Higher
          Education Act — re-checked each <span className="num">1 July</span>, the anniversary of
          the rule taking effect.
        </p>
      </section>

      <section aria-labelledby="s-poverty">
        <h2 id="s-poverty" className="mb-2">
          The poverty guidelines set the floor under three plans and touch RAP not at all
        </h2>
        <p>
          The HHS table published by ASPE settles one input: the protected income subtracted
          before an income-driven payment is computed. The{" "}
          <span className="num">{poverty.ruleSetVersion.slice(-4)}</span> figures are{" "}
          <span className="num">{usd(contiguous.firstPersonCents)}</span> for the first person
          and <span className="num">{usd(contiguous.additionalPersonCents)}</span> for each
          additional person in the contiguous <span className="num">48</span> states and DC,{" "}
          <span className="num">{usd(alaska.firstPersonCents)}</span> and{" "}
          <span className="num">{usd(alaska.additionalPersonCents)}</span> in Alaska, and{" "}
          <span className="num">{usd(hawaii.firstPersonCents)}</span> and{" "}
          <span className="num">{usd(hawaii.additionalPersonCents)}</span> in Hawaii. IBR and
          PAYE protect <span className="num">{planTerms.ibrNew.povertyMultiplierPct}%</span> of
          that figure; ICR protects{" "}
          <span className="num">{planTerms.icr.povertyMultiplierPct}%</span>.
        </p>
        <p className="mt-2">
          What it does not settle is any RAP figure. RAP is computed on gross adjusted gross
          income with no exempted income at all, so a change to this table moves every IBR, PAYE
          and ICR payment on the site and leaves RAP byte-for-byte identical. One further
          subtlety the regulation settles and the table does not: student loan repayment uses the
          guidelines <em>currently in effect</em>, not the prior year&apos;s — which is the
          opposite of how the same table is used for health insurance subsidies. Last read{" "}
          <span className="num">
            {formatDate(poverty.citations[0]?.lastVerified ?? asOf)}
          </span>
          . What would move it: HHS publishes a new table every January, and when it does a new
          dated file is created rather than this one edited, so an older scenario keeps resolving
          to the guidelines that were in force when it ran.
        </p>
      </section>

      <section aria-labelledby="s-tax">
        <h2 id="s-tax" className="mb-2">
          The tax sources settle whether forgiveness is taxed, not what it would cost you
        </h2>
        <p>
          <span className="num">26 U.S.C. § 108(f)</span> settles two things.{" "}
          <span className="num">§ 108(f)(5)</span> excluded discharged student debt from income
          only for discharges &ldquo;after December 31, 2020, and before January 1, 2026&rdquo;;
          that window has closed, so a balance forgiven under RAP or IBR today is
          cancellation-of-debt income. <span className="num">§ 108(f)(1)</span> permanently
          excludes a discharge conditioned on working a period of time in certain professions for
          a broad class of employers — the provision PSLF relies on, with no sunset. IRS Topic{" "}
          <span className="num">431</span> was read as a live cross-check and still describes the
          same closing date, which is evidence the exclusion was not quietly extended.
        </p>
        <p className="mt-2">
          What these sources do not settle is the number in your results. The{" "}
          <span className="num">{tax.assumedMarginalRatePct}%</span> marginal rate the engine
          applies to a taxable forgiven balance is a flat modelling estimate for ranking
          purposes, not a regulatory figure and not verifiable as one: your real rate depends on
          the forgiven amount stacking on top of your other income in the discharge year. State
          treatment diverges from federal and is not modelled at all. Neither is tax advice, and
          neither should be read as a prediction of what you will owe.
        </p>
        <p className="mt-2">
          One caveat sits under the first paragraph and is not resolved. The statutory text was
          obtained from the <span className="num">2024</span> edition of the U.S. Code, because
          the House&apos;s own code server refused connection; a later amendment to{" "}
          <span className="num">§ 108(f)</span> therefore cannot be ruled out from a primary
          source. The rule file records both tax citations as last verified{" "}
          <span className="num">{formatDate(tax.citations[0]?.lastVerified ?? asOf)}</span>. What
          would move this: Congress restoring the lapsed exclusion, which it can do
          retroactively. Re-checked every January, alongside the bracket assumption.
        </p>
      </section>

      <section aria-labelledby="s-unopened">
        <h2 id="s-unopened" className="mb-2">
          Three citations here have never been opened
        </h2>
        <p>
          Two point at a CRS product and at{" "}
          <span className="num">P.L. 119-21</span> on congress.gov, which returns{" "}
          <span className="num">403</span> to every automated client; a third cites the same
          public law from the plan-terms file. None has been read, so none is treated as
          discharging anything, even though every figure they would support is independently
          verified against the RISE rule text above. A link that has not been opened is an open
          item.
        </p>
        <p className="mt-2">
          There is a second reason to be careful with those two. The RISE rule consistently calls{" "}
          <span className="num">P.L. 119-21</span> the &ldquo;Working Families Tax Cuts
          Act&rdquo;, while the citation label on this site calls it the &ldquo;One Big Beautiful
          Bill Act&rdquo;. One of those short titles is wrong, and the question cannot be settled
          from a document nobody could fetch. The label is left as it is and flagged rather than
          silently corrected to the more likely-looking option.
        </p>
      </section>

      <section aria-labelledby="s-open">
        <h2 id="s-open" className="mb-2">What is still open</h2>
        <p>
          A primary-source pass on <span className="num">15 Aug 2026</span> read the RISE rule in
          full and closed the three items this page previously listed as pending — the{" "}
          <span className="num">2026</span> poverty guidelines, the exact Tiered Standard
          brackets, and RAP&apos;s behaviour at exact{" "}
          <span className="num">{usd(rap.bracketStepCents)}</span> multiples, where the
          regulation&apos;s &ldquo;more than $X and not more than $Y&rdquo; construction puts a
          boundary income in the lower band. What remains open is listed above in the section for
          each source: ICR&apos;s annual factor, the Graduated step interval, the assumed marginal
          rate, the <span className="num">2024</span> code edition, and the three unopened
          citations. The engine additionally models only one limb of each of the two-limb PAYE and
          IBR new-borrower tests, which the regulation does settle but the form does not yet ask
          about — that one is a modelling gap rather than a sourcing gap, and it is described on
          the{" "}
          <Link href="/loans/methodology" className="underline underline-offset-4">
            methodology page
          </Link>
          .
        </p>
        <p className="mt-2">
          None of those gaps has been filled with an estimate. Where a source could not be
          reached, the encoded value stays as it is and the gap is recorded. How errors get
          corrected is covered in the{" "}
          <Link href="/loans/editorial-policy" className="underline underline-offset-4">
            editorial policy
          </Link>
          ; rule changes appear in the{" "}
          <Link href="/loans/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          within 48 hours.
        </p>
      </section>

      <section aria-labelledby="s-drift">
        <h2 id="s-drift" className="mb-2">Why this page cannot disagree with the calculator</h2>
        <p>
          The table at the top is not maintained. It is the citation array of each rule file,
          read through the same function the simulation calls to resolve which rules apply on a
          given date — today that composite is{" "}
          <span className="num">{rules.ruleSetVersion.replace(/\+/g, " + ")}</span>. A figure
          cannot be corrected in the engine and left stale here, because there is no second copy
          of it here to leave stale. The same is true of every last-verified date on this page:
          moving one means editing the rule file it belongs to.
        </p>
      </section>
    </div>
  );
}
