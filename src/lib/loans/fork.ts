/**
 * The Fork — pure geometry, sampling and crossover detection.
 *
 * Everything in this file is a total function of engine output: no React, no
 * DOM, no dates, no randomness. That matters because the ▲ this module places
 * is a *claim about the user's money* ("your cheaper monthly payment has now
 * cost you more"), and a claim has to be testable. `src/lib/__tests__/fork.test.ts`
 * holds it to that.
 *
 * Two conventions run through the whole file:
 *
 *   • Months are 1-based, matching `MonthlyRow.month`. Month 0 is the origin —
 *     the moment before the first payment, where every plan costs $0 and every
 *     track starts. That shared origin is what makes the picture a *fork*.
 *   • "Cost" means cumulative **lifetime** cost: payments made to date, plus
 *     the estimated tax on forgiveness at the month forgiveness lands. It is
 *     the engine's own ranking key (`totalLifetimeCost`), so the curve a user
 *     traces with their finger ends exactly where the ledger table says it
 *     does. Using payments alone would let the picture and the table disagree.
 *
 * `d3-scale` supplies the scales; there is no charting library anywhere.
 */

import { scaleLinear } from "d3-scale";
import type { Cents, PlanId, PlanResult } from "@/engines/repayment";

/* ========================================================================== *
 * Cumulative series
 * ========================================================================== */

/** Cumulative amount paid through a 1-based month (flat after resolution). */
export function cumulativePaidThrough(plan: PlanResult, month: number): Cents {
  const n = Math.min(Math.trunc(month), plan.schedule.length);
  let total = 0;
  for (let i = 0; i < n; i++) total += plan.schedule[i]?.payment ?? 0;
  return total;
}

/** Cumulative interest waived through a 1-based month. RAP only, in practice. */
export function interestWaivedThrough(plan: PlanResult, month: number): Cents {
  const n = Math.min(Math.trunc(month), plan.schedule.length);
  let total = 0;
  for (let i = 0; i < n; i++) total += plan.schedule[i]?.interestWaived ?? 0;
  return total;
}

/** Outstanding balance at the end of a 1-based month; 0 once the plan resolves. */
export function balanceAt(plan: PlanResult, month: number): Cents {
  const idx = Math.trunc(month) - 1;
  if (idx < 0) return plan.schedule[0]?.endingBalance ?? 0;
  return plan.schedule[idx]?.endingBalance ?? 0;
}

/** The month payment for a 1-based month; 0 once the plan resolves. */
export function paymentAt(plan: PlanResult, month: number): Cents {
  return plan.schedule[Math.trunc(month) - 1]?.payment ?? 0;
}

/**
 * `series[m]` = cumulative payments through month `m`, for m in 0…horizon.
 * O(horizon) rather than the O(horizon²) of calling `cumulativePaidThrough`
 * in a loop — the scrub readout rebuilds these on every recalculation.
 */
export function cumulativePaidSeries(plan: PlanResult, horizonMonths: number): Cents[] {
  const n = Math.max(0, Math.trunc(horizonMonths));
  const out = new Array<Cents>(n + 1).fill(0);
  let running = 0;
  for (let m = 1; m <= n; m++) {
    running += plan.schedule[m - 1]?.payment ?? 0;
    out[m] = m >= plan.schedule.length ? plan.totalPaid : running;
  }
  return out;
}

/** `series[m]` = cumulative interest waived through month `m`. */
export function interestWaivedSeries(plan: PlanResult, horizonMonths: number): Cents[] {
  const n = Math.max(0, Math.trunc(horizonMonths));
  const out = new Array<Cents>(n + 1).fill(0);
  let running = 0;
  for (let m = 1; m <= n; m++) {
    running += plan.schedule[m - 1]?.interestWaived ?? 0;
    out[m] = running;
  }
  return out;
}

/**
 * The month the tax on forgiveness falls due, or `null` when nothing is
 * forgiven. Forgiveness resolves the loan, so it lands on the last month of
 * the schedule — the same month the track stops.
 */
export function taxMonth(plan: PlanResult): number | null {
  if (plan.totalForgiven <= 0 || plan.estimatedTaxOnForgiveness <= 0) return null;
  const resolution = plan.monthsToResolution > 0 ? plan.monthsToResolution : plan.schedule.length;
  return Math.max(1, resolution);
}

/**
 * `series[m]` = cumulative **lifetime cost** through month `m`: payments to
 * date plus the tax on forgiveness once forgiveness has happened.
 *
 * The tail is pinned to `plan.totalLifetimeCost` rather than to the running
 * sum, so the last point of every track is, by construction, the number the
 * ledger table prints. The Fork cannot drift away from the table.
 */
export function cumulativeCostSeries(plan: PlanResult, horizonMonths: number): Cents[] {
  const n = Math.max(0, Math.trunc(horizonMonths));
  const out = new Array<Cents>(n + 1).fill(0);
  const scheduleEnd = plan.schedule.length;
  const tax = taxMonth(plan) === null ? 0 : plan.estimatedTaxOnForgiveness;
  const taxAt = taxMonth(plan) ?? Number.POSITIVE_INFINITY;
  let running = 0;
  for (let m = 1; m <= n; m++) {
    running += plan.schedule[m - 1]?.payment ?? 0;
    const paid = m >= scheduleEnd ? plan.totalPaid : running;
    out[m] = paid + (m >= taxAt ? tax : 0);
  }
  return out;
}

/** Scalar form of `cumulativeCostSeries`, for one-off reads. */
export function cumulativeCostThrough(plan: PlanResult, month: number): Cents {
  const m = Math.max(0, Math.trunc(month));
  if (m === 0) return 0;
  const paid = m >= plan.schedule.length ? plan.totalPaid : cumulativePaidThrough(plan, m);
  const at = taxMonth(plan);
  return paid + (at !== null && m >= at ? plan.estimatedTaxOnForgiveness : 0);
}

/* ========================================================================== *
 * Crossover detection — the load-bearing claim
 * ========================================================================== */

export interface Crossover {
  /** The plan whose curve climbs above the other's and stays there. */
  planId: PlanId;
  /** The plan it overtakes — the reference track. */
  againstPlanId: PlanId;
  /** 1-based month of the overtake: the first month it is ahead *for good*. */
  month: number;
  /** ISO date of that month, when the schedule reaches it. */
  date: string | null;
  /** Cumulative lifetime cost of `planId` at the crossover. */
  costAtCrossover: Cents;
  /** The largest amount `planId` was ever ahead by, before the overtake. */
  peakLead: Cents;
  /** The month that peak lead occurred. */
  peakLeadMonth: number;
  /** How much more `planId` costs by the end of the horizon. */
  finalGap: Cents;
}

/** Horizon covering both plans, in months. */
function pairHorizon(a: PlanResult, b: PlanResult): number {
  return Math.max(
    1,
    a.schedule.length,
    b.schedule.length,
    a.monthsToResolution,
    b.monthsToResolution,
  );
}

/**
 * Find the month at which `candidate` stops being the cheaper choice and
 * becomes the dearer one, measured against `reference`.
 *
 * Three conditions must all hold before a ▲ is drawn, because each one is a
 * different way of being wrong about someone's money:
 *
 *   1. **It really does end up costing more.** `candidate`'s lifetime cost at
 *      the horizon exceeds `reference`'s. Without this there is no "costlier
 *      total" to warn about.
 *   2. **It really was cheaper first.** There is some earlier month where
 *      `candidate` had paid strictly less. Two plans that were never ranked
 *      the other way round have not "crossed over" — one was simply always
 *      dearer, which the ledger table already says.
 *   3. **The overtake is durable.** The month reported is the *last* upward
 *      crossing: the earliest month after which `candidate` is ahead for the
 *      rest of the horizon. Curves can touch and separate several times
 *      (graduated step-ups, the PAYE/ICR sunset migration, a tax lump at
 *      forgiveness); marking a crossing that later reverses would put the ▲
 *      years before the point it actually describes.
 *
 * Returns `null` when any condition fails. A missing ▲ costs a user nothing;
 * a misplaced one is a false statement.
 */
export function findCrossover(
  candidate: PlanResult,
  reference: PlanResult,
): Crossover | null {
  if (candidate.planId === reference.planId) return null;

  const horizon = pairHorizon(candidate, reference);
  const a = cumulativeCostSeries(candidate, horizon);
  const b = cumulativeCostSeries(reference, horizon);

  // (1) does it actually end up costing more?
  const finalA = a[horizon] ?? 0;
  const finalB = b[horizon] ?? 0;
  if (finalA <= finalB) return null;

  // (3) the last month at which the candidate was NOT ahead. Both series are
  // 0 at month 0, so this always terminates at or above 0.
  let lastBehind = 0;
  for (let m = horizon; m >= 0; m--) {
    if ((a[m] ?? 0) <= (b[m] ?? 0)) {
      lastBehind = m;
      break;
    }
  }
  const month = lastBehind + 1;
  if (month > horizon) return null;

  // (2) was it ever strictly the cheaper one?
  let peakLead = 0;
  let peakLeadMonth = 0;
  for (let m = 1; m < month; m++) {
    const lead = (b[m] ?? 0) - (a[m] ?? 0);
    if (lead > peakLead) {
      peakLead = lead;
      peakLeadMonth = m;
    }
  }
  if (peakLead <= 0) return null;

  return {
    planId: candidate.planId,
    againstPlanId: reference.planId,
    month,
    date: candidate.schedule[month - 1]?.date ?? reference.schedule[month - 1]?.date ?? null,
    costAtCrossover: a[month] ?? 0,
    peakLead,
    peakLeadMonth,
    finalGap: finalA - finalB,
  };
}

/**
 * Every plan in `plans` that starts cheaper than `referenceId` and ends dearer,
 * keyed by plan. The reference itself never appears.
 */
export function findCrossoversAgainst(
  plans: readonly PlanResult[],
  referenceId: PlanId,
): Map<PlanId, Crossover> {
  const out = new Map<PlanId, Crossover>();
  const reference = plans.find((p) => p.planId === referenceId);
  if (!reference) return out;
  for (const plan of plans) {
    const crossover = findCrossover(plan, reference);
    if (crossover) out.set(plan.planId, crossover);
  }
  return out;
}

/**
 * The one crossover worth naming in a sentence: the earliest, and among ties
 * the one with the largest final gap — the biggest surprise, soonest.
 */
export function headlineCrossover(crossovers: Iterable<Crossover>): Crossover | null {
  let best: Crossover | null = null;
  for (const c of crossovers) {
    if (
      best === null ||
      c.month < best.month ||
      (c.month === best.month && c.finalGap > best.finalGap)
    ) {
      best = c;
    }
  }
  return best;
}

/* ========================================================================== *
 * Horizon, ticks, sampling
 * ========================================================================== */

/** Hard ceiling: the product simulates up to 30 years and no further. */
export const MAX_HORIZON_MONTHS = 360;
/** Floor, so a three-year Standard schedule doesn't render as one squashed inch. */
export const MIN_HORIZON_MONTHS = 120;

/**
 * The shared time axis. Long enough to contain the slowest plan, never longer
 * than 30 years, never so short that the fan-out is invisible.
 */
export function forkHorizonMonths(plans: readonly PlanResult[]): number {
  let longest = 0;
  for (const plan of plans) {
    longest = Math.max(longest, plan.monthsToResolution, plan.schedule.length);
  }
  return Math.min(MAX_HORIZON_MONTHS, Math.max(MIN_HORIZON_MONTHS, longest));
}

/** The tallest lifetime cost on the axis. */
export function forkMaxCost(plans: readonly PlanResult[]): Cents {
  let max = 0;
  for (const plan of plans) max = Math.max(max, plan.totalLifetimeCost);
  return max;
}

/** Whole years to rule the time axis at: `[0, 5, 10, …]`, always including 0. */
export function forkYearTicks(horizonMonths: number): number[] {
  const years = Math.max(1, Math.ceil(horizonMonths / 12));
  const step = years <= 6 ? 1 : years <= 12 ? 2 : years <= 32 ? 5 : 10;
  const out: number[] = [];
  for (let y = 0; y <= years; y += step) out.push(y);
  return out;
}

/**
 * The months at which a track is sampled into a path. Always includes the
 * origin, the resolution month, the month before it (so a tax lump renders as
 * the near-vertical riser it is rather than a long diagonal), and every month
 * where the payment amount changes — the kinks a uniform sample would smooth
 * away. A uniform sample fills the gaps.
 */
export function sampleMonths(
  plan: PlanResult,
  horizonMonths: number,
  maxPoints = 150,
): number[] {
  const end = Math.min(
    Math.max(0, Math.trunc(horizonMonths)),
    Math.max(1, plan.monthsToResolution || plan.schedule.length),
  );
  if (end <= 1) return [0, Math.max(1, end)];

  const uniform = new Set<number>([0, end - 1, end]);
  const step = Math.max(1, Math.ceil(end / Math.max(2, maxPoints)));
  for (let m = step; m < end; m += step) uniform.add(m);

  const kinks = new Set<number>(uniform);
  let previous = plan.schedule[0]?.payment;
  for (let m = 2; m <= end; m++) {
    const payment = plan.schedule[m - 1]?.payment;
    if (payment !== previous) {
      kinks.add(m - 1);
      kinks.add(m);
      previous = payment;
    }
  }

  // A schedule that changes every single month (monthly income growth) would
  // blow the point budget; fall back to the uniform sample rather than emit a
  // 360-point path per track.
  const chosen = kinks.size > maxPoints * 2 ? uniform : kinks;
  return [...chosen].sort((x, y) => x - y);
}

/* ========================================================================== *
 * Track styling — distinguishable without colour
 * ========================================================================== */

/**
 * Eight dash patterns, all visibly different at 1.6px. The recommended plan is
 * the only solid track and the only one in `--signal`; every other track is
 * `--ink` with its own pattern, so the picture survives greyscale, projection
 * and every form of colour blindness. Nine plans means at most eight
 * non-recommended tracks, so the list never has to repeat.
 */
export const TRACK_DASHES = [
  "6 4",
  "2 3",
  "12 4 2 4",
  "1 3",
  "10 4",
  "4 3 1 3",
  "16 5",
  "3 3 1 3 1 3",
] as const;

/** `rank` counts only the non-recommended tracks, top to bottom. */
export function trackDash(rank: number, isWinner: boolean): string {
  if (isWinner) return "";
  const i = ((Math.trunc(rank) % TRACK_DASHES.length) + TRACK_DASHES.length) % TRACK_DASHES.length;
  return TRACK_DASHES[i] ?? TRACK_DASHES[0];
}

export const TRACK_WIDTH_WINNER = 2.6;
export const TRACK_WIDTH = 1.6;
export const TRACK_WIDTH_EMPHASIS = 1.3;

export function trackWidth(isWinner: boolean, emphasised: boolean): number {
  return (isWinner ? TRACK_WIDTH_WINNER : TRACK_WIDTH) + (emphasised ? TRACK_WIDTH_EMPHASIS : 0);
}

/* ========================================================================== *
 * Layout
 * ========================================================================== */

export type ForkOrientation = "horizontal" | "vertical";

export interface ForkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ForkPoint {
  x: number;
  y: number;
}

export interface ForkLayout {
  orientation: ForkOrientation;
  /** viewBox dimensions. The SVG scales uniformly; these are not pixels. */
  width: number;
  height: number;
  plot: ForkRect;
  horizonMonths: number;
  /** Domain maximum after `.nice()` — the value the top gridline sits at. */
  costMax: Cents;
  costTicks: Cents[];
  yearTicks: number[];
  /** Time axis position (x when horizontal, y when vertical). */
  time(month: number): number;
  /** Cost axis position (y when horizontal, x when vertical). */
  cost(cents: Cents): number;
  point(month: number, cents: Cents): ForkPoint;
  /** Inverse of `time`, clamped to the horizon and rounded to a whole month. */
  monthAt(x: number, y: number): number;
  /** The cross-axis coordinate of a point — the one that separates tracks. */
  crossOf(point: ForkPoint): number;
  /** Minimum gap between two direct labels, in viewBox units. */
  labelGap: number;
}

const HORIZONTAL = {
  width: 880,
  padTop: 16,
  padBottom: 34,
  gutterLeft: 62,
  // Wide enough for a dash swatch, then "Standard 10-year" above
  // "● $156,618 forgiven" at 10px: the tracks are labelled directly, so there
  // is no legend to fall back on.
  gutterRight: 208,
  // Divergence is the whole subject, and vertical room is what shows it. A
  // 610 × 470 plot is close to 4:3 — wide enough to read as a timeline, tall
  // enough that nine tracks separate instead of shearing into a single band.
  plotHeight: 470,
  costTickCount: 4,
  labelGap: 30,
} as const;

const VERTICAL = {
  width: 356,
  padTop: 34,
  padBottom: 14,
  gutterLeft: 40,
  gutterRight: 14,
  plotHeight: 440,
  // Three steps, not four: any more and the $-labels collide across 302 units.
  costTickCount: 3,
  labelGap: 16,
} as const;

/**
 * Build the coordinate system. Orientation flips which axis carries time:
 * horizontally time runs left→right (the ruled 30-year timeline); vertically
 * it runs top→bottom, which is the only way one shared, diverging axis fits a
 * 375px screen without a horizontal scrollbar.
 */
export function forkLayout(
  orientation: ForkOrientation,
  horizonMonths: number,
  maxCost: Cents,
): ForkLayout {
  const c = orientation === "horizontal" ? HORIZONTAL : VERTICAL;
  const horizon = Math.max(1, Math.trunc(horizonMonths));

  const plot: ForkRect = {
    x: c.gutterLeft,
    y: c.padTop,
    width: Math.max(1, c.width - c.gutterLeft - c.gutterRight),
    height: c.plotHeight,
  };
  const height = c.padTop + c.plotHeight + c.padBottom;

  const costScale = scaleLinear()
    .domain([0, Math.max(1, maxCost)])
    .nice(c.costTickCount);
  const costTicks = costScale.ticks(c.costTickCount);
  const costMax = costScale.domain()[1] ?? Math.max(1, maxCost);

  const timeScale = scaleLinear().domain([0, horizon]);

  if (orientation === "horizontal") {
    timeScale.range([plot.x, plot.x + plot.width]);
    costScale.range([plot.y + plot.height, plot.y]);
  } else {
    timeScale.range([plot.y, plot.y + plot.height]);
    costScale.range([plot.x, plot.x + plot.width]);
  }

  const time = (month: number): number => timeScale(month);
  const cost = (cents: Cents): number => costScale(cents);

  const point =
    orientation === "horizontal"
      ? (month: number, cents: Cents): ForkPoint => ({ x: time(month), y: cost(cents) })
      : (month: number, cents: Cents): ForkPoint => ({ x: cost(cents), y: time(month) });

  const monthAt = (x: number, y: number): number => {
    const raw = timeScale.invert(orientation === "horizontal" ? x : y);
    if (!Number.isFinite(raw)) return 0;
    return Math.min(horizon, Math.max(0, Math.round(raw)));
  };

  return {
    orientation,
    width: c.width,
    height,
    plot,
    horizonMonths: horizon,
    costMax,
    costTicks,
    yearTicks: forkYearTicks(horizon),
    time,
    cost,
    point,
    monthAt,
    crossOf: orientation === "horizontal" ? (p) => p.y : (p) => p.x,
    labelGap: c.labelGap,
  };
}

/** `M x y L x y …` for one track. Empty string when there is nothing to draw. */
export function trackPath(
  layout: ForkLayout,
  months: readonly number[],
  series: readonly Cents[],
): string {
  let out = "";
  for (let i = 0; i < months.length; i++) {
    const month = months[i];
    if (month === undefined) continue;
    const p = layout.point(month, series[month] ?? 0);
    out += `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    if (i < months.length - 1) out += " ";
  }
  return out;
}

/* ========================================================================== *
 * Direct labels
 * ========================================================================== */

/**
 * Length of the dash swatch that stands in front of every direct label, in
 * viewBox units. Long enough to show two repeats of the longest pattern
 * (`16 5`), which is what makes the swatch identify a track rather than merely
 * decorate a label.
 */
export const SWATCH_LENGTH = 14;

/** Two marks closer than this read as one blot rather than as two facts. */
export const MARKER_MIN_GAP = 11;

/**
 * Push a set of desired label positions apart until none overlap, moving each
 * as little as possible and keeping every label inside `[min, max]`.
 *
 * Direct labels are what let the Fork drop a colour-keyed legend, so they have
 * to be legible even when three plans resolve within a month of each other.
 * Returns positions in the same order as `desired`.
 */
export function deconflictLabels(
  desired: readonly number[],
  minGap: number,
  min: number,
  max: number,
): number[] {
  const n = desired.length;
  if (n === 0) return [];

  const order = desired
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value || a.index - b.index);

  const placed = new Array<number>(n).fill(0);

  // Forward sweep: nothing may sit above the previous label's floor.
  let previous = Number.NEGATIVE_INFINITY;
  for (const item of order) {
    const at = Math.max(item.value, min, previous + minGap);
    placed[item.index] = at;
    previous = at;
  }

  // Backward sweep: if the stack overflowed the bottom, press it back up.
  let next = Number.POSITIVE_INFINITY;
  for (let i = n - 1; i >= 0; i--) {
    const item = order[i];
    if (!item) continue;
    const at = Math.min(placed[item.index] ?? item.value, max, next - minGap);
    placed[item.index] = at;
    next = at;
  }

  // The backward sweep can push the top label above `min` when there is simply
  // not enough room for every label; clamping keeps them on the canvas even
  // though they will then be tighter than `minGap`.
  for (let i = 0; i < n; i++) {
    placed[i] = Math.min(max, Math.max(min, placed[i] ?? min));
  }
  return placed;
}

/* ========================================================================== *
 * Marker collisions
 * ========================================================================== */

/**
 * Pull a set of same-kind markers apart so a cluster reads as several marks
 * rather than one blot.
 *
 * Markers move along the **cost** axis only. The time axis carries the claim —
 * "this is the month it crossed" — so it stays exact to the pixel; a ▲ drawn a
 * little clear of its curve still points at the right month, a ▲ drawn a month
 * late does not. That is the axis of least harm.
 *
 * Horizontally the nudge runs upward, because the ▲ is already drawn above its
 * point and lifting it further takes it off the curves rather than across them.
 * Vertically it runs right, away from the cost-axis labels.
 *
 * Marks far apart in time cannot collide, so only runs that are within
 * `minGap` on the time axis are separated; everything else is returned exactly
 * where it was. Returns points in the input order.
 */
export function deconflictMarkers(
  points: readonly ForkPoint[],
  layout: ForkLayout,
  minGap: number = MARKER_MIN_GAP,
): ForkPoint[] {
  const out = points.map((p) => ({ x: p.x, y: p.y }));
  if (points.length < 2) return out;

  const isH = layout.orientation === "horizontal";
  const { plot } = layout;
  const timeOf = (p: ForkPoint): number => (isH ? p.x : p.y);
  const costOf = (p: ForkPoint): number => (isH ? p.y : p.x);
  const direction = isH ? -1 : 1;
  const lo = isH ? plot.y : plot.x;
  const hi = isH ? plot.y + plot.height : plot.x + plot.width;
  const min = direction < 0 ? -hi : lo;
  const max = direction < 0 ? -lo : hi;

  const order = points
    .map((p, index) => ({ p, index }))
    .sort((a, b) => timeOf(a.p) - timeOf(b.p) || a.index - b.index);

  let start = 0;
  while (start < order.length) {
    let end = start + 1;
    while (end < order.length) {
      const here = order[end];
      const before = order[end - 1];
      if (!here || !before || timeOf(here.p) - timeOf(before.p) >= minGap) break;
      end++;
    }

    if (end - start > 1) {
      const run = order.slice(start, end);
      const signed = run.map((m) => direction * costOf(m.p));
      const placed = deconflictLabels(signed, minGap, min, max);
      run.forEach((m, k) => {
        const at = direction * (placed[k] ?? signed[k] ?? 0);
        const target = out[m.index];
        if (!target) return;
        if (isH) target.y = at;
        else target.x = at;
      });
    }
    start = end;
  }
  return out;
}

/**
 * `keep[i]` is false when marker `i` sits close enough to an earlier kept
 * marker of the same kind to be indistinguishable from it.
 *
 * For marks that cannot be moved without lying — a ● sits at the month
 * forgiveness lands and at the total the ledger prints — suppression is the
 * only honest deconfliction: three ticks inside 6px already render as one
 * thick tick, so drawing one of them loses nothing a reader could see. The
 * suppressed plans keep their direct label, their row in the readout, and
 * their full entry in the screen-reader table, so no fact leaves the page.
 *
 * Input order is the priority order: pass the recommended plan first and its
 * mark is the one that survives.
 */
export function suppressCollidingMarkers(
  points: readonly ForkPoint[],
  minGap: number = MARKER_MIN_GAP,
): boolean[] {
  const keep = new Array<boolean>(points.length).fill(true);
  const kept: ForkPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!p) {
      keep[i] = false;
      continue;
    }
    const clash = kept.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minGap);
    if (clash) keep[i] = false;
    else kept.push(p);
  }
  return keep;
}
