/**
 * Shareable scenario state — the URL *is* the save file.
 *
 * Interaction spec §6: "compressed URL encoding the full scenario. Every
 * result is a link." M7 (`ScenarioPins`) stores one of these strings per pin.
 *
 * Compaction strategy, in order of effect:
 *   1. Enums become indexes into a frozen, versioned table.
 *   2. Records become positional tuples — no repeated key names.
 *   3. Dates lose their dashes.
 *   4. The result is JSON, UTF-8 encoded, then base64url with padding stripped.
 *
 * That is ~3× smaller than the verbose form and costs zero dependencies.
 * DEFLATE via `CompressionStream` was rejected: it is async, which would make
 * every pin write a promise, and the win over key-stripping is small at this
 * payload size.
 *
 * The format is versioned. A token from a future version decodes to `null`
 * rather than to wrong numbers — a wrong scenario is worse than no scenario.
 */

import type { FormValues, LoanFormValues } from "./schema";

/** Bump when the tuple layout changes. Old tokens then decode to `null`. */
export const URL_STATE_VERSION = 1;

/** The query parameter carrying the scenario. */
export const SCENARIO_PARAM = "s";

/* Frozen enum tables. NEVER reorder — append only, and bump the version if
   you must. An index that shifts silently rewrites somebody's loan types. */
const LOAN_TYPES = [
  "DIRECT_SUBSIDIZED",
  "DIRECT_UNSUBSIDIZED",
  "DIRECT_GRAD_PLUS",
  "DIRECT_PARENT_PLUS",
  "DIRECT_CONSOLIDATION",
  "FFEL",
  "PERKINS",
  "HEAL",
] as const;

const FILING_STATUSES = [
  "SINGLE",
  "MARRIED_JOINT",
  "MARRIED_SEPARATE",
  "HEAD_OF_HOUSEHOLD",
] as const;

const STATE_GROUPS = ["CONTIGUOUS_48", "ALASKA", "HAWAII"] as const;

const PSLF_ANSWERS = ["NO", "YES", "UNSURE"] as const;

type Encoded = [
  version: number,
  loans: (number | string | null)[][],
  household: (number | null)[],
  goals: (number | null)[],
];

/* ---------------------------------------------------------------- base64url */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ------------------------------------------------------------------ helpers */

/** `undefined` (an untouched number field) survives the round trip as null. */
function num(value: number | undefined | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNum(row: readonly (number | null)[], index: number, fallback: number): number {
  const raw = row[index];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

/**
 * Fields that legitimately start empty stay empty through the round trip —
 * restoring a half-filled scenario as `0` would invent a number the user never
 * typed. Mirrors the `emptyNumber` convention in `schema.ts`.
 */
const EMPTY_NUMBER = undefined as unknown as number;

function readNumOrEmpty(row: readonly (number | null)[], index: number): number {
  const raw = row[index];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : EMPTY_NUMBER;
}

/** Returns the fallback for an out-of-range index rather than throwing. */
function readEnum<T extends string>(
  table: readonly T[],
  row: readonly (number | null)[],
  index: number,
): T {
  const raw = row[index];
  const first = table[0] as T;
  if (typeof raw !== "number") return first;
  return table[raw] ?? first;
}

function packDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.replace(/-/g, "") : "";
}

function unpackDate(packed: unknown): string {
  if (typeof packed !== "string" || !/^\d{8}$/.test(packed)) return "";
  return `${packed.slice(0, 4)}-${packed.slice(4, 6)}-${packed.slice(6, 8)}`;
}

/* ------------------------------------------------------------------- encode */

export function encodeScenario(values: FormValues): string {
  const loans = values.loans.map((loan) => {
    const typeIndex = LOAN_TYPES.indexOf(loan.type);
    return [
      typeIndex < 0 ? 0 : typeIndex,
      num(loan.balanceDollars),
      num(loan.ratePct),
      packDate(loan.firstDisbursement),
      // Bitfield, append-only. A bit added here decodes to false for tokens
      // written before it existed, which is the safe default for all three —
      // so this stays backward compatible without a version bump.
      (loan.isConsolidation ? 1 : 0) |
        (loan.underlyingHadParentPlus ? 2 : 0) |
        (loan.repaidUnderIdrInWindow ? 4 : 0),
    ];
  });

  const h = values.household;
  const household = [
    num(h.agiDollars),
    Math.max(0, FILING_STATUSES.indexOf(h.filingStatus)),
    num(h.spouseAgiDollars),
    num(h.spouseFederalLoanBalanceDollars),
    num(h.dependentsClaimed),
    num(h.familySize),
    Math.max(0, STATE_GROUPS.indexOf(h.stateGroup)),
  ];

  const g = values.goals;
  const goals = [
    Math.max(0, PSLF_ANSWERS.indexOf(g.pursuingPSLF)),
    num(g.priorQualifyingPayments),
    num(g.expectedAnnualIncomeGrowthPct),
  ];

  const payload: Encoded = [URL_STATE_VERSION, loans, household, goals];
  return toBase64Url(JSON.stringify(payload));
}

/* ------------------------------------------------------------------- decode */

/**
 * Never throws. Returns `null` for anything it cannot read with confidence.
 *
 * The result is structurally valid but NOT business-validated: a pinned
 * scenario may legitimately be half-filled (M1 — the answer never waits for a
 * complete form). Run `formSchema.safeParse` before simulating.
 */
export function decodeScenario(token: string): FormValues | null {
  if (!token) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(token));
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length < 4) return null;
  const [version, rawLoans, rawHousehold, rawGoals] = parsed as unknown[];
  if (version !== URL_STATE_VERSION) return null;
  if (!Array.isArray(rawLoans) || !Array.isArray(rawHousehold) || !Array.isArray(rawGoals)) {
    return null;
  }

  const loans: LoanFormValues[] = [];
  for (let i = 0; i < rawLoans.length; i++) {
    const row = rawLoans[i];
    if (!Array.isArray(row)) return null;
    const typeIndex = row[0];
    const flags = typeof row[4] === "number" ? row[4] : 0;
    loans.push({
      // Deterministic ids: the same scenario must always produce the same
      // token, so nothing here may read Date.now() or Math.random().
      id: `loan-${i + 1}`,
      type: (typeof typeIndex === "number" ? LOAN_TYPES[typeIndex] : undefined) ?? LOAN_TYPES[1],
      balanceDollars: readNumOrEmpty(row as (number | null)[], 1),
      ratePct: readNumOrEmpty(row as (number | null)[], 2),
      firstDisbursement: unpackDate(row[3]),
      isConsolidation: (flags & 1) === 1,
      underlyingHadParentPlus: (flags & 2) === 2,
      repaidUnderIdrInWindow: (flags & 4) === 4,
    });
  }
  if (loans.length === 0) return null;

  const h = rawHousehold as (number | null)[];
  const g = rawGoals as (number | null)[];

  return {
    loans,
    household: {
      agiDollars: readNumOrEmpty(h, 0),
      filingStatus: readEnum(FILING_STATUSES, h, 1),
      spouseAgiDollars: readNum(h, 2, 0),
      spouseFederalLoanBalanceDollars: readNum(h, 3, 0),
      dependentsClaimed: readNum(h, 4, 0),
      familySize: readNum(h, 5, 1),
      stateGroup: readEnum(STATE_GROUPS, h, 6),
    },
    goals: {
      pursuingPSLF: readEnum(PSLF_ANSWERS, g, 0),
      priorQualifyingPayments: readNum(g, 1, 0),
      expectedAnnualIncomeGrowthPct: readNum(g, 2, 3),
    },
  };
}

/* ---------------------------------------------------------------------- URL */

/**
 * A shareable absolute URL for a scenario. Falls back to a relative URL when
 * there is no `window` (SSR, tests) so the caller always gets a usable string.
 */
export function scenarioUrl(values: FormValues, pathname = "/loans"): string {
  const query = `${pathname}?${SCENARIO_PARAM}=${encodeScenario(values)}`;
  if (typeof window === "undefined") return query;
  return `${window.location.origin}${query}`;
}

/** Reads a scenario out of `location.search` (or any query string). */
export function readScenarioFromSearch(search?: string): FormValues | null {
  const raw = search ?? (typeof window === "undefined" ? "" : window.location.search);
  if (!raw) return null;
  const token = new URLSearchParams(raw).get(SCENARIO_PARAM);
  return token ? decodeScenario(token) : null;
}
