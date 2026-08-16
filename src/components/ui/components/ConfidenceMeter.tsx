"use client";

/**
 * M1 — no gate on the answer.
 *
 * There is no Calculate button anywhere in this product. The answer renders
 * from the first keystroke and refines as inputs arrive, so the interface owes
 * the reader an honest statement of how complete their input is — without
 * blocking, nagging, or implying the answer is worthless until the form is
 * full. A partial, caveated answer always beats an empty state.
 *
 * This is NOT a decorative progress bar (07-DESIGN-SYSTEM §2 bans those). Each
 * segment stands for one real detail the engine either has or does not have.
 */

export interface ConfidenceMeterProps {
  /** How many details the engine actually has. */
  filled: number;
  /** How many it would use for an exact answer. */
  total: number;
  /** What to add next, phrased as a gain: "add your loan types for an exact answer". */
  missingLabel?: string;
  className?: string;
}

export function ConfidenceMeter({
  filled,
  total,
  missingLabel,
  className,
}: ConfidenceMeterProps) {
  if (!Number.isFinite(total) || total <= 0) return null;

  const count = Math.max(0, Math.min(Math.trunc(filled), Math.trunc(total)));
  const of = Math.trunc(total);
  const complete = count >= of;
  const noun = of === 1 ? "detail" : "details";

  return (
    <div className={className}>
      <div
        aria-hidden="true"
        className="flex w-full items-stretch gap-[2px]"
        style={{ height: "4px" }}
      >
        {Array.from({ length: of }, (_, i) => (
          <span
            key={i}
            className="min-w-[6px] flex-1 rounded-atlas"
            style={{
              backgroundColor: i < count ? "var(--ink)" : "var(--rule)",
              transition: "background-color var(--dur-fast) var(--ease)",
            }}
          />
        ))}
      </div>

      <p
        className="mt-2 text-dim"
        style={{ fontSize: "var(--text-step--1)", lineHeight: 1.35 }}
      >
        <span className="num">{count}</span> of <span className="num">{of}</span> {noun}
        {complete ? (
          <> — this answer uses everything you entered.</>
        ) : missingLabel ? (
          <> — {missingLabel}</>
        ) : (
          <> — the answer below already reflects what you have.</>
        )}
      </p>
    </div>
  );
}
