"use client";

/**
 * The Fork — the signature visual.
 *
 * One ruled timeline of up to 30 years, one track per eligible plan. Every
 * track starts at the same point — month 0, $0 spent — and the picture is the
 * fan-out from there. The vertical axis is **cumulative lifetime cost**, the
 * engine's own ranking key, so the track that sits lowest at the right-hand
 * edge is the plan the ledger table recommends, and the tracks that climb past
 * it are the plans whose smaller monthly payment quietly costs more. Time is
 * the axis on which these plans differ; this is the drawing that says so.
 *
 * Markers, and nothing else:
 *   ●  forgiveness, with the amount forgiven
 *   ▲  the crossover: the month a cheaper monthly payment became the costlier
 *      lifetime total, and stayed that way (see `findCrossover` — the rule is
 *      strict, because a misplaced ▲ is a false claim about someone's money)
 *   ✕  in `--flag`, one per irreversible decision. Nothing else on this
 *      component is ever oxide.
 *
 * Interaction:
 *   • Scrub the axis (M4) — drag, or ←/→ a month, shift+←/→ a year, Home/End
 *     to the extremes — and every figure for every plan updates to that month.
 *   • Hover or focus a track and its payment, balance and waived interest for
 *     that month appear beside it.
 *   • On first render only, the tracks draw out over 700ms and the markers land
 *     last, so the divergence is witnessed rather than presented. It never
 *     replays on a recalculation, and is skipped under reduced motion.
 *   • At 375px the timeline turns through 90°: time runs down the page,
 *     tracks fan out to the right, markers unchanged.
 *
 * Hand-rolled SVG and `d3-scale`. No charting library. Geometry, sampling and
 * crossover detection are pure functions in `src/lib/fork.ts`, unit-tested.
 * A real `<table>` carries the same milestones for screen readers; both it and
 * the drawing read from the same computed tracks, so they cannot disagree.
 */

import * as React from "react";
import type { PlanId, PlanResult, SimulationResult, Warning } from "@/engines/repayment";
import { PLAN_NAMES } from "@/engines/repayment";
import { LiveNumber } from "@/components/ui";
import { ScrubTrack } from "@/components/ui";
import { durationLabel, monthLabel, usd, usdExact } from "@/components/ui";
import { DUR_SIGNATURE, easeAtlas, prefersReducedMotion } from "@/components/ui";
import {
  balanceAt,
  cumulativeCostSeries,
  cumulativePaidSeries,
  deconflictLabels,
  deconflictMarkers,
  findCrossoversAgainst,
  forkHorizonMonths,
  forkLayout,
  forkMaxCost,
  headlineCrossover,
  interestWaivedSeries,
  paymentAt,
  sampleMonths,
  suppressCollidingMarkers,
  trackDash,
  trackPath,
  type Crossover,
  type ForkLayout,
  type ForkPoint,
} from "@/lib/loans/fork";

/* -------------------------------------------------------------------------- *
 * Props
 * -------------------------------------------------------------------------- */

export interface ForkTimelineProps {
  /** The eligible plans, ordered as they should be labelled — cheapest first. */
  plans: PlanResult[];
  /**
   * The whole simulation, when the caller has it. Supplies the irreversible
   * warnings that earn a ✕ and nothing else; the drawing is built from `plans`.
   */
  result?: SimulationResult;
  /** The recommended plan. Defaults to the cheapest lifetime cost in `plans`. */
  winnerId?: PlanId;
  /**
   * A crossover the caller already computed. Advisory only: the Fork derives
   * every crossover itself from the same `findCrossover`, so this is used only
   * to name one in the caption when the caller has a preference.
   */
  crossover?: Crossover | null;
  /** Convenience for the single warning that usually earns a ✕. */
  oneWayDoorWarning?: Warning;
  /** Any further warnings; only `severity: "IRREVERSIBLE"` draws a ✕. */
  warnings?: readonly Warning[];
  className?: string;
}

/* -------------------------------------------------------------------------- *
 * Internal model
 * -------------------------------------------------------------------------- */

interface Track {
  plan: PlanResult;
  planId: PlanId;
  name: string;
  isWinner: boolean;
  /** stroke-dasharray; "" only for the recommended plan. */
  dash: string;
  stroke: string;
  /** Last month the track is drawn to — where the plan resolves. */
  end: number;
  /** False if the plan is still being repaid when the axis runs out. */
  resolvesOnAxis: boolean;
  /** Sampled months, for the path. */
  months: number[];
  /** cumulative lifetime cost by month */
  cost: number[];
  /** cumulative payments by month */
  paid: number[];
  /** cumulative interest waived by month */
  waived: number[];
  crossover: Crossover | null;
  irreversible: Warning | null;
}

/** Formatters are given fractional values mid-tween, so they round first. */
const money = (n: number): string => usd(Math.round(n));
const moneyExact = (n: number): string => usdExact(Math.round(n));

/** The draw finishes at 80% of the signature, leaving 20% for the markers. */
const DRAW_PHASE = 0.8;

/* -------------------------------------------------------------------------- *
 * Track weight
 *
 * The recommended plan is the only solid track and the only one in `--signal`;
 * every other track is `--ink` with its own dash pattern, so the picture
 * survives greyscale, projection and every form of colour blindness.
 *
 * Non-winners were drawn at 1.6 viewBox units, which is a hairline once the
 * 880-unit board is scaled down — the signature element read as an empty
 * frame with one green line in it. At 2.0 the eight patterns carry their own
 * weight while the winner still leads on all three cues at once: it is
 * thicker, solid, and the only coloured track. Hover adds 1.3 so an
 * interrogated track outranks even the winner, which is the point of hovering.
 *
 * These live here rather than in `src/lib/loans/fork.ts` because they are a
 * drawing decision, not geometry: nothing about the crossover arithmetic, the
 * sampling or the layout changes with them.
 * -------------------------------------------------------------------------- */
const TRACK_W_WINNER = 2.6;
const TRACK_W_OTHER = 2;
const TRACK_W_EMPHASIS = 1.3;

function trackStroke(isWinner: boolean, emphasised: boolean): number {
  return (isWinner ? TRACK_W_WINNER : TRACK_W_OTHER) + (emphasised ? TRACK_W_EMPHASIS : 0);
}

/**
 * Length of the dash swatch in front of a direct label, in viewBox units.
 *
 * 24, not 14. The longest pattern is `16 5`, so a 14-unit swatch rendered it
 * as an unbroken line — PAYE's key was indistinguishable from the winner's
 * solid track except by colour, which is the one cue the dash patterns exist
 * to avoid depending on. 24 shows 16 on, 5 off, 3 on: unmistakably a long
 * dash. It is also the width of the swatch in the readout table below, so the
 * two keys for the same track are now literally the same drawing.
 */
const PLOT_SWATCH_LENGTH = 24;
/** The same key in the readout table, in CSS pixels. */
const ROW_SWATCH_LENGTH = 24;

/**
 * What sits at the end of a track. `open` means the axis ran out first — it
 * gets a continuation caret, never a ● or a "paid in full" tick, which would
 * be a claim about an outcome the drawing has not reached.
 */
type TerminalKind = "forgiven" | "paid" | "open";
const TERMINAL_KINDS: readonly TerminalKind[] = ["forgiven", "paid", "open"];

function terminalKind(track: Track): TerminalKind {
  if (!track.resolvesOnAxis) return "open";
  return track.plan.totalForgiven > 0 ? "forgiven" : "paid";
}

/** A marker's place on its own track, clamped to where the track stops. */
function markerPoint(layout: ForkLayout, track: Track, month: number): ForkPoint {
  const m = Math.min(month, track.end);
  return layout.point(m, track.cost[m] ?? 0);
}

/* -------------------------------------------------------------------------- *
 * The component
 * -------------------------------------------------------------------------- */

export function ForkTimeline({
  plans,
  result,
  winnerId,
  crossover,
  oneWayDoorWarning,
  warnings,
  className,
}: ForkTimelineProps) {
  const uid = React.useId().replace(/:/g, "");

  const winner = React.useMemo<PlanId | null>(() => {
    if (winnerId && plans.some((p) => p.planId === winnerId)) return winnerId;
    const cheapest = plans.reduce<PlanResult | null>(
      (best, p) => (best === null || p.totalLifetimeCost < best.totalLifetimeCost ? p : best),
      null,
    );
    return cheapest?.planId ?? null;
  }, [plans, winnerId]);

  const horizon = React.useMemo(() => forkHorizonMonths(plans), [plans]);
  const maxCost = React.useMemo(() => forkMaxCost(plans), [plans]);

  /** One ✕ per plan carrying an irreversible decision. Never anything softer. */
  const irreversibleByPlan = React.useMemo(() => {
    const map = new Map<PlanId, Warning>();
    const pool: Warning[] = [
      ...(warnings ?? []),
      ...(result?.globalWarnings ?? []),
      ...plans.flatMap((p) => p.warnings),
    ];
    if (oneWayDoorWarning) pool.push(oneWayDoorWarning);
    for (const w of pool) {
      if (w.severity === "IRREVERSIBLE" && w.planId && !map.has(w.planId)) map.set(w.planId, w);
    }
    return map;
  }, [warnings, result, plans, oneWayDoorWarning]);

  const crossovers = React.useMemo(
    () => (winner ? findCrossoversAgainst(plans, winner) : new Map<PlanId, Crossover>()),
    [plans, winner],
  );

  const tracks = React.useMemo<Track[]>(() => {
    let rank = 0;
    return plans.map((plan) => {
      const isWinner = plan.planId === winner;
      const dash = trackDash(isWinner ? 0 : rank++, isWinner);
      const resolution = Math.max(1, plan.monthsToResolution || plan.schedule.length);
      return {
        plan,
        planId: plan.planId,
        name: PLAN_NAMES[plan.planId],
        isWinner,
        dash,
        stroke: isWinner ? "var(--signal)" : "var(--ink)",
        end: Math.min(horizon, resolution),
        resolvesOnAxis: resolution <= horizon,
        months: sampleMonths(plan, horizon),
        cost: cumulativeCostSeries(plan, horizon),
        paid: cumulativePaidSeries(plan, horizon),
        waived: interestWaivedSeries(plan, horizon),
        crossover: crossovers.get(plan.planId) ?? null,
        irreversible: irreversibleByPlan.get(plan.planId) ?? null,
      };
    });
  }, [plans, winner, horizon, crossovers, irreversibleByPlan]);

  const headline = React.useMemo(
    () => headlineCrossover(crossovers.values()) ?? crossover ?? null,
    [crossovers, crossover],
  );

  /**
   * The scrub opens on the crossover — the month the product exists to show —
   * falling back to the end of the axis. `null` means "untouched", so the
   * opening month follows a recalculation until the user takes hold of it.
   */
  const [scrubbed, setScrubbed] = React.useState<number | null>(null);
  const openingMonth = headline?.month ?? horizon;
  const month = Math.min(horizon, Math.max(1, scrubbed ?? openingMonth));

  const [hovered, setHovered] = React.useState<PlanId | null>(null);
  const [pinned, setPinned] = React.useState<PlanId | null>(null);
  const emphasised = hovered ?? pinned;

  const horizontal = React.useMemo(
    () => forkLayout("horizontal", horizon, maxCost),
    [horizon, maxCost],
  );
  const vertical = React.useMemo(() => forkLayout("vertical", horizon, maxCost), [horizon, maxCost]);

  if (plans.length === 0 || winner === null) return null;

  const plotProps = {
    tracks,
    month,
    emphasised,
    onScrub: setScrubbed,
    onEmphasise: setHovered,
  };

  const scrubLabel = "Scrub the timeline";

  return (
    <figure className={className ? `m-0 ${className}` : "m-0"}>
      {/* Wide: the ruled 30-year timeline, read left to right. */}
      <div className="hidden sm:block">
        <ForkPlot {...plotProps} layout={horizontal} uid={`${uid}h`} />
        <div
          style={{
            marginLeft: `${(horizontal.plot.x / horizontal.width) * 100}%`,
            marginRight: `${((horizontal.width - horizontal.plot.x - horizontal.plot.width) / horizontal.width) * 100}%`,
          }}
        >
          <ScrubTrack
            months={horizon}
            value={month}
            onChange={setScrubbed}
            label={scrubLabel}
            renderTick={(m) => `Yr ${Math.round(m / 12)}`}
          />
        </div>
      </div>

      {/* Narrow: the same single timeline turned through 90°, so one axis of
          time still holds every track and the page never scrolls sideways. */}
      <div className="sm:hidden">
        <ForkPlot {...plotProps} layout={vertical} uid={`${uid}v`} />
        <ScrubTrack
          months={horizon}
          value={month}
          onChange={setScrubbed}
          label={scrubLabel}
          renderTick={(m) => `Yr ${Math.round(m / 12)}`}
        />
      </div>

      <ForkReadout
        tracks={tracks}
        month={month}
        emphasised={emphasised}
        pinned={pinned}
        onHover={setHovered}
        onPin={(id) => setPinned((current) => (current === id ? null : id))}
      />

      <ForkScreenReaderTable tracks={tracks} winner={winner} />

      {/* Last child, so it is a valid figcaption. */}
      <ForkLegend headline={headline} tracks={tracks} horizon={horizon} />
    </figure>
  );
}

/* -------------------------------------------------------------------------- *
 * The plot
 * -------------------------------------------------------------------------- */

interface ForkPlotProps {
  layout: ForkLayout;
  tracks: Track[];
  month: number;
  emphasised: PlanId | null;
  onScrub: (month: number) => void;
  onEmphasise: (planId: PlanId | null) => void;
  uid: string;
}

function ForkPlot({ layout, tracks, month, emphasised, onScrub, onEmphasise, uid }: ForkPlotProps) {
  const { plot, orientation } = layout;
  const isH = orientation === "horizontal";
  const revealRef = React.useRef<SVGRectElement | null>(null);
  const lateRef = React.useRef<SVGGElement | null>(null);
  const playedRef = React.useRef(false);

  const revealFull = isH ? plot.width + 6 : plot.height + 6;
  const revealAttr = isH ? "width" : "height";

  /**
   * The one orchestrated moment: tracks draw out, then the markers land.
   * `playedRef` is what keeps it from replaying — the component stays mounted
   * across recalculations, so a second draw would be noise rather than reveal.
   */
  React.useLayoutEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    const reveal = revealRef.current;
    const late = lateRef.current;
    if (!reveal || !late) return;

    const settle = (): void => {
      reveal.setAttribute(revealAttr, String(revealFull));
      late.style.opacity = "1";
    };

    if (prefersReducedMotion() || DUR_SIGNATURE <= 0) {
      settle();
      return;
    }

    reveal.setAttribute(revealAttr, "0");
    late.style.opacity = "0";

    const started = performance.now();
    let raf = 0;
    const step = (now: number): void => {
      const t = Math.min(1, (now - started) / DUR_SIGNATURE);
      reveal.setAttribute(revealAttr, String(revealFull * easeAtlas(Math.min(1, t / DRAW_PHASE))));
      late.style.opacity =
        t <= DRAW_PHASE ? "0" : String(Math.min(1, (t - DRAW_PHASE) / (1 - DRAW_PHASE)));
      if (t >= 1) {
        settle();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // Mount only. Deliberately not reactive: this fires once, ever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Pointer anywhere in the plot scrubs, and picks up the nearest track. */
  const handlePointer = (event: React.PointerEvent<SVGRectElement>): void => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const vx = ((event.clientX - box.left) / box.width) * layout.width;
    const vy = ((event.clientY - box.top) / box.height) * layout.height;

    const at = Math.max(1, layout.monthAt(vx, vy));
    onScrub(at);

    let nearest: PlanId | null = null;
    let best = Number.POSITIVE_INFINITY;
    const cursor = layout.crossOf({ x: vx, y: vy });
    for (const track of tracks) {
      const m = Math.min(at, track.end);
      const distance = Math.abs(layout.crossOf(layout.point(m, track.cost[m] ?? 0)) - cursor);
      if (distance < best) {
        best = distance;
        nearest = track.planId;
      }
    }
    onEmphasise(nearest);
  };

  // Direct labels: pushed apart along the time-invariant axis so nothing
  // overlaps. Both orientations run time down/along the y-of-the-label axis,
  // so labels are always deconflicted vertically.
  //
  // There are no leader lines. Tracks resolve at wildly different months —
  // Standard at year 10, Extended at year 25 — so nine hairlines drawn back
  // from a single label column fanned across the plot, crossed each other and
  // crossed the data: a web laid over the drawing. Two cues replace them, and
  // both are stronger. The column is ordered by final total, which is the
  // order the endpoints already sit in top to bottom; and each label is
  // preceded by a swatch of its own track — the exact stroke, dash array and
  // width — so the match is made on the pattern rather than traced along a
  // line. (Design review §7.12: this is the thing removed.)
  const swatchLength = isH ? PLOT_SWATCH_LENGTH : 12;
  const terminals = tracks.map((t) => layout.point(t.end, t.cost[t.end] ?? 0));
  const labelPositions = deconflictLabels(
    terminals.map((p) => p.y),
    layout.labelGap,
    plot.y + (isH ? 8 : 6),
    plot.y + plot.height,
  );
  const lastCostTick = layout.costTicks[layout.costTicks.length - 1];

  // Terminal marks sit on a fact — the month a plan resolves, at the total the
  // ledger prints — so they are never moved. When several land inside
  // `MARKER_MIN_GAP` they already render as one mark, and only one is drawn.
  // The recommended plan is sorted first, so its mark is never the one dropped.
  const terminalEntries = tracks.map((track, index) => ({
    track,
    index,
    point: terminals[index] ?? { x: 0, y: 0 },
    kind: terminalKind(track),
  }));
  const terminalShown = new Array<boolean>(tracks.length).fill(true);
  for (const kind of TERMINAL_KINDS) {
    const group = terminalEntries
      .filter((e) => e.kind === kind)
      .sort((a, b) => Number(b.track.isWinner) - Number(a.track.isWinner) || a.index - b.index);
    const keep = suppressCollidingMarkers(group.map((e) => e.point));
    group.forEach((e, i) => {
      if (keep[i] === false) terminalShown[e.index] = false;
    });
  }

  // ▲ and ✕ carry a month, not a total, so a crowded cluster is pulled apart
  // along the cost axis: the month each one names stays exact.
  const crossoverTracks = tracks.filter((t) => t.crossover !== null);
  const crossoverPoints = deconflictMarkers(
    crossoverTracks.map((t) => markerPoint(layout, t, t.crossover?.month ?? 1)),
    layout,
  );
  const doorTracks = tracks.filter((t) => t.irreversible !== null);
  // Placed a tenth of the way along, not at the shared origin: the ✕ has to
  // sit on an identifiable track, and at month 0 every track is the same point.
  const doorMonth = Math.max(1, Math.round(layout.horizonMonths * 0.1));
  const doorPoints = deconflictMarkers(
    doorTracks.map((t) => markerPoint(layout, t, doorMonth)),
    layout,
  );

  const focusTrack = emphasised === null ? null : tracks.find((t) => t.planId === emphasised);

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="block h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`fork-reveal-${uid}`}>
          <rect
            ref={revealRef}
            x={isH ? plot.x - 3 : 0}
            y={isH ? 0 : plot.y - 3}
            width={isH ? revealFull : layout.width}
            height={isH ? layout.height : revealFull}
          />
        </clipPath>
      </defs>

      {/* Cost gridlines — the ruling of the ledger. */}
      {layout.costTicks.map((tick) => {
        const from = layout.point(0, tick);
        const to = layout.point(layout.horizonMonths, tick);
        return (
          <g key={`cost-${tick}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--rule)"
              strokeWidth={1}
            />
            <text
              className="num"
              x={isH ? plot.x - 8 : layout.cost(tick)}
              y={isH ? layout.cost(tick) + 3.5 : plot.y - 10}
              textAnchor={
                isH ? "end" : tick === 0 ? "start" : tick === lastCostTick ? "end" : "middle"
              }
              fontSize={10}
              fill="var(--dim)"
            >
              {usd(tick)}
            </text>
          </g>
        );
      })}

      {/* Year ticks along the time axis. */}
      {layout.yearTicks.map((year) => {
        const at = layout.time(year * 12);
        if (year * 12 > layout.horizonMonths) return null;
        return (
          <g key={`yr-${year}`}>
            <line
              x1={isH ? at : plot.x - 4}
              y1={isH ? plot.y + plot.height : at}
              x2={isH ? at : plot.x}
              y2={isH ? plot.y + plot.height + 4 : at}
              stroke="var(--rule)"
              strokeWidth={1}
            />
            <text
              className="num"
              x={isH ? at : plot.x - 7}
              y={isH ? plot.y + plot.height + 16 : at + 3.5}
              textAnchor={isH ? "middle" : "end"}
              fontSize={10}
              fill="var(--dim)"
            >
              {year === 0 ? "0" : `Yr ${year}`}
            </text>
          </g>
        );
      })}

      {/* The tracks. */}
      <g clipPath={`url(#fork-reveal-${uid})`} fill="none" strokeLinecap="butt">
        {tracks.map((track) => (
          <path
            key={track.planId}
            d={trackPath(layout, track.months, track.cost)}
            stroke={track.stroke}
            strokeWidth={trackStroke(track.isWinner, track.planId === emphasised)}
            strokeDasharray={track.dash === "" ? undefined : track.dash}
          />
        ))}
      </g>

      {/* Hit surface: below the marker layer, which never takes the pointer. */}
      <rect
        x={plot.x}
        y={plot.y}
        width={plot.width}
        height={plot.height}
        fill="transparent"
        // Sideways drags scrub the horizontal timeline; the page still scrolls
        // vertically. On the vertical timeline both directions belong to the
        // page, so scrubbing there is the ScrubTrack's job.
        style={{ touchAction: isH ? "pan-y" : "auto" }}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => onEmphasise(null)}
      />

      {/* Everything that lands last. */}
      <g ref={lateRef} style={{ opacity: 1, pointerEvents: "none" }}>
        {/* The scrub guide and its per-track readings. */}
        <line
          x1={isH ? layout.time(month) : plot.x}
          y1={isH ? plot.y : layout.time(month)}
          x2={isH ? layout.time(month) : plot.x + plot.width}
          y2={isH ? plot.y + plot.height : layout.time(month)}
          stroke="var(--dim)"
          strokeWidth={1}
        />
        {tracks.map((track) => {
          const m = Math.min(month, track.end);
          const p = layout.point(m, track.cost[m] ?? 0);
          return (
            <circle
              key={`dot-${track.planId}`}
              cx={p.x}
              cy={p.y}
              r={track.planId === emphasised ? 3.6 : 2.6}
              fill="var(--paper)"
              stroke={track.stroke}
              strokeWidth={1.6}
            />
          );
        })}

        {tracks.map((track, i) => {
          const terminal = terminals[i];
          const labelAt = labelPositions[i];
          if (!terminal || labelAt === undefined) return null;
          // A track the axis outran has not resolved: it gets a continuation
          // caret, never a ● or a "paid in full" tick, which would be a claim
          // about an outcome the drawing has not reached.
          const kind = terminalKind(track);
          const shown = terminalShown[i] !== false;
          const emphasisWeight = track.planId === emphasised || track.isWinner ? 600 : 400;

          // Where the direct label sits: a column at the right of the wide
          // plot, or beside its endpoint on the narrow one. The swatch always
          // comes first in reading order, so it reads as the label's key.
          const toRight = isH || terminal.x <= plot.x + plot.width * 0.5;
          const anchor = toRight ? "start" : "end";
          const swatchX = isH
            ? plot.x + plot.width + 12
            : toRight
              ? terminal.x + 6
              : terminal.x - 6 - swatchLength;
          const textX = toRight ? swatchX + swatchLength + 5 : swatchX - 5;

          return (
            <g key={`end-${track.planId}`}>
              <line
                x1={swatchX}
                y1={labelAt}
                x2={swatchX + swatchLength}
                y2={labelAt}
                stroke={track.stroke}
                strokeWidth={trackStroke(track.isWinner, track.planId === emphasised)}
                strokeDasharray={track.dash === "" ? undefined : track.dash}
              />
              {shown && kind === "forgiven" && (
                <circle cx={terminal.x} cy={terminal.y} r={4} fill={track.stroke} />
              )}
              {shown && kind === "paid" && (
                <path
                  d={
                    isH
                      ? `M${terminal.x} ${terminal.y - 4.5} v9`
                      : `M${terminal.x - 4.5} ${terminal.y} h9`
                  }
                  stroke={track.stroke}
                  strokeWidth={2.4}
                />
              )}
              {shown && kind === "open" && (
                <path
                  d={
                    isH
                      ? `M${terminal.x - 4} ${terminal.y - 4} l4 4 l-4 4` // ›  time runs right
                      : `M${terminal.x - 4} ${terminal.y} l4 4 l4 -4` // ⌄  time runs down
                  }
                  stroke={track.stroke}
                  strokeWidth={2}
                  fill="none"
                />
              )}
              <text
                x={textX}
                y={labelAt + 3.5}
                textAnchor={anchor}
                fontSize={11}
                fontWeight={emphasisWeight}
                fill={track.isWinner ? "var(--signal)" : "var(--ink)"}
              >
                {track.name}
              </text>
              {isH && (
                <text
                  className="num"
                  x={textX}
                  y={labelAt + 15}
                  textAnchor={anchor}
                  fontSize={10}
                  fill="var(--dim)"
                >
                  {kind === "open"
                    ? "still repaying"
                    : kind === "forgiven"
                      ? `● ${usd(track.plan.totalForgiven)} forgiven`
                      : `${usd(track.plan.totalLifetimeCost)} total`}
                </text>
              )}
            </g>
          );
        })}

        {/* ▲ crossover — the cheaper payment became the costlier total. */}
        {crossoverTracks.map((track, i) => {
          const p = crossoverPoints[i];
          if (!p) return null;
          return (
            <path
              key={`x-${track.planId}`}
              d={`M${p.x} ${p.y - 7.5} l5.5 9.5 h-11 z`}
              fill="var(--ink)"
            />
          );
        })}

        {/* ✕ irreversible — oxide, and only ever here. */}
        {doorTracks.map((track, i) => {
          const p = doorPoints[i];
          if (!p) return null;
          return (
            <path
              key={`door-${track.planId}`}
              d={`M${p.x - 4.5} ${p.y - 4.5} l9 9 M${p.x + 4.5} ${p.y - 4.5} l-9 9`}
              stroke="var(--flag)"
              strokeWidth={2.2}
              fill="none"
            />
          );
        })}

        {focusTrack && <ForkCallout layout={layout} track={focusTrack} month={month} />}
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- *
 * Hover / focus callout
 * -------------------------------------------------------------------------- */

const CALLOUT_W = 156;

function ForkCallout({
  layout,
  track,
  month,
}: {
  layout: ForkLayout;
  track: Track;
  month: number;
}) {
  const m = Math.min(month, track.end);
  const anchor = layout.point(m, track.cost[m] ?? 0);
  const waived = track.waived[m] ?? 0;
  const resolved = month > track.end;
  const lines = 3 + (waived > 0 ? 1 : 0);
  const height = 16 + lines * 13;

  let x = anchor.x + 12;
  if (x + CALLOUT_W > layout.width - 2) x = anchor.x - 12 - CALLOUT_W;
  if (x < 2) x = 2;
  let y = anchor.y - height - 10;
  if (y < 2) y = anchor.y + 12;
  if (y + height > layout.height - 2) y = layout.height - 2 - height;

  const rows: Array<[string, string]> = [
    ["payment", resolved ? "resolved" : moneyExact(paymentAt(track.plan, m))],
    ["balance", resolved ? money(0) : money(balanceAt(track.plan, m))],
  ];
  if (waived > 0) rows.push(["waived", money(waived)]);
  rows.push(["paid", money(track.paid[m] ?? 0)]);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CALLOUT_W}
        height={height}
        rx={3}
        fill="var(--paper)"
        stroke="var(--rule)"
        strokeWidth={1}
      />
      <text
        x={x + 8}
        y={y + 14}
        fontSize={11}
        fontWeight={600}
        fill={track.isWinner ? "var(--signal)" : "var(--ink)"}
      >
        {track.name}
      </text>
      {rows.map(([label, value], i) => (
        <g key={label}>
          <text x={x + 8} y={y + 28 + i * 13} fontSize={10} fill="var(--dim)">
            {label}
          </text>
          <text
            className="num"
            x={x + CALLOUT_W - 8}
            y={y + 28 + i * 13}
            fontSize={10.5}
            textAnchor="end"
            fill="var(--ink)"
          >
            {value}
          </text>
        </g>
      ))}
    </g>
  );
}

/* -------------------------------------------------------------------------- *
 * The scrub readout — every figure, every track, at the scrubbed month
 * -------------------------------------------------------------------------- */

function ForkReadout({
  tracks,
  month,
  emphasised,
  pinned,
  onHover,
  onPin,
}: {
  tracks: Track[];
  month: number;
  emphasised: PlanId | null;
  pinned: PlanId | null;
  onHover: (planId: PlanId | null) => void;
  onPin: (planId: PlanId) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="density-instrument w-full min-w-[496px] border-collapse">
        <caption className="sr-only">
          Every plan at the scrubbed month. Drag the timeline, or use the arrow keys, to change it.
        </caption>
        <thead>
          <tr className="border-b border-rule text-left text-dim">
            <th scope="col" className="px-3 py-2 font-medium">
              Plan
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Payment
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Balance
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Interest waived
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Paid to date
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => {
            const m = Math.min(month, track.end);
            const resolved = month > track.end;
            const isPinned = pinned === track.planId;
            return (
              <tr
                key={track.planId}
                onMouseEnter={() => onHover(track.planId)}
                onMouseLeave={() => onHover(null)}
                className={`border-b border-rule ${track.isWinner ? "bg-signal/10" : ""}`}
                // The single half-step background shift; no elevation anywhere.
                style={
                  track.planId === emphasised && !track.isWinner
                    ? { backgroundColor: "var(--paper-sunken)" }
                    : undefined
                }
              >
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <button
                    type="button"
                    aria-pressed={isPinned}
                    onClick={() => onPin(track.planId)}
                    onFocus={() => onHover(track.planId)}
                    onBlur={() => onHover(null)}
                    className="flex min-h-11 items-center gap-2 text-left sm:min-h-0"
                  >
                    <svg
                      width={ROW_SWATCH_LENGTH}
                      height={8}
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <line
                        x1={0}
                        y1={4}
                        x2={ROW_SWATCH_LENGTH}
                        y2={4}
                        stroke={track.stroke}
                        strokeWidth={trackStroke(track.isWinner, false)}
                        strokeDasharray={track.dash === "" ? undefined : track.dash}
                      />
                    </svg>
                    <span className={track.isWinner ? "font-semibold text-signal" : ""}>
                      {track.name}
                    </span>
                    {track.isWinner && <span className="sr-only">— recommended</span>}
                    {track.irreversible && (
                      <span className="text-flag" title={track.irreversible.message}>
                        <span aria-hidden="true">✕</span> irreversible
                      </span>
                    )}
                  </button>
                </th>
                <td className="num num-cell px-3 py-2">
                  {resolved ? (
                    <span className="text-dim">resolved</span>
                  ) : (
                    <LiveNumber value={paymentAt(track.plan, m)} format={moneyExact} />
                  )}
                </td>
                <td className="num num-cell px-3 py-2">
                  <LiveNumber value={resolved ? 0 : balanceAt(track.plan, m)} format={money} />
                </td>
                <td className="num num-cell px-3 py-2">
                  <LiveNumber value={track.waived[m] ?? 0} format={money} />
                </td>
                <td className="num num-cell px-3 py-2">
                  <LiveNumber value={track.paid[m] ?? 0} format={money} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Legend + the sentence the drawing is making
 * -------------------------------------------------------------------------- */

function ForkLegend({
  headline,
  tracks,
  horizon,
}: {
  headline: Crossover | null;
  tracks: Track[];
  horizon: number;
}) {
  const crossed = tracks.find((t) => t.planId === headline?.planId);
  const against = tracks.find((t) => t.planId === headline?.againstPlanId);

  /*
   * REMOVE ONE THING (design review §7.12): the key now describes only the
   * marks that are actually on the drawing.
   *
   * It used to print all three unconditionally, which meant "✕ irreversible
   * decision" was set in oxide on every result — including the common case
   * where no eligible plan carries an irreversible decision and the drawing
   * has no ✕ anywhere on it. That is the flag law broken by a legend: red
   * appearing on a page where nothing red is true. It was, measurably, the
   * only flag-coloured element on the default loans result.
   *
   * A key for a mark the reader cannot find is also just noise. So each entry
   * is conditional on its own mark existing, and the whole line disappears
   * when none of them do — leaving the axis description, which is always true.
   */
  const hasForgiveness = tracks.some((t) => terminalKind(t) === "forgiven");
  const hasCrossover = tracks.some((t) => t.crossover !== null);
  const hasIrreversible = tracks.some((t) => t.irreversible !== null);

  return (
    <figcaption className="mt-3">
      <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        {hasForgiveness && (
          <>
            <span aria-hidden="true">●</span> forgiveness &ensp;
          </>
        )}
        {hasCrossover && (
          <>
            <span aria-hidden="true">▲</span> crossover &ensp;
          </>
        )}
        {hasIrreversible && (
          <>
            <span className="text-flag">
              <span aria-hidden="true">✕</span> irreversible decision
            </span>
            &ensp;
          </>
        )}
        {hasForgiveness || hasCrossover || hasIrreversible ? "· cumulative" : "Cumulative"} cost
        over <span className="num">{durationLabel(horizon)}</span>, tax on forgiveness included.
      </p>
      {headline && crossed && against && (
        <p className="mt-1" style={{ fontSize: "var(--text-step--1)" }}>
          <span aria-hidden="true">▲</span> {crossed.name} is <span className="num">{money(headline.peakLead)}</span>{" "}
          ahead of {against.name} at its best, in{" "}
          <span className="num">
            {headline.peakLeadMonth > 0
              ? `year ${Math.ceil(headline.peakLeadMonth / 12)}`
              : "the first year"}
          </span>
          . From{" "}
          <span className="num">
            {headline.date ? monthLabel(headline.date) : `month ${headline.month}`}
          </span>{" "}
          it has cost more, and by the end it costs{" "}
          <span className="num">{money(headline.finalGap)}</span> more.
        </p>
      )}
    </figcaption>
  );
}

/* -------------------------------------------------------------------------- *
 * The screen-reader equivalent — the same milestones, in a real table
 * -------------------------------------------------------------------------- */

function ForkScreenReaderTable({ tracks, winner }: { tracks: Track[]; winner: PlanId }) {
  return (
    <table className="sr-only-table">
      <caption>
        The Fork, as a table: what each eligible plan costs over the life of your loans, and when
        each one changes rank.
      </caption>
      <thead>
        <tr>
          <th scope="col">Plan</th>
          <th scope="col">First monthly payment</th>
          <th scope="col">Crossover</th>
          <th scope="col">Forgiveness</th>
          <th scope="col">Resolves</th>
          <th scope="col">Total lifetime cost</th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((track) => (
          <tr key={track.planId}>
            <th scope="row">
              {track.name}
              {track.planId === winner ? " — recommended" : ""}
              {track.irreversible ? ` — irreversible: ${track.irreversible.message}` : ""}
            </th>
            <td>{usdExact(track.plan.firstMonthlyPayment)}</td>
            <td>
              {track.crossover
                ? `costs more than ${PLAN_NAMES[track.crossover.againstPlanId]} from ${
                    track.crossover.date
                      ? monthLabel(track.crossover.date)
                      : `month ${track.crossover.month}`
                  }, ending ${usd(track.crossover.finalGap)} higher`
                : "no crossover"}
            </td>
            <td>
              {track.plan.totalForgiven > 0
                ? `${usd(track.plan.totalForgiven)} forgiven${
                    track.plan.forgivenessDate ? ` in ${monthLabel(track.plan.forgivenessDate)}` : ""
                  }${
                    track.plan.estimatedTaxOnForgiveness > 0
                      ? `, estimated tax ${usd(track.plan.estimatedTaxOnForgiveness)}`
                      : ""
                  }`
                : "paid in full, nothing forgiven"}
            </td>
            <td>{durationLabel(track.plan.monthsToResolution)}</td>
            <td>{usd(track.plan.totalLifetimeCost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
