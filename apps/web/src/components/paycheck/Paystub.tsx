"use client";

import * as React from "react";
import type { DeductionResult, EngineResult } from "@fineprint/engine-paycheck";
import { formatBps, formatCents, usd } from "@/lib/paycheck/format";
import { taxAtMarginal } from "@/lib/paycheck/verdict-copy";
import { rulesMeta } from "@/lib/paycheck/rules-meta";
import { HeroNumber, TraceDisclosure } from "@fineprint/ui";
import styles from "./Paystub.module.css";

/**
 * THE PAYSTUB — the paycheck section's signature element.
 *
 * Results render as a stylised pay statement, because the audience already
 * knows how to read one: gross at the top, deductions listed beneath it, a
 * total at the foot. The product's whole argument is "here is the line your
 * employer left off your statement," so the results object should BE a
 * statement rather than a dashboard describing one.
 *
 * The annotations are the design work. Each deduction line carries:
 *   • the amount, right-aligned in the data face, decimals stacking;
 *   • a teal callout valuing it at the household's own bracket;
 *   • an amber line when the phase-out is taking some of it back —
 *     amber here means "money you're about to leave behind", never decoration,
 *     and it always travels with an icon and the words "Money left behind";
 *   • its ineligibility reason, inline, never a bare dash.
 *
 * THE ONE ORCHESTRATED MOMENT (interaction.md §4): on the FIRST results render
 * the line items settle onto the sheet in sequence over 700ms. It never fires
 * again on recalculation, where it would be noise rather than a reveal, and it
 * is skipped entirely under prefers-reduced-motion. The sheet reserves its
 * full height throughout, so the moment costs nothing in CLS.
 *
 * It lives in CSS (`Paystub.module.css`) rather than in a layout effect — see
 * the comment there for why. The upshot: no JavaScript, no flash of the
 * finished sheet before the reveal, and re-firing is impossible. It moved out
 * of the app-level globals.css in the merge: one component in one section does
 * not belong in the stylesheet all five sections share.
 */

interface PaystubProps {
  result: EngineResult;
}

export function Paystub({ result }: PaystubProps) {
  const meta = rulesMeta(result.taxYear);
  const rate = result.tax.marginalRateBps;

  return (
    <section
      aria-label="Your annotated pay statement"
      className="hairline-all rounded-atlas w-full min-w-0"
      style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper)" }}
    >
      <header
        className="hairline-b flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2"
        style={{ background: "var(--paper-raised)" }}
      >
        <span className="micro-label">Annotated pay statement</span>
        <span className="micro-label num">Tax year {result.taxYear}</span>
      </header>

      <div className="density-instrument px-4 py-4">
        {/* ---- gross ------------------------------------------------------ */}
        <div
          className="flex items-baseline justify-between gap-4 pb-2"
          style={{ borderBottom: "2px solid var(--ink)" }}
        >
          <span style={{ fontWeight: 600, fontSize: "var(--text-step-0)" }}>
            Gross income (MAGI)
          </span>
          <span className="num num-cell" style={{ fontWeight: 500, fontSize: "var(--text-step-0)" }}>
            {formatCents(result.magiCents)}
          </span>
        </div>
        <p className="mt-1 text-dim">
          Wages + tips + gross overtime + other income. The deductions below never reduce it —
          which is why one raise can shrink several at once.
        </p>

        {/* ---- the deduction lines ---------------------------------------- */}
        <p className="micro-label mt-4">
          OBBBA deductions — claimed on your 1040, even without itemising
        </p>
        <ol className="mt-1 list-none p-0">
          {result.deductions.map((deduction, index) => (
            <li
              key={deduction.id}
              className={`${styles.settle} hairline-b py-2 last:border-b-0`}
              style={{ "--settle-index": index } as React.CSSProperties}
            >
              <DeductionLine deduction={deduction} marginalRateBps={rate} meta={meta} />
            </li>
          ))}
        </ol>

        {/* ---- total ------------------------------------------------------ */}
        <div
          className="mt-2 flex items-baseline justify-between gap-4 pt-2"
          style={{ borderTop: "2px solid var(--ink)" }}
        >
          <span style={{ fontWeight: 600, fontSize: "var(--text-step-0)" }}>
            Total OBBBA deductions
          </span>
          <span className="num num-cell" style={{ fontWeight: 500, fontSize: "var(--text-step-0)" }}>
            {formatCents(result.totalDeductionCents)}
          </span>
        </div>

        {/* ---- the one hero number, in the signature element --------------- */}
        <div
          className="rounded-atlas mt-4 px-4 py-3"
          style={{
            borderRadius: "var(--radius-atlas)",
            borderLeft: "2px solid var(--signal)",
            background: "color-mix(in srgb, var(--signal) 6%, var(--paper))",
          }}
        >
          <HeroNumber
            id="tax-saved"
            label="Estimated federal tax saved"
            value={result.tax.estimatedTaxSavedCents}
            format={usd}
            tween
            footnote={
              <TraceDisclosure
                summaryLabel="How the federal tax saved was calculated"
                formula="tax(MAGI − standard deduction) − tax(MAGI − standard deduction − OBBBA deductions)"
                inputs={[
                  { label: "MAGI", value: formatCents(result.magiCents) },
                  {
                    label: "Standard deduction",
                    value: formatCents(result.tax.standardDeductionCents),
                  },
                  { label: "Taxable before", value: formatCents(result.tax.taxableBeforeCents) },
                  { label: "Tax before", value: formatCents(result.tax.taxBeforeCents) },
                  { label: "OBBBA deductions", value: formatCents(result.totalDeductionCents) },
                  { label: "Taxable after", value: formatCents(result.tax.taxableAfterCents) },
                  { label: "Tax after", value: formatCents(result.tax.taxAfterCents) },
                  { label: "Marginal bracket", value: formatBps(rate) },
                ]}
                ruleVersion={meta.shortVersion}
                citation={{
                  label: "Bracket table and standard deduction — 2026 rule file",
                  url: "/paycheck/methodology",
                  lastVerified: meta.lastVerified,
                }}
              />
            }
          />
          <p className="mt-1 text-dim" style={{ maxWidth: "var(--measure)" }}>
            Exact bracket-table math, not deduction × rate. A deduction lowers taxable income;
            it is not a refund.
          </p>
        </div>

        <p className="hairline-t mt-4 pt-3 text-dim" style={{ maxWidth: "var(--measure)" }}>
          {result.ficaNote}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

function DeductionLine({
  deduction,
  marginalRateBps,
  meta,
}: {
  deduction: DeductionResult;
  marginalRateBps: number;
  meta: ReturnType<typeof rulesMeta>;
}) {
  const paying = deduction.claimed && deduction.eligible && deduction.deductionCents > 0;
  const saved = paying ? taxAtMarginal(deduction.deductionCents, marginalRateBps) : 0;
  const reduction = deduction.phaseOut?.reductionCents ?? 0;
  /**
   * A line that qualifies but lands on zero. Without this it renders as a bare
   * dash and the reader is left to guess whether they failed a condition or
   * simply earn too much — and the answer is worth a warning, not a shrug.
   */
  const phasedToZero =
    deduction.claimed && deduction.eligible && deduction.deductionCents === 0 && reduction > 0;
  /**
   * Only a line that actually reached its cap is capped. An INELIGIBLE line has
   * cappedAmountCents === 0, which the naive `capped < qualified` test read as
   * "capped" and reported "$3,200 qualified, capped at $10,000" over a
   * used-vehicle loan that qualifies for nothing at all.
   */
  const capped =
    deduction.claimed &&
    deduction.eligible &&
    deduction.qualifiedAmountCents > deduction.capCents;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <span
          className={deduction.claimed ? "text-ink" : "text-dim"}
          style={{ fontSize: "var(--text-step-0)" }}
        >
          {deduction.label}
        </span>
        <span
          className={`num num-cell ${paying ? "text-ink" : "text-dim"}`}
          style={{ fontSize: "var(--text-step-0)" }}
        >
          {paying ? formatCents(deduction.deductionCents) : "—"}
          {!deduction.claimed ? <span className="sr-only"> not entered</span> : null}
        </span>
      </div>

      {/* the annotation this whole product exists to add */}
      {paying ? (
        <p className="mt-1 flex items-baseline gap-1.5 text-signal">
          <TurnMark />
          <span>
            worth <span className="num">{usd(saved)}</span> of federal tax at your{" "}
            <span className="num">{formatBps(marginalRateBps)}</span> bracket
          </span>
        </p>
      ) : null}

      {phasedToZero ? (
        <p className="mt-1 flex items-baseline gap-1.5 text-flag" style={{ fontWeight: 500 }}>
          <LeakMark />
          <span>
            <span className="micro-label text-flag">Money left behind</span> fully phased out —
            the <span className="num">{formatCents(deduction.cappedAmountCents)}</span> you
            qualified for is gone at a MAGI{" "}
            <span className="num">{usd(deduction.phaseOut?.excessCents ?? 0)}</span> over the{" "}
            <span className="num">{usd(deduction.phaseOut?.thresholdCents ?? 0)}</span> threshold
          </span>
        </p>
      ) : null}

      {paying && reduction > 0 ? (
        <p className="mt-1 flex items-baseline gap-1.5 text-flag" style={{ fontWeight: 500 }}>
          <LeakMark />
          <span>
            <span className="micro-label text-flag">Money left behind</span>{" "}
            <span className="num">−{usd(reduction)}</span> to the phase-out — your MAGI is{" "}
            <span className="num">{usd(deduction.phaseOut?.excessCents ?? 0)}</span> over the{" "}
            <span className="num">{usd(deduction.phaseOut?.thresholdCents ?? 0)}</span> threshold
          </span>
        </p>
      ) : null}

      {capped ? (
        <p className="mt-1 text-dim">
          <span className="num">{formatCents(deduction.qualifiedAmountCents)}</span> qualified,
          capped at <span className="num">{formatCents(deduction.capCents)}</span>.
        </p>
      ) : null}

      {deduction.claimed && !deduction.eligible
        ? deduction.reasons.map((reason) => (
            <p key={reason} className="mt-1 text-dim">
              {reason}
            </p>
          ))
        : null}

      {deduction.claimed ? (
        <TraceDisclosure
          className="mt-1"
          compact
          summaryLabel={`How the ${deduction.label.toLowerCase()} figure was calculated`}
          formula="min(qualified amount, cap) − phase-out reduction"
          inputs={[
            { label: "Qualified amount", value: formatCents(deduction.qualifiedAmountCents) },
            { label: "Statutory cap", value: formatCents(deduction.capCents) },
            { label: "After cap", value: formatCents(deduction.cappedAmountCents) },
            {
              label: "Phase-out threshold",
              value: deduction.phaseOut ? formatCents(deduction.phaseOut.thresholdCents) : "none",
            },
            {
              label: "Phase-out reduction",
              value: deduction.phaseOut ? `−${formatCents(reduction)}` : "—",
            },
            { label: "Deduction", value: formatCents(deduction.deductionCents) },
          ]}
          ruleVersion={meta.shortVersion}
          citation={{
            label: deduction.citations[0]?.label ?? "Rule file",
            url: deduction.citations[0]?.url ?? "/paycheck/sources",
            lastVerified: deduction.citations[0]?.lastVerified ?? meta.lastVerified,
          }}
        />
      ) : null}
    </>
  );
}

/** An annotator's turn-arrow: "and this line is worth…". */
function TurnMark() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none", transform: "translateY(1px)" }}
    >
      <path d="M2 1.5v6h7" />
      <path d="M6.6 5.1 9 7.5l-2.4 2.4" />
    </svg>
  );
}

/** A dollar draining out — the amber mark. Never used decoratively. */
function LeakMark() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none", transform: "translateY(1px)" }}
    >
      <path d="M6 1v6.4" />
      <path d="M3.6 5.2 6 7.6l2.4-2.4" />
      <path d="M1.5 10.5h9" />
    </svg>
  );
}
