import type { Metadata } from "next";
import { resolveRules } from "@fineprint/engine-paycheck";
import type { RuleEnvelope } from "@fineprint/engine-paycheck";
import { formatDate } from "@/lib/paycheck/format";
import { TAX_YEAR } from "@/lib/paycheck/rules-meta";
import { ErrorState } from "@fineprint/ui";

export const metadata: Metadata = {
  title: "OBBBA Deduction Sources — IRS Citations, Dated",
  description:
    "Every OBBBA deduction rule traced to its primary source: P.L. 119-21, IRS guidance and the FLSA, with last-verified dates and open items named.",
  alternates: { canonical: "/paycheck/sources" },
};

export default function SourcesPage() {
  const rules = resolveRules(TAX_YEAR);
  const envelopes: [string, RuleEnvelope][] = [
    ["Qualified tips deduction", rules.tips],
    ["Qualified overtime deduction", rules.overtime],
    ["Senior deduction", rules.senior],
    ["Car-loan interest deduction", rules.carLoan],
    ["Federal brackets and standard deduction", rules.brackets],
    ["Qualified occupation list", rules.occupations],
  ];
  const unverified = envelopes.filter(([, envelope]) => !envelope.verified);

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1>Sources</h1>
        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          Rules are encoded from primary sources only — statute, regulation, published IRS
          guidance — never from secondary coverage. Each rule set is versioned; when a rule
          moves we edit one file, log it on the changelog, and every page updates together.
        </p>
      </header>

      {unverified.length > 0 ? (
        <ErrorState
          cause={
            <>
              <span className="num">{unverified.length}</span> of{" "}
              <span className="num">{envelopes.length}</span> rule sets still carry
              pre-launch placeholder values.
            </>
          }
          fix="This build does not launch until every rule set below reads verified. Open items are tracked in VERIFICATION-NEEDED.md at the repository root."
        />
      ) : null}

      <div className="flex flex-col gap-6">
        {envelopes.map(([label, envelope]) => (
          <section
            key={envelope.ruleSetVersion}
            className="rounded-atlas hairline-all px-4 py-3"
            style={{ borderRadius: "var(--radius-atlas)" }}
          >
            <h2 style={{ fontSize: "var(--text-step-1)" }}>{label}</h2>

            <p className="mt-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              <span className="num">{envelope.ruleSetVersion}</span> · effective{" "}
              <span className="num">{formatDate(envelope.effectiveFrom)}</span> →{" "}
              <span className="num">
                {envelope.effectiveTo ? formatDate(envelope.effectiveTo) : "open"}
              </span>{" "}
              ·{" "}
              {envelope.verified ? (
                <span className="text-signal" style={{ fontWeight: 600 }}>
                  verified
                </span>
              ) : (
                <span className="text-ink" style={{ fontWeight: 600 }}>
                  unverified — pre-launch placeholder
                </span>
              )}
            </p>

            <ul className="mt-2 flex list-none flex-col gap-2 p-0">
              {/*
               * REMOVED: a [1] superscript beside every entry. An inline
               * <SourceCitation> earns its place next to a CLAIM in prose,
               * where the reader needs to know what backs the sentence they
               * are reading. On the source list itself the anchor already is
               * the citation, and the marker was a badge labelling nothing.
               */}
              {envelope.citations.map((citation) => {
                return (
                  <li
                    key={citation.label}
                    className="hairline-b pb-2 last:border-b-0"
                    style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
                  >
                    <a
                      href={citation.url}
                      rel="noopener"
                      className="text-ink underline decoration-rule underline-offset-4 hover:decoration-current"
                    >
                      {citation.label}
                    </a>
                    <span className="text-dim">
                      {" "}
                      · last verified{" "}
                      <span className="num">{formatDate(citation.lastVerified)}</span>
                      {citation.note ? <> · {citation.note}</> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
