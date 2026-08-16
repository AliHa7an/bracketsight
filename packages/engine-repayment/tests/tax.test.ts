import { describe, expect, it } from "vitest";
import { estimateTaxOnForgiveness } from "../src/tax";
import { resolveRules } from "../src/rules/index";

const { tax } = resolveRules("2026-08-08");

describe("tax.ts — forgiveness tax from dated config, never constants", () => {
  it("non-PSLF forgiveness is taxable at the configured assumed marginal rate", () => {
    // $10,000 forgiven at the configured 22% → $2,200
    expect(estimateTaxOnForgiveness(1_000_000, false, tax)).toBe(220_000);
  });

  it("PSLF forgiveness is tax-free under current law", () => {
    expect(estimateTaxOnForgiveness(1_000_000, true, tax)).toBe(0);
  });

  it("no forgiveness, no tax", () => {
    expect(estimateTaxOnForgiveness(0, false, tax)).toBe(0);
  });

  it("the config carries citations and effective dating (invariant 3)", () => {
    expect(tax.citations.length).toBeGreaterThan(0);
    expect(tax.citations[0]?.url).toMatch(/^https?:\/\//);
    expect(tax.citations[0]?.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tax.effectiveFrom).toBe("2026-01-01");
  });
});
