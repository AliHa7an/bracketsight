"use client";

/**
 * Step ③ Goals — the two answers that move the ranking most, and the one
 * question whose wrong answer cannot be taken back.
 *
 * Both controls here are engagement hooks in the interaction spec's sense:
 *   • the PSLF answer reorders the whole ranking, and says so in a live
 *     sentence naming the plan it swaps in;
 *   • the income-growth slider is the residency-to-attending simulator — drag
 *     it and watch which plan wins change under you.
 * Neither is a toy: PSLF changes the forgiveness clock and the tax on it, and
 * income growth compounds into every recertification.
 */

import * as React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { SimulationResult } from "@/engines/repayment";
import { PLAN_NAMES } from "@/engines/repayment";
import { resolveFormValues, simulateFromForm, type FormValues } from "@/lib/loans/schema";
import { formatPct } from "@/components/ui";
import { Field, NumberInput, RadioGroup } from "@/components/ui";

const PSLF_OPTIONS = [
  { value: "YES", label: "Yes", hint: "120 qualifying payments, forgiven tax-free." },
  { value: "NO", label: "No" },
  { value: "UNSURE", label: "Not sure", hint: "Simulated without PSLF — the conservative read." },
];

export function GoalsStep({ result, asOf }: { result: SimulationResult | null; asOf: Date }) {
  const { control, formState } = useFormContext<FormValues>();
  const watched = useWatch({ control });
  const errors = formState.errors.goals;
  const growth = useWatch({ control, name: "goals.expectedAnnualIncomeGrowthPct" });

  /**
   * The counterfactual: which plan wins if the PSLF answer flips. Rendered only
   * when the answer actually changes the winner — a sentence that says "nothing
   * changes" is noise.
   */
  const pslfSwap = React.useMemo(() => {
    if (!result) return null;
    const base = resolveFormValues(watched);
    const flipped = base.goals.pursuingPSLF === "YES" ? "NO" : "YES";
    const alt = simulateFromForm(
      { ...base, goals: { ...base.goals, pursuingPSLF: flipped } },
      asOf,
    );
    if (!alt) return null;
    const now = result.recommendation.lowestTotalCost;
    const then = alt.recommendation.lowestTotalCost;
    if (now === then) return null;
    return { flipped, now: PLAN_NAMES[now], then: PLAN_NAMES[then] };
  }, [watched, result, asOf]);

  const winnerName = result ? PLAN_NAMES[result.recommendation.lowestTotalCost] : null;

  return (
    <div className="flex flex-col gap-5">
      <Controller
        control={control}
        name="goals.pursuingPSLF"
        render={({ field: f }) => (
          <Field
            label="Are you pursuing Public Service Loan Forgiveness?"
            htmlFor="goals-pslf"
            hint="Government and qualifying non-profit employment counts. PSLF forgiveness is not taxed; every other kind is."
          >
            <RadioGroup
              name="goals-pslf"
              value={f.value}
              onChange={f.onChange}
              options={PSLF_OPTIONS}
              orientation="horizontal"
            />
          </Field>
        )}
      />

      {pslfSwap ? (
        <p className="text-ink" style={{ fontSize: "var(--text-step--1)", lineHeight: 1.35 }}>
          This answer decides the ranking. With your current answer the cheapest plan is{" "}
          <span className="font-medium">{pslfSwap.now}</span>; answer{" "}
          {pslfSwap.flipped === "YES" ? "yes" : "no"} and it becomes{" "}
          <span className="font-medium">{pslfSwap.then}</span>.
        </p>
      ) : null}

      <Controller
        control={control}
        name="goals.priorQualifyingPayments"
        render={({ field: f }) => (
          <Field
            label="Qualifying payments you have already made"
            htmlFor="goals-prior"
            hint="On IBR, PAYE or ICR these count toward forgiveness. Moving to RAP forfeits them permanently. Your servicer's payment-count letter has the number."
            error={errors?.priorQualifyingPayments?.message}
          >
            <NumberInput
              id="goals-prior"
              unit="count"
              value={f.value ?? 0}
              onChange={f.onChange}
              onBlur={f.onBlur}
              min={0}
              max={360}
            />
          </Field>
        )}
      />

      {/*
       * The residency-to-attending simulator. A native range, so arrow keys,
       * Home/End, PageUp/PageDown and touch all work without reimplementation;
       * the readout below names the winning plan at the value under the thumb.
       */}
      <Controller
        control={control}
        name="goals.expectedAnnualIncomeGrowthPct"
        render={({ field: f }) => (
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="goals-growth" className="micro-label">
                Expected annual income growth
              </label>
              <output
                htmlFor="goals-growth"
                className="num text-ink"
                style={{ fontSize: "var(--text-step-1)", fontWeight: 500 }}
              >
                {formatPct(typeof growth === "number" ? growth : 3)}
              </output>
            </div>

            <input
              id="goals-growth"
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={typeof f.value === "number" ? f.value : 3}
              onChange={(event) => f.onChange(Number(event.currentTarget.value))}
              aria-describedby="goals-growth-readout"
              aria-valuetext={`${formatPct(typeof f.value === "number" ? f.value : 3)} a year`}
              className="mt-2 block h-11 w-full cursor-ew-resize bg-transparent"
              style={{ accentColor: "var(--ink)" }}
            />

            <div className="flex items-baseline justify-between">
              <span className="num micro-label" style={{ textTransform: "none" }}>
                0.0%
              </span>
              <span className="num micro-label" style={{ textTransform: "none" }}>
                15.0%
              </span>
            </div>

            <p
              id="goals-growth-readout"
              className="mt-2 text-ink"
              style={{ fontSize: "var(--text-step--1)", lineHeight: 1.35 }}
            >
              {winnerName ? (
                <>
                  At <span className="num">{formatPct(typeof f.value === "number" ? f.value : 3)}</span>{" "}
                  a year, your cheapest plan is{" "}
                  <span className="font-medium">{winnerName}</span>. A resident moving to
                  attending pay usually sets this between{" "}
                  <span className="num">10%</span> and <span className="num">15%</span>.
                </>
              ) : (
                <>
                  Income-driven payments recertify every year, so growth compounds into all of
                  them.
                </>
              )}
            </p>
          </div>
        )}
      />
    </div>
  );
}
