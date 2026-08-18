"use client";

/**
 * The live instrument panel on the home page.
 *
 * THIS IS NOT A MOCKUP. `analyzeHousehold` from `@/engines/aca` runs in the
 * reader's browser twice over:
 *
 *   • Once per slider change, for the readouts — MAGI, poverty-line
 *     percentage, the Form 8962 line 5 figure, the monthly and annual credit,
 *     and the distance to the edge. A single analysis costs about 0.04 ms.
 *   • 121 times on mount, to plot the curve. The engine is sampled across the
 *     whole slider range and the annual credit at each sample is what the
 *     polyline traces. That is roughly 5 ms, once, memoised for the life of the
 *     component — the curve does not depend on where the reader is standing,
 *     only the marker does.
 *
 * So the drop in that chart is not drawn. It is measured: the curve falls to
 * zero between two adjacent samples because the engine returns $0 for the
 * second one. `d3-scale` maps the numbers to pixels and nothing else — the path
 * is hand-built, as the stack requires.
 *
 * WHY A CHART AND NOT A BIGGER NUMBER. A cliff is a shape. A household $600
 * under the edge and a household $600 over it have almost the same income and a
 * $14,902 difference in outcome, and no single figure carries that; the
 * discontinuity has to be visible. This is the one place on the page where a
 * drawing earns its space.
 *
 * WHAT IS SAMPLE DATA. The 2026 benchmark premiums come from the engine's
 * sample SLCSP table, pending ingest of the CMS county landscape file. The
 * poverty guidelines, the applicable-percentage table and the cliff geometry
 * are the real cited rules. The panel says which is which, in the panel, rather
 * than in a footnote elsewhere — a number a reader cannot rely on has to say so
 * where the reader is looking.
 */

import * as React from "react";
import { scaleLinear } from "d3-scale";

import { allCitations, analyzeHousehold, type CliffAnalysisInput } from "@/engines/aca";

import { ACA_DEMO } from "./data";
import styles from "./home.module.css";

const HOUSEHOLD: CliffAnalysisInput["household"] = {
  filingStatus: "MARRIED_JOINT",
  familySize: 3,
  stateCode: "TX",
  countyId: ACA_DEMO.countyId,
  coveredMemberAges: [52, 50, 17],
};

/** Fixed, so the panel is reproducible rather than drifting by the day. */
const AS_OF = new Date(`${ACA_DEMO.asOf}T00:00:00Z`);

function analyse(magiDollars: number) {
  return analyzeHousehold(
    {
      household: HOUSEHOLD,
      income: {
        agi: Math.round(magiDollars) * 100,
        taxExemptInterest: 0,
        excludedForeignIncome: 0,
        nonTaxableSocialSecurity: 0,
      },
    },
    AS_OF,
  );
}

const usd = (cents: number) => `$${Math.round(cents / 100).toLocaleString("en-US")}`;
const usdShort = (cents: number) => `$${Math.round(cents / 100 / 1000)}k`;

/* ─────────────────────────────────────────────────────────────── chart ── */

/*
 * The plot area only — no text inside the SVG.
 *
 * An SVG `<text>` scales with the viewBox, so a 9px label in a 640-unit box
 * rendered into a 343px column came out at 4.8px on a 375px screen: present in
 * the DOM, unreadable on the device. Every label is HTML positioned around the
 * plot instead, at a real font size that does not depend on how wide the column
 * happens to be. The cliff marker is placed with a percentage derived from the
 * same scale the path uses, so the label and the line cannot drift.
 */
const CHART = { w: 640, h: 240, padL: 4, padR: 4, padT: 12, padB: 6 } as const;
const SAMPLES = 121;

/** The curve, sampled from the engine once. Pure geometry after that. */
function useCurve() {
  return React.useMemo(() => {
    const step = (ACA_DEMO.maxMagi - ACA_DEMO.minMagi) / (SAMPLES - 1);
    const points: { magi: number; annual: number }[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const magi = ACA_DEMO.minMagi + i * step;
      points.push({ magi, annual: analyse(magi).ptc.annualPtc });
    }

    const maxAnnual = Math.max(...points.map((p) => p.annual));
    const x = scaleLinear()
      .domain([ACA_DEMO.minMagi, ACA_DEMO.maxMagi])
      .range([CHART.padL, CHART.w - CHART.padR]);
    const y = scaleLinear()
      .domain([0, maxAnnual])
      .range([CHART.h - CHART.padB, CHART.padT]);

    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.magi).toFixed(1)} ${y(p.annual).toFixed(1)}`)
      .join(" ");
    const area = `${line} L${x(ACA_DEMO.maxMagi).toFixed(1)} ${y(0).toFixed(1)} L${x(
      ACA_DEMO.minMagi,
    ).toFixed(1)} ${y(0).toFixed(1)} Z`;

    return { x, y, line, area, maxAnnual };
  }, []);
}

/* ──────────────────────────────────────────────────────────────── panel ── */

export function CliffPanel() {
  const [magi, setMagi] = React.useState<number>(ACA_DEMO.defaultMagi);
  const curve = useCurve();

  const model = React.useMemo(() => {
    const a = analyse(magi);
    return {
      fplPct: (a.ptc.fplBps / 100).toFixed(2),
      formLine5: a.ptc.fplPctForm,
      monthly: a.ptc.monthlyPtc,
      annual: a.ptc.annualPtc,
      benchmark: a.ptc.benchmarkAnnualPremium,
      overCliff: a.cliff.overCliff,
      distance: a.cliff.distanceToEdge,
      atStake: a.cliff.creditAtStake,
      edge: a.cliff.cliffEdgeMagi,
      csr: a.csr.band,
      ruleSetVersion: a.meta.ruleSetVersion,
      engineVersion: a.meta.engineVersion,
    };
  }, [magi]);

  /**
   * The poverty-guideline citation, read out of the rule file through the
   * engine's own loader rather than written here. The FPL table is the part of
   * this panel that is fully verified, so it is the citation that goes under
   * the figures; the benchmark-premium caveat is stated separately below it.
   */
  const fplCitation = React.useMemo(() => {
    const file = allCitations().find((entry) => entry.file.startsWith("fpl."));
    return file?.citations[0] ?? null;
  }, []);

  const fillPct = ((magi - ACA_DEMO.minMagi) / (ACA_DEMO.maxMagi - ACA_DEMO.minMagi)) * 100;
  const markerX = curve.x(magi);
  const markerY = curve.y(model.annual);
  const edgeX = curve.x(model.edge / 100);
  /** The oxide line's position as a percentage of the plot box, for the HTML
      label that sits above it. Same scale as the path, so they cannot drift. */
  const edgePct = ((edgeX - CHART.padL) / (CHART.w - CHART.padL - CHART.padR)) * 100;

  return (
    <div className={styles.panel}>
      <div className={styles.panelGrid} aria-hidden="true" />

      <div className={styles.panelHead}>
        <span className={styles.panelLive}>
          <span className={styles.panelDot} aria-hidden="true" />
          Live · in this browser
        </span>
        <span>{ACA_DEMO.county}</span>
        <span
          className={`${styles.status} ${model.overCliff ? styles.statusCliff : styles.statusOk}`}
        >
          {model.overCliff ? "OVER THE CLIFF" : "CREDIT ELIGIBLE"}
        </span>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.chartFrame}>
          <div className={styles.chartY}>
            <span>{usdShort(curve.maxAnnual)}</span>
            <span>$0</span>
          </div>

          <div className={styles.chartPlot}>
            <svg
              className={styles.chart}
              viewBox={`0 0 ${CHART.w} ${CHART.h}`}
              role="img"
              aria-label={`Annual premium tax credit against household income. The credit falls gradually from about ${usd(
                curve.maxAnnual,
              )} to ${usd(model.atStake)}, then drops to zero the moment income passes ${usd(
                model.edge,
              )}.`}
            >
              {/* baseline and the two horizontal guides */}
              {[0, 0.5, 1].map((t) => (
                <line
                  key={t}
                  x1={CHART.padL}
                  x2={CHART.w - CHART.padR}
                  y1={curve.y(curve.maxAnnual * t)}
                  y2={curve.y(curve.maxAnnual * t)}
                  stroke="currentColor"
                  strokeOpacity={t === 0 ? 0.35 : 0.12}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <path d={curve.area} fill="var(--panel-teal)" fillOpacity="0.13" />
              <path
                d={curve.line}
                fill="none"
                stroke="var(--panel-teal)"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* the edge — the one oxide mark in the panel */}
              <line
                x1={edgeX}
                x2={edgeX}
                y1={CHART.padT}
                y2={CHART.h - CHART.padB}
                stroke="var(--panel-flag)"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />

              {/* where the reader is standing */}
              <line
                x1={markerX}
                x2={markerX}
                y1={CHART.padT}
                y2={CHART.h - CHART.padB}
                stroke="var(--panel-gold)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={markerX} cy={markerY} r="4" fill="var(--panel-gold)" />
            </svg>

            {/* HTML, so the label is legible at 375px. See the note on CHART. */}
            <span className={styles.edgeTag} style={{ left: `${edgePct}%` }}>
              400% FPL
            </span>
          </div>

          <span />
          <div className={styles.chartX}>
            <span>${(ACA_DEMO.minMagi / 1000).toFixed(0)}k</span>
            <span>${(ACA_DEMO.maxMagi / 1000).toFixed(0)}k MAGI</span>
          </div>
        </div>

        <div className={styles.readouts}>
          <Cell
            label="Monthly credit"
            value={usd(model.monthly)}
            note="premium tax credit"
            accent
          />
          <Cell
            label="Annual credit"
            value={usd(model.annual)}
            note={`benchmark ${usd(model.benchmark)}`}
          />
          <Cell
            label="% of poverty line"
            value={`${model.fplPct}%`}
            note={`Form 8962 line 5 · ${model.formLine5}`}
          />
          <Cell
            label={model.overCliff ? "Over the edge by" : "Room before the edge"}
            value={usd(model.distance)}
            note={`edge at ${usd(model.edge)}`}
          />
          <Cell
            label={model.overCliff ? "Credit forfeited" : "Credit at stake"}
            value={usd(model.atStake)}
            note="if income lands over"
          />
          <Cell
            label="Cost-sharing band"
            value={model.csr ? `${model.csr}% AV` : "none"}
            note={model.csr ? "silver plan actuarial value" : "above 250% FPL"}
          />
        </div>

        <div className={styles.scrub}>
          <label className={styles.scrubLabel} htmlFor="home-magi">
            <span>Household MAGI</span>
            <span className={styles.scrubValue}>${magi.toLocaleString("en-US")}</span>
          </label>
          <input
            id="home-magi"
            className={styles.slider}
            style={{ "--fill": `${fillPct}%` } as React.CSSProperties}
            type="range"
            min={ACA_DEMO.minMagi}
            max={ACA_DEMO.maxMagi}
            step={ACA_DEMO.stepMagi}
            value={magi}
            onChange={(event) => setMagi(Number(event.target.value))}
            aria-describedby="home-panel-provenance"
          />
          <p className={styles.scrubEnds} aria-hidden="true">
            <span>${ACA_DEMO.minMagi.toLocaleString("en-US")}</span>
            <span>${ACA_DEMO.maxMagi.toLocaleString("en-US")}</span>
          </p>
        </div>

        {/*
          One live region for the finding, not for each cell. A screen-reader
          user dragging this hears a sentence, not six numbers with no subject.
        */}
        <p className={styles.srOnly} aria-live="polite">
          At ${magi.toLocaleString("en-US")} of household income, this family is{" "}
          {model.overCliff
            ? `${usd(model.distance)} over the 400% line and receives no premium tax credit. ${usd(
                model.atStake,
              )} a year is forfeited.`
            : `${usd(model.distance)} under the 400% line and receives ${usd(
                model.monthly,
              )} a month, ${usd(model.annual)} a year.`}
        </p>
      </div>

      <p className={styles.panelFoot} id="home-panel-provenance">
        {ACA_DEMO.household} · as of {ACA_DEMO.asOf} · engine {model.engineVersion} · rule set{" "}
        {model.ruleSetVersion}.
        <br />
        {fplCitation ? (
          <>
            Poverty guidelines:{" "}
            <a href={fplCitation.url} rel="noreferrer">
              {fplCitation.label}
            </a>
            {fplCitation.lastVerified
              ? ` · last verified ${fplCitation.lastVerified}`
              : " · not yet verified"}
            .{" "}
          </>
        ) : null}
        Benchmark premiums are sample data pending the CMS county file.
      </p>
    </div>
  );
}

function Cell({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={styles.readout}>
      <p className={styles.readoutLabel}>{label}</p>
      <p className={`${styles.readoutValue} ${accent ? styles.readoutValueKey : ""}`}>{value}</p>
      <p className={styles.readoutNote}>{note}</p>
    </div>
  );
}
