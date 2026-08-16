import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { counties, filingFeeSummary, getCountyBySlug, nextDeadline } from "@/engines/property";
import {
  AnswerBox,
  FactTable,
  LastVerified,
  SourceCitation,
  WarningStack,
} from "@/components/ui";
import {
  formatDate,
  formatDateLong,
  formatNumber,
  formatPct,
  todayIso,
} from "@/lib/property/format";

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

export default async function CountyPage({ params }: { params: Promise<Params> }) {
  const { state, county } = await params;
  const rules = getCountyBySlug(state, county);
  if (!rules) notFound();

  const asOf = todayIso();
  const deadline = nextDeadline(rules, asOf);
  const other = counties.find((c) => c.countyId !== rules.countyId);
  const isMarket = rules.primaryArgument === "MARKET_VALUE";
  const imminent = deadline.daysAway !== null && deadline.daysAway <= IMMINENT_DAYS;

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
          { key: "Deadline rule", value: rules.appealWindow.deadlineRule.split(" [")[0], mono: false },
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
          { key: "Evidence standard", value: rules.evidenceStandard.split(" [")[0], mono: false },
        ]}
      />

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
