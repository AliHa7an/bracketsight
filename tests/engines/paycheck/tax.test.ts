import { describe, expect, it } from "vitest";
import { marginalRateBps, resolveRules, taxOn, taxSavings } from "@/engines/paycheck";

const rules = resolveRules(2026);

describe("tax — bracket table math (2026 placeholder brackets)", () => {
  it("taxes the whole 10% bracket exactly at its boundary", () => {
    expect(taxOn(1_240_000, "SINGLE", rules.brackets)).toBe(124_000);
  });

  it("progressive tax across two brackets", () => {
    // $21,900 taxable single: 10% × $12,400 + 12% × $9,500 = $2,380
    expect(taxOn(2_190_000, "SINGLE", rules.brackets)).toBe(238_000);
  });

  it("marginal rate at $143,900 taxable single is 24%", () => {
    expect(marginalRateBps(14_390_000, "SINGLE", rules.brackets)).toBe(2400);
  });

  it("savings straddling a bracket boundary are exact, not marginal-rate × amount", () => {
    // $30,000 MAGI single → $13,900 taxable (12%); a $4,000 deduction drops
    // $1,500 through the 12% band and $2,500 into the 10% band:
    // saved = 12% × $1,500 + 10% × $2,500 = $430 — not 12% × $4,000 = $480.
    const s = taxSavings(3_000_000, 400_000, "SINGLE", rules.brackets);
    expect(s.taxableBeforeCents).toBe(1_390_000);
    expect(s.estimatedTaxSavedCents).toBe(43_000);
  });

  it("taxable income never goes below zero", () => {
    const s = taxSavings(1_000_000, 500_000, "SINGLE", rules.brackets);
    expect(s.taxableBeforeCents).toBe(0);
    expect(s.estimatedTaxSavedCents).toBe(0);
  });
});
