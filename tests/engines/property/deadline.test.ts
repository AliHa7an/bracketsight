import { describe, expect, it } from "vitest";
import { getCounty, nextDeadline, type CountyRules } from "@/engines/property";

function county(id: string): CountyRules {
  const c = getCounty(id);
  if (!c) throw new Error(`county ${id} missing`);
  return c;
}

describe("deadline countdown — computed from county rules JSON", () => {
  it("Bergen's April 1: from 2026-08-08 the next deadline is 2027-04-01, 236 days away", () => {
    const d = nextDeadline(county("nj-bergen"), "2026-08-08");
    expect(d.kind).toBe("FIXED_ANNUAL");
    expect(d.isoDate).toBe("2027-04-01");
    expect(d.daysAway).toBe(236);
  });

  it("inside the window: 2027-03-15 → 17 days to April 1", () => {
    const d = nextDeadline(county("nj-bergen"), "2027-03-15");
    expect(d.isoDate).toBe("2027-04-01");
    expect(d.daysAway).toBe(17);
  });

  it("on the deadline itself: 0 days away, same day — not rolled to next year", () => {
    const d = nextDeadline(county("nj-bergen"), "2027-04-01");
    expect(d.isoDate).toBe("2027-04-01");
    expect(d.daysAway).toBe(0);
  });

  it("the day after rolls to the following year", () => {
    const d = nextDeadline(county("nj-bergen"), "2027-04-02");
    expect(d.isoDate).toBe("2028-04-01");
  });

  it("Cook's notice-relative rule yields no fixed date, only the rule text", () => {
    const d = nextDeadline(county("il-cook"), "2026-08-08");
    expect(d.kind).toBe("NOTICE_RELATIVE");
    expect(d.isoDate).toBeNull();
    expect(d.daysAway).toBeNull();
    expect(d.ruleText.length).toBeGreaterThan(20);
  });

  it("Bergen's date is met by delivery, not by posting", () => {
    // Handbook §1105.01: "'filed' has been interpreted by the courts to mean
    // received in the office of the County Board of Taxation by April 1. A
    // postmark of a mailed petition is not sufficient."
    const d = nextDeadline(county("nj-bergen"), "2027-03-31");
    expect(d.filingCutoff).toBe("RECEIVED_BY");
    expect(d.filingCutoffNote).toMatch(/postmark/i);
    expect(d.daysAway).toBe(1);
  });

  it("Cook's cutoff is UNSPECIFIED — it was never verified, so nothing is claimed", () => {
    const d = nextDeadline(county("il-cook"), "2026-08-08");
    expect(d.filingCutoff).toBe("UNSPECIFIED");
    expect(d.filingCutoffNote).toBeNull();
  });
});
