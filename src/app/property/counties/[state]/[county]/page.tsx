import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEFAULT_CRITERIA,
  MIN_COMPS,
  NOT_WORTH_IT_MAX_PCT,
  STRONG_CASE_MIN_ANNUAL_OVERPAYMENT_CENTS,
  STRONG_CASE_MIN_PCT,
  commonLevelRangeLimits,
  counties,
  filingFeeSummary,
  formatRatioBps,
  getCountyBySlug,
  nextDeadline,
} from "@/engines/property";
import {
  AnswerBox,
  FactTable,
  LastVerified,
  SourceCitation,
  WarningStack,
} from "@/components/ui";
import {
  formatCents,
  formatDate,
  formatDateLong,
  formatNumber,
  formatPct,
  todayIso,
} from "@/lib/property/format";
import { ContentsRail } from "@/components/content";

type Params = { state: string; county: string };

export function generateStaticParams(): Params[] {
  return counties.map((c) => {
    const [state, county] = c.countyId.split("-");
    return { state: state ?? "", county: county ?? "" };
  });
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { state, county } = await params;
  const rules = getCountyBySlug(state, county);
  if (!rules) return {};
  return {
    title: `${rules.countyName} Property Tax Appeal — Deadline, Fee, Forms`,
    description: `How to appeal a ${rules.countyName} assessment: the deadline rule, the ${filingFeeSummary(rules)} filing fee, where to file, and the evidence that works — cited.`,
    // Relative: the root layout owns `metadataBase`, so the origin is never
    // repeated — and a preview deployment never canonicalises to production.
    alternates: { canonical: `/property/counties/${state}/${county}` },
  };
}

/** A deadline this close is the one high-stakes fact on the page. */
const IMMINENT_DAYS = 45;

/**
 * The rules JSON appends its own verification verdict to several prose fields
 * in square brackets — "… [UNVERIFIED — confirm the current-year township
 * calendar]". The county page splits the two apart rather than hiding either:
 * the sentence is what the county does, the bracket is how far we trust it.
 */
function ruleText(text: string): string {
  return text.split(" [")[0] ?? text;
}

function verificationNote(text: string): string | null {
  const open = text.indexOf(" [");
  if (open === -1) return null;
  const inner = text.slice(open + 2).replace(/\]\s*$/, "").trim();
  return inner.length > 0 ? inner : null;
}

export default async function CountyPage({ params }: { params: Promise<Params> }) {
  const { state, county } = await params;
  const rules = getCountyBySlug(state, county);
  if (!rules) notFound();

  const asOf = todayIso();
  const deadline = nextDeadline(rules, asOf);
  const other = counties.find((c) => c.countyId !== rules.countyId);
  const isMarket = rules.primaryArgument === "MARKET_VALUE";
  const imminent = deadline.daysAway !== null && deadline.daysAway <= IMMINENT_DAYS;

  // Everything below this line varies by county because it is read out of that
  // county's rules file, not because a template branched on a state code.
  const clr = rules.commonLevelRange;
  const corridor =
    clr !== undefined
      ? commonLevelRangeLimits(clr.countyPercentageLevelBps, clr.corridorBps)
      : null;
  const feeBands = rules.filingFee.bands;
  const deadlineNote = verificationNote(rules.appealWindow.deadlineRule);
  const feeNote = verificationNote(rules.filingFee.waiverConditions);
  const evidenceNote = verificationNote(rules.evidenceStandard);
  const unverifiedCitations = rules.citations.filter((c) => !c.verified);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
        <Link href="/property/counties" className="underline underline-offset-4 hover:text-ink">
          Counties
        </Link>{" "}
        <span aria-hidden="true">/</span> {rules.stateName}
      </nav>

      <h1 className="mt-2">{rules.countyName} property tax appeal</h1>

      <AnswerBox className="mt-5">
        {rules.countyName} homeowners appeal to the {rules.appealBody}.{" "}
        {deadline.isoDate !== null && deadline.daysAway !== null ? (
          <>
            The next deadline is{" "}
            <span className="num">{formatDateLong(deadline.isoDate)}</span> —{" "}
            <span className="num">{formatNumber(deadline.daysAway)}</span> days away.
          </>
        ) : (
          <>The deadline falls about 30 days after your township opens.</>
        )}
        {/* Cited in line, beside the claim — not parked in a footer. */}
        {rules.citations[0] ? (
          <SourceCitation
            index={1}
            label={rules.citations[0].label}
            url={rules.citations[0].url}
            lastVerified={rules.citations[0].lastVerified}
          />
        ) : null}{" "}
        Filing costs{" "}
        <span className="num">
          {rules.filingFee.amountCents === 0 ? "nothing" : filingFeeSummary(rules)}
        </span>
        , and the evidence that works is{" "}
        {isMarket ? "recent comparable sales" : "comparable homes assessed lower per square foot"}.
      </AnswerBox>

      <LastVerified
        className="mt-3"
        date={rules.citations[0]?.lastVerified ?? asOf}
        ruleSetVersion={rules.ruleSetVersion}
        citation={{
          label: rules.citations[0]?.label ?? rules.appealBody,
          url: rules.citations[0]?.url ?? "/property/sources",
        }}
      />

      <ContentsRail className="mt-6" />

      {imminent && deadline.isoDate !== null && deadline.daysAway !== null ? (
        <WarningStack
          className="mt-6"
          warnings={[
            {
              id: "deadline",
              severity: "irreversible",
              title: (
                <>
                  The {rules.countyName} deadline is{" "}
                  <span className="num">{formatDateLong(deadline.isoDate)}</span> —{" "}
                  <span className="num">{formatNumber(deadline.daysAway)}</span> days away.
                </>
              ),
              body: "Miss it and this year's assessment stands. The next opportunity is a year from now, and this year's bill cannot be reopened.",
            },
          ]}
        />
      ) : null}

      <FactTable
        className="mt-8"
        caption={`Key facts for appealing an assessment in ${rules.countyName}`}
        rows={[
          { key: "Appeal body", value: rules.appealBody, mono: false },
          { key: "Window opens", value: rules.appealWindow.opens, mono: false },
          { key: "Deadline rule", value: ruleText(rules.appealWindow.deadlineRule), mono: false },
          {
            key: "Filing fee",
            value: filingFeeSummary(rules),
            mono: rules.filingFee.amountCents !== 0,
          },
          {
            key: "Argument allowed",
            value: rules.argumentTypes
              .map((a) =>
                a === "MARKET_VALUE"
                  ? "Market value, against comparable sales"
                  : "Uniformity, against comparable assessments",
              )
              .join(" · "),
            mono: false,
          },
          {
            key: "Comparable window",
            value: `${formatNumber(rules.compsWindowMonths)} months`,
          },
          {
            key: "Estimated rate on assessed value",
            value: formatPct(rules.estimatedTaxRateOnAssessedBps / 100),
          },
          { key: "Evidence standard", value: ruleText(rules.evidenceStandard), mono: false },
        ]}
      />

      {/* ---- What the hearing body is actually deciding --------------------- */}
      {clr !== undefined && corridor !== null ? (
        <section className="mt-10">
          <h2>Chapter 123 decides a {rules.countyName} appeal before your comparables do</h2>
          <p className="mt-2 max-w-[68ch]">
            {rules.stateName} does not ask the {rules.appealBody} whether your assessment sits
            above market value and stop there. It asks where your assessment-to-true-value ratio
            falls against your municipality&apos;s average ratio — the Director&apos;s Ratio the
            Division of Taxation republishes every{" "}
            <span className="num">1 April</span>, district by district — and that question
            outranks the comparison. The governing law is {clr.statute}.
          </p>
          <p className="mt-3 max-w-[68ch]">
            The corridor runs <span className="num">{formatRatioBps(clr.corridorBps)}</span>{" "}
            either side of the average ratio, multiplied rather than added. Take a district
            sitting exactly at the county percentage level of{" "}
            <span className="num">{formatRatioBps(clr.countyPercentageLevelBps)}</span>: its
            common level range would run{" "}
            <span className="num">{formatRatioBps(corridor.lowerLimitBps)}</span> to{" "}
            <span className="num">{formatRatioBps(corridor.upperLimitBps)}</span>. A ratio inside
            that band leaves the board nothing to grant, however far the comparable sales put
            your assessment above market. A ratio above it resets the assessment to the average
            ratio multiplied by true value — not to the figure your comparables imply, which is
            usually a different number. A ratio below it runs the same arithmetic in the other
            direction, and the assessment goes up. The increase is the statutory outcome, not a
            risk the board might take.
          </p>
          <p className="mt-3 max-w-[68ch]">
            Above the county percentage level the corridor stops being the test at all. Where
            your ratio exceeds{" "}
            <span className="num">{formatRatioBps(clr.countyPercentageLevelBps)}</span> — an
            assessment above full true value — the handbook&apos;s clauses (3) and (4) take
            over, and the assessment is reset either to the district&apos;s average ratio times
            true value or to the county percentage level times true value, depending on where
            the district&apos;s own ratio sits. The engine implements all four clauses.
          </p>
          {clr.municipalities.length === 0 ? (
            <p className="mt-3 max-w-[68ch]">
              What it does not have is the input. {clr.unpopulatedNote} Until a ratio is read and
              cited for your municipality, every {rules.countyName} check returns{" "}
              &ldquo;cannot determine&rdquo; and names the missing figure, rather than falling
              back to a generic over-assessment threshold that has no relationship to the test
              this board applies. {rules.countyName} contains roughly{" "}
              <span className="num">70</span> taxing districts, each with its own ratio and its
              own citation requirement before the rules loader will accept it.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="mt-10">
          <h2>A {rules.countyName} appeal is argued on unequal treatment, not on market value</h2>
          <p className="mt-2 max-w-[68ch]">
            The engine runs {rules.countyName} as a uniformity case. Each comparable&apos;s ratio
            is its assessed value divided by its living area; the median of those, multiplied by
            your square footage, is what your assessment would be if you were treated the way
            your neighbours are. No sale price enters that chain anywhere, which is why the check
            still works on a street where nothing has changed hands in years.
          </p>
          <p className="mt-3 max-w-[68ch]">
            No statutory ratio corridor constrains this board, so the size of the gap is the
            case. The thresholds that turn a gap into a recommendation are ours rather than the
            board&apos;s, and they are deliberately conservative: a gap under{" "}
            <span className="num">{formatPct(NOT_WORTH_IT_MAX_PCT)}</span> of the implied fair
            assessment is treated as appraisal noise and returns &ldquo;not worth it&rdquo;, and
            a strong case needs a gap of at least{" "}
            <span className="num">{formatPct(STRONG_CASE_MIN_PCT)}</span>, high confidence, and
            an estimated annual overpayment of at least{" "}
            <span className="num">{formatCents(STRONG_CASE_MIN_ANNUAL_OVERPAYMENT_CENTS)}</span>.
            Most homes come back &ldquo;looks fair&rdquo;, which is the honest result for most
            homes.
          </p>
          <p className="mt-3 max-w-[68ch]">
            One caution belongs here rather than in a footnote. The Board of Review&apos;s
            published official rules do not enumerate permissible grounds, and the board
            describes its own work as hearing appeals of over-valuation — which is a market-value
            framing, not a uniformity one. Uniformity-first is what this county&apos;s rules file
            encodes and it has not been confirmed against a primary source, because the
            Assessor&apos;s site refuses automated requests. It is the highest-stakes unverified
            value in the file: it selects the entire ratio model, so if it is wrong the verdict
            is computed on the wrong basis rather than merely labelled oddly.
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2>What are the appeal levels in {rules.countyName}?</h2>
        <p className="mt-2 max-w-[68ch] text-dim">
          Start at the first level. Each later one reviews the decision before it, so a case that
          was never made at the county board is hard to make afterwards.
        </p>
        <ol className="mt-3 flex list-none flex-col gap-2 p-0">
          {rules.levels.map((level, i) => (
            <li key={level} className="hairline-t flex gap-3 pt-2">
              <span className="num micro-label shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span>{level}</span>
            </li>
          ))}
        </ol>
        {rules.levels.length > 2 ? (
          <p className="mt-3 max-w-[68ch] text-dim">
            The last two are alternatives, not sequential steps: after the Board of Review you
            choose one of them, and choosing is the end of the choice.
          </p>
        ) : (
          <p className="mt-3 max-w-[68ch] text-dim">
            An appeal from a county board judgment to the Tax Court runs on its own clock — 45
            days from the mailing of the judgment — which this page does not track and the engine
            does not count down.
          </p>
        )}
      </section>

      {/* ---- The deadline mechanic ------------------------------------------ */}
      <section className="mt-10">
        {deadline.kind === "FIXED_ANNUAL" ? (
          <>
            <h2>Posting the petition on the deadline is not filing it</h2>
            {deadline.filingCutoffNote !== null ? (
              <p className="mt-2 max-w-[68ch]">{ruleText(deadline.filingCutoffNote)}</p>
            ) : null}
            <p className="mt-3 max-w-[68ch]">
              The window opens {rules.appealWindow.opens}, and the rule that closes it is this:{" "}
              {ruleText(rules.appealWindow.deadlineRule)} The countdown at the top of this page
              runs to the fixed annual date, because that is the only limb of the rule the engine
              can compute.
            </p>
            <p className="mt-3 max-w-[68ch]">
              Two things can move the real deadline later than the date shown. Where a
              municipality has not completed the bulk mailing of its assessment notices at least
              45 days before the deadline, the deadline extends, on the strength of the
              certification of bulk mailing filed with the county board — and no field on this
              site captures a bulk-mailing date, so that extension cannot be calculated here. And
              where the last day falls on a Saturday,
              Sunday or legal holiday, the deadline moves to the first business day after it,
              which the countdown does not model either. Both errors run in the safe direction:
              the date shown is never later than the date the law allows. Neither is a substitute
              for confirming your own date with the board.
            </p>
          </>
        ) : (
          <>
            <h2>There is no countdown on this page, and that is the correct answer</h2>
            <p className="mt-2 max-w-[68ch]">
              {rules.countyName}&apos;s filing deadline is not an interval anybody can compute
              from a notice. The window opens {rules.appealWindow.opens}, and the operative
              deadline is a close date each body publishes for each township, every session. The
              rules file carries{" "}
              <span className="num">{formatNumber(rules.appealWindow.daysAfterNotice ?? 0)}</span>{" "}
              days after notice as its model, and that figure is a stated <em>minimum</em> rather
              than the rule: the Board of Review says townships are open a minimum of{" "}
              <span className="num">{formatNumber(rules.appealWindow.daysAfterNotice ?? 0)}</span>{" "}
              days, and in the 2026 calendar the first township group opened on{" "}
              <span className="num">3 August</span> and closed on{" "}
              <span className="num">1 September</span> — a shorter span than that. Counting
              forward from your notice therefore overshoots, and overshooting a filing deadline by
              one day costs the year. Read your township&apos;s published close date; do not
              compute one.
            </p>
            <p className="mt-3 max-w-[68ch]">
              A second date matters just as much and appears nowhere in the rules file. The Board
              of Review sets a separate evidence-submission deadline that falls <em>after</em> the
              filing deadline — for that same 2026 group, filing closed on{" "}
              <span className="num">1 September</span> and evidence was due on{" "}
              <span className="num">11 September</span>. A homeowner can file on time and still
              lose the appeal on evidence, and this site has no concept of that second deadline,
              so it cannot warn you when it approaches. Ask for both dates when you ask for one.
            </p>
            <p className="mt-3 max-w-[68ch]">
              Nor does the ruleset record whether a mailed complaint is judged by its postmark or
              by the date it arrives — a distinction that decides whether posting on the last day
              works. New Jersey&apos;s answer has been read from a primary source and is stated on
              the Bergen page. Illinois&apos;s has not, so this page says nothing about it rather
              than guessing at the version that would sound more helpful.
            </p>
          </>
        )}
        {deadlineNote !== null ? (
          <p className="mt-3 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            Verification status of the deadline rule above: {deadlineNote}.
          </p>
        ) : null}
      </section>

      {/* ---- The fee -------------------------------------------------------- */}
      <section className="mt-10">
        {feeBands !== undefined && feeBands.length > 0 ? (
          <>
            <h2>The filing fee is banded by assessed value, and the band changes the verdict</h2>
            <p className="mt-2 max-w-[68ch]">
              There is no flat fee to quote. The statutory schedule steps with the assessed value
              under appeal:
            </p>
            <ul className="mt-3 flex list-none flex-col gap-2 p-0">
              {feeBands.map((band) => (
                <li key={band.label} className="hairline-t flex justify-between gap-4 pt-2">
                  <span>{band.label}</span>
                  <span className="num">{formatCents(band.amountCents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-[68ch]">
              That range matters beyond the cheque. The check compares your estimated first-year
              saving against the fee you would actually pay, and refuses to call an appeal worth
              filing when the saving does not clear it. Reading the middle band as though it were
              the whole schedule understates the fee on a home at the top of the range by a factor
              of six, and lets through a recommendation the fee should have stopped.
            </p>
            <p className="mt-3 max-w-[68ch]">
              The schedule above governs valuation appeals, which is all this site models. No fee
              is charged on an appeal from the denial of a veteran, surviving-spouse,
              senior or disabled, or disabled-veteran deduction or exemption — a different kind of
              appeal, out of scope here rather than handled wrongly.
            </p>
            {feeNote !== null ? (
              <p className="mt-3 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                Verification status of the fee schedule: {feeNote}.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2>Filing costs nothing here, which removes one check on the verdict</h2>
            <p className="mt-2 max-w-[68ch]">
              {ruleText(rules.filingFee.waiverConditions)} A zero fee is good news for a
              homeowner and a complication for an honest verdict: one of the three tests that can
              return &ldquo;not worth it&rdquo; is whether the estimated first-year saving clears
              the filing fee, and against a fee of nothing that test can never fire. What stops a
              marginal case here is the {formatPct(NOT_WORTH_IT_MAX_PCT)} noise floor and the
              confidence score, and nothing else.
            </p>
            <p className="mt-3 max-w-[68ch]">
              The free-filing claim is also only half-confirmed. It is verified for the Board of
              Review, which states plainly that filing there is free. The same sentence in the
              rules file extends it to the Assessor&apos;s Office, and that half has never been
              read from the Assessor, whose site returns a bot block to every automated request.
              If the Assessor charges, a verdict computed against a fee of{" "}
              <span className="num">{formatCents(rules.filingFee.amountCents)}</span> is
              comparing a saving against the wrong number.
            </p>
            {feeNote !== null ? (
              <p className="mt-3 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                Verification status of the fee: {feeNote}.
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="mt-10">
        <h2>Which form do I file?</h2>
        <ul className="mt-3 flex list-none flex-col gap-2 p-0">
          {rules.forms.map((form) => (
            <li key={form.id} className="hairline-t pt-2">
              <a
                href={form.pdfUrl}
                rel="noopener noreferrer"
                className="underline decoration-rule underline-offset-4 hover:decoration-current"
              >
                {form.name}
              </a>{" "}
              <span className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                {form.fillable ? "fillable PDF" : "print and complete"}
              </span>
            </li>
          ))}
        </ul>
        {rules.forms.every((f) => f.pdfUrl.endsWith(".pdf")) ? (
          <p className="mt-3 max-w-[68ch] text-dim">
            Both links were dead when they were last checked and have been replaced with the
            Division of Taxation&apos;s current files. Form revision codes change without notice,
            so the pair is re-checked annually — if a link fails, the form has moved rather than
            been withdrawn.
          </p>
        ) : (
          <p className="mt-3 max-w-[68ch] text-dim">
            Neither entry is a downloadable complaint form. Residential filing at both levels is
            done through an online portal rather than a PDF, so these links open the office that
            runs the portal. There is no paper residential form to print at the Board of Review.
          </p>
        )}
      </section>

      {/* ---- What survives the filters -------------------------------------- */}
      <section className="mt-10">
        <h2>
          {isMarket
            ? `A ${rules.countyName} comparison needs sales, and it needs at least ${MIN_COMPS} of them`
            : `A ${rules.countyName} comparison needs at least ${MIN_COMPS} comparable assessments, not sales`}
        </h2>
        <p className="mt-2 max-w-[68ch]">
          {ruleText(rules.evidenceStandard)}
        </p>
        <p className="mt-3 max-w-[68ch]">
          The check applies four hard filters before it computes anything: same property class,
          same neighbourhood or assessment area, living area within{" "}
          <span className="num">±{formatNumber(DEFAULT_CRITERIA.sizeTolerancePct)}%</span> of
          yours, and{" "}
          {isMarket ? "a recorded arm's-length sale" : "an assessment"} inside this county&apos;s{" "}
          <span className="num">{formatNumber(rules.compsWindowMonths)}</span>-month window. The
          survivors are ranked by similarity and the closest{" "}
          <span className="num">{formatNumber(DEFAULT_CRITERIA.maxComps)}</span> are kept. Fewer
          than <span className="num">{formatNumber(MIN_COMPS)}</span> survivors and no verdict is
          produced at all — every rejection is listed with the reason it was rejected, so a thin
          result reads as a thin result rather than a confident one.
        </p>
        <p className="mt-3 max-w-[68ch]">
          The <span className="num">{formatNumber(rules.compsWindowMonths)}</span>-month window is
          the weakest link in that chain. No published{" "}
          {isMarket ? "sale-recency" : "evidence-recency"} standard was found in any reachable{" "}
          {rules.stateName} source, so the figure is a modelling default rather than a rule the
          board enforces. Treat it as a filter this site applies, not as a limit the board would.
        </p>
        {evidenceNote !== null ? (
          <p className="mt-3 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            Verification status of the evidence standard: {evidenceNote}.
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2>Is my assessment actually too high?</h2>
        <p className="mt-2 max-w-[68ch]">
          Run the{" "}
          <Link href="/property/check" className="underline underline-offset-4">
            free assessment check
          </Link>{" "}
          with {rules.countyName}&apos;s rules applied. It picks comparable homes, takes their
          median assessment ratio, and tells you honestly whether the gap is worth the{" "}
          <span className="num">
            {rules.filingFee.amountCents === 0 ? "paperwork" : filingFeeSummary(rules)}
          </span>{" "}
          and your afternoon. Most people are told not to file. The arithmetic is on the{" "}
          <Link href="/property/methodology" className="underline underline-offset-4">
            methodology page
          </Link>
          .
        </p>
      </section>

      {/* ---- What is not settled -------------------------------------------- */}
      <section className="mt-10">
        <h2>
          {clr !== undefined
            ? "The one input this county's verdict needs has not been read from a primary source"
            : "The Assessor's site is bot-blocked, so several values on this page are unverified"}
        </h2>
        <p className="mt-2 max-w-[68ch]">
          The estimated rate on assessed value in the table above —{" "}
          <span className="num">{formatPct(rules.estimatedTaxRateOnAssessedBps / 100)}</span> — is
          unresolved, and it is the multiplier behind every dollar figure the check reports as an
          estimated annual overpayment.{" "}
          {clr !== undefined
            ? "New Jersey general tax rates are struck per municipality, per year; a single county-average constant cannot stand in for roughly seventy of them."
            : "Cook's real burden is the assessment level multiplied by the state equalization factor the Illinois Department of Revenue re-strikes every year, multiplied again by the composite rate of the districts your parcel sits in. This rules file collapses all three into one constant, which is a rough estimate and is labelled as one."}{" "}
          Read the dollar figure as an order of magnitude, not as a bill.
        </p>
        {clr !== undefined ? (
          <p className="mt-3 max-w-[68ch]">
            The county-level assessment level in the ruleset —{" "}
            <span className="num">{formatPct(rules.assessmentLevelPctOfMarket)}</span> of market
            value — is wrong as a modelling assumption and is deliberately not read by the verdict
            path. Every municipality has its own ratio; a county constant holds only in a district
            sitting exactly at the county percentage level. The per-municipality lookup that
            replaces it exists and is empty, which is the whole reason a verdict is withheld here.
          </p>
        ) : (
          <p className="mt-3 max-w-[68ch]">
            The assessment level used to convert market value to assessed value —{" "}
            <span className="num">{formatPct(rules.assessmentLevelPctOfMarket)}</span> — rests
            only on secondary summaries. The Cook County Classification Ordinance could not be
            reached from any official host, and until the ordinance itself is read the value stays
            flagged. It scales every Cook dollar figure, so if it is wrong they are all wrong by
            the same proportion.
          </p>
        )}
        <p className="mt-3 max-w-[68ch]">
          {unverifiedCitations.length > 0 ? (
            <>
              <span className="num">{formatNumber(unverifiedCitations.length)}</span> of the{" "}
              <span className="num">{formatNumber(rules.citations.length)}</span> sources listed
              below are still marked awaiting primary-source verification:{" "}
              {unverifiedCitations.map((c) => c.label).join("; ")}. A citation that has not been
              opened is treated as an open item even where the fact it supports is confirmed
              somewhere else.
            </>
          ) : (
            <>
              All <span className="num">{formatNumber(rules.citations.length)}</span> sources
              listed below have been fetched and returned the content they are cited for.
            </>
          )}{" "}
          The full register of what is unresolved across the site, and what would close each item,
          sits behind the{" "}
          <Link href="/property/sources" className="underline underline-offset-4">
            sources page
          </Link>
          ; every correction to this county&apos;s ruleset is dated in the{" "}
          <Link href="/property/changelog" className="underline underline-offset-4">
            changelog
          </Link>
          .
        </p>
        <p className="mt-3 max-w-[68ch]">
          None of this is legal or tax advice, and nothing here predicts an outcome. A board that
          hears your appeal weighs condition, renovations and location factors that this site does
          not model at all. Confirm your own deadline, your own fee and your own filing method
          with the {rules.appealBody} before you rely on any of it.
        </p>
      </section>

      <section className="hairline-t mt-10 pt-6">
        <h2>Sources</h2>
        <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-dim">
          {rules.citations.map((cite, i) => (
            <li
              key={cite.url + cite.label}
              className="flex gap-3"
              style={{ fontSize: "var(--text-step--1)" }}
            >
              <span className="num micro-label shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <a
                  href={cite.url}
                  rel="noopener noreferrer"
                  className="underline decoration-rule underline-offset-4 hover:decoration-current"
                >
                  {cite.label}
                </a>{" "}
                — verified <span className="num">{formatDate(cite.lastVerified)}</span>
                {cite.verified ? "" : " · awaiting primary-source verification"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-[68ch] text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Anything marked &ldquo;awaiting primary-source verification&rdquo; is tracked in the
          project&apos;s verification log and does not drive a filed appeal until it is confirmed.
          Confirm your deadline with the county before you rely on it.
        </p>
        {other ? (
          <p className="mt-3" style={{ fontSize: "var(--text-step--1)" }}>
            Also live:{" "}
            <Link
              href={`/property/counties/${other.state.toLowerCase()}/${other.countyId.split("-")[1]}`}
              className="underline underline-offset-4"
            >
              {other.countyName}, {other.stateName} property tax appeal
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
