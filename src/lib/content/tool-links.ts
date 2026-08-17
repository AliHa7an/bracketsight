/**
 * Deep links from an article into the tool it explains.
 *
 * An article that works a numbered example and then says "try the calculator"
 * makes the reader type the example back in. The link should arrive at the
 * tool with that example already loaded — same numbers, same answer, no
 * retyping — because the reader's next question is always "what about my
 * numbers", and they get there by editing a filled form, not by filling an
 * empty one.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * NO PARAMETER SCHEME IS INVENTED HERE.
 *
 * The loans calculator already has a scenario transport: `encodeScenario` in
 * `src/lib/loans/url-state.ts`, a versioned positional-tuple encoding read
 * back by `CalculatorApp` from the URL fragment. This module calls that
 * encoder. It does not build its own query string, does not mirror the field
 * names, and will keep working when the tuple layout changes, because the same
 * function writes and reads it.
 *
 * The other four tools have no URL transport at all. Paycheck, ACA, property
 * and trades seed themselves from plausible defaults and persist to
 * `localStorage`; not one of them reads a search parameter. So `toolHref`
 * returns a plain route for those, and an article links to the tool rather
 * than into a pre-filled state.
 *
 * That asymmetry is deliberate and is not worked around. Inventing
 * `/aca?magi=48000&size=3` here would create a contract the ACA planner does
 * not implement: the link would look pre-filled, load the default household,
 * and quietly show the reader an answer for somebody else's numbers. A link
 * that does less is not a defect; a link that lies is. When a section adds a
 * transport, add a builder here that calls it.
 * ────────────────────────────────────────────────────────────────────────────
 */

import {
  defaultFormValues,
  formSchema,
  type FormValues,
  type LoanFormValues,
} from "@/lib/loans/schema";
import { decodeScenario, encodeScenario } from "@/lib/loans/url-state";
import type { SectionSlug } from "@/lib/site";

/** A tool's own page. The link an article uses when there is nothing to pre-fill. */
export function toolHref(tool: SectionSlug): string {
  return `/${tool}`;
}

/** Which tools can receive a pre-filled scenario today. */
export function toolAcceptsPrefill(tool: SectionSlug): boolean {
  return tool === "loans";
}

/* ─────────────────────────────────────────────────────────────────── loans ── */

/** One loan in an article's worked example. Flags default to false. */
export interface LoansPrefillLoan {
  readonly type: LoanFormValues["type"];
  readonly balanceDollars: number;
  readonly ratePct: number;
  /** ISO date. The engine's eligibility tests turn on it, so it is required. */
  readonly firstDisbursement: string;
  readonly isConsolidation?: boolean;
  readonly underlyingHadParentPlus?: boolean;
  readonly repaidUnderIdrInWindow?: boolean;
}

export interface LoansPrefill {
  readonly loans: readonly LoansPrefillLoan[];
  readonly household: Partial<FormValues["household"]>;
  readonly goals?: Partial<FormValues["goals"]>;
}

/**
 * Builds the full form value an article's example describes, filling anything
 * unstated from the calculator's own defaults — so a scenario cannot end up
 * half-formed because an article did not mention family size.
 *
 * Loan ids are positional (`loan-1`), never `Date.now()`: the same example must
 * always produce the same URL, or two builds emit two different links to the
 * same article's example.
 */
function toFormValues(prefill: LoansPrefill): FormValues {
  return {
    loans: prefill.loans.map((loan, index) => ({
      id: `loan-${String(index + 1)}`,
      type: loan.type,
      balanceDollars: loan.balanceDollars,
      ratePct: loan.ratePct,
      firstDisbursement: loan.firstDisbursement,
      isConsolidation: loan.isConsolidation ?? false,
      underlyingHadParentPlus: loan.underlyingHadParentPlus ?? false,
      repaidUnderIdrInWindow: loan.repaidUnderIdrInWindow ?? false,
    })),
    household: { ...defaultFormValues.household, ...prefill.household },
    goals: { ...defaultFormValues.goals, ...prefill.goals },
  };
}

/**
 * `/loans#s=<token>` — the loans calculator, holding the article's example.
 *
 * The fragment, not the query string, because that is what `CalculatorApp`
 * writes when a reader shares a scenario and what it reads first on load. It
 * also means the example never reaches a server log, which matters on a site
 * whose privacy claim is that nothing a visitor enters leaves the browser.
 *
 * Two build-time assertions, because a bad CTA is silent at runtime:
 *   • the scenario validates against the calculator's own `formSchema`, so an
 *     article cannot ship an example the tool would reject;
 *   • the token round-trips through `decodeScenario`, so an encoder change
 *     that this module has not kept up with fails the build rather than
 *     landing readers on an empty form.
 */
export function loansScenarioHref(prefill: LoansPrefill, context = "an article"): string {
  const values = toFormValues(prefill);

  const parsed = formSchema.safeParse(values);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `The loans worked example in ${context} is not a valid scenario:\n${issues}\n` +
        `Fix the example — do not link readers into a form the calculator will reject.`,
    );
  }

  const token = encodeScenario(values);
  if (!decodeScenario(token)) {
    throw new Error(
      `The loans scenario token for ${context} does not decode. ` +
        `src/lib/loans/url-state.ts changed shape — update this module rather than hand-rolling a link.`,
    );
  }

  return `/loans#s=${token}`;
}
