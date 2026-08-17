/**
 * The unresolved register, read as data.
 *
 * `KNOWN-GAPS.md` at the repository root carries 55 open verification items
 * across the five engines. Some of them sit directly under a figure an article
 * wants to print — the graduated-plan step interval has no regulatory basis at
 * all (GAP-045), the assumed marginal tax rate is a modelling estimate and not
 * a rule (GAP-046), the trades pricing dataset is entirely placeholder
 * reference data (GAP-031). An article that prints one of those numbers flat,
 * with a citation and a verified date beside it, is making a claim the project
 * has already recorded that it cannot support.
 *
 * So the register is parsed rather than paraphrased. `<KeyFigure>` asks this
 * module for the row, and renders the register's own words. When a gap closes,
 * the row is deleted from the markdown and the disclosure disappears from
 * every article that carried it, in the same commit — which is the only
 * arrangement where the two cannot drift.
 *
 * SERVER ONLY. This reads the filesystem. It is imported by server components
 * during prerender and by nothing that ships to a browser; `figures.ts` stays
 * deliberately free of it and carries gap *ids* only, so the pure figure data
 * can be imported from anywhere.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface KnownGap {
  /** `GAP-045`. */
  readonly id: string;
  /** The register's group heading: "G. Documented simplification". */
  readonly group: string;
  /** What is unresolved, in the register's words. */
  readonly gap: string;
  /** The engine package and file the gap lives in. */
  readonly location: string;
  /** What a reader actually experiences because of it. */
  readonly impact: string;
  /** What would close it. */
  readonly unblocks: string;
  /** The source that would close it, when the register names a URL. */
  readonly sourceUrl: string | null;
}

/** Where the register lives, relative to the repository root. */
const REGISTER_FILE = "KNOWN-GAPS.md";

/**
 * Markdown inline formatting, removed for display.
 *
 * The register is written for a developer reading it in a terminal, so it uses
 * backticks for file paths and asterisks for emphasis. Rendered into an
 * article those become literal punctuation. Only the formatting is stripped —
 * never a word, and never a qualifier.
 */
function plainText(cell: string): string {
  return cell
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRegister(markdown: string): Map<string, KnownGap> {
  const gaps = new Map<string, KnownGap>();
  let group = "";

  for (const line of markdown.split("\n")) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading?.[1]) {
      group = plainText(heading[1]);
      continue;
    }

    if (!line.startsWith("| GAP-")) continue;

    // Every row in every one of the register's eight tables is six columns:
    // id | Gap | Package / file | User-visible impact | What unblocks it | Source.
    const cells = line.split("|").slice(1, -1);
    if (cells.length !== 6) {
      throw new Error(
        `KNOWN-GAPS.md: expected 6 columns, found ${String(cells.length)} in:\n${line}`,
      );
    }

    const [id, gap, location, impact, unblocks, source] = cells.map(plainText) as [
      string,
      string,
      string,
      string,
      string,
      string,
    ];

    gaps.set(id, {
      id,
      group,
      gap,
      location,
      impact,
      unblocks,
      // The last column is a bare URL for most rows and prose ("no code
      // location") for a few. Only keep it when it is something to link to.
      sourceUrl: source.startsWith("https://") ? source.split(/\s+/)[0] ?? null : null,
    });
  }

  if (gaps.size === 0) {
    throw new Error(
      "KNOWN-GAPS.md parsed to zero rows. The table format changed — fix the parser in " +
        "src/lib/content/known-gaps.ts rather than letting figures render without their disclosures.",
    );
  }

  return gaps;
}

let cache: Map<string, KnownGap> | null = null;

/**
 * Parsed lazily and once. Lazily so that merely importing a module in this
 * folder never touches the disk; once because fifty articles resolving the
 * same register would otherwise re-read and re-parse a 48 KB file per figure.
 */
function register(): Map<string, KnownGap> {
  cache ??= parseRegister(readFileSync(join(process.cwd(), REGISTER_FILE), "utf8"));
  return cache;
}

/**
 * One row, or a throw.
 *
 * A figure that declares `GAP-999` is a typo, and a typo that silently
 * resolves to "no disclosure" removes a warning from a money page. Loud is
 * correct: this runs during `next build`.
 */
export function getKnownGap(id: string): KnownGap {
  const gap = register().get(id);
  if (!gap) {
    throw new Error(
      `Unknown gap id "${id}". It is referenced by a figure in src/lib/content/figures.ts ` +
        `but appears in no table in KNOWN-GAPS.md. Either the id is wrong, or the gap was ` +
        `closed and the figure's knownGapIds should be emptied in the same change.`,
    );
  }
  return gap;
}

/** Resolves a figure's gap ids, in register order. Empty in, empty out. */
export function describeKnownGaps(ids: readonly string[]): KnownGap[] {
  return ids.map(getKnownGap);
}

/** How many items the register currently carries. Surfaced on `/glossary`. */
export function knownGapCount(): number {
  return register().size;
}
