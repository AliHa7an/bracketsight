import type { Metadata } from "next";
import Link from "next/link";

import {
  STATE_IDS,
  STATE_RULES,
  TRADE_IDS,
  TRADE_RULES,
  untranscribedClauses,
} from "@/engines/trades";

import { formatDate } from "@/components/ui/format";

/* Historical entries name the versions they shipped, literally. Reading the
   CURRENT ruleSetVersion into a dated entry would silently rewrite history the
   first time a ruleset was corrected — which is the opposite of a changelog. */
const V1_STATE_VERSIONS = "states-ca-2026-08, states-tx-2026-08, states-fl-2026-08, states-ny-2026-08, states-pa-2026-08";

export const metadata: Metadata = {
  alternates: { canonical: "/trades/changelog" },
  title: "Trades Changelog — Pricing and State Rule Changes",
  description:
    "Every change to the pricing rulesets and the state contract rulesets, dated and cited — including the states contract generation is blocked for.",
};

export default function ChangelogPage() {
  const launched = TRADE_RULES.decks.effectiveFrom;

  const jobTypeCount = TRADE_IDS.reduce((n, t) => n + TRADE_RULES[t].jobTypes.length, 0);
  const assemblyCount = TRADE_IDS.reduce(
    (n, t) =>
      n + TRADE_RULES[t].jobTypes.reduce((m, jobType) => m + jobType.assemblies.length, 0),
    0,
  );
  const clauseCount = STATE_IDS.reduce(
    (n, s) => n + STATE_RULES[s].requiredClauses.length,
    0,
  );
  const untranscribedTotal = STATE_IDS.reduce(
    (n, s) => n + untranscribedClauses(STATE_RULES[s]).length,
    0,
  );
  const blockedStates = STATE_IDS.filter(
    (s) => untranscribedClauses(STATE_RULES[s]).length > 0,
  );
  const generatingStates = STATE_IDS.filter(
    (s) => untranscribedClauses(STATE_RULES[s]).length === 0,
  );

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1>Changelog</h1>
      <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
        Rule changes land here within 48 hours, with the ruleset version and the citation.
        The full citation list is on{" "}
        <Link href="/trades/sources" className="underline underline-offset-4">
          sources
        </Link>
        .
      </p>
      <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
        An entry has to name the ruleset it changed, the version it moved to, and the source
        that justified the change. A correction that cannot point at a document is not a
        correction, it is a preference — and the entries below include several where the
        finding was that a cite pointed at a subsection which did not say what the clause
        claimed. Those are logged in the same voice as the improvements, because a reader
        deciding whether to trust the output needs to see the misses at the same size as the
        hits. What counts as verified in the first place is set out in the{" "}
        <Link href="/trades/editorial-policy" className="underline underline-offset-4">
          editorial policy
        </Link>
        .
      </p>

      <section
        className="hairline-all rounded-atlas p-4"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper-raised)" }}
      >
        <p className="micro-label">Standing position</p>
        <h2>
          <span className="num">{untranscribedTotal}</span> prescribed notices are still
          untranscribed, and that blocks{" "}
          <span className="num">{blockedStates.length}</span> states
        </h2>
        <p
          className="text-dim mt-2"
          style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
        >
          Across the <span className="num">{STATE_IDS.length}</span> state rulesets there
          are <span className="num">{clauseCount}</span> required clause categories, of which{" "}
          <span className="num">{untranscribedTotal}</span> carry wording a statute
          prescribes and nobody has transcribed. Contract generation fails closed for{" "}
          {blockedStates.map((s) => STATE_RULES[s].stateName).join(", ")};{" "}
          {generatingStates.map((s) => STATE_RULES[s].stateName).join(" and ")}{" "}
          {generatingStates.length === 1
            ? "still generates: the one launch state where no provision prescribes wording."
            : "still generate, being the launch states where no provision prescribes wording."}
        </p>
        <p
          className="text-dim mt-2"
          style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
        >
          On the pricing side there are <span className="num">{TRADE_IDS.length}</span>{" "}
          rulesets covering <span className="num">{jobTypeCount}</span> job types and{" "}
          <span className="num">{assemblyCount}</span> priced assemblies. Every figure in
          them is placeholder reference data: the citation URL is a reserved domain that can
          never resolve, and no public wage figure has been captured to anchor the labor
          rates, because the statistics host blocked every request made to it. What would
          replace them, and in what order, is on{" "}
          <Link href="/trades/pricing-methodology" className="underline underline-offset-4">
            pricing methodology
          </Link>
          .
        </p>
        <ul className="text-dim mt-2 ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
          <li>
            New York is the cheapest to unblock: its one prescribed notice needs bold face
            type and nothing else, and the state&rsquo;s own legislative site answers, so
            transcription alone would clear it.
          </li>
          <li>
            California, Florida and Texas stay blocked even after transcription. Their
            notices carry point sizes, capitalisation, front-page placement, an owner
            signature belonging to the notice itself, and in one case a detachable duplicate
            form — all recorded in the rulesets and none of it renderable yet.
          </li>
          <li>
            Texas and Florida citations still point at legislature hosts that did not answer,
            so both states rest on secondary sources; Pennsylvania&rsquo;s citation points at
            a consumer-information page rather than the statute, which is the wrong kind of
            source even when it loads.
          </li>
          <li>
            The warning string &ldquo;UNVERIFIED — ATTORNEY REVIEW REQUIRED&rdquo; still
            sits inside the text field of drafted clauses — the field that renders into a
            document. Latent for the states that fail closed, live for Pennsylvania.
          </li>
          <li>
            No construction attorney has reviewed the clause language, and no working
            contractor has sanity-checked the pricing. Both are launch gates and neither has
            been met.
          </li>
        </ul>
      </section>

      <section
        className="hairline-all rounded-atlas p-4"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper-raised)" }}
      >
        <p className="micro-label">
          <time className="num" dateTime="2026-08-15">
            {formatDate("2026-08-15")}
          </time>
        </p>
        <h2>State rulesets corrected against primary sources</h2>
        <ul className="mt-2 ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
          <li>
            State contract rulesets bumped to{" "}
            {STATE_IDS.map((s) => (
              <span key={s} className="num">
                {STATE_RULES[s].ruleSetVersion}{" "}
              </span>
            ))}
            .
          </li>
          <li>
            <strong>
              Bracketsight no longer generates contracts for{" "}
              {STATE_IDS.filter((s) => untranscribedClauses(STATE_RULES[s]).length > 0)
                .map((s) => STATE_RULES[s].stateName)
                .join(", ")}
              .
            </strong>{" "}
            Those states prescribe notice wording word-for-word — with type-size,
            placement and signature rules attached — and Bracketsight had been shipping
            paraphrases of it, or omitting the notice entirely. A paraphrase of prescribed
            text is not a weaker clause; it is a non-compliant contract. The generator
            fails closed until each notice is transcribed from the statute. Every affected
            clause is listed with its statute and source on its{" "}
            <Link href="/trades/contracts/CA" className="underline underline-offset-4">
              state requirements page
            </Link>
            .
          </li>
          <li>
            New York: the statewide licence-display flag was wrong. Gen. Bus. Law
            §771(1)(a) requires the licence number &ldquo;if applicable&rdquo;, and New
            York has no universal state contractor licence — licensing is county and
            municipal. The flag is now jurisdiction-scoped and off at state level.
          </li>
          <li>
            Pennsylvania: the down-payment cap cited 73 P.S. §517.7(e), which contains no
            down-payment limit. Corrected to §517.9, and the trigger now matches the rule
            it describes — one-third of the price (plus special-order materials) on
            contracts over $5,000, using exact thirds rather than 33%. It no longer fires
            on contracts of $5,000 or less, where no cap applies.
          </li>
          <li>
            Texas: the bills-paid affidavit clause carried a $5,000 threshold that Tex.
            Prop. Code §53.259 does not impose, suppressing a required clause on every
            smaller contract. The threshold is removed.
          </li>
          <li>
            Three required clauses were missing altogether and now exist as first-class
            entries: the Texas disclosure statement for residential construction contracts,
            the separate Texas notice of cancellation form — which the cancellation clause
            had been telling customers was attached to a document that never produced it —
            and the New York mechanic&rsquo;s lien notice, which no New York contract had
            ever carried.
          </li>
          <li>
            Every clause now declares whether its wording may be drafted or must be
            transcribed, and carries the statute&rsquo;s typography, placement and execution
            requirements alongside it: point size, boldface, capitalisation, where the notice
            sits, whether the owner signs it, how many copies, whether it must detach. The
            rules loader rejects a file where a clause marked as prescribed carries any text
            at all, because a paraphrase in that field is a paraphrase that gets rendered.
          </li>
          <li>
            California cites were narrowed from the subsection to the paragraph — the lien
            warning, the cancellation notice, the licence-board notice and the down-payment
            sentence each live at a specific paragraph of §7159, and the file had been
            pointing at the subsection above them. The down-payment rule itself, the lesser
            of $1,000 or 10% of the price, was checked and left alone.
          </li>
        </ul>
      </section>

      <section
        className="hairline-all rounded-atlas p-4"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper-raised)" }}
      >
        <p className="micro-label">
          <time className="num" dateTime={launched}>
            {formatDate(launched)}
          </time>
        </p>
        <h2>v1 launch rulesets</h2>
        <ul className="mt-2 ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
          <li>
            Pricing rulesets published for{" "}
            {TRADE_IDS.map((t) => TRADE_RULES[t].label.toLowerCase()).join(", ")} —{" "}
            {TRADE_IDS.map((t) => (
              <span key={t} className="num">
                {TRADE_RULES[t].ruleSetVersion}{" "}
              </span>
            ))}
            . All pricing is placeholder reference data pending licensed cost data and
            contractor review; estimates carry the warning until re-verified.
          </li>
          <li>
            State contract rulesets published for{" "}
            {STATE_IDS.map((s) => STATE_RULES[s].stateName).join(", ")} —{" "}
            <span className="num">{V1_STATE_VERSIONS}</span>. Clause language is unverified
            template text pending construction attorney review.
          </li>
          <li>
            Each pricing ruleset ships with a{" "}
            <span className="num">{TRADE_RULES.decks.staleAfterDays}</span>-day stale window
            measured from the latest date on its citations. Past it, every estimate the
            ruleset produces is flagged as resting on data nobody has re-checked — the
            window is enforced by the engine rather than by anyone remembering.
          </li>
        </ul>
      </section>

      <nav aria-label="Related pages" className="hairline-t pt-4">
        <p className="micro-label mb-2">Related</p>
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <li>
            <Link href="/trades" className="underline underline-offset-4">
              Price a job
            </Link>
          </li>
          <li>
            <Link href="/trades/sources" className="underline underline-offset-4">
              Sources
            </Link>
          </li>
          <li>
            <Link href="/trades/contract" className="underline underline-offset-4">
              Contract generator
            </Link>
          </li>
          {STATE_IDS.map((s) => (
            <li key={s}>
              <Link
                href={`/trades/contracts/${s}`}
                className="underline underline-offset-4"
              >
                {STATE_RULES[s].stateName} requirements
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
