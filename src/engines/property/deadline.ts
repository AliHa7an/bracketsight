/**
 * Deadline countdown, computed from the county rules JSON — never hard-coded.
 *
 * Two machine-readable kinds:
 * - FIXED_ANNUAL: a recurring month/day (e.g. New Jersey's April 1). The next
 *   occurrence on or after `asOf` is returned with a day count.
 * - NOTICE_RELATIVE: N days after the assessment notice mails (e.g. Cook
 *   County's rolling township calendar). No fixed date is computable without
 *   the user's notice date, so only the rule text is returned.
 *
 * All date math is UTC date-only to stay deterministic across timezones.
 *
 * A date is only half the rule. What SATISFIES the date matters just as much:
 * New Jersey's petition must be RECEIVED by the county board — "A postmark of a
 * mailed petition is not sufficient" (NJ Assessors Handbook §1105.01). A
 * homeowner who posts on 1 April loses the year. `filingCutoff` carries that
 * distinction out of the rules JSON so the UI can state it.
 *
 * KNOWN-GAP GAP-051: weekend/holiday rollover is not implemented. NJ Assessors
 * Handbook §1105.01 — if the last day for filing falls on a Saturday, Sunday or
 * legal holiday, the deadline is the first business day thereafter. The
 * countdown can therefore show a deadline a day or more earlier than the law
 * allows. Errs safe, still wrong. Rule is VERIFIED; this is unbuilt.
 *
 * KNOWN-GAP GAP-052: the FIXED_ANNUAL branch cannot express New Jersey's real
 * deadline. N.J.S.A. 54:3-21 makes it April 1 OR 45 days from the mailing of
 * the Notification of Assessment, whichever is later — extended whenever a
 * municipality has not completed bulk mailing at least 45 days before April 1,
 * per the certification filed with the county board. There is no bulk-mailing
 * date input, so a homeowner in a late-mailing municipality is shown April 1
 * when they in fact have longer.
 *
 * KNOWN-GAP GAP-008 / GAP-009: NOTICE_RELATIVE is also the wrong model for Cook
 * County — the operative deadline is a per-township published close date, with
 * 30 days as a floor, and there is a second, later evidence-submission deadline
 * this module has no concept of. See /KNOWN-GAPS.md for all four.
 */

import type { CountyRules, DeadlineInfo } from "./types";

const MS_PER_DAY = 86_400_000;

function isoToUtc(iso: string): number {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) throw new Error(`invalid ISO date: ${iso}`);
  return t;
}

function toIso(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

export function nextDeadline(county: CountyRules, asOfIso: string): DeadlineInfo {
  const w = county.appealWindow;
  const cutoff = {
    filingCutoff: w.filingCutoff ?? ("UNSPECIFIED" as const),
    filingCutoffNote: w.filingCutoff === undefined ? null : (w.filingCutoffNote ?? null),
  };

  if (w.deadlineKind === "FIXED_ANNUAL") {
    if (w.fixedMonth === undefined || w.fixedDay === undefined) {
      throw new Error(
        `${county.countyId}: FIXED_ANNUAL deadline requires fixedMonth and fixedDay`,
      );
    }
    const asOfMs = isoToUtc(asOfIso);
    const asOfYear = new Date(asOfMs).getUTCFullYear();
    let deadlineMs = Date.UTC(asOfYear, w.fixedMonth - 1, w.fixedDay);
    if (deadlineMs < asOfMs) {
      deadlineMs = Date.UTC(asOfYear + 1, w.fixedMonth - 1, w.fixedDay);
    }
    return {
      kind: "FIXED_ANNUAL",
      isoDate: toIso(deadlineMs),
      daysAway: Math.round((deadlineMs - asOfMs) / MS_PER_DAY),
      ruleText: w.deadlineRule,
      ...cutoff,
    };
  }

  return {
    kind: "NOTICE_RELATIVE",
    isoDate: null,
    daysAway: null,
    ruleText: w.deadlineRule,
    ...cutoff,
  };
}
