"use client";

/**
 * The levers, ranked — the product, as a ledger.
 *
 * Every legal MAGI-reduction lever ordered by cents of premium tax credit
 * recovered per dollar committed, using this household's *remaining* room in
 * each. The recommended row carries the signal wash; a lever the household
 * cannot use is greyed and states why inline, because a bare "not eligible"
 * makes the reader do the guessing this product exists to stop.
 *
 * Income timing is never ranked and never given an amount. It is a
 * professional conversation, not a computed move, and it sits below the table
 * saying so.
 */

import { formatUsd, type CliffAnalysis, type LeverResult } from "@/engines/aca";
import {
  LedgerTable,
  type LedgerRow,
  TraceDisclosure,
} from "@/components/ui";
import { numerify } from "@/lib/aca/numerify";

const CITATION = {
  label: "IRS Publication 969, 590-A and the §36B regulations",
  url: "https://www.irs.gov/instructions/i8962",
  lastVerified: "2026-08-08",
};

export function LeverList({ analysis }: { analysis: CliffAnalysis }) {
  const ranked = analysis.levers.filter((l) => !l.advisoryOnly);
  const advisory = analysis.levers.filter((l) => l.advisoryOnly);
  const best = ranked.find((l) => l.eligible && l.creditRecovered > 0);

  const rows: LedgerRow[] = ranked.map((lever) => {
    if (!lever.eligible) {
      return {
        id: lever.id,
        cells: { lever: lever.label },
        disabled: true,
        disabledReason: lever.ineligibilityReasons.join(" ") || "No remaining room this year.",
      };
    }
    return {
      id: lever.id,
      winner: lever.id === best?.id,
      cells: {
        lever: lever.label,
        room: formatUsd(lever.maxAvailable),
        recovers: formatUsd(lever.creditRecovered),
        rate:
          lever.recoveredPerDollarBps === null || lever.creditRecovered === 0
            ? "—"
            : `${(lever.recoveredPerDollarBps / 100).toFixed(0)}¢`,
        after: `${lever.fplPctFormAfter}%`,
        clears:
          lever.amountToClearCliff !== null
            ? formatUsd(lever.amountToClearCliff)
            : analysis.cliff.overCliff
              ? "not alone"
              : "—",
      },
      trace: <LeverTrace analysis={analysis} lever={lever} />,
    };
  });

  return (
    <section aria-labelledby="levers-heading" className="mt-12">
      <h2 id="levers-heading">Your levers, ranked</h2>
      <p className="mt-1 max-w-[var(--measure)] text-dim">
        Ordered by cents of premium tax credit recovered per dollar committed, using the room
        you have left in each. Estimates under 2026 rules — confirm any move with a tax
        professional before you make it.
      </p>

      <LedgerTable
        className="mt-4"
        caption="Legal MAGI-reduction levers, ranked by credit recovered per dollar committed"
        columns={[
          { id: "lever", label: "Lever", align: "left" },
          { id: "room", label: "Room left", numeric: true },
          { id: "recovers", label: "Recovers", numeric: true },
          { id: "rate", label: "Back per $1", numeric: true },
          { id: "after", label: "FPL after", numeric: true },
          { id: "clears", label: "Clears the cliff with", numeric: true },
        ]}
        rows={rows}
      />

      {best ? (
        <p className="mt-3 max-w-[var(--measure)]">{numerify(best.sentence)}</p>
      ) : (
        <p className="mt-3 max-w-[var(--measure)] text-dim">
          No lever recovers credit at this income. That is the answer, not a gap: either you
          are already below the edge with the credit intact, or every account is closed to you
          this year.
        </p>
      )}

      {advisory.map((lever) => (
        <p
          key={lever.id}
          className="mt-4 max-w-[var(--measure)] text-dim"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <span className="font-medium text-ink">{lever.label}.</span> {numerify(lever.sentence)}
        </p>
      ))}
    </section>
  );
}

function LeverTrace({ analysis, lever }: { analysis: CliffAnalysis; lever: LeverResult }) {
  return (
    <div>
      <TraceDisclosure
        summaryLabel={`How the ${lever.label} figures were calculated`}
        formula="creditRecovered = PTC(MAGI − contribution) − PTC(MAGI)"
        inputs={[
          { label: "Modified AGI now", value: formatUsd(analysis.magi.magi) },
          { label: "Contribution modelled", value: formatUsd(lever.modeledAmount) },
          { label: "Modified AGI after", value: formatUsd(lever.magiAfter) },
          { label: "Credit before", value: formatUsd(lever.ptcBefore) },
          { label: "Credit after", value: formatUsd(lever.ptcAfter) },
          { label: "Position after", value: `${lever.fplPctFormAfter}%` },
        ]}
        ruleVersion={analysis.meta.ruleSetVersion}
        citation={CITATION}
      />
      {lever.warnings.length > 0 ? (
        <ul className="mt-3 space-y-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          {lever.warnings.map((w) => (
            <li key={w}>{numerify(w)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export type { LeverResult };
