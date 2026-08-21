import type { Metadata } from "next";
import Link from "next/link";
import {
  computeCarLoanDeduction,
  computeDeductions,
  computeSeniorDeduction,
  computeTipsDeduction,
  fullyPhasedOutAt,
  grossOvertimePayCents,
  mulBps,
  overtimePremiumCents,
  phaseOutReduction,
  resolveRules,
  roundHalfUpToCent,
  taxSavings,
  thresholdFor,
} from "@/engines/paycheck";
import type { HouseholdInput, PhaseOutRule } from "@/engines/paycheck";
import { formatBps, formatCents, usd } from "@/lib/paycheck/format";
import { rulesMeta, TAX_YEAR } from "@/lib/paycheck/rules-meta";
import { AnswerBox, FactTable, LastVerified, SourceCitation } from "@/components/ui";
import { ContentsRail } from "@/components/content";

export const metadata: Metadata = {
  title: "OBBBA Deduction Methodology — Every Formula",
  description:
    "The exact formulas behind the OBBBA tips, overtime, senior and car-loan deductions: caps, shared-MAGI phase-outs, the bracket table, and integer-cent rounding.",
  alternates: { canonical: "/paycheck/methodology" },
};

const link =
  "text-ink underline decoration-rule underline-offset-4 hover:decoration-current";

/* ---- Illustrative inputs for the worked examples ------------------------ */
/* These are households the author chose to make an arithmetic visible. They
   are NOT rule values — every rule value on this page is imported. */

const OT_HOURS = 175;
const OT_REGULAR_RATE_CENTS = 2_333;
const TIPS_CLAIMED_CENTS = 500_000;
const TIPS_EXCESS_CENTS = 350_000;
const CAR_INTEREST_CENTS = 620_000;
const CAR_EXCESS_CENTS = 1_040_000;
const SENIOR_MAGI_CENTS = 20_000_000;
const TAX_EXAMPLE_MAGI_CENTS = 13_000_000;
const TAX_EXAMPLE_DEDUCTION_CENTS = 3_000_000;
const MARGINAL_WAGES_CENTS = 14_800_000;
const MARGINAL_TIPS_CENTS = 1_000_000;

/* ---- Phase-out rule accessors ------------------------------------------- */
/* PhaseOutRule is a union of two statutory models. Nothing below assumes
   which one a rule uses; each accessor returns an em dash if asked for a
   field the other model does not have. No rule value is typed by hand. */

function stepCents(rule: PhaseOutRule): number | null {
  return rule.model === "PER_1000_STEP" ? rule.reductionPer1000Cents : null;
}

function stepAmount(rule: PhaseOutRule): string {
  const cents = stepCents(rule);
  return cents === null ? "—" : usd(cents);
}

function stepDirection(rule: PhaseOutRule): string {
  if (rule.model !== "PER_1000_STEP") return "—";
  return rule.fractionCountsAsFullStep ? "up" : "down";
}

/** How many whole $1,000 steps a given reduction represents. */
function stepsTaken(rule: PhaseOutRule, reductionCents: number): string {
  const cents = stepCents(rule);
  if (cents === null || cents === 0) return "—";
  return String(Math.round(reductionCents / cents));
}

function percentOfExcess(rule: PhaseOutRule): string {
  return rule.model === "PERCENT_OF_EXCESS" ? formatBps(rule.percentOfExcessBps) : "—";
}

export default function MethodologyPage() {
  const rules = resolveRules(TAX_YEAR);
  const meta = rulesMeta(TAX_YEAR);

  /* ------------------------------------------------------------------ */
  /* Worked examples. Every INPUT below is an illustrative household the  */
  /* author chose; every OUTPUT is returned by the engine at render time, */
  /* so no figure on this page can drift from the code that produces it.  */
  /* ------------------------------------------------------------------ */

  const firstOccupation = rules.occupations.occupations[0];

  /* Overtime: 175 hours at $23.33 — a rate chosen because the premium
     lands on a half-cent and shows the rounding rule doing work. */
  const overtimeExample: HouseholdInput = {
    taxYear: TAX_YEAR,
    filingStatus: "SINGLE",
    wagesCents: 0,
    otherIncomeCents: 0,
    age: 40,
    overtime: {
      mode: "HOURS_RATE",
      overtimeHours: OT_HOURS,
      regularHourlyRateCents: OT_REGULAR_RATE_CENTS,
    },
  };
  const overtimePremium = overtimePremiumCents(overtimeExample, rules.overtime);
  const overtimeGross = grossOvertimePayCents(overtimeExample, rules.overtime);
  const overtimeStraightPay = roundHalfUpToCent(OT_HOURS * OT_REGULAR_RATE_CENTS);

  /* Tips: $5,000 of tips at $3,500 of MAGI over the single threshold. */
  const tipsThresholdSingle = thresholdFor(rules.tips.phaseOut, "SINGLE");
  const tipsExampleMagi = tipsThresholdSingle + TIPS_EXCESS_CENTS;
  const tipsExample: HouseholdInput = {
    taxYear: TAX_YEAR,
    filingStatus: "SINGLE",
    wagesCents: tipsExampleMagi - TIPS_CLAIMED_CENTS,
    otherIncomeCents: 0,
    age: 40,
    tips: {
      amountCents: TIPS_CLAIMED_CENTS,
      occupationCode: firstOccupation ? firstOccupation.code : null,
      selfEmployed: false,
      properlyReported: true,
    },
  };
  const tipsResult = computeTipsDeduction(
    tipsExample,
    tipsExampleMagi,
    rules.tips,
    rules.occupations,
  );
  const tipsReduction = tipsResult.phaseOut ? tipsResult.phaseOut.reductionCents : 0;

  /* Car loan: $6,200 of interest at $10,400 of MAGI over the threshold —
     a deliberately fractional excess, because this rule rounds up. */
  const carThresholdSingle = thresholdFor(rules.carLoan.phaseOut, "SINGLE");
  const carExampleMagi = carThresholdSingle + CAR_EXCESS_CENTS;
  const carExample: HouseholdInput = {
    taxYear: TAX_YEAR,
    filingStatus: "SINGLE",
    wagesCents: carExampleMagi,
    otherIncomeCents: 0,
    age: 40,
    carLoan: {
      interestPaidCents: CAR_INTEREST_CENTS,
      isNewVehicle: true,
      finalAssemblyInUS: true,
      loanOriginationDate: rules.carLoan.loanOriginatedOnOrAfter,
      personalUse: true,
    },
  };
  const carResult = computeCarLoanDeduction(carExample, carExampleMagi, rules.carLoan);
  const carReduction = carResult.phaseOut ? carResult.phaseOut.reductionCents : 0;

  /* Senior: a joint return, both spouses over the qualifying age,
     $200,000 of MAGI. */
  const seniorExampleMagi = SENIOR_MAGI_CENTS;
  const seniorExample: HouseholdInput = {
    taxYear: TAX_YEAR,
    filingStatus: "MARRIED_JOINT",
    wagesCents: 0,
    otherIncomeCents: seniorExampleMagi,
    age: rules.senior.qualifyingAge + 3,
    spouseAge: rules.senior.qualifyingAge + 6,
  };
  const seniorResult = computeSeniorDeduction(seniorExample, seniorExampleMagi, rules.senior);
  const seniorThresholdJoint = thresholdFor(rules.senior.phaseOut, "MARRIED_JOINT");
  const seniorPerPerson = Math.round(seniorResult.deductionCents / 2);
  /* What one extra $1,000 of MAGI removes from one person's senior amount. */
  const seniorPerThousand = phaseOutReduction(
    thresholdFor(rules.senior.phaseOut, "SINGLE") + 100_000,
    "SINGLE",
    rules.senior.phaseOut,
  );

  /* Bracket-exact saving: $130,000 of MAGI, $30,000 of deduction, single. */
  const taxExample = taxSavings(
    TAX_EXAMPLE_MAGI_CENTS,
    TAX_EXAMPLE_DEDUCTION_CENTS,
    "SINGLE",
    rules.brackets,
  );
  const taxExampleNaive = mulBps(TAX_EXAMPLE_DEDUCTION_CENTS, taxExample.marginalRateBps);

  /* The marginal next $1,000: a single tipped worker just past the
     threshold, where losing deduction and paying bracket tax compound. */
  const marginalExample = computeDeductions({
    taxYear: TAX_YEAR,
    filingStatus: "SINGLE",
    wagesCents: MARGINAL_WAGES_CENTS,
    otherIncomeCents: 0,
    age: 40,
    tips: {
      amountCents: MARGINAL_TIPS_CENTS,
      occupationCode: firstOccupation ? firstOccupation.code : null,
      selfEmployed: false,
      properlyReported: true,
    },
  });

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
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
        <ContentsRail />
      </header>

      <section className="density-reading">
        <h2>The engine does the same seven things every time it is called</h2>
        <p>
          There is one entry point, and it takes one household. Steps{" "}
          <span className="num">3</span> to <span className="num">6</span> then run twice: once
          on the household as entered, and once on the same household with{" "}
          <span className="num">$1,000</span> more income. The difference between those two
          runs is the number most people actually need.
        </p>
        <ol className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          <li className="hairline-b pb-2">
            <strong>Validate.</strong> Age and spouse age must be finite and between{" "}
            <span className="num">0</span> and <span className="num">130</span>. Money inputs
            must be whole cents and non-negative. A bad value throws rather than being
            coerced into something plausible.
          </li>
          <li className="hairline-b pb-2">
            <strong>Resolve the rule set.</strong> One bundle per tax year. An unsupported
            year throws — the engine will not quietly reuse last year&apos;s caps.
          </li>
          <li className="hairline-b pb-2">
            <strong>Compute MAGI once,</strong> from the household&apos;s income inputs.
          </li>
          <li className="hairline-b pb-2">
            <strong>Run all four deductions against that one MAGI.</strong> They are
            independent: none reads another&apos;s output, so their order cannot change the
            answer.
          </li>
          <li className="hairline-b pb-2">
            <strong>Sum the four results</strong> into a single deduction total.
          </li>
          <li className="hairline-b pb-2">
            <strong>Convert the total to federal tax saved</strong> on the bracket table.
          </li>
          <li className="hairline-b pb-2">
            <strong>Re-run and subtract.</strong> The whole of steps{" "}
            <span className="num">3</span>–<span className="num">6</span> runs again with{" "}
            <span className="num">$1,000</span> added to other income; the difference in tax
            is the marginal figure, and the difference in deductions is what that{" "}
            <span className="num">$1,000</span> cost you in reliefs.
          </li>
        </ol>
      </section>

      <section className="density-reading">
        <h2>MAGI is built from gross pay, and nothing here reduces it</h2>
        <p>
          <span className="num">MAGI = base wages + tips + gross overtime pay + other income</span>
          . The OBBBA deductions never reduce MAGI themselves, which is exactly why one raise
          can shrink several of them at once.
        </p>
        <p>
          Overtime enters MAGI at the full multiplier and enters the deduction at half of it,
          and that asymmetry is not a rounding artifact — it is the design. On{" "}
          <span className="num">{OT_HOURS}</span> overtime hours at a regular rate of{" "}
          <span className="num">{formatCents(OT_REGULAR_RATE_CENTS)}</span>, straight-time pay is{" "}
          <span className="num">{formatCents(overtimeStraightPay)}</span>. The engine
          multiplies that by the pay multiplier to reach{" "}
          <span className="num">{formatCents(overtimeGross)}</span> of gross overtime for
          MAGI, and separately by the deductible share to reach{" "}
          <span className="num">{formatCents(overtimePremium)}</span> of qualified premium.
          The same hours push MAGI toward the phase-out threshold roughly three times as fast
          as they build the deduction.
        </p>
        <p>
          One limitation matters more than the rest. This MAGI has no subtraction term, where
          the statutory figure is adjusted gross income plus a short list of foreign-income
          exclusions — and adjusted gross income is gross income <em>less</em> above-the-line
          adjustments such as health savings account and traditional IRA contributions,
          deductible self-employment tax, self-employed health insurance and student-loan
          interest. The engine therefore overstates MAGI for anyone who has those, which can
          understate their deduction near a phase-out edge. It is recorded as a documented
          approximation, not a value awaiting correction, in the repository&apos;s{" "}
          <span className="num">KNOWN-GAPS.md</span> register.
        </p>
      </section>

      <section>
        <h2>Qualified tips: six gates, then the cap, then the phase-out</h2>
        <p className="density-reading mt-2">
          <span className="num">deduction = min(reported tips, {usd(rules.tips.capCents)})</span>
          , then reduced by <span className="num">{stepAmount(rules.tips.phaseOut)}</span> for
          each whole <span className="num">$1,000</span> of MAGI over the threshold.
          <SourceCitation
            index={1}
            label={rules.tips.citations[0]?.label ?? "P.L. 119-21 (OBBBA) § 70201"}
            url={rules.tips.citations[0]?.url ?? meta.primary.url}
            lastVerified={rules.tips.citations[0]?.lastVerified ?? meta.lastVerified}
          />{" "}
          Requires a qualified occupation (
          <Link href="/paycheck/occupations" className={link}>
            the list
          </Link>
          ), properly reported tips, and a joint return if married.
        </p>
        <p className="density-reading mt-2">
          The engine checks six conditions before it computes anything, and it stops at the
          first one that fails, so the reason you are shown is the first reason and not a
          list. In order: tips were entered at all; the amount is above zero; the filing
          status is not married filing separately; an occupation code was chosen; that code is
          on the qualified list; and the tips were properly reported through a W-2, a tip
          report, an allocation form or self-employment income. Only then does the cap apply,
          and only after the cap does the phase-out.
        </p>
        <p className="density-reading mt-2">
          Worked: <span className="num">{usd(TIPS_CLAIMED_CENTS)}</span> of qualified tips, single, at a
          MAGI of <span className="num">{usd(tipsExampleMagi)}</span>. The excess over the{" "}
          <span className="num">{usd(tipsThresholdSingle)}</span> threshold is{" "}
          <span className="num">{usd(tipsExampleMagi - tipsThresholdSingle)}</span>, which is{" "}
          <span className="num">{stepsTaken(rules.tips.phaseOut, tipsReduction)}</span> whole
          steps once the fraction is dropped, so the reduction is{" "}
          <span className="num">{usd(tipsReduction)}</span> and the deduction is{" "}
          <span className="num">{usd(tipsResult.deductionCents)}</span>. Round that same
          excess up instead of down and the answer moves by{" "}
          <span className="num">{stepAmount(rules.tips.phaseOut)}</span> — which is precisely
          the error a verification pass found and corrected in this engine.
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
            { key: "Reduction per $1,000 of excess", value: stepAmount(rules.tips.phaseOut) },
            { key: "Partial step rounds", value: stepDirection(rules.tips.phaseOut) },
            { key: "Rule set", value: rules.tips.ruleSetVersion },
          ]}
        />
      </section>

      <section>
        <h2>Qualified overtime: the deductible part is a third of the paycheck</h2>
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
        <p className="density-reading mt-2">
          The divisor is not a constant. The engine derives it from two rule values, the
          assumed pay multiplier{" "}
          <span className="num">{formatBps(rules.overtime.payMultiplierBps)}</span> divided by
          the deductible share{" "}
          <span className="num">{formatBps(rules.overtime.premiumShareOfRegularRateBps)}</span>,
          so a rule change moves the arithmetic rather than requiring a code change. Both
          input modes reach the same place: enter hours and a rate and the premium is built
          up; enter a total and it is divided down.
        </p>
        <p className="density-reading mt-2">
          Two limits on qualified overtime are described in the rule file and not enforced by
          the engine, and both cut the same way. Pay above the FLSA-required premium — a
          contractual double-time rate, for instance — is not qualified overtime, so only the
          half-time portion counts however the shift was paid. And overtime owed to an
          FLSA-exempt employee under state law or a collective agreement is not qualified at
          all. A fixed multiplier cannot see either case, so the engine will accept an entry
          it should have refused.
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
              key: "Assumed pay multiplier",
              value: formatBps(rules.overtime.payMultiplierBps),
            },
            {
              key: "Phase-out threshold (single)",
              value: usd(rules.overtime.phaseOut.thresholdSingleCents),
            },
            {
              key: "Reduction per $1,000 of excess",
              value: stepAmount(rules.overtime.phaseOut),
            },
            { key: "Partial step rounds", value: stepDirection(rules.overtime.phaseOut) },
            { key: "Rule set", value: rules.overtime.ruleSetVersion },
          ]}
        />
      </section>

      <section>
        <h2>The senior deduction is reduced per person, then added up</h2>
        <p className="density-reading mt-2">
          <span className="num">{usd(rules.senior.amountPerQualifyingPersonCents)}</span> per
          person aged <span className="num">{rules.senior.qualifyingAge}</span> or over,
          reduced by <span className="num">{percentOfExcess(rules.senior.phaseOut)}</span> of
          MAGI over the threshold — a different phase-out model from the tips and overtime
          step, with no $1,000 unit and so no step-rounding rule to get wrong.
          <SourceCitation
            index={3}
            label={rules.senior.citations[0]?.label ?? "P.L. 119-21 (OBBBA) § 70103"}
            url={rules.senior.citations[0]?.url ?? meta.primary.url}
            lastVerified={rules.senior.citations[0]?.lastVerified ?? meta.lastVerified}
          />
        </p>
        <p className="density-reading mt-2">
          The order of operations decides the answer on a joint return, and getting it
          backwards is worth thousands. The reduction is taken against the per-person amount
          first, and the reduced figure is then entered once for each qualifying spouse. Two
          seniors therefore lose the percentage twice, not once. Worked: a joint return, both
          spouses over <span className="num">{rules.senior.qualifyingAge}</span>, MAGI{" "}
          <span className="num">{usd(seniorExampleMagi)}</span>. The excess over{" "}
          <span className="num">{usd(seniorThresholdJoint)}</span> is{" "}
          <span className="num">{usd(seniorExampleMagi - seniorThresholdJoint)}</span>;{" "}
          <span className="num">{percentOfExcess(rules.senior.phaseOut)}</span> of it is{" "}
          <span className="num">
            {usd(Math.round(seniorResult.phaseOut ? seniorResult.phaseOut.reductionCents / 2 : 0))}
          </span>
          ; each spouse&apos;s <span className="num">{usd(rules.senior.amountPerQualifyingPersonCents)}</span>{" "}
          falls to <span className="num">{usd(seniorPerPerson)}</span>; the household total is{" "}
          <span className="num">{usd(seniorResult.deductionCents)}</span>. Applying the
          percentage once to the doubled amount instead returns a larger and wrong figure.
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
            { key: "Reduction rate", value: percentOfExcess(rules.senior.phaseOut) },
            { key: "Rule set", value: rules.senior.ruleSetVersion },
          ]}
        />
      </section>

      <section>
        <h2>Car-loan interest fails on any one condition, and reports all of them</h2>
        <p className="density-reading mt-2">
          Interest up to <span className="num">{usd(rules.carLoan.capCents)}</span> on a loan
          for a new, personal-use vehicle with final assembly in the United States, originated
          on or after <span className="num">{rules.carLoan.loanOriginatedOnOrAfter}</span>.
          Miss any one of those conditions and the whole deduction goes.
          <SourceCitation
            index={4}
            label={rules.carLoan.citations[0]?.label ?? "P.L. 119-21 (OBBBA) § 70203"}
            url={rules.carLoan.citations[0]?.url ?? meta.primary.url}
            lastVerified={rules.carLoan.citations[0]?.lastVerified ?? meta.lastVerified}
          />
        </p>
        <p className="density-reading mt-2">
          This is the one deduction where the engine deliberately does not stop at the first
          failure. It tests all four conditions, collects every reason, and returns the set —
          so a used import bought for a delivery business is told three things rather than one
          and can see there is nothing to fix. It is also the only one of the four with no
          joint-filing requirement: married filing separately bars the other three outright,
          and this one it does not touch.
        </p>
        <p className="density-reading mt-2">
          Worked, and note the direction of travel: <span className="num">{usd(CAR_INTEREST_CENTS)}</span>{" "}
          of interest, single, MAGI <span className="num">{usd(carExampleMagi)}</span>. The
          excess over <span className="num">{usd(carThresholdSingle)}</span> is{" "}
          <span className="num">{usd(carExampleMagi - carThresholdSingle)}</span>, and because
          this rule counts a part step as a whole one that is{" "}
          <span className="num">{stepsTaken(rules.carLoan.phaseOut, carReduction)}</span>{" "}
          steps, not ten. At <span className="num">{stepAmount(rules.carLoan.phaseOut)}</span>{" "}
          a step the reduction is <span className="num">{usd(carReduction)}</span> and the
          deduction is <span className="num">{usd(carResult.deductionCents)}</span>. The step
          is twice the tips and overtime rate against a cap that is smaller, so this deduction
          disappears far faster than the headline thresholds suggest.
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
            {
              key: "Phase-out threshold (joint)",
              value: usd(rules.carLoan.phaseOut.thresholdJointCents),
            },
            {
              key: "Reduction per $1,000 of excess",
              value: stepAmount(rules.carLoan.phaseOut),
            },
            { key: "Partial step rounds", value: stepDirection(rules.carLoan.phaseOut) },
            { key: "Rule set", value: rules.carLoan.ruleSetVersion },
          ]}
        />
      </section>

      <section className="density-reading">
        <h2>Two phase-out models, three rounding directions</h2>
        <p>
          Tips, overtime and car-loan interest all step: take the MAGI above the threshold,
          divide by <span className="num">$1,000</span>, and multiply the whole number of
          steps by that rule&apos;s per-step reduction. The senior deduction does not step at
          all — it takes a flat percentage of the excess. Both models floor at zero, and the
          reduction is additionally clamped to the capped amount, so no deduction can be
          reduced past nothing or turn negative.
        </p>
        <p>
          The three step rules do not round the same way, and harmonising them would be a bug
          rather than a tidy-up. Tips and overtime drop a partial step; car-loan interest
          counts a partial step as a whole one. The engine holds each direction in its own
          rule file as a boolean, and the difference is visible above: an excess of{" "}
          <span className="num">{usd(tipsExampleMagi - tipsThresholdSingle)}</span> costs{" "}
          <span className="num">{stepsTaken(rules.tips.phaseOut, tipsReduction)}</span> steps
          under the tips rule, while a fractional excess under the car-loan rule is rounded up
          to the next whole step before the reduction is taken.
        </p>
        <p>
          Because the reduction is a function of the amount claimed, each deduction has a MAGI
          at which it reaches zero. For a single filer claiming the full cap, the engine
          computes these exhaustion points directly rather than leaving a reader to divide.
        </p>
        <FactTable
          className="mt-3"
          captionVisible
          caption="MAGI at which each deduction reaches $0 — single filer, full amount claimed"
          rows={[
            {
              key: "Qualified tips",
              value: usd(fullyPhasedOutAt(rules.tips.capCents, "SINGLE", rules.tips.phaseOut)),
            },
            {
              key: "Qualified overtime",
              value: usd(
                fullyPhasedOutAt(
                  rules.overtime.capSingleCents,
                  "SINGLE",
                  rules.overtime.phaseOut,
                ),
              ),
            },
            {
              key: "Senior, per qualifying person",
              value: usd(
                fullyPhasedOutAt(
                  rules.senior.amountPerQualifyingPersonCents,
                  "SINGLE",
                  rules.senior.phaseOut,
                ),
              ),
            },
            {
              key: "Car-loan interest",
              value: usd(
                fullyPhasedOutAt(rules.carLoan.capCents, "SINGLE", rules.carLoan.phaseOut),
              ),
            },
          ]}
        />
        <p className="mt-3">
          Read that table as a ranking of fragility rather than a set of thresholds. The
          car-loan deduction begins phasing out later than the senior deduction and still
          reaches zero first, which is how a household can lose it outright while collecting
          most of its tips deduction and part of its senior deduction. One line explains the
          whole ordering: an identical{" "}
          <span className="num">$1,000</span> of extra MAGI removes{" "}
          <span className="num">{stepAmount(rules.carLoan.phaseOut)}</span> of car-loan
          deduction against <span className="num">{stepAmount(rules.tips.phaseOut)}</span> of
          tips deduction, and <span className="num">{usd(seniorPerThousand)}</span> of senior
          deduction per qualifying person.
        </p>
      </section>

      <section className="density-reading">
        <h2>Money is integer cents, and rounding is half-up except where the form says otherwise</h2>
        <p>
          Currency is never a float. Every amount is an integer number of cents and every rate
          is basis points, so <span className="num">6%</span> is carried as{" "}
          <span className="num">600</span> and never as{" "}
          <span className="num">0.06</span>. Multiplication by a rate divides by{" "}
          <span className="num">10,000</span> and rounds the result half-up to the nearest
          cent; division does the same. Subtraction that must not go below zero has its own
          function, so a floor is never left to a comparison somebody forgets to write. Public
          functions assert their money inputs are whole, non-negative cents and throw a typed
          error otherwise — the engine fails loudly instead of coercing a bad input into a
          plausible answer.
        </p>
        <p>
          Three roundings coexist and they are genuinely different operations. Rate
          multiplication rounds half-up to the cent, which is what turned{" "}
          <span className="num">{formatCents(overtimeStraightPay)}</span> of straight-time
          pay into a premium of exactly{" "}
          <span className="num">{formatCents(overtimePremium)}</span> in the example above.
          The <span className="num">$1,000</span> step for tips and overtime rounds down, and
          it is a floor rather than a half-up round, which are not the same operation: an
          excess of <span className="num">$500.01</span> becomes a whole step under half-up
          rounding and no step at all under a floor. The{" "}
          <span className="num">$1,000</span> step for car-loan interest rounds up, so the same
          excess becomes a whole step there.
        </p>
        <p>
          One rounding question is open rather than settled, and it stays labelled as open.
          No source states a sub-dollar convention for these four computations: the
          computation of record prescribes the <span className="num">$1,000</span>-step
          rounding and the senior percentage but says nothing about cents. Working in integer
          cents and rounding half-up is defensible and is not something the IRS has stated. It
          can move a result by about a dollar, and it is filed as unresolved in the engine
          documentation rather than presented as verified.
        </p>
      </section>

      <section className="density-reading">
        <h2>Tax saved is computed twice on the bracket table, never as rate × deduction</h2>
        <p>
          Taxable income is <span className="num">MAGI − standard deduction</span>, floored at
          zero. The engine walks the bracket table for the filing status, taxing each slice at
          its own rate and rounding each slice half-up, and it does this twice: once on
          taxable income before the OBBBA deductions and once after. The reported saving is
          the difference between the two figures.
        </p>
        <p>
          That is not the same as multiplying by a marginal rate, and the gap is largest for
          exactly the households a deduction helps most. Worked: a single filer with{" "}
          <span className="num">{usd(TAX_EXAMPLE_MAGI_CENTS)}</span> of MAGI and{" "}
          <span className="num">{usd(TAX_EXAMPLE_DEDUCTION_CENTS)}</span> of deduction. The standard deduction
          of <span className="num">{usd(taxExample.standardDeductionCents)}</span> leaves{" "}
          <span className="num">{usd(taxExample.taxableBeforeCents)}</span> of taxable income,
          which falls to <span className="num">{usd(taxExample.taxableAfterCents)}</span>.
          Federal tax goes from <span className="num">{usd(taxExample.taxBeforeCents)}</span>{" "}
          to <span className="num">{usd(taxExample.taxAfterCents)}</span>, a saving of{" "}
          <span className="num">{usd(taxExample.estimatedTaxSavedCents)}</span>. The marginal
          rate at that income is{" "}
          <span className="num">{formatBps(taxExample.marginalRateBps)}</span>, so the
          shortcut would have claimed <span className="num">{usd(taxExampleNaive)}</span> —
          overstating the saving by{" "}
          <span className="num">
            {usd(taxExampleNaive - taxExample.estimatedTaxSavedCents)}
          </span>
          , because the deduction crosses a bracket boundary on its way down.
        </p>
        <p>
          The per-line &ldquo;worth $X at your bracket&rdquo; annotations on the pay statement
          are the deduction valued at the top rate, so they will not always sum to the exact
          headline saving. The headline is the one to trust; the annotations exist to show
          which line is doing the work.
        </p>
      </section>

      <section className="density-reading">
        <h2>The marginal rate on the next $1,000 can exceed your bracket</h2>
        <p>
          Above a threshold, an extra <span className="num">$1,000</span> of income is taxed
          twice: once by the bracket, and once by the deductions it removes. The engine does
          not model this with a formula. It re-runs the entire computation with{" "}
          <span className="num">$1,000</span> more income and subtracts, so whatever
          interaction exists between the four phase-outs is in the answer whether or not
          anyone anticipated it.
        </p>
        <p>
          Worked: a single tipped worker with{" "}
          <span className="num">{usd(MARGINAL_WAGES_CENTS)}</span> of wages and{" "}
          <span className="num">{usd(MARGINAL_TIPS_CENTS)}</span> of properly reported qualified tips.
          MAGI is <span className="num">{usd(marginalExample.magiCents)}</span> and the
          household&apos;s OBBBA deductions total{" "}
          <span className="num">{usd(marginalExample.totalDeductionCents)}</span>. Earn one
          more thousand and{" "}
          <span className="num">
            {usd(marginalExample.marginalNext1000.deductionsLostCents)}
          </span>{" "}
          of deduction disappears, so the extra federal tax is{" "}
          <span className="num">
            {usd(marginalExample.marginalNext1000.extraFederalTaxCents)}
          </span>{" "}
          — an effective marginal rate of{" "}
          <span className="num">
            {formatBps(marginalExample.marginalNext1000.effectiveMarginalRateBps)}
          </span>{" "}
          against a statutory bracket of{" "}
          <span className="num">{formatBps(marginalExample.tax.marginalRateBps)}</span>. A
          household with three of these deductions in range sees a steeper gap again, which is
          the case no single-deduction calculator can show you.
        </p>
      </section>

      <section className="density-reading">
        <h2>What this engine does not model, and what that costs you</h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          <li className="hairline-b pb-2">
            <strong>State income tax — not modelled at all.</strong> Every figure on this site
            is federal. A deduction that saves federal tax may or may not follow through to
            your state return, and this engine takes no position on it.
          </li>
          <li className="hairline-b pb-2">
            <strong>FICA — not reduced.</strong> Tips and overtime remain subject to Social
            Security and Medicare tax in full. The deduction never touches them, so the
            take-home effect of a tips deduction is smaller than the deduction amount
            suggests.
          </li>
          <li className="hairline-b pb-2">
            <strong>The pre-existing extra standard deduction for people{" "}
            <span className="num">{rules.senior.qualifyingAge}</span> and over.</strong> It
            stacks with the senior deduction rather than replacing it and is not in the
            bracket rule file, so every senior household&apos;s total deduction here is
            understated and its tax saving may be valued at the wrong marginal rate.
          </li>
          <li className="hairline-b pb-2">
            <strong>Above-the-line adjustments.</strong> See the MAGI note above: no
            subtraction term, so MAGI is overstated for anyone who has them.
          </li>
          <li className="hairline-b pb-2">
            <strong>Most car-loan eligibility conditions.</strong> The engine checks four. The
            rule file records several more that it does not enforce — a gross vehicle weight
            limit, a restriction to particular vehicle classes, a first-lien requirement,
            exclusions for leases, fleet sales, salvage and scrap vehicles and related-party
            loans, a cap on refinancing at the balance refinanced, and a vehicle
            identification number reporting requirement. The engine will not stop you claiming
            a vehicle that does not qualify.
          </li>
          <li className="hairline-b pb-2">
            <strong>The self-employment limit on tips.</strong> A self-employed tip
            earner&apos;s deduction cannot exceed net income from the business the tips came
            from. The engine flags this and assumes the tips you entered already respect it.
          </li>
          <li className="hairline-b pb-2">
            <strong>Credits and itemising.</strong> Out of scope in v1. The tax saved is
            computed against the standard deduction and the ordinary bracket table only.
          </li>
        </ul>
        <p className="mt-3">
          Each of these is recorded in the repository rather than only here: the per-figure
          verification record in{" "}
          <span className="num">VERIFICATION-STATUS.md</span>, and the open-items register in{" "}
          <span className="num">KNOWN-GAPS.md</span>. The list on this page can therefore be
          checked against the code rather than taken on trust, and what is still outstanding is
          summarised
          on the{" "}
          <Link href="/paycheck/changelog" className={link}>
            changelog
          </Link>{" "}
          and in more detail on the{" "}
          <Link href="/paycheck/about" className={link}>
            about page
          </Link>
          .
        </p>

        <h2>What this engine never does</h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          <li className="hairline-b pb-2">
            No AI computes, estimates, or adjusts any number.
          </li>
          <li className="hairline-b pb-2">
            No figure ships without a citation — see{" "}
            <Link href="/paycheck/sources" className={link}>
              Sources
            </Link>
            .
          </li>
          <li className="hairline-b pb-2">
            Your inputs never leave your browser: no accounts, no database, localStorage only.
          </li>
        </ul>
        <p className="mt-3">
          <Link href="/paycheck" className={link}>
            Run your own household through the engine →
          </Link>
        </p>
      </section>
    </article>
  );
}
