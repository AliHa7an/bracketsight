"use client";

/**
 * The ranked ledger — and the one interaction that carries the product's whole
 * argument.
 *
 * Flip the sort from "lowest total cost" to "lowest monthly payment" and the
 * green recommended row physically slides down the list, past the plan with the
 * small payment. That movement is the insight: the cheapest payment is not the
 * cheapest plan. It is delivered by <RankedRows> (M5), which FLIPs positions on
 * a sort-key change and *only* on a sort-key change — a reorder on every
 * keystroke would stop being information and start being noise.
 *
 * Why these rows are a list rather than a <table>: RankedRows needs to own the
 * row elements to measure and transform them, and a <tr> cannot be moved by a
 * transform without breaking the table's own layout. Every cell therefore
 * carries its own visually-hidden label, so a screen reader hears "Monthly,
 * $214.37" on each figure rather than depending on a column header association.
 * The visible header strip is aria-hidden for exactly that reason. Plans the
 * borrower cannot use are a separate <LedgerTable> below: they are not ranked,
 * they never move, and what matters about them is the reason, inline.
 *
 * Every figure opens its own trace (M9) and every figure tweens (M2).
 */

import * as React from "react";
import type { PlanId, PlanResult, SimulationResult } from "@/engines/repayment";
import { PLAN_NAMES, resolveRules } from "@/engines/repayment";
import { durationLabel, monthLabel, usd, usdExact } from "@/components/ui";
import { LedgerTable, LiveNumber, RankedRows, TraceDisclosure } from "@/components/ui";

export type RankMode = "total" | "monthly";

/* LiveNumber tweens through fractional values, so both formatters round first. */
const money = (n: number): string => usd(Math.round(n));
const moneyExact = (n: number): string => usdExact(Math.round(n));

/**
 * How each plan's payment is built, in the reader's terms. Prose only — every
 * rate, bracket and term in these sentences comes from the versioned rule files
 * the citation below each one points at.
 */
const PLAN_FORMULAS: Record<PlanId, string> = {
  RAP: "annual payment = AGI × bracket rate (1%–10% by $10,000 band) ÷ 12 − $50 per dependent, floor $10/month · unpaid interest waived, never capitalised · principal falls at least $50/month · forgiveness after 360 payments · no cap at the Standard amount",
  IBR_OLD:
    "monthly = 15% × (AGI − 150% of the poverty guideline) ÷ 12, capped at the 10-year Standard payment · forgiveness after 300 payments",
  IBR_NEW:
    "monthly = 10% × (AGI − 150% of the poverty guideline) ÷ 12, capped at the 10-year Standard payment · forgiveness after 240 payments · first loan on or after 1 Jul 2014",
  PAYE: "monthly = 10% × (AGI − 150% of the poverty guideline) ÷ 12, capped at the 10-year Standard payment · plan ends 1 Jul 2028, and this projection moves you to RAP on that date if your loans qualify for it, otherwise to IBR",
  ICR: "monthly = lesser of 20% × (AGI − 100% of the poverty guideline) ÷ 12 and a 12-year fixed amortisation · plan ends 1 Jul 2028, and this projection moves you to RAP on that date if your loans qualify for it, otherwise to IBR",
  STANDARD_10: "fixed payment amortising your balance over 120 months at your balance-weighted rate",
  TIERED_STANDARD:
    "fixed payment over a term set by balance: 10 years under $25,000, 15 to $50,000, 20 to $100,000, 25 above",
  GRADUATED:
    "payment steps up every 24 months across 10 years · the first payment covers at least the accruing interest, the last is at most 3× the first",
  EXTENDED: "fixed payment amortising your balance over 300 months",
};

type Citation = { label: string; url: string; lastVerified: string };

const FALLBACK_CITATION: Citation = {
  label: "34 C.F.R. § 685.209 — income-driven repayment plans",
  url: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-685/subpart-B/section-685.209",
  lastVerified: "2026-08-08",
};

/** The rule family each plan is actually computed from, with its own version. */
function planRuleSource(
  planId: PlanId,
  asOfIso: string,
): { citation: Citation; version: string } {
  const rules = resolveRules(asOfIso);
  if (planId === "RAP") {
    return {
      citation: rules.rap.citations[0] ?? FALLBACK_CITATION,
      version: rules.rap.ruleSetVersion,
    };
  }
  if (planId === "TIERED_STANDARD") {
    return {
      citation: rules.tieredStandard.citations[0] ?? FALLBACK_CITATION,
      version: rules.tieredStandard.ruleSetVersion,
    };
  }
  const amortising =
    planId === "STANDARD_10" || planId === "GRADUATED" || planId === "EXTENDED";
  return {
    citation:
      (amortising ? rules.planTerms.citations[1] : rules.planTerms.citations[0]) ??
      FALLBACK_CITATION,
    version: rules.planTerms.ruleSetVersion,
  };
}

/**
 * `compact` is deliberate. This trace repeats on all nine ranked rows, and as a
 * full-width bar it turned the ledger into nine banners reading "How this was
 * calculated" — louder than the figures they explain. The affordance stays on
 * every row (CLAUDE.md: never state a computed figure without it); it just stops
 * shouting. The accessible name names its plan, because a screen-reader user
 * moving by button would otherwise hear the same label nine times.
 */
export function planTrace(plan: PlanResult, asOfIso: string) {
  const { citation, version } = planRuleSource(plan.planId, asOfIso);
  return (
    <TraceDisclosure
      compact
      summaryLabel={`How the ${PLAN_NAMES[plan.planId]} figures were calculated`}
      formula={PLAN_FORMULAS[plan.planId]}
      ruleVersion={version}
      citation={citation}
      inputs={[
        { label: "First monthly payment", value: usdExact(plan.firstMonthlyPayment) },
        { label: "Payments simulated", value: plan.schedule.length },
        { label: "Paid over the term", value: usd(plan.totalPaid) },
        { label: "Balance forgiven", value: usd(plan.totalForgiven) },
        {
          label: "Estimated tax on forgiveness",
          value: usd(plan.estimatedTaxOnForgiveness),
        },
        { label: "Total lifetime cost", value: usd(plan.totalLifetimeCost) },
        {
          label: "Resolves",
          value: plan.forgivenessDate
            ? `${monthLabel(plan.forgivenessDate)} (forgiven)`
            : `${durationLabel(plan.monthsToResolution)} (paid in full)`,
        },
      ]}
    />
  );
}

/* ------------------------------------------------------------- row internals */

const COLUMNS =
  "sm:grid-cols-[minmax(8.5rem,1.6fr)_minmax(5.5rem,1fr)_minmax(6rem,1fr)_minmax(5.5rem,1fr)_minmax(5rem,0.9fr)]";

/** Two labelled columns at 375px; five aligned ledger columns from 640px up. */
const ROW_GRID = `grid grid-cols-2 gap-x-3 gap-y-1 ${COLUMNS} sm:gap-y-0 sm:items-baseline`;

/** The header strip does not exist below 640px — each cell labels itself there. */
const HEADER_GRID = `hidden sm:grid gap-x-3 ${COLUMNS} items-baseline`;

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="num-cell">
      {/* Visible on a narrow screen; still spoken on a wide one. */}
      <span className="micro-label block sm:sr-only">{label}</span>
      <span className="num text-ink">{children}</span>
    </div>
  );
}

function RecommendedMark() {
  return (
    <span className="micro-label text-signal inline-flex items-center gap-1 whitespace-nowrap">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M2 6.5 L4.8 9.3 L10 3.2" />
      </svg>
      Recommended
    </span>
  );
}

function PlanRow({
  plan,
  rank,
  recommended,
  smallestPayment,
  asOfIso,
}: {
  plan: PlanResult;
  rank: number;
  recommended: boolean;
  smallestPayment: boolean;
  asOfIso: string;
}) {
  return (
    <div
      className="hairline-b"
      style={{
        // The rule is reserved on every row, so marking a winner shifts nothing.
        borderLeft: recommended ? "2px solid var(--signal)" : "2px solid transparent",
        background: recommended
          ? "color-mix(in srgb, var(--signal) 6%, var(--paper))"
          : undefined,
      }}
    >
      <div className={ROW_GRID} style={{ padding: "8px 12px" }}>
        <div className="col-span-2 flex min-w-0 flex-wrap items-baseline gap-x-2 sm:col-span-1">
          <span className="num text-dim" aria-hidden="true">
            {rank}
          </span>
          <span className="text-ink" style={{ fontWeight: recommended ? 600 : 500 }}>
            {PLAN_NAMES[plan.planId]}
          </span>
          {recommended ? <RecommendedMark /> : null}
          {smallestPayment && !recommended ? (
            <span className="micro-label text-dim whitespace-nowrap">Smallest payment</span>
          ) : null}
        </div>

        <Cell label="Monthly">
          <LiveNumber value={plan.firstMonthlyPayment} format={moneyExact} />
        </Cell>
        <Cell label="Lifetime cost">
          <LiveNumber value={plan.totalLifetimeCost} format={money} />
        </Cell>
        <Cell label="Forgiven">
          <LiveNumber value={plan.totalForgiven} format={money} />
        </Cell>
        <Cell label="Resolves in">{durationLabel(plan.monthsToResolution)}</Cell>
      </div>

      <div style={{ padding: "0 12px 4px" }}>{planTrace(plan, asOfIso)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------- table */

export function ResultsTable({
  result,
  mode,
}: {
  result: SimulationResult;
  mode: RankMode;
}) {
  const asOfIso = result.meta.asOfDate;

  const ranked = React.useMemo(() => {
    const eligible = result.plans.filter((p) => p.eligible);
    const sorted = [...eligible].sort((a, b) =>
      mode === "total"
        ? a.totalLifetimeCost - b.totalLifetimeCost
        : a.firstMonthlyPayment - b.firstMonthlyPayment ||
          a.totalLifetimeCost - b.totalLifetimeCost,
    );
    return sorted.map((plan) => ({ id: plan.planId as string, plan }));
  }, [result, mode]);

  const ineligible = result.plans.filter((p) => !p.eligible);
  const recommendedId = result.recommendation.lowestTotalCost;
  const smallestPaymentId = result.recommendation.lowestMonthlyPayment;

  return (
    <div className="density-instrument">
      {/* Not a live region: the verdict headline above is the page's single
          polite announcement, and the sort buttons announce their own pressed
          state. Two regions firing on every keystroke would be unusable. */}
      <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        {ranked.length} plans your loans can use, ranked by{" "}
        {mode === "total" ? "total lifetime cost" : "first monthly payment"}.{" "}
        {PLAN_NAMES[(ranked[0]?.plan.planId ?? recommendedId) as PlanId]} is first.
      </p>

      <div className="hairline-all mt-2 min-w-0 overflow-hidden rounded-atlas">
        {/* Column strip. Every cell repeats its own label for assistive tech,
            so this is decoration for the eye only. */}
        <div
          aria-hidden="true"
          className={`hairline-b ${HEADER_GRID}`}
          style={{
            padding: "8px 12px",
            borderLeft: "2px solid transparent",
            background: "var(--paper-raised)",
          }}
        >
          <span className="micro-label">Plan</span>
          <span className="micro-label num-cell">Monthly</span>
          <span className="micro-label num-cell">Lifetime cost</span>
          <span className="micro-label num-cell">Forgiven</span>
          <span className="micro-label num-cell">Resolves in</span>
        </div>

        {/* M5 — the reorder. Fires on `sortKey` and nothing else. */}
        <RankedRows
          items={ranked}
          sortKey={mode}
          renderRow={(item, index) => (
            <PlanRow
              plan={item.plan}
              rank={index + 1}
              recommended={item.plan.planId === recommendedId}
              smallestPayment={item.plan.planId === smallestPaymentId}
              asOfIso={asOfIso}
            />
          )}
        />
      </div>

      {ineligible.length > 0 ? (
        <div className="mt-6">
          <p className="micro-label">Closed to your loan mix</p>
          <LedgerTable
            className="mt-2"
            caption="Repayment plans your loans cannot use, and the rule that closes each one"
            columns={[
              { id: "plan", label: "Plan" },
              { id: "why", label: "Why" },
            ]}
            rows={ineligible.map((plan) => ({
              id: plan.planId,
              cells: { plan: PLAN_NAMES[plan.planId] },
              disabled: true,
              disabledReason:
                plan.ineligibilityReasons.join(" ") ||
                "This plan does not accept the loan types you entered.",
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}
