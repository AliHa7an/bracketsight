"use client";

/**
 * The answer. One hero number — the distance to the edge, in dollars of income
 * — the sentence that describes this household, the two figures the decision
 * actually turns on, and the warnings that are live right now.
 *
 * The flag law, applied: oxide red appears here only when the household is
 * past the cliff edge, or when an advance credit is being clawed back without
 * a cap. Both are things the reader cannot undo by the time they find out.
 * Everything else — a large credit, a nearby ledge, a missing field — is ink
 * or dim, however important it feels.
 */

import Link from "next/link";
import { formatUsd, type CliffAnalysis } from "@fineprint/engine-aca";
import {
  HeroNumber,
  LiveNumber,
  LiveWarnings,
  type LiveWarning,
  TraceDisclosure,
  FactTable,
} from "@fineprint/ui";
import { numerify } from "@/lib/aca/numerify";
import { verdict } from "@/lib/aca/verdict";

const CITATION = {
  label: "IRC §36B and Form 8962 instructions",
  url: "https://www.irs.gov/instructions/i8962",
  lastVerified: "2026-08-08",
};

const money = (n: number): string => formatUsd(Math.round(n));

export function ResultsPanel({ analysis }: { analysis: CliffAnalysis }) {
  const { ptc, csr, cliff, clawback } = analysis;
  const v = verdict(analysis);

  return (
    <section aria-labelledby="verdict-heading" className="mt-6">
      <h2 id="verdict-heading" className="sr-only">
        Where you stand
      </h2>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-start">
        <HeroNumber
          id="distance-to-edge"
          label={v.heroLabel}
          value={cliff.distanceToEdge}
          format={money}
          /*
           * Design review §7.12, "remove one thing": the hero carried a delta
           * line reading "−$8,756 a year at stake on one dollar" — the exact
           * fact the sentence beside it already states, in words, better. Two
           * renderings of one number at the top of the page made neither the
           * answer. The delta is gone; the credit at stake now appears once at
           * this level of prominence, in the sentence.
           */
          footnote={
            <TraceDisclosure
              compact
              summaryLabel="How the distance to the cliff edge was calculated"
              formula="cliffEdgeMagi = 400% × FPL(family size, state group);  distance = |MAGI − cliffEdgeMagi|"
              inputs={[
                { label: "Modified AGI", value: formatUsd(analysis.magi.magi) },
                { label: "Poverty line, your household", value: formatUsd(ptc.fpl) },
                { label: "Cliff edge (400% FPL)", value: formatUsd(cliff.cliffEdgeMagi) },
                { label: "Form 8962 position", value: `${ptc.fplPctForm}%` },
              ]}
              ruleVersion={analysis.meta.ruleSetVersion}
              citation={CITATION}
            />
          }
        />

        <p className="text-ink" style={{ fontSize: "var(--text-step-1)", lineHeight: 1.5 }}>
          {numerify(v.sentence)}
        </p>
      </div>

      <div className="hairline-t mt-6 grid gap-6 pt-6 sm:grid-cols-2 sm:items-start">
        <div>
          <p className="micro-label">Your estimated premium tax credit</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span
              className="text-ink"
              style={{ fontSize: "var(--text-step-2)", fontWeight: 500 }}
            >
              <LiveNumber value={ptc.monthlyPtc} format={money} />
            </span>
            <span className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              a month
            </span>
            <span className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              <LiveNumber value={ptc.annualPtc} format={money} /> a year
            </span>
          </p>
          <TraceDisclosure
            className="mt-2"
            compact
            summaryLabel="How the premium tax credit was calculated"
            formula="PTC = max(0, benchmark Silver premium − MAGI × applicable percentage)"
            inputs={[
              { label: "Benchmark Silver premium", value: formatUsd(ptc.benchmarkAnnualPremium) },
              {
                label: "Applicable percentage",
                value: ptc.applicableBps === null ? "none" : `${(ptc.applicableBps / 100).toFixed(2)}%`,
              },
              {
                label: "Your expected contribution",
                value: formatUsd(ptc.expectedAnnualContribution),
              },
              { label: "Annual credit", value: formatUsd(ptc.annualPtc) },
            ]}
            ruleVersion={analysis.meta.ruleSetVersion}
            citation={CITATION}
          />
        </div>

        <div className="hairline-all rounded-atlas min-w-0">
          <FactTable
            caption="Your position against both boundaries"
            rows={[
              {
                key: "Your position",
                value: `${(ptc.fplBps / 100).toFixed(1)}% of FPL`,
              },
              { key: "Form 8962 uses", value: `${ptc.fplPctForm}%` },
              { key: "Modified AGI", value: formatUsd(analysis.magi.magi) },
              { key: "The 400% cliff edge", value: formatUsd(cliff.cliffEdgeMagi) },
              { key: "The 250% ledge", value: formatUsd(cliff.csrEdgeMagi) },
              {
                key: "Cost-sharing",
                mono: false,
                value:
                  csr.band === null
                    ? "None — you are above the 250% ledge"
                    : `You hold the ${csr.band}% actuarial-value Silver band`,
              },
            ]}
          />
        </div>
      </div>

      <LiveWarnings warnings={buildWarnings(analysis)} className="mt-6" />

      {ptc.notes.length > 0 || csr.notes.length > 0 ? (
        <ul className="mt-4 space-y-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          {[...ptc.notes, ...csr.notes].map((note) => (
            <li key={note}>{numerify(note)}</li>
          ))}
        </ul>
      ) : null}

      {clawback && clawback.repaymentDue <= 0 ? (
        <p className="mt-4 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Advance credit check: at this income your final credit covers the advance payments
          {clawback.additionalCredit > 0 ? (
            <>
              {" "}
              and adds <span className="num">{formatUsd(clawback.additionalCredit)}</span> at
              filing.
            </>
          ) : (
            "."
          )}
        </p>
      ) : null}

      <p className="mt-4 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        Engine <span className="num">{analysis.meta.engineVersion}</span> · ruleset{" "}
        <span className="num">{analysis.meta.ruleSetVersion}</span> · benchmark premiums are
        sample data pending the CMS county file ·{" "}
        <Link href="/aca/methodology" className="underline underline-offset-4 hover:text-ink">
          methodology
        </Link>{" "}
        ·{" "}
        <Link href="/aca/sources" className="underline underline-offset-4 hover:text-ink">
          sources
        </Link>
      </p>
    </section>
  );
}

/**
 * M6 — warnings that live. They arrive the moment the condition trips and are
 * gone the moment it stops applying, because a warning that lingers is a false
 * statement about the reader's situation.
 */
function buildWarnings(analysis: CliffAnalysis): LiveWarning[] {
  const { cliff, ptc, clawback, csr } = analysis;
  const out: LiveWarning[] = [];

  if (cliff.overCliff) {
    out.push({
      id: "past-edge",
      severity: "irreversible",
      title: numerify(`You are past the 400% edge — your premium tax credit is $0.`),
      body: numerify(`Modified AGI of ${formatUsd(
        analysis.magi.magi,
      )} sits ${formatUsd(cliff.distanceToEdge)} above the ${formatUsd(
        cliff.cliffEdgeMagi,
      )} edge. There is no phase-out in 2026: the whole ${formatUsd(
        cliff.creditAtStake,
      )} a year is gone until modified AGI comes back under. After 31 December it cannot be undone.`),
    });
  }

  if (clawback && clawback.repaymentDue > 0 && clawback.uncapped) {
    out.push({
      id: "clawback-uncapped",
      severity: "irreversible",
      title: numerify(`You would repay all ${formatUsd(clawback.repaymentDue)} of advance credit at filing.`),
      body: numerify(
        cliff.overCliff
          ? `For 2026 there is no repayment cap at any income — Form 8962 takes back every excess advance dollar. Bringing modified AGI under ${formatUsd(
              cliff.cliffEdgeMagi,
            )} before 31 December restores the credit, which is what shrinks the repayment.`
          : `For 2026 there is no repayment cap at any income: the limitation that used to cap this below 400% of the poverty line was repealed for tax years after 2025. Every dollar your advance payments exceed your final credit comes back on Form 8962. Report income changes to the marketplace so the advance tracks the year you are actually having.`,
      ),
    });
  }

  if (clawback && clawback.repaymentDue > 0 && !clawback.uncapped) {
    out.push({
      id: "clawback-capped",
      severity: "caution",
      title: `You would repay ${formatUsd(clawback.repaymentDue)} of advance credit at filing.`,
      body: `Your advance credit exceeds the final credit by ${formatUsd(
        clawback.excessAdvance,
      )}. A statutory limitation caps the repayment${
        clawback.capApplied === null ? "" : ` at ${formatUsd(clawback.capApplied)}`
      }. No such limitation exists for 2026 — this path applies only to a coverage year whose rules file reinstates one.`,
    });
  }

  if (!cliff.overCliff && cliff.distanceToEdge > 0 && cliff.distanceToEdge <= 500_000) {
    out.push({
      id: "near-edge",
      severity: "caution",
      title: numerify(`One more invoice could cross the edge.`),
      body: numerify(`You have ${formatUsd(
        cliff.distanceToEdge,
      )} of room. A year-end bonus, a capital gain, or a client paying early can spend it, and the credit does not taper — it stops.`),
    });
  }

  if (csr.band !== null && cliff.distanceToCsrEdge > 0 && cliff.distanceToCsrEdge <= 300_000) {
    out.push({
      id: "near-csr",
      severity: "caution",
      title: numerify(`The cost-sharing ledge is ${formatUsd(cliff.distanceToCsrEdge)} away.`),
      body: numerify(`Above 250% of the poverty line the ${csr.band}% Silver cost-sharing reduction ends. The premium credit continues; the deductible and out-of-pocket help does not.`),
    });
  }

  if (ptc.status === "FILING_STATUS_INELIGIBLE") {
    out.push({
      id: "filing-status",
      severity: "caution",
      title: "Married filing separately is generally ineligible for the credit.",
      body: "Narrow exceptions exist for spousal abandonment and domestic abuse. Check them with a tax professional before you file — the filing status decides this year more than the cliff does.",
    });
  }

  return out;
}
