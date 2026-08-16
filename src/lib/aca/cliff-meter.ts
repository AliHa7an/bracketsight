/**
 * Geometry for the Cliff Meter — Bracketsight's signature visual.
 *
 * Pure functions and two fixed layouts, kept out of the component so the
 * drawing and its screen-reader table are provably reading the same numbers.
 * `d3-scale` supplies the linear scales and nothing else: there is no charting
 * library in this codebase, by design.
 *
 * The one idea the drawing has to carry: the premium tax credit is a **shelf**
 * that ends in a sheer face. Every other decision here serves that reading —
 * the filled area is the ground you stand on, the 250% cost-sharing boundary
 * is a smaller ledge below it, and past 400% of the federal poverty line there
 * is nothing at all.
 */

import { scaleLinear } from "d3-scale";
import type { Cents, Household } from "@/engines/aca";
import { ptcAtMagi } from "@/engines/aca";
import type { RuleSet } from "@/engines/aca";

/** The gauge always spans the same range, whatever the household. */
export const PCT_MIN = 100;
export const PCT_MAX = 450;
/**
 * The cliff, as an axis position. Form 8962 Worksheet 2 tests "more than
 * 4.0 × FPL" before it truncates anything, so 400.99% is 401 and ineligible —
 * the drawn edge is exactly 400%, with no grace band beyond it.
 */
export const CLIFF_PCT = 400;
/** The cost-sharing ledge. */
export const CSR_PCT = 250;

export type MeterVariant = "wide" | "narrow";

export interface MeterLayout {
  variant: MeterVariant;
  width: number;
  height: number;
  /** Left and right edges of the plotted gauge. */
  left: number;
  right: number;
  /** Top of the credit curve's box, and the $0 baseline it falls to. */
  curveTop: number;
  axisY: number;
  /** Where the axis tick labels sit. */
  tickLabelY: number;
  /** The dimension line stating the distance to the edge, in dollars. */
  dimY: number;
  /** First lever arrow, and the gap between them. */
  leverTop: number;
  leverGap: number;
  /** How many lever arrows this layout has room for. */
  leverSlots: number;
  ticks: number[];
  font: { tick: number; label: number; note: number };
}

const WIDE: MeterLayout = {
  variant: "wide",
  width: 720,
  height: 358,
  left: 54,
  right: 688,
  curveTop: 44,
  axisY: 194,
  tickLabelY: 210,
  dimY: 254,
  leverTop: 286,
  leverGap: 26,
  leverSlots: 3,
  ticks: [100, 150, 200, 250, 300, 350, 400, 450],
  font: { tick: 11, label: 12, note: 10.5 },
};

const NARROW: MeterLayout = {
  variant: "narrow",
  width: 340,
  height: 306,
  left: 26,
  right: 326,
  curveTop: 40,
  axisY: 168,
  tickLabelY: 184,
  dimY: 226,
  leverTop: 258,
  leverGap: 24,
  leverSlots: 2,
  ticks: [100, 200, 300, 400],
  font: { tick: 10, label: 11, note: 9.5 },
};

export function meterLayout(variant: MeterVariant): MeterLayout {
  return variant === "wide" ? WIDE : NARROW;
}

export interface MeterScales {
  /** % of FPL → x. */
  x: (pct: number) => number;
  /** annual credit in cents → y. */
  y: (credit: Cents) => number;
  /** The tallest credit on the gauge — the scale's own ceiling. */
  peak: Cents;
}

export interface CreditCurve {
  /** Sampled [pct, annual credit] pairs from 100% up to the edge. */
  points: [number, Cents][];
  /** The credit still standing at 400% FPL — the height of the drop. */
  edgeCredit: Cents;
  peak: Cents;
}

/**
 * The curve, computed from the engine at every 2% of FPL. The vertical fall at
 * 400% is not a drawing trick: the last sample sits at the edge and the credit
 * one percent later is zero, because that is what §36B says for 2026.
 */
export function creditCurve(
  fpl: Cents,
  household: Household,
  rules: RuleSet,
  stepPct = 2,
): CreditCurve {
  const points: [number, Cents][] = [];
  for (let pct = PCT_MIN; pct <= CLIFF_PCT; pct += stepPct) {
    const magi = Math.round((pct / 100) * fpl);
    points.push([pct, ptcAtMagi(magi, household, rules)]);
  }
  const last = points[points.length - 1];
  if (!last || last[0] !== CLIFF_PCT) {
    points.push([CLIFF_PCT, ptcAtMagi(Math.round((CLIFF_PCT / 100) * fpl), household, rules)]);
  }
  const edgeCredit = points[points.length - 1]?.[1] ?? 0;
  const peak = Math.max(...points.map((p) => p[1]), 1);
  return { points, edgeCredit, peak };
}

export function meterScales(layout: MeterLayout, peak: Cents): MeterScales {
  const x = scaleLinear().domain([PCT_MIN, PCT_MAX]).range([layout.left, layout.right]);
  const y = scaleLinear().domain([0, peak]).range([layout.axisY, layout.curveTop]);
  return { x: (pct) => x(pct), y: (credit) => y(credit), peak };
}

/** The credit line itself: the shelf, then the sheer face down to nothing. */
export function shelfPath(curve: CreditCurve, s: MeterScales): string {
  const head = curve.points
    .map(([pct, v], i) => `${i === 0 ? "M" : "L"}${s.x(pct).toFixed(2)},${s.y(v).toFixed(2)}`)
    .join("");
  return head;
}

/** The ground under the shelf — a filled body, so the face reads as a drop. */
export function shelfAreaPath(curve: CreditCurve, s: MeterScales, layout: MeterLayout): string {
  return `${shelfPath(curve, s)}L${s.x(CLIFF_PCT).toFixed(2)},${layout.axisY}L${s
    .x(PCT_MIN)
    .toFixed(2)},${layout.axisY}Z`;
}

/** Where a household sits on the gauge, clamped to the drawn range. */
export function positionPct(fplBps: number): number {
  return Math.min(Math.max(fplBps / 100, PCT_MIN), PCT_MAX);
}

/**
 * The marker's height at a given position: on the shelf while the household is
 * under the edge, on the ground the moment it is past it. This is the function
 * that makes the signature animation fall off the cliff rather than merely
 * slide past it.
 */
export function creditAtPct(curve: CreditCurve, pct: number): Cents {
  if (pct > CLIFF_PCT) return 0;
  const pts = curve.points;
  let lo = pts[0];
  if (!lo) return 0;
  for (let i = 1; i < pts.length; i += 1) {
    const hi = pts[i];
    if (!hi) break;
    if (pct <= hi[0]) {
      const span = hi[0] - lo[0];
      const t = span === 0 ? 0 : (pct - lo[0]) / span;
      return Math.round(lo[1] + (hi[1] - lo[1]) * t);
    }
    lo = hi;
  }
  return lo[1];
}
