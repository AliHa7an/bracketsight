import type { Metadata } from "next";

import { pageMetadata, renderJsonLd, webApplication } from "@/lib/seo";
import Link from "next/link";

import { STATE_IDS, STATE_RULES, TRADE_IDS, TRADE_RULES } from "@/engines/trades";

import TakeoffBuilder from "@/components/trades/TakeoffBuilder";
import { ToolLinks } from "@/components/content";
import { ToolShell } from "@/components/tool/ToolShell";
import { LastVerified } from "@/components/ui";
import { formatDate } from "@/components/ui/format";
import { renderableCitation } from "@/lib/trades/citation";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/trades");

/*
 * `WebApplication` for the tool root, matching /loans, /paycheck and /aca.
 * Claims only what is visibly on the page. No FAQPage — the H2s here are
 * statements, and marking up an FAQ that a reader cannot see on the page is
 * the structured-data abuse the policy prohibits.
 */
const TOOL_APP = webApplication({
  name: "Trades Estimate and Contract Builder",
  path: "/trades",
  category: "BusinessApplication",
  description:
    "Builds an itemised trade estimate with a low-high range and the basis for every line, then a matching invoice and a contract template carrying the clauses the job's state requires, each with its statute.",
  features: [
    "Builds an itemised takeoff with a low-high range per line",
    "Turns the takeoff into an invoice that matches to the cent",
    "Assembles the contract clauses the job's state requires, each cited",
  ],
});

export default function HomePage() {
  // Rendered through `renderableCitation` because the pricing rulesets cite a
  // reserved `.invalid` host by design — see src/lib/trades/citation.ts.
  const rawCitation = TRADE_RULES.decks.citations[0];
  const citation = rawCitation ? renderableCitation(rawCitation) : undefined;

  return (
    /* One frame, shared with the other four tools. See ToolShell. */
    <ToolShell
      section="trades"
      title="Price the job on a takeoff sheet"
      standfirst="Set the trade and the measurements; every line prices itself. Edit any figure and the total moves with it — and the sheet you build is the document your customer receives."
      meta={
        citation ? (
          <LastVerified
            date={citation.lastVerified}
            ruleSetVersion={TRADE_RULES.decks.ruleSetVersion}
            citation={{ label: citation.label, url: citation.url }}
          />
        ) : undefined
      }
      readingLabel="The workings"
      readingMeta={`prices verified ${formatDate(citation?.lastVerified ?? "")}`}
      reading={
        <div className="no-print density-reading">
          <h2>How this estimate is built</h2>
        <p>
          Each job decomposes into standard assemblies — a deck becomes footings, framing,
          decking, railing and stairs — and each assembly carries a quantity formula, a
          waste factor, a material cost per grade tier and a labor-hours-per-unit figure.
          Quantities are region-adjusted before anything is priced. Materials plus labor
          make the subtotal; overhead and profit are your numbers, shown with the taught
          defaults contractors most often use. All money math is integer cents and no AI
          touches a figure. The full formula is on the{" "}
          <Link href="/trades/pricing-methodology" className="underline underline-offset-4">
            pricing methodology
          </Link>{" "}
          page, and every ruleset is listed with its citations on{" "}
          <Link href="/trades/sources" className="underline underline-offset-4">
            sources
          </Link>
          .
        </p>

        <h2>Why the estimate is a range</h2>
        <p>
          A point estimate on a job you have not walked is a guess wearing a suit. Bracketsight
          quotes a low–high band around the computed total and shows the assumption behind
          every line, so when a footing hits rock or a wall needs a second coat, the
          conversation starts from something you wrote down rather than something you
          promised. v1 prices are placeholder reference data pending a licensed cost source
          and review by two working contractors — every sheet says so, and it will keep
          saying so until that review lands. Check the numbers against your own suppliers.
        </p>

        <h2>Then paper it</h2>
        <p>
          The{" "}
          <Link href="/trades/invoice" className="underline underline-offset-4">
            invoice
          </Link>{" "}
          mirrors the sheet line for line and matches the total to the cent, credits any deposit
          already taken, and prints as a document rather than a web page. The{" "}
          <Link href="/trades/contract" className="underline underline-offset-4">
            contract
          </Link>{" "}
          pulls the same price and scope, then adds the clauses your state requires for a job that
          size — each one carrying its statute. Start with{" "}
          {STATE_IDS.map((s, i) => (
            <span key={s}>
              {i > 0 ? (i === STATE_IDS.length - 1 ? " or " : ", ") : ""}
              <Link href={`/trades/contracts/${s}`} className="underline underline-offset-4">
                {STATE_RULES[s].stateName}
              </Link>
            </span>
          ))}
          . It is a template, not legal advice — have an attorney review it before you sign.
        </p>

        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Trades priced today:{" "}
          {TRADE_IDS.map((t) => TRADE_RULES[t].label.toLowerCase()).join(", ")}. Rules
          verified{" "}
          <span className="num">{formatDate(citation?.lastVerified ?? "")}</span>. Nothing
          you enter leaves your browser.
        </p>

          {/* The pillar end of the internal link model: this tool's guides, the
              glossary terms it uses, and its own workings — all resolved from
              metadata, never a hand-kept list. See src/lib/seo/links.ts. */}
          <ToolLinks tool="trades" />
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(TOOL_APP) }}
      />
      {/* The hero is the tool. The estimate band leads it. */}
      <TakeoffBuilder />
    </ToolShell>
  );
}
