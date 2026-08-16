"use client";

/**
 * The answer.
 *
 * Order is deliberate and never varies: the verdict sentence, written from this
 * borrower's own computed numbers (M8) · the one hero figure · the ranked
 * ledger, which reorders in front of you when the sort flips (M5) · the
 * warnings, which arrive and leave as conditions flip (M6) · the Fork · the
 * provenance.
 *
 * Exactly one number on this screen is large, exactly one element is a
 * signature, and `--flag` appears only on facts that cannot be undone.
 */

import * as React from "react";
import type { PlanId, SimulationResult, Warning, WarningId } from "@/engines/repayment";
import { PLAN_NAMES, resolveRules } from "@/engines/repayment";
import { verdict } from "@/lib/loans/verdict-copy";
import { findCrossover } from "@/lib/loans/fork";
import { durationLabel, usd } from "@/components/ui";
import {
  Button,
  HeroNumber,
  LastVerified,
  LiveWarnings,
  TraceDisclosure,
} from "@/components/ui";
import { ResultsTable, type RankMode } from "./ResultsTable";
import { ForkTimeline } from "./ForkTimeline";

/**
 * A short, concrete headline for each rule the borrower can trip. The engine's
 * own message — which carries their numbers — becomes the body. Nothing here
 * says "please review carefully"; every line names the thing that happens.
 */
const WARNING_TITLES: Record<WarningId, string> = {
  RAP_ONE_WAY_DOOR: "Moving to RAP forfeits your payment credit",
  PARENT_PLUS_RAP_INELIGIBLE: "Parent PLUS is shut out of RAP",
  PARENT_PLUS_CONSOLIDATION_RAP_EXCEPTION: "Your consolidation keeps RAP on a narrow exception",
  RAP_EXCEEDS_STANDARD: "RAP has no payment cap",
  POST_2026_LOANS_RESTRICTED: "A loan disbursed after 1 Jul 2026 restricts your choice",
  FFEL_PERKINS_HEAL_EXCLUDED: "FFEL, Perkins and HEAL cannot use RAP",
  PAYE_ICR_SUNSET: "This plan ends on 1 Jul 2028",
  FORGIVENESS_TAXABLE: "Forgiveness outside PSLF is taxed",
  RAP_EXTRA_PAYMENT_BACKFIRE: "Paying extra on RAP can backfire",
};

function warningTitle(w: Warning): string {
  const base = WARNING_TITLES[w.id];
  // The sunset warning fires once per plan; without the plan name two rows
  // would carry the same headline and read as a duplicate rather than as two
  // separate plans dying on the same day.
  if (w.id === "PAYE_ICR_SUNSET" && w.planId) {
    return `${PLAN_NAMES[w.planId]} ends on 1 Jul 2028`;
  }
  return base;
}

/**
 * Several engine messages open with the same claim the title makes. Repeating
 * it costs the reader a line and makes the concrete part — the one carrying
 * their number — arrive later than it should.
 */
function warningBody(title: string, message: string): string {
  const stop = message.indexOf(". ");
  if (stop === -1) return message;
  const opener = message.slice(0, stop);
  return opener.toLowerCase() === title.toLowerCase() ? message.slice(stop + 2) : message;
}

function toLiveWarnings(warnings: Warning[]) {
  return warnings
    .map((w) => {
      const title = warningTitle(w);
      return {
        id: `${w.id}:${w.planId ?? "global"}`,
        severity: (w.severity === "IRREVERSIBLE" ? "irreversible" : "caution") as
          | "irreversible"
          | "caution",
        title,
        body: warningBody(title, w.message),
      };
    })
    .sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "irreversible" ? -1 : 1,
    );
}

export function Results({ result }: { result: SimulationResult }) {
  const [mode, setMode] = React.useState<RankMode>("total");

  const asOfIso = result.meta.asOfDate;
  const story = verdict(result);

  const byCost = React.useMemo(
    () =>
      result.plans
        .filter((p) => p.eligible)
        .sort((a, b) => a.totalLifetimeCost - b.totalLifetimeCost),
    [result],
  );

  const winner = byCost[0];
  const smallestPayment = result.plans.find(
    (p) => p.planId === result.recommendation.lowestMonthlyPayment,
  );
  const runnerUp = byCost[1];

  const warnings = React.useMemo(() => toLiveWarnings(result.globalWarnings), [result]);
  const crossover =
    smallestPayment && winner ? findCrossover(smallestPayment, winner) : null;
  const oneWayDoor = result.globalWarnings.find((w) => w.id === "RAP_ONE_WAY_DOOR");

  if (!winner) return null;

  const rules = resolveRules(asOfIso);
  const taxCitation = rules.tax.citations[0];
  // The freshness date is the ruleset's own, never today's. A date that moves
  // when nothing changed is fake freshness, and both readers and search engines
  // detect it.
  const verifiedOn =
    [rules.rap, rules.planTerms, rules.tieredStandard, rules.poverty, rules.tax]
      .flatMap((family) => family.citations.map((c) => c.lastVerified))
      .sort()
      .pop() ?? asOfIso;

  return (
    <div className="flex flex-col gap-8">
      <header>
        {/* M8 — this sentence is generated from the engine result and rewritten
            whenever the result changes. No template survives an input change. */}
        <h2 aria-live="polite">{story.headline}</h2>

        <HeroNumber
          className="mt-4"
          id="lifetime-cost"
          label={`What ${PLAN_NAMES[winner.planId]} costs you in total`}
          value={winner.totalLifetimeCost}
          format={usd}
          delta={
            runnerUp
              ? {
                  value: -(runnerUp.totalLifetimeCost - winner.totalLifetimeCost),
                  label: `vs ${PLAN_NAMES[runnerUp.planId]} over ${durationLabel(
                    winner.monthsToResolution,
                  )}`,
                  tone: "signal",
                }
              : undefined
          }
          footnote={
            <TraceDisclosure
              formula="total lifetime cost = everything you pay + estimated tax on any forgiven balance"
              ruleVersion={rules.tax.ruleSetVersion}
              citation={
                taxCitation ?? {
                  label: "26 U.S.C. § 108 — income from discharge of indebtedness",
                  url: "https://www.law.cornell.edu/uscode/text/26/108",
                  lastVerified: "2026-08-08",
                }
              }
              inputs={[
                { label: "Paid over the term", value: usd(winner.totalPaid) },
                { label: "Balance forgiven", value: usd(winner.totalForgiven) },
                {
                  label: "Estimated tax on forgiveness",
                  value: usd(winner.estimatedTaxOnForgiveness),
                },
                {
                  label: "Assumed marginal tax rate",
                  value: `${rules.tax.assumedMarginalRatePct}%`,
                },
                { label: "Plans compared", value: result.plans.length },
              ]}
            />
          }
        />

        {story.tradeoff ? (
          <p className="mt-4 max-w-[var(--measure)] text-ink">{story.tradeoff}</p>
        ) : null}
        {story.forgiveness ? (
          <p className="mt-2 max-w-[var(--measure)] text-dim">{story.forgiveness}</p>
        ) : null}
      </header>

      <section aria-labelledby="ranking-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 id="ranking-heading">All nine plans, ranked</h3>
          <div
            role="group"
            aria-label="Rank the plans by"
            className="flex flex-wrap items-center gap-2"
          >
            <Button
              variant={mode === "total" ? "primary" : "secondary"}
              aria-pressed={mode === "total"}
              onClick={() => setMode("total")}
            >
              Rank by lifetime cost
            </Button>
            <Button
              variant={mode === "monthly" ? "primary" : "secondary"}
              aria-pressed={mode === "monthly"}
              onClick={() => setMode("monthly")}
            >
              Rank by monthly payment
            </Button>
          </div>
        </div>

        {/*
         * Removed in the final pass: a line reading "switch the ranking and
         * watch the recommended row move…". It restated the trade-off sentence
         * that already sits under the hero figure, and narrating the reorder is
         * weaker than letting the reorder happen.
         */}
        <div className="mt-3">
          <ResultsTable result={result} mode={mode} />
        </div>
      </section>

      {warnings.length > 0 ? (
        <section aria-labelledby="warnings-heading">
          <h3 id="warnings-heading">Before you switch</h3>
          {/* M6 — these arrive when a condition flips and leave the moment it
              stops applying. Oxide red marks the one-way doors and nothing else. */}
          <LiveWarnings className="mt-3" warnings={warnings} />
        </section>
      ) : null}

      <section aria-labelledby="fork-heading">
        <h3 id="fork-heading">The Fork — where these plans diverge</h3>
        <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          One track per plan you can use, drawn across the full term.
        </p>
        <div className="mt-3">
          <ForkTimeline
            plans={byCost}
            winnerId={winner.planId as PlanId}
            crossover={crossover}
            oneWayDoorWarning={oneWayDoor}
          />
        </div>
      </section>

      <footer className="hairline-t pt-4">
        <LastVerified
          date={verifiedOn}
          // Spaced so the composite version has somewhere to wrap. Unbroken it
          // is ~68 monospaced characters and pushes the page wide at 375px.
          ruleSetVersion={result.meta.ruleSetVersion.replace(/\+/g, " + ")}
          citation={{
            label: "Every rule behind these figures",
            url: "/loans/sources",
          }}
        />
        <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--2)" }}>
          Estimates under current rules, computed in this browser by engine{" "}
          <span className="num">v{result.meta.engineVersion}</span>. Confirm any plan change
          with your servicer before you make it.
        </p>
      </footer>
    </div>
  );
}
