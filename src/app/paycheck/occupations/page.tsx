import type { Metadata } from "next";
import Link from "next/link";
import { OccupationsExplorer } from "@/components/paycheck/OccupationsExplorer";
import { AnswerBox, LastVerified } from "@/components/ui";
import { rulesMeta } from "@/lib/paycheck/rules-meta";

export const metadata: Metadata = {
  title: "Qualified Tipped Occupations — Is Your Job on the IRS List?",
  description:
    "Search the IRS qualified tipped occupation list. Only tips earned in a listed occupation qualify for the OBBBA tips deduction — check your job and its code.",
  alternates: { canonical: "/paycheck/occupations" },
};

export default function OccupationsPage() {
  const meta = rulesMeta();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1>Is your job a qualified tipped occupation?</h1>
        <AnswerBox>
          The tips deduction — up to <span className="num">$25,000</span> a year — applies only
          to occupations on the IRS qualified list: wait staff, bartenders, salon workers,
          rideshare and delivery drivers, and dozens more. Search below; each occupation
          carries the official code your tax forms reference.
        </AnswerBox>
        <LastVerified
          date={meta.lastVerified}
          ruleSetVersion={meta.shortVersion}
          citation={{ label: meta.primary.label, url: meta.primary.url }}
        />
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Pre-launch: this is a representative encoding of the Treasury occupation list, not
          yet reconciled against the final IRS publication. Codes and titles may change.
        </p>
        <p style={{ fontSize: "var(--text-step--1)" }}>
          Found your code?{" "}
          <Link
            href="/paycheck"
            className="text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
          >
            Run the calculator
          </Link>{" "}
          to see the deduction and the tax it saves.
        </p>
      </header>

      <OccupationsExplorer />
    </div>
  );
}
