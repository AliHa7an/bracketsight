import type { Metadata } from "next";
import Link from "next/link";
import { getRules } from "@/engines/aca";

export const metadata: Metadata = {
  alternates: { canonical: "/aca/changelog" },
  title: "ACA Changelog — Rule Changes, Dated and Cited",
  description:
    "Every change to the subsidy cliff ruleset, including the live watch on the bill that would restore the enhanced premium tax credits.",
};

export default function ChangelogPage() {
  const rules = getRules();
  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>Changelog</h1>

      <section className="hairline-all rounded-atlas p-4">
        <h2>Watch item: will the enhanced credits come back?</h2>
        <p className="mt-2">
          A bill restoring the enhanced premium tax credits passed the House in
          January 2026 but is not law. If enacted, the 400% cliff would soften
          or disappear for the years it covers. Bracketsight&apos;s rules are
          versioned by effective date, so a change lands here as a new ruleset
          within 48 hours — every page updates from one file. Until then, the
          2026 cliff rules below are what the law says today.
        </p>
      </section>

      <section className="space-y-4">
        <article className="border-l-2 border-rule pl-4">
          <p className="micro-label">
            <time className="num" dateTime="2026-08-15">
              15 Aug 2026
            </time>
          </p>
          <h2 className="mt-1">Primary-source corrections</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>The advance-credit repayment cap is gone entirely.</strong>{" "}
              Pub. L. 119-21 §71305 struck IRC §36B(f)(2)(B) for tax years
              beginning after 31 December 2025, so for 2026 there is no cap at
              any income. Bracketsight previously told a household at{" "}
              <span className="num">250%</span> of the poverty line its clawback
              was capped at <span className="num">$1,000</span>. It is not — the
              whole excess is repaid.
            </li>
            <li>
              <strong>The 400% edge moved down.</strong> Form 8962 Worksheet 2
              tests &ldquo;more than 4.0 × the poverty line&rdquo; before it
              truncates anything, so the last eligible income is exactly four
              times the poverty line. The edge for one person is now{" "}
              <span className="num">$62,600</span> (was $62,756.49) and for a
              family of four <span className="num">$128,600</span> (was
              $128,921.49).
            </li>
            <li>
              Hawaii&apos;s poverty guideline increment corrected to{" "}
              <span className="num">$6,330</span> per additional person (90 Fed.
              Reg. 5917), and the 2026 traditional-IRA deduction phase-out for a
              covered single filer corrected to{" "}
              <span className="num">$81,000</span>–
              <span className="num">$91,000</span> (IRS Notice 2025-67).
            </li>
          </ul>
        </article>

        <article className="border-l-2 border-rule pl-4">
          <p className="micro-label">
            <time className="num" dateTime="2026-08-08">
              8 Aug 2026
            </time>
          </p>
          <h2 className="mt-1">Initial engine build</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Ruleset <span className="num">{rules.ruleSetVersion}</span>:
              §36B credit with the restored 400% cliff, Form 8962 truncation,
              CSR bands, uncapped over-400% clawback, Medicaid-expansion flags
              for all states.
            </li>
            <li>
              Lever engine: 401(k)/403(b)/457, HSA, traditional IRA
              (phase-outs), SEP-IRA/Solo 401(k), and the iterative
              self-employed health insurance deduction (Rev. Proc. 2014-41
              method).
            </li>
            <li>
              Known limits: sample benchmark premiums (six counties);
              placeholder 2026 indexed figures pending Rev. Proc. and COLA
              verification — status per file on{" "}
              <Link href="/aca/sources" className="underline underline-offset-4">
                /sources
              </Link>
              .
            </li>
          </ul>
        </article>
      </section>
    </article>
  );
}
