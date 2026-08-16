"use client";

import { filingFeeBandFor, type AssessmentCheck } from "@fineprint/engine-property";
import {
  FactTable,
  LastVerified,
  LedgerTable,
  TraceDisclosure,
  type LedgerColumn,
  type LedgerRow,
} from "@fineprint/ui";
import { formatCents, formatDateLong, formatNumber, formatPct } from "@/lib/property/format";

/**
 * The evidence summary — the free tier of the appeal packet.
 *
 * The comparables ledger is the object the whole product rests on: a hearing
 * officer should be able to read it, re-run the arithmetic, and reach the same
 * number. Every row carries its own trace (compact, because nine full-width
 * "how this was calculated" bars would shout over the figures they explain).
 *
 * Below it, the county's own rules — deadline, fee, forms, levels, evidence
 * standard — straight from the versioned rules JSON, cited.
 */
export function EvidenceSummary({ check }: { check: AssessmentCheck }) {
  const { analysis, county, deadline, subject, verdict } = check;
  const isMarket = analysis.argumentType === "MARKET_VALUE";
  // The fee is banded by assessed value in some counties, so it is read for
  // THIS home rather than quoted off the county's flat field.
  const feeCents = verdict.filingFeeCents;
  const feeBand = filingFeeBandFor(county, subject.assessedValueCents);

  const columns: LedgerColumn[] = [
    { id: "address", label: "Address", align: "left" },
    { id: "sqft", label: "Sqft", numeric: true },
    { id: "built", label: "Built", numeric: true },
    ...(isMarket
      ? [
          { id: "sale", label: "Sale price", numeric: true },
          { id: "saleDate", label: "Sold", align: "left" as const },
        ]
      : []),
    { id: "assessed", label: "Assessed", numeric: true },
    { id: "ratio", label: isMarket ? "Ratio" : "Per sqft", numeric: true },
    { id: "reads", label: "Which way it argues", align: "left" },
  ];

  const rows: LedgerRow[] = analysis.comps.map((comp, i) => ({
    id: comp.property.id,
    cells: {
      address: comp.property.address,
      sqft: formatNumber(comp.property.sqft),
      built: String(comp.property.yearBuilt),
      ...(isMarket
        ? {
            sale:
              comp.property.lastSalePriceCents !== undefined
                ? formatCents(comp.property.lastSalePriceCents)
                : undefined,
            saleDate: comp.property.lastSaleDate ? (
              <span className="num">{formatDateLong(comp.property.lastSaleDate)}</span>
            ) : undefined,
          }
        : {}),
      assessed: formatCents(comp.property.assessedValueCents),
      ratio: isMarket
        ? comp.ratio.toFixed(3)
        : formatCents(Math.round(comp.ratio)),
      reads: (
        <span className={comp.supportsCase ? "text-signal" : "text-dim"}>
          <span aria-hidden="true">{comp.supportsCase ? "↓ " : "↑ "}</span>
          {comp.supportsCase ? "argues for you" : "argues against"}
        </span>
      ),
    },
    trace: (
      <TraceDisclosure
        compact
        summaryLabel={`How lot ${i + 1}, ${comp.property.address}, was compared`}
        formula={
          isMarket
            ? "ratio = assessed value ÷ recent sale price"
            : "ratio = assessed value ÷ living area"
        }
        inputs={[
          { label: "Assessed value", value: formatCents(comp.property.assessedValueCents) },
          isMarket
            ? {
                label: "Sale price",
                value:
                  comp.property.lastSalePriceCents !== undefined
                    ? formatCents(comp.property.lastSalePriceCents)
                    : "—",
              }
            : { label: "Living area", value: `${formatNumber(comp.property.sqft)} sqft` },
          { label: "Ratio", value: isMarket ? comp.ratio.toFixed(4) : formatCents(Math.round(comp.ratio)) },
          {
            label: "Your ratio",
            value: isMarket
              ? analysis.subjectRatio.toFixed(4)
              : formatCents(Math.round(analysis.subjectRatio)),
          },
          { label: "Evidence age", value: `${formatNumber(comp.dataAgeDays)} days` },
        ]}
        ruleVersion={check.meta.ruleSetVersion}
        citation={{
          label: county.citations[0]?.label ?? county.appealBody,
          url: county.citations[0]?.url ?? "/property/sources",
          lastVerified: county.citations[0]?.lastVerified ?? check.meta.asOfDate,
        }}
      />
    ),
  }));

  return (
    <section aria-labelledby="evidence-heading" className="flex flex-col gap-8">
      <div>
        <h2 id="evidence-heading">Your evidence, ready to attach</h2>
        <p className="mt-2 max-w-[68ch] text-dim">
          These are the {formatNumber(analysis.compCount)} homes the filters kept and the arithmetic
          that follows from them. Print this table and it is the comparables exhibit the{" "}
          {county.appealBody} expects. Open any row to see exactly how its ratio was worked out.
        </p>
      </div>

      <div>
        <p className="mb-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Your home: <span className="num text-ink">{formatNumber(subject.sqft)}</span> sqft, built{" "}
          <span className="num text-ink">{subject.yearBuilt}</span>, assessed{" "}
          <span className="num text-ink">{formatCents(subject.assessedValueCents)}</span> —{" "}
          <span className="num text-ink">
            {isMarket
              ? analysis.subjectRatio.toFixed(3)
              : `${formatCents(Math.round(analysis.subjectRatio))}/sqft`}
          </span>
          . A comparable below that figure argues your assessment is too high.
        </p>
        <LedgerTable
          columns={columns}
          rows={rows}
          caption={`The ${analysis.compCount} comparable homes behind your result, with each one's assessment ratio and which way it argues.`}
        />
      </div>

      <div>
        <h3>What filing in {county.countyName} involves</h3>
        <FactTable
          className="mt-2"
          caption={`Key facts for appealing an assessment in ${county.countyName}`}
          rows={[
            { key: "Where you file", value: county.appealBody, mono: false },
            {
              key: "Deadline",
              value:
                deadline.isoDate !== null && deadline.daysAway !== null
                  ? `${formatDateLong(deadline.isoDate)} — ${formatNumber(deadline.daysAway)} days away`
                  : deadline.ruleText.split(" [")[0],
              mono: deadline.isoDate !== null,
            },
            ...(deadline.filingCutoff === "RECEIVED_BY"
              ? [
                  {
                    key: "What meets the deadline",
                    value: "Delivery, not a postmark — it must arrive by that date",
                    mono: false,
                  },
                ]
              : []),
            {
              key: "Filing fee for your home",
              value:
                feeCents === 0
                  ? "No fee"
                  : feeBand !== undefined
                    ? `${formatCents(feeCents)} (${feeBand.label})`
                    : formatCents(feeCents),
              mono: feeCents !== 0,
            },
            {
              key: "Forms",
              value: (
                <span className="flex flex-col items-end gap-1 text-right">
                  {county.forms.map((form) => (
                    <a
                      key={form.id}
                      href={form.pdfUrl}
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      {form.name}
                    </a>
                  ))}
                </span>
              ),
              mono: false,
            },
            {
              key: "Levels, in order",
              value: county.levels.join(" → "),
              mono: false,
            },
            {
              key: "What evidence works",
              value: county.evidenceStandard.split(" [")[0],
              mono: false,
            },
            {
              key: "Dispersion of your comparables",
              value: `${formatPct(analysis.cod)} (COD)`,
            },
          ]}
        />
        <p className="mt-3 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          {feeCents === 0
            ? `${county.countyName} charges nothing to file.`
            : `Your fee is ${formatCents(feeCents)}. ${county.filingFee.waiverConditions.split(" [")[0]}`}
        </p>
      </div>

      <div className="hairline-t pt-4">
        <LastVerified
          date={county.citations[0]?.lastVerified ?? check.meta.asOfDate}
          ruleSetVersion={county.ruleSetVersion}
          citation={{
            label: county.citations[0]?.label ?? county.appealBody,
            url: county.citations[0]?.url ?? "/property/sources",
          }}
        />
        <p className="mt-2 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Fineprint prepares the evidence for an appeal you file yourself — assistance, not legal
          representation, and not an appraisal. Confirm the deadline and the current fee with the{" "}
          {county.appealBody} before you file.
        </p>
      </div>
    </section>
  );
}
