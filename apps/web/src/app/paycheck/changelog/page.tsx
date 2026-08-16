import type { Metadata } from "next";
import { formatDate } from "@/lib/paycheck/format";
import { rulesMeta } from "@/lib/paycheck/rules-meta";
import { ErrorState } from "@fineprint/ui";

export const metadata: Metadata = {
  title: "OBBBA Deduction Changelog — Dated, Cited Changes",
  description:
    "Every rule change behind the OBBBA deduction numbers, dated and cited. When IRS guidance moves, this page says exactly what changed in the engine and when.",
  alternates: { canonical: "/paycheck/changelog" },
};

const entries = [
  {
    date: "2026-08-08",
    title: "Initial engine build (pre-launch)",
    items: [
      "Encoded all four OBBBA deductions — tips, overtime premium, senior, car-loan interest — with the shared-MAGI phase-out interaction and the marginal next-$1,000 analysis.",
      "Encoded a representative qualified-occupation list of roughly 65 occupations with TTOC-style codes, pending reconciliation with the final IRS publication.",
      "Money math is integer cents throughout; rates are basis points. 52 engine tests cover the caps, both phase-out models, and the bracket table.",
    ],
  },
];

export default function ChangelogPage() {
  const meta = rulesMeta();

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1>Changelog</h1>
        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          When a rule changes we change one versioned file and log it here within 48 hours.
          Current rule bundle: <span className="num">{meta.version}</span>.
        </p>
      </header>

      {meta.unverified.length > 0 ? (
        <ErrorState
          cause="Not launch-ready."
          fix="Senior amounts and thresholds, car-loan parameters, phase-out rates, the 2026 brackets, and the occupation list are placeholders awaiting IRS primary-source verification. Tracked in VERIFICATION-NEEDED.md."
        />
      ) : null}

      <div className="flex flex-col gap-6">
        {entries.map((entry) => (
          <section
            key={entry.date}
            className="rounded-atlas hairline-all px-4 py-3"
            style={{ borderRadius: "var(--radius-atlas)" }}
          >
            <p className="micro-label num">
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            </p>
            <h2 className="mt-1" style={{ fontSize: "var(--text-step-1)" }}>
              {entry.title}
            </h2>
            <ul className="mt-2 flex list-none flex-col gap-2 p-0">
              {entry.items.map((item) => (
                <li
                  key={item}
                  className="hairline-b pb-2 text-dim last:border-b-0"
                  style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
