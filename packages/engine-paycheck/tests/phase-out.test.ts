import { describe, expect, it } from "vitest";
import { fullyPhasedOutAt, phaseOutReduction, resolveRules, thresholdFor } from "@engine";
import type { PhaseOutRule } from "@engine";

const rules = resolveRules(2026);
const step: PhaseOutRule = rules.tips.phaseOut; // $100 per $1,000 over $150k/$300k, rounds DOWN
const carLoanStep: PhaseOutRule = rules.carLoan.phaseOut; // $200 per $1,000 over $100k/$200k, rounds UP
const pct: PhaseOutRule = rules.senior.phaseOut; // 6% of excess over $75k/$150k

describe("phase-out — PER_1000_STEP model", () => {
  it("no reduction below the threshold", () => {
    expect(phaseOutReduction(14_000_000, "SINGLE", step)).toBe(0);
  });

  it("no reduction exactly at the threshold", () => {
    expect(phaseOutReduction(15_000_000, "SINGLE", step)).toBe(0);
  });

  // CHANGED 2026-08-15. Was: expected 10_000 ($100), on the assumption that a
  // partial $1,000 counts as a full step. Authority: Schedule 1-A (Form 1040)
  // line 11 — "Divide line 10 by $1,000. If the resulting number isn't a whole
  // number, decrease the result to the next lower whole number. (For example,
  // decrease 1.5 to 1, and decrease 0.05 to 0.)" IRC § 224(b)(2)(A) says "for
  // each $1,000" with no "or portion thereof".
  //
  // Derivation by hand:
  //   MAGI          $150,001.00 = 15,000,100 cents
  //   threshold     $150,000.00 = 15,000,000 cents
  //   excess        15,000,100 − 15,000,000 = 100 cents = $1.00
  //   line 11       $1.00 ÷ $1,000 = 0.001 → decrease to next lower whole → 0
  //   reduction     0 steps × $100 = $0 = 0 cents
  it("a fraction of $1,000 over is DROPPED, not rounded up (Sched. 1-A line 11)", () => {
    expect(phaseOutReduction(15_000_100, "SINGLE", step)).toBe(0);
  });

  // The floor must be a true floor, not half-up rounding. Before the fix the
  // `false` branch of phase-out.ts called roundHalfUpToCent, which would have
  // turned this $500.01 excess into a full step. Schedule 1-A line 11's own
  // example ("decrease 1.5 to 1") rules that out.
  //
  // Derivation by hand:
  //   MAGI          $150,500.01 = 15,050,001 cents
  //   excess        50,001 cents = $500.01
  //   line 11       $500.01 ÷ $1,000 = 0.50001 → next lower whole number → 0
  //   reduction     0 × $100 = $0
  it("floors rather than rounds half-up — $500.01 over is still zero steps", () => {
    expect(phaseOutReduction(15_050_001, "SINGLE", step)).toBe(0);
  });

  // Derivation by hand:
  //   MAGI          $151,500.00 = 15,150,000 cents
  //   excess        150,000 cents = $1,500
  //   line 11       1.5 → decrease to 1 (the form's own worked example)
  //   reduction     1 × $100 = $100 = 10,000 cents
  it("1.5 steps decreases to 1 — the form's own worked example", () => {
    expect(phaseOutReduction(15_150_000, "SINGLE", step)).toBe(10_000);
  });

  // The asymmetry is statutory and must survive: identical $3,500 excess,
  // opposite roundings. IRC § 163(h)(4)(C)(ii)(I) says "$200 for each $1,000
  // (or portion thereof)" and Schedule 1-A line 28 says "increase the result
  // to the next higher whole number" — neither has any counterpart in
  // § 224 / § 225 or on Schedule 1-A lines 11 and 19.
  //
  // Derivation by hand, tips (threshold $150,000, $100/step, rounds DOWN):
  //   MAGI $153,500 → excess $3,500 → 3.5 → floor 3 → 3 × $100 = $300 = 30,000 cents
  // Derivation by hand, car loan (threshold $100,000, $200/step, rounds UP):
  //   MAGI $103,500 → excess $3,500 → 3.5 → ceil 4 → 4 × $200 = $800 = 80,000 cents
  it("the same $3,500 excess floors for tips and ceils for car-loan interest", () => {
    expect(rules.tips.phaseOut.model).toBe("PER_1000_STEP");
    expect(rules.carLoan.phaseOut.model).toBe("PER_1000_STEP");
    expect(phaseOutReduction(15_350_000, "SINGLE", step)).toBe(30_000); // 3 steps
    expect(phaseOutReduction(10_350_000, "SINGLE", carLoanStep)).toBe(80_000); // 4 steps
  });

  // Guards the flags themselves, so a future "harmonisation" fails loudly.
  it("keeps the statutory rounding flags opposite", () => {
    expect(rules.tips.phaseOut).toMatchObject({ fractionCountsAsFullStep: false });
    expect(rules.overtime.phaseOut).toMatchObject({ fractionCountsAsFullStep: false });
    expect(rules.carLoan.phaseOut).toMatchObject({ fractionCountsAsFullStep: true });
  });

  it("$160,000 single → $10k over → $1,000 reduction", () => {
    expect(phaseOutReduction(16_000_000, "SINGLE", step)).toBe(100_000);
  });

  it("joint threshold is $300,000", () => {
    expect(thresholdFor(step, "MARRIED_JOINT")).toBe(30_000_000);
    expect(phaseOutReduction(29_000_000, "MARRIED_JOINT", step)).toBe(0);
    expect(phaseOutReduction(31_000_000, "MARRIED_JOINT", step)).toBe(100_000);
  });

  it("a full $25,000 tips deduction phases out entirely at $400,000 single MAGI", () => {
    expect(fullyPhasedOutAt(2_500_000, "SINGLE", step)).toBe(40_000_000);
  });
});

describe("phase-out — PERCENT_OF_EXCESS model (senior)", () => {
  it("6% of the excess over $75,000 single", () => {
    // $80,000 MAGI → $5,000 excess → $300 reduction
    expect(phaseOutReduction(8_000_000, "SINGLE", pct)).toBe(30_000);
  });

  it("a $6,000 senior deduction phases out entirely at $175,000 single MAGI", () => {
    expect(fullyPhasedOutAt(600_000, "SINGLE", pct)).toBe(17_500_000);
  });
});
