import type { Metadata } from "next";
import Link from "next/link";

import { CliffPanel } from "@/components/home/CliffPanel";
import { ProofRow } from "@/components/home/ProofRow";
import { RevealGroup } from "@/components/home/RevealGroup";
import { ToolCard } from "@/components/home/ToolCard";
import { ClaimIcon } from "@/components/home/ToolIcon";
import {
  CTA_LABEL,
  RULE_PIPELINE,
  TOOL_CARDS,
  TRUST_POINTS,
  TRUST_STRIP,
} from "@/components/home/data";
import styles from "@/components/home/home.module.css";

import { formatProofDate, getProof } from "@/lib/proof";
import { SECTIONS, SECTION_PAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Five decision engines for US money rules (2026)",
  description:
    "Compare 9 federal loan repayment plans, check OBBBA deductions, measure your distance to the 400% ACA cliff, test a property assessment, price a trade job. Free, cited.",
  alternates: { canonical: "/" },
};

/**
 * The hub.
 *
 * This is a portfolio of decision engines, not a link farm, and the page is
 * built to demonstrate that rather than assert it. The largest object on the
 * first screen is a working instrument — the ACA engine, running in the
 * reader's browser, plotting the 400% cliff as an actual discontinuity they can
 * drag a household across. Underneath it, four figures derived from this
 * repository at build time. Then one card per tool, each carrying a real engine
 * result rather than a plausible-looking round number.
 *
 * WHERE EVERY FIGURE COMES FROM is set out at the top of
 * `@/components/home/data.ts`, per card, with the inputs and the run date. The
 * three registers are: live (the panel), build-time (the proof strip) and
 * frozen-but-cited (the five card examples).
 *
 * The five cards are derived from `TOOL_CARDS`, keyed by `SectionSlug`, and the
 * methodology chips from `SECTION_PAGES`, so neither can point at a page that
 * was never built and a sixth section cannot ship without a card here.
 */
export default function HubPage() {
  const proof = getProof();

  return (
    <div className={styles.root}>
      {/* ────────────────────────────────────────────────────────── hero ── */}

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={`${styles.shell} ${styles.heroInner}`}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowRule} aria-hidden="true" />
              <span className={styles.tag}>Decision engines · not calculators</span>
            </p>

            <h1 className={styles.display}>
              Every option, priced. <span className={styles.displayAccent}>Then ranked.</span>
            </h1>

            <p className={styles.lead}>
              Five engines for the US money rules that move real dollars. Nine federal repayment
              plans. Every OBBBA deduction. Both sides of the 400% subsidy cliff. You enter your
              own numbers, the engines simulate every option under the rules in force today, and
              the answer is the one that costs you least — with the one-way doors marked before
              you reach them and every rule cited to its source.
            </p>

            <ul className={styles.trust}>
              {TRUST_STRIP.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>

            <p className={styles.actions}>
              <a className={styles.btnPrimary} href="#tools">
                {CTA_LABEL}
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M3 8h9" />
                  <path d="m8.6 4.6 3.4 3.4-3.4 3.4" />
                </svg>
              </a>
              <a className={styles.btnQuiet} href="#proof">
                What we check, and how often
              </a>
            </p>
          </div>

          <CliffPanel />
        </div>
      </section>

      {/* ───────────────────────────────────────────────────── the proof ── */}

      <section className={styles.proof} id="proof" aria-label="What is checked">
        <div className={styles.shell}>
          <ProofRow stats={proof.stats} />
        </div>
      </section>

      {/* ───────────────────────────────────────────────────── the tools ── */}

      <section className={`${styles.shell} ${styles.tools}`} id="tools">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Which question are you trying to answer?</h2>
          <p className={styles.tag}>
            5 engines · {proof.ruleFiles} rule files · rules in force 2026
          </p>
        </div>

        <RevealGroup as="ul" className={styles.cardGrid}>
          {TOOL_CARDS.map((card, index) => (
            <ToolCard key={card.slug} card={card} index={index} />
          ))}
        </RevealGroup>
      </section>

      {/* ───────────────────────────────────────────────── why trust it ── */}

      <section className={styles.trustBand} aria-labelledby="trust-title">
        <div className={styles.trustBandGrid} aria-hidden="true" />

        <div className={`${styles.shell} ${styles.trustInner}`}>
          <div className={styles.trustHead}>
            <h2 className={styles.trustTitle} id="trust-title">
              Why trust a number from here?
            </h2>
            <p className={styles.trustTag}>
              {proof.verified} of {proof.figures} figures verified
            </p>
          </div>

          <dl className={styles.claims}>
            {TRUST_POINTS.map((point) => (
              <div key={point.id} className={styles.claim}>
                <dt className={styles.claimHeading}>
                  <span className={styles.claimArt}>
                    <ClaimIcon id={point.id} />
                  </span>
                  {point.heading}
                </dt>
                <dd className={styles.claimDd}>
                  <span className={styles.claimLede}>{point.lede}</span>
                  <span className={styles.claimBody}>{point.body}</span>
                </dd>
              </div>
            ))}
          </dl>

          {/*
            The method, as a run of four nodes with hairline connectors: a
            regulation, a versioned rule file, a deterministic engine, your
            result. It is the site's whole answer to "why should I believe
            this", and it is easier to follow as a line than as a paragraph.
          */}
          <h3 className={styles.pipelineHead}>How a rule becomes a number</h3>

          <ol className={styles.pipeline}>
            {RULE_PIPELINE.map((step) => (
              <li key={step.step} className={styles.pipelineStep}>
                <span className={styles.pipelineNum}>{step.step}</span>
                <p className={styles.pipelineTitle}>{step.title}</p>
                <p className={styles.pipelineBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── the workings ── */}

      {/*
        Each tool answers to a different rule-maker, so the workings live with
        the tool rather than in one site-wide page that would belong to none of
        them. These links are computed from SECTION_PAGES, so none of them can
        point at a page that was never built.
      */}
      <section className={`${styles.shell} ${styles.workings}`} aria-labelledby="workings-title">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle} id="workings-title">
            Where are the workings?
          </h2>
          <p className={styles.tag}>last rule check {formatProofDate(proof.lastRuleCheck)}</p>
        </div>

        <p className={styles.workingsLead}>
          Every tool carries its own methodology, its own list of primary sources and its own
          changelog, because each one answers to a different rule-maker — the Department of
          Education, the IRS, HHS, a county assessor, a state contractor board. Start with the
          methodology for the tool you are using:
        </p>

        <ul className={styles.chips}>
          {SECTIONS.map((section) => {
            const methodology = SECTION_PAGES[section.slug].find((page) => page.trust);
            if (!methodology) return null;
            return (
              <li key={section.id}>
                <Link
                  href={`/${section.slug}${methodology.href}`}
                  className={styles.chip}
                  data-section={section.dataSection}
                >
                  <span className={styles.chipDot} aria-hidden="true" />
                  {section.name} — {methodology.label.toLowerCase()}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className={styles.chipsLabel}>And the rest of the record</p>

        <ul className={styles.chips}>
          <li>
            <Link href="/about" className={styles.chip}>
              About Bracketsight
            </Link>
          </li>
          <li>
            <Link href="/authors" className={styles.chip}>
              Who writes and checks this
            </Link>
          </li>
          <li>
            <Link href="/contact" className={styles.chip}>
              Report a wrong figure
            </Link>
          </li>
        </ul>

        <div className={styles.workingsTail}>
          <p className={styles.workingsLead}>
            For how a rule gets from a regulation into a number on this site, how it is funded, and
            the <span className={styles.chipMono}>55</span> items still recorded as unverified,
            read <Link href="/about">about Bracketsight</Link>. For what verification means here,
            what a pass over <span className={styles.chipMono}>{proof.figures}</span> individual
            figures found, and which professional reviews have not happened yet, read{" "}
            <Link href="/authors">who writes and checks this</Link>.
          </p>

          <p className={styles.workingsLead}>
            Found a figure that is wrong?{" "}
            <Link href="/contact">Report it and it gets fixed</Link> — checked against the primary
            source, then logged in that tool&rsquo;s changelog with the date and the document it
            came from. Corrections are never taken on a secondary source.
          </p>
        </div>
      </section>
    </div>
  );
}
