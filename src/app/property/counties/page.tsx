import type { Metadata } from "next";
import Link from "next/link";
import { counties, filingFeeSummary, nextDeadline } from "@/engines/property";
import { AnswerBox, FactTable, LastVerified } from "@/components/ui";
import { formatDateLong, formatNumber, todayIso } from "@/lib/property/format";

export const metadata: Metadata = {
  alternates: { canonical: "/property/counties" },
  title: "Property Tax Appeal Rules by County — Deadlines, Fees, Forms",
  description:
    "County-by-county appeal playbooks: deadline, filing fee, appeal body, forms, and evidence standard — each rule cited to the county authority.",
};

export default function CountiesPage() {
  const asOf = todayIso();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1>County appeal playbooks</h1>

      <AnswerBox className="mt-4">
        Appeal rules are set county by county, not nationally. A county page here publishes only
        once its deadline, fee, forms, appeal body and evidence standard are encoded and cited —{" "}
        <span className="num">{counties.length}</span> are live today.
      </AnswerBox>

      <p className="mt-4 max-w-[68ch] text-dim">
        If your county is not here yet, the{" "}
        <Link href="/property/check" className="underline underline-offset-4">
          assessment check
        </Link>{" "}
        still shows you the analysis and the arithmetic, and the{" "}
        <Link href="/property/methodology" className="underline underline-offset-4">
          methodology
        </Link>{" "}
        tells you what to gather. A thin county page that cannot actually help you file is worse
        than no page, so we do not publish one.
      </p>

      <h2 className="mt-12">What has to be true before a county page publishes?</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        Five things, each read off the county&rsquo;s own authority rather than a state summary or
        a national aggregator. The deadline, and whether it is a received-by date or a postmark
        date &mdash; the difference decides whether posting on the last day works. The filing fee,
        including any banded schedule, because a fee that scales with assessed value changes the
        answer to &ldquo;is this worth filing&rdquo;. The body you file with, which is not always
        the assessor. The forms, as links that resolve today. And the evidence standard: what the
        board is actually deciding.
      </p>

      <p className="mt-4 max-w-[68ch] text-dim">
        The last one is why a county page cannot be generated from a template. Some jurisdictions
        decide on market value against comparable sales; others decide on uniformity against
        comparable assessments. A few apply a statutory corridor that can require the board to
        deny an appeal even when the assessment is provably above market value. An appeal argued
        on the wrong basis loses on the merits, so the argument a county page tells you to make is
        the part that has to come from that county&rsquo;s own rules.
      </p>

      <h2 className="mt-12">Why are only a few counties covered?</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        Because every assessing jurisdiction in the country sets its own procedure and no single
        authority publishes them in a usable form. Each one is transcribed by hand from its own
        site and statutes, and a county only ships when every
        field above has been read from a primary source. Where a source is unreachable &mdash; a
        blocked assessor site, a dead form link, a ratio table that is not published online &mdash;
        the value is left alone and the gap is recorded rather than filled with something
        plausible. That is slower than scraping, and it is the only version of this page worth
        publishing.
      </p>

      <h2 className="mt-12">What if your county is not listed?</h2>

      <p className="mt-4 max-w-[68ch] text-dim">
        The{" "}
        <Link href="/property/check" className="underline underline-offset-4">
          assessment check
        </Link>{" "}
        still works. The comparable-assessment analysis, the median ratio and the confidence score
        are arithmetic and do not depend on your county&rsquo;s procedure &mdash; only the
        deadline, the fee and the form do. So you can find out whether you have a case, then get
        the three procedural facts from your county&rsquo;s assessor or board of review directly.
        Ask for the appeal deadline and whether it is received-by or postmarked, the filing fee at
        your assessed value, and whether the board decides on market value or on uniformity.
      </p>

      <p className="mt-4 max-w-[68ch] text-dim">
        If you want your county added, send its assessor or board URL to the address on the{" "}
        <Link href="/contact" className="underline underline-offset-4">
          contact page
        </Link>
        . Counties whose rules are published in a readable form get encoded first, because those
        are the ones that can be verified rather than guessed at.
      </p>

      <h2 className="mt-12">Counties covered today</h2>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        {counties.map((county) => {
          const slug = county.countyId.split("-")[1] ?? "";
          const deadline = nextDeadline(county, asOf);
          return (
            <section key={county.countyId}>
              {/* The link wraps the heading rather than sitting inside it, so
                  the display face stays on an h2 and never on an inline child. */}
              <Link
                href={`/property/counties/${county.state.toLowerCase()}/${slug}`}
                className="rounded-atlas block underline decoration-rule underline-offset-4 hover:decoration-current"
              >
                <h2>
                  {county.countyName}, {county.stateName}
                </h2>
              </Link>
              <FactTable
                className="mt-3"
                caption={`${county.countyName} appeal facts`}
                rows={[
                  { key: "Where you file", value: county.appealBody, mono: false },
                  {
                    key: "Next deadline",
                    value:
                      deadline.isoDate !== null && deadline.daysAway !== null
                        ? `${formatDateLong(deadline.isoDate)} — ${formatNumber(deadline.daysAway)} days`
                        : "Set by your township's notice",
                    mono: deadline.isoDate !== null,
                  },
                  {
                    key: "Filing fee",
                    value: filingFeeSummary(county),
                    mono: county.filingFee.amountCents !== 0,
                  },
                  {
                    key: "The argument",
                    value:
                      county.primaryArgument === "MARKET_VALUE"
                        ? "Market value, against comparable sales"
                        : "Uniformity, against comparable assessments",
                    mono: false,
                  },
                ]}
              />
              <LastVerified
                className="mt-3"
                date={county.citations[0]?.lastVerified ?? asOf}
                ruleSetVersion={county.ruleSetVersion}
                citation={{
                  label: county.citations[0]?.label ?? county.appealBody,
                  url: county.citations[0]?.url ?? "/property/sources",
                }}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
