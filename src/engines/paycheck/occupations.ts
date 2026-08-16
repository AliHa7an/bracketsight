/**
 * Deterministic occupation search over the qualified-occupation rules JSON.
 * No AI, no fuzzy embeddings — plain, reproducible token scoring. The list
 * itself is the source of truth; a future AI matcher may only ROUTE into it.
 */

import type { Occupation, OccupationRules } from "./types";

export interface OccupationMatch {
  occupation: Occupation;
  score: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text).split(" ").filter((t) => t.length > 1);
}

/**
 * Score one occupation against a query. Deterministic; ties broken by code.
 * Exact title match > title substring > keyword exact > token overlap.
 */
function scoreOccupation(queryNorm: string, queryTokens: string[], occ: Occupation): number {
  const titleNorm = normalize(occ.title);
  if (titleNorm === queryNorm) return 100;

  let score = 0;
  if (titleNorm.includes(queryNorm) || queryNorm.includes(titleNorm)) score += 60;

  for (const kw of occ.keywords) {
    const kwNorm = normalize(kw);
    if (kwNorm === queryNorm) {
      score += 70;
    } else if (kwNorm.includes(queryNorm) || queryNorm.includes(kwNorm)) {
      score += 35;
    }
  }

  const titleTokens = new Set([...tokens(occ.title), ...occ.keywords.flatMap(tokens)]);
  let overlap = 0;
  for (const t of queryTokens) {
    if (titleTokens.has(t)) overlap += 1;
  }
  if (queryTokens.length > 0) {
    score += Math.round((overlap / queryTokens.length) * 30);
  }
  return score;
}

export function searchOccupations(
  query: string,
  rules: OccupationRules,
  limit = 10,
): OccupationMatch[] {
  const queryNorm = normalize(query);
  if (queryNorm.length === 0) return [];
  const queryTokens = tokens(query);

  return rules.occupations
    .map((occupation) => ({
      occupation,
      score: scoreOccupation(queryNorm, queryTokens, occupation),
    }))
    .filter((m) => m.score >= 20)
    .sort((a, b) => b.score - a.score || a.occupation.code.localeCompare(b.occupation.code))
    .slice(0, limit);
}

export function findOccupationByCode(
  code: string,
  rules: OccupationRules,
): Occupation | undefined {
  return rules.occupations.find((o) => o.code === code);
}
