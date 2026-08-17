import type { Metadata } from "next";

import { BORROWER, CROSSOVER, LOANS, PLANS, SOURCE_LINE, WARNINGS, WINNER } from "../data";
import styles from "./c.module.css";

/**
 * DIRECTION C — "The Ledger, modernised".
 *
 * MOCKUP. Static markup and CSS. No engine is imported and nothing is
 * computed here; every figure is a frozen string from ../data.ts.
 *
 * The argument: A treats the reader as a client receiving a statement and B
 * treats them as an operator at a terminal. C treats them as a user of a
 * product that happens to be extremely good at arithmetic. One grotesque
 * across a very wide range does what A's serif does; solid colour blocks do
 * what A's whitespace does; the ranked table is denser than A's and looser
 * than B's, because it is meant to be read once and acted on, not monitored.
 *
 * Rhythm is the structural idea: white hero → grey band with the tool →
 * white results → full-bleed ink band carrying the finding → white notes.
 * Two dark blocks, both earning it.
 */

export const metadata: Metadata = {
  title: "Design direction C — The Ledger, modernised",
  description: "Internal design review mockup. Not a live page.",
  robots: { index: false, follow: false },
};

const TOOLS = [
  { label: "Student loans", token: "--loans", active: true },
  { label: "Paycheck", token: "--paycheck", active: false },
  { label: "Health cover", token: "--health", active: false },
  { label: "Property tax", token: "--property", active: false },
  { label: "Trades", token: "--trades", active: false },
] as const;

const COLUMNS = [
  "Rank",
  "Plan",
  "Monthly",
  "Payments",
  "Forgiven",
  "Tax",
  "30-year total",
] as const;

export default function DirectionCPage() {
  return (
    <div className={styles.root} data-direction="c">
      <style>{`body { background: #FFFFFF; }`}</style>

      <header className={styles.nav}>
        <div className={`${styles.shell} ${styles.navInner}`}>
          <p className={styles.wordmark}>Bracketsight</p>

          <nav aria-label="Tools">
            <ul className={styles.navList}>
              {TOOLS.map((tool) => (
                <li key={tool.label}>
                  <a
                    href="#ranked"
                    className={`${styles.navLink} ${tool.active ? styles.navLinkActive : ""}`}
                    aria-current={tool.active ? "page" : undefined}
                  >
                    <span
                      className={styles.dot}
                      style={{ color: `var(${tool.token})` }}
                      aria-hidden="true"
                    />
                    {tool.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <button type="button" className={styles.btn}>
            Compare all 9 plans
          </button>
        </div>
      </header>

      {/* ---- hero ---- */}
      <section className={`${styles.shell} ${styles.hero}`}>
        <div>
          <p className={styles.eyebrow}>Student loans</p>

          <h1 className={styles.display}>Nine plans. One of them costs $203,192 less.</h1>

          <p className={styles.lead}>
            Enter your loan mix once. Every federal repayment plan is simulated month by month for
            thirty years, ranked by what you actually pay, with every one-way door flagged before
            you walk through it.
          </p>

          <div className={styles.actions}>
            <button type="button" className={styles.btn}>
              Compare all 9 plans
            </button>
            <a href="#ranked" className={styles.textLink}>
              Read the method
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M3 8h9" />
                <path d="M8.5 4.5 12 8l-3.5 3.5" />
              </svg>
            </a>
          </div>

          <dl className={styles.metrics}>
            <div>
              <dd className={styles.metricValue}>9</dd>
              <dt className={styles.metricLabel}>plans simulated, none omitted</dt>
            </div>
            <div>
              <dd className={styles.metricValue}>360</dd>
              <dt className={styles.metricLabel}>months modelled per plan</dt>
            </div>
            <div>
              <dd className={styles.metricValue}>0</dd>
              <dt className={styles.metricLabel}>figures written by AI</dt>
            </div>
          </dl>
        </div>

        <aside className={styles.verdict} aria-label="Recommendation">
          <div className={styles.verdictTop}>
            <span className={styles.pill}>Recommended</span>
            <span className={styles.verdictRank}>1 of 9 · lowest total cost</span>
          </div>

          <p className={styles.verdictPlan}>{WINNER.name}</p>

          <strong className={styles.verdictFigure}>${WINNER.total}</strong>

          <p className={styles.verdictCaption}>
            Everything you pay over {WINNER.payments} payments, plus the tax owed on the balance
            forgiven in {WINNER.resolves}.
          </p>

          <dl className={styles.verdictRows}>
            <div className={styles.verdictRow}>
              <dt>First payment</dt>
              <dd>${WINNER.monthly}</dd>
            </div>
            <div className={styles.verdictRow}>
              <dt>Balance forgiven</dt>
              <dd>${WINNER.forgiven}</dd>
            </div>
            <div className={styles.verdictRow}>
              <dt>Tax at forgiveness</dt>
              <dd>${WINNER.tax}</dd>
            </div>
            <div className={styles.verdictRow}>
              <dt>Next cheapest plan</dt>
              <dd>+$50,427</dd>
            </div>
          </dl>

          <p className={styles.verdictSource}>{SOURCE_LINE}</p>
        </aside>
      </section>

      {/* ---- the tool ---- */}
      <section className={styles.bandSection}>
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Your loans</h2>
            <p className={styles.sectionNote}>
              Six fields and your loan list. Everything above and below is recomputed from these and
              nothing else.
            </p>
          </div>

          <div className={styles.toolCard}>
            <div className={styles.toolBlock}>
              <p className={styles.toolBlockLabel}>Student loans</p>
              <h3 className={styles.toolBlockTitle}>Your loan mix, entered once</h3>
              <p className={styles.toolBlockBody}>
                Type, balance, rate and first disbursement decide which plans you can use at all.
                Grad PLUS qualifies for RAP; a consolidation containing Parent PLUS never does.
              </p>
              <p className={styles.toolBlockFigure}>
                <span className={styles.toolBlockValue}>${BORROWER.balance}</span>
                <span className={styles.toolBlockUnit}>Total balance · 2 loans</span>
              </p>
            </div>

            <div className={styles.toolForm}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="c-agi">Adjusted gross income</label>
                  <input
                    id="c-agi"
                    className={styles.control}
                    defaultValue={`$${BORROWER.agi}`}
                    inputMode="numeric"
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="c-filing">Filing status</label>
                  <select
                    id="c-filing"
                    className={`${styles.control} ${styles.controlText}`}
                    defaultValue="MFJ"
                  >
                    <option value="MFJ">Married filing jointly</option>
                    <option value="MFS">Married filing separately</option>
                    <option value="S">Single</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="c-family">Family size</label>
                  <input
                    id="c-family"
                    className={styles.control}
                    defaultValue={BORROWER.familySize}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="c-growth">Expected income growth</label>
                  <input
                    id="c-growth"
                    className={styles.control}
                    defaultValue={`${BORROWER.growth}%`}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="c-current">Current plan</label>
                  <select
                    id="c-current"
                    className={`${styles.control} ${styles.controlText}`}
                    defaultValue={BORROWER.currentPlan}
                  >
                    <option>New IBR</option>
                    <option>Old IBR</option>
                    <option>PAYE</option>
                    <option>Standard 10-year</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="c-prior">Qualifying payments made</label>
                  <input
                    id="c-prior"
                    className={styles.control}
                    defaultValue={BORROWER.priorPayments}
                  />
                </div>
              </div>

              <ul className={styles.loanList}>
                {LOANS.map((loan) => (
                  <li key={loan.type} className={styles.loanItem}>
                    <span className={styles.loanName}>{loan.type}</span>
                    <span className={styles.loanFig}>${loan.balance}</span>
                    <span className={styles.loanRate}>{loan.rate}%</span>
                    <span className={styles.loanMeta}>First disbursed {loan.disbursed}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.formFoot}>
                <p className={styles.formFootNote}>
                  Nothing is stored. An uploaded statement is read in memory and discarded.
                </p>
                <button type="button" className={styles.btn}>
                  Run the comparison
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- results ---- */}
      <section className={`${styles.shell} ${styles.results}`} id="ranked">
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>All nine plans, ranked</h2>
            <div className={styles.segmented} role="group" aria-label="Rank by">
              <button type="button" className={`${styles.seg} ${styles.segActive}`}>
                Total cost
              </button>
              <button type="button" className={styles.seg}>
                Monthly payment
              </button>
            </div>
          </div>

          <div className={styles.tableHead} aria-hidden="true">
            {COLUMNS.map((column, index) => (
              <span key={column} className={index >= 2 ? styles.right : undefined}>
                {column}
              </span>
            ))}
          </div>

          {PLANS.map((plan) => {
            const isWinner = plan.rank === 1;
            const isFlagged = plan.id === "RAP";
            return (
              <div key={plan.id} className={`${styles.tableRow} ${isWinner ? styles.rowWin : ""}`}>
                <span className={styles.idx}>{String(plan.rank).padStart(2, "0")}</span>

                <span className={styles.planCell}>
                  <span className={styles.planName}>{plan.name}</span>
                  <span className={styles.planTerm}>{plan.term}</span>
                  {isWinner ? <span className={styles.tagWin}>Recommended</span> : null}
                  {isFlagged ? <span className={styles.tagFlag}>One-way door</span> : null}
                </span>

                <span className={styles.cell}>
                  <span className={styles.cellLabel}>Monthly</span>${plan.monthly}
                </span>
                <span className={`${styles.cell} ${styles.cellDim}`}>
                  <span className={styles.cellLabel}>Payments</span>
                  {plan.payments}
                </span>
                <span className={`${styles.cell} ${styles.cellDim}`}>
                  <span className={styles.cellLabel}>Forgiven</span>
                  {plan.forgiven ? `$${plan.forgiven}` : "—"}
                </span>
                <span className={`${styles.cell} ${styles.cellDim}`}>
                  <span className={styles.cellLabel}>Tax</span>
                  {plan.tax ? `$${plan.tax}` : "—"}
                </span>

                <span className={`${styles.cellTotal} ${styles.totalCell}`}>
                  <span className={styles.cellLabel}>30-year total</span>${plan.total}
                </span>
              </div>
            );
          })}

          <p className={styles.panelFoot}>{SOURCE_LINE}</p>
        </div>
      </section>

      {/* ---- the finding ---- */}
      <section className={styles.crossover}>
        <div className={`${styles.shell} ${styles.crossoverGrid}`}>
          <div>
            <h2 className={styles.crossoverHeadline}>{CROSSOVER.headline}</h2>
            <p className={styles.crossoverBody}>{CROSSOVER.body}</p>
          </div>
          <p className={styles.crossoverFigure}>
            <span className={styles.crossoverValue}>${CROSSOVER.delta}</span>
            <span className={styles.crossoverUnit}>Difference over the full term</span>
          </p>
        </div>
      </section>

      {/* ---- warnings ---- */}
      <section className={`${styles.shell} ${styles.notes}`}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Before you switch</h2>
          <p className={styles.sectionNote}>
            One of these cannot be undone. It is the only thing on this page in red.
          </p>
        </div>

        <ul className={styles.noteList}>
          {WARNINGS.map((warning) => (
            <li
              key={warning.message}
              className={`${styles.note} ${
                warning.severity === "IRREVERSIBLE" ? styles.noteIrreversible : ""
              }`}
            >
              <span className={styles.noteTag}>
                {warning.severity === "IRREVERSIBLE" ? "Cannot be undone" : "Worth knowing"}
                <span className={styles.notePlan}>{warning.plan}</span>
              </span>
              <p className={styles.noteBody}>{warning.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
