/**
 * M8 — copy that reacts.
 *
 * The headline sentence is generated from the computed result, not written in
 * advance, so the page describes *this* household rather than households in
 * general. Deterministic templates only: every number in the sentence comes
 * straight out of the engine, because there is no LLM anywhere near this path.
 */

import { formatUsd, type CliffAnalysis } from "@fineprint/engine-aca";

/**
 * One formatter, app-wide. The engine's own `formatUsd` truncates to whole
 * dollars; `src/lib/format.ts` rounds. Mixing them made the hero number and the
 * sentence beside it disagree by a dollar, which is exactly the kind of drift
 * this product exists to eliminate — so every figure the app prints goes
 * through the engine's formatter.
 */
const usd = formatUsd;

export interface Verdict {
  /** The one-sentence answer, ≤ 60 words, one concrete number. */
  sentence: string;
  /** The hero figure's label — it changes meaning either side of the edge. */
  heroLabel: string;
  /** True when the reader is past the edge: the flag law's trigger. */
  past: boolean;
}

export function verdict(analysis: CliffAnalysis): Verdict {
  const { cliff, ptc } = analysis;
  const past = cliff.overCliff;

  if (ptc.status === "FILING_STATUS_INELIGIBLE") {
    return {
      past: false,
      heroLabel: "Room below the 400% cliff",
      sentence:
        "Married filing separately is generally ineligible for the premium tax credit, so the cliff is not what decides your year — the filing status is. The exceptions are narrow; check them with a tax professional before you file.",
    };
  }

  if (ptc.status === "MEDICAID_REFERRAL") {
    return {
      past: false,
      heroLabel: "Room below the 400% cliff",
      sentence: `At ${ptc.fplPctForm}% of the federal poverty line your state's expanded Medicaid covers you, so no premium tax credit applies. The 400% cliff sits ${usd(
        cliff.distanceToEdge,
      )} of income above you.`,
    };
  }

  if (ptc.status === "COVERAGE_GAP") {
    return {
      past: false,
      heroLabel: "Room below the 400% cliff",
      sentence: `At ${ptc.fplPctForm}% of the federal poverty line your state has not expanded Medicaid, which leaves you in the coverage gap: too little income for a credit, too much for Medicaid. Raising income to 100% of the poverty line opens the credit.`,
    };
  }

  if (past) {
    return {
      past: true,
      heroLabel: "Over the cliff edge by",
      sentence: `You are ${usd(
        cliff.distanceToEdge,
      )} of income past the 400% edge, so your premium tax credit is $0. Cutting modified AGI by that much restores ${usd(
        cliff.creditAtStake,
      )} a year.`,
    };
  }

  return {
    past: false,
    heroLabel: "Room below the 400% cliff",
    sentence: `You are ${usd(
      cliff.distanceToEdge,
    )} of income below the cliff. One dollar past the edge costs the entire ${usd(
      cliff.creditAtStake,
    )} a year — there is no phase-out in 2026.`,
  };
}
