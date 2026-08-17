import { Disclosure } from "@/components/ui";
import { formatDate } from "@/components/ui/format";
import { getFigure, type FigureId } from "@/lib/content/figures";
import { describeKnownGaps } from "@/lib/content/known-gaps";

/**
 * KeyFigure — a number an engine owns, printed with its receipts.
 *
 * The article writes `<KeyFigure id="loans.rap.principalMatch" />` and gets the
 * value out of the rule file, the rule set version it came from, the primary
 * citation, the date that citation was last verified, and — where
 * `KNOWN-GAPS.md` has an open item under the figure — the register's own words
 * about what is unresolved. See `src/lib/content/figures.ts` for why an
 * article never types the digits.
 *
 * Two shapes:
 *
 *   • `variant="inline"` (the default) sits inside a sentence: the value in
 *     the data face, followed by a superscript link to the source. That link
 *     is the "how do you know" affordance — small, keyboard-reachable, and it
 *     never moves the line it sits on.
 *
 *   • `variant="block"` stands alone: label, value, context, provenance, and
 *     an expandable disclosure for any open verification item. Use it for the
 *     figure an article is actually about.
 *
 * A figure carrying an open gap always renders its disclosure, in both shapes.
 * That is not configurable — the whole point of wiring the register in is that
 * an author cannot forget the caveat, and an author who could switch it off
 * would eventually switch it off.
 *
 * Colour note: an open gap is rendered in `--dim` and `--ink`, never `--flag`.
 * Oxide is reserved for irreversible decisions; "this figure rests on an
 * assumption" is important, not irreversible, and spending the flag colour on
 * it would devalue it where it counts.
 */

export interface KeyFigureProps {
  id: FigureId;
  variant?: "inline" | "block";
  /** Overrides the registry's label in block mode. Rarely needed. */
  label?: string;
}

export function KeyFigure({ id, variant = "inline", label }: KeyFigureProps) {
  const figure = getFigure(id);
  const gaps = describeKnownGaps(figure.knownGapIds);

  if (variant === "inline") {
    /*
     * Keep a figure and its source marker on one line — but only when the
     * figure is short. A `flag` renders a whole clause ("unpaid interest is
     * waived, never capitalised"), and `nowrap` on that pushes the page wider
     * than the viewport at 375px, which is a broken page rather than a tidy
     * number.
     */
    const nowrap = figure.unit !== "flag";

    return (
      <span className={nowrap ? "whitespace-nowrap" : undefined}>
        <span className="num">{figure.display}</span>
        <a
          href={figure.citation.url}
          target="_blank"
          rel="noreferrer"
          className="ml-0.5 rounded-atlas align-super text-dim underline decoration-rule underline-offset-2 hover:text-ink"
          style={{ fontSize: "var(--text-step--2)" }}
        >
          <span aria-hidden="true">{gaps.length > 0 ? "‡" : "†"}</span>
          <span className="sr-only">
            {` Source: ${figure.citation.label}${
              figure.citation.lastVerified
                ? `, verified ${formatDate(figure.citation.lastVerified)}`
                : ", not yet verified"
            }${gaps.length > 0 ? ". This figure has an open verification item." : ""}`}
          </span>
        </a>
      </span>
    );
  }

  return (
    <figure
      className="hairline-all rounded-atlas my-6 p-4"
      style={{ background: "var(--paper-raised)" }}
    >
      <p className="micro-label">{label ?? figure.label}</p>
      <p className="num mt-1 text-ink" style={{ fontSize: "var(--text-step-2)", lineHeight: 1.2 }}>
        {figure.display}
      </p>

      {figure.note ? (
        <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          {figure.note}
        </p>
      ) : null}

      <figcaption className="mt-3">
        <Provenance figure={figure} />
      </figcaption>

      {gaps.length > 0 ? <KnownGapDisclosure gaps={gaps} /> : null}
    </figure>
  );
}

function Provenance({ figure }: { figure: ReturnType<typeof getFigure> }) {
  return (
    <p
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-dim"
      style={{ fontSize: "var(--text-step--2)" }}
    >
      <span>
        Ruleset <span className="num text-ink">{figure.ruleSetVersion}</span>
      </span>
      <span aria-hidden="true" className="text-rule">
        ·
      </span>
      <span>
        {figure.citation.lastVerified ? (
          <>
            Verified{" "}
            <time className="num text-ink" dateTime={figure.citation.lastVerified}>
              {formatDate(figure.citation.lastVerified)}
            </time>
          </>
        ) : (
          "Citation not yet fetched"
        )}
      </span>
      <span aria-hidden="true" className="text-rule">
        ·
      </span>
      <a
        href={figure.citation.url}
        target="_blank"
        rel="noreferrer"
        className="rounded-atlas underline decoration-rule underline-offset-4 hover:text-ink"
      >
        {figure.citation.label}
      </a>
    </p>
  );
}

/**
 * The open-item disclosure.
 *
 * Closed by default and one tap open. Closed because a caveat that shouts on
 * every figure trains a reader to ignore all of them; one tap because a caveat
 * a reader cannot reach is decoration. The text is the register's, verbatim
 * apart from markdown formatting — a paraphrase here would be a second source
 * of truth about what the project does and does not know.
 */
function KnownGapDisclosure({ gaps }: { gaps: ReturnType<typeof describeKnownGaps> }) {
  return (
    <div className="mt-3">
      <Disclosure
        compact
        summary={
          gaps.length === 1
            ? "This figure has an open verification item"
            : `This figure has ${String(gaps.length)} open verification items`
        }
      >
        <ul className="m-0 list-none space-y-3 p-0">
          {gaps.map((gap) => (
            <li key={gap.id}>
              <p className="micro-label num">{gap.id}</p>
              <p className="mt-1" style={{ fontSize: "var(--text-step--1)" }}>
                {gap.gap}
              </p>
              <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                What it means for this page: {gap.impact}
              </p>
              <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                What would close it: {gap.unblocks}{" "}
                {gap.sourceUrl ? (
                  <a
                    href={gap.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-atlas underline decoration-rule underline-offset-4 hover:text-ink"
                  >
                    Source
                  </a>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}
