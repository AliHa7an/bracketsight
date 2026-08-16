"use client";

/**
 * The Cliff Meter — Fineprint's signature visual.
 *
 * One horizontal gauge from 100% to 450% of the federal poverty line. Behind
 * it, the premium tax credit is drawn as the ground the household stands on: a
 * shelf that slopes gently down as income rises, steps down at the 250%
 * cost-sharing boundary, and then — at 400% — ends in a sheer vertical face
 * with nothing on the far side. That face is not a drawing device. It is what
 * §36B says for 2026: at 400.00% there is a credit, at 400.01% there is none.
 *
 * The reader's position is a marker on that ground. Distance to the edge is
 * stated in DOLLARS of income, never percentages, because dollars are the unit
 * the decision is actually made in ("you are $3,180 below the cliff"). Levers
 * render as arrows pulling the marker left, each labelled with the dollars of
 * credit it recovers.
 *
 * The one orchestrated moment (700ms, first render only, never on a
 * recalculation, skipped entirely under prefers-reduced-motion): the credit
 * curve draws left to right, then the marker slides to the household's
 * position — and if that position is past 400%, the marker's own height is the
 * credit at that point, which is zero, so it falls off the edge.
 *
 * Hand-rolled SVG and `d3-scale`. No charting library. Geometry lives in
 * src/lib/cliff-meter.ts; the drawing and the screen-reader table below it read
 * the same computed curve, so they cannot disagree.
 */

import * as React from "react";
import {
  formatUsd,
  getRules,
  type CliffAnalysis,
  type Cents,
  type Household,
  type LeverResult,
} from "@/engines/aca";
import { DUR_SIGNATURE, easeAtlas, prefersReducedMotion } from "@/components/ui/motion";
import {
  CLIFF_PCT,
  CSR_PCT,
  PCT_MAX,
  PCT_MIN,
  creditAtPct,
  creditCurve,
  meterLayout,
  meterScales,
  positionPct,
  shelfPath,
  type CreditCurve,
  type MeterLayout,
} from "@/lib/aca/cliff-meter";

export interface CliffMeterProps {
  analysis: CliffAnalysis;
  household: Household;
  /**
   * A "what if" MAGI from the marginal probe. Drawn as a hollow marker with a
   * pull line back to the real position, so the reader can see the move before
   * committing to it.
   */
  whatIfMagi?: Cents | null;
  className?: string;
}

/** How far the ground drops at the 250% cost-sharing boundary, in user units. */
const LEDGE = 11;

export function CliffMeter({ analysis, household, whatIfMagi, className }: CliffMeterProps) {
  const rules = getRules();
  const uid = React.useId().replace(/:/g, "");
  const fpl = analysis.ptc.fpl;

  const curve = React.useMemo(
    () => creditCurve(fpl, household, rules),
    [fpl, household, rules],
  );

  const userPct = positionPct(analysis.ptc.fplBps);
  const whatIfPct =
    whatIfMagi === null || whatIfMagi === undefined || fpl <= 0
      ? null
      : positionPct(Math.round((whatIfMagi / fpl) * 10000));

  const levers = analysis.levers.filter(
    (l) => l.eligible && !l.advisoryOnly && l.creditRecovered > 0,
  );

  const shared = { curve, analysis, userPct, whatIfPct, levers };

  return (
    <figure className={className ? `m-0 ${className}` : "m-0"}>
      <div className="hidden sm:block">
        <MeterPlot {...shared} layout={meterLayout("wide")} uid={`${uid}w`} />
      </div>
      <div className="sm:hidden">
        <MeterPlot {...shared} layout={meterLayout("narrow")} uid={`${uid}n`} />
      </div>

      <MeterScreenReaderTable analysis={analysis} curve={curve} levers={levers} />

      <figcaption className="mt-3 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        The credit curve is computed by the engine at every{" "}
        <span className="num">2%</span> of the poverty line, peaking at{" "}
        <span className="num">{formatUsd(curve.peak)}</span> a year on this gauge. The face at{" "}
        <span className="num">400%</span> is the statute, not a drawing device: there is no
        phase-out past the edge in 2026. Benchmark premiums are sample data —{" "}
        <a href="/aca/methodology" className="underline underline-offset-4 hover:text-ink">
          methodology
        </a>
        .
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- *
 * The plot
 * -------------------------------------------------------------------------- */

interface MeterPlotProps {
  layout: MeterLayout;
  curve: CreditCurve;
  analysis: CliffAnalysis;
  userPct: number;
  whatIfPct: number | null;
  levers: LeverResult[];
  uid: string;
}

function MeterPlot({
  layout,
  curve,
  analysis,
  userPct,
  whatIfPct,
  levers,
  uid,
}: MeterPlotProps) {
  const s = React.useMemo(() => meterScales(layout, curve.peak), [layout, curve.peak]);
  const past = analysis.cliff.overCliff;
  const markerColour = past ? "var(--flag)" : "var(--ink)";

  const revealRef = React.useRef<SVGRectElement | null>(null);
  const markerRef = React.useRef<SVGGElement | null>(null);
  const dotRef = React.useRef<SVGCircleElement | null>(null);
  const lateRef = React.useRef<SVGGElement | null>(null);
  const playedRef = React.useRef(false);

  const markerX = s.x(userPct);
  const markerY = s.y(creditAtPct(curve, userPct));
  const revealFull = layout.right - layout.left + 8;

  /**
   * The drawing is exactly as tall as it has content for. When no lever can
   * recover credit — which is the honest answer for a household far past the
   * edge — the lever band is not reserved and left empty; the figure simply
   * ends under the measurement.
   */
  const leverRows = Math.min(levers.length, layout.leverSlots);
  const height =
    leverRows > 0 ? layout.leverTop + (leverRows - 1) * layout.leverGap + 12 : layout.dimY + 16;

  /**
   * The one orchestrated moment. `playedRef` is what keeps it from replaying:
   * the component stays mounted across recalculations, and a second draw would
   * be noise rather than reveal.
   */
  React.useLayoutEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    const reveal = revealRef.current;
    const marker = markerRef.current;
    const dot = dotRef.current;
    const late = lateRef.current;
    if (!reveal || !marker || !dot || !late) return;

    const settle = (): void => {
      reveal.setAttribute("width", String(revealFull));
      marker.style.transform = `translateX(${markerX}px)`;
      marker.style.transition = "";
      dot.setAttribute("cy", String(markerY));
      late.style.opacity = "1";
    };

    // The marker carries a 200ms tween for ordinary recalculations (M2). While
    // the signature is driving it frame by frame that tween would smear, so it
    // is switched off for the duration and restored by settle().
    marker.style.transition = "none";

    if (prefersReducedMotion() || DUR_SIGNATURE <= 0) {
      settle();
      return;
    }

    reveal.setAttribute("width", "0");
    marker.style.transform = `translateX(${s.x(PCT_MIN)}px)`;
    dot.setAttribute("cy", String(s.y(creditAtPct(curve, PCT_MIN))));
    late.style.opacity = "0";

    const started = performance.now();
    let raf = 0;
    const step = (now: number): void => {
      const t = Math.min(1, (now - started) / DUR_SIGNATURE);
      // 0 → 0.55  the ground draws left to right
      reveal.setAttribute("width", String(revealFull * easeAtlas(Math.min(1, t / 0.55))));
      // 0.45 → 0.9  the marker walks out to its position, falling if it must
      const walk = easeAtlas(Math.max(0, Math.min(1, (t - 0.45) / 0.45)));
      const pct = PCT_MIN + (userPct - PCT_MIN) * walk;
      marker.style.transform = `translateX(${s.x(pct)}px)`;
      dot.setAttribute("cy", String(s.y(creditAtPct(curve, pct))));
      // 0.9 → 1  the measurement and the levers land
      late.style.opacity = t <= 0.9 ? "0" : String(Math.min(1, (t - 0.9) / 0.1));
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

  const groundY = layout.axisY;
  const ledgeY = groundY - LEDGE;
  const xEdge = s.x(CLIFF_PCT);
  const xCsr = s.x(CSR_PCT);
  const xStart = s.x(PCT_MIN);
  const xEnd = s.x(PCT_MAX);
  const edgeTop = s.y(curve.edgeCredit);

  /** The ground: high under 250%, one step down, then the sheer face at 400%. */
  const groundPath = `M${xStart},${ledgeY}L${xCsr},${ledgeY}L${xCsr},${groundY}L${xEnd},${groundY}`;
  /** The body of the shelf, closed on the ground. */
  const areaPath = `${shelfPath(curve, s)}L${xEdge},${groundY}L${xCsr},${groundY}L${xCsr},${ledgeY}L${xStart},${ledgeY}Z`;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${height}`}
      className="block h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`cliff-reveal-${uid}`}>
          <rect ref={revealRef} x={layout.left - 4} y={0} width={revealFull} height={height} />
        </clipPath>
        <marker
          id={`lever-head-${uid}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--signal)" />
        </marker>
      </defs>

      <g clipPath={`url(#cliff-reveal-${uid})`}>
        {/* The credit itself — the ground you stand on. */}
        <path d={areaPath} fill="var(--signal)" fillOpacity="0.12" />
        <path d={shelfPath(curve, s)} fill="none" stroke="var(--signal)" strokeWidth="2.4" />

        {/* The ground line, with the 250% cost-sharing ledge stepped into it. */}
        <path
          d={groundPath}
          fill="none"
          stroke="color-mix(in srgb, var(--ink) 32%, transparent)"
          strokeWidth="1.5"
        />

        {/* THE CLIFF: a sheer vertical face, and nothing on the far side. */}
        <path
          d={`M${xEdge},${edgeTop}L${xEdge},${groundY}`}
          stroke="var(--flag)"
          strokeWidth="3"
          strokeLinecap="butt"
        />
        <path
          d={`M${xEdge},${groundY}L${xEnd},${groundY}`}
          stroke="var(--flag)"
          strokeOpacity="0.45"
          strokeWidth="2.4"
        />
      </g>

      {/* Annotations on the two boundaries. The edge gets a dashed guide up to
          the top of the plot and its name under the gauge, so the marker owns
          the top row and the two can never collide. */}
      <path
        d={`M${xEdge},${layout.curveTop - 6}L${xEdge},${edgeTop}`}
        stroke="var(--flag)"
        strokeOpacity="0.4"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <text
        x={layout.right}
        y={groundY - 8}
        textAnchor="end"
        fontSize={layout.font.note}
        fill="var(--flag)"
      >
        credit $0
      </text>

      <text
        x={xCsr - 5}
        y={ledgeY - 6}
        textAnchor="end"
        fontSize={layout.font.note}
        fill="var(--dim)"
      >
        <tspan className="num">250%</tspan>
        {layout.variant === "wide" ? " — cost-sharing ledge" : " ledge"}
      </text>

      {/* Gauge ticks. */}
      {layout.ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={s.x(tick)}
            y1={groundY}
            x2={s.x(tick)}
            y2={groundY + 5}
            stroke="var(--rule)"
            strokeWidth="1"
          />
          <text
            className="num"
            x={s.x(tick)}
            y={layout.tickLabelY + 4}
            textAnchor="middle"
            fontSize={layout.font.tick}
            fill="var(--dim)"
          >
            {tick}%
          </text>
        </g>
      ))}
      <text
        x={xEdge}
        y={layout.tickLabelY + 18}
        textAnchor="middle"
        fontSize={layout.font.note}
        fontWeight={600}
        fill="var(--flag)"
      >
        the cliff
      </text>

      {/* The household. Translated in x only; the dot's own height is the
          credit at that point, which is what makes it fall off the edge. */}
      <g
        ref={markerRef}
        style={{
          transform: `translateX(${markerX}px)`,
          transition: "transform var(--dur-base) var(--ease)",
        }}
      >
        <line
          x1={0}
          y1={layout.curveTop - 10}
          x2={0}
          y2={groundY}
          stroke={markerColour}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <circle
          ref={dotRef}
          cx={0}
          cy={markerY}
          r={5}
          fill={markerColour}
          stroke="var(--paper)"
          strokeWidth="2"
        />
        <text
          x={0}
          y={layout.curveTop - 16}
          textAnchor="middle"
          fontSize={layout.font.label}
          fontWeight={600}
          fill={markerColour}
        >
          you
        </text>
      </g>

      {/* What-if position from the marginal probe: hollow, with a pull line. */}
      {whatIfPct !== null && Math.abs(whatIfPct - userPct) > 0.4 ? (
        <g>
          {/* The pull line runs along the top of the plot, where the paper is
              always empty — below the ground it would sit on the tick labels. */}
          <line
            x1={s.x(userPct)}
            y1={layout.curveTop + 6}
            x2={s.x(whatIfPct) + 4}
            y2={layout.curveTop + 6}
            stroke="var(--signal)"
            strokeWidth="1.6"
            markerEnd={`url(#lever-head-${uid})`}
          />
          <circle
            cx={s.x(whatIfPct)}
            cy={s.y(creditAtPct(curve, whatIfPct))}
            r={5}
            fill="var(--paper)"
            stroke="var(--signal)"
            strokeWidth="2"
          />
        </g>
      ) : null}

      {/* Everything that lands last: the measurement, then the levers. */}
      <g ref={lateRef} style={{ opacity: 1 }}>
        <DimensionLine layout={layout} from={markerX} to={xEdge} past={past} analysis={analysis} />
        {levers.slice(0, leverRows).map((lever, i) => (
          <LeverArrow
            key={lever.id}
            layout={layout}
            s={s}
            index={i}
            lever={lever}
            fromPct={userPct}
            uid={uid}
          />
        ))}
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- *
 * The measurement — distance to the edge, in dollars of income
 * -------------------------------------------------------------------------- */

function DimensionLine({
  layout,
  from,
  to,
  past,
  analysis,
}: {
  layout: MeterLayout;
  from: number;
  to: number;
  past: boolean;
  analysis: CliffAnalysis;
}) {
  const left = Math.min(from, to);
  const right = Math.max(from, to);
  const mid = (left + right) / 2;
  const y = layout.dimY;
  const colour = past ? "var(--flag)" : "var(--ink)";
  const amount = formatUsd(analysis.cliff.distanceToEdge);
  const words = past ? "past the edge" : "below the edge";

  // Keep the caption inside the drawing even when the span is a few pixels.
  const halfWidth = (amount.length + words.length + 2) * layout.font.note * 0.29;
  const anchorX = Math.min(Math.max(mid, layout.left + halfWidth), layout.right - halfWidth);

  return (
    <g>
      <line x1={left} y1={y} x2={right} y2={y} stroke={colour} strokeWidth="1" />
      <line x1={left} y1={y - 4} x2={left} y2={y + 4} stroke={colour} strokeWidth="1.5" />
      <line x1={right} y1={y - 4} x2={right} y2={y + 4} stroke={colour} strokeWidth="1.5" />
      <text x={anchorX} y={y - 8} textAnchor="middle" fontSize={layout.font.note} fill={colour}>
        <tspan className="num" fontWeight={600}>
          {amount}
        </tspan>
        <tspan> of income {words}</tspan>
      </text>
    </g>
  );
}

/* -------------------------------------------------------------------------- *
 * Levers — arrows pulling the marker left, labelled in recovered dollars
 * -------------------------------------------------------------------------- */

const SHORT_LABEL: Record<string, string> = {
  TRADITIONAL_401K: "401(k)",
  HSA: "HSA",
  TRADITIONAL_IRA: "IRA",
  SEP_SOLO_401K: "SEP-IRA",
  SE_HEALTH_INSURANCE: "SE health deduction",
  INCOME_TIMING: "income timing",
};

function LeverArrow({
  layout,
  s,
  index,
  lever,
  fromPct,
  uid,
}: {
  layout: MeterLayout;
  s: { x: (pct: number) => number };
  index: number;
  lever: LeverResult;
  fromPct: number;
  uid: string;
}) {
  const y = layout.leverTop + index * layout.leverGap;
  const from = s.x(fromPct);
  const to = s.x(Math.min(Math.max(lever.fplBpsAfter / 100, PCT_MIN), PCT_MAX));
  const name = `${SHORT_LABEL[lever.id] ?? lever.label} recovers `;
  const amount = formatUsd(lever.creditRecovered);
  const width = (name.length + amount.length) * layout.font.note * 0.53;
  const startsAt = Math.min(from, to);
  const overflows = startsAt + width > layout.right;

  return (
    <g>
      <line
        x1={from}
        y1={y}
        x2={to + 4}
        y2={y}
        stroke="var(--signal)"
        strokeWidth="1.6"
        markerEnd={`url(#lever-head-${uid})`}
      />
      <text
        x={overflows ? layout.right : startsAt}
        y={y - 6}
        textAnchor={overflows ? "end" : "start"}
        fontSize={layout.font.note}
        fill="var(--ink)"
      >
        {name}
        <tspan className="num" fontWeight={600}>
          {amount}
        </tspan>
      </text>
    </g>
  );
}

/* -------------------------------------------------------------------------- *
 * The screen-reader equivalent — the same facts, in a real table
 * -------------------------------------------------------------------------- */

function MeterScreenReaderTable({
  analysis,
  curve,
  levers,
}: {
  analysis: CliffAnalysis;
  curve: CreditCurve;
  levers: LeverResult[];
}) {
  const { cliff, ptc } = analysis;
  return (
    <table className="sr-only-table">
      <caption>
        The Cliff Meter, as a table: where this household sits against the 400% subsidy cliff,
        and what each lever moves.
      </caption>
      <tbody>
        <tr>
          <th scope="row">Your position</th>
          <td>
            {(ptc.fplBps / 100).toFixed(1)}% of the federal poverty line, which Form 8962
            records as {ptc.fplPctForm}%
          </td>
        </tr>
        <tr>
          <th scope="row">The cliff edge</th>
          <td>400% of the poverty line, {formatUsd(cliff.cliffEdgeMagi)} of modified AGI</td>
        </tr>
        <tr>
          <th scope="row">{cliff.overCliff ? "Income past the edge" : "Income below the edge"}</th>
          <td>{formatUsd(cliff.distanceToEdge)}</td>
        </tr>
        <tr>
          <th scope="row">Credit at stake at the edge</th>
          <td>
            {formatUsd(cliff.creditAtStake)} a year. The credit still standing at 400% is{" "}
            {formatUsd(curve.edgeCredit)} a year, and it falls to $0 one dollar later.
          </td>
        </tr>
        <tr>
          <th scope="row">The 250% cost-sharing ledge</th>
          <td>
            {formatUsd(cliff.csrEdgeMagi)} of modified AGI
            {cliff.distanceToCsrEdge > 0
              ? `, ${formatUsd(cliff.distanceToCsrEdge)} above you`
              : `, ${formatUsd(-cliff.distanceToCsrEdge)} below you`}
          </td>
        </tr>
        {levers.map((lever) => (
          <tr key={lever.id}>
            <th scope="row">{lever.label}</th>
            <td>
              moves you to {lever.fplPctFormAfter}% of the poverty line and recovers{" "}
              {formatUsd(lever.creditRecovered)} a year
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
