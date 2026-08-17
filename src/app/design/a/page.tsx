import type { Metadata } from "next";

import { BORROWER, CROSSOVER, LOANS, PLANS, SOURCE_LINE, WARNINGS, WINNER } from "../data";
import styles from "./a.module.css";

/**
 * DIRECTION A — "The Statement".
 *
 * MOCKUP. Static markup and CSS. No engine is imported and nothing is
 * computed here; every figure is a frozen string from ../data.ts.
 *
 * The argument: a borrower deciding between nine repayment plans is doing the
 * most consequential piece of paperwork of their year, and the interface
 * should feel like the document that decision deserves — a statement from a
 * bank that has been doing this for a century. So: an editorial serif at
 * display size and nowhere else, a marginalia column carrying the section
 * marks, hairlines instead of boxes, and far more white space than a
 * conversion-optimised page would allow. One accent (bronze) touches exactly
 * one figure, one rule and the section marks. One oxide line marks the one
 * thing that cannot be undone. Nothing else is coloured.
 */

export const metadata: Metadata = {
  title: "Design direction A — The Statement",
  description: "Internal design review mockup. Not a live page.",
  robots: { index: false, follow: false },
};

const HEADERS = [
  "",
  "Plan",
  "Monthly",
  "Payments",
  "Forgiven",
  "Tax at forgiveness",
  "30-year total",
] as const;

export default function DirectionAPage() {
  return (
    <div className={styles.root} data-direction="a">
      <style>{`body { background: #FBFAF8; }`}</style>

      <header className={styles.masthead}>
        <div className={`${styles.shell} ${styles.mastheadInner}`}>
          <p className={styles.wordmark}>Bracketsight</p>
          <ul className={styles.mastheadMeta}>
            <li>Statement of repayment options</li>
            <li>Ref BS-LN-2026-0814</li>
            <li>8 Aug 2026</li>
          </ul>
        </div>
      </header>

      {/* ---- hero: the headline states the finding, the panel states the
              figure. Data first, in both halves. ---- */}
      <section className={`${styles.shell} ${styles.hero}`}>
        <div>
          <p className={styles.eyebrow}>Federal student loans · nine plans</p>

          <h1 className={styles.display}>The cheapest payment is rarely the cheapest plan.</h1>

          <p className={styles.lead}>
            Your two loans, your income and the rules in force today, simulated month by month
            across all nine federal repayment plans for the next thirty years. Ranked by what you
            actually pay — not by what leaves your account each month.{" "}
            <span className={styles.leadStrong}>The gap between best and worst is $203,192.</span>
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.btnPrimary}>
              Compare all 9 plans
            </button>
            <a href="#ledger" className={styles.btnQuiet}>
              Read the ranked statement
            </a>
          </div>
        </div>

        <aside className={styles.verdict} aria-label="Recommendation">
          <p className={styles.verdictLabel}>Recommended · lowest 30-year cost</p>
          <p className={styles.verdictPlan}>{WINNER.name}</p>

          <strong className={styles.verdictFigure}>
            <sup aria-hidden="true">$</sup>
            <span className="sr-only">$</span>
            {WINNER.total}
          </strong>

          <p className={styles.verdictCaption}>
            Everything you pay, plus the tax on what is forgiven, over {WINNER.payments} payments.
          </p>

          <dl className={styles.verdictRows}>
            <div className={styles.verdictRow}>
              <dt>First payment</dt>
              <dd className={styles.n}>${WINNER.monthly} / mo</dd>
            </div>
            <div className={styles.verdictRow}>
              <dt>Balance forgiven</dt>
              <dd className={styles.n}>${WINNER.forgiven}</dd>
            </div>
            <div className={styles.verdictRow}>
              <dt>Forgiveness lands</dt>
              <dd className={styles.n}>{WINNER.resolves}</dd>
            </div>
            <div className={styles.verdictRow}>
              <dt>Tax due that year</dt>
              <dd className={styles.n}>${WINNER.tax}</dd>
            </div>
          </dl>

          <p className={styles.source}>{SOURCE_LINE}</p>
        </aside>
      </section>

      {/* ---- the finding, stated once, in the voice of the document ---- */}
      <section className={styles.crossover}>
        <div className={`${styles.shell} ${styles.crossoverGrid}`}>
          <p className={styles.crossoverLine}>{CROSSOVER.headline}</p>
          <p className={styles.crossoverBody}>{CROSSOVER.body}</p>
        </div>
      </section>

      {/* ---- the tool ---- */}
      <section className={`${styles.shell} ${styles.section}`}>
        <div className={styles.margin}>
          <p className={styles.marginMark}>§ 1</p>
          <h2 className={styles.marginTitle}>Your loans</h2>
          <p className={styles.marginNote}>
            Entered once. Every figure below is recomputed from these six values and nothing else.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Household and balances</h3>
            <span className={styles.cardStep}>Step 1 of 3</span>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="a-agi">Adjusted gross income</label>
              <input
                id="a-agi"
                className={styles.input}
                defaultValue={`$${BORROWER.agi}`}
                inputMode="numeric"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="a-filing">Filing status</label>
              <select id="a-filing" className={styles.select} defaultValue={BORROWER.filing}>
                <option>Married filing jointly</option>
                <option>Married filing separately</option>
                <option>Single</option>
                <option>Head of household</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="a-family">Family size</label>
              <input id="a-family" className={styles.input} defaultValue={BORROWER.familySize} />
            </div>
            <div className={styles.field}>
              <label htmlFor="a-growth">Expected income growth</label>
              <input id="a-growth" className={styles.input} defaultValue={`${BORROWER.growth}%`} />
            </div>
            <div className={styles.field}>
              <label htmlFor="a-current">Current plan</label>
              <select id="a-current" className={styles.select} defaultValue={BORROWER.currentPlan}>
                <option>New IBR</option>
                <option>Old IBR</option>
                <option>PAYE</option>
                <option>Standard 10-year</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="a-prior">Qualifying payments made</label>
              <input id="a-prior" className={styles.input} defaultValue={BORROWER.priorPayments} />
            </div>
          </div>

          <table className={styles.loanTable}>
            <caption>Loans · total ${BORROWER.balance}</caption>
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col" className={styles.numCell}>
                  Balance
                </th>
                <th scope="col" className={styles.numCell}>
                  Rate
                </th>
                <th scope="col" className={styles.numCell}>
                  First disbursed
                </th>
              </tr>
            </thead>
            <tbody>
              {LOANS.map((loan) => (
                <tr key={loan.type}>
                  <td>{loan.type}</td>
                  <td className={`${styles.n} ${styles.numCell}`}>${loan.balance}</td>
                  <td className={`${styles.n} ${styles.numCell}`}>{loan.rate}%</td>
                  <td className={`${styles.n} ${styles.numCell}`}>{loan.disbursed}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.cardFoot}>
            <p className={styles.cardFootNote}>
              Nothing here is stored. Figures stay in your browser and an uploaded statement is read
              in memory, then discarded.
            </p>
            <button type="button" className={styles.btnPrimary}>
              Run the comparison
            </button>
          </div>
        </div>
      </section>

      {/* ---- the ranked statement ---- */}
      <section className={`${styles.shell} ${styles.section}`} id="ledger">
        <div className={styles.margin}>
          <p className={styles.marginMark}>§ 2</p>
          <h2 className={styles.marginTitle}>All nine plans, ranked</h2>
          <p className={styles.marginNote}>
            By total cost over thirty years: every payment made, plus the tax owed on any balance
            forgiven. All nine are open to you, so none is greyed out here.
          </p>
        </div>

        <div className={styles.ledger}>
          <div className={styles.ledgerHead} aria-hidden="true">
            {HEADERS.map((header, index) => (
              <span key={header || "rank"} className={index >= 2 ? styles.headRight : undefined}>
                {header}
              </span>
            ))}
          </div>

          {PLANS.map((plan) => {
            const isWinner = plan.rank === 1;
            return (
              <div key={plan.id} className={`${styles.ledgerRow} ${isWinner ? styles.winner : ""}`}>
                <span className={styles.rank}>{String(plan.rank).padStart(2, "0")}</span>

                <div className={styles.planCell}>
                  <span className={styles.planName}>{plan.name}</span>
                  <span className={styles.planSub}>
                    {plan.term} · resolves {plan.resolves}
                  </span>
                  {isWinner ? <span className={styles.winnerMark}>Recommended</span> : null}
                </div>

                <div className={styles.n}>
                  <span className={styles.cellLabel}>Monthly</span>${plan.monthly}
                </div>
                <div className={`${styles.n} ${styles.nMuted}`}>
                  <span className={styles.cellLabel}>Payments</span>
                  {plan.payments}
                </div>
                <div className={`${styles.n} ${styles.nMuted}`}>
                  <span className={styles.cellLabel}>Forgiven</span>
                  {plan.forgiven ? `$${plan.forgiven}` : "—"}
                </div>
                <div className={`${styles.n} ${styles.nMuted}`}>
                  <span className={styles.cellLabel}>Tax at forgiveness</span>
                  {plan.tax ? `$${plan.tax}` : "—"}
                </div>

                <div className={styles.totalCell}>
                  <span className={styles.cellLabel}>30-year total</span>
                  <span className={styles.total}>${plan.total}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- notes ---- */}
      <section className={`${styles.shell} ${styles.notes}`}>
        <ul className={styles.noteList}>
          {WARNINGS.map((warning) => (
            <li
              key={warning.message}
              className={`${styles.note} ${
                warning.severity === "IRREVERSIBLE" ? styles.noteIrreversible : ""
              }`}
            >
              <span className={styles.noteTag}>
                {warning.severity === "IRREVERSIBLE" ? "Cannot be undone" : "Note"}
                <span className={styles.notePlan}> · {warning.plan}</span>
              </span>
              <p className={styles.noteBody}>{warning.message}</p>
            </li>
          ))}
        </ul>
        <p className={styles.source}>{SOURCE_LINE}</p>
      </section>
    </div>
  );
}
