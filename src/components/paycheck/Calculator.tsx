"use client";

import * as React from "react";
import { z } from "zod";
import {
  computeDeductions,
  dollars,
  findOccupationByCode,
  grossOvertimePayCents,
  overtimePremiumCents,
  resolveRules,
  searchOccupations,
} from "@/engines/paycheck";
import type { Cents, EngineResult, FilingStatus, HouseholdInput } from "@/engines/paycheck";
import { formatBps, formatCents, usd } from "@/lib/paycheck/format";
import { rulesMeta, TAX_YEAR } from "@/lib/paycheck/rules-meta";
import { completeness, phaseOutLossCents, verdictSentence } from "@/lib/paycheck/verdict-copy";
import {
  Button,
  Checkbox,
  ConfidenceMeter,
  Field,
  Input,
  LiveWarnings,
  MarginalProbe,
  NumberInput,
  RadioGroup,
  Select,
} from "@/components/ui";
import type { LiveWarning } from "@/components/ui";
import { CalcTrace } from "@/components/paycheck/CalcTrace";
import { OvertimeDiagram } from "@/components/paycheck/OvertimeDiagram";
import { Paystub } from "@/components/paycheck/Paystub";
import { PhaseOutMeter } from "@/components/paycheck/PhaseOutMeter";
import { W2Checker } from "@/components/paycheck/W2Checker";

/* ─────────────────────────────────────────────────────────── state shape ── */

const formSchema = z.object({
  filingStatus: z.enum(["SINGLE", "MARRIED_JOINT", "MARRIED_SEPARATE", "HEAD_OF_HOUSEHOLD"]),
  wagesCents: z.number().int().min(0).max(100_000_000_00),
  otherIncomeCents: z.number().int().min(0).max(100_000_000_00),
  age: z.number().int().min(16).max(120),
  spouseAge: z.number().int().min(16).max(120),
  tipsCents: z.number().int().min(0).max(10_000_000_00),
  occupationCode: z.string(),
  tipsSelfEmployed: z.boolean(),
  tipsReported: z.boolean(),
  otMode: z.enum(["HOURS_RATE", "TOTAL_OT_PAY"]),
  otHours: z.number().int().min(0).max(4000),
  otRateCents: z.number().int().min(0).max(1_000_00),
  otTotalPayCents: z.number().int().min(0).max(10_000_000_00),
  carInterestCents: z.number().int().min(0).max(1_000_000_00),
  carNew: z.boolean(),
  carUS: z.boolean(),
  carPersonal: z.boolean(),
  carLoanDate: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Smart defaults over empty fields (interaction.md §3): a server on $30,000 of
 * wages with $8,000 of tips is the modal visitor, and opening on their numbers
 * means a reader who abandons at 60% still leaves with a real answer.
 */
const DEFAULTS: FormValues = {
  filingStatus: "SINGLE",
  wagesCents: 30_000_00,
  otherIncomeCents: 0,
  age: 28,
  spouseAge: 28,
  tipsCents: 8_000_00,
  occupationCode: "102",
  tipsSelfEmployed: false,
  tipsReported: true,
  otMode: "HOURS_RATE",
  otHours: 0,
  otRateCents: 0,
  otTotalPayCents: 0,
  carInterestCents: 0,
  carNew: true,
  carUS: true,
  carPersonal: true,
  carLoanDate: "2026-01-15",
};

/*
 * Five sections now share one origin, so every key this section writes is
 * namespaced `bracketsight.<section>.` — two tools cannot collide in the same
 * browser. The standalone key is still read once so a returning reader's
 * entries survive the merge; the next edit writes them back namespaced.
 */
const STORAGE_KEY = "bracketsight.paycheck.calculator.v1";
const LEGACY_STORAGE_KEY = "clearpaycheck.calculator.v2";
/** One extra 8-hour shift — the unit an hourly worker actually thinks in. */
const SHIFT_HOURS = 8;

function buildEngineInput(v: FormValues): HouseholdInput {
  const input: HouseholdInput = {
    taxYear: TAX_YEAR,
    filingStatus: v.filingStatus as FilingStatus,
    wagesCents: v.wagesCents,
    otherIncomeCents: v.otherIncomeCents,
    age: v.age,
  };
  if (v.filingStatus === "MARRIED_JOINT") input.spouseAge = v.spouseAge;
  if (v.tipsCents > 0) {
    input.tips = {
      amountCents: v.tipsCents,
      occupationCode: v.occupationCode || null,
      selfEmployed: v.tipsSelfEmployed,
      properlyReported: v.tipsReported,
    };
  }
  if (v.otMode === "HOURS_RATE" && v.otHours > 0 && v.otRateCents > 0) {
    input.overtime = {
      mode: "HOURS_RATE",
      overtimeHours: v.otHours,
      regularHourlyRateCents: v.otRateCents,
    };
  } else if (v.otMode === "TOTAL_OT_PAY" && v.otTotalPayCents > 0) {
    input.overtime = { mode: "TOTAL_OT_PAY", totalOvertimePayCents: v.otTotalPayCents };
  }
  if (v.carInterestCents > 0) {
    input.carLoan = {
      interestPaidCents: v.carInterestCents,
      isNewVehicle: v.carNew,
      finalAssemblyInUS: v.carUS,
      loanOriginationDate: v.carLoanDate || "2026-01-15",
      personalUse: v.carPersonal,
    };
  }
  return input;
}

function run(values: FormValues): EngineResult | null {
  try {
    return computeDeductions(buildEngineInput(values));
  } catch {
    return null;
  }
}

/* ───────────────────────────────────────────────────────────── warnings ── */

/**
 * M6 — warnings that live. Amber (`--flag`) means one thing in this product:
 * money you're about to leave behind. Every amber warning here names a dollar
 * figure the reader can still recover. Everything merely worth knowing is a
 * caution, in ink — because if amber is everywhere, amber means nothing.
 */
function buildWarnings(values: FormValues, result: EngineResult): LiveWarning[] {
  const out: LiveWarning[] = [];
  const tips = result.deductions.find((d) => d.id === "TIPS");
  const overtime = result.deductions.find((d) => d.id === "OVERTIME");
  const car = result.deductions.find((d) => d.id === "CAR_LOAN");

  if (values.filingStatus === "MARRIED_SEPARATE" && (values.tipsCents > 0 || values.otHours > 0)) {
    out.push({
      id: "mfs",
      severity: "irreversible",
      label: "Money left behind",
      title: "Filing separately forfeits the tips and overtime deductions entirely.",
      body: "Married filers must file a joint return to claim either one. Switch the filing status above to see what a joint return is worth to your household.",
    });
  }

  const lost = phaseOutLossCents(result);
  if (lost > 0) {
    out.push({
      id: "phase-out",
      severity: "irreversible",
      label: "Money left behind",
      title: `The phase-out is taking ${usd(lost)} of deduction at your MAGI.`,
      body: `Every $1,000 of household income above ${usd(result.primaryPhaseOut.thresholdCents)} removes another slice. Pre-tax contributions that lower MAGI — 401(k), HSA — buy some of it back.`,
    });
  }

  if (tips?.claimed && !tips.eligible) {
    out.push({
      id: "tips-ineligible",
      severity: "irreversible",
      label: "Money left behind",
      title: `${formatCents(tips.qualifiedAmountCents)} of tips is not qualifying.`,
      body: tips.reasons[0] ?? "Check the occupation and reporting conditions above.",
    });
  }

  if (overtime?.claimed && !overtime.eligible) {
    out.push({
      id: "ot-ineligible",
      severity: "irreversible",
      label: "Money left behind",
      title: `${formatCents(overtime.qualifiedAmountCents)} of overtime premium is not qualifying.`,
      body: overtime.reasons[0] ?? "Check the conditions above.",
    });
  }

  if (car?.claimed && !car.eligible) {
    out.push({
      id: "car-ineligible",
      severity: "irreversible",
      label: "Money left behind",
      title: `${formatCents(car.qualifiedAmountCents)} of vehicle-loan interest is not qualifying.`,
      body: car.reasons[0] ?? "Check the vehicle conditions above.",
    });
  }

  for (const deduction of result.deductions) {
    // Eligibility first: an ineligible line has a capped amount of zero, which
    // the naive comparison mistook for "you hit the cap".
    if (
      deduction.claimed &&
      deduction.eligible &&
      deduction.qualifiedAmountCents > deduction.capCents
    ) {
      out.push({
        id: `cap-${deduction.id}`,
        severity: "caution",
        label: "At the cap",
        title: `${deduction.label} is capped at ${formatCents(deduction.capCents)}.`,
        body: `You entered ${formatCents(deduction.qualifiedAmountCents)}; the statute stops at the cap, so the excess changes nothing.`,
      });
    }
  }

  if (values.otMode === "TOTAL_OT_PAY" && values.otTotalPayCents > 0) {
    out.push({
      id: "ot-mode",
      severity: "caution",
      label: "Check this",
      title: "Only a third of a time-and-a-half figure is deductible.",
      body: "The engine takes the 0.5× premium out of the total you entered. If your employer pays a different multiplier, enter hours and your regular rate instead.",
    });
  }

  if (result.marginalNext1000.effectiveMarginalRateBps > result.tax.marginalRateBps) {
    out.push({
      id: "marginal",
      severity: "caution",
      label: "Check this",
      title: `Your next $1,000 is taxed at ${formatBps(result.marginalNext1000.effectiveMarginalRateBps)}, not ${formatBps(result.tax.marginalRateBps)}.`,
      body: "The phase-out stacks on top of your bracket, so income near the threshold costs more than the bracket table suggests.",
    });
  }

  return out;
}

/* ─────────────────────────────────────────────────────── occupation hook ── */

function OccupationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const occupationRules = React.useMemo(() => resolveRules(TAX_YEAR).occupations, []);
  const selected = value ? findOccupationByCode(value, occupationRules) : undefined;
  const matches = React.useMemo(
    () => (query.trim().length > 1 ? searchOccupations(query, occupationRules, 6) : []),
    [query, occupationRules],
  );
  const searching = query.trim().length > 1;

  return (
    <Field
      htmlFor="occupation-search"
      label="Your tipped occupation"
      hint="Only occupations on the IRS qualified list count. Type two letters for an instant verdict."
    >
      <Input
        id="occupation-search"
        type="search"
        value={query}
        autoComplete="off"
        placeholder="waiter, bartender, nail tech, rideshare driver…"
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      <div aria-live="polite">
        {searching && matches.length > 0 ? (
          <ul
            className="rounded-atlas hairline-all mt-1 list-none p-0"
            style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper-raised)" }}
          >
            {matches.map((match) => (
              <li key={match.occupation.code} className="hairline-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onChange(match.occupation.code);
                    setQuery("");
                  }}
                  className="rounded-atlas flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left"
                  style={{ fontSize: "var(--text-step--1)" }}
                >
                  <span>{match.occupation.title}</span>
                  <span className="num num-cell text-dim">{match.occupation.code}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {searching && matches.length === 0 ? (
          <p className="mt-1 text-flag" style={{ fontSize: "var(--text-step--1)", fontWeight: 500 }}>
            <span className="micro-label text-flag">Money left behind — </span>
            no match on the qualified list. Tips from an unlisted occupation do not qualify,
            even when they are genuinely tips.
          </p>
        ) : null}

        {selected ? (
          <p className="mt-2" style={{ fontSize: "var(--text-step--1)" }}>
            <span className="text-signal" style={{ fontWeight: 600 }}>
              Qualified
            </span>{" "}
            — {selected.title} <span className="num text-dim">({selected.code})</span>{" "}
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-atlas inline-flex min-h-6 items-center text-dim underline underline-offset-4 hover:text-ink"
            >
              change
            </button>
          </p>
        ) : (
          <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            No occupation selected — the tips deduction needs one.
          </p>
        )}
      </div>
    </Field>
  );
}

/* ───────────────────────────────────────────────────────────── the tool ── */

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset
      className="rounded-atlas hairline-all m-0 flex min-w-0 flex-col gap-3 px-4 pt-2 pb-4"
      style={{ borderRadius: "var(--radius-atlas)" }}
    >
      <legend className="micro-label px-1">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function Calculator() {
  const [values, setValues] = React.useState<FormValues>(DEFAULTS);
  const meta = React.useMemo(() => rulesMeta(TAX_YEAR), []);

  // Restore once; persist on every change. localStorage only — nothing leaves
  // the browser (no database, no auth, v1 invariant).
  React.useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const parsed = formSchema.safeParse(JSON.parse(raw));
      if (parsed.success) setValues(parsed.data);
    } catch {
      /* corrupted state → keep the defaults */
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      /* storage full or blocked — recalculation still works */
    }
  }, [values]);

  const set = React.useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  }, []);

  const result = React.useMemo(() => run(values), [values]);
  const joint = values.filingStatus === "MARRIED_JOINT";

  const engineInput = React.useMemo(() => buildEngineInput(values), [values]);
  const overtimeRules = React.useMemo(() => resolveRules(TAX_YEAR).overtime, []);
  const otPremium = overtimePremiumCents(engineInput, overtimeRules);
  const otGross = grossOvertimePayCents(engineInput, overtimeRules);

  /** The marginal probe re-runs the whole engine at the probed income. */
  const deriveMarginal = React.useCallback(
    (probe: Cents) => {
      const here = run({ ...values, wagesCents: probe });
      const next = run({ ...values, wagesCents: probe + 1_000_00 });
      if (!here || !next) return { delta: 0, per: "a year" };
      return { delta: next.tax.taxAfterCents - here.tax.taxAfterCents, per: "a year" };
    },
    [values],
  );

  /** Hook 2: what one more 8-hour shift is actually worth. */
  const shiftValue = React.useMemo(() => {
    if (values.otMode !== "HOURS_RATE" || values.otRateCents <= 0 || !result) return null;
    const after = run({ ...values, otHours: values.otHours + SHIFT_HOURS });
    if (!after) return null;
    const grossAdded = Math.round(values.otRateCents * 1.5 * SHIFT_HOURS);
    return {
      grossAdded,
      deductionAdded: after.totalDeductionCents - result.totalDeductionCents,
      taxDelta: after.tax.taxAfterCents - result.tax.taxAfterCents,
    };
  }, [values, result]);

  if (!result) {
    return (
      <p
        className="rounded-atlas hairline-all p-4"
        style={{ borderRadius: "var(--radius-atlas)" }}
      >
        Those figures are outside what the engine can model. Lower the income or the hours and
        the statement returns.
      </p>
    );
  }

  const warnings = buildWarnings(values, result);
  const progress = completeness(result);

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {/*
       * The live verdict leads the page at EVERY width. Below `lg` the grid
       * collapses to one column and the pay statement lands under the whole
       * form, which would put the answer several screens down on a phone — and
       * the thesis is that the hero is data, not a headline. Hoisting the one
       * sentence that already carries the answer's number keeps that true at
       * 375 without making the reader scroll past their own inputs to reach it.
       */}
      <div style={{ maxWidth: "var(--measure)" }}>
        <p aria-live="polite" className="text-ink" style={{ fontSize: "var(--text-step-1)" }}>
          {verdictSentence(result)}
        </p>
        <ConfidenceMeter
          className="mt-3"
          filled={progress.filled}
          total={progress.total}
          missingLabel={progress.missingLabel}
        />
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]">
      {/* ───────────────────────────────────────────────────── the inputs ── */}
      <form
        aria-label="Your household"
        className="flex min-w-0 flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <Fieldset legend="Household">
          <Field htmlFor="filingStatus" label="Filing status">
            <Select
              id="filingStatus"
              value={values.filingStatus}
              onChange={(v) => set("filingStatus", v as FormValues["filingStatus"])}
              options={[
                { value: "SINGLE", label: "Single" },
                { value: "MARRIED_JOINT", label: "Married filing jointly" },
                { value: "MARRIED_SEPARATE", label: "Married filing separately" },
                { value: "HEAD_OF_HOUSEHOLD", label: "Head of household" },
              ]}
            />
          </Field>

          <Field
            htmlFor="wages"
            label="Your base wages"
            hint="Before tax, excluding tips and overtime — those go below."
          >
            <NumberInput
              id="wages"
              unit="cents"
              value={values.wagesCents}
              min={0}
              onChange={(v) => set("wagesCents", v)}
            />
          </Field>

          <Field
            htmlFor="otherIncome"
            label={joint ? "Spouse and other income" : "Other income"}
            hint="Everything else in MAGI: a second job, self-employment, interest, pensions."
          >
            <NumberInput
              id="otherIncome"
              unit="cents"
              value={values.otherIncomeCents}
              min={0}
              onChange={(v) => set("otherIncomeCents", v)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field htmlFor="age" label="Your age">
              <NumberInput
                id="age"
                unit="count"
                value={values.age}
                min={16}
                max={120}
                onChange={(v) => set("age", v)}
                constraintHint="65 or over adds the senior deduction"
              />
            </Field>
            {joint ? (
              <Field htmlFor="spouseAge" label="Spouse's age">
                <NumberInput
                  id="spouseAge"
                  unit="count"
                  value={values.spouseAge}
                  min={16}
                  max={120}
                  onChange={(v) => set("spouseAge", v)}
                />
              </Field>
            ) : null}
          </div>
        </Fieldset>

        <Fieldset legend="Tips">
          <Field htmlFor="tips" label="Tips reported this year">
            <NumberInput
              id="tips"
              unit="cents"
              value={values.tipsCents}
              min={0}
              onChange={(v) => set("tipsCents", v)}
            />
          </Field>

          {values.tipsCents > 0 ? (
            <>
              <OccupationPicker
                value={values.occupationCode}
                onChange={(code) => set("occupationCode", code)}
              />
              <Checkbox
                id="tipsReported"
                checked={values.tipsReported}
                onChange={(v) => set("tipsReported", v)}
                label="Reported to my employer or on my return (W-2 Box 7, Form 4070/4137, or 1099)"
              />
              <Checkbox
                id="tipsSelfEmployed"
                checked={values.tipsSelfEmployed}
                onChange={(v) => set("tipsSelfEmployed", v)}
                label="I'm self-employed or a gig worker (1099)"
              />
            </>
          ) : null}
        </Fieldset>

        <Fieldset legend="Overtime">
          <Field htmlFor="otMode" label="How do you want to enter overtime?">
            <RadioGroup
              name="otMode"
              labelledBy="otMode-label"
              orientation="horizontal"
              value={values.otMode}
              onChange={(v) => set("otMode", v as FormValues["otMode"])}
              options={[
                { value: "HOURS_RATE", label: "Hours and rate" },
                { value: "TOTAL_OT_PAY", label: "Total OT pay" },
              ]}
            />
          </Field>

          {values.otMode === "HOURS_RATE" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field htmlFor="otHours" label="Overtime hours this year">
                  <NumberInput
                    id="otHours"
                    unit="count"
                    value={values.otHours}
                    min={0}
                    max={4000}
                    step={SHIFT_HOURS}
                    onChange={(v) => set("otHours", v)}
                  />
                </Field>
                <Field htmlFor="otRate" label="Regular hourly rate">
                  <NumberInput
                    id="otRate"
                    unit="cents"
                    value={values.otRateCents}
                    min={0}
                    step={50}
                    onChange={(v) => set("otRateCents", v)}
                  />
                </Field>
              </div>

              {/* Hook: one more shift, priced. */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => set("otHours", values.otHours + SHIFT_HOURS)}
                >
                  Add an 8-hour shift
                </Button>
                {shiftValue ? (
                  <span className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                    <span className="num text-ink">{usd(shiftValue.grossAdded)}</span> gross,{" "}
                    <span className="num text-ink">{usd(shiftValue.deductionAdded)}</span> more
                    deduction
                  </span>
                ) : (
                  <span className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                    Enter your rate to price a shift.
                  </span>
                )}
              </div>
            </>
          ) : (
            <Field
              htmlFor="otTotalPay"
              label="Total overtime pay at time-and-a-half"
              hint="The engine takes one third of this — only the 0.5× premium is deductible."
            >
              <NumberInput
                id="otTotalPay"
                unit="cents"
                value={values.otTotalPayCents}
                min={0}
                onChange={(v) => set("otTotalPayCents", v)}
              />
            </Field>
          )}
        </Fieldset>

        <Fieldset legend="Car loan">
          <Field htmlFor="carInterest" label="Interest paid on a vehicle loan this year">
            <NumberInput
              id="carInterest"
              unit="cents"
              value={values.carInterestCents}
              min={0}
              step={5000}
              onChange={(v) => set("carInterestCents", v)}
            />
          </Field>

          {values.carInterestCents > 0 ? (
            <>
              <Checkbox
                id="carNew"
                checked={values.carNew}
                onChange={(v) => set("carNew", v)}
                label="The vehicle was new when I bought it"
              />
              <Checkbox
                id="carUS"
                checked={values.carUS}
                onChange={(v) => set("carUS", v)}
                label="Final assembly in the United States (check the window sticker)"
              />
              <Checkbox
                id="carPersonal"
                checked={values.carPersonal}
                onChange={(v) => set("carPersonal", v)}
                label="Personal use, not business"
              />
              <Field htmlFor="carLoanDate" label="Loan origination date">
                <Input
                  id="carLoanDate"
                  type="date"
                  className="num"
                  value={values.carLoanDate}
                  onChange={(event) => set("carLoanDate", event.currentTarget.value)}
                />
              </Field>
            </>
          ) : null}
        </Fieldset>
      </form>

      {/* ──────────────────────────────────────────────────── the answer ── */}
      <div className="flex min-w-0 flex-col gap-8">
        <Paystub result={result} />

        <LiveWarnings warnings={warnings} />

        <PhaseOutMeter result={result} />

        {/*
         * REMOVED IN THE FINAL PASS: a paragraph here restated the marginal
         * rate in prose directly above a probe that already reports it, live,
         * at whatever income the reader drags to — and the "effective rate
         * beats your bracket" half of it is already a LiveWarning that fires
         * exactly when it's true. Three statements of one fact is two too
         * many, and the probe is the one that lets you explore it.
         */}
        <section aria-labelledby="marginal-probe">
          <h3 id="marginal-probe" style={{ fontSize: "var(--text-step-0)" }}>
            What the next dollar costs
          </h3>
          <MarginalProbe
            className="mt-3"
            label="Your base wages"
            unit="cents"
            value={values.wagesCents}
            onChange={(v) => set("wagesCents", v)}
            min={0}
            max={400_000_00}
            step={1_000_00}
            derive={deriveMarginal}
            format={usd}
          />
        </section>

        {otGross > 0 ? (
          <OvertimeDiagram
            regularRateCents={
              engineInput.overtime?.mode === "HOURS_RATE"
                ? engineInput.overtime.regularHourlyRateCents
                : undefined
            }
          />
        ) : null}

        <W2Checker
          result={result}
          tipsCents={engineInput.tips?.amountCents ?? 0}
          overtimePremiumCents={otPremium}
          grossOvertimePayCents={otGross}
          baseWagesCents={engineInput.wagesCents}
        />

        <div className="hairline-t pt-2">
          <CalcTrace result={result} />
          <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--2)" }}>
            Rule sets <span className="num">{meta.version}</span>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
