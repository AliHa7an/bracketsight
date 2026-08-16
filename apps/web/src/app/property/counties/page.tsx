import type { Metadata } from "next";
import Link from "next/link";
import { counties, filingFeeSummary, nextDeadline } from "@fineprint/engine-property";
import { AnswerBox, FactTable, LastVerified } from "@fineprint/ui";
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
