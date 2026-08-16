import { describe, expect, it } from "vitest";
import { getRules, reconcileAdvanceCredit } from "@/engines/aca";

const rules = getRules();

/**
 * OBBBA (Pub. L. 119-21) §71305 — "Section 36B(f)(2) is amended by striking
 * subparagraph (B)", applicable to taxable years beginning after 31 Dec 2025 —
 * repealed the advance-credit repayment limitation outright. For the 2026 tax
 * year there is NO cap at any income level. Every expectation below that
 * changed, changed for that reason, and each says so.
 */
describe("clawback — Form 8962 advance-credit reconciliation", () => {
  it("repays EVERYTHING over 400% FPL", () => {
    const r = reconcileAdvanceCredit(
      {
        aptcAnnual: 840_000, // $700/mo advance all year
        finalPtcAnnual: 0,
        fplPctForm: 405,
        filingStatus: "SINGLE",
      },
      rules,
    );
    // Unchanged in value: $8,400 − $0 = $8,400 repaid. Only the reason moved —
    // it used to be "no band covers 405%", it is now "no limitation exists".
    expect(r.repaymentDue).toBe(840_000);
    expect(r.uncapped).toBe(true);
    expect(r.capApplied).toBeNull();
  });

  it("repays EVERYTHING under 400% FPL too — the cap is repealed", () => {
    const r = reconcileAdvanceCredit(
      {
        aptcAnnual: 1_440_000,
        finalPtcAnnual: 950_328,
        fplPctForm: 351,
        filingStatus: "SINGLE",
      },
      rules,
    );
    // CHANGED — repaymentDue was 165_000 and capApplied was 165_000, the
    // single-filer cap of the old 300–<400% FPL band. OBBBA §71305 struck
    // §36B(f)(2)(B), so the full excess is now due:
    //   $14,400.00 advance − $9,503.28 final credit = $4,896.72 excess
    //   = 1_440_000 − 950_328 = 489_672 cents, repaid in full.
    // The household owes $4,896.72, not $1,650 — a $3,246.72 understatement
    // of real exposure under the old rule.
    expect(r.excessAdvance).toBe(489_672);
    expect(r.repaymentDue).toBe(489_672);
    expect(r.capApplied).toBeNull();
    expect(r.uncapped).toBe(true);
    expect(r.notes.join(" ")).toMatch(/§71305|no cap/i);
  });

  it("charges a 250% FPL household the full excess — previously capped", () => {
    // NEW TEST. This is the case the repealed rules file got most wrong: its
    // note told a household at 250% FPL that its clawback was capped at $1,000
    // (the old 200–<300% single-filer band).
    //   $7,200.00 advance − $4,200.00 final credit = $3,000.00 excess
    //   = 720_000 − 420_000 = 300_000 cents.
    // Old answer: min(300_000, 100_000) = $1,000. Correct 2026 answer: $3,000.
    const r = reconcileAdvanceCredit(
      {
        aptcAnnual: 720_000,
        finalPtcAnnual: 420_000,
        fplPctForm: 250,
        filingStatus: "SINGLE",
      },
      rules,
    );
    expect(r.excessAdvance).toBe(300_000);
    expect(r.repaymentDue).toBe(300_000);
    expect(r.repaymentDue).not.toBe(100_000); // the repealed band's cap
    expect(r.capApplied).toBeNull();
    expect(r.uncapped).toBe(true);
  });

  it("charges the full excess at the very bottom of the income range too", () => {
    // NEW TEST. The old <200% FPL band capped a single filer at $400. There is
    // no floor to the repeal: a household at 150% FPL repays in full.
    //   $6,000.00 advance − $5,100.00 final credit = $900.00 = 90_000 cents.
    const r = reconcileAdvanceCredit(
      {
        aptcAnnual: 600_000,
        finalPtcAnnual: 510_000,
        fplPctForm: 150,
        filingStatus: "SINGLE",
      },
      rules,
    );
    expect(r.repaymentDue).toBe(90_000); // was min(90_000, 40_000) = $400
    expect(r.uncapped).toBe(true);
  });

  it("no longer varies with filing status", () => {
    // CHANGED — this case used to assert capApplied 330_000, the doubled
    // non-single cap of the 300–<400% band. With §36B(f)(2)(B) struck there is
    // no cap to double: single and joint filers both repay the same
    // 1_440_000 − 950_328 = 489_672 cents of excess.
    const single = reconcileAdvanceCredit(
      {
        aptcAnnual: 1_440_000,
        finalPtcAnnual: 950_328,
        fplPctForm: 351,
        filingStatus: "SINGLE",
      },
      rules,
    );
    const joint = reconcileAdvanceCredit(
      {
        aptcAnnual: 1_440_000,
        finalPtcAnnual: 950_328,
        fplPctForm: 351,
        filingStatus: "MARRIED_JOINT",
      },
      rules,
    );
    expect(joint.repaymentDue).toBe(489_672);
    expect(joint.repaymentDue).toBe(single.repaymentDue);
    expect(joint.capApplied).toBeNull();
  });

  it("refunds the difference when the final credit beats the advance", () => {
    const r = reconcileAdvanceCredit(
      {
        aptcAnnual: 840_000,
        finalPtcAnnual: 950_328,
        fplPctForm: 351,
        filingStatus: "SINGLE",
      },
      rules,
    );
    // Unchanged: the repeal touches repayment, not the net-PTC refund.
    // $9,503.28 − $8,400.00 = $1,103.28 refunded.
    expect(r.repaymentDue).toBe(0);
    expect(r.additionalCredit).toBe(110_328);
  });

  it("carries the repeal as data, not as logic", () => {
    // NEW TEST. The rules file, not clawback.ts, is what says "no cap": a
    // future year that reinstates a limitation ships a new dated ruleset with
    // limitation.inEffect true and populated bands.
    expect(rules.repaymentLimits.limitation.inEffect).toBe(false);
    expect(rules.repaymentLimits.limitation.bands).toEqual([]);
    expect(
      rules.repaymentLimits.citations.some((c) => c.label.includes("71305")),
    ).toBe(true);
  });

  it("refuses to guess when a limitation is declared with no bands", () => {
    // NEW TEST. Fail loudly rather than return an uncapped number that would
    // be right only by coincidence (the audit's recommended disposition).
    const misconfigured = {
      ...rules,
      repaymentLimits: {
        ...rules.repaymentLimits,
        limitation: { inEffect: true, bands: [] },
      },
    };
    expect(() =>
      reconcileAdvanceCredit(
        {
          aptcAnnual: 720_000,
          finalPtcAnnual: 420_000,
          fplPctForm: 250,
          filingStatus: "SINGLE",
        },
        misconfigured,
      ),
    ).toThrow(/refusing to guess/);
  });
});
