"use client";

/**
 * The planner — a live model of the reader's situation, not a form they submit.
 *
 * There is no Calculate button anywhere in this product (interaction.md M1).
 * The engine runs synchronously in a `useMemo` on every keystroke, seeded with
 * plausible defaults, so the answer is on screen before the first field is
 * touched and refines as real numbers arrive. A `<ConfidenceMeter>` states how
 * much of the reader's own detail the answer is standing on, without blocking
 * anything.
 *
 * Nothing is sent anywhere. State lives in React, persists to `localStorage`,
 * and never reaches a server — there is no server.
 */

import * as React from "react";
import {
  analyzeHousehold,
  formatUsd,
  getRules,
  ptcAtMagi,
  type CliffAnalysis,
  type LeverResult,
} from "@/engines/aca";
import {
  Button,
  Checkbox,
  ConfidenceMeter,
  Disclosure,
  ErrorState,
  Field,
  Input,
  MarginalProbe,
  NumberInput,
  RadioGroup,
  Select,
  StickyAnswer,
} from "@/components/ui";
import { verdict } from "@/lib/aca/verdict";
import {
  agesError,
  completeness,
  plannerDefaults,
  plannerSchema,
  toEngineInput,
  type CountyId,
  type DetailKey,
  type PlannerState,
} from "@/lib/aca/schema";
import { CliffMeter } from "./CliffMeter";
import { LeverList } from "./LeverList";
import { InputPanel } from "@/components/tool/InputPanel";
import { AcaVerdict, ResultsPanel } from "./ResultsPanel";

/**
 * Storage keys are namespaced `bracketsight.<section>.<thing>.<version>`.
 *
 * Five tools now share one origin, so an unprefixed key is a collision waiting
 * to happen — two sections writing `planner` would silently overwrite each
 * other's saved work. The old key was `cliffcheck:planner:v2`, written on a
 * different origin; nothing in this origin's storage can be carrying it, so
 * there is no migration path to keep and none is written.
 */
const STORAGE_KEY = "bracketsight.aca.planner.v2";
/** The probe quotes its derivative per $1,000 — the unit these decisions move in. */
const PROBE_STEP = 100_000;

export function Planner() {
  const rules = getRules();
  const [state, setState] = React.useState<PlannerState>(plannerDefaults);
  const [probe, setProbe] = React.useState(0);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = plannerSchema.safeParse(JSON.parse(raw));
      if (parsed.success) setState(parsed.data);
    } catch {
      // Corrupt or unavailable storage: start from the defaults.
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage blocked or full — the planner still works, it just won't persist.
    }
  }, [state]);

  const set = React.useCallback(<K extends keyof PlannerState>(key: K, value: PlannerState[K]) => {
    setState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  /** Focus is confirmation: a reader who has been in the field has read it. */
  const confirm = React.useCallback((key: DetailKey) => {
    setState((prev) =>
      prev.confirmed.includes(key) ? prev : { ...prev, confirmed: [...prev.confirmed, key] },
    );
  }, []);
  const seen = (key: DetailKey) => ({ onFocus: () => confirm(key) });

  const engineInput = React.useMemo(() => toEngineInput(state), [state]);
  const analysis = React.useMemo<CliffAnalysis | Error>(() => {
    try {
      return analyzeHousehold(engineInput);
    } catch (error) {
      return error instanceof Error ? error : new Error("unknown");
    }
  }, [engineInput]);

  const ageProblem = agesError(state.coveredAges);
  const progress = completeness(state);

  if (analysis instanceof Error) {
    return (
      <ErrorState
        cause="The engine could not compute a position from these numbers."
        fix="Check the ages enrolling and your tax family size, then try again. Nothing was lost — your entries are still here."
      />
    );
  }

  const levers = analysis.levers.filter(
    (l) => l.eligible && !l.advisoryOnly && l.maxAvailable > 0,
  );
  const probeMax = Math.min(
    Math.max(
      levers.reduce((sum, l) => sum + l.maxAvailable, 0),
      PROBE_STEP,
    ),
    5_000_000,
  );
  const clampedProbe = Math.min(probe, probeMax);
  const magi = analysis.magi.magi;

  /**
   * The derivative, not the level (M3). Every figure in the sentence comes from
   * the same `ptcAtMagi` the ranking uses, so the probe and the table can never
   * disagree.
   */
  const derive = (v: number) => {
    const here = ptcAtMagi(Math.max(0, magi - v), engineInput.household, rules);
    const next = ptcAtMagi(Math.max(0, magi - v - PROBE_STEP), engineInput.household, rules);
    return { delta: here - next, per: "a year in premium tax credit" };
  };

  return (
    <div className="flex flex-col gap-8">
      {/* THE ANSWER LEADS, AT EVERY WIDTH. The phone used to get income, then
          answer, then details; the ink band now puts the sentence and the
          distance to the edge above all three, which is where a reader who
          arrived from a search result with one question needs them. */}
      <AcaVerdict analysis={analysis} />

      {/*
       * Three siblings, ordered for the phone and placed for the desktop. On a
       * narrow screen the reader gets the income they came to type, then the
       * detail behind the answer, then the household — so nothing they need is
       * seven fields away. On a wide screen the form stacks down the left rail
       * and the answer holds the right column throughout.
       */}
      {/* `grid-rows-[auto_1fr]` matters: the answer column spans both rows, and
          without it the browser splits its height between them and opens a gap
          in the middle of the form. */}
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10">
        {/* The MAGI builder. The hero of this page is the live model, not a headline. */}
        <InputPanel
          as="form"
          aria-label="Your income"
          label="Your income"
          meta="modified AGI"
          className="order-1 min-w-0 lg:col-start-1 lg:row-start-1"
          noValidate
          onSubmit={(e) => e.preventDefault()}
        >
          {/* `space-y-4` moved here from the <form>: the panel supplies the
              padding now, and the rhythm belongs to the fields inside it. */}
          <div className="space-y-4">
          <div {...seen("agi")}>
            <Field
              label="Adjusted gross income"
              htmlFor="agi"
              hint="Form 1040 line 11 — after the retirement contributions you have already made."
            >
              <NumberInput
                id="agi"
                unit="cents"
                value={state.agi}
                onChange={(n) => set("agi", n)}
                min={0}
                max={100_000_000}
              />
            </Field>
          </div>

          <div {...seen("addBacks")}>
            <Disclosure summary="Three add-backs most people miss" compact>
              <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                The marketplace uses <strong className="text-ink">modified</strong> AGI. These
                three are added back even though none of them is taxed — which is how
                households cross the edge by accident.
              </p>
              <div className="mt-3 space-y-3">
                <Field
                  label="Tax-exempt interest"
                  htmlFor="taxExemptInterest"
                  hint="Form 1040 line 2a — municipal bond interest."
                >
                  <NumberInput
                    id="taxExemptInterest"
                    unit="cents"
                    value={state.taxExemptInterest}
                    onChange={(n) => set("taxExemptInterest", n)}
                    min={0}
                  />
                </Field>
                <Field
                  label="Excluded foreign earned income"
                  htmlFor="excludedForeignIncome"
                  hint="Anything excluded under §911 comes back."
                >
                  <NumberInput
                    id="excludedForeignIncome"
                    unit="cents"
                    value={state.excludedForeignIncome}
                    onChange={(n) => set("excludedForeignIncome", n)}
                    min={0}
                  />
                </Field>
                <Field
                  label="Non-taxable Social Security"
                  htmlFor="nonTaxableSocialSecurity"
                  hint="The untaxed portion counts. The add-back that surprises early retirees most."
                >
                  <NumberInput
                    id="nonTaxableSocialSecurity"
                    unit="cents"
                    value={state.nonTaxableSocialSecurity}
                    onChange={(n) => set("nonTaxableSocialSecurity", n)}
                    min={0}
                  />
                </Field>
              </div>
            </Disclosure>
          </div>

          <div className="hairline-t pt-4">
            <p className="micro-label">Modified AGI</p>
            <p className="num mt-1 text-signal" style={{ fontSize: "var(--text-step-2)", fontWeight: 500 }}>
              {formatUsd(magi)}
            </p>
          </div>
          </div>
        </InputPanel>

        {/* The answer, and the drawing that makes it physical. */}
        <div className="order-2 min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <ResultsPanel analysis={analysis} />

          <section aria-labelledby="meter-heading" className="mt-8">
            <h2 id="meter-heading">The Cliff Meter</h2>
            <CliffMeter
              className="mt-2"
              analysis={analysis}
              household={engineInput.household}
              whatIfMagi={clampedProbe > 0 ? Math.max(0, magi - clampedProbe) : null}
            />
          </section>

          <section aria-labelledby="probe-heading" className="hairline-t mt-8 pt-6">
            <h2 id="probe-heading" className="sr-only">
              What one more pre-tax dollar is worth
            </h2>
            <MarginalProbe
              label="Pre-tax contribution"
              value={clampedProbe}
              onChange={setProbe}
              min={0}
              max={probeMax}
              step={PROBE_STEP}
              unit="cents"
              derive={derive}
              format={(n) => formatUsd(Math.round(n))}
            />
            {levers.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="micro-label">Fill one:</span>
                {levers.slice(0, 4).map((lever) => (
                  <LeverChip key={lever.id} lever={lever} onPick={setProbe} />
                ))}
                {clampedProbe > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => setProbe(0)}>
                    Clear
                  </Button>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <InputPanel
          as="form"
          aria-label="Your household"
          label="Your household"
          meta={`${progress.filled} of ${progress.total} details`}
          className="order-3 min-w-0 lg:col-start-1 lg:row-start-2"
          noValidate
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="space-y-4">
          <div {...seen("familySize")}>
            <Field
              label="Tax family size"
              htmlFor="familySize"
              hint="You, your spouse if filing jointly, and every dependent you claim. This sets your poverty line."
            >
              <NumberInput
                id="familySize"
                unit="count"
                value={state.familySize}
                onChange={(n) => set("familySize", n)}
                min={1}
                max={12}
              />
            </Field>
          </div>

          <div {...seen("coveredAges")}>
            <Field
              label="Ages enrolling in coverage"
              htmlFor="coveredAges"
              hint="Comma separated, like 60, 58 — marketplace premiums are age-rated."
              error={ageProblem ?? undefined}
            >
              <Input
                id="coveredAges"
                className="num"
                inputMode="numeric"
                value={state.coveredAges}
                onChange={(e) => set("coveredAges", e.currentTarget.value)}
              />
            </Field>
          </div>

          <div {...seen("county")}>
            <Field
              label="County"
              htmlFor="countyId"
              hint="Six sample counties while the CMS benchmark-premium file is wired up."
            >
              <Select
                id="countyId"
                value={state.countyId}
                onChange={(v) => set("countyId", v as CountyId)}
                options={rules.slcsp.counties.map((c) => ({ value: c.id, label: c.label }))}
              />
            </Field>
          </div>

          <Field
            label="Filing status"
            htmlFor="filingStatus"
            hint="Married filing separately is generally ineligible for the credit."
          >
            <Select
              id="filingStatus"
              value={state.filingStatus}
              onChange={(v) => set("filingStatus", v as PlannerState["filingStatus"])}
              options={[
                { value: "SINGLE", label: "Single" },
                { value: "MARRIED_JOINT", label: "Married filing jointly" },
                { value: "MARRIED_SEPARATE", label: "Married filing separately" },
                { value: "HEAD_OF_HOUSEHOLD", label: "Head of household" },
              ]}
            />
          </Field>

          <ConfidenceMeter
            className="hairline-t pt-4"
            filled={progress.filled}
            total={progress.total}
            missingLabel={progress.next ?? undefined}
          />
          </div>
        </InputPanel>
      </div>

      {/* What the levers are allowed to be. Below the answer, because the
          answer already exists without it. */}
      <section aria-labelledby="context-heading" className="hairline-t mt-12 pt-6">
        <h2 id="context-heading">What is open to you</h2>
        <p className="mt-1 max-w-[var(--measure)] text-dim">
          These decide which MAGI-reduction levers are legally available and how much room is
          left in each. Every one of them changes the ranking below.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Your age" htmlFor="age" hint="Unlocks the 50+ and 55+ catch-up room.">
            <NumberInput
              id="age"
              unit="count"
              value={state.age}
              onChange={(n) => set("age", n)}
              min={18}
              max={120}
            />
          </Field>

          <div {...seen("earnedIncome")}>
            <Field label="W-2 wages" htmlFor="wagesW2" hint="Caps 401(k), 403(b) and 457 deferrals.">
              <NumberInput
                id="wagesW2"
                unit="cents"
                value={state.wagesW2}
                onChange={(n) => set("wagesW2", n)}
                min={0}
              />
            </Field>
          </div>

          <div {...seen("earnedIncome")}>
            <Field
              label="Self-employment net profit"
              htmlFor="selfEmploymentNetProfit"
              hint="Schedule C. Unlocks the SEP-IRA, the solo 401(k) and the health-insurance deduction."
            >
              <NumberInput
                id="selfEmploymentNetProfit"
                unit="cents"
                value={state.selfEmploymentNetProfit}
                onChange={(n) => set("selfEmploymentNetProfit", n)}
                min={0}
              />
            </Field>
          </div>

          {/* Three short, mutually exclusive answers that gate a whole lever:
              radios, so all three are visible and each is one tap. */}
          <Field
            label="High-deductible health plan"
            htmlFor="hdhpCoverage"
            hint="An HSA contribution requires a qualifying HDHP."
          >
            <RadioGroup
              name="hdhpCoverage"
              value={state.hdhpCoverage}
              onChange={(v) => set("hdhpCoverage", v as PlannerState["hdhpCoverage"])}
              options={[
                { value: "NONE", label: "Not enrolled" },
                { value: "SELF", label: "Self-only HDHP" },
                { value: "FAMILY", label: "Family HDHP" },
              ]}
            />
          </Field>

          <Field
            label="Marketplace premium you pay"
            htmlFor="annualHealthPremium"
            hint="Per year. Needed for the self-employed health-insurance deduction."
          >
            <NumberInput
              id="annualHealthPremium"
              unit="cents"
              value={state.annualHealthPremium}
              onChange={(n) => set("annualHealthPremium", n)}
              min={0}
            />
          </Field>

          <div {...seen("aptcMonthly")}>
            <Field
              label="Advance credit taken"
              htmlFor="aptcMonthly"
              hint="Per month. If a subsidy already lowers your premium, enter it to see your year-end repayment risk."
            >
              <NumberInput
                id="aptcMonthly"
                unit="cents"
                value={state.aptcMonthly}
                onChange={(n) => set("aptcMonthly", n)}
                min={0}
                step={10_000}
              />
            </Field>
          </div>

          <Field label="401(k) so far this year" htmlFor="ytd401k">
            <NumberInput
              id="ytd401k"
              unit="cents"
              value={state.ytd401k}
              onChange={(n) => set("ytd401k", n)}
              min={0}
            />
          </Field>
          <Field label="HSA so far this year" htmlFor="ytdHsa">
            <NumberInput
              id="ytdHsa"
              unit="cents"
              value={state.ytdHsa}
              onChange={(n) => set("ytdHsa", n)}
              min={0}
            />
          </Field>
          <Field label="IRA so far this year" htmlFor="ytdIra">
            <NumberInput
              id="ytdIra"
              unit="cents"
              value={state.ytdIra}
              onChange={(n) => set("ytdIra", n)}
              min={0}
            />
          </Field>
          <Field label="SEP so far this year" htmlFor="ytdSep">
            <NumberInput
              id="ytdSep"
              unit="cents"
              value={state.ytdSep}
              onChange={(n) => set("ytdSep", n)}
              min={0}
            />
          </Field>
        </div>

        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          <Checkbox
            id="coveredByEmployerPlan"
            checked={state.coveredByEmployerPlan}
            onChange={(v) => set("coveredByEmployerPlan", v)}
            label="I am covered by an employer retirement plan"
          />
          <Checkbox
            id="spouseCoveredByEmployerPlan"
            checked={state.spouseCoveredByEmployerPlan}
            onChange={(v) => set("spouseCoveredByEmployerPlan", v)}
            label="My spouse is covered by an employer retirement plan"
          />
        </div>
      </section>

      <LeverList analysis={analysis} />

      {/* The cliff is a distance, and a distance is only frightening while you
          can see it move. Pinned, it keeps counting down as income is typed
          several screens above it — which is the whole point of this tool.
          Flagged only once the household is actually over the edge, per the
          flag law: red here means the credit is gone, not that it is close. */}
      <StickyAnswer
        label={verdict(analysis).heroLabel}
        value={analysis.cliff.distanceToEdge}
        format={(n) => formatUsd(Math.round(n))}
        flagged={analysis.cliff.overCliff}
        caption={
          analysis.cliff.overCliff
            ? `${formatUsd(analysis.cliff.creditAtStake)} of credit lost`
            : `${formatUsd(analysis.cliff.creditAtStake)} of credit at stake`
        }
        jumpTo="distance-to-edge"
        jumpLabel="Where you stand"
      />
    </div>
  );
}

const SHORT: Record<string, string> = {
  TRADITIONAL_401K: "401(k)",
  HSA: "HSA",
  TRADITIONAL_IRA: "IRA",
  SEP_SOLO_401K: "SEP-IRA",
  SE_HEALTH_INSURANCE: "SE health",
};

function LeverChip({
  lever,
  onPick,
}: {
  lever: LeverResult;
  onPick: (n: number) => void;
}) {
  return (
    <Button variant="secondary" size="sm" onClick={() => onPick(lever.maxAvailable)}>
      {SHORT[lever.id] ?? lever.label} <span className="num">{formatUsd(lever.maxAvailable)}</span>
    </Button>
  );
}
