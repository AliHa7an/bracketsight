import { describe, expect, it } from "vitest";
import {
  cliffEdgeMagi,
  fplFor,
  fplPercentBps,
  fplPercentForm8962,
  getRules,
  magiAtPctEdge,
  stateGroupFor,
} from "@/engines/aca";

const rules = getRules();

describe("fpl — 2025 HHS guidelines (2026 coverage year)", () => {
  it("computes the contiguous-48 line for common family sizes", () => {
    expect(fplFor(1, "CONTIGUOUS_48", rules)).toBe(1_565_000); // $15,650
    expect(fplFor(4, "CONTIGUOUS_48", rules)).toBe(3_215_000); // $32,150
  });

  it("uses the higher Alaska and Hawaii guidelines", () => {
    expect(fplFor(1, "ALASKA", rules)).toBe(1_955_000); // $19,550
    // CHANGED: Hawaii's additional-person amount was $6,325 in the rules file;
    // 90 Fed. Reg. 5917 (Jan. 17, 2025), FR Doc. 2025-01377, says "add $6,330
    // for each additional person", and its printed table increments by exactly
    // that ($24,320 − $17,990 = $6,330). Two people: $17,990 + $6,330 =
    // $24,320 → 2_432_000 cents, up from 2_431_500.
    expect(fplFor(2, "HAWAII", rules)).toBe(1_799_000 + 633_000); // $24,320
  });

  it("uses $6,330 per additional Hawaii person at every family size", () => {
    // Source-confirmed swap (90 Fed. Reg. 5917). The published Hawaii table is
    // exactly linear, so the increment must reproduce every printed row:
    //   1 → $17,990 · 2 → $24,320 · 3 → $30,650 · 4 → $36,980
    expect(fplFor(1, "HAWAII", rules)).toBe(1_799_000);
    expect(fplFor(2, "HAWAII", rules)).toBe(2_432_000);
    expect(fplFor(3, "HAWAII", rules)).toBe(3_065_000);
    expect(fplFor(4, "HAWAII", rules)).toBe(3_698_000);
    // The increment itself, stated once: $6,330 not $6,325.
    expect(
      fplFor(4, "HAWAII", rules) - fplFor(3, "HAWAII", rules),
    ).toBe(633_000);
  });

  it("maps state codes to guideline groups", () => {
    expect(stateGroupFor("AK")).toBe("ALASKA");
    expect(stateGroupFor("HI")).toBe("HAWAII");
    expect(stateGroupFor("TX")).toBe("CONTIGUOUS_48");
  });

  it("rejects a non-positive family size", () => {
    expect(() => fplFor(0, "CONTIGUOUS_48", rules)).toThrow();
  });

  it("applies Worksheet 2's ceiling test BEFORE truncating", () => {
    const fpl = 1_565_000; // single filer, contiguous 48
    // Form 8962 Worksheet 2 step 4: "Is the amount on line 1 more than the
    // amount on line 3 [FPL × 4.0]? Yes → enter 401 here and on line 5."
    // Truncation (step 5) is reached only in the "No" branch.
    // 4.0 × $15,650 = $62,600 exactly — NOT more than, so the No branch runs
    // and floor(6_260_000 × 100 / 1_565_000) = floor(400.00) = 400.
    expect(fplPercentForm8962(6_260_000, fpl, rules)).toBe(400);
    // One cent more IS "more than 4.0 × FPL" → 401, ineligible.
    expect(fplPercentForm8962(6_260_001, fpl, rules)).toBe(401);
    // CHANGED (was 400): $62,756.49 is 400.99% of FPL. The old bare Math.floor
    // truncated that to 400 and called it eligible. Worksheet 2 never reaches
    // the truncation for it: 6_275_649 > 6_260_000, so line 5 is 401.
    expect(fplPercentForm8962(6_275_649, fpl, rules)).toBe(401);
    // Exactly 401.0000% was already over, and still is.
    expect(fplPercentForm8962(6_275_650, fpl, rules)).toBe(401);
    // Precise bps view for the meter keeps the decimals.
    expect(fplPercentBps(6_250_000, fpl)).toBe(39_936); // 399.36%
  });

  it("truncates — never rounds — at every interior boundary", () => {
    const fpl = 1_565_000;
    // Truncation still governs below the ceiling, where the instructions'
    // worked examples apply: "for 3.997, enter 399" — floor, not round.
    // 3.997 × $15,650 = $62,553.05 → 6_255_305 cents.
    expect(fplPercentForm8962(6_255_305, fpl, rules)).toBe(399);
    // 2.999 × $15,650 = $46,933.35 → floor 299, not 300.
    expect(fplPercentForm8962(4_693_335, fpl, rules)).toBe(299);
  });

  it("finds the cliff-edge MAGI exactly", () => {
    const fpl = 1_565_000;
    const edge = magiAtPctEdge(fpl, 400, rules);
    // CHANGED (was 6_275_649): the ceiling is not a truncation boundary, so
    // the last eligible MAGI is 4.0 × FPL = 4 × 1_565_000 = 6_260_000
    // ($62,600), not ceil(401 × FPL / 100) − 1. The old value overstated it by
    // $156.49 — one percent of the single-person poverty line.
    expect(edge).toBe(6_260_000);
    expect(edge).toBe(cliffEdgeMagi(fpl, rules));
    expect(fplPercentForm8962(edge, fpl, rules)).toBe(400);
    expect(fplPercentForm8962(edge + 1, fpl, rules)).toBe(401);
  });

  it("finds the cliff-edge MAGI for a family of four", () => {
    // The magnitude of the old error, stated where it is largest for a common
    // household. Family of four, contiguous 48:
    //   FPL = $15,650 + 3 × $5,500 = $32,150 → 3_215_000 cents
    //   edge = 4.0 × 3_215_000 = 12_860_000 ($128,600)
    // The old formula gave ceil(401 × 3_215_000 / 100) − 1 = 12_892_149
    // ($128,921.49) — $321.49 too high, and every dollar of that gap was
    // reported as still credit-eligible when it is not.
    const fpl4 = fplFor(4, "CONTIGUOUS_48", rules);
    expect(fpl4).toBe(3_215_000);
    const edge = magiAtPctEdge(fpl4, 400, rules);
    expect(edge).toBe(12_860_000);
    expect(12_892_149 - edge).toBe(32_149); // $321.49 of overstatement removed
    expect(fplPercentForm8962(edge, fpl4, rules)).toBe(400);
    expect(fplPercentForm8962(edge + 1, fpl4, rules)).toBe(401);
  });

  it("puts a household at 400.9% of FPL over the edge, not at 400", () => {
    // The audit's worked case. Single filer: 4.009 × $15,650 = $62,740.85.
    // Under the old bare floor this truncated to 400 and the household was
    // told it kept the credit. Worksheet 2 makes it 401 — ineligible.
    const fpl = 1_565_000;
    const magi = 6_274_085;
    expect(magi).toBeGreaterThan(magiAtPctEdge(fpl, 400, rules));
    expect(fplPercentForm8962(magi, fpl, rules)).toBe(401);
    // Same story for a family of four: 4.009 × $32,150 = $128,889.35.
    const fpl4 = 3_215_000;
    expect(fplPercentForm8962(12_888_935, fpl4, rules)).toBe(401);
  });

  it("still uses the truncation formula for the 250% CSR ledge", () => {
    // Interior boundaries are genuine truncation boundaries — unchanged.
    // ceil(251 × 1_565_000 / 100) − 1 = ceil(3_928_150) − 1 = 3_928_149.
    const fpl = 1_565_000;
    const csrEdge = magiAtPctEdge(fpl, 250, rules);
    expect(csrEdge).toBe(3_928_149);
    expect(fplPercentForm8962(csrEdge, fpl, rules)).toBe(250);
    expect(fplPercentForm8962(csrEdge + 1, fpl, rules)).toBe(251);
  });
});
