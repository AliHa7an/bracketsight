import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  evaluateTrigger,
  getStateRules,
  STATE_IDS,
  untranscribedClauses,
  type ClauseRule,
  type StateId,
} from "@/engines/trades";

import {
  AnswerBox,
  Button,
  FactTable,
  LastVerified,
  LedgerTable,
  SourceCitation,
  WarningStack,
  type LedgerRow,
} from "@/components/ui";
import { usd } from "@/components/ui/format";
import { ContentsRail } from "@/components/content";

export const dynamicParams = false;

/* One fact pattern, run through whichever state this page is. $12,000 with a
   quarter down is an ordinary mid-size job, and it sits above every encoded
   threshold and below Pennsylvania's one-third cap — so the same numbers
   produce a visibly different clause set in each of the five states. */
const SAMPLE_TOTAL_CENTS = 1_200_000;
const SAMPLE_DEPOSIT_CENTS = 300_000;

/**
 * What the statute attaches to a notice beyond its words, in the statute's own
 * terms. Read straight off the clause's `formatting` block — the rules files
 * record these even where nothing downstream can render them, because dropping
 * a requirement the renderer cannot express is how a non-compliant document
 * gets signed.
 */
function formattingRequirements(clause: ClauseRule): string[] {
  const f = clause.formatting;
  if (!f) return [];
  const out: string[] = [];
  if (f.minPointSize !== undefined) out.push(`at least ${f.minPointSize}-point type`);
  if (f.boldface) out.push("boldface");
  if (f.capitalized) out.push("capitalised throughout");
  if (f.placement !== undefined) out.push(`placement: ${f.placement}`);
  if (f.ownerSignatureAndDateRequired) out.push("signed and dated by the owner");
  if (f.copies !== undefined) {
    out.push(f.copies === 2 ? "supplied in duplicate" : `supplied in ${f.copies} copies`);
  }
  if (f.easilyDetachable) out.push("easily detachable from the contract");
  return out;
}

/**
 * How each state's rules were actually sourced. Every sentence here comes from
 * the repository's own verification record (`VERIFICATION-STATUS.md` and
 * `KNOWN-GAPS.md`), which logs, per state, which host answered and which did
 * not. It is per-state and unflattering on purpose: a reader deciding whether
 * to rely on a clause list should know whether anyone reached the statute.
 */
const SOURCING: Record<StateId, string> = {
  CA: "Every California rule on this page was read from the state's own site — leginfo returned Bus. & Prof. Code §7159 and §7030.5 on the 15 August 2026 verification pass. That is the strongest sourcing of the five states, and it is the reason the four untranscribed notices can be described so precisely: the statute was open in front of the person who logged them. It also caught a merge error worth naming. The deleted placeholder for the three-day cancellation notice had folded in the five-business-day window that belongs to the separate senior-citizen variant, which is a distinct prescribed notice and is not modelled here at all.",
  TX: "No Texas rule on this page has been read from the State of Texas. statutes.capitol.texas.gov did not resolve from the verification environment, so every Texas item rests on texas.public.law, a secondary host. The content is corroborated; the authority is not, and the citation links above point at a host that failed to answer. Two of the three prescribed forms were missing from the ruleset entirely before the August 2026 pass — including the separate Notice of Cancellation form, which the cancellation clause had been telling the customer was attached.",
  FL: "flsenate.gov did not resolve and leg.state.fl.us refused the connection, so every Florida rule on this page rests on codes.findlaw.com, a secondary host, and the citation links above point at addresses nobody could open. One question is still open and it matters: whether the recovery-fund provision prescribes its wording or only its substance. If it prescribes wording, that clause is marked as drafted when it should be blocking — Florida would be generating a non-compliant notice rather than refusing to generate one. The board contact details in it are set by board rule, so they can go stale without any statutory amendment.",
  NY: "New York's rules were read from the state's own site: nysenate.gov returned Gen. Bus. Law §770 and §771 and Lien Law §71-a on the August 2026 pass. New York is also the only blocked state whose block is purely about words. Its one prescribed notice needs bold face type and nothing else — no point size, no separate signed page, no detachable duplicate — so transcription alone would unblock it, where California, Florida and Texas would still need a renderer that can set type. Two cites in this ruleset still point at the wrong subsection and are logged as such.",
  PA: "Pennsylvania is the one state that generates a document here, and its sourcing is the weakest of the five. The encoded citation points at an Attorney General consumer-information page rather than the statute — the wrong kind of source even if it were reachable, and it returns 403 — so every Pennsylvania rule rests on codes.findlaw.com. Two corrections have already come out of that: the down-payment cap cited a subsection that contains no cap, and the registration clause cited the prohibited-acts section, which imposes no display duty. One half of a sentence that prints into a live Pennsylvania contract is still unsupported: the claim that the registration number must appear in all advertising has no fetched source behind it.",
};

export function generateStaticParams(): { state: string }[] {
  return STATE_IDS.map((state) => ({ state }));
}

function ruleForParam(param: string): ReturnType<typeof getStateRules> | null {
  const upper = param.toUpperCase();
  if (!STATE_IDS.includes(upper as StateId)) return null;
  return getStateRules(upper as StateId);
}

export async function generateMetadata({
  params,
}: PageProps<"/trades/contracts/[state]">): Promise<Metadata> {
  const { state } = await params;
  const rules = ruleForParam(state);
  if (!rules) return {};
  return {
    title: `${rules.stateName} Home Improvement Contract Requirements (2026)`,
    description: `The clauses ${rules.stateName} law requires in a home improvement contract, each with its statute cite, plus a generator that assembles them. Not legal advice.`,
    // Relative — the root layout owns `metadataBase`. `rules.stateId` rather
    // than the raw param so the canonical is always the prerendered casing.
    alternates: { canonical: `/trades/contracts/${rules.stateId}` },
  };
}

export default async function StateContractPage({
  params,
}: PageProps<"/trades/contracts/[state]">) {
  const { state } = await params;
  const rules = ruleForParam(state);
  if (!rules) notFound();

  const alwaysCount = rules.requiredClauses.filter((c) => c.trigger === "always").length;
  const conditionalCount = rules.requiredClauses.length - alwaysCount;
  const primary = rules.citations[0];
  const otherStates = STATE_IDS.filter((s) => s !== rules.stateId);
  const blockers = untranscribedClauses(rules);

  /* Everything the statutes attach to the wording, straight from the rules
     file. For a state that prescribes no wording this collapses to the notes
     recorded against its rules, which is the honest result rather than an
     empty section pretending the state is silent. */
  const formattingDetail = rules.requiredClauses
    .map((clause) => ({
      clause,
      requirements: formattingRequirements(clause),
      notes: clause.formatting?.notes ?? [],
    }))
    .filter((entry) => entry.requirements.length > 0 || entry.notes.length > 0);
  const typographyCount = formattingDetail.filter((e) => e.requirements.length > 0).length;

  /* The engine's own trigger evaluator, run against one fact pattern. The
     reason strings below are the engine's words, not a description of them. */
  const sampleFacts = {
    totalCents: SAMPLE_TOTAL_CENTS,
    downPaymentCents: SAMPLE_DEPOSIT_CENTS,
  };
  const triggerResults = rules.requiredClauses.map((clause) => ({
    clause,
    result: evaluateTrigger(
      clause.trigger,
      sampleFacts,
      rules.homeImprovementThresholdCents,
    ),
  }));
  const firedCount = triggerResults.filter((t) => t.result.triggered).length;
  const depositKeyed = rules.requiredClauses.filter((c) =>
    c.trigger.includes("downpayment"),
  ).length;
  const usesSpecialOrderMaterials = rules.requiredClauses.some((c) =>
    c.trigger.includes("specialOrderMaterials"),
  );

  const triggerRows: LedgerRow[] = triggerResults.map(({ clause, result }) => ({
    id: `${clause.id}-sample`,
    cells: {
      clause: clause.title,
      fires: result.triggered ? "Fires" : "Silent",
      reason: <span className="text-dim">{result.reason}</span>,
    },
  }));

  /* An off-by-one the verification pass logged: triggers that fire AT the
     threshold, against statutes written as "exceeds". */
  const firesAtThreshold =
    rules.homeImprovementThresholdCents > 0 &&
    rules.requiredClauses.some((c) => c.trigger === "total >= threshold");
  /* And the sharper version of it: two clauses gating on the same dollar
     figure with different comparators, inside one ruleset. */
  const mixedComparators =
    firesAtThreshold &&
    rules.requiredClauses.some(
      (c) =>
        c.trigger.replace(/,/g, "") ===
        `total > $${rules.homeImprovementThresholdCents / 100}`,
    );

  const clauseRows: LedgerRow[] = rules.requiredClauses.map((clause) => ({
    id: clause.id,
    cells: {
      clause: (
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className="text-ink" style={{ fontWeight: 600 }}>
            {clause.title}
          </span>
          {/* Prescribed wording is shown by linking to the statute, never by
              paraphrasing it here. A summary on this page would be quoted back
              at us as though it were the notice. */}
          {clause.textStatus === "DRAFTED" ? (
            <span className="text-dim" style={{ fontWeight: 400 }}>
              {clause.text}
            </span>
          ) : (
            <span className="text-dim" style={{ fontWeight: 400 }}>
              {clause.textStatus === "VERBATIM_REQUIRED_NOT_TRANSCRIBED"
                ? "The statute prescribes this notice word-for-word."
                : "The statute prescribes a form this notice must read substantially similar to."}{" "}
              Bracketsight does not reproduce it until it has been transcribed from the statute,
              so no contract is generated for {rules.stateName}.{" "}
              {clause.sourceUrl ? (
                <a
                  href={clause.sourceUrl}
                  rel="noopener"
                  className="underline underline-offset-4"
                >
                  Read the statutory text
                </a>
              ) : null}
            </span>
          )}
        </span>
      ),
      when: (
        <span className="text-dim">
          {clause.trigger === "always" ? (
            "Every contract"
          ) : (
            <>
              When <span className="num">{clause.trigger}</span>
            </>
          )}
        </span>
      ),
      statute: (
        <span className="num text-dim" style={{ fontSize: "var(--text-step--2)" }}>
          {clause.statute}
        </span>
      ),
    },
  }));

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1>
        What does a {rules.stateName} home improvement contract have to include?
      </h1>

      <AnswerBox>
        {rules.stateName} requires{" "}
        <span className="num">{rules.requiredClauses.length}</span> categories of contract
        language for home improvement work
        {rules.homeImprovementThresholdCents > 0 ? (
          <>
            {" "}
            over <span className="num">{usd(rules.homeImprovementThresholdCents)}</span>
          </>
        ) : null}
        : <span className="num">{alwaysCount}</span> apply to every contract and{" "}
        <span className="num">{conditionalCount}</span> trigger on job facts such as the
        down payment or the total price.
      </AnswerBox>

      {primary ? (
        <LastVerified
          date={primary.lastVerified}
          ruleSetVersion={rules.ruleSetVersion}
          citation={{ label: primary.label, url: primary.url }}
        />
      ) : null}

      <ContentsRail className="mt-6" />

      <WarningStack
        warnings={[
          ...(blockers.length > 0
            ? [
                {
                  id: "generation-blocked",
                  severity: "irreversible" as const,
                  label: "No contract produced",
                  title: (
                    <>
                      Bracketsight does not generate {rules.stateName} contracts.{" "}
                      <span className="num">{blockers.length}</span> required{" "}
                      {blockers.length === 1 ? "clause has" : "clauses have"} wording the
                      statute prescribes, and it has not been transcribed.
                    </>
                  ),
                  body: (
                    <>
                      A paraphrase of prescribed notice text is not a weaker clause — it is
                      a non-compliant contract. The generator fails closed rather than
                      print something that looks official and is not. The clause table
                      below links each one to its statute.
                    </>
                  ),
                },
              ]
            : []),
          {
            id: "unverified-clauses",
            severity: "irreversible",
            label: "Unverified wording",
            title: (
              <>
                The clause language on this page is UNVERIFIED template text awaiting
                construction attorney review.
              </>
            ),
            body: (
              <>
                Which clauses {rules.stateName} triggers is encoded from the statutes cited
                below; the exact wording is not yet confirmed against primary sources. Use
                it as a starting point and have an attorney review the contract you sign.
              </>
            ),
          },
        ]}
      />

      <FactTable
        caption={`Key ${rules.stateName} home improvement contract facts`}
        rows={[
          {
            key: "Written-contract threshold",
            value:
              rules.homeImprovementThresholdCents > 0
                ? usd(rules.homeImprovementThresholdCents)
                : "No general threshold",
          },
          { key: "Required clause categories", value: rules.requiredClauses.length },
          { key: "Apply to every contract", value: alwaysCount },
          { key: "Trigger on job facts", value: conditionalCount },
          {
            key: "License number on the contract",
            value: rules.licenseDisplay.statewide ? "Required" : "No statewide rule",
            mono: false,
          },
          {
            key: "Clauses with untranscribed statutory text",
            value: blockers.length,
          },
          { key: "Prohibited terms listed", value: rules.prohibitedTerms.length },
        ]}
      />

      {rules.licenseDisplay.note ? (
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}>
          <span className="num">{rules.licenseDisplay.statute}</span> —{" "}
          {rules.licenseDisplay.note}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2>Which clauses does {rules.stateName} require, and when?</h2>
        <LedgerTable
          caption={`${rules.requiredClauses.length} required clause categories in ${rules.stateName}, with their triggers and statutes`}
          columns={[
            { id: "clause", label: "Clause" },
            { id: "when", label: "When it applies" },
            { id: "statute", label: "Statute" },
          ]}
          rows={clauseRows}
        />
      </section>

      {formattingDetail.length > 0 ? (
        <section className="space-y-3">
          <h2>
            {typographyCount > 0
              ? "Getting the words right is only half of it"
              : `What ${rules.stateName}'s rules turn on instead of wording`}
          </h2>
          {typographyCount > 0 ? (
            <p style={{ maxWidth: "var(--measure)" }}>
              Prescribed wording arrives with rules about how it appears on the page.{" "}
              <span className="num">{typographyCount}</span> of {rules.stateName}&rsquo;s{" "}
              <span className="num">{rules.requiredClauses.length}</span> clause categories
              carry them, and the ruleset records each one in the statute&rsquo;s own terms
              even though nothing on this site can set a per-clause type size yet. A
              12-point boldface notice printed at body size fails the statute as surely as a
              paraphrase does, so these sit behind the transcription problem as a second
              blocker — and they are the reason transcribing the words would not, on its
              own, produce a usable {rules.stateName} contract.
            </p>
          ) : (
            <p style={{ maxWidth: "var(--measure)" }}>
              {rules.stateName} attaches no typography to any clause — no point size, no
              weight, no placement rule.{" "}
              {blockers.length === 0
                ? "No provision prescribes wording either, which is why the generator produces a document for this state at all."
                : "The wording it does prescribe still has to be transcribed before anything can be generated."}{" "}
              What the ruleset records instead is the reading chosen where the statute could
              be read two ways, and those readings are worth checking: they are the ones
              that end up printed.
            </p>
          )}
          <ul className="flex list-none flex-col gap-3 p-0">
            {formattingDetail.map(({ clause, requirements, notes }) => (
              <li
                key={`${clause.id}-formatting`}
                className="hairline-all rounded-atlas p-4"
                style={{
                  borderRadius: "var(--radius-atlas)",
                  background: "var(--paper-raised)",
                }}
              >
                <p style={{ fontWeight: 600, margin: 0 }}>
                  {clause.title} —{" "}
                  <span className="num" style={{ fontWeight: 400 }}>
                    {clause.statute}
                  </span>
                </p>
                {requirements.length > 0 ? (
                  <p
                    className="text-ink"
                    style={{ fontSize: "var(--text-step--1)", margin: "4px 0 0" }}
                  >
                    Required on the page: {requirements.join("; ")}.
                  </p>
                ) : null}
                {notes.map((note) => (
                  <p
                    key={note}
                    className="text-dim"
                    style={{
                      fontSize: "var(--text-step--1)",
                      margin: "4px 0 0",
                      maxWidth: "var(--measure)",
                    }}
                  >
                    {note}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2>
          The same job facts select <span className="num">{firedCount}</span> of{" "}
          <span className="num">{rules.requiredClauses.length}</span> clauses here
        </h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          Take a job priced at <span className="num">{usd(SAMPLE_TOTAL_CENTS)}</span> with{" "}
          <span className="num">{usd(SAMPLE_DEPOSIT_CENTS)}</span> taken up front — a quarter
          down, which is ordinary practice and is not lawful everywhere. Run those two
          numbers through {rules.stateName}&rsquo;s triggers and{" "}
          <span className="num">{firedCount}</span> of the{" "}
          <span className="num">{rules.requiredClauses.length}</span> clause categories
          apply. The table below is the engine&rsquo;s own output: the reason column is the
          sentence the generator writes when it selects or skips a clause, not a description
          of one.
        </p>
        <LedgerTable
          caption={`Which ${rules.stateName} clauses a ${usd(SAMPLE_TOTAL_CENTS)} job with a ${usd(SAMPLE_DEPOSIT_CENTS)} deposit selects, with the engine's reason for each`}
          columns={[
            { id: "clause", label: "Clause" },
            { id: "fires", label: "At these facts" },
            { id: "reason", label: "Why" },
          ]}
          rows={triggerRows}
        />
        {depositKeyed > 0 ? (
          <p style={{ maxWidth: "var(--measure)" }}>
            <span className="num">{depositKeyed}</span> of those clauses key on the deposit
            rather than the price, which is where the five states pull apart hardest. In one
            the deposit only has to exist before an escrow duty attaches to it. In another
            it is capped at the lesser of a flat sum and a percentage of the price, so on any
            job above ten thousand dollars the flat sum binds and the percentage never comes
            into it. In a third the cap is a full third of the price, but only once the price
            is above five thousand. The same{" "}
            <span className="num">{usd(SAMPLE_DEPOSIT_CENTS)}</span> is therefore routine in
            one state and over a ceiling in the next. Change the deposit on the sheet and the
            clause set changes with it.
          </p>
        ) : (
          <p style={{ maxWidth: "var(--measure)" }}>
            No {rules.stateName} clause in this ruleset keys on the deposit: every one of
            them applies to the job whatever the payment schedule looks like. The
            down-payment figure on your sheet changes the document&rsquo;s numbers without
            changing which clauses it carries — which is not the case in every state encoded
            here, where the same figure decides whether a notice appears at all.
          </p>
        )}
        {usesSpecialOrderMaterials ? (
          <p style={{ maxWidth: "var(--measure)" }}>
            The example assumes no special-order materials, which is the strict reading of
            the cap. Where the job includes them, the lawful ceiling rises by their cost, so
            a contract carrying custom cabinetry or a made-to-measure unit has more headroom
            than the plain one-third figure suggests. The engine compares the deposit
            multiplied by three against the price rather than applying a percentage, so the
            arithmetic is exact thirds — a third is not 33%, and on a five-figure job the
            difference between them is real money.
          </p>
        ) : null}
        {rules.homeImprovementThresholdCents === 0 ? (
          <p style={{ maxWidth: "var(--measure)" }}>
            {rules.stateName} encodes no dollar threshold at all. Nothing here switches on
            job size: a small repair carries the same clause categories as a whole-house
            remodel, and the verification pass found no statewide written-contract threshold
            to encode. That is the opposite shape from the other four states, where a price
            has to be cleared before the rules bite.
          </p>
        ) : null}
        {firesAtThreshold ? (
          <p className="text-dim" style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}>
            One defect you can read straight off the trigger column above: it fires at
            exactly <span className="num">{usd(rules.homeImprovementThresholdCents)}</span>,
            while the provisions behind these thresholds are written in terms of a price that
            exceeds the figure rather than one that meets it. A contract at precisely the
            threshold therefore picks up a clause the statute does not require. It
            over-includes rather than omits, which is the safe direction, and it is a defect
            rather than a design choice.
            {mixedComparators ? (
              <>
                {" "}
                Worse here than elsewhere: two clauses in this one file gate on the same
                dollar figure with different comparators, so at exactly{" "}
                <span className="num">{usd(rules.homeImprovementThresholdCents)}</span> one
                notice fires and its sibling does not.
              </>
            ) : null}
          </p>
        ) : null}
      </section>

      {rules.prohibitedTerms.length > 0 ? (
        <section className="space-y-2">
          <h2>What cannot go in a {rules.stateName} home improvement contract?</h2>
          <ul className="text-dim ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
            {rules.prohibitedTerms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2>Who actually read the {rules.stateName} statute</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          {SOURCING[rules.stateId]}
        </p>
        <p style={{ maxWidth: "var(--measure)" }}>
          A citation nobody has opened is not a citation, and a secondary host is a
          cross-check rather than an authority, so those distinctions are recorded against
          each {rules.stateName} rule instead of being averaged into a confidence badge. A
          second kind of gap is logged the same way: in three of the five states the drafted
          contract-contents clause lists fewer elements than its own section enumerates,
          which makes a generated contract incomplete rather than misworded. Neither failure
          is visible from the document itself, which is why the{" "}
          <span className="num">{rules.ruleSetVersion}</span> ruleset behind this page keeps
          its record in the open on{" "}
          <Link href="/trades/sources" className="underline underline-offset-4">
            sources
          </Link>{" "}
          and in the{" "}
          <Link href="/trades/changelog" className="underline underline-offset-4">
            changelog
          </Link>
          .
        </p>
        <p style={{ maxWidth: "var(--measure)" }}>
          None of this is legal advice, and none of it substitutes for a construction
          attorney reading the contract you intend to sign. What it can do is tell you which
          of {rules.stateName}&rsquo;s{" "}
          <span className="num">{rules.requiredClauses.length}</span> clause categories your
          job&rsquo;s numbers trigger and exactly where the statute behind each one lives, so
          the conversation with an attorney starts from the text instead of from a blank
          page — and so a missing clause is something you find before a customer&rsquo;s
          lawyer does.
        </p>
      </section>

      <section
        className="hairline-all rounded-atlas flex flex-col items-start gap-3 p-6"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper-raised)" }}
      >
        <h2>
          {blockers.length > 0
            ? `Why there is no ${rules.stateName} contract to build`
            : "Build this contract for your job"}
        </h2>
        <p className="text-dim" style={{ margin: 0, maxWidth: "var(--measure)" }}>
          {blockers.length > 0 ? (
            <>
              The generator refuses {rules.stateName} until the prescribed notice text is
              transcribed from the statute. You can still price the job, and the takeoff
              sheet and invoice work normally — but the price is an estimate, not a binding
              quote.
            </>
          ) : (
            <>
              Price the job on the takeoff sheet, and the generator assembles the{" "}
              {rules.stateName} clauses your job facts trigger — each one carrying its
              statute.
            </>
          )}
        </p>
        <Link href="/trades">
          <Button className="touch-lg">Price a job</Button>
        </Link>
      </section>

      <section className="space-y-2">
        <h2>Sources</h2>
        <ul className="ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
          {rules.citations.map((c, i) => (
            <li key={c.label}>
              <a href={c.url} className="underline underline-offset-4" rel="noopener">
                {c.label}
              </a>
              <SourceCitation
                index={i + 1}
                label={c.label}
                url={c.url}
                lastVerified={c.lastVerified}
              />
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Related pages" className="hairline-t pt-4">
        <p className="micro-label mb-2">Other states and related pages</p>
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          {otherStates.map((s) => (
            <li key={s}>
              <Link href={`/trades/contracts/${s}`} className="underline underline-offset-4">
                {getStateRules(s).stateName} requirements
              </Link>
            </li>
          ))}
          <li>
            <Link href="/trades/contract" className="underline underline-offset-4">
              Contract generator
            </Link>
          </li>
          <li>
            <Link href="/trades/pricing-methodology" className="underline underline-offset-4">
              Pricing methodology
            </Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
