"use client";

import type { Cents, EngineResult } from "@fineprint/engine-paycheck";
import { formatCents } from "@/lib/paycheck/format";
import { LedgerTable } from "@fineprint/ui";
import type { LedgerRow } from "@fineprint/ui";

interface W2CheckerProps {
  result: EngineResult;
  tipsCents: Cents;
  overtimePremiumCents: Cents;
  grossOvertimePayCents: Cents;
  baseWagesCents: Cents;
}

/**
 * "Here's what your W-2 should show — and what to do if it doesn't."
 *
 * A ledger, because the reader is going to hold it beside a real form and
 * compare figures line by line. Every expected value carries its reason in the
 * row rather than in a footnote, so a mismatch is diagnosable in place.
 *
 * The exact box numbers for the 2026 dedicated tips and overtime entries are
 * pending the final IRS W-2 instructions (VERIFICATION-NEEDED.md), and the
 * rows say so rather than inventing one.
 */
export function W2Checker({
  result,
  tipsCents,
  overtimePremiumCents,
  grossOvertimePayCents,
  baseWagesCents,
}: W2CheckerProps) {
  if (tipsCents <= 0 && grossOvertimePayCents <= 0) return null;

  const box1 = baseWagesCents + tipsCents + grossOvertimePayCents;

  const rows: LedgerRow[] = [
    {
      id: "box1",
      cells: {
        field: "Box 1 — wages",
        value: formatCents(box1),
        why: "Wages + tips + full overtime pay. The deduction happens on your 1040, not on the W-2, so Box 1 is never reduced.",
      },
    },
  ];

  if (tipsCents > 0) {
    rows.push({
      id: "box7",
      cells: {
        field: "Box 7 — Social Security tips",
        value: formatCents(tipsCents),
        why: "Your reported tips. If you reported tips to your employer and Box 7 is short, the deduction gets harder to substantiate.",
      },
    });
    rows.push({
      id: "qualified-tips",
      cells: {
        field: "Qualified tips (2026 dedicated entry)",
        value: formatCents(tipsCents),
        why: "Total qualified tips with your occupation code. On 2025 forms this lives in Box 14 or is missing entirely; the 2026 box number is pending the final IRS instructions.",
      },
    });
  }

  if (grossOvertimePayCents > 0) {
    rows.push({
      id: "qualified-overtime",
      cells: {
        field: "Qualified overtime (2026 dedicated entry)",
        value: formatCents(overtimePremiumCents),
        why: (
          <>
            Only the 0.5× premium — not the{" "}
            <span className="num">{formatCents(grossOvertimePayCents)}</span> of total overtime
            pay. If your employer reported the full 1.5×, the figure is wrong.
          </>
        ),
      },
    });
  }

  return (
    <section aria-labelledby="w2-checker" className="w-full min-w-0">
      <h2 id="w2-checker">What your {result.taxYear} W-2 should show</h2>
      <p className="mt-2 text-dim" style={{ maxWidth: "var(--measure)" }}>
        From tax year {result.taxYear}, W-2s carry dedicated entries for qualified tips and
        qualified overtime, and employers face a penalty per incorrect form. Check yours
        against these figures.
      </p>

      <LedgerTable
        className="mt-3"
        caption={`Expected ${result.taxYear} W-2 entries for the figures you entered`}
        columns={[
          { id: "field", label: "W-2 field", align: "left" },
          { id: "value", label: "Should show", numeric: true },
          { id: "why", label: "Why", align: "left" },
        ]}
        rows={rows}
      />

      <p
        className="rounded-atlas mt-3 px-4 py-3 text-ink"
        style={{
          borderRadius: "var(--radius-atlas)",
          borderLeft: "2px solid var(--ink)",
          background: "var(--paper-raised)",
          fontSize: "var(--text-step--1)",
          maxWidth: "var(--measure)",
        }}
      >
        <strong>If your W-2 doesn&apos;t match.</strong> Ask your employer for a corrected W-2
        (Form W-2c) before you file — employers owe a penalty per incorrect form, so most will
        fix it. For 2025, which had no dedicated box, reconstruct the premium from your pay
        stubs (hours × regular rate × 0.5) and keep the stubs as substantiation.
      </p>
    </section>
  );
}
