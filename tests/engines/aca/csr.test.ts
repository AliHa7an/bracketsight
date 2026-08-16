import { describe, expect, it } from "vitest";
import { computeCsr, getRules } from "@/engines/aca";

const rules = getRules();

describe("csr — the second, smaller cliff at 250% FPL", () => {
  it("assigns the 94/87/73 bands at their upper boundaries", () => {
    expect(computeCsr(150, "ELIGIBLE", rules).band).toBe("94");
    expect(computeCsr(200, "ELIGIBLE", rules).band).toBe("87");
    expect(computeCsr(250, "ELIGIBLE", rules).band).toBe("73");
  });

  it("drops the whole band one point over 250%", () => {
    const r = computeCsr(251, "ELIGIBLE", rules);
    expect(r.band).toBeNull();
    expect(r.actuarialValueBps).toBeNull();
  });

  it("reports actuarial value in basis points", () => {
    expect(computeCsr(140, "ELIGIBLE", rules).actuarialValueBps).toBe(9_400);
    expect(computeCsr(210, "ELIGIBLE", rules).actuarialValueBps).toBe(7_300);
  });

  it("gives no CSR when the PTC itself is unavailable", () => {
    expect(computeCsr(120, "MEDICAID_REFERRAL", rules).band).toBeNull();
    expect(computeCsr(401, "CLIFF", rules).band).toBeNull();
  });
});
