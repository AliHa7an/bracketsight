import type { Metadata } from "next";
import Link from "next/link";
import {
  ENGINE_VERSION,
  applicablePercentageBps,
  cliffEdgeMagi,
  csrTopPct,
  eligibilityCeilingPct,
  formatUsd,
  fplFor,
  getRules,
  magiAtPctEdge,
} from "@/engines/aca";
import { FactTable } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/aca/methodology" },
  title: "Methodology — How the Premium Tax Credit Is Computed",
  description:
    "Every formula the subsidy engine runs: MAGI, the poverty-guideline lag, applicable-percentage interpolation, the benchmark, CSR bands, reconciliation, simplifications.",
};

/** Percent formatted from basis points to a hundredth — the Form 8962 grain. */
function pct(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export default function MethodologyPage() {
  const rules = getRules();
  const ceilingPct = eligibilityCeilingPct(rules);
  const sentinel = rules.applicablePct.eligibilityCeiling.ineligibleSentinelPct;

  const fpl1 = fplFor(1, "CONTIGUOUS_48", rules);
  const fpl4 = fplFor(4, "CONTIGUOUS_48", rules);
  const edge1 = cliffEdgeMagi(fpl1, rules);
  const edge4 = cliffEdgeMagi(fpl4, rules);

  const csrTop = csrTopPct(rules);
  const csrEdge1 = magiAtPctEdge(fpl1, csrTop, rules);

  const bands = rules.applicablePct.bands;
  const firstBand = bands[0]!;
  const topBand = bands[bands.length - 1]!;
  // A worked interpolation, taken at the midpoint of a band the engine owns —
  // the input is chosen here, every output below comes from the engine.
  const workedBand = bands[2]!;
  const workedPct = workedBand.fromPct + Math.round((workedBand.toPct - workedBand.fromPct) / 2);
  const workedBps = applicablePercentageBps(workedPct, rules);

  const groups = rules.fpl.groups;
  const c = rules.contributionLimits;

  const expansion = rules.medicaidExpansion.states;
  const nonExpansion = Object.entries(expansion)
    .filter(([, expanded]) => !expanded)
    .map(([code]) => code);
  const expandedCount = Object.keys(expansion).length - nonExpansion.length;

  const ageFactors = rules.slcsp.ageFactorsPermille;
  const factor0 = ageFactors["0"]!;
  const factor21 = ageFactors["21"]!;
  const factor64 = ageFactors["64"]!;

  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Methodology</h1>
      <p className="text-ink">
        Every number Bracketsight shows is produced by a deterministic,
        open-formula engine with zero AI in the calculation path. Money is
        integer cents; rates are basis points; every threshold lives in
        versioned JSON with citations (
        <Link href="/aca/sources" className="underline underline-offset-4">
          sources
        </Link>
        ). Engine <span className="num">{ENGINE_VERSION}</span>, ruleset{" "}
        <span className="num">{rules.ruleSetVersion}</span>. What follows is the
        whole calculation in the order the engine performs it, including the
        places where it stops short of the law and what that costs you.
      </p>

      <section className="space-y-3">
        <h2>MAGI is adjusted gross income plus three add-backs, and nothing is subtracted</h2>
        <p className="text-ink">
          The engine builds household income as AGI + tax-exempt interest +
          excluded foreign earned income and housing + the non-taxable portion
          of Social Security benefits. That is the IRC §36B(d)(2)(B) definition
          and it is the only MAGI this section uses. It is not the MAGI that
          governs traditional-IRA deductibility and not the one that governs
          the net investment income tax; the three definitions differ, and
          assuming otherwise is a reliable way to be wrong by a few thousand
          dollars at exactly the wrong moment.
        </p>
        <p className="text-ink">
          Two consequences of that arithmetic are worth stating plainly. First,{" "}
          <strong>AGI is an input, not a derivation</strong> — the engine never
          rebuilds it from gross income, so every above-the-line adjustment you
          intend to take must already be inside the figure you type. Second,{" "}
          <strong>nothing below the line moves MAGI</strong>: the standard
          deduction and itemised deductions both sit after AGI and cannot pull a
          household back from the cliff — only above-the-line adjustments, the
          ones already inside AGI, can. The three add-backs are rejected if
          negative. AGI is not, so a
          loss year can produce a MAGI of zero or less, which the engine reports
          as <span className="num">0%</span> of the poverty line rather than a
          negative percentage.
        </p>
      </section>

      <section className="space-y-3">
        <h2>2026 coverage runs on the 2025 poverty guidelines, and the lag is the rule</h2>
        <p className="text-ink">
          Marketplace eligibility for a coverage year uses the HHS poverty
          guidelines in effect at the start of that year&apos;s open-enrollment
          period — that is, the guidelines published in the{" "}
          <em>previous</em> calendar year. A 2026 credit is therefore computed
          on the 2025 guidelines, and the newer figures published in January
          2026 belong to 2027 coverage. Substituting them would inflate every
          poverty line by roughly two percent and move the cliff by hundreds of
          dollars in the wrong direction, so the engine keeps the guideline year
          and the coverage year as two separate, dated facts.
        </p>
        <div className="hairline-all rounded-atlas">
          <FactTable
            caption="Annual poverty guideline by state group, as encoded"
            captionVisible
            rows={[
              {
                key: "Contiguous 48 states and DC",
                value: `${formatUsd(groups.CONTIGUOUS_48.firstPersonCents)} + ${formatUsd(groups.CONTIGUOUS_48.additionalPersonCents)} per additional person`,
              },
              {
                key: "Alaska",
                value: `${formatUsd(groups.ALASKA.firstPersonCents)} + ${formatUsd(groups.ALASKA.additionalPersonCents)} per additional person`,
              },
              {
                key: "Hawaii",
                value: `${formatUsd(groups.HAWAII.firstPersonCents)} + ${formatUsd(groups.HAWAII.additionalPersonCents)} per additional person`,
              },
            ]}
          />
        </div>
        <p className="text-ink">
          The line is linear in family size —{" "}
          <span className="num">firstPerson + (familySize − 1) × additional</span>{" "}
          — which reproduces every printed row of the Federal Register table
          exactly and matches the notice&apos;s own instruction for households
          larger than eight. Puerto Rico and the other outlying jurisdictions
          have no poverty guidelines at all; the engine maps every state that is
          not Alaska or Hawaii into the contiguous group, which is safe only
          because this tool covers the fifty states and DC.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          The ceiling test runs before the truncation, so {ceilingPct}.9% is{" "}
          {sentinel}
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
          the poverty line; if it is, you write {sentinel} on line 5 and stop, and
          line 6 says you are not eligible. Truncation is reached only in the
          &ldquo;no&rdquo; branch. So there is no grace band above the edge:
          400.9% of FPL is {sentinel}, not {ceilingPct}, and the last eligible income is
          exactly four times the poverty line —{" "}
          <span className="num">{formatUsd(edge1, true)}</span> for one person
          and <span className="num">{formatUsd(edge4, true)}</span> for a family
          of four in the contiguous 48. Both figures are engine output pinned by
          tests, not typed into this page.
        </p>
        <p className="text-ink">
          Truncation still governs every <em>interior</em> boundary, and there
          the arithmetic is different: floor(MAGI × 100 ÷ FPL) ≤ n holds until
          MAGI reaches (n+1) × FPL ÷ 100, so the highest MAGI still inside band
          n is <span className="num">ceil((n+1) × FPL ÷ 100) − 1</span> cents. The
          engine uses that formula at the applicable-percentage band edges and
          at the {csrTop}% cost-sharing ledge, and the strict multiple test only
          at the ceiling. Both percentages are reported: a precise basis-point
          figure drives the meter, and the Form 8962 whole percent drives
          eligibility.
        </p>
        <p className="text-ink">
          <strong>What this rests on:</strong> the 2026 Form 8962 and its
          instructions are not published — the IRS releases a tax year&apos;s
          form around January of the following year. The step order encoded here
          comes from the 2025 and 2020 editions, which agree word for word
          across the ARPA boundary. That is strong evidence and it is not the
          2026 document, so the two edge figures above are re-confirmed rather
          than assumed once the form appears. The open item is tracked on the{" "}
          <Link href="/aca/changelog" className="underline underline-offset-4">
            changelog
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2>The applicable percentage is interpolated inside its band, not stepped</h2>
        <div className="hairline-all rounded-atlas">
          <FactTable
            caption="Applicable percentage of MAGI by Form 8962 FPL percentage"
            captionVisible
            rows={bands.map((band) => ({
              key:
                band === topBand
                  ? `At least ${band.fromPct}% and not more than ${band.toPct}%`
                  : `At least ${band.fromPct}% but less than ${band.toPct}%`,
              value:
                band.lowBps === band.highBps
                  ? pct(band.lowBps)
                  : `${pct(band.lowBps)} → ${pct(band.highBps)}`,
            }))}
          />
        </div>
        <p className="text-ink">
          Each band declares a percentage at its lower edge and a percentage at
          its upper edge, and the figure that applies to a household is
          interpolated linearly between them on the truncated whole percent,
          then rounded to the nearest whole basis point — one hundredth of a
          percent. A household at <span className="num">{workedPct}%</span> of
          the poverty line sits{" "}
          <span className="num">
            {workedPct - workedBand.fromPct}
          </span>{" "}
          points into the {workedBand.fromPct}–{workedBand.toPct} band, so its
          applicable percentage is{" "}
          <span className="num">{pct(workedBps)}</span> rather than the{" "}
          <span className="num">{pct(workedBand.lowBps)}</span> at the band
          floor. Expected contribution is then{" "}
          <span className="num">MAGI × applicablePercentage</span>, annual, on
          the whole MAGI.
        </p>
        <p className="text-ink">
          Two boundary details matter. The final band includes{" "}
          <span className="num">{topBand.toPct}%</span> exactly, which is why a
          household landing precisely on four times the poverty line still gets
          a credit at <span className="num">{pct(topBand.highBps)}</span>. And
          the <span className="num">{firstBand.fromPct}%</span> floor on the
          first band is not from the indexing revenue procedure — that table
          starts open-ended below {firstBand.toPct}% — it comes from the
          statutory applicable-taxpayer definition. The engine will throw rather
          than guess if a lookup is ever attempted outside the table, which is
          why eligibility is gated first and the lookup happens second.
        </p>
      </section>

      <section className="space-y-3">
        <h2>The benchmark is a plan you may never enrol in</h2>
        <p className="text-ink">
          The credit is measured against the second-lowest-cost Silver plan
          available in your county for the members enrolling — not against the
          plan you buy. Per member, the engine takes the county&apos;s age-21
          base monthly premium, multiplies by that member&apos;s age factor from
          the federal default curve, rounds half away from zero at that point,
          sums across members, and multiplies by twelve. Rounding therefore
          happens per member per month, before annualisation, which is the
          convention premiums are actually quoted in.
        </p>
        <p className="text-ink">
          The curve spans <span className="num">{(factor0 / 1000).toFixed(3)}</span>{" "}
          for ages 0–14 through{" "}
          <span className="num">{(factor21 / 1000).toFixed(3)}</span> at age 21
          to <span className="num">{(factor64 / 1000).toFixed(3)}</span> at 64 —
          the binding 3:1 maximum age variation. Ages are clamped into the 0–64
          range because the top key means &ldquo;64 and older&rdquo;, so a
          member older than 64 is priced at the 64 factor rather than falling
          through. All 65 factors were diffed against the CMS age-curve guidance
          with zero mismatches. The curve is only a federal <em>default</em>,
          though: it applies where a state has not set its own, and New York and
          Vermont use a 1:1 individual-market ratio, meaning premiums there do
          not vary by age at all. No New York or Vermont county is in the sample
          table, so that mismatch is latent today and becomes live the moment
          real data lands.
        </p>
        <p className="hairline-all rounded-atlas p-4">
          <strong>The benchmark premiums themselves are sample data.</strong>{" "}
          The engine ships {rules.slcsp.counties.length} counties —{" "}
          {rules.slcsp.counties.map((county) => county.label).join(", ")} — and
          their age-21 base premiums are invented, plausible-magnitude figures
          written so the engine and interface could be built and tested. There
          is nothing in them to verify; they must be <em>replaced</em> from the
          CMS Marketplace public use files. Every premium, credit and dollar
          figure derived from them is illustrative. The engine also never asks
          which plan you enrolled in, so what it reports is the credit computed
          against the benchmark; confirm the amount that applies to your own
          plan with the marketplace.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Everything is annual; the monthly figure is the annual one divided by twelve</h2>
        <p className="text-ink">
          The engine computes an annual benchmark, an annual expected
          contribution and an annual credit, then reports a monthly credit as
          the annual figure divided by twelve and rounded half away from zero.
          It models twelve months of identical coverage: same household, same
          family size, same enrolled members, same benchmark premium, every
          month. It does not model a mid-year enrolment, a member ageing into a
          higher factor part-way through the year, a birth, a marriage, a move
          to another rating area, or a month in which someone became eligible
          for employer coverage. If any of those describe your year, treat the
          annual figure as a planning estimate and let the marketplace and your
          return handle the months separately.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Cost-sharing reductions stop at {csrTop}% and take the whole band with them</h2>
        <div className="hairline-all rounded-atlas">
          <FactTable
            caption="Cost-sharing reduction bands, Silver plans only"
            captionVisible
            rows={rules.csrBands.bands.map((band) => ({
              key: `${band.fromPct}–${band.toPct}% of the poverty line`,
              value: `about ${band.actuarialValueBps / 100}% actuarial value`,
            }))}
          />
        </div>
        <p className="text-ink">
          Cost-sharing reductions lower deductibles, copays and the
          out-of-pocket maximum; they do not lower the premium, and they exist
          only inside a Silver plan. One dollar past a band boundary drops the
          whole band, which is a second cliff with smaller dollars attached —
          the meter draws it as a ledge. For one person in the contiguous 48
          the top of the ladder falls at{" "}
          <span className="num">{formatUsd(csrEdge1, true)}</span> of MAGI,
          computed with the truncation formula rather than the strict multiple,
          because unlike the {ceilingPct}% ceiling this genuinely is a truncation
          boundary.
        </p>
        <p className="text-ink">
          The percentages are approximate by regulation, not by our rounding:
          issuers must file Silver variations at those actuarial values{" "}
          <em>plus or minus a de minimis variation</em>, so a real plan lands
          near the band figure rather than on it. Cost-sharing eligibility also
          rides on premium-credit eligibility — no credit, no reduction — which
          is why crossing the {ceilingPct}% cliff removes both at once.
        </p>
      </section>

      <section className="space-y-3">
        <h2>For 2026 there is no cap on repaying advance credit, at any income</h2>
        <p className="text-ink">
          Advance payments are reconciled on Form 8962: the engine subtracts the
          final credit from the advance credit actually paid to the insurer. A
          negative difference is refunded as net premium tax credit. A positive
          difference is repaid, and{" "}
          <strong>for 2026 the whole of it is repaid at every income level</strong>.
          The statutory limitation of IRC §36B(f)(2)(B), which used to cap the
          damage below {ceilingPct}% FPL, was struck by Pub. L. 119-21 §71305 for
          tax years beginning after 31 December 2025. A household at 250% of the
          poverty line repays exactly what one at 405% does: everything.
        </p>
        <p className="text-ink">
          Whether a limitation exists at all is carried as data, not logic. The
          rules file holds{" "}
          <span className="num">
            limitation.inEffect = {String(rules.repaymentLimits.limitation.inEffect)}
          </span>{" "}
          with{" "}
          <span className="num">{rules.repaymentLimits.limitation.bands.length}</span>{" "}
          bands, and the empty array is the encoded rule rather than missing
          data. A future year that reinstates a cap is a new dated ruleset, not
          a code change. The reconciliation code refuses to run at all if a
          ruleset ever declares a limitation in effect while shipping no bands —
          it throws rather than reaching an uncapped answer by coincidence. The
          repealed band structure is retained in the file under a
          provenance-only key that the engine does not read, so a reinstatement
          has a shape to copy.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Below the poverty line the answer depends on your state, and a boolean cannot carry it</h2>
        <p className="text-ink">
          The engine holds an expansion flag for all{" "}
          <span className="num">{Object.keys(expansion).length}</span>{" "}
          jurisdictions: <span className="num">{expandedCount}</span> expanded,
          and <span className="num">{nonExpansion.length}</span> not —{" "}
          {nonExpansion.join(", ")}. In an expansion state, a household below
          138% of the poverty line is routed to Medicaid rather than a
          marketplace credit. In a non-expansion state, a household below 100%
          falls into the coverage gap — generally no credit and no Medicaid —
          while the 100–138% range stays credit-eligible, which is the one place
          where not expanding leaves a household with more marketplace help
          rather than less.
        </p>
        <p className="text-ink">
          The 138% figure surprises people who look up the statute and find
          133%. Both are right: the expansion group is written at 133% of the
          poverty line and the eligibility rules apply a five-percentage-point
          income disregard on top, so the operative number is 138%.
        </p>
        <p className="text-ink">
          Three things the flag cannot express, each of which changes the advice:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Georgia is not simply &ldquo;not expanded&rdquo;.</strong>{" "}
            It runs a partial programme covering adults to 100% of the poverty
            line conditioned on 80 hours a month of work or qualifying activity.
            A Georgia household at 90% FPL is told by the flag that it is in the
            coverage gap and may in fact be Medicaid-eligible.
          </li>
          <li>
            <strong>Wisconsin has no coverage gap.</strong> It never adopted the
            expansion group, so the flag is correctly false, but it covers
            childless adults to 100% of the poverty line under a waiver. A
            blanket coverage-gap message is wrong there.
          </li>
          <li>
            <strong>Several expansion states go well above 138%</strong> — DC,
            Minnesota and New York among them — so any copy saying
            &ldquo;Medicaid up to 138% in your state&rdquo; understates them.
          </li>
        </ul>
        <p className="text-ink">
          One more open item sits in this branch. The 2025 form instructions
          describe two below-100% paths to a credit, and the statutory hook for
          the second — the treatment of certain lawfully present non-citizens —
          was struck for tax years after 2025 by the same public law that
          removed the repayment cap. The below-100% logic therefore needs
          re-derivation for 2026 and is recorded as open rather than quietly
          assumed. Separately, married filing separately is generally ineligible
          for the credit under §36B(c)(1)(C); the survivor-of-abuse and
          abandonment exception is surfaced as a note and is not modelled.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Money is integer cents and rates are integer basis points</h2>
        <p className="text-ink">
          Every currency value is an integer number of cents and the engine
          throws if a non-integer reaches a money function, because floats are
          never money. Rates are integer basis points —{" "}
          <span className="num">{pct(topBand.highBps)}</span> is stored as{" "}
          <span className="num">{topBand.highBps}</span>. Division rounds half
          away from zero, matching everyday tax-form arithmetic rather than
          JavaScript&apos;s default, which rounds negative halves toward
          positive infinity. That single rule governs the applicable-percentage
          multiplication, the age-factor multiplication, the precise FPL
          percentage and the monthly credit.
        </p>
        <p className="text-ink">
          Truncation is the deliberate exception, it applies only to the Form
          8962 FPL percentage, and it lives in one module so it cannot leak.
          Currency formatting is hand-rolled rather than delegated to the
          platform&apos;s internationalisation library, so the same inputs
          produce byte-identical output on every runtime — determinism is an
          invariant, not a preference.
        </p>
      </section>

      <section className="space-y-3">
        <h2>
          The self-employed health insurance deduction is circular with the credit
        </h2>
        <p className="text-ink">
          The SEHI deduction and the credit define each other: the deduction
          lowers MAGI, a lower MAGI raises the credit, a higher credit lowers
          the out-of-pocket premium that is deductible, which raises MAGI
          again. Rev. Proc. 2014-41 blesses an iterative method. Bracketsight
          iterates <span className="num">d ← min(premium − PTC(MAGI − d), earned-income limit)</span>{" "}
          until successive values differ by no more than $1.00, capped at 50
          iterations. Because the credit multiplies each step by roughly the
          applicable percentage, the sequence contracts and converges in a
          handful of steps in ordinary cases. The earned-income ceiling is net
          self-employment profit less half of self-employment tax less any SEP
          contribution already made.
        </p>
        <p className="text-ink">
          <strong>The cliff-edge oscillation:</strong> when the deduction is
          the only thing holding the household under {ceilingPct}%, the iteration
          can bounce between an over-the-cliff and an under-the-cliff answer.
          When that two-cycle is detected, the engine returns the smaller
          (conservative) deduction and flags the result for professional
          review rather than picking the flattering answer.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Levers are ranked by credit recovered per dollar committed</h2>
        <p className="text-ink">
          Each lever&apos;s remaining legal room is computed from the rules file
          and from what you have already contributed this year: the elective
          deferral limit of{" "}
          <span className="num">{formatUsd(c.elective401kCents)}</span> with an
          age-50 catch-up of{" "}
          <span className="num">{formatUsd(c.catchUp401k50Cents)}</span>; HSA
          limits of <span className="num">{formatUsd(c.hsaSelfOnlyCents)}</span>{" "}
          self-only and <span className="num">{formatUsd(c.hsaFamilyCents)}</span>{" "}
          family plus{" "}
          <span className="num">{formatUsd(c.hsaCatchUp55Cents)}</span> from
          age 55; an IRA limit of{" "}
          <span className="num">{formatUsd(c.iraCents)}</span> with{" "}
          <span className="num">{formatUsd(c.iraCatchUp50Cents)}</span> more
          from age 50, ratably phased out against employer-plan coverage and
          floored at $200 while inside the range; and a SEP ceiling of{" "}
          <span className="num">{c.sepEmployerPctBps / 100}%</span> of
          compensation net of the contribution itself, capped at{" "}
          <span className="num">{formatUsd(c.sepOverallCapCents)}</span>.
          Deferrals are additionally capped at your W-2 wages and IRA
          contributions at your earned income, because you cannot defer money
          you did not earn.
        </p>
        <p className="text-ink">
          Each lever is then re-run through the whole credit calculation at the
          reduced MAGI, and ranked by dollars of credit recovered per dollar
          committed. A lever that cannot on its own bring the household back
          under the ceiling says so and reports how much of the required
          reduction it covers. Landing exactly on the edge triggers its own
          warning, because a December mutual-fund distribution does not care how
          carefully you planned. Income timing is listed advisory-only, carries
          no computed amount, and is never auto-advised.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Documented simplifications and what each one costs</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Benchmark premiums are invented sample data.</strong> Every
            credit, clawback and lever figure computed from them is illustrative
            until the CMS public use files are ingested. Those files also cover
            only the states using the federal marketplace, so roughly a third of
            the population needs separate state adapters.
          </li>
          <li>
            <strong>The model is annual.</strong> No month-by-month variation in
            coverage, family size, ages or premium.
          </li>
          <li>
            <strong>The IRA phase-out uses §36B MAGI as a proxy</strong> for the
            IRA-specific MAGI. Near a phase-out edge the deductible amount can be
            slightly off, in either direction.
          </li>
          <li>
            <strong>The SEP lever models the employer contribution only.</strong>{" "}
            A Solo 401(k) employee deferral can add more room on top if you have
            no workplace deferrals — the engine flags this rather than modelling
            it, so the room shown is a floor.
          </li>
          <li>
            <strong>The HSA catch-up is modelled for the primary taxpayer only</strong>,
            and the engine does not check that your plan actually meets the
            high-deductible definition. Confirm eligibility before contributing.
          </li>
          <li>
            <strong>The age 60–63 catch-up is not modelled at all</strong>, which
            understates available room for precisely the pre-Medicare age group
            most likely to be near the cliff. Both this and the
            high-deductible-plan gate are set out on{" "}
            <Link href="/aca/about" className="underline underline-offset-4">
              about
            </Link>
            .
          </li>
          <li>
            <strong>Employer-coverage affordability is not modelled.</strong>{" "}
            §36B carries its own affordability test for an offer of
            employer-sponsored coverage, with a required contribution percentage
            published annually alongside the applicable-percentage table. The
            engine has no input for an employer offer and applies no such test,
            so a household with one should not read this output as an
            eligibility answer.
          </li>
          <li>
            <strong>The federal default age curve is applied everywhere</strong>,
            including in states that use their own.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>What Bracketsight never does</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>No AI computes, adjusts, or sanity-checks any number.</li>
          <li>No specific insurance plan is ever recommended.</li>
          <li>Income timing is never auto-advised.</li>
          <li>Nothing you enter leaves your browser — no accounts, no database.</li>
          <li>
            No figure ships without a citation. Every threshold above traces to a
            primary source with a verification date on{" "}
            <Link href="/aca/sources" className="underline underline-offset-4">
              sources
            </Link>
            , and the standard those citations are held to is set out in the{" "}
            <Link href="/aca/editorial-policy" className="underline underline-offset-4">
              editorial policy
            </Link>
            . Run your own household through the{" "}
            <Link href="/aca" className="underline underline-offset-4">
              planner
            </Link>{" "}
            to see these formulas applied to real inputs.
          </li>
        </ul>
      </section>
    </article>
  );
}
