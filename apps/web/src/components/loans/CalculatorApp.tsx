"use client";

/**
 * The instrument. Not a calculator.
 *
 * Left column: the ① ② ③ form. Right column: the answer, which is already on
 * screen when the page loads and which refines with every keystroke. There is
 * no Calculate button here or anywhere else in the product (M1) — the engine is
 * synchronous, client-side and dependency-free, so the answer updates faster
 * than a person can type and a gate would only add latency to a result that
 * already exists.
 *
 * Nothing is sent anywhere. State persists to localStorage on every change and
 * to the URL *fragment* — a fragment rather than a query string because a query
 * string travels to the server in the request line, and "your loan data never
 * leaves your browser" has to be true in the network tab, not just in the copy.
 */

import * as React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SimulationResult } from "@fineprint/engine-repayment";
import { PLAN_NAMES } from "@fineprint/engine-repayment";
import {
  exampleFormValues,
  formSchema,
  resolveFormValues,
  simulateFromForm,
  type FormValues,
} from "@/lib/loans/schema";
import { decodeScenario, encodeScenario } from "@/lib/loans/url-state";
import { usd } from "@fineprint/ui";
import {
  Button,
  ConfidenceMeter,
  ErrorState,
  ScenarioPins,
  Stepper,
  useScenarioPins,
} from "@fineprint/ui";
import { LoanEntryForm } from "./LoanEntryForm";
import { HouseholdStep } from "./HouseholdStep";
import { GoalsStep } from "./GoalsStep";
import { Results } from "./Results";

/*
 * Five sections now share one origin, so every key this section writes is
 * namespaced `fineprint.<section>.` — two tools cannot collide in the same
 * browser. The standalone key is still read once, so a returning borrower
 * whose scenario predates the merge does not lose it; the next change writes
 * it back under the new key.
 */
const STORAGE_KEY = "fineprint.loans.scenario.v1";
const LEGACY_STORAGE_KEY = "atlas.scenario.v1";
const HASH_PREFIX = "#s=";

const STEPS = [
  { id: "loans", label: "Your loans" },
  { id: "household", label: "Household" },
  { id: "goals", label: "Goals" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/* ------------------------------------------------------- scenario transport */

function readScenario(): FormValues | null {
  if (typeof window === "undefined") return null;

  // A shared link wins over this browser's own saved state.
  const hash = window.location.hash;
  if (hash.startsWith(HASH_PREFIX)) {
    const fromHash = decodeScenario(hash.slice(HASH_PREFIX.length));
    if (fromHash) return fromHash;
  }
  // Links minted before the move to the fragment still resolve.
  const token = new URLSearchParams(window.location.search).get("s");
  if (token) {
    const fromQuery = decodeScenario(token);
    if (fromQuery) return fromQuery;
  }
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return resolveFormValues(JSON.parse(raw));
  } catch {
    return null;
  }
}

function shareUrl(values: FormValues): string {
  const fragment = `${HASH_PREFIX}${encodeScenario(values)}`;
  if (typeof window === "undefined") return fragment;
  return `${window.location.origin}${window.location.pathname}${fragment}`;
}

/* ------------------------------------------------- M1: how complete is this */

interface Detail {
  key: string;
  /** Phrased as a gain, never a scold: "add your loan types…". */
  ask: string;
  done: boolean;
}

/**
 * Seven details, each one a real thing the engine either has from the reader or
 * is still borrowing from the example borrower. This is not a progress bar with
 * a percentage — every segment stands for one input.
 */
function confirmedDetails(values: FormValues): Detail[] {
  const example = exampleFormValues;
  const exampleLoan = example.loans[0]!;
  const loans = values.loans;

  return [
    {
      key: "balance",
      ask: "add your loan balances",
      done: loans.some((l) => l.balanceDollars !== exampleLoan.balanceDollars),
    },
    {
      key: "rate",
      ask: "add your interest rates",
      done: loans.some((l) => l.ratePct !== exampleLoan.ratePct),
    },
    {
      key: "type",
      ask: "add your loan types — they decide which plans you can use",
      done: loans.length > 1 || loans.some((l) => l.type !== exampleLoan.type),
    },
    {
      key: "disbursed",
      ask: "add your first disbursement dates",
      done: loans.some((l) => l.firstDisbursement !== exampleLoan.firstDisbursement),
    },
    {
      key: "income",
      ask: "add your income",
      done:
        values.household.agiDollars !== example.household.agiDollars ||
        values.household.filingStatus !== example.household.filingStatus,
    },
    {
      key: "family",
      ask: "add your family size",
      done:
        values.household.familySize !== example.household.familySize ||
        values.household.dependentsClaimed !== example.household.dependentsClaimed,
    },
    {
      key: "goals",
      ask: "answer the PSLF question",
      done:
        values.goals.pursuingPSLF !== example.goals.pursuingPSLF ||
        values.goals.priorQualifyingPayments !== example.goals.priorQualifyingPayments,
    },
  ];
}

/* -------------------------------------------------------------- the machine */

export function CalculatorApp() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: exampleFormValues,
    mode: "onChange",
  });
  const [step, setStep] = React.useState<StepId>("loans");
  // Moving between steps has to move focus, or a keyboard user ends up at the
  // top of the document every time the panel swaps. The heading is invisible
  // and unfocusable by Tab; it exists only to be the landing point.
  const stepHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const firstRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [step]);
  // One as-of date for the whole session, so a figure cannot change because the
  // clock ticked between two renders.
  const [asOf] = React.useState(() => new Date());
  const { pins, addPin, removePin } = useScenarioPins();

  const watched = useWatch({ control: form.control });
  const values = React.useMemo(() => resolveFormValues(watched), [watched]);

  // Restore a shared link or this browser's saved scenario. Client-only, so the
  // server and the first client render agree on the example borrower.
  React.useEffect(() => {
    const saved = readScenario();
    if (saved) form.reset(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Never lose work: localStorage on every change, the fragment on a short
  // trailing delay so a burst of keystrokes writes one history entry, not forty.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // Quota or private mode. The tool works; it just will not remember.
    }
    const timer = setTimeout(() => {
      try {
        window.history.replaceState(null, "", `${HASH_PREFIX}${encodeScenario(values)}`);
      } catch {
        // Some embedded webviews refuse history writes. Not worth surfacing.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [values]);

  const result: SimulationResult | null = React.useMemo(
    () => simulateFromForm(values, asOf),
    [values, asOf],
  );

  const details = React.useMemo(() => confirmedDetails(values), [values]);
  const filled = details.filter((d) => d.done).length;
  const firstMissing = details.find((d) => !d.done);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function restorePin(id: string) {
    const pin = pins.find((p) => p.id === id);
    if (!pin) return;
    const index = pin.url.indexOf(HASH_PREFIX);
    const decoded = index === -1 ? null : decodeScenario(pin.url.slice(index + HASH_PREFIX.length));
    if (decoded) form.reset(decoded);
  }

  function pinCurrent() {
    if (!result) return;
    const winner = result.plans.find((p) => p.planId === result.recommendation.lowestTotalCost);
    if (!winner) return;
    addPin({
      summary: `${PLAN_NAMES[winner.planId]} · ${usd(winner.firstMonthlyPayment)}/mo · ${usd(
        winner.totalLifetimeCost,
      )} total`,
      url: shareUrl(values),
    });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(19rem,22rem)_minmax(0,1fr)] lg:gap-10">
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={(event) => event.preventDefault()}
          aria-label="Your loans, household and goals"
          className="hairline-all rounded-atlas p-4 sm:p-5"
          style={{ background: "var(--paper-raised)" }}
        >
          <Stepper
            steps={STEPS.map((s) => ({ id: s.id, label: s.label }))}
            current={step}
            onNavigate={(id) => setStep(id as StepId)}
            label="Your details"
          />

          <div className="mt-4">
            <h3 ref={stepHeadingRef} tabIndex={-1} className="sr-only">
              {STEPS[stepIndex]?.label} — step {stepIndex + 1} of {STEPS.length}
            </h3>
            {step === "loans" ? <LoanEntryForm /> : null}
            {step === "household" ? <HouseholdStep result={result} asOf={asOf} /> : null}
            {step === "goals" ? <GoalsStep result={result} asOf={asOf} /> : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {stepIndex > 0 ? (
              <Button variant="secondary" onClick={() => setStep(STEPS[stepIndex - 1]!.id)}>
                Back to {STEPS[stepIndex - 1]!.label.toLowerCase()}
              </Button>
            ) : null}
            {stepIndex < STEPS.length - 1 ? (
              <Button onClick={() => setStep(STEPS[stepIndex + 1]!.id)}>
                Continue to {STEPS[stepIndex + 1]!.label.toLowerCase()}
              </Button>
            ) : null}
          </div>
        </form>
      </FormProvider>

      <div className="min-w-0">
        <ConfidenceMeter
          filled={filled}
          total={details.length}
          missingLabel={firstMissing ? `${firstMissing.ask} for an exact answer` : undefined}
        />

        {filled === 0 ? (
          <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            Nothing entered yet, so this models an example borrower —{" "}
            <span className="num">$38,500</span> at <span className="num">6.39%</span> on{" "}
            <span className="num">$55,000</span> of income. Change any field and the answer
            below becomes yours.
          </p>
        ) : null}

        <div className="mt-6">
          {result ? (
            <Results result={result} />
          ) : (
            <ErrorState
              cause="No repayment plan can take this loan mix."
              fix="FFEL, Perkins and HEAL loans are shut out of most plans. Check the loan types in step 1, or consolidate into a Direct Consolidation Loan to open more of them."
              action={
                <Button variant="secondary" onClick={() => setStep("loans")}>
                  Check your loan types
                </Button>
              }
            />
          )}
        </div>

        {/* M7 — pin a scenario, keep editing, compare. The address bar already
            carries the live scenario, so there is no separate share button. */}
        <ScenarioPins
          className="hairline-t mt-8 pt-6"
          pins={pins}
          onPin={pinCurrent}
          onRemove={removePin}
          onRestore={restorePin}
        />
        <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--2)" }}>
          This page&apos;s address carries your scenario in its fragment — copy it from the
          address bar to send it to someone. It never reaches a server.
        </p>
      </div>
    </div>
  );
}
