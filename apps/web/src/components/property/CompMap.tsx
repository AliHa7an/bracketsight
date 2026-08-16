"use client";

import * as React from "react";
import type { AssessmentCheck, CompRatio } from "@fineprint/engine-property";
import { formatCents, formatNumber } from "@/lib/property/format";
import { EASE_CSS, prefersReducedMotion } from "@fineprint/ui/motion";
import { PARCEL_MS, PARCEL_STEP_MS } from "@/lib/property/signature";

/**
 * The Comp Map — Fineprint's signature element.
 *
 * A plat sheet, not a chart. Hand-rolled SVG: a ruled block of lots with the
 * subject parcel picked out in the middle, each comparable a small parcel card
 * carrying its address, size, assessed value and ratio. Corner ticks, lot
 * numbers, a dashed block boundary between tiers and a surveyor's title block
 * along the bottom — the visual grammar of the document this tool is arguing
 * with. No map library, no chart library, no tiles.
 *
 * The colour says which side a comparable is on, and so does a word and an
 * arrow: a lot assessed at a LOWER ratio than yours argues your assessment is
 * too high, and is washed in survey green. One assessed higher argues against
 * you and stays on plain stock. Colour never carries that alone.
 *
 * Positions are comparison order, not geography — the sheet says so, twice.
 *
 * ── Why three sheets ────────────────────────────────────────────────────────
 * An SVG scaled to 100% width scales its type with it, so one drawing cannot
 * hold 11px labels across a 343→992px range. Three sheets are drawn at three
 * fixed design widths and swapped by media query, each capped at its own
 * `max-width`, so the type never renders above its design size and never below
 * 92% of it — and because the swap is CSS, the layout is settled before
 * hydration and nothing shifts.
 *
 * ── The signature ───────────────────────────────────────────────────────────
 * On first render only, the comparables resolve onto the sheet in similarity
 * order over 490ms; the verdict figure counts up as the last one lands. It
 * never replays on a recalculation, and `prefers-reduced-motion` skips it to
 * the end state.
 *
 * Accessibility: the drawing is `role="img"` with a one-sentence summary, and
 * the full parcel-by-parcel data follows in a real `<table>` held off-screen by
 * `.sr-only-table`. Both read from the same `check`, so they cannot disagree.
 */

/* -------------------------------------------------------------------------- *
 * Sheet geometry
 * -------------------------------------------------------------------------- */

const MARGIN = 10; // sheet inner margin
const GAP_X = 8; // gutter between lots in a tier
const BAND = 14; // dashed block boundary between tiers
const ROW_H = 104; // a lot is 104 units tall on every sheet
const TITLE_H = 34; // the surveyor's title block

interface SheetSpec {
  /** design width in user units == CSS px at 100% scale */
  width: number;
  cols: number;
  /** which viewports this sheet serves */
  className: string;
}

const SHEETS: SheetSpec[] = [
  { width: 343, cols: 2, className: "sm:hidden" },
  { width: 660, cols: 3, className: "hidden sm:block lg:hidden" },
  { width: 992, cols: 4, className: "hidden lg:block" },
];

/* -------------------------------------------------------------------------- *
 * Helpers
 * -------------------------------------------------------------------------- */

/** The ratio, said the way the county's own argument says it. */
function ratioText(
  ratio: number,
  argumentType: "MARKET_VALUE" | "UNIFORMITY",
): string {
  return argumentType === "MARKET_VALUE"
    ? `ratio ${ratio.toFixed(3)}`
    : `${formatCents(Math.round(ratio))}/sf`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const wash = (token: string, pct: number): string =>
  `color-mix(in srgb, var(${token}) ${pct}%, var(--paper))`;

/* -------------------------------------------------------------------------- *
 * One lot on the sheet
 * -------------------------------------------------------------------------- */

interface LotBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Survey corner marks, set inside the boundary so they read against it. */
function CornerTicks({ box, color }: { box: LotBox; color: string }) {
  const t = 6;
  const i = 3.5;
  const { x, y, w, h } = box;
  const l = x + i;
  const r = x + w - i;
  const tp = y + i;
  const b = y + h - i;
  return (
    <g stroke={color} strokeWidth={1} strokeOpacity={0.55} fill="none">
      <path d={`M${l} ${tp + t} V${tp} H${l + t}`} />
      <path d={`M${r - t} ${tp} H${r} V${tp + t}`} />
      <path d={`M${r} ${b - t} V${b} H${r - t}`} />
      <path d={`M${l + t} ${b} H${l} V${b - t}`} />
    </g>
  );
}

/** An unsurveyed lot: the rest of the block, so the tier reads complete. */
function VacantLot({ box }: { box: LotBox }) {
  return (
    <rect
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      strokeDasharray="3 4"
      style={{ fill: "none", stroke: "var(--rule)", strokeWidth: 1 }}
    />
  );
}

function CompLot({
  comp,
  lotNumber,
  box,
  argumentType,
  index,
}: {
  comp: CompRatio;
  lotNumber: number;
  box: LotBox;
  argumentType: "MARKET_VALUE" | "UNIFORMITY";
  index: number;
}) {
  const supports = comp.supportsCase;
  const accent = supports ? "var(--signal)" : "var(--dim)";
  const { x, y, w, h } = box;
  const pad = 8;
  const maxChars = Math.max(10, Math.floor((w - pad * 2) / 6.1));

  return (
    <g className="fp-parcel" data-parcel-index={index}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        style={{
          fill: supports ? wash("--signal", 9) : "var(--paper)",
          stroke: accent,
          strokeWidth: 1,
        }}
      />
      <CornerTicks box={box} color={accent} />

      <text
        className="num"
        x={x + pad}
        y={y + 15}
        fontSize={9}
        letterSpacing="0.06em"
        style={{ fill: "var(--dim)" }}
      >
        {`LOT ${String(lotNumber).padStart(2, "0")}`}
      </text>

      <text
        x={x + pad}
        y={y + 32}
        fontSize={11.5}
        fontWeight={600}
        style={{ fill: "var(--ink)", fontFamily: "var(--font-body)" }}
      >
        {truncate(comp.property.address, maxChars)}
      </text>

      <text className="num" x={x + pad} y={y + 48} fontSize={10.5} style={{ fill: "var(--dim)" }}>
        {`${formatNumber(comp.property.sqft)} sqft · ${comp.property.yearBuilt}`}
      </text>

      <text
        className="num"
        x={x + pad}
        y={y + 66}
        fontSize={12.5}
        fontWeight={500}
        style={{ fill: "var(--ink)" }}
      >
        {formatCents(comp.property.assessedValueCents)}
      </text>

      <text className="num" x={x + pad} y={y + 82} fontSize={10.5} style={{ fill: accent }}>
        {ratioText(comp.ratio, argumentType)}
      </text>

      {/* The arrow and the word carry the same meaning as the wash. */}
      <path
        d={
          supports
            ? `M${x + pad} ${y + 90} l4 6 l4 -6 z`
            : `M${x + pad} ${y + 96} l4 -6 l4 6 z`
        }
        style={{ fill: accent }}
      />
      <text
        x={x + pad + 12}
        y={y + 96}
        fontSize={9.5}
        style={{ fill: accent, fontFamily: "var(--font-body)" }}
      >
        {supports ? "argues for you" : "argues against"}
      </text>
    </g>
  );
}

function SubjectLot({
  check,
  box,
}: {
  check: AssessmentCheck;
  box: LotBox;
}) {
  const { subject, analysis } = check;
  const { x, y, w, h } = box;
  const pad = 8;
  const maxChars = Math.max(10, Math.floor((w - pad * 2) / 6.1));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        style={{ fill: "var(--paper)", stroke: "var(--ink)", strokeWidth: 2 }}
      />
      {/* No corner ticks here: the heavy boundary and the stamp already single
          this lot out, and the ticks would sit under both. */}

      {/* The stamp a county clerk would ink onto the subject lot. */}
      <rect x={x} y={y} width={62} height={16} style={{ fill: "var(--ink)" }} />
      <text
        x={x + 6}
        y={y + 12}
        fontSize={9}
        fontWeight={600}
        letterSpacing="0.08em"
        style={{ fill: "var(--paper)", fontFamily: "var(--font-body)" }}
      >
        SUBJECT
      </text>

      <text
        x={x + pad}
        y={y + 34}
        fontSize={11.5}
        fontWeight={600}
        style={{ fill: "var(--ink)", fontFamily: "var(--font-body)" }}
      >
        {truncate(subject.address, maxChars)}
      </text>

      <text className="num" x={x + pad} y={y + 50} fontSize={10.5} style={{ fill: "var(--dim)" }}>
        {`${formatNumber(subject.sqft)} sqft · ${subject.yearBuilt}`}
      </text>

      <text
        className="num"
        x={x + pad}
        y={y + 68}
        fontSize={12.5}
        fontWeight={500}
        style={{ fill: "var(--ink)" }}
      >
        {formatCents(subject.assessedValueCents)}
      </text>

      <text
        className="num"
        x={x + pad}
        y={y + 84}
        fontSize={10.5}
        fontWeight={500}
        style={{ fill: "var(--ink)" }}
      >
        {ratioText(analysis.subjectRatio, analysis.argumentType)}
      </text>

      <text
        x={x + pad}
        y={y + 97}
        fontSize={9.5}
        style={{ fill: "var(--dim)", fontFamily: "var(--font-body)" }}
      >
        your home
      </text>
    </g>
  );
}

/* -------------------------------------------------------------------------- *
 * A whole sheet
 * -------------------------------------------------------------------------- */

function PlatSheet({
  check,
  spec,
  neighborhood,
}: {
  check: AssessmentCheck;
  spec: SheetSpec;
  neighborhood: string;
}) {
  const comps = check.analysis.comps;
  const total = comps.length + 1;
  const { cols, width } = spec;
  const rows = Math.max(1, Math.ceil(total / cols));
  const cellW = (width - MARGIN * 2 - (cols - 1) * GAP_X) / cols;
  const height = MARGIN * 2 + rows * ROW_H + (rows - 1) * BAND + TITLE_H;

  // The subject sits in the middle tier, middle-ish column — the sheet reads
  // outward from your own lot, which is the whole argument.
  const subjectIndex = Math.min(
    total - 1,
    Math.floor(rows / 2) * cols + Math.floor((cols - 1) / 2),
  );

  const cellAt = (index: number): LotBox => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: MARGIN + col * (cellW + GAP_X),
      y: MARGIN + row * (ROW_H + BAND),
      w: cellW,
      h: ROW_H,
    };
  };

  const supporting = comps.filter((c) => c.supportsCase).length;

  let compCursor = 0;
  const lots: React.ReactNode[] = [];
  for (let i = 0; i < total; i += 1) {
    const box = cellAt(i);
    if (i === subjectIndex) {
      lots.push(<SubjectLot key="subject" check={check} box={box} />);
    } else {
      const comp = comps[compCursor];
      if (!comp) break;
      lots.push(
        <CompLot
          key={comp.property.id}
          comp={comp}
          lotNumber={compCursor + 1}
          box={box}
          argumentType={check.analysis.argumentType}
          index={compCursor}
        />,
      );
      compCursor += 1;
    }
  }

  // The block is subdivided whether or not every lot is comparable: the tail of
  // the last tier is drawn as unsurveyed ground rather than left as a hole.
  for (let i = total; i < rows * cols; i += 1) {
    lots.push(<VacantLot key={`vacant-${i}`} box={cellAt(i)} />);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Plat of comparables: your parcel among ${comps.length} comparable lots. ${supporting} of ${comps.length} argue your assessment is too high. Every figure is repeated in the comparables table below.`}
      className={`block h-auto w-full ${spec.className}`}
      style={{ maxWidth: `${width}px` }}
    >
      {/* Sheet stock and its double rule — a survey sheet, not a card. */}
      <rect
        x={0.5}
        y={0.5}
        width={width - 1}
        height={height - 1}
        style={{ fill: "var(--paper)", stroke: "var(--rule)", strokeWidth: 1 }}
      />
      <rect
        x={4.5}
        y={4.5}
        width={width - 9}
        height={height - 9}
        style={{ fill: "none", stroke: "var(--rule)", strokeWidth: 1 }}
      />

      {/* Block boundaries between tiers. */}
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = MARGIN + (i + 1) * ROW_H + i * BAND + BAND / 2;
        return (
          <line
            key={`band-${i}`}
            x1={MARGIN}
            y1={y}
            x2={width - MARGIN}
            y2={y}
            strokeDasharray="5 4"
            style={{ stroke: "var(--rule)", strokeWidth: 1 }}
          />
        );
      })}

      {lots}

      {/* Title block. */}
      <line
        x1={MARGIN}
        y1={height - TITLE_H}
        x2={width - MARGIN}
        y2={height - TITLE_H}
        style={{ stroke: "var(--rule)", strokeWidth: 1 }}
      />
      <text
        x={MARGIN}
        y={height - TITLE_H + 15}
        fontSize={9}
        fontWeight={600}
        letterSpacing="0.08em"
        style={{ fill: "var(--dim)", fontFamily: "var(--font-body)" }}
      >
        PLAT OF COMPARABLES
      </text>
      <text
        x={MARGIN}
        y={height - TITLE_H + 26}
        fontSize={9}
        style={{ fill: "var(--dim)", fontFamily: "var(--font-body)" }}
      >
        {truncate(neighborhood, Math.floor((width - MARGIN * 2) / 5.2))}
      </text>
      <text
        className="num"
        x={width - MARGIN}
        y={height - TITLE_H + 15}
        fontSize={9}
        textAnchor="end"
        style={{ fill: "var(--dim)" }}
      >
        {`${comps.length} LOTS · RULES ${check.meta.ruleSetVersion}`}
      </text>
      {/* The narrow sheet has no room for a second right-hand line, and the
          figcaption says the same thing in full below every sheet. */}
      {width >= 500 ? (
        <text
          x={width - MARGIN}
          y={height - TITLE_H + 26}
          fontSize={9}
          textAnchor="end"
          style={{ fill: "var(--dim)", fontFamily: "var(--font-body)" }}
        >
          not to scale · order by similarity, not geography
        </text>
      ) : null}
    </svg>
  );
}

/* -------------------------------------------------------------------------- *
 * The component
 * -------------------------------------------------------------------------- */

export function CompMap({
  check,
  neighborhood,
}: {
  check: AssessmentCheck;
  /** The dataset the lots come from. Says "synthetic" when it is. */
  neighborhood: string;
}) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const playedRef = React.useRef(false);
  const comps = check.analysis.comps;
  const supporting = comps.filter((c) => c.supportsCase).length;
  const isMarket = check.analysis.argumentType === "MARKET_VALUE";

  /**
   * The signature: comparables resolve onto the sheet in similarity order.
   * `playedRef` is what keeps it from replaying — the component stays mounted
   * across recalculations, where a second reveal would be noise.
   */
  React.useLayoutEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const parcels = Array.from(root.querySelectorAll<SVGGElement>(".fp-parcel"));
    if (parcels.length === 0) return;

    const perSheet = new Map<Element, number>();
    for (const parcel of parcels) {
      const sheet = parcel.ownerSVGElement;
      if (!sheet) continue;
      const count = perSheet.get(sheet) ?? 0;
      perSheet.set(sheet, count + 1);
    }

    for (const parcel of parcels) {
      const sheet = parcel.ownerSVGElement;
      const n = sheet ? (perSheet.get(sheet) ?? 1) : 1;
      const i = Number(parcel.dataset.parcelIndex ?? 0);
      const stagger = n > 1 ? ((PARCEL_MS - PARCEL_STEP_MS) / (n - 1)) * i : 0;
      parcel.style.opacity = "0";
      parcel.style.transform = "translateY(5px)";
      parcel.style.transition =
        `opacity ${PARCEL_STEP_MS}ms ${EASE_CSS} ${stagger}ms, ` +
        `transform ${PARCEL_STEP_MS}ms ${EASE_CSS} ${stagger}ms`;
    }

    const raf = requestAnimationFrame(() => {
      for (const parcel of parcels) {
        parcel.style.opacity = "1";
        parcel.style.transform = "translateY(0)";
      }
    });
    return () => cancelAnimationFrame(raf);
    // Mount only. Deliberately not reactive: this fires once, ever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure ref={rootRef} className="m-0">
      {SHEETS.map((spec) => (
        <PlatSheet key={spec.width} check={check} spec={spec} neighborhood={neighborhood} />
      ))}

      <figcaption className="mt-3 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Swatch tone="signal" />
            <span>
              argues for you —{" "}
              <span className="num text-ink">{supporting}</span> of{" "}
              <span className="num text-ink">{comps.length}</span>
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Swatch tone="dim" />
            <span>argues against you</span>
          </span>
        </span>
        <span className="mt-2 block">
          A green lot is assessed at a lower{" "}
          {isMarket ? "assessed-to-sale ratio" : "assessed value per square foot"} than yours, so it
          argues your assessment is too high. Lots are ordered by how closely they match your home —
          the sheet is a comparison, not a street map.
        </span>
      </figcaption>

      <CompMapTable check={check} />
    </figure>
  );
}

function Swatch({ tone }: { tone: "signal" | "dim" }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 shrink-0"
      style={{
        background: tone === "signal" ? wash("--signal", 9) : "var(--paper)",
        border: `1px solid var(--${tone})`,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- *
 * The screen-reader equivalent — the same lots, in a real table
 * -------------------------------------------------------------------------- */

function CompMapTable({ check }: { check: AssessmentCheck }) {
  const { analysis, subject } = check;
  const isMarket = analysis.argumentType === "MARKET_VALUE";

  return (
    <table className="sr-only-table">
      <caption>
        The Comp Map as a table: your parcel and each comparable lot, with the ratio that decides
        which way it argues.
      </caption>
      <thead>
        <tr>
          <th scope="col">Lot</th>
          <th scope="col">Address</th>
          <th scope="col">Living area</th>
          <th scope="col">Year built</th>
          <th scope="col">Assessed value</th>
          <th scope="col">{isMarket ? "Assessed-to-sale ratio" : "Assessed value per square foot"}</th>
          <th scope="col">Which way it argues</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Subject</th>
          <td>{subject.address}</td>
          <td>{formatNumber(subject.sqft)} square feet</td>
          <td>{subject.yearBuilt}</td>
          <td>{formatCents(subject.assessedValueCents)}</td>
          <td>{ratioText(analysis.subjectRatio, analysis.argumentType)}</td>
          <td>Your home — the parcel being checked.</td>
        </tr>
        {analysis.comps.map((comp, i) => (
          <tr key={comp.property.id}>
            <th scope="row">Lot {String(i + 1).padStart(2, "0")}</th>
            <td>{comp.property.address}</td>
            <td>{formatNumber(comp.property.sqft)} square feet</td>
            <td>{comp.property.yearBuilt}</td>
            <td>{formatCents(comp.property.assessedValueCents)}</td>
            <td>{ratioText(comp.ratio, analysis.argumentType)}</td>
            <td>
              {comp.supportsCase
                ? "Assessed at a lower ratio than yours — argues your assessment is too high."
                : "Assessed at a higher ratio than yours — argues your assessment is fair."}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
