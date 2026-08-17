import { Disclosure } from "@/components/ui";
import { formatDate } from "@/components/ui/format";
import { getFigureTable, type FigureTableId } from "@/lib/content/figures";
import { describeKnownGaps } from "@/lib/content/known-gaps";

/**
 * FigureTable — a whole schedule pulled from a rule file.
 *
 * The block form of `<KeyFigure>`, for figures that are a table rather than a
 * number: the RAP income brackets, the Tiered Standard terms, the applicable
 * percentage bands. Every row is generated from the rule file's own data, so
 * an article cannot carry a bracket table that has drifted from the engine's.
 *
 * The table scrolls inside its own container rather than widening the page —
 * at 375px a three-column schedule does not fit, and a body that scrolls
 * sideways is a broken page, not a wide table.
 */

export interface FigureTableProps {
  id: FigureTableId;
  /** Overrides the registry's label. */
  caption?: string;
}

export function FigureTable({ id, caption }: FigureTableProps) {
  const table = getFigureTable(id);
  const gaps = describeKnownGaps(table.knownGapIds);

  return (
    <figure className="my-6">
      <figcaption className="micro-label mb-2">{caption ?? table.label}</figcaption>

      <div className="density-instrument hairline-all rounded-atlas w-full min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="hairline-b">
              {table.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="micro-label align-bottom"
                  style={{ padding: "var(--cell-pad-y) var(--cell-pad-x)" }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.join("|")} className="hairline-b">
                {row.map((cell, index) => (
                  <td
                    key={`${String(index)}-${cell}`}
                    className={index === 0 ? "" : "num"}
                    style={{ padding: "var(--cell-pad-y) var(--cell-pad-x)" }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.note ? (
        <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          {table.note}
        </p>
      ) : null}

      <p
        className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-dim"
        style={{ fontSize: "var(--text-step--2)" }}
      >
        <span>
          Ruleset <span className="num text-ink">{table.ruleSetVersion}</span>
        </span>
        <span aria-hidden="true" className="text-rule">
          ·
        </span>
        <span>
          {table.citation.lastVerified ? (
            <>
              Verified{" "}
              <time className="num text-ink" dateTime={table.citation.lastVerified}>
                {formatDate(table.citation.lastVerified)}
              </time>
            </>
          ) : (
            "Citation not yet fetched"
          )}
        </span>
        <span aria-hidden="true" className="text-rule">
          ·
        </span>
        <a
          href={table.citation.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-atlas underline decoration-rule underline-offset-4 hover:text-ink"
        >
          {table.citation.label}
        </a>
      </p>

      {gaps.length > 0 ? (
        <div className="mt-2">
          <Disclosure compact summary="This table has an open verification item">
            <ul className="m-0 list-none space-y-3 p-0">
              {gaps.map((gap) => (
                <li key={gap.id}>
                  <p className="micro-label num">{gap.id}</p>
                  <p className="mt-1" style={{ fontSize: "var(--text-step--1)" }}>
                    {gap.gap}
                  </p>
                  <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                    What it means for this page: {gap.impact}
                  </p>
                </li>
              ))}
            </ul>
          </Disclosure>
        </div>
      ) : null}
    </figure>
  );
}
