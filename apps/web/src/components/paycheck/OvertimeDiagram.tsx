import type { Cents } from "@fineprint/engine-paycheck";
import { formatCentsExact } from "@/lib/paycheck/format";

/**
 * The overtime-premium teaching diagram — the concept people most often get
 * wrong, drawn once.
 *
 * One time-and-a-half hour, split in the true 2:1 proportion into "your
 * regular rate" (1.0×, ordinary pay) and "the premium" (0.5×, the only part
 * the law calls qualified overtime). Employers who report the whole 1.5× are
 * the single most common source of a wrong return here.
 *
 * Built from laid-out boxes rather than an SVG with text in it: an SVG's text
 * scales with its viewBox, so at 375px the labels would render at seven
 * pixels. These labels stay at the real type scale and the legend columns
 * inherit the bar's own proportions, so the alignment survives every width.
 */
export function OvertimeDiagram({ regularRateCents }: { regularRateCents?: Cents }) {
  const rate = regularRateCents !== undefined && regularRateCents > 0 ? regularRateCents : null;
  const premium = rate === null ? null : Math.round(rate / 2);
  const total = rate === null || premium === null ? null : rate + premium;

  return (
    <figure className="m-0 w-full min-w-0">
      <figcaption style={{ fontWeight: 600, fontSize: "var(--text-step-0)" }}>
        Why only part of your overtime is deductible
      </figcaption>

      {/* the bracket: the whole span is one overtime hour */}
      <p className="micro-label mt-3">One overtime hour = 1.5× your regular rate</p>
      <div
        aria-hidden="true"
        className="mt-1 w-full"
        style={{
          height: "5px",
          borderTop: "var(--hairline-strong)",
          borderLeft: "var(--hairline-strong)",
          borderRight: "var(--hairline-strong)",
        }}
      />

      {/* the bar, in the true 2 : 1 proportion */}
      <div aria-hidden="true" className="mt-2 flex w-full" style={{ height: "38px" }}>
        <div
          className="flex items-center justify-center"
          style={{
            flex: "2 1 0",
            background: "color-mix(in srgb, var(--ink) 10%, var(--paper))",
            borderRight: "2px solid var(--paper)",
          }}
        >
          <span className="num text-ink" style={{ fontSize: "var(--text-step--1)" }}>
            1.0×
          </span>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ flex: "1 1 0", background: "var(--signal)" }}
        >
          <span className="num" style={{ color: "var(--paper)", fontSize: "var(--text-step--1)" }}>
            0.5×
          </span>
        </div>
      </div>

      {/* the legend, inheriting the bar's proportions so it stays aligned */}
      <div className="density-instrument mt-2 flex w-full gap-2">
        <div style={{ flex: "2 1 0" }}>
          <p className="text-ink" style={{ fontWeight: 500 }}>
            your regular rate
          </p>
          <p className="text-dim">
            ordinary pay — not deductible
            {rate !== null ? (
              <>
                {" "}
                (<span className="num">{formatCentsExact(rate)}</span>/hr)
              </>
            ) : null}
          </p>
        </div>
        <div style={{ flex: "1 1 0" }}>
          <p className="text-signal" style={{ fontWeight: 600 }}>
            the premium
          </p>
          <p className="text-dim">
            this half is deductible
            {premium !== null ? (
              <>
                {" "}
                (<span className="num">{formatCentsExact(premium)}</span>/hr)
              </>
            ) : null}
          </p>
        </div>
      </div>

      <p className="density-instrument mt-3 text-ink" style={{ maxWidth: "var(--measure)" }}>
        <span className="num">premium = overtime hours × regular rate × 0.5</span> — never the
        whole 1.5× paycheck. If your employer reported the full amount, the number on your form
        is wrong.
      </p>

      <table className="sr-only-table">
        <caption>
          How one time-and-a-half overtime hour splits into ordinary pay and the deductible
          premium
        </caption>
        <tbody>
          <tr>
            <th scope="row">Regular rate (1.0×), not deductible</th>
            <td>{rate === null ? "your hourly rate" : formatCentsExact(rate)}</td>
          </tr>
          <tr>
            <th scope="row">FLSA premium (0.5×), deductible</th>
            <td>{premium === null ? "half your hourly rate" : formatCentsExact(premium)}</td>
          </tr>
          <tr>
            <th scope="row">Total paid for the hour (1.5×)</th>
            <td>{total === null ? "one and a half times your rate" : formatCentsExact(total)}</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}
