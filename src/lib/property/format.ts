import type { Cents } from "@/engines/property";

/**
 * Formatting helpers — the single source of truth for how a number reaches a
 * homeowner's eye. Design contract §"Formatting helpers".
 *
 * Two rules bind everything here:
 *   1. Currency NEVER abbreviates. "$1,204,000", never "$1.2M" — on an
 *      assessment table an approximation reads as imprecision.
 *   2. Negatives carry a MINUS SIGN (U+2212, the typographic minus, which is
 *      the same width as a digit in a tabular face), never parentheses.
 *
 * Every string produced here is meant to be rendered inside `.num`.
 *
 * The engine has its own `formatCents` for the sentences it composes; these are
 * the app-layer twins with the same rounding, so a figure reads identically
 * whether the engine wrote the sentence or the component did.
 */

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_NAMES_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** U+2212 MINUS SIGN — tabular-width, unlike the hyphen-minus. */
const MINUS = "−";

/** $1,234 (whole dollars, rounded half away from zero). */
export function usd(cents: Cents): string {
  const dollars = Math.round(Math.abs(cents) / 100);
  return `${cents < 0 ? MINUS : ""}$${dollars.toLocaleString("en-US")}`;
}

/** $1,234.56 (exact cents). */
export function usdExact(cents: Cents): string {
  const sign = cents < 0 ? MINUS : "";
  const abs = Math.round(Math.abs(cents));
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = (abs % 100).toString().padStart(2, "0");
  return `${sign}$${dollars}.${rem}`;
}

/**
 * "$1,204" — cents shown only when they are non-zero, so whole-dollar columns
 * stay clean and a $1,204.37 figure is never silently rounded away.
 */
export function formatCents(cents: Cents): string {
  return Math.round(cents) % 100 === 0 ? usd(cents) : usdExact(cents);
}

/** "$1,204.37" — always two decimal places. For traces and audit rows. */
export function formatCentsExact(cents: Cents): string {
  return usdExact(cents);
}

/**
 * "8 Aug 2026" — never 08/08/2026, which is ambiguous internationally and
 * reads as a form field rather than a fact.
 *
 * Parsed from the ISO string's own characters, never through `new Date()`,
 * so a date can't shift a day by crossing a timezone boundary.
 */
export function formatDate(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const name = MONTH_NAMES[month - 1];
  if (!name || !Number.isFinite(year) || year === 0) return iso;

  const day = Number(iso.slice(8, 10));
  if (!Number.isFinite(day) || day === 0) return `${name} ${year}`;
  return `${day} ${name} ${year}`;
}

/** "1 April 2027" — the long form, for the deadline sentence a homeowner reads. */
export function formatDateLong(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  const name = MONTH_NAMES_LONG[month - 1];
  if (!name || !Number.isFinite(year) || !Number.isFinite(day) || day === 0) {
    return formatDate(iso);
  }
  return `${day} ${name} ${year}`;
}

/**
 * "5.0%" — one decimal, maximum. Takes a percentage, not a fraction:
 * `formatPct(5)` is "5.0%". Basis points convert with `bps / 100`.
 */
export function formatPct(pct: number): string {
  const rounded = Math.abs(pct).toFixed(1);
  return `${pct < 0 ? MINUS : ""}${rounded}%`;
}

/** "1,850" — counts, square feet, days. Always inside `.num`. */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** "12 yrs 4 mos" from a month count. Singulars stay singular. */
export function formatMonths(months: number): string {
  const total = Math.max(0, Math.round(months));
  const yr = Math.floor(total / 12);
  const mo = total % 12;
  const yrLabel = `${yr} ${yr === 1 ? "yr" : "yrs"}`;
  const moLabel = `${mo} ${mo === 1 ? "mo" : "mos"}`;
  if (yr === 0) return moLabel;
  if (mo === 0) return yrLabel;
  return `${yrLabel} ${moLabel}`;
}

/** Today, as a UTC ISO date. The engine's `asOf` for every check on the page. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
