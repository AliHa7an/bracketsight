import type { Metadata } from "next";

import {
  BORROWER,
  CROSSOVER,
  LOANS,
  MAX_TOTAL,
  PLANS,
  SOURCE_LINE,
  WARNINGS,
  WINNER,
} from "../data";
import styles from "./b.module.css";

/**
 * DIRECTION B — "The Terminal".
 *
 * MOCKUP. Static markup and CSS. No engine is imported and nothing is
 * computed here; every figure is a frozen string from ../data.ts. The bar
 * widths are the one arithmetic on the page and they are pure presentation —
 * a percentage of the dearest plan, so the ranking is visible as length as
 * well as as a number.
 *
 * The argument: the borrower is at an instrument. Every measure for every one
 * of the nine plans is on screen simultaneously, at 34px per row, in one
 * monospaced figure, so the comparison is made by the eye rather than by
 * scrolling and remembering. Prose is rationed to the four warnings, because
 * a warning is the only thing here a number cannot say.
 *
 * The dark palette is built from four real surface levels with panels lit from
 * above — see the header comment in b.module.css for why that, and not an
 * inverted light theme, is what makes it read as an instrument.
 */

export const metadata: Metadata = {
  title: "Design direction B — The Terminal",
  description: "Internal design review mockup. Not a live page.",
  robots: { index: false, follow: false },
};

const RAIL = [
  { label: "Loans", value: "9 plans", active: true },
  { label: "Paycheck", value: "OBBBA", active: false },
  { label: "Health", value: "400% FPL", active: false },
  { label: "Property", value: "Ratio", active: false },
  { label: "Trades", value: "Takeoff", active: false },
] as const;

const COLUMNS = ["#", "Plan", "Monthly", "Term", "Forgiven", "Tax", "Total", "Rel. cost"] as const;

export default function DirectionBPage() {
  return (
    <div className={styles.root} data-direction="b">
      <style>{`body { background: #080A0E; }`}</style>

      <div className={styles.topbar}>
        <p className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          Bracketsight
        </p>
        <ul className={styles.chips}>
          <li>
            Ruleset <b>2026.07.01</b>
          </li>
          <li>
            As of <b>08 Aug 2026</b>
          </li>
          <li>
            Engine <b>1.0.0</b>
          </li>
          <li>
            Simulated <b>360 mo × 9</b>
          </li>
        </ul>
      </div>

      <div className={styles.frame}>
        <nav className={styles.rail} aria-label="Tools">
          <p className={styles.railLabel}>Instruments</p>
          <ul className={styles.railList}>
            {RAIL.map((item) => (
              <li key={item.label}>
                <a
                  href="#ranked"
                  className={`${styles.railItem} ${item.active ? styles.railItemActive : ""}`}
                  aria-current={item.active ? "page" : undefined}
                >
                  {item.label}
                  <span className={styles.railValue}>{item.value}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className={styles.railFoot}>
            <dl>
              <div>
                <dt>Balance</dt>
                <dd>${BORROWER.balance}</dd>
              </div>
              <div>
                <dt>AGI</dt>
                <dd>${BORROWER.agi}</dd>
              </div>
              <div>
                <dt>Family</dt>
                <dd>{BORROWER.familySize}</dd>
              </div>
              <div>
                <dt>Credited</dt>
                <dd>{BORROWER.priorPayments} pmts</dd>
              </div>
            </dl>
          </div>
        </nav>

        <div className={styles.main}>
          {/* ---- hero instrument ---- */}
          <section className={`${styles.panel} ${styles.hero}`} aria-label="Recommendation">
            <div className={styles.heroMain}>
              <p className={styles.heroTag}>
                Lowest 30-year cost
                <span className={styles.heroPlan}>· {WINNER.id}</span>
              </p>

              <p className={styles.heroFigure}>
                <span className={styles.heroCurrency} aria-hidden="true">
                  $
                </span>
                <span className="sr-only">$</span>
                {WINNER.total}
              </p>

              <p className={styles.heroUnit}>
                USD · total paid + tax on forgiveness · {WINNER.payments} payments
              </p>

              <p className={styles.delta}>Saves ${CROSSOVER.delta} vs PAYE</p>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>First payment</span>
                <span className={styles.statValue}>${WINNER.monthly}</span>
                <span className={styles.statSub}>per month</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Term</span>
                <span className={styles.statValue}>{WINNER.term}</span>
                <span className={styles.statSub}>{WINNER.payments} payments</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Forgiven</span>
                <span className={styles.statValue}>${WINNER.forgiven}</span>
                <span className={styles.statSub}>{WINNER.resolves}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Tax at forgiveness</span>
                <span className={styles.statValue}>${WINNER.tax}</span>
                <span className={styles.statSub}>assumed 22% marginal</span>
              </div>
            </div>
          </section>

          <div className={styles.columns}>
            {/* ---- input instrument ---- */}
            <section className={styles.panel} aria-label="Inputs">
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Inputs</h2>
                <span className={styles.panelNote}>6 fields · 2 loans</span>
              </div>

              <div className={styles.inputRow}>
                <label htmlFor="b-agi">AGI</label>
                <input
                  id="b-agi"
                  className={styles.field}
                  defaultValue={`$${BORROWER.agi}`}
                  inputMode="numeric"
                />
              </div>
              <div className={styles.inputRow}>
                <label htmlFor="b-filing">Filing</label>
                <select id="b-filing" className={styles.selectField} defaultValue="MFJ">
                  <option value="MFJ">Married filing jointly</option>
                  <option value="MFS">Married filing separately</option>
                  <option value="S">Single</option>
                </select>
              </div>
              <div className={styles.inputRow}>
                <label htmlFor="b-family">Family size</label>
                <input id="b-family" className={styles.field} defaultValue={BORROWER.familySize} />
              </div>
              <div className={styles.inputRow}>
                <label htmlFor="b-growth">Income growth</label>
                <input
                  id="b-growth"
                  className={styles.field}
                  defaultValue={`${BORROWER.growth}%`}
                />
              </div>
              <div className={styles.inputRow}>
                <label htmlFor="b-current">Current plan</label>
                <select
                  id="b-current"
                  className={styles.selectField}
                  defaultValue={BORROWER.currentPlan}
                >
                  <option>New IBR</option>
                  <option>Old IBR</option>
                  <option>PAYE</option>
                  <option>Standard 10-year</option>
                </select>
              </div>
              <div className={styles.inputRow}>
                <label htmlFor="b-prior">Credited pmts</label>
                <input
                  id="b-prior"
                  className={styles.field}
                  defaultValue={BORROWER.priorPayments}
                />
              </div>

              {LOANS.map((loan) => (
                <div key={loan.type} className={styles.loanLine}>
                  <span className={styles.loanType}>{loan.type}</span>
                  <span className={styles.loanBalance}>${loan.balance}</span>
                  <span className={styles.loanMeta}>Disbursed {loan.disbursed}</span>
                  <span className={styles.loanRate}>{loan.rate}%</span>
                </div>
              ))}

              <div className={styles.runRow}>
                <button type="button" className={styles.run}>
                  Run comparison
                </button>
                <p className={styles.runNote}>
                  Runs in your browser. Nothing is sent anywhere, nothing is stored.
                </p>
              </div>
            </section>

            {/* ---- ranked instrument, with the warnings stacked beneath it so
                    the irreversible one sits directly under the row it is
                    about ---- */}
            <div className={styles.stack}>
              <section className={styles.panel} id="ranked" aria-label="All nine plans ranked">
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>All plans · ranked by 30-year total</h2>
                  <span className={styles.panelNote}>9 eligible · 0 excluded</span>
                </div>

                <div className={styles.tableHead} aria-hidden="true">
                  {COLUMNS.map((column, index) => (
                    <span
                      key={column}
                      className={index >= 2 && index <= 6 ? styles.right : undefined}
                    >
                      {column}
                    </span>
                  ))}
                </div>

                {PLANS.map((plan) => {
                  const isWinner = plan.rank === 1;
                  const isFlagged = plan.id === "RAP";
                  const width = `${Math.round((plan.totalValue / MAX_TOTAL) * 100)}%`;
                  return (
                    <div
                      key={plan.id}
                      className={[
                        styles.tableRow,
                        isWinner ? styles.rowWin : "",
                        isFlagged ? styles.rowFlag : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className={styles.idx}>{String(plan.rank).padStart(2, "0")}</span>

                      <span className={styles.planName}>
                        {plan.name}
                        {isWinner ? (
                          <span className={`${styles.tag} ${styles.tagWin}`}>Best</span>
                        ) : null}
                        {isFlagged ? (
                          <span className={`${styles.tag} ${styles.tagFlag}`}>One-way</span>
                        ) : null}
                      </span>

                      <span className={styles.num}>
                        <span className={styles.cellLabel}>Monthly</span>${plan.monthly}
                      </span>
                      <span className={`${styles.num} ${styles.numDim}`}>
                        <span className={styles.cellLabel}>Term</span>
                        {plan.term}
                      </span>
                      <span className={`${styles.num} ${styles.numDim}`}>
                        <span className={styles.cellLabel}>Forgiven</span>
                        {plan.forgiven ? `$${plan.forgiven}` : "—"}
                      </span>
                      <span className={`${styles.num} ${styles.numDim}`}>
                        <span className={styles.cellLabel}>Tax</span>
                        {plan.tax ? `$${plan.tax}` : "—"}
                      </span>

                      <span className={`${styles.numTotal} ${styles.totalCell}`}>
                        <span className={styles.cellLabel}>Total</span>${plan.total}
                      </span>

                      <span className={styles.barCell}>
                        <span className={styles.bar}>
                          <span className={styles.barFill} style={{ width }} />
                        </span>
                      </span>
                    </div>
                  );
                })}
              </section>

              {/* ---- warnings ---- */}
              <section className={`${styles.panel} ${styles.alerts}`} aria-label="Warnings">
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Warnings</h2>
                  <span className={styles.panelNote}>1 irreversible · 3 caution</span>
                </div>

                {WARNINGS.map((warning) => (
                  <div
                    key={warning.message}
                    className={`${styles.alert} ${
                      warning.severity === "IRREVERSIBLE" ? styles.alertIrreversible : ""
                    }`}
                  >
                    <span
                      className={`${styles.sev} ${
                        warning.severity === "IRREVERSIBLE" ? styles.sevIrreversible : ""
                      }`}
                    >
                      {warning.severity}
                    </span>
                    <span className={styles.alertPlan}>{warning.plan}</span>
                    <p className={styles.alertBody}>{warning.message}</p>
                  </div>
                ))}
              </section>
            </div>
          </div>

          <p className={styles.foot}>{SOURCE_LINE}</p>
        </div>
      </div>
    </div>
  );
}
