/**
 * packages/engine/src/eligibility.ts
 *
 * Per-plan eligibility predicates. Reasons are plain English and
 * user-facing — they appear inline in the results table.
 *
 * v1 policy: a plan is eligible only if EVERY entered loan can use it
 * (all-or-nothing). Real borrowers can sometimes split plans per loan;
 * that nuance is documented in /methodology and deferred.
 */

import type { Loan, PlanId } from "./types";
import type { ResolvedRules } from "./rules/index";

export interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
}

const OK: EligibilityCheck = { eligible: true, reasons: [] };

function fail(reasons: string[]): EligibilityCheck {
  return { eligible: false, reasons };
}

/** Direct Parent PLUS, or a consolidation that repaid one (the taint). */
export function hasParentPlusExposure(loans: Loan[]): boolean {
  return loans.some(
    (l) =>
      l.type === "DIRECT_PARENT_PLUS" ||
      (l.isConsolidation && l.underlyingHadParentPlus === true),
  );
}

/** A consolidation loan that repaid a Parent PLUS loan. */
export function isTaintedConsolidation(loan: Loan): boolean {
  return loan.isConsolidation && loan.underlyingHadParentPlus === true;
}

/**
 * Does the § 685.209(b)(6)(ii) carve-out rescue this loan's RAP eligibility?
 *
 * A tainted consolidation is an "excepted consolidation loan" — permanently
 * barred from RAP — UNLESS it "was being repaid under the ICR, PAYE, or IBR
 * plans on any date on or after July 4, 2025, through and including June 30,
 * 2028". The borrower asserts that condition on the loan; the window dates
 * themselves live in rules/rap.*.json.
 *
 * Note this carve-out is RAP-specific. It does not open IBR or PAYE to a
 * Parent PLUS consolidation — that bar comes from HEA § 493C, not from the
 * excepted-consolidation-loan definition, so `hasParentPlusExposure` is
 * deliberately left untouched by it.
 */
export function taintExceptionApplies(loan: Loan, rules: ResolvedRules): boolean {
  const exception = rules.rap.parentPlusConsolidationTaintException;
  return (
    exception.enabled === true &&
    isTaintedConsolidation(loan) &&
    loan.repaidUnderIdrInWindow === true
  );
}

export function hasLegacyLoans(loans: Loan[]): boolean {
  return loans.some((l) => l.type === "FFEL" || l.type === "PERKINS" || l.type === "HEAL");
}

export function anyLoanOnOrAfter(loans: Loan[], iso: string): boolean {
  return loans.some((l) => l.firstDisbursement >= iso);
}

export function earliestDisbursement(loans: Loan[]): string | null {
  if (loans.length === 0) return null;
  return loans.map((l) => l.firstDisbursement).sort()[0] ?? null;
}

function post2026Reason(): string {
  return "Loans first disbursed on or after 1 Jul 2026 can only use RAP or the Tiered Standard plan under P.L. 119-21.";
}

function idrLegacyReasons(loans: Loan[]): string[] {
  const reasons: string[] = [];
  if (loans.some((l) => l.type === "PERKINS")) {
    reasons.push(
      "Perkins loans must be consolidated into a Direct Consolidation Loan before they can use an income-driven plan.",
    );
  }
  if (loans.some((l) => l.type === "HEAL")) {
    reasons.push("HEAL loans are not eligible for income-driven repayment plans.");
  }
  return reasons;
}

export function checkRap(loans: Loan[], rules: ResolvedRules): EligibilityCheck {
  const reasons: string[] = [];
  const r = rules.rap;
  if (loans.some((l) => l.type === "DIRECT_PARENT_PLUS")) {
    reasons.push("Parent PLUS loans are not eligible for RAP.");
  }
  // A tainted consolidation is barred unless the § 685.209(b)(6)(ii) carve-out
  // applies to it. All-or-nothing per v1 policy: one un-rescued tainted loan
  // shuts RAP for the whole mix.
  if (
    r.parentPlusConsolidationTaint &&
    loans.some((l) => isTaintedConsolidation(l) && !taintExceptionApplies(l, rules))
  ) {
    reasons.push(
      "A consolidation that repaid a Parent PLUS loan is not eligible for RAP — even after consolidation.",
    );
  }
  for (const t of ["FFEL", "PERKINS", "HEAL"] as const) {
    if (loans.some((l) => l.type === t)) {
      reasons.push(`${t} loans cannot use RAP.`);
    }
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

export function checkIbrOld(loans: Loan[], rules: ResolvedRules): EligibilityCheck {
  const reasons: string[] = [...idrLegacyReasons(loans)];
  if (hasParentPlusExposure(loans)) {
    reasons.push(
      "Parent PLUS loans (and consolidations that repaid one) are not eligible for IBR.",
    );
  }
  if (anyLoanOnOrAfter(loans, rules.planTerms.post2026RestrictionDate)) {
    reasons.push(post2026Reason());
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

export function checkIbrNew(loans: Loan[], rules: ResolvedRules): EligibilityCheck {
  const base = checkIbrOld(loans, rules);
  const reasons = [...base.reasons];
  const earliest = earliestDisbursement(loans);
  if (earliest !== null && earliest < rules.planTerms.ibrNew.firstLoanOnOrAfter) {
    reasons.push(
      "New IBR requires your first federal loan to have been disbursed on or after 1 Jul 2014. You have an earlier loan, so Old IBR (15%) applies instead.",
    );
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

export function checkPaye(loans: Loan[], rules: ResolvedRules, asOfIso: string): EligibilityCheck {
  const reasons: string[] = [...idrLegacyReasons(loans)];
  if (asOfIso >= rules.planTerms.paye.sunsetDate) {
    reasons.push("PAYE no longer exists — it sunset on 1 Jul 2028 under P.L. 119-21.");
  }
  if (loans.some((l) => l.type === "FFEL")) {
    reasons.push("FFEL loans are not eligible for PAYE.");
  }
  if (hasParentPlusExposure(loans)) {
    reasons.push("Parent PLUS loans (and consolidations that repaid one) are not eligible for PAYE.");
  }
  const earliest = earliestDisbursement(loans);
  if (earliest !== null && earliest < rules.planTerms.paye.newBorrowerProxyDate) {
    reasons.push(
      "PAYE requires you to be a new borrower with a disbursement on or after 1 Oct 2011. Your earliest loan predates that.",
    );
  }
  if (anyLoanOnOrAfter(loans, rules.planTerms.post2026RestrictionDate)) {
    reasons.push(post2026Reason());
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

export function checkIcr(loans: Loan[], rules: ResolvedRules, asOfIso: string): EligibilityCheck {
  const reasons: string[] = [...idrLegacyReasons(loans)];
  if (asOfIso >= rules.planTerms.icr.sunsetDate) {
    reasons.push("ICR no longer exists — it sunset on 1 Jul 2028 under P.L. 119-21.");
  }
  if (loans.some((l) => l.type === "FFEL")) {
    reasons.push("FFEL loans are not eligible for ICR.");
  }
  if (loans.some((l) => l.type === "DIRECT_PARENT_PLUS")) {
    reasons.push(
      "A Parent PLUS loan can only use ICR after being consolidated into a Direct Consolidation Loan.",
    );
  }
  if (anyLoanOnOrAfter(loans, rules.planTerms.post2026RestrictionDate)) {
    reasons.push(post2026Reason());
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

export function checkStandard10(): EligibilityCheck {
  // Every federal loan has a balance-based 10-year payment. For loans
  // disbursed after 1 Jul 2026 the Tiered Standard plan governs, but its
  // shortest tier equals this schedule, so the figure stays comparable.
  return OK;
}

export function checkTieredStandard(loans: Loan[], rules: ResolvedRules): EligibilityCheck {
  const reasons: string[] = [];
  for (const t of rules.tieredStandard.excludedLoanTypes) {
    if (loans.some((l) => l.type === t)) {
      reasons.push(`${t} loans cannot use the Tiered Standard plan.`);
    }
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

export function checkGraduated(loans: Loan[], rules: ResolvedRules): EligibilityCheck {
  const reasons: string[] = [];
  if (anyLoanOnOrAfter(loans, rules.planTerms.post2026RestrictionDate)) {
    reasons.push(post2026Reason());
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

export function checkExtended(
  loans: Loan[],
  rules: ResolvedRules,
  totalBalance: number,
): EligibilityCheck {
  const reasons: string[] = [];
  if (totalBalance <= rules.planTerms.extended.minimumBalanceCents) {
    reasons.push("Extended repayment requires more than $30,000 in eligible federal loans.");
  }
  if (anyLoanOnOrAfter(loans, rules.planTerms.post2026RestrictionDate)) {
    reasons.push(post2026Reason());
  }
  return reasons.length > 0 ? fail(reasons) : OK;
}

/**
 * Where a borrower who does not elect a plan by 1 Jul 2028 is placed.
 *
 * 34 C.F.R. § 685.209(c)(7)(iii)(A): the Secretary places the borrower in
 *   (1) the Repayment Assistance Plan, for Direct Loans eligible for it; or
 *   (2) the income-based repayment plan, for loans not eligible for RAP.
 *
 * So RAP is tried FIRST and IBR is the fallback — not the other way round, and
 * not PAYE→New IBR / ICR→Old IBR as this engine previously modelled. Between
 * the two IBR variants the borrower takes New IBR when they qualify as an IBR
 * new borrower, since that is the only IBR they may enter.
 *
 * `STANDARD_10` is a residual with no regulatory basis: it covers the borrower
 * eligible for neither destination (a Parent PLUS consolidation outside the
 * § 685.209(b)(6)(ii) carve-out is the real-world case). The regulation does
 * not say what happens to them; a Standard amortisation of the remaining
 * balance is the engine's stated assumption. Documented in
 * rules/plan-terms.*.json `note` and in /methodology.
 */
export function sunsetDestination(loans: Loan[], rules: ResolvedRules): PlanId {
  if (checkRap(loans, rules).eligible) return "RAP";
  if (checkIbrNew(loans, rules).eligible) return "IBR_NEW";
  if (checkIbrOld(loans, rules).eligible) return "IBR_OLD";
  return "STANDARD_10";
}

export function checkPlan(
  planId: PlanId,
  loans: Loan[],
  rules: ResolvedRules,
  asOfIso: string,
  totalBalance: number,
): EligibilityCheck {
  switch (planId) {
    case "RAP":
      return checkRap(loans, rules);
    case "IBR_OLD":
      return checkIbrOld(loans, rules);
    case "IBR_NEW":
      return checkIbrNew(loans, rules);
    case "PAYE":
      return checkPaye(loans, rules, asOfIso);
    case "ICR":
      return checkIcr(loans, rules, asOfIso);
    case "STANDARD_10":
      return checkStandard10();
    case "TIERED_STANDARD":
      return checkTieredStandard(loans, rules);
    case "GRADUATED":
      return checkGraduated(loans, rules);
    case "EXTENDED":
      return checkExtended(loans, rules, totalBalance);
  }
}
