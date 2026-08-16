"use client";

/**
 * Step ② Household — the income side of every income-driven formula.
 *
 * The income field carries the marginal probe (M3): a slider that reports the
 * DERIVATIVE rather than the level — "each additional $1,000 of income costs
 * you $340 a year." Federal repayment is a system of brackets and phase-outs,
 * so the marginal rate, not the balance, is what decides the plan. The figure
 * comes from running the engine twice, at this income and at this income plus
 * one step, and subtracting. Nothing is estimated.
 */

import * as React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { SimulationResult } from "@fineprint/engine-repayment";
import { resolveFormValues, simulateFromForm, type FormValues } from "@/lib/loans/schema";
import { usd } from "@fineprint/ui";
import { Field, MarginalProbe, NumberInput, Select } from "@fineprint/ui";

const FILING_STATUSES = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED_JOINT", label: "Married filing jointly" },
  { value: "MARRIED_SEPARATE", label: "Married filing separately" },
  { value: "HEAD_OF_HOUSEHOLD", label: "Head of household" },
];

const STATE_GROUPS = [
  { value: "CONTIGUOUS_48", label: "One of the 48 contiguous states, or D.C." },
  { value: "ALASKA", label: "Alaska" },
  { value: "HAWAII", label: "Hawaii" },
];

/** One step of the probe: $1,000 of income, in cents. */
const PROBE_STEP = 100_000;
const PROBE_MAX = 30_000_000;

export function HouseholdStep({
  result,
  asOf,
}: {
  result: SimulationResult | null;
  asOf: Date;
}) {
  const { control, formState } = useFormContext<FormValues>();
  const watched = useWatch({ control });
  const errors = formState.errors.household;
  const filing = useWatch({ control, name: "household.filingStatus" });
  const married = filing === "MARRIED_JOINT" || filing === "MARRIED_SEPARATE";

  /**
   * The derivative, in engine-exact cents: what one more $1,000 of income does
   * to a year of payments on the plan currently recommended.
   */
  const marginal = React.useMemo(() => {
    if (!result) return 0;
    const planId = result.recommendation.lowestTotalCost;
    const here = result.plans.find((p) => p.planId === planId);
    if (!here) return 0;

    const base = resolveFormValues(watched);
    const bumped = simulateFromForm(
      {
        ...base,
        household: { ...base.household, agiDollars: base.household.agiDollars + 1000 },
      },
      asOf,
    );
    const there = bumped?.plans.find((p) => p.planId === planId);
    if (!there || !there.eligible) return 0;
    return (there.firstMonthlyPayment - here.firstMonthlyPayment) * 12;
  }, [watched, result, asOf]);

  return (
    <div className="flex flex-col gap-5">
      <Controller
        control={control}
        name="household.agiDollars"
        render={({ field: f }) => (
          <>
            <Field
              label="Adjusted gross income"
              htmlFor="hh-agi"
              error={errors?.agiDollars?.message}
              required
            >
              <NumberInput
                id="hh-agi"
                unit="cents"
                value={Math.round((f.value ?? 0) * 100)}
                onChange={(cents) => f.onChange(cents / 100)}
                onBlur={f.onBlur}
                min={0}
                max={500_000_000}
                constraintHint="Line 11 of your last federal return."
              />
            </Field>

            {/* M3 — the derivative, not the level. The ceiling follows an income
                above it rather than clamping, so touching the slider can never
                silently cut a figure the borrower typed. */}
            <MarginalProbe
              label="Try another income"
              unit="cents"
              value={Math.round((f.value ?? 0) * 100)}
              onChange={(cents) => f.onChange(cents / 100)}
              min={0}
              max={Math.max(
                PROBE_MAX,
                Math.ceil(Math.round((f.value ?? 0) * 100) / PROBE_STEP) * PROBE_STEP,
              )}
              step={PROBE_STEP}
              derive={() => ({ delta: marginal, per: "a year" })}
              format={usd}
            />
          </>
        )}
      />

      <Controller
        control={control}
        name="household.filingStatus"
        render={({ field: f }) => (
          <Field
            label="Tax filing status"
            htmlFor="hh-filing"
            hint="Filing jointly puts both incomes into the payment formula. Filing separately keeps your spouse's income out — at a cost on the return itself."
          >
            <Select
              id="hh-filing"
              value={f.value}
              onChange={f.onChange}
              onBlur={f.onBlur}
              options={FILING_STATUSES}
            />
          </Field>
        )}
      />

      {married ? (
        <>
          <Controller
            control={control}
            name="household.spouseAgiDollars"
            render={({ field: f }) => (
              <Field
                label="Your spouse's adjusted gross income"
                htmlFor="hh-spouse-agi"
                error={errors?.spouseAgiDollars?.message}
              >
                <NumberInput
                  id="hh-spouse-agi"
                  unit="cents"
                  value={Math.round((f.value ?? 0) * 100)}
                  onChange={(cents) => f.onChange(cents / 100)}
                  onBlur={f.onBlur}
                  min={0}
                  max={500_000_000}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="household.spouseFederalLoanBalanceDollars"
            render={({ field: f }) => (
              <Field
                label="Your spouse's federal loan balance"
                htmlFor="hh-spouse-balance"
                hint="A spouse who also carries federal loans splits the joint payment."
                error={errors?.spouseFederalLoanBalanceDollars?.message}
              >
                <NumberInput
                  id="hh-spouse-balance"
                  unit="cents"
                  value={Math.round((f.value ?? 0) * 100)}
                  onChange={(cents) => f.onChange(cents / 100)}
                  onBlur={f.onBlur}
                  min={0}
                  max={500_000_000}
                />
              </Field>
            )}
          />
        </>
      ) : null}

      <Controller
        control={control}
        name="household.dependentsClaimed"
        render={({ field: f }) => (
          <Field
            label="Dependents you claim"
            htmlFor="hh-dependents"
            hint="RAP takes $50 a month off your payment for each one."
            error={errors?.dependentsClaimed?.message}
          >
            <NumberInput
              id="hh-dependents"
              unit="count"
              value={f.value ?? 0}
              onChange={f.onChange}
              onBlur={f.onBlur}
              min={0}
              max={20}
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="household.familySize"
        render={({ field: f }) => (
          <Field
            label="Family size"
            htmlFor="hh-family"
            hint="You, your spouse, and your dependents. IBR, PAYE and ICR protect income up to a multiple of the poverty guideline for this number."
            error={errors?.familySize?.message}
            required
          >
            <NumberInput
              id="hh-family"
              unit="count"
              value={f.value ?? 1}
              onChange={f.onChange}
              onBlur={f.onBlur}
              min={1}
              max={20}
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="household.stateGroup"
        render={({ field: f }) => (
          <Field
            label="Where you live"
            htmlFor="hh-state"
            hint="Alaska and Hawaii have higher poverty guidelines, which lowers every income-driven payment."
          >
            <Select
              id="hh-state"
              value={f.value}
              onChange={f.onChange}
              onBlur={f.onBlur}
              options={STATE_GROUPS}
            />
          </Field>
        )}
      />
    </div>
  );
}
