import { describe, expect, it } from "vitest";
import {
  commonLevelRangeLimits,
  decideVerdict,
  filingFeeFor,
  getCounty,
  scoreConfidence,
  type ArgumentType,
  type Confidence,
  type CountyRules,
  type RatioAnalysis,
} from "@fairparcel/engine";

const AS_OF = "2026-08-15";

function county(id: string): CountyRules {
  const c = getCounty(id);
  if (!c) throw new Error(`county ${id} missing`);
  return c;
}

/** Fabricate the fields decideVerdict reads on the GAP path. */
function analysis(
  overCents: number,
  impliedFairCents: number,
  argumentType: ArgumentType = "MARKET_VALUE",
): RatioAnalysis {
  return {
    argumentType,
    comps: [],
    compCount: 8,
    medianRatio: 0.97,
    cod: 4,
    medianDataAgeDays: 200,
    subjectMarketIndicator: impliedFairCents,
    subjectRatio: 1,
    impliedFairAssessmentCents: impliedFairCents,
    overAssessmentCents: overCents,
    overAssessmentPct: (overCents / impliedFairCents) * 100,
  };
}

/**
 * Fabricate the fields the COMMON_LEVEL_RANGE path reads. Chapter 123 works on
 * assessed value and TRUE value, so those are the inputs here; the comparables'
 * implied fair assessment (medianRatio × true value) rides along so the tests
 * can show it is NOT what the relief is computed from.
 *
 * decideVerdict recovers assessed value as impliedFair + over, exactly as
 * ratio.ts defines it.
 */
function njAnalysis(
  assessedValueCents: number,
  trueValueCents: number,
  medianRatio: number,
): RatioAnalysis {
  const impliedFairCents = Math.round(medianRatio * trueValueCents);
  const overCents = assessedValueCents - impliedFairCents;
  return {
    argumentType: "MARKET_VALUE",
    comps: [],
    compCount: 8,
    medianRatio,
    cod: 4,
    medianDataAgeDays: 200,
    subjectMarketIndicator: trueValueCents,
    subjectRatio: assessedValueCents / trueValueCents,
    impliedFairAssessmentCents: impliedFairCents,
    overAssessmentCents: overCents,
    overAssessmentPct: (overCents / impliedFairCents) * 100,
  };
}

/**
 * TEST FIXTURE ONLY — Bergen's real rules with one SYNTHETIC taxing district.
 *
 * No real Bergen municipality's Director's Ratio is encoded anywhere in this
 * repo, deliberately: none has been read from a primary source (see
 * VERIFICATION-STATUS.md), and the engine invents none. The default ratio here
 * is the NJ Assessors Handbook's own worked example — §1105.19, "where the
 * average ratio is found to be 78.00%" — which is a published illustration, not
 * a municipal value.
 */
function countyWithRatio(averageRatioBps: number): CountyRules {
  const base = county("nj-bergen");
  const clr = base.commonLevelRange;
  if (!clr) throw new Error("nj-bergen must carry a commonLevelRange block");
  return {
    ...base,
    commonLevelRange: {
      ...clr,
      municipalities: [
        {
          municipalityId: "handbook-example",
          name: "Handbook Example Borough (synthetic)",
          averageRatioBps,
          taxYear: 2027,
          effectiveFrom: "2026-04-01",
          effectiveTo: "2027-03-31",
          citations: [
            {
              label:
                "NJ Assessors Handbook §1105.19 worked example — an illustration, not a real municipal ratio",
              url: "https://www.ridgewoodnj.net/DocumentCenter/View/122/NJ-Assessors-Handbook-Chapter-11---Tax-Appeals-PDF",
              lastVerified: "2026-08-15",
              verified: true,
            },
          ],
        },
      ],
    },
  };
}

const IN_DISTRICT = { municipalityId: "handbook-example" };

const HIGH: Confidence = scoreConfidence({
  compCount: 8,
  cod: 4,
  medianDataAgeDays: 120,
  windowMonths: 24,
});
const MEDIUM: Confidence = scoreConfidence({
  compCount: 4,
  cod: 14,
  medianDataAgeDays: 300,
  windowMonths: 24,
});
const LOW: Confidence = scoreConfidence({
  compCount: 3,
  cod: 22,
  medianDataAgeDays: 700,
  windowMonths: 24,
});

/* -------------------------------------------------------------------------- *
 * GAP relief model
 *
 * These cases previously ran against nj-bergen. They now run against il-cook,
 * because New Jersey no longer uses the generic threshold ladder at all — it
 * uses Chapter 123 (below). il-cook is the engine's GAP county: no statutory
 * corridor, so the ladder is the whole rule there. The expected dollar figures
 * are recomputed by hand at Cook's 2000 bps rather than Bergen's 230 bps.
 * -------------------------------------------------------------------------- */

describe("verdict thresholds, GAP model — honest verdicts are the product", () => {
  it("14.5% over with high confidence is a STRONG_CASE", () => {
    // $82,970 over an implied fair of $572,000.
    // over% = 8,297,000 / 57,200,000 = 14.505% ≥ 10, confidence HIGH.
    // Cook rate is 2000 bps (was 230 for Bergen), so the annual overpayment is
    // 8,297,000 × 2000 / 10,000 = 1,659,400¢ = $16,594.00 — not the $1,908.31
    // this case asserted when it ran under Bergen's rate.
    // Cook's fee is $0, so the strong-case bar is max(2 × 0, $200) = $200: met.
    const v = decideVerdict(analysis(8_297_000, 57_200_000, "UNIFORMITY"), HIGH, county("il-cook"));
    expect(v.kind).toBe("STRONG_CASE");
    expect(v.estimatedAnnualOverpaymentCents).toBe(1_659_400);
    expect(v.headline).toContain("$82,970");
    expect(v.commonLevelRange).toBeNull();
  });

  it("6.8% over clears the filing bar but not the strong bar → WORTH_FILING", () => {
    // 3,468,000 / 51,000,000 = 6.80%: over the 5% line, under the 10% line.
    const v = decideVerdict(analysis(3_468_000, 51_000_000, "UNIFORMITY"), HIGH, county("il-cook"));
    expect(v.kind).toBe("WORTH_FILING");
  });

  it("12% over with only MEDIUM confidence stays WORTH_FILING", () => {
    // 6,120,000 / 51,000,000 = 12.00% ≥ 10, but STRONG_CASE also needs HIGH.
    const v = decideVerdict(
      analysis(6_120_000, 51_000_000, "UNIFORMITY"),
      MEDIUM,
      county("il-cook"),
    );
    expect(v.kind).toBe("WORTH_FILING");
  });

  it("a 3% gap is inside appraisal noise → NOT_WORTH_IT, with the reason", () => {
    // 1,530,000 / 51,000,000 = 3.00% < 5%.
    const v = decideVerdict(analysis(1_530_000, 51_000_000, "UNIFORMITY"), HIGH, county("il-cook"));
    expect(v.kind).toBe("NOT_WORTH_IT");
    expect(v.reasons.join(" ")).toMatch(/under the 5%/);
  });

  it("assessed BELOW comps → NOT_WORTH_IT and warns an appeal could raise it", () => {
    const v = decideVerdict(analysis(-2_000_000, 51_000_000, "UNIFORMITY"), HIGH, county("il-cook"));
    expect(v.kind).toBe("NOT_WORTH_IT");
    expect(v.estimatedAnnualOverpaymentCents).toBe(0);
    expect(v.reasons.join(" ")).toMatch(/raise the assessment/);
  });

  it("a real gap on weak evidence → NOT_WORTH_IT, explaining the weakness", () => {
    const v = decideVerdict(analysis(6_120_000, 51_000_000, "UNIFORMITY"), LOW, county("il-cook"));
    expect(v.kind).toBe("NOT_WORTH_IT");
    expect(v.reasons.join(" ")).toMatch(/evidence/i);
  });

  it("Cook County's zero fee never blocks a modest but real case", () => {
    const v = decideVerdict(analysis(3_060_000, 51_000_000, "UNIFORMITY"), HIGH, county("il-cook"));
    expect(v.kind).toBe("WORTH_FILING");
    expect(v.filingFeeCents).toBe(0);
  });

  it("every verdict carries a headline and at least one plain-English reason", () => {
    for (const over of [8_297_000, 3_468_000, 1_530_000, -2_000_000]) {
      const v = decideVerdict(analysis(over, 57_200_000, "UNIFORMITY"), HIGH, county("il-cook"));
      expect(v.headline.length).toBeGreaterThan(20);
      expect(v.reasons.length).toBeGreaterThanOrEqual(1);
    }
  });
});

/* -------------------------------------------------------------------------- *
 * The corridor arithmetic
 * -------------------------------------------------------------------------- */

describe("common level range — the ±15% is multiplicative, not 15 points", () => {
  it("reproduces the handbook's worked example exactly: 78.00% → 66.30% / 89.70%", () => {
    // NJ Assessors Handbook §1105.19: "where the average ratio is found to be
    // 78.00%, the Common Level Range would be: Lower Limit — 66.30%, Upper
    // Limit — 89.70%."
    //   lower = 7800 × (10000 − 1500) / 10000 = 7800 × 0.85 = 6630 bps = 66.30%
    //   upper = 7800 × (10000 + 1500) / 10000 = 7800 × 1.15 = 8970 bps = 89.70%
    const limits = commonLevelRangeLimits(7800, 1500);
    expect(limits.lowerLimitBps).toBe(6630);
    expect(limits.upperLimitBps).toBe(8970);
  });

  it("is not the additive reading — 78 − 15 = 63 and 78 + 15 = 93 are both wrong", () => {
    const limits = commonLevelRangeLimits(7800, 1500);
    expect(limits.lowerLimitBps).not.toBe(6300);
    expect(limits.upperLimitBps).not.toBe(9300);
  });

  it("rounds half away from zero to whole basis points", () => {
    // 9990 × 0.85 = 8491.5 → 8492;  9990 × 1.15 = 11488.5 → 11489.
    const limits = commonLevelRangeLimits(9990, 1500);
    expect(limits.lowerLimitBps).toBe(8492);
    expect(limits.upperLimitBps).toBe(11489);
  });

  it("rejects a corridor that is not integer basis points below 100%", () => {
    expect(() => commonLevelRangeLimits(7800, 15)).not.toThrow();
    expect(() => commonLevelRangeLimits(7800, 10_000)).toThrow(/basis points/);
    expect(() => commonLevelRangeLimits(0, 1500)).toThrow(/average ratio/);
  });
});

/* -------------------------------------------------------------------------- *
 * COMMON_LEVEL_RANGE verdicts — New Jersey Chapter 123
 * -------------------------------------------------------------------------- */

describe("NJ Chapter 123 — the corridor decides, not the comparables gap", () => {
  it("inside the corridor: no relief, however over-assessed the comparables make it look", () => {
    // True value $600,000. Comps' median assessed-to-sale ratio 0.75, so the
    // implied fair assessment is 0.75 × 600,000 = $450,000.
    // Assessed $510,000 → raw gap $60,000 = 60,000 / 450,000 = 13.3%.
    // Under the GAP ladder that is STRONG_CASE territory.
    //
    // Chapter 123:
    //   Subject Property Ratio = 51,000,000 / 60,000,000 = 0.8500 → 8500 bps
    //   corridor from 78.00%   = 6630 to 8970 bps
    //   6630 ≤ 8500 ≤ 8970     → inside → §1105.20(1) → no reduction.
    const a = njAnalysis(51_000_000, 60_000_000, 0.75);
    expect(a.overAssessmentPct).toBeGreaterThan(10); // would have been STRONG_CASE

    const v = decideVerdict(a, HIGH, countyWithRatio(7800), IN_DISTRICT, AS_OF);
    expect(v.kind).toBe("NOT_WORTH_IT");
    expect(v.commonLevelRange?.outcome).toBe("NO_RELIEF");
    expect(v.commonLevelRange?.clause).toBe("§1105.20(1)");
    expect(v.commonLevelRange?.subjectRatioBps).toBe(8500);
    expect(v.commonLevelRange?.lowerLimitBps).toBe(6630);
    expect(v.commonLevelRange?.upperLimitBps).toBe(8970);
    expect(v.overAssessmentCents).toBe(0);
    expect(v.estimatedAnnualOverpaymentCents).toBe(0);
    expect(v.reasons.join(" ")).toMatch(/required to deny/);
  });

  it("above the corridor: relief is averageRatio × trueValue, not the comparables gap", () => {
    // True value $600,000; assessed $560,000; comps median ratio 0.75.
    //   Subject Property Ratio = 56,000,000 × 10,000 / 60,000,000
    //                          = 9333.33… → 9333 bps (93.33%)
    //   9333 > 8970 upper limit, and 9333 ≤ 10,000 county level → §1105.20(2).
    //   Statutory assessment   = 60,000,000 × 7800 / 10,000 = 46,800,000 ($468,000)
    //   Relief                 = 56,000,000 − 46,800,000    =  9,200,000 ($92,000)
    //
    // The comparables would have said $110,000 (56,000,000 − 45,000,000). That
    // figure is not what the board can grant, and is not what we report.
    //
    //   relief%    = 9,200,000 / 46,800,000 = 19.66% ≥ 10
    //   annual tax = 9,200,000 × 230 / 10,000 = 211,600¢ = $2,116.00
    //   fee band   = $500,000–$1,000,000 → $100 = 10,000¢
    //   STRONG_CASE bar = max(2 × 10,000, 20,000) = 20,000 ≤ 211,600 ✓
    const a = njAnalysis(56_000_000, 60_000_000, 0.75);
    expect(a.overAssessmentCents).toBe(11_000_000); // the comparables' answer

    const v = decideVerdict(a, HIGH, countyWithRatio(7800), IN_DISTRICT, AS_OF);
    expect(v.commonLevelRange?.outcome).toBe("REDUCTION");
    expect(v.commonLevelRange?.subjectRatioBps).toBe(9333);
    expect(v.commonLevelRange?.statutoryAssessmentCents).toBe(46_800_000);
    expect(v.commonLevelRange?.reliefCents).toBe(9_200_000);
    expect(v.overAssessmentCents).toBe(9_200_000);
    expect(v.overAssessmentCents).not.toBe(a.overAssessmentCents);
    expect(v.estimatedAnnualOverpaymentCents).toBe(211_600);
    expect(v.filingFeeCents).toBe(10_000);
    expect(v.kind).toBe("STRONG_CASE");
  });

  it("below the corridor: filing triggers a statutory INCREASE, and says so", () => {
    // True value $600,000; assessed $360,000; comps median ratio 0.75.
    //   Subject Property Ratio = 36,000,000 × 10,000 / 60,000,000 = 6000 bps
    //   6000 < 6630 lower limit → §1105.20(2), symmetric.
    //   Statutory assessment   = 60,000,000 × 7800 / 10,000 = 46,800,000
    //   Relief                 = 36,000,000 − 46,800,000 = −10,800,000
    //                            i.e. a $108,000 INCREASE.
    //   Added tax = 10,800,000 × 230 / 10,000 = 248,400¢ = $2,484.00
    const v = decideVerdict(
      njAnalysis(36_000_000, 60_000_000, 0.75),
      HIGH,
      countyWithRatio(7800),
      IN_DISTRICT,
      AS_OF,
    );
    expect(v.kind).toBe("NOT_WORTH_IT");
    expect(v.commonLevelRange?.outcome).toBe("INCREASE");
    expect(v.commonLevelRange?.subjectRatioBps).toBe(6000);
    expect(v.commonLevelRange?.statutoryAssessmentCents).toBe(46_800_000);
    expect(v.overAssessmentCents).toBe(-10_800_000);
    expect(v.estimatedAnnualOverpaymentCents).toBe(0);
    expect(v.headline).toMatch(/raise your assessment by \$108,000/);
    expect(v.reasons.join(" ")).toMatch(/statutory outcome/);
    expect(v.reasons.join(" ")).toMatch(/\$2,484/);
  });

  it("clause (3) overrides 'inside the range' when the ratio tops the county level", () => {
    // Average ratio 95.00% → corridor 8075 to 10925 bps, so 101% sits INSIDE
    // the range. Clause (1) would grant nothing — but §1105.20(1) is expressly
    // "subject to (3) and (4)", and (3) fires because the subject ratio exceeds
    // the 100% county percentage level while the district average is below it.
    //   Subject Property Ratio = 60,600,000 × 10,000 / 60,000,000 = 10,100 bps
    //   Statutory assessment   = 60,000,000 × 9500 / 10,000 = 57,000,000
    //   Relief                 = 60,600,000 − 57,000,000 =  3,600,000 ($36,000)
    const v = decideVerdict(
      njAnalysis(60_600_000, 60_000_000, 0.95),
      HIGH,
      countyWithRatio(9500),
      IN_DISTRICT,
      AS_OF,
    );
    expect(v.commonLevelRange?.clause).toBe("§1105.20(3)");
    expect(v.commonLevelRange?.subjectRatioBps).toBe(10_100);
    expect(v.commonLevelRange?.lowerLimitBps).toBe(8075);
    expect(v.commonLevelRange?.upperLimitBps).toBe(10_925);
    expect(v.commonLevelRange?.statutoryAssessmentCents).toBe(57_000_000);
    expect(v.overAssessmentCents).toBe(3_600_000);
  });

  it("the tiered fee blocks a case the old flat $25 would have let through", () => {
    // The fee bug, exactly. Average ratio 99.90%; true value $2,000,000;
    // assessed $2,003,000; comps median ratio 0.999.
    //   Subject Property Ratio = 200,300,000 × 10,000 / 200,000,000 = 10,015 bps
    //   > 10,000 county level, district average below it → §1105.20(3)
    //   Statutory assessment   = 200,000,000 × 9990 / 10,000 = 199,800,000
    //   Relief                 = 200,300,000 − 199,800,000 = 500,000 ($5,000)
    //   Annual tax saving      = 500,000 × 230 / 10,000 = 11,500¢ = $115.00
    //   Fee band at $2,003,000 assessed → "$1,000,000 or more" → $150 = 15,000¢
    //   11,500 ≤ 15,000 → NOT_WORTH_IT.
    //
    // Under the encoded flat $25 (2,500¢) the same case cleared the fee gate
    // and was returned as WORTH_FILING. relief% is 500,000 / 199,800,000 =
    // 0.25%, far under the strong-case bar either way.
    const v = decideVerdict(
      njAnalysis(200_300_000, 200_000_000, 0.999),
      HIGH,
      countyWithRatio(9990),
      IN_DISTRICT,
      AS_OF,
    );
    expect(v.commonLevelRange?.outcome).toBe("REDUCTION");
    expect(v.commonLevelRange?.reliefCents).toBe(500_000);
    expect(v.estimatedAnnualOverpaymentCents).toBe(11_500);
    expect(v.filingFeeCents).toBe(15_000);
    expect(v.filingFeeCents).not.toBe(2_500);
    expect(v.kind).toBe("NOT_WORTH_IT");
    expect(v.reasons.join(" ")).toMatch(/filing fee/);
  });

  it("weak evidence still blocks, because the whole test rests on the true value", () => {
    const v = decideVerdict(
      njAnalysis(56_000_000, 60_000_000, 0.75),
      LOW,
      countyWithRatio(7800),
      IN_DISTRICT,
      AS_OF,
    );
    expect(v.kind).toBe("NOT_WORTH_IT");
    expect(v.commonLevelRange?.outcome).toBe("REDUCTION");
    expect(v.reasons.join(" ")).toMatch(/true value/);
  });
});

describe("NJ Chapter 123 — cannot determine, rather than a fabricated answer", () => {
  it("the shipped Bergen ruleset has no Director's Ratio, so every verdict is CANNOT_DETERMINE", () => {
    // commonLevelRange.municipalities is deliberately empty: no ratio has been
    // read from a primary source. Falling back to the 5%/10% ladder would
    // recommend appeals the county board is required by statute to deny.
    const v = decideVerdict(
      njAnalysis(56_000_000, 60_000_000, 0.75),
      HIGH,
      county("nj-bergen"),
      { municipalityId: "hackensack" },
      AS_OF,
    );
    expect(v.kind).toBe("CANNOT_DETERMINE");
    expect(v.commonLevelRange?.outcome).toBe("CANNOT_DETERMINE");
    expect(v.commonLevelRange?.statutoryAssessmentCents).toBeNull();
    expect(v.estimatedAnnualOverpaymentCents).toBe(0);
    expect(v.reasons.join(" ")).toMatch(/Director's Ratio/);
    expect(v.reasons.join(" ")).toMatch(/not a basis for filing/);
  });

  it("a populated table still cannot answer without knowing the municipality", () => {
    const v = decideVerdict(
      njAnalysis(56_000_000, 60_000_000, 0.75),
      HIGH,
      countyWithRatio(7800),
      undefined,
      AS_OF,
    );
    expect(v.kind).toBe("CANNOT_DETERMINE");
    expect(v.reasons.join(" ")).toMatch(/municipality by municipality/);
  });

  it("a municipality with no ratio in force on the check date cannot be answered", () => {
    // The fixture ratio runs 2026-04-01 to 2027-03-31. A 2025 check misses it.
    const v = decideVerdict(
      njAnalysis(56_000_000, 60_000_000, 0.75),
      HIGH,
      countyWithRatio(7800),
      IN_DISTRICT,
      "2025-06-01",
    );
    expect(v.kind).toBe("CANNOT_DETERMINE");
    expect(v.reasons.join(" ")).toMatch(/1 April/);
  });

  it("a uniformity analysis produces no true value, so the corridor cannot run", () => {
    const uniformity = analysis(6_120_000, 51_000_000, "UNIFORMITY");
    const v = decideVerdict(uniformity, HIGH, countyWithRatio(7800), IN_DISTRICT, AS_OF);
    expect(v.kind).toBe("CANNOT_DETERMINE");
    expect(v.commonLevelRange?.explanation).toMatch(/true market value/);
  });
});

/* -------------------------------------------------------------------------- *
 * The Bergen filing fee schedule (N.J.S.A. 54:3-21.3)
 * -------------------------------------------------------------------------- */

describe("filing fee schedule — banded by assessed value, at every boundary", () => {
  const bergen = county("nj-bergen");

  it("charges $5 below $150,000, right up to the last cent", () => {
    expect(filingFeeFor(bergen, 0)).toBe(500);
    expect(filingFeeFor(bergen, 9_999_999)).toBe(500);
    expect(filingFeeFor(bergen, 14_999_999)).toBe(500);
  });

  it("charges $25 from $150,000 to under $500,000", () => {
    expect(filingFeeFor(bergen, 15_000_000)).toBe(2_500);
    expect(filingFeeFor(bergen, 49_999_999)).toBe(2_500);
  });

  it("charges $100 from $500,000 to under $1,000,000", () => {
    expect(filingFeeFor(bergen, 50_000_000)).toBe(10_000);
    expect(filingFeeFor(bergen, 99_999_999)).toBe(10_000);
  });

  it("charges $150 at $1,000,000 and above — six times the old encoded flat fee", () => {
    expect(filingFeeFor(bergen, 100_000_000)).toBe(15_000);
    expect(filingFeeFor(bergen, 250_000_000)).toBe(15_000);
    expect(filingFeeFor(bergen, 100_000_000)).toBe(6 * 2_500);
  });

  it("a county with no schedule keeps its flat fee", () => {
    expect(filingFeeFor(county("il-cook"), 250_000_000)).toBe(0);
  });
});
