/**
 * ═════════════════════════════════════════════════════════════════════════════
 * PROOF — the four numbers the site offers as evidence about itself.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * "468 tests. 315 figures checked. 28 rule files. Last checked 15 Aug 2026."
 *
 * Those are the strongest claims on the home page, and they are claims about
 * the repository rather than about tax law — which makes them the easiest ones
 * to get quietly wrong. A hardcoded `468` stays 468 after someone deletes a
 * test file. A hardcoded `2026-08-15` stays there for a year. A site whose
 * entire pitch is "every figure is cited and dated" cannot be the site whose
 * own self-description is stale. That failure is worse than saying nothing.
 *
 * So nothing below is a literal. Every figure is read out of the repository at
 * build time:
 *
 *   tests           run the suite, count what actually ran
 *   figures/verified  the totals row of VERIFICATION-STATUS.md
 *   ruleFiles       the JSON files under src/engines/<engine>/rules/
 *   lastRuleCheck   the newest `lastVerified` date inside those files
 *
 * Same contract as `@/lib/content/figures.ts`, one level up: a number a reader
 * sees carries where it came from, and it changes when the thing it describes
 * changes, in the same commit, with no editorial pass.
 *
 * ── SERVER ONLY ─────────────────────────────────────────────────────────────
 * This module reads the filesystem and spawns a process. It must only ever be
 * imported from a server component or another build-time module. Pass the
 * resolved `Proof` object to client components as props — never import this
 * from a `"use client"` file, which would fail the bundle at `node:fs`.
 *
 * ── WHY IT THROWS ───────────────────────────────────────────────────────────
 * Every reader below throws rather than falling back to a default. A silent
 * zero, or a stale cached figure, would print a wrong number on the page that
 * exists to argue the numbers here are right. Failing the build is the cheap
 * failure; shipping "0 automated tests" or last year's date is the expensive
 * one.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Repo root. Next runs the build with cwd at the project root. */
const ROOT = process.cwd();

/* ══════════════════════════════════════════════════════════════════ types ══ */

export interface ProofStat {
  /** Stable key, for React and for tests. */
  readonly id: "tests" | "figures" | "rules" | "checked";
  /** The raw figure. Strings only where the value is a date. */
  readonly value: number | string;
  /** Rendered form. Always set here so no consumer re-implements formatting. */
  readonly display: string;
  /** What the figure counts, in the reader's words. Sentence case, no period. */
  readonly label: string;
  /** Where the number came from. Shown, not just commented. */
  readonly source: string;
}

export interface Proof {
  /** Tests that actually executed in the last suite run. */
  readonly tests: number;
  /** Of those, the ones that passed. Equal to `tests` when the suite is green. */
  readonly testsPassed: number;
  /** Individual figures examined in the verification pass. */
  readonly figures: number;
  /** Of those, the ones confirmed against a primary source. */
  readonly verified: number;
  /** Versioned rule files under src/engines/<engine>/rules/. */
  readonly ruleFiles: number;
  /** Newest `lastVerified` in any rule file, ISO yyyy-mm-dd. */
  readonly lastRuleCheck: string;
  /** The same figures, ordered and formatted for the proof strip. */
  readonly stats: readonly ProofStat[];
}

/* ═══════════════════════════════════════════════════ 1. the test suite ══ */

/**
 * Counting `it(` in the test files gives 386, and the suite runs 468: eighty-two
 * cases are generated inside loops, including the eight RAP golden cases read
 * from JSON. A static parse would therefore under-report by 18% and would
 * degrade further every time a table-driven test is added — the drift this
 * module exists to prevent, reintroduced one layer down. So the suite is run
 * and its own report is read.
 *
 * It costs about 1.5s, and only on the first build after a test changes: the
 * result is cached under a SHA-256 of every byte in `tests/` plus the Vitest
 * config, so an unchanged suite is never re-run, and a changed one can never
 * serve a stale count. Content-hashed rather than mtime-keyed, because a fresh
 * clone rewrites every mtime and would invalidate a cache that is still valid.
 */
function readTestCounts(): { total: number; passed: number } {
  const fingerprint = hashTree(join(ROOT, "tests"), join(ROOT, "vitest.config.ts"));
  const cacheDir = join(ROOT, "node_modules", ".cache", "bracketsight-proof");
  const cacheFile = join(cacheDir, `tests-${fingerprint}.json`);

  if (existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, "utf8")) as { total: number; passed: number };
    if (Number.isInteger(cached.total) && cached.total > 0) return cached;
  }

  const vitestBin = join(ROOT, "node_modules", "vitest", "vitest.mjs");
  if (!existsSync(vitestBin)) {
    throw new Error(
      "src/lib/proof.ts: vitest is not installed, so the test count cannot be derived. " +
        "Run `npm install` before building — the home page prints this figure.",
    );
  }

  mkdirSync(cacheDir, { recursive: true });
  const reportFile = join(cacheDir, `run-${process.pid}.json`);
  try {
    execFileSync(
      process.execPath,
      [vitestBin, "run", "--reporter=json", `--outputFile=${reportFile}`],
      { cwd: ROOT, stdio: "ignore", env: { ...process.env, CI: "true" } },
    );
  } catch {
    // A red suite still produces a report, and the count is still true — the
    // strip reports what ran. Only a missing report is fatal, below.
  }

  if (!existsSync(reportFile)) {
    throw new Error(
      "src/lib/proof.ts: vitest produced no JSON report, so the test count cannot be derived.",
    );
  }
  const report = JSON.parse(readFileSync(reportFile, "utf8")) as {
    numTotalTests?: number;
    numPassedTests?: number;
  };
  rmSync(reportFile, { force: true });

  const total = report.numTotalTests ?? 0;
  const passed = report.numPassedTests ?? 0;
  if (!Number.isInteger(total) || total <= 0) {
    throw new Error("src/lib/proof.ts: vitest reported no tests. Refusing to print a zero.");
  }

  const counts = { total, passed };
  writeFileSync(cacheFile, JSON.stringify(counts));
  return counts;
}

/** SHA-256 over every file in the given paths, walked in sorted order. */
function hashTree(...paths: string[]): string {
  const hash = createHash("sha256");
  for (const path of paths) hashInto(hash, path);
  return hash.digest("hex").slice(0, 16);
}

function hashInto(hash: ReturnType<typeof createHash>, path: string): void {
  if (!existsSync(path)) return;
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path).sort()) hashInto(hash, join(path, entry));
    return;
  }
  hash.update(path).update(readFileSync(path));
}

/* ═══════════════════════════════════════ 2. the verification register ══ */

/**
 * The totals row of VERIFICATION-STATUS.md:
 *
 *     | **Total** | **315** | **203** | **69** | **36** | |
 *                    rows     verified  corrected unresolved
 *
 * Matched on the row label rather than on a line number, so reordering the
 * per-repo rows above it cannot silently change what the home page claims.
 */
function readVerification(): { figures: number; verified: number } {
  const file = join(ROOT, "VERIFICATION-STATUS.md");
  const text = readFileSync(file, "utf8");
  const row = text
    .split("\n")
    .find((line) => /^\|\s*\*{0,2}Total\*{0,2}\s*\|/i.test(line.trim()));
  if (!row) {
    throw new Error("src/lib/proof.ts: no totals row in VERIFICATION-STATUS.md.");
  }
  const cells = row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.replaceAll("*", "").trim());
  const figures = Number(cells[1]);
  const verified = Number(cells[2]);
  if (!Number.isInteger(figures) || !Number.isInteger(verified)) {
    throw new Error(`src/lib/proof.ts: unreadable totals row in VERIFICATION-STATUS.md: ${row}`);
  }
  return { figures, verified };
}

/* ═══════════════════════════════════════════════════ 3. the rule files ══ */

/**
 * Every versioned rule file, wherever an engine keeps it — `rules/*.json` for
 * three engines, `rules/counties/*.json` and `rules/states/*.json` for the
 * other two. Walked rather than globbed at a fixed depth, so a new engine that
 * nests its rules one level deeper is still counted.
 */
function ruleFilePaths(): string[] {
  const enginesDir = join(ROOT, "src", "engines");
  const found: string[] = [];
  for (const engine of readdirSync(enginesDir).sort()) {
    const rulesDir = join(enginesDir, engine, "rules");
    if (!existsSync(rulesDir)) continue;
    collectJson(rulesDir, found);
  }
  if (found.length === 0) {
    throw new Error("src/lib/proof.ts: found no rule files under src/engines/*/rules.");
  }
  return found;
}

function collectJson(dir: string, into: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collectJson(path, into);
    else if (entry.name.endsWith(".json")) into.push(path);
  }
}

/**
 * The newest `lastVerified` anywhere in the rule files.
 *
 * Read with a regex over the file text rather than by walking the parsed
 * object, because the key sits at a different depth in every engine's schema —
 * top-level `citations[]` in one, nested under a county or a state or a
 * per-clause citation in another. The date format is fixed (`yyyy-mm-dd`) by
 * the rule schemas, so ISO strings sort lexicographically and `max` is a
 * string comparison.
 */
function readLastRuleCheck(paths: string[]): string {
  let newest = "";
  for (const path of paths) {
    const text = readFileSync(path, "utf8");
    for (const match of text.matchAll(/"lastVerified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/g)) {
      const date = match[1]!;
      if (date > newest) newest = date;
    }
  }
  if (!newest) {
    throw new Error("src/lib/proof.ts: no lastVerified date in any rule file.");
  }
  return newest;
}

/* ═══════════════════════════════════════════════════════ presentation ══ */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** "2026-08-15" → "15 Aug 2026". Parsed from characters, never through Date. */
export function formatProofDate(iso: string): string {
  const month = MONTHS[Number(iso.slice(5, 7)) - 1];
  if (!month) return iso;
  return `${Number(iso.slice(8, 10))} ${month} ${iso.slice(0, 4)}`;
}

/* ═════════════════════════════════════════════════════════════ the API ══ */

let memo: Proof | null = null;

/**
 * The four figures, derived. Memoised for the life of the process: a build
 * renders several pages from this and none of them should re-walk the tree.
 */
export function getProof(): Proof {
  if (memo) return memo;

  const { total: tests, passed: testsPassed } = readTestCounts();
  const { figures, verified } = readVerification();
  const rulePaths = ruleFilePaths();
  const ruleFiles = rulePaths.length;
  const lastRuleCheck = readLastRuleCheck(rulePaths);

  memo = {
    tests,
    testsPassed,
    figures,
    verified,
    ruleFiles,
    lastRuleCheck,
    stats: [
      {
        id: "tests",
        value: tests,
        display: tests.toLocaleString("en-US"),
        label: "automated tests on the engines",
        source: "counted from the last suite run",
      },
      {
        id: "figures",
        value: figures,
        display: figures.toLocaleString("en-US"),
        label: `figures checked against primary sources, ${verified} verified`,
        source: "VERIFICATION-STATUS.md",
      },
      {
        id: "rules",
        value: ruleFiles,
        display: ruleFiles.toLocaleString("en-US"),
        label: "versioned rule files behind the answers",
        source: "src/engines/*/rules",
      },
      {
        id: "checked",
        value: lastRuleCheck,
        display: formatProofDate(lastRuleCheck),
        label: "last rule check against the regulation",
        source: "newest lastVerified in any rule file",
      },
    ],
  };
  return memo;
}
