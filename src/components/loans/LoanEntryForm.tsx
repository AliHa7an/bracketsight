"use client";

/**
 * Step ① Your loans.
 *
 * The loan type is the first field because it is the one that decides which
 * plans exist for this borrower at all — Parent PLUS is shut out of RAP forever,
 * FFEL and Perkins out of RAP and Tiered Standard. So the consequence of the
 * choice is stated next to the choice, live, rather than discovered later in a
 * greyed-out table row.
 *
 * Money is typed in the data face with separators inserted as you go, arrow keys
 * nudge by $1,000 and a quarter point, and the constraint is shown as guidance
 * ("Most federal rates are 3–9%") rather than as a scolding after the fact.
 */

import * as React from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { FormValues, LoanFormValues } from "@/lib/loans/schema";
import { Button, Checkbox, Field, Input, NumberInput, Select } from "@/components/ui";

const LOAN_TYPES: { value: LoanFormValues["type"]; label: string }[] = [
  { value: "DIRECT_SUBSIDIZED", label: "Direct Subsidized" },
  { value: "DIRECT_UNSUBSIDIZED", label: "Direct Unsubsidized" },
  { value: "DIRECT_GRAD_PLUS", label: "Grad PLUS" },
  { value: "DIRECT_PARENT_PLUS", label: "Parent PLUS" },
  { value: "DIRECT_CONSOLIDATION", label: "Direct Consolidation" },
  { value: "FFEL", label: "FFEL (pre-2010, bank-based)" },
  { value: "PERKINS", label: "Perkins" },
  { value: "HEAL", label: "HEAL" },
];

/** The consequence of the type, stated where the type is chosen. */
const TYPE_CONSEQUENCE: Record<LoanFormValues["type"], string> = {
  DIRECT_SUBSIDIZED: "Every plan is open to this loan.",
  DIRECT_UNSUBSIDIZED: "Every plan is open to this loan.",
  DIRECT_GRAD_PLUS: "Grad PLUS can use RAP. It cannot use PAYE or IBR directly.",
  DIRECT_PARENT_PLUS: "Parent PLUS cannot use RAP, even after consolidation.",
  DIRECT_CONSOLIDATION: "What this consolidation repaid decides its RAP eligibility.",
  FFEL: "FFEL cannot use RAP or Tiered Standard.",
  PERKINS: "Perkins cannot use RAP or Tiered Standard.",
  HEAL: "HEAL cannot use RAP or Tiered Standard.",
};

function newLoanRow(): LoanFormValues {
  return {
    id: `loan-${Date.now().toString(36)}`,
    type: "DIRECT_UNSUBSIDIZED",
    balanceDollars: 10_000,
    ratePct: 6.39,
    firstDisbursement: "2022-08-01",
    isConsolidation: false,
    underlyingHadParentPlus: false,
    repaidUnderIdrInWindow: false,
  };
}

export function LoanEntryForm() {
  const { control, formState } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "loans" });
  const loans = useWatch({ control, name: "loans" });
  const errors = formState.errors.loans;

  // Add-a-row focuses the new row's first field, per the input ergonomics rule.
  const focusIndex = React.useRef<number | null>(null);
  React.useEffect(() => {
    const index = focusIndex.current;
    if (index === null) return;
    focusIndex.current = null;
    document.getElementById(`loan-type-${index}`)?.focus();
  }, [fields.length]);

  function addLoan() {
    focusIndex.current = fields.length;
    append(newLoanRow());
  }

  return (
    <div
      className="flex flex-col gap-6"
      onKeyDown={(event) => {
        // Cmd/Ctrl+Enter adds another row without leaving the keyboard.
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          addLoan();
        }
      }}
    >
      {fields.map((field, index) => {
        const rowErrors = errors?.[index];
        const type = loans?.[index]?.type ?? "DIRECT_UNSUBSIDIZED";
        const isConsolidation = type === "DIRECT_CONSOLIDATION";
        const hasParentPlus = loans?.[index]?.underlyingHadParentPlus === true;

        return (
          <fieldset
            key={field.id}
            className={index > 0 ? "hairline-t flex flex-col gap-4 pt-5" : "flex flex-col gap-4"}
          >
            <legend className="micro-label">
              Loan {index + 1} of {fields.length}
            </legend>

            <Controller
              control={control}
              name={`loans.${index}.type`}
              render={({ field: f }) => (
                <Field
                  label="Loan type"
                  htmlFor={`loan-type-${index}`}
                  hint={TYPE_CONSEQUENCE[f.value]}
                >
                  <Select
                    id={`loan-type-${index}`}
                    value={f.value}
                    onChange={(value) => f.onChange(value)}
                    onBlur={f.onBlur}
                    options={LOAN_TYPES}
                  />
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`loans.${index}.balanceDollars`}
              render={({ field: f }) => (
                <Field
                  label="Current balance"
                  htmlFor={`loan-balance-${index}`}
                  error={rowErrors?.balanceDollars?.message}
                  required
                >
                  <NumberInput
                    id={`loan-balance-${index}`}
                    unit="cents"
                    value={Math.round((f.value ?? 0) * 100)}
                    onChange={(cents) => f.onChange(cents / 100)}
                    onBlur={f.onBlur}
                    min={0}
                    max={500_000_000}
                    constraintHint="What you owe today, not what you borrowed."
                  />
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`loans.${index}.ratePct`}
              render={({ field: f }) => (
                <Field
                  label="Interest rate"
                  htmlFor={`loan-rate-${index}`}
                  error={rowErrors?.ratePct?.message}
                  required
                >
                  <NumberInput
                    id={`loan-rate-${index}`}
                    unit="bps"
                    value={Math.round((f.value ?? 0) * 100)}
                    onChange={(bps) => f.onChange(bps / 100)}
                    onBlur={f.onBlur}
                    min={0}
                    max={3000}
                    constraintHint="Most federal rates sit between 3% and 9%."
                  />
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`loans.${index}.firstDisbursement`}
              render={({ field: f }) => (
                <Field
                  label="First disbursement"
                  htmlFor={`loan-disbursed-${index}`}
                  hint="Loans first paid out on or after 1 Jul 2026 can only use RAP or Tiered Standard."
                  error={rowErrors?.firstDisbursement?.message}
                  required
                >
                  <Input
                    id={`loan-disbursed-${index}`}
                    type="date"
                    className="num"
                    value={f.value ?? ""}
                    onChange={f.onChange}
                    onBlur={f.onBlur}
                  />
                </Field>
              )}
            />

            {isConsolidation ? (
              <Controller
                control={control}
                name={`loans.${index}.underlyingHadParentPlus`}
                render={({ field: f }) => (
                  <div>
                    <Checkbox
                      id={`loan-taint-${index}`}
                      checked={f.value === true}
                      onChange={f.onChange}
                      label="This consolidation repaid a Parent PLUS loan"
                      aria-describedby={`loan-taint-${index}-hint`}
                    />
                    <p
                      id={`loan-taint-${index}-hint`}
                      className="text-dim"
                      style={{ fontSize: "var(--text-step--1)" }}
                    >
                      A consolidation that repaid any Parent PLUS loan normally cannot use RAP. It
                      matters however long ago it happened. There is one exception — the next
                      question.
                    </p>
                  </div>
                )}
              />
            ) : null}

            {/* The § 685.209(b)(6)(ii) exception. Asked only when it can change
                the answer: a consolidation that repaid a Parent PLUS loan. */}
            {isConsolidation && hasParentPlus ? (
              <Controller
                control={control}
                name={`loans.${index}.repaidUnderIdrInWindow`}
                render={({ field: f }) => (
                  <div>
                    <Checkbox
                      id={`loan-idr-window-${index}`}
                      checked={f.value === true}
                      onChange={f.onChange}
                      label="I was paying this loan on an income-driven plan — IBR, PAYE, or ICR — at some point between 4 July 2025 and 30 June 2028"
                      aria-describedby={`loan-idr-window-${index}-hint`}
                    />
                    <p
                      id={`loan-idr-window-${index}-hint`}
                      className="text-dim"
                      style={{ fontSize: "var(--text-step--1)" }}
                    >
                      If that is true, this consolidation keeps RAP despite the Parent PLUS loan it
                      repaid. Even one payment inside that window counts. Leave it unticked if you
                      are not sure — your servicer will check, and assuming RAP you cannot have is
                      the costlier mistake.
                    </p>
                  </div>
                )}
              />
            ) : null}

            {fields.length > 1 ? (
              <div>
                <Button variant="ghost" onClick={() => remove(index)}>
                  Remove loan {index + 1}
                </Button>
              </div>
            ) : null}
          </fieldset>
        );
      })}

      <div>
        <Button variant="secondary" onClick={addLoan}>
          Add another loan
        </Button>
      </div>

      <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        These four figures are on your StudentAid.gov account under &ldquo;My Aid,&rdquo; and on
        every servicer statement. What you type stays in this browser.
      </p>
    </div>
  );
}
