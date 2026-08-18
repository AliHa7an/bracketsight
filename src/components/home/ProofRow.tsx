"use client";

/**
 * The proof strip: the four figures the site offers as evidence about itself.
 *
 * A single ruled row picking up the panel's readout rhythm directly above it,
 * label above the source rather than below it, everything in the data face.
 *
 * NOTHING IS WRITTEN HERE. Every value arrives as a prop from `@/lib/proof`,
 * which derives all four from this repository during `next build` — the suite
 * is run and counted, VERIFICATION-STATUS.md is parsed, the rule files are
 * walked. A site whose entire pitch is "every figure is cited and dated" cannot
 * be the site whose own self-description is a stale literal.
 *
 * The count-up is decoration on top of a value that is already correct in the
 * markup: `CountUp` renders the finished string on the server and replaces it
 * only while a tween is running, and under reduced motion there is no tween at
 * all. It also reserves its own width in `ch` against the tabular face, so a
 * number changing from "0" to "468" moves nothing beside it.
 */

import type * as React from "react";

import type { ProofStat } from "@/lib/proof";

import { CountUp } from "./CountUp";
import { useReveal } from "./reveal";
import styles from "./home.module.css";

export function ProofRow({ stats }: { stats: readonly ProofStat[] }) {
  const { ref, phase, playing } = useReveal<HTMLUListElement>();

  return (
    <ul className={styles.proofRow} ref={ref} data-reveal={phase}>
      {stats.map((stat, index) => (
        <li
          key={stat.id}
          className={styles.proofItem}
          style={{ "--reveal-index": index } as React.CSSProperties}
        >
          <CountUp
            className={
              typeof stat.value === "number"
                ? styles.proofFigure
                : `${styles.proofFigure} ${styles.proofFigureDate}`
            }
            value={typeof stat.value === "number" ? stat.value : null}
            playing={playing}
          >
            {stat.display}
          </CountUp>
          <p className={styles.proofLabel}>{stat.label}</p>
          <p className={styles.proofSource}>{stat.source}</p>
        </li>
      ))}
    </ul>
  );
}
