/**
 * The Fork's arithmetic.
 *
 * A ▲ on the timeline is a sentence about someone's money — "the cheaper
 * monthly payment you picked has, as of this month, cost you more than the
 * alternative, and it never catches back up." Every condition that sentence
 * depends on is asserted here, including the three ways of getting it wrong:
 * marking a plan that never ends up dearer, marking a plan that was never
 * cheaper to begin with, and marking a transient crossing that later reverses.
 */

import { describe, expect, it } from "vitest";
import { simulateAllPlans } from "@/engines/repayment";
import type { Cents, MonthlyRow, PlanId, PlanResult } from "@/engines/repayment";
import { AS_OF, makeHousehold, makeLoan, makeStrategy } from "./test-fixtures";
import {
  cumulativeCostSeries,
  cumulativeCostThrough,
  cumulativePaidSeries,
  cumulativePaidThrough,
  deconflictLabels,
  findCrossover,
  findCrossoversAgainst,
  forkHorizonMonths,
  forkLayout,
  forkMaxCost,
  forkYearTicks,
  headlineCrossover,
  interestWaivedSeries,
  MAX_HORIZON_MONTHS,
  MIN_HORIZON_MONTHS,
  sampleMonths,
  taxMonth,
  trackDash,
  trackPath,
  TRACK_DASHES,
} from "./fork";

/* -------------------------------------------------------------------------- *
 * Fixtures
 * -------------------------------------------------------------------------- */

interface FakePlanOptions {
  forgiven?: Cents;
  tax?: Cents;
  waived?: readonly Cents[];
}

/** A PlanResult with an exact, hand-written payment schedule. */
function fakePlan(
  planId: PlanId,
  payments: readonly Cents[],
  options: FakePlanOptions = {},
): PlanResult {
  const forgiven = options.forgiven ?? 0;
  const tax = options.tax ?? 0;
  const totalPaid = payments.reduce((sum, p) => sum + p, 0);
  const principal = totalPaid + forgiven;

  let running = 0;
  const schedule: MonthlyRow[] = payments.map((payment, i) => {
    running += payment;
    return {
      month: i + 1,
      date: `20${String(26 + Math.floor(i / 12)).padStart(2, "0")}-${String((i % 12) + 1).padStart(2, "0")}-01`,
      payment,
      interestAccrued: 0,
      interestPaid: 0,
      interestWaived: options.waived?.[i] ?? 0,
      principalPaid: payment,
      principalMatch: 0,
      endingBalance: Math.max(0, principal - running - (i === payments.length - 1 ? forgiven : 0)),
    };
  });

  return {
    planId,
    eligible: true,
    ineligibilityReasons: [],
    firstMonthlyPayment: payments[0] ?? 0,
    schedule,
    monthsToResolution: schedule.length,
    totalPaid,
    totalForgiven: forgiven,
    estimatedTaxOnForgiveness: tax,
    totalLifetimeCost: totalPaid + tax,
    forgivenessDate: forgiven > 0 ? (schedule[schedule.length - 1]?.date ?? null) : null,
    warnings: [],
  };
}

/** Repeat a payment `n` times. */
function flat(amount: Cents, n: number): Cents[] {
  return new Array<Cents>(n).fill(amount);
}

/* -------------------------------------------------------------------------- *
 * Cumulative series
 * -------------------------------------------------------------------------- */

describe("cumulative series", () => {
  const plan = fakePlan("STANDARD_10", flat(100, 6));

  it("starts every track at zero, so the tracks begin together", () => {
    expect(cumulativePaidSeries(plan, 6)[0]).toBe(0);
    expect(cumulativeCostSeries(plan, 6)[0]).toBe(0);
    expect(cumulativeCostThrough(plan, 0)).toBe(0);
  });

  it("accumulates payments and then goes flat at resolution", () => {
    expect(cumulativePaidSeries(plan, 10)).toEqual([0, 100, 200, 300, 400, 500, 600, 600, 600, 600, 600]);
  });

  it("agrees with the scalar form at every month", () => {
    const series = cumulativePaidSeries(plan, 9);
    for (let m = 0; m <= 9; m++) {
      expect(series[m]).toBe(cumulativePaidThrough(plan, m));
    }
  });

  it("lands the tax on forgiveness in the month forgiveness happens", () => {
    const forgiving = fakePlan("IBR_NEW", flat(100, 6), { forgiven: 5_000, tax: 800 });
    expect(taxMonth(forgiving)).toBe(6);
    expect(cumulativeCostSeries(forgiving, 8)).toEqual([0, 100, 200, 300, 400, 500, 1400, 1400, 1400]);
  });

  it("charges no tax when nothing is forgiven", () => {
    expect(taxMonth(plan)).toBeNull();
    expect(cumulativeCostSeries(plan, 6).at(-1)).toBe(600);
  });

  it("pins the last point of the track to the ledger table's lifetime cost", () => {
    // The visual and the table may never disagree. This is the mechanism.
    const forgiving = fakePlan("RAP", flat(100, 6), { forgiven: 5_000, tax: 800 });
    expect(cumulativeCostSeries(forgiving, 400).at(-1)).toBe(forgiving.totalLifetimeCost);
  });

  it("accumulates waived interest separately from payments", () => {
    const rap = fakePlan("RAP", flat(100, 4), { waived: [10, 20, 0, 5] });
    expect(interestWaivedSeries(rap, 4)).toEqual([0, 10, 30, 30, 35]);
  });
});

/* -------------------------------------------------------------------------- *
 * Crossover detection
 * -------------------------------------------------------------------------- */

describe("findCrossover", () => {
  it("returns nothing when both sides are the same plan", () => {
    const plan = fakePlan("RAP", flat(100, 10));
    expect(findCrossover(plan, plan)).toBeNull();
  });

  it("finds the month a cheap monthly payment becomes the dearer total", () => {
    // $100/mo for 20 months = $2,000 total, against $250/mo for 6 = $1,500.
    // Cumulatives are level at month 15 ($1,500 each); month 16 is the overtake.
    const cheapMonthly = fakePlan("IBR_NEW", flat(100, 20));
    const cheapTotal = fakePlan("STANDARD_10", flat(250, 6));

    const crossover = findCrossover(cheapMonthly, cheapTotal);
    expect(crossover).not.toBeNull();
    expect(crossover?.month).toBe(16);
    expect(crossover?.planId).toBe("IBR_NEW");
    expect(crossover?.againstPlanId).toBe("STANDARD_10");
    expect(crossover?.finalGap).toBe(500);
    // The most it was ever ahead by: month 6, $1,500 paid vs $600.
    expect(crossover?.peakLead).toBe(900);
    expect(crossover?.peakLeadMonth).toBe(6);
    expect(crossover?.costAtCrossover).toBe(1_600);
    expect(crossover?.date).toBe(cheapMonthly.schedule[15]?.date);
  });

  it("refuses to mark a plan that never ends up costing more", () => {
    const cheapMonthly = fakePlan("IBR_NEW", flat(100, 20));
    const cheapTotal = fakePlan("STANDARD_10", flat(250, 6));
    // The dearer-monthly plan is also the cheaper total — nothing crosses over.
    expect(findCrossover(cheapTotal, cheapMonthly)).toBeNull();
  });

  it("refuses to mark a plan that was never the cheaper one", () => {
    // Dearer from the very first payment and dearer at the end: the ledger
    // table already says so, and there is no "fork" to point at.
    const alwaysDearer = fakePlan("EXTENDED", flat(200, 10));
    const alwaysCheaper = fakePlan("STANDARD_10", flat(100, 10));
    expect(findCrossover(alwaysDearer, alwaysCheaper)).toBeNull();
  });

  it("marks the durable crossing, not the first one that later reverses", () => {
    // Cumulative A: 100 200 400 400 400 400 600 700
    // Cumulative B: 150 300 350 450 550 550 560 570
    // A pokes above B at month 3, falls back at month 4, and only from month 7
    // is it ahead for good. Marking month 3 would put the ▲ four months early.
    const a = fakePlan("RAP", [100, 100, 200, 0, 0, 0, 200, 100]);
    const b = fakePlan("STANDARD_10", [150, 150, 50, 100, 100, 0, 10, 10]);

    expect(cumulativeCostSeries(a, 8)).toEqual([0, 100, 200, 400, 400, 400, 400, 600, 700]);
    expect(cumulativeCostSeries(b, 8)).toEqual([0, 150, 300, 350, 450, 550, 550, 560, 570]);

    const crossover = findCrossover(a, b);
    expect(crossover?.month).toBe(7);
    expect(crossover?.peakLead).toBe(150); // month 5: $550 vs $400
    expect(crossover?.peakLeadMonth).toBe(5);
    expect(crossover?.finalGap).toBe(130);
  });

  it("treats a level month as still behind, not as the overtake", () => {
    // Cumulative A meets B exactly at month 3 then pulls ahead at month 4.
    const a = fakePlan("RAP", [100, 100, 100, 200]);
    const b = fakePlan("STANDARD_10", [150, 100, 50, 0]);
    expect(cumulativeCostSeries(a, 4)).toEqual([0, 100, 200, 300, 500]);
    expect(cumulativeCostSeries(b, 4)).toEqual([0, 150, 250, 300, 300]);
    expect(findCrossover(a, b)?.month).toBe(4);
  });

  it("counts the tax bill on forgiveness as part of the crossing", () => {
    // Lower payments the whole way, but the tax on forgiveness lands in the
    // final month and pushes the lifetime total past the plan that paid in
    // full. The ▲ belongs on the forgiveness month, not before it.
    const forgiven = fakePlan("IBR_NEW", flat(100, 10), { forgiven: 40_000, tax: 800 });
    const paidInFull = fakePlan("STANDARD_10", flat(150, 10));

    const crossover = findCrossover(forgiven, paidInFull);
    expect(crossover?.month).toBe(10);
    expect(crossover?.month).toBe(taxMonth(forgiven));
    expect(crossover?.finalGap).toBe(300); // $1,800 lifetime vs $1,500
    expect(crossover?.peakLead).toBe(450); // month 9: $1,350 vs $900
  });

  it("handles schedules of different lengths without falling off the end", () => {
    const long = fakePlan("EXTENDED", flat(50, 300));
    const short = fakePlan("STANDARD_10", flat(100, 100));
    const crossover = findCrossover(long, short);
    expect(crossover?.month).toBe(201); // $10,000 level at 200, ahead at 201
    expect(crossover?.finalGap).toBe(5_000);
  });
});

describe("findCrossoversAgainst", () => {
  const winner = fakePlan("STANDARD_10", flat(250, 6)); // $1,500 lifetime
  const crosses = fakePlan("IBR_NEW", flat(100, 20)); // $2,000 lifetime, cheaper monthly
  const dearerThroughout = fakePlan("EXTENDED", flat(300, 6)); // never cheaper
  const cheaper = fakePlan("RAP", flat(100, 10)); // $1,000 lifetime, never dearer
  const plans = [winner, crosses, dearerThroughout, cheaper];

  it("marks only the plans that genuinely fork away from the reference", () => {
    const map = findCrossoversAgainst(plans, "STANDARD_10");
    expect([...map.keys()]).toEqual(["IBR_NEW"]);
    expect(map.get("IBR_NEW")?.month).toBe(16);
  });

  it("never marks the reference against itself", () => {
    expect(findCrossoversAgainst(plans, "STANDARD_10").has("STANDARD_10")).toBe(false);
  });

  it("returns an empty map when the reference is not in the list", () => {
    expect(findCrossoversAgainst(plans, "PAYE").size).toBe(0);
  });

  it("picks the earliest crossing as the one worth a sentence", () => {
    const early = fakePlan("PAYE", flat(100, 20));
    const late = fakePlan("ICR", flat(60, 40));
    const map = findCrossoversAgainst([winner, early, late], "STANDARD_10");
    const headline = headlineCrossover(map.values());
    expect(headline?.planId).toBe("PAYE");
    expect(headlineCrossover([])).toBeNull();
  });
});

/* -------------------------------------------------------------------------- *
 * Against the real engine
 * -------------------------------------------------------------------------- */

describe("against the engine's own output", () => {
  // A borrower whose cheapest monthly payment is not their cheapest plan:
  // $118,000 of grad debt at 7.05% on a $62,000 income, growing 4% a year.
  const result = simulateAllPlans(
    [
      makeLoan({ type: "DIRECT_UNSUBSIDIZED", balance: 6_800_000, annualRateBps: 705 }),
      makeLoan({ type: "DIRECT_GRAD_PLUS", balance: 5_000_000, annualRateBps: 805 }),
    ],
    makeHousehold({ agi: 6_200_000, familySize: 1 }),
    makeStrategy({ expectedAnnualIncomeGrowthPct: 4 }),
    AS_OF,
  );
  const eligible = result.plans.filter((p) => p.eligible);

  it("has at least two eligible plans to fork between", () => {
    expect(eligible.length).toBeGreaterThan(1);
  });

  it("ends every track exactly on the lifetime cost the ledger table prints", () => {
    const horizon = forkHorizonMonths(eligible);
    for (const plan of eligible) {
      const series = cumulativeCostSeries(plan, horizon);
      expect(series.at(-1)).toBe(plan.totalLifetimeCost);
      expect(cumulativePaidSeries(plan, horizon).at(-1)).toBe(plan.totalPaid);
      // The schedule and the summary must be the same money.
      const summed = plan.schedule.reduce((s, row) => s + row.payment, 0);
      expect(summed).toBe(plan.totalPaid);
    }
  });

  it("never draws a curve that runs backwards", () => {
    const horizon = forkHorizonMonths(eligible);
    for (const plan of eligible) {
      const series = cumulativeCostSeries(plan, horizon);
      for (let m = 1; m <= horizon; m++) {
        expect(series[m] ?? 0).toBeGreaterThanOrEqual(series[m - 1] ?? 0);
      }
    }
  });

  it("every ▲ it places is a true statement about the two plans", () => {
    const reference = result.recommendation.lowestTotalCost;
    const referencePlan = eligible.find((p) => p.planId === reference);
    expect(referencePlan).toBeDefined();
    if (!referencePlan) return;

    const horizon = forkHorizonMonths(eligible);
    const referenceCost = cumulativeCostSeries(referencePlan, horizon);

    for (const [planId, crossover] of findCrossoversAgainst(eligible, reference)) {
      const plan = eligible.find((p) => p.planId === planId);
      expect(plan).toBeDefined();
      if (!plan) continue;
      const cost = cumulativeCostSeries(plan, horizon);

      // 1. it really does end up dearer
      expect(plan.totalLifetimeCost).toBeGreaterThan(referencePlan.totalLifetimeCost);
      // 2. it really was cheaper at the moment the claim says it was
      expect(cost[crossover.peakLeadMonth] ?? 0).toBeLessThan(
        referenceCost[crossover.peakLeadMonth] ?? 0,
      );
      // 3. from the crossover month on, it is ahead and stays ahead
      expect(cost[crossover.month - 1] ?? 0).toBeLessThanOrEqual(
        referenceCost[crossover.month - 1] ?? 0,
      );
      for (let m = crossover.month; m <= horizon; m++) {
        expect(cost[m] ?? 0).toBeGreaterThan(referenceCost[m] ?? 0);
      }
    }
  });

  it("agrees with the ranking: the cheapest-total plan is never marked", () => {
    const reference = result.recommendation.lowestTotalCost;
    expect(findCrossoversAgainst(eligible, reference).has(reference)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- *
 * Axis, sampling, layout
 * -------------------------------------------------------------------------- */

describe("forkHorizonMonths", () => {
  it("never exceeds thirty years", () => {
    const plans = [fakePlan("EXTENDED", flat(10, 480))];
    expect(forkHorizonMonths(plans)).toBe(MAX_HORIZON_MONTHS);
  });

  it("never squashes a short schedule into a sliver of the axis", () => {
    expect(forkHorizonMonths([fakePlan("STANDARD_10", flat(10, 36))])).toBe(MIN_HORIZON_MONTHS);
  });

  it("covers the slowest plan when it sits between the two", () => {
    const plans = [fakePlan("STANDARD_10", flat(10, 120)), fakePlan("IBR_OLD", flat(5, 240))];
    expect(forkHorizonMonths(plans)).toBe(240);
  });

  it("reports the tallest lifetime cost on the axis", () => {
    const plans = [
      fakePlan("STANDARD_10", flat(100, 10)),
      fakePlan("IBR_OLD", flat(50, 40), { forgiven: 100, tax: 500 }),
    ];
    expect(forkMaxCost(plans)).toBe(2_500);
    expect(forkMaxCost([])).toBe(0);
  });
});

describe("forkYearTicks", () => {
  it("rules a thirty-year axis in five-year steps, starting at zero", () => {
    expect(forkYearTicks(360)).toEqual([0, 5, 10, 15, 20, 25, 30]);
  });

  it("tightens the step on short axes", () => {
    expect(forkYearTicks(60)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(forkYearTicks(120)).toEqual([0, 2, 4, 6, 8, 10]);
  });
});

describe("sampleMonths", () => {
  const graduated = fakePlan("GRADUATED", [
    ...flat(100, 24),
    ...flat(150, 24),
    ...flat(220, 24),
  ]);

  it("anchors the origin and the resolution month", () => {
    const months = sampleMonths(graduated, 360);
    expect(months[0]).toBe(0);
    expect(months.at(-1)).toBe(72);
  });

  it("keeps the month before resolution, so a tax lump renders as a riser", () => {
    expect(sampleMonths(graduated, 360)).toContain(71);
  });

  it("keeps every step-up in the payment", () => {
    const months = sampleMonths(graduated, 360);
    for (const kink of [24, 25, 48, 49]) expect(months).toContain(kink);
  });

  it("is sorted, unique and inside the horizon", () => {
    const months = sampleMonths(graduated, 48);
    for (let i = 1; i < months.length; i++) {
      expect(months[i] ?? 0).toBeGreaterThan(months[i - 1] ?? 0);
    }
    expect(months.at(-1)).toBe(48);
  });

  it("stays inside its point budget even when every month is a kink", () => {
    const noisy = fakePlan("ICR", Array.from({ length: 360 }, (_, i) => 100 + i));
    expect(sampleMonths(noisy, 360, 60).length).toBeLessThanOrEqual(64);
  });
});

describe("forkLayout", () => {
  const horizontal = forkLayout("horizontal", 360, 18_000_000);
  const vertical = forkLayout("vertical", 360, 18_000_000);

  it("puts the shared origin in the bottom-left when time runs across", () => {
    const origin = horizontal.point(0, 0);
    expect(origin.x).toBeCloseTo(horizontal.plot.x, 6);
    expect(origin.y).toBeCloseTo(horizontal.plot.y + horizontal.plot.height, 6);
  });

  it("puts the shared origin in the top-left when time runs down the page", () => {
    const origin = vertical.point(0, 0);
    expect(origin.x).toBeCloseTo(vertical.plot.x, 6);
    expect(origin.y).toBeCloseTo(vertical.plot.y, 6);
  });

  it("swaps which axis carries time, and nothing else", () => {
    expect(horizontal.time(180)).toBeCloseTo(horizontal.plot.x + horizontal.plot.width / 2, 6);
    expect(vertical.time(180)).toBeCloseTo(vertical.plot.y + vertical.plot.height / 2, 6);
    expect(horizontal.crossOf({ x: 3, y: 7 })).toBe(7);
    expect(vertical.crossOf({ x: 3, y: 7 })).toBe(3);
  });

  it("keeps every plotted point inside the viewBox", () => {
    for (const layout of [horizontal, vertical]) {
      for (const month of [0, 1, 180, 360]) {
        for (const cost of [0, 9_000_000, layout.costMax]) {
          const p = layout.point(month, cost);
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(layout.width);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(layout.height);
        }
      }
    }
  });

  it("inverts a pointer position back to the month under it", () => {
    for (const layout of [horizontal, vertical]) {
      for (const month of [0, 1, 47, 180, 359, 360]) {
        const p = layout.point(month, 5_000_000);
        expect(layout.monthAt(p.x, p.y)).toBe(month);
      }
    }
  });

  it("clamps a pointer dragged off either end of the axis", () => {
    expect(horizontal.monthAt(-500, 0)).toBe(0);
    expect(horizontal.monthAt(5_000, 0)).toBe(360);
    expect(vertical.monthAt(0, -500)).toBe(0);
    expect(vertical.monthAt(0, 5_000)).toBe(360);
  });

  it("rounds the cost axis to values worth printing, above the tallest track", () => {
    expect(horizontal.costMax).toBeGreaterThanOrEqual(18_000_000);
    expect(horizontal.costTicks.length).toBeGreaterThan(1);
    expect(horizontal.costTicks[0]).toBe(0);
    // Fewer labels on the narrow axis, which has no room for five of them.
    expect(vertical.costTicks.length).toBeLessThanOrEqual(horizontal.costTicks.length);
  });

  it("survives a degenerate axis instead of dividing by zero", () => {
    const flatAxis = forkLayout("horizontal", 0, 0);
    const p = flatAxis.point(0, 0);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
    expect(flatAxis.horizonMonths).toBe(1);
  });
});

describe("trackPath", () => {
  const layout = forkLayout("horizontal", 12, 1_200);

  it("draws one command per sampled month, starting with a move", () => {
    const path = trackPath(layout, [0, 6, 12], [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1_000, 1_100, 1_200]);
    expect(path.startsWith("M")).toBe(true);
    expect(path.split("L").length).toBe(3);
  });

  it("returns nothing for an empty sample rather than a broken path", () => {
    expect(trackPath(layout, [], [])).toBe("");
  });
});

/* -------------------------------------------------------------------------- *
 * Colour is never the only difference
 * -------------------------------------------------------------------------- */

describe("trackDash", () => {
  it("gives the recommended plan the only solid stroke", () => {
    expect(trackDash(0, true)).toBe("");
  });

  it("gives every other track a pattern of its own", () => {
    // Nine plans means at most eight non-recommended tracks. No repeats.
    const dashes = Array.from({ length: 8 }, (_, rank) => trackDash(rank, false));
    expect(new Set(dashes).size).toBe(8);
    expect(dashes).not.toContain("");
    expect(dashes.length).toBe(TRACK_DASHES.length);
  });

  it("stays inside the list for any rank it is handed", () => {
    for (const rank of [-3, 0, 7, 8, 99]) {
      expect(TRACK_DASHES).toContain(trackDash(rank, false));
    }
  });
});

/* -------------------------------------------------------------------------- *
 * Direct labels
 * -------------------------------------------------------------------------- */

describe("deconflictLabels", () => {
  it("leaves labels alone when they already clear each other", () => {
    expect(deconflictLabels([10, 50, 90], 20, 0, 100)).toEqual([10, 50, 90]);
  });

  it("pushes overlapping labels apart by the minimum gap", () => {
    const placed = deconflictLabels([40, 42, 44], 10, 0, 100);
    expect(placed[1] ?? 0).toBeGreaterThanOrEqual((placed[0] ?? 0) + 10);
    expect(placed[2] ?? 0).toBeGreaterThanOrEqual((placed[1] ?? 0) + 10);
  });

  it("returns positions in the caller's order, not sorted order", () => {
    const placed = deconflictLabels([90, 10, 50], 20, 0, 100);
    expect(placed[0]).toBeGreaterThan(placed[2] ?? 0);
    expect(placed[2]).toBeGreaterThan(placed[1] ?? 0);
  });

  it("keeps every label on the canvas when the stack overflows the bottom", () => {
    const placed = deconflictLabels([95, 96, 97, 98], 10, 0, 100);
    for (const p of placed) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
    expect(placed[0]).toBeLessThan(95); // pressed back up to make room
  });

  it("holds all nine plans apart on the full-height axis", () => {
    const layout = forkLayout("horizontal", 360, 18_000_000);
    const crowded = new Array<number>(9).fill(layout.plot.y + 40);
    const placed = deconflictLabels(
      crowded,
      layout.labelGap,
      layout.plot.y,
      layout.plot.y + layout.plot.height,
    );
    const sorted = [...placed].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect((sorted[i] ?? 0) - (sorted[i - 1] ?? 0)).toBeGreaterThanOrEqual(layout.labelGap - 1e-9);
    }
    expect(sorted[sorted.length - 1] ?? 0).toBeLessThanOrEqual(layout.plot.y + layout.plot.height);
  });

  it("handles the empty and single cases", () => {
    expect(deconflictLabels([], 10, 0, 100)).toEqual([]);
    expect(deconflictLabels([42], 10, 0, 100)).toEqual([42]);
  });
});
