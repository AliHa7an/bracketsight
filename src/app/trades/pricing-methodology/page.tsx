import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";

import {
  evaluateQty,
  findJobType,
  mulQtyCents,
  REGION_LABELS,
  rulesLastVerified,
  TRADE_IDS,
  TRADE_RULES,
  type AssemblyRule,
  type QtyFormula,
  type RegionId,
} from "@/engines/trades";

import {
  AnswerBox,
  LastVerified,
  LedgerTable,
  WarningStack,
  type LedgerRow,
} from "@/components/ui";
import { formatCents, formatDate } from "@/components/ui/format";
import { renderableCitation } from "@/lib/trades/citation";
import { ContentsRail } from "@/components/content";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/trades/pricing-methodology");

const REGION_IDS = Object.keys(REGION_LABELS) as RegionId[];

const MS_PER_DAY = 86_400_000;

/** The date a ruleset starts flagging its own output, computed the way the engine does. */
function flagsFrom(lastVerified: string, staleAfterDays: number): string {
  return new Date(Date.parse(`${lastVerified}T00:00:00Z`) + staleAfterDays * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

type PerMeasureQty = Extract<QtyFormula, { kind: "perMeasure" }>;

function perMeasureQty(assembly: AssemblyRule): PerMeasureQty | null {
  return assembly.qty.kind === "perMeasure" ? assembly.qty : null;
}

/** overhead then profit, compounded: (1+ov)(1+pr) − 1, in basis points. */
function compoundedMarkupBps(overheadBps: number, profitBps: number): number {
  return ((10000 + overheadBps) * (10000 + profitBps)) / 10000 - 10000;
}

const pct = (bps: number): string => `${bps / 100}%`;

/* A 6 x 8 deck, used once to show a quantity formula resolving. Small enough
   that the minimum-footings floor bites, which is the point of the example. */
const SAMPLE_LENGTH_FT = 6;
const SAMPLE_WIDTH_FT = 8;
const SAMPLE_AREA = SAMPLE_LENGTH_FT * SAMPLE_WIDTH_FT;

export default function PricingMethodologyPage() {
  // Routed through `renderableCitation`: the pricing rulesets cite a reserved
  // `.invalid` host by design, and rendering it as a live link pointed the one
  // citation a sceptical reader would click at a DNS failure.
  // See src/lib/trades/citation.ts.
  const rawPrimary = TRADE_RULES.decks.citations[0];
  const primary = rawPrimary ? renderableCitation(rawPrimary) : undefined;

  /* Regions down the side, trades across: a contractor looks up their own
     region, not a trade. Three data columns fit the measure; seven did not. */
  const regionRows: LedgerRow[] = REGION_IDS.map((r) => ({
    id: r,
    cells: {
      region: REGION_LABELS[r],
      ...Object.fromEntries(
        TRADE_IDS.map((t) => [t, `${TRADE_RULES[t].regionalMultipliersBps[r] / 100}%`]),
      ),
    },
  }));

  const rateRows: LedgerRow[] = TRADE_IDS.map((t) => ({
    id: t,
    cells: {
      trade: TRADE_RULES[t].label,
      rate: `${formatCents(TRADE_RULES[t].laborRateCentsPerHour)}/hr`,
      ruleset: TRADE_RULES[t].ruleSetVersion,
      stale: `${TRADE_RULES[t].staleAfterDays} days`,
      flags: formatDate(
        flagsFrom(rulesLastVerified(TRADE_RULES[t]), TRADE_RULES[t].staleAfterDays),
      ),
    },
  }));

  /* One job type, shown line by line, because the shape of an assembly is
     easier to read from six real rows than from a description of a schema. */
  const newDeck = findJobType(TRADE_RULES.decks, "new-deck");

  const assemblyRows: LedgerRow[] = newDeck.assemblies.map((a) => ({
    id: a.id,
    cells: {
      assembly: a.label,
      unit: <span className="text-dim">{a.unit}</span>,
      waste: pct(a.wasteFactorBps),
      labor: `${a.laborHoursPerUnit} h`,
      material: `${formatCents(a.materialUnitCostCents.economy)} – ${formatCents(
        a.materialUnitCostCents.premium,
      )}`,
    },
  }));

  const laborFree = newDeck.assemblies.filter((a) => a.laborHoursPerUnit === 0);
  const heaviestLabor = [...newDeck.assemblies].sort(
    (a, b) => b.laborHoursPerUnit - a.laborHoursPerUnit,
  )[0];

  const gradeSpread = newDeck.assemblies
    .map((a) => ({
      label: a.label,
      unit: a.unit,
      economy: a.materialUnitCostCents.economy,
      premium: a.materialUnitCostCents.premium,
      ratio: a.materialUnitCostCents.premium / a.materialUnitCostCents.economy,
    }))
    .sort((x, y) => y.ratio - x.ratio);
  const widestGrade = gradeSpread[0];
  const narrowestGrade = gradeSpread[gradeSpread.length - 1];

  /* First assembly whose quantity is counted rather than measured. */
  const counted = (() => {
    for (const a of newDeck.assemblies) {
      const q = perMeasureQty(a);
      if (q !== null) return { label: a.label, unit: a.unit, qty: q };
    }
    return null;
  })();

  const accessRows: LedgerRow[] = TRADE_IDS.map((t) => ({
    id: t,
    cells: {
      trade: TRADE_RULES[t].label,
      easy: pct(TRADE_RULES[t].accessLaborMultipliersBps.easy),
      standard: pct(TRADE_RULES[t].accessLaborMultipliersBps.standard),
      difficult: pct(TRADE_RULES[t].accessLaborMultipliersBps.difficult),
    },
  }));

  const markupRows: LedgerRow[] = TRADE_IDS.map((t) => {
    const { overheadBps, profitBps } = TRADE_RULES[t].taughtDefaults;
    return {
      id: t,
      cells: {
        trade: TRADE_RULES[t].label,
        overhead: pct(overheadBps),
        profit: pct(profitBps),
        sum: pct(overheadBps + profitBps),
        applied: pct(compoundedMarkupBps(overheadBps, profitBps)),
      },
    };
  });

  const multipliers = REGION_IDS.map((r) => TRADE_RULES.decks.regionalMultipliersBps[r]);
  const highestRegion = Math.max(...multipliers);
  const lowestRegion = Math.min(...multipliers);
  const regionSpreadPct = Math.round((highestRegion / lowestRegion - 1) * 1000) / 10;

  const bandWidths = TRADE_IDS.map((t) => ({
    label: TRADE_RULES[t].label,
    low: TRADE_RULES[t].rangeBps.low,
    high: TRADE_RULES[t].rangeBps.high,
    width: (TRADE_RULES[t].rangeBps.high - TRADE_RULES[t].rangeBps.low) / 100,
  })).sort((a, b) => b.width - a.width);
  const widestBand = bandWidths[0];
  const narrowestBand = bandWidths[bandWidths.length - 1];

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1>How Bracketsight prices a job</h1>

      <AnswerBox>
        Every job decomposes into assemblies with a quantity formula, a waste factor, a
        material cost per grade tier and a labor-hours-per-unit figure. Materials plus
        labor make the subtotal; overhead and profit are yours to set. The result is a
        band, not a point: a deck quotes from{" "}
        <span className="num">{100 - TRADE_RULES.decks.rangeBps.low / 100}%</span> below the
        computed total to{" "}
        <span className="num">{TRADE_RULES.decks.rangeBps.high / 100 - 100}%</span> above it.
      </AnswerBox>

      {primary ? (
        <LastVerified
          date={primary.lastVerified}
          ruleSetVersion={TRADE_RULES.decks.ruleSetVersion}
          citation={{ label: primary.label, url: primary.url }}
        />
      ) : null}

      <ContentsRail />

      <WarningStack
        warnings={[
          {
            id: "placeholder-data",
            severity: "irreversible",
            label: "Unverified pricing",
            title: (
              <>
                Every unit cost, labor rate and multiplier in v1 is placeholder reference
                data.
              </>
            ),
            body: (
              <>
                It is a modelled starting point, not market pricing. Real sourcing —
                licensed cost data, regional wage data, and a sanity check by two working
                contractors — is a launch gate, and every estimate carries this warning
                until that gate is passed.
              </>
            ),
          },
        ]}
      />

      <section className="space-y-3">
        <h2>The estimate formula</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          A deck becomes footings, framing, decking, railing and stairs; a bathroom becomes
          demo, rough-in, tile and fixtures. Each assembly is priced the same way, and the
          order of operations is fixed:
        </p>
        <pre
          className="num hairline-all rounded-atlas overflow-x-auto p-4"
          style={{
            borderRadius: "var(--radius-atlas)",
            background: "var(--paper-sunken)",
            fontSize: "var(--text-step--1)",
          }}
        >
          {`line total = qty x (1 + waste) x unit cost      (materials)
           + qty x hours/unit x access x rate   (labor)
subtotal   = sum of line totals
overhead   = subtotal x overhead%     (your number; taught default shown)
profit     = (subtotal + overhead) x profit%
total      = subtotal + overhead + profit
range      = total x [low%, high%]   -- estimates are ranges, not points`}
        </pre>
        <p style={{ maxWidth: "var(--measure)" }}>
          All money math is integer cents and all rates are basis points. No AI touches a
          calculation: the engine is dependency-free TypeScript with its rounding rules
          documented in one file and pinned by tests.
        </p>
        <p style={{ maxWidth: "var(--measure)" }}>
          Rounding happens once per value, at the moment it becomes money — quantity times
          unit cost, hours times rate, and each basis-point application — and it rounds half
          away from zero. Labor hours are the exception that proves the rule: they are
          rounded to two decimals <em>before</em> being priced, so the hours printed on the
          sheet are exactly the hours the customer is charged for. A sheet whose line items
          add up to a different figure than its total is the fastest way to lose an argument
          you were winning.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Waste changes the material quantity; access changes the labor hours</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          Two multipliers ride on every line and they never touch the same number. The waste
          factor inflates the material quantity alone — you buy more decking than the deck
          has square feet, because boards get cut. The access multiplier scales labor hours
          alone, and it is applied to the quantity <em>before</em> waste, because nobody
          installs the offcuts. Mixing the two would bill labor on lumber that went in the
          skip.
        </p>
        <LedgerTable
          caption={`The ${newDeck.assemblies.length} assemblies in a ${newDeck.label.toLowerCase()}, with waste factor, labor hours per unit and the economy-to-premium material range`}
          columns={[
            { id: "assembly", label: "Assembly" },
            { id: "unit", label: "Unit" },
            { id: "waste", label: "Waste", numeric: true },
            { id: "labor", label: "Labor/unit", numeric: true },
            { id: "material", label: "Material, economy – premium", numeric: true },
          ]}
          rows={assemblyRows}
        />
        {heaviestLabor && laborFree.length > 0 ? (
          <p style={{ maxWidth: "var(--measure)" }}>
            The rows are not the same shape as each other, and that is the useful part.{" "}
            {laborFree.map((a) => a.label).join(" and ")} carries{" "}
            <span className="num">0</span> hours per unit: it is a materials-only line
            spread across the deck area, priced but never billed as time.{" "}
            {heaviestLabor.label} is the opposite:{" "}
            <span className="num">{heaviestLabor.laborHoursPerUnit}</span> hours per unit,
            which at the base rate is{" "}
            <span className="num">
              {formatCents(
                mulQtyCents(
                  heaviestLabor.laborHoursPerUnit,
                  TRADE_RULES.decks.laborRateCentsPerHour,
                ),
              )}
            </span>{" "}
            of labor against{" "}
            <span className="num">
              {formatCents(heaviestLabor.materialUnitCostCents.premium)}
            </span>{" "}
            of material at the top grade. When a quote comes back higher than a customer
            expected, the argument is usually about a row shaped like that one, not about
            the price of a board.
          </p>
        ) : null}
        {counted ? (
          <p style={{ maxWidth: "var(--measure)" }}>
            Quantities are computed, not typed. {counted.label} are counted from area — one
            per <span className="num">{counted.qty.divisor}</span> sq ft, rounded up, never
            fewer than <span className="num">{counted.qty.min ?? 0}</span>. A{" "}
            <span className="num">
              {SAMPLE_LENGTH_FT} × {SAMPLE_WIDTH_FT}
            </span>{" "}
            deck is <span className="num">{SAMPLE_AREA}</span> sq ft, so the ratio asks for{" "}
            <span className="num">{Math.ceil(SAMPLE_AREA / counted.qty.divisor)}</span> and
            the floor delivers{" "}
            <span className="num">
              {evaluateQty(counted.qty, { area: SAMPLE_AREA, perimeter: 0 }, {})}
            </span>
            . Small jobs cost more per square foot than large ones for exactly this reason,
            and the sheet shows you where it happens instead of burying it in a rate.
          </p>
        ) : null}
        <LedgerTable
          caption="Access multipliers applied to labor hours, by trade"
          columns={[
            { id: "trade", label: "Trade" },
            { id: "easy", label: "Easy", numeric: true },
            { id: "standard", label: "Standard", numeric: true },
            { id: "difficult", label: "Difficult", numeric: true },
          ]}
          rows={accessRows}
        />
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}>
          Difficult access costs a deck crew more than a paint crew in this dataset, and the
          material cost does not move at all — the lumber is the same lumber whether the
          truck parks at the deck or two hundred feet away.
        </p>
      </section>

      {widestGrade && narrowestGrade ? (
        <section className="space-y-3">
          <h2>Grade moves the surface lines far harder than the structural ones</h2>
          <p style={{ maxWidth: "var(--measure)" }}>
            Grade is a single control on the sheet and it does not scale a job evenly. Across
            the <span className="num">{newDeck.assemblies.length}</span> assemblies in a{" "}
            {newDeck.label.toLowerCase()}, the premium tier costs{" "}
            <span className="num">{Math.round(narrowestGrade.ratio * 10) / 10}×</span> the
            economy tier on {narrowestGrade.label.toLowerCase()} (
            <span className="num">{formatCents(narrowestGrade.economy)}</span> against{" "}
            <span className="num">{formatCents(narrowestGrade.premium)}</span> per{" "}
            {narrowestGrade.unit}) and{" "}
            <span className="num">{Math.round(widestGrade.ratio * 10) / 10}×</span> on{" "}
            {widestGrade.label.toLowerCase()} (
            <span className="num">{formatCents(widestGrade.economy)}</span> against{" "}
            <span className="num">{formatCents(widestGrade.premium)}</span> per{" "}
            {widestGrade.unit}). In this dataset the structure barely moves and the surface a
            customer can see moves most, so grade is worth settling line by line rather than
            as one switch for the whole job.
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2>Regional multipliers</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          Material unit costs and labor rates are adjusted by region before any line is
          priced, so every unit cost on your sheet is already local. Base is{" "}
          <span className="num">100%</span>.
        </p>
        <LedgerTable
          caption="Placeholder regional cost multipliers by region and trade"
          columns={[
            { id: "region", label: "Region" },
            ...TRADE_IDS.map((t) => ({
              id: t,
              label: TRADE_RULES[t].label,
              numeric: true,
            })),
          ]}
          rows={regionRows}
        />
        <p style={{ maxWidth: "var(--measure)" }}>
          The spread from the lowest region to the highest is{" "}
          <span className="num">{regionSpreadPct}%</span> —{" "}
          <span className="num">{pct(lowestRegion)}</span> against{" "}
          <span className="num">{pct(highestRegion)}</span> — and it is the only control that
          lands on materials and labor at once. Grade touches materials only; access touches
          labor only; the region moves both, on every line, before anything else happens. It
          is the first thing to check when a total looks unrecognisable.
        </p>
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          The three launch trades currently share one multiplier per region. They are
          separate values in separate rules files, so they can diverge the moment real
          wage data says they should — and they should diverge, because regional cost
          spread is not the same for a painter as for a plumber. Identical values across
          three trades is a tell that these are modelled, not measured.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Overhead and profit compound; they do not add</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          Overhead is taken on the subtotal. Profit is taken on the subtotal{" "}
          <em>plus</em> overhead. The order is not cosmetic: the two taught defaults on a
          deck look like a <span className="num">{pct(
            TRADE_RULES.decks.taughtDefaults.overheadBps +
              TRADE_RULES.decks.taughtDefaults.profitBps,
          )}</span>{" "}
          markup and behave like{" "}
          <span className="num">
            {pct(
              compoundedMarkupBps(
                TRADE_RULES.decks.taughtDefaults.overheadBps,
                TRADE_RULES.decks.taughtDefaults.profitBps,
              ),
            )}
          </span>
          .
        </p>
        <LedgerTable
          caption="Taught overhead and profit defaults per trade, and the markup they actually apply"
          columns={[
            { id: "trade", label: "Trade" },
            { id: "overhead", label: "Overhead", numeric: true },
            { id: "profit", label: "Profit", numeric: true },
            { id: "sum", label: "Sum", numeric: true },
            { id: "applied", label: "Applied", numeric: true },
          ]}
          rows={markupRows}
        />
        <p style={{ maxWidth: "var(--measure)" }}>
          The gap widens as the rates rise, because it is the product of the two: set both
          to <span className="num">20%</span> and you are applying{" "}
          <span className="num">{pct(compoundedMarkupBps(2000, 2000))}</span>, not{" "}
          <span className="num">40%</span>. It matters most when you are working backwards
          from a number the customer has already heard, because the percentage you divide by
          is not the percentage you typed. Both figures are yours to change on the sheet; the
          defaults shown are teaching values rather than a recommendation, and the
          verification pass records them, with the access multipliers and the range spreads,
          as judgement parameters with no public authoritative source and no prospect of one.
        </p>
      </section>

      {widestBand && narrowestBand ? (
        <section className="space-y-3">
          <h2>The band is wider upward than downward</h2>
          <p style={{ maxWidth: "var(--measure)" }}>
            The low–high range is a fixed spread applied to the computed total, not a
            confidence interval and not a function of your inputs. Every trade is
            asymmetric: {widestBand.label.toLowerCase()} runs from{" "}
            <span className="num">−{100 - widestBand.low / 100}%</span> to{" "}
            <span className="num">+{widestBand.high / 100 - 100}%</span>, a band{" "}
            <span className="num">{widestBand.width}</span> points wide, while{" "}
            {narrowestBand.label.toLowerCase()} is the tightest at{" "}
            <span className="num">{narrowestBand.width}</span> points. The asymmetry is a
            judgement about which direction a job is more likely to move once it starts, and
            it is one of the parameters with no public source behind it — worth setting
            against your own last ten jobs rather than taking on trust.
          </p>
          <p style={{ maxWidth: "var(--measure)" }}>
            What the band does not do is absorb a scope change. If the footing hits rock or
            the wall needs a third coat, that is a change order, not the top of the range —
            and the assumption that was violated is printed on the line it belongs to, which
            is the whole reason the sheet lists assumptions at all.
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2>Labor rates, versions, and the date each ruleset starts flagging itself</h2>
        <LedgerTable
          caption="Base labor rate, ruleset version, stale window and first flagging date per trade"
          columns={[
            { id: "trade", label: "Trade" },
            { id: "rate", label: "Base rate", numeric: true },
            { id: "ruleset", label: "Ruleset", numeric: true },
            { id: "stale", label: "Stale after", numeric: true },
            { id: "flags", label: "Flags from", numeric: true },
          ]}
          rows={rateRows}
        />
        <p style={{ maxWidth: "var(--measure)" }}>
          Staleness is computed, not declared. The engine takes the latest{" "}
          <span className="num">lastVerified</span> date across a ruleset&rsquo;s citations,
          adds the stale window, and flags every estimate produced after that date — for
          decks, <span className="num">{formatDate(rulesLastVerified(TRADE_RULES.decks))}</span>{" "}
          plus <span className="num">{TRADE_RULES.decks.staleAfterDays}</span> days. Nothing
          stops working on that date and no number changes; the sheet simply stops claiming
          the data is current, which is the honest behaviour when nobody has re-checked a
          price in four months.
        </p>
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}>
          One inconsistency worth knowing about: the site&rsquo;s own gap register measures
          that same window from the ruleset&rsquo;s effective date (
          <span className="num">{formatDate(TRADE_RULES.decks.effectiveFrom)}</span>) rather
          than from the last-verified date the engine uses, so the two disagree about when
          this dataset expires. The engine&rsquo;s reading is the one that fires the flag on
          your sheet. Basis: {TRADE_RULES.decks.laborRateBasis}
        </p>
      </section>

      <section className="space-y-3">
        <h2>What would replace the placeholders</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          Materials and assembly labor-hours come from commercially licensed cost databases —
          RSMeans (Gordian) is the reference standard for unit costs, crew composition and
          city cost indexes; the Craftsman National Construction Estimator is the lower-cost
          alternative with a published annual edition. No free source exists at this
          granularity, so this is a purchase rather than a research task, and both licences
          restrict redistributing the figures as raw data. That constraint has to be settled
          before an ingestion path is built, because it decides what the engine is allowed to
          expose in the first place.
        </p>
        <p style={{ maxWidth: "var(--measure)" }}>
          Labor rates have a free, citable public basis: the BLS Occupational Employment and
          Wage Statistics series, at SOC{" "}
          <span className="num">47-2031</span> for carpentry and{" "}
          <span className="num">47-2141</span> for painting. A blended remodel rate has no
          single occupational analogue and needs a documented weighted basket — carpenters,
          plumbers (<span className="num">47-2152</span>), electricians (
          <span className="num">47-2111</span>) and tile setters (
          <span className="num">47-2044</span>) — with the weights published alongside the
          rate. OEWS is an annual series on a May reference date, so the release year travels
          with every figure it produces.
        </p>
        <p style={{ maxWidth: "var(--measure)" }}>
          One caveat outlives the purchase. OEWS reports employee wages, not billable
          contractor rates, and the distance between them — payroll burden, insurance, the
          truck, overhead, profit — is currently folded into the taught defaults above. If
          that relationship is not written down when real data lands, the labor half of every
          estimate will be wrong by a large and consistent factor while looking rigorously
          sourced. Consented user-submitted actuals sit last on the ladder, clearly labeled,
          and only once there is enough volume for the median to mean anything.
        </p>
        <p style={{ maxWidth: "var(--measure)" }}>
          Every upgrade lands as a new versioned rules file with a{" "}
          <Link href="/trades/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          entry, and every ruleset is listed with its citations on{" "}
          <Link href="/trades/sources" className="underline underline-offset-4">
            sources
          </Link>
          . What counts as verified, and who has to sign off, is set out in the{" "}
          <Link href="/trades/editorial-policy" className="underline underline-offset-4">
            editorial policy
          </Link>
          .
        </p>
      </section>

      <nav aria-label="Related pages" className="hairline-t pt-4">
        <p className="micro-label mb-2">Related</p>
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <li>
            <Link href="/trades" className="underline underline-offset-4">
              Price a job on the takeoff sheet
            </Link>
          </li>
          <li>
            <Link href="/trades/invoice" className="underline underline-offset-4">
              Invoice
            </Link>
          </li>
          <li>
            <Link href="/trades/contract" className="underline underline-offset-4">
              Contract generator
            </Link>
          </li>
          <li>
            <Link href="/trades/sources" className="underline underline-offset-4">
              Sources
            </Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
