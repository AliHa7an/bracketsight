"use client";

import type { EngineResult } from "@/engines/paycheck";
import { Disclosure, FactTable } from "@/components/ui";

/**
 * What the engine assumes.
 *
 * Every individual figure now carries its own <TraceDisclosure> — formula,
 * inputs, rule version, citation — attached to the number it explains. What
 * has no home on a single line is the set of modelling choices that shape all
 * of them, so that is all this block holds. It deliberately repeats nothing.
 */
export function CalcTrace({ result }: { result: EngineResult }) {
  return (
    <Disclosure summary="What this engine assumes">
      <div className="density-instrument">
        <ul
          className="m-0 flex list-none flex-col gap-2 p-0 text-dim"
          style={{ maxWidth: "var(--measure)" }}
        >
          {result.meta.assumptions.map((assumption) => (
            <li key={assumption} className="hairline-b pb-2 last:border-b-0">
              {assumption}
            </li>
          ))}
        </ul>

        <FactTable
          className="mt-3"
          caption="Engine and rule-set versions behind these figures"
          rows={[
            { key: "Engine", value: result.meta.engineVersion },
            { key: "Rule sets", value: result.meta.ruleSetVersion },
            { key: "Tax year", value: result.taxYear },
          ]}
        />

        {result.meta.unverifiedRuleSets.length > 0 ? (
          <p className="mt-3 text-ink" style={{ maxWidth: "var(--measure)", fontWeight: 500 }}>
            Pre-launch: {result.meta.unverifiedRuleSets.join(", ")} still carry placeholder
            values pending IRS primary-source verification. Treat every figure above as
            illustrative until they clear.
          </p>
        ) : null}
      </div>
    </Disclosure>
  );
}
