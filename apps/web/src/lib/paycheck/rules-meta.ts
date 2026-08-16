import { resolveRules, ruleSetVersion, unverifiedRuleSets } from "@fineprint/engine-paycheck";
import type { Citation, RuleSet } from "@fineprint/engine-paycheck";

/**
 * Ruleset metadata, derived — never hand-written.
 *
 * `<LastVerified>` and the footer both read from here, so the date on screen
 * is the date in the rule files the engine actually ran. A verification date
 * that moves when nothing changed is worse than no date at all.
 */

export const TAX_YEAR = 2026;

function envelopes(rules: RuleSet) {
  return [
    rules.tips,
    rules.overtime,
    rules.senior,
    rules.carLoan,
    rules.brackets,
    rules.occupations,
  ];
}

export interface RulesMeta {
  taxYear: number;
  /** Combined identifier, e.g. "tips-2026.1+overtime-2026.1+…". Audit detail. */
  version: string;
  /**
   * What a reader is shown: "2026.1". The full join is six file versions of
   * the same bundle and, set at the head of a page, it out-shouts the h1 it
   * sits under. The long form stays available for traces and the changelog.
   */
  shortVersion: string;
  /** The OLDEST lastVerified across every rule file — the honest figure. */
  lastVerified: string;
  /** Every distinct citation across the bundle, in file order. */
  citations: Citation[];
  /** The single primary source shown next to the date. */
  primary: { label: string; url: string };
  /** Rule sets still carrying verified=false. Empty is the launch gate. */
  unverified: string[];
}

export function rulesMeta(taxYear: number = TAX_YEAR): RulesMeta {
  const rules = resolveRules(taxYear);
  const all = envelopes(rules);

  const dates = all.flatMap((e) => e.citations.map((c) => c.lastVerified)).sort();
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const envelope of all) {
    for (const citation of envelope.citations) {
      if (seen.has(citation.url + citation.label)) continue;
      seen.add(citation.url + citation.label);
      citations.push(citation);
    }
  }

  const primaryCitation = rules.tips.citations[0];

  const bundle = rules.tips.ruleSetVersion.replace(/^[a-z-]+-/, "");

  return {
    taxYear,
    version: ruleSetVersion(rules),
    shortVersion: bundle,
    lastVerified: dates[0] ?? `${taxYear}-01-01`,
    citations,
    primary: {
      label: primaryCitation?.label ?? "P.L. 119-21 (OBBBA)",
      url: primaryCitation?.url ?? "https://www.congress.gov/bill/119th-congress/house-bill/1",
    },
    unverified: unverifiedRuleSets(rules),
  };
}

