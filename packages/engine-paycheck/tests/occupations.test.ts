import { describe, expect, it } from "vitest";
import { findOccupationByCode, resolveRules, searchOccupations } from "@engine";

const rules = resolveRules(2026);
const occ = rules.occupations;

describe("occupations — deterministic search", () => {
  it("finds wait staff for 'waiter'", () => {
    const results = searchOccupations("waiter", occ);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.occupation.code).toBe("102");
  });

  it("finds the rideshare code for 'uber driver'", () => {
    const results = searchOccupations("uber driver", occ);
    expect(results[0]?.occupation.code).toBe("802");
  });

  it("finds manicurist for 'nail tech'", () => {
    const results = searchOccupations("nail tech", occ);
    expect(results[0]?.occupation.code).toBe("605");
  });

  it("looks up an occupation by code", () => {
    expect(findOccupationByCode("101", occ)?.title).toBe("Bartender");
    expect(findOccupationByCode("999", occ)).toBeUndefined();
  });

  // Authority: TD 10044, 26 CFR § 1.224-1(h) Table 1 (FR publication
  // 2026-04-13) and the IRS list page. Official TTOC 205 is "Dancers"; the
  // engine had "Musician or singer" there and every code from 205 onward was
  // shifted by one, so a W-2 box 14b code of 205 rendered as the wrong job.
  it("TTOC 205 is Dancers — the 200-block realignment", () => {
    expect(findOccupationByCode("205", occ)?.title).toBe("Dancers");
    expect(findOccupationByCode("206", occ)?.title).toBe("Musicians and Singers");
    expect(findOccupationByCode("211", occ)?.title).toBe(
      "Locker Room, Coatroom, and Dressing Room Attendants",
    );
  });

  it("carries all 71 official occupations with no duplicate codes", () => {
    expect(occ.occupations).toHaveLength(71);
    const codes = occ.occupations.map((o) => o.code);
    expect(new Set(codes).size).toBe(71);
    // The five rows added on 2026-08-15, each recorded in VERIFICATION-STATUS.md.
    for (const code of ["205", "509", "510", "611", "810"]) {
      expect(findOccupationByCode(code, occ)).toBeDefined();
    }
  });

  it("returns nothing for an empty query", () => {
    expect(searchOccupations("", occ)).toEqual([]);
  });

  it("returns nothing for a clearly non-tipped occupation", () => {
    expect(searchOccupations("software engineer", occ)).toEqual([]);
  });

  it("is deterministic — same query, same order, twice", () => {
    const a = searchOccupations("driver", occ).map((m) => m.occupation.code);
    const b = searchOccupations("driver", occ).map((m) => m.occupation.code);
    expect(a).toEqual(b);
  });
});
