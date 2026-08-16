"use client";

import * as React from "react";
import Link from "next/link";
import {
  counties,
  getCounty,
  runAssessmentCheck,
  sampleParcels,
  SAMPLE_DATA_LABEL,
  SAMPLE_NEIGHBORHOOD_ID,
  SAMPLE_NEIGHBORHOOD_NAME,
  type AssessmentCheck,
  type Property,
  type PropertyClass,
} from "@/engines/property";
import {
  ConfidenceMeter,
  ErrorState,
  Field,
  Input,
  MarginalProbe,
  NumberInput,
  RadioGroup,
  Select,
} from "@/components/ui";
import { CompMap } from "./CompMap";
import { EvidenceSummary } from "./EvidenceSummary";
import { VerdictBlock } from "./VerdictBlock";
import { formatNumber, todayIso, usd } from "@/lib/property/format";

/**
 * The check — one screen, no Calculate button.
 *
 * The verdict is on the page from the first frame, computed from sample-parcel
 * defaults, and it re-computes on every keystroke because the engine is
 * synchronous and client-side. The <ConfidenceMeter> says how much of the
 * answer is yours and how much is still a default, which communicates
 * incompleteness without ever blocking the answer.
 *
 * Validation shows the constraint as you type ("Most homes here are 900–4,000
 * sqft"), never a scolding after you leave the field.
 */

/* -------------------------------------------------------------------------- *
 * The form model
 * -------------------------------------------------------------------------- */

interface FormState {
  address: string;
  propertyClass: PropertyClass;
  sqft: number;
  beds: number;
  baths: number;
  lotSqft: number;
  yearBuilt: number;
  assessedValueCents: number;
}

/** The seven details the engine's comp filters actually read. */
const DETAILS = [
  "sqft",
  "beds",
  "baths",
  "lotSqft",
  "yearBuilt",
  "assessedValueCents",
  "propertyClass",
] as const;
type DetailKey = (typeof DETAILS)[number];

const CURRENT_YEAR = new Date().getUTCFullYear();

const LIMITS = {
  sqft: { min: 200, max: 20000, hint: "Most homes on this sheet are 900–4,000 sqft." },
  beds: { min: 0, max: 20, hint: "Bedrooms as the county records them." },
  lotSqft: { min: 0, max: 500000, hint: "From your notice or the county parcel record." },
  yearBuilt: { min: 1850, max: CURRENT_YEAR, hint: "The year the county has on file." },
  assessedValueCents: {
    min: 100_00,
    max: 100_000_000_00,
    hint: "The assessed value printed on your notice — not what you think it would sell for.",
  },
} as const;

function parcelToForm(parcel: Property): FormState {
  return {
    address: parcel.address,
    propertyClass: parcel.class,
    sqft: parcel.sqft,
    beds: parcel.beds,
    baths: parcel.baths,
    lotSqft: parcel.lotSqft,
    yearBuilt: parcel.yearBuilt,
    assessedValueCents: parcel.assessedValueCents,
  };
}

const CLASS_OPTIONS = [
  { value: "RESIDENTIAL", label: "House", hint: "Single-family, detached or attached." },
  { value: "CONDO", label: "Condo", hint: "A unit in a shared building." },
  { value: "TWO_TO_SIX_UNIT", label: "2–6 units", hint: "A small multi-family building." },
];

const BATH_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((n) => ({
  value: String(n),
  label: `${n} ${n === 1 ? "bath" : "baths"}`,
}));

function validate(form: FormState): Partial<Record<DetailKey | "address", string>> {
  const errors: Partial<Record<DetailKey | "address", string>> = {};
  if (form.address.trim().length === 0) {
    errors.address = "Give your home a label — the street address works.";
  }
  if (form.sqft < LIMITS.sqft.min || form.sqft > LIMITS.sqft.max) {
    errors.sqft = `Living area has to be between ${formatNumber(LIMITS.sqft.min)} and ${formatNumber(LIMITS.sqft.max)} sqft to match residential comparables.`;
  }
  if (form.yearBuilt < LIMITS.yearBuilt.min || form.yearBuilt > LIMITS.yearBuilt.max) {
    errors.yearBuilt = `Year built has to be between ${LIMITS.yearBuilt.min} and ${LIMITS.yearBuilt.max}.`;
  }
  if (form.assessedValueCents < LIMITS.assessedValueCents.min) {
    errors.assessedValueCents = "Enter the assessed value from your notice.";
  }
  if (form.lotSqft < 0 || form.lotSqft > LIMITS.lotSqft.max) {
    errors.lotSqft = `Lot size has to be between 0 and ${formatNumber(LIMITS.lotSqft.max)} sqft.`;
  }
  return errors;
}

/* -------------------------------------------------------------------------- *
 * The component
 * -------------------------------------------------------------------------- */

export function CheckTool({
  /**
   * "compact" stops after the Comp Map and points at /check for the evidence
   * exhibit, so the home page can open with a live answer without republishing
   * the whole check page underneath it.
   */
  variant = "full",
}: {
  variant?: "full" | "compact";
} = {}) {
  const asOf = React.useMemo(() => todayIso(), []);
  const startingParcel = sampleParcels[0] as Property;

  const [countyId, setCountyId] = React.useState("nj-bergen");
  const [startId, setStartId] = React.useState(startingParcel.id);
  const [form, setForm] = React.useState<FormState>(() => parcelToForm(startingParcel));
  const [confirmed, setConfirmed] = React.useState<Set<DetailKey>>(() => new Set());

  const county = getCounty(countyId);
  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    if ((DETAILS as readonly string[]).includes(key as string)) {
      setConfirmed((previous) => new Set(previous).add(key as DetailKey));
    }
  }

  function loadParcel(id: string) {
    const parcel = sampleParcels.find((p) => p.id === id);
    if (!parcel) return;
    setStartId(id);
    setForm(parcelToForm(parcel));
    setConfirmed(new Set());
  }

  const subject: Property = {
    id: "YOUR-HOME",
    address: form.address.trim() || "Your home",
    neighborhoodId: SAMPLE_NEIGHBORHOOD_ID,
    class: form.propertyClass,
    sqft: form.sqft,
    beds: form.beds,
    baths: form.baths,
    lotSqft: form.lotSqft,
    yearBuilt: form.yearBuilt,
    assessedValueCents: form.assessedValueCents,
    assessmentDate: asOf,
  };

  const result: { check: AssessmentCheck } | { error: string } | null = React.useMemo(() => {
    if (!county || hasErrors) return null;
    try {
      return { check: runAssessmentCheck(subject, sampleParcels, county, asOf) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
    // The subject object is rebuilt every render; its contents are the real deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [county, hasErrors, asOf, JSON.stringify(subject)]);

  const taxBps = county?.estimatedTaxRateOnAssessedBps ?? 0;

  return (
    <div className="flex flex-col gap-10">
      {/* ---- The inputs -------------------------------------------------- */}
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          htmlFor="county"
          label="County rules to apply"
          hint={
            county?.primaryArgument === "MARKET_VALUE"
              ? "Compares your assessment against recent sales of similar homes."
              : "Compares your assessment per square foot against your neighbours'. No sales needed."
          }
        >
          <Select
            id="county"
            value={countyId}
            onChange={setCountyId}
            options={counties.map((c) => ({
              value: c.countyId,
              label: `${c.countyName}, ${c.state}`,
            }))}
          />
        </Field>

        <Field
          htmlFor="start-from"
          label="Start from a sample parcel"
          hint="Loads that home's details below. Change any of them to describe your own."
        >
          <Select
            id="start-from"
            value={startId}
            onChange={loadParcel}
            options={sampleParcels.map((p) => ({
              value: p.id,
              label: `${p.address} · ${formatNumber(p.sqft)} sqft`,
            }))}
          />
        </Field>

        <Field
          htmlFor="address"
          label="Address or label"
          hint="Only you see this. It labels your parcel on the map."
          error={errors.address}
        >
          <Input
            id="address"
            value={form.address}
            onChange={(event) => set("address", event.currentTarget.value)}
          />
        </Field>

        <Field
          htmlFor="sqft"
          label="Living area"
          hint={LIMITS.sqft.hint}
          error={errors.sqft}
        >
          <NumberInput
            id="sqft"
            unit="count"
            step={50}
            min={LIMITS.sqft.min}
            max={LIMITS.sqft.max}
            value={form.sqft}
            onChange={(n) => set("sqft", n)}
          />
        </Field>

        <Field htmlFor="beds" label="Bedrooms" hint={LIMITS.beds.hint}>
          <NumberInput
            id="beds"
            unit="count"
            step={1}
            min={LIMITS.beds.min}
            max={LIMITS.beds.max}
            value={form.beds}
            onChange={(n) => set("beds", n)}
          />
        </Field>

        <Field htmlFor="baths" label="Bathrooms" hint="Half baths count as a half.">
          <Select
            id="baths"
            value={String(form.baths)}
            onChange={(value) => set("baths", Number(value))}
            options={BATH_OPTIONS}
          />
        </Field>

        <Field
          htmlFor="lotSqft"
          label="Lot size"
          hint={LIMITS.lotSqft.hint}
          error={errors.lotSqft}
        >
          <NumberInput
            id="lotSqft"
            unit="count"
            step={100}
            min={0}
            max={LIMITS.lotSqft.max}
            value={form.lotSqft}
            onChange={(n) => set("lotSqft", n)}
          />
        </Field>

        <Field
          htmlFor="yearBuilt"
          label="Year built"
          hint={LIMITS.yearBuilt.hint}
          error={errors.yearBuilt}
        >
          <NumberInput
            id="yearBuilt"
            unit="year"
            min={LIMITS.yearBuilt.min}
            max={LIMITS.yearBuilt.max}
            value={form.yearBuilt}
            onChange={(n) => set("yearBuilt", n)}
          />
        </Field>

        <Field
          htmlFor="assessedValueCents"
          label="Assessed value on your notice"
          hint={LIMITS.assessedValueCents.hint}
          error={errors.assessedValueCents}
        >
          <NumberInput
            id="assessedValueCents"
            unit="cents"
            step={1_000_00}
            min={LIMITS.assessedValueCents.min}
            max={LIMITS.assessedValueCents.max}
            value={form.assessedValueCents}
            onChange={(n) => set("assessedValueCents", n)}
          />
        </Field>

        <Field htmlFor="propertyClass" label="What kind of property is it?">
          <RadioGroup
            name="propertyClass"
            labelledBy="propertyClass-label"
            value={form.propertyClass}
            onChange={(value) => set("propertyClass", value as PropertyClass)}
            options={CLASS_OPTIONS}
          />
        </Field>

        <div className="sm:col-span-1 lg:col-span-2">
          <ConfidenceMeter
            filled={confirmed.size}
            total={DETAILS.length}
            missingLabel={
              confirmed.size === 0
                ? "the answer below uses the sample parcel's details until you change them"
                : "the rest still come from the sample parcel"
            }
          />
          <p className="mt-3 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            The verdict updates as you type. Nothing you enter is uploaded, logged, or stored —
            the whole calculation runs in this browser tab.
          </p>
        </div>
      </div>

      {/* M3 — the derivative, not the level. Drag it and the verdict follows. */}
      {county ? (
        <div className="hairline-all rounded-atlas max-w-xl p-4">
          <MarginalProbe
            label="Your assessed value"
            value={form.assessedValueCents}
            onChange={(n) => set("assessedValueCents", n)}
            min={100_000_00}
            max={2_000_000_00}
            step={10_000_00}
            unit="cents"
            format={usd}
            derive={(v) => ({
              delta: Math.round((10_000_00 * taxBps) / 10_000),
              per: "a year in tax",
            })}
          />
          <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            Drag it to find where your case stops being worth filing — the verdict below moves with
            it. Ratio is what decides the appeal; this is what it costs you.
          </p>
        </div>
      ) : null}

      {/* ---- The answer -------------------------------------------------- */}
      <div className="flex flex-col gap-10">
        {result === null ? (
          <ErrorState
            cause="A detail above is outside the range the comparable filters can use."
            fix="Correct the highlighted field and the verdict comes straight back — nothing is lost."
          />
        ) : "error" in result ? (
          <ErrorState
            cause={result.error}
            fix={`Widen the details — living area within ±20% of your neighbours' is the usual sticking point — or pick a different starting parcel. ${county?.countyName ?? "This county"} needs at least three usable comparables before any number is honest.`}
          />
        ) : (
          <>
            <VerdictBlock check={result.check} />

            <section aria-labelledby="comp-map-heading">
              <h2 id="comp-map-heading">The Comp Map</h2>
              <p className="mt-2 mb-4 max-w-[68ch] text-dim">
                Your parcel, drawn in the middle of the{" "}
                <span className="num text-ink">{result.check.analysis.compCount}</span> homes the
                filters kept. Green lots argue your assessment is too high; plain lots argue it is
                about right.
              </p>
              <CompMap
                check={result.check}
                neighborhood={`${SAMPLE_NEIGHBORHOOD_NAME} · synthetic demonstration data`}
              />
            </section>

            {variant === "full" ? (
              <EvidenceSummary check={result.check} />
            ) : (
              <p className="max-w-[68ch]">
                <Link href="/property/check" className="underline underline-offset-4">
                  See the comparables table and {result.check.county.countyName}&apos;s filing rules →
                </Link>
              </p>
            )}
          </>
        )}
      </div>

      <p
        className="hairline-t max-w-[68ch] pt-4 text-dim"
        style={{ fontSize: "var(--text-step--1)" }}
      >
        <span className="micro-label">Synthetic data</span>
        <br />
        {SAMPLE_DATA_LABEL} Real parcel records land county by county; the statistics are the
        production engine either way.
      </p>
    </div>
  );
}
