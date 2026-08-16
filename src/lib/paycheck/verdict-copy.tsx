import type * as React from "react";
import { mulBps } from "@/engines/paycheck";
import type { Cents, DeductionResult, EngineResult } from "@/engines/paycheck";
import { formatCents, usd } from "@/lib/paycheck/format";

/**
 * M8 — copy that reacts.
 *
 * Not a component: a deterministic template function. The headline sentence
 * describes THIS household's result and rewrites as inputs change, but every
 * number in it comes straight off engine output. No LLM anywhere near this
 * path — the figures have to be engine-exact, and a sentence is exactly where
 * an approximation would go unnoticed.
 */

/**
 * The per-line "federal tax saved" annotation on the paystub.
 *
 * This is the deduction valued at the household's marginal bracket. It is an
 * ANNOTATION, not the headline: the headline saving (`estimatedTaxSavedCents`)
 * is exact bracket-table math, so the four line annotations will not always
 * sum to it — a deduction that straddles a bracket boundary is worth less than
 * its top rate on the part below the line. The paystub says "at your X%
 * bracket" on every line so the approximation is stated, never implied.
 */
export function taxAtMarginal(deductionCents: Cents, marginalRateBps: number): Cents {
  if (deductionCents <= 0) return 0;
  return mulBps(deductionCents, marginalRateBps);
}

/** Deductions the household actually entered inputs for. */
export function claimedDeductions(result: EngineResult): DeductionResult[] {
  return result.deductions.filter((d) => d.claimed);
}

/** Deductions being actively reduced by the shared MAGI phase-out. */
export function phasedOutDeductions(result: EngineResult): DeductionResult[] {
  return result.deductions.filter(
    (d) => d.claimed && d.eligible && d.phaseOut !== null && d.phaseOut.reductionCents > 0,
  );
}

/** Total dollars of deduction the phase-out is currently taking. */
export function phaseOutLossCents(result: EngineResult): Cents {
  return phasedOutDeductions(result).reduce(
    (sum, d) => sum + (d.phaseOut?.reductionCents ?? 0),
    0,
  );
}

/**
 * The one-sentence verdict above the paystub. Present tense, this household's
 * own figures, one qualifier maximum. Returns nodes rather than a string so
 * every figure inside it sets in the data face — a number in prose is still a
 * number.
 */
export function verdictSentence(result: EngineResult): React.ReactNode {
  const saved = result.tax.estimatedTaxSavedCents;
  const total = result.totalDeductionCents;
  const claimed = claimedDeductions(result);
  const eligible = claimed.filter((d) => d.eligible && d.deductionCents > 0);

  if (claimed.length === 0) {
    return "Enter tips, overtime, a vehicle loan, or an age of 65 or over, and the statement below fills in as you type.";
  }

  if (eligible.length === 0) {
    return (
      <>
        Nothing you entered qualifies yet, so your <N>{result.taxYear}</N> federal tax is
        unchanged. The lines below say which condition each deduction is failing.
      </>
    );
  }

  const one = eligible.length === 1;
  const lost = phaseOutLossCents(result);

  return (
    <>
      Your <N>{eligible.length}</N> OBBBA {one ? "deduction totals" : "deductions total"}{" "}
      <N>{formatCents(total)}</N> and {one ? "cuts" : "cut"} your <N>{result.taxYear}</N>{" "}
      federal tax by <N>{usd(saved)}</N>.{" "}
      {lost > 0 ? (
        <>
          The phase-out is already taking <N>{usd(lost)}</N> of that back.
        </>
      ) : (
        <>Every dollar of it survives the phase-out at your MAGI.</>
      )}
    </>
  );
}

/** Every figure in the data face, even mid-sentence. */
function N({ children }: { children: React.ReactNode }) {
  return <span className="num">{children}</span>;
}

/**
 * Input completeness for <ConfidenceMeter> (M1). Never blocks — it states what
 * the engine has, phrased as a gain.
 */
export function completeness(result: EngineResult): {
  filled: number;
  total: number;
  missingLabel?: string;
} {
  const total = 5;
  const claimed = claimedDeductions(result);
  let filled = 1; // filing status and income always have a value

  if (result.magiCents > 0) filled += 1;
  if (claimed.length > 0) filled += 1;
  if (claimed.length > 1) filled += 1;
  if (claimed.every((d) => d.eligible)) filled += 1;

  const failing = claimed.find((d) => !d.eligible);
  if (failing) {
    return {
      filled,
      total,
      missingLabel: `fix the ${failing.label.toLowerCase()} conditions below for an exact answer`,
    };
  }
  if (claimed.length === 0) {
    return { filled, total, missingLabel: "add tips or overtime to see a deduction" };
  }
  if (claimed.length === 1) {
    return { filled, total, missingLabel: "add your other deductions to see them interact" };
  }
  return { filled, total };
}
