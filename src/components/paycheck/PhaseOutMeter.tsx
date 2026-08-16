import type { EngineResult } from "@/engines/paycheck";
import { usd } from "@/lib/paycheck/format";
import { LeakMark } from "./Paystub";

/**
 * The phase-out meter — where this household's MAGI sits against the shared
 * $150k / $300k tips-and-overtime threshold, and how far it is from the point
 * where the claimed deductions reach zero.
 *
 * Amber marks the phase-out zone, which is the one thing on the page that is
 * literally money left behind. It never travels alone: the zone is labelled in
 * words, the sentence above states the distance in dollars, and the whole
 * visual has a screen-reader table equivalent.
 *
 * Hand-rolled. No chart library, no gradients, no elevation — two flat bands
 * and a marker, which is all the information there is.
 */
export function PhaseOutMeter({ result }: { result: EngineResult }) {
  const { thresholdCents, magiCents, distanceToThresholdCents } = result.primaryPhaseOut;

  // End of scale: the furthest "fully phased out" point among claimed
  // deductions, or 4/3 of the threshold when nothing is claimed.
  const furthest = Math.max(
    Math.round((thresholdCents * 4) / 3),
    ...result.deductions
      .filter((d) => d.claimed && d.phaseOut)
      .map((d) => d.phaseOut?.fullyPhasedOutAtCents ?? 0),
  );
  const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
  const thresholdPct = clamp(thresholdCents / furthest) * 100;
  const magiPct = clamp(magiCents / furthest) * 100;
  const over = distanceToThresholdCents < 0;
  const joint = result.filingStatus === "MARRIED_JOINT";

  const sentence = over
    ? `Your MAGI of ${usd(magiCents)} is ${usd(-distanceToThresholdCents)} over the ${usd(thresholdCents)} threshold. The tips and overtime deductions are shrinking.`
    : `Your MAGI of ${usd(magiCents)} is ${usd(distanceToThresholdCents)} below the ${usd(thresholdCents)} threshold. Both deductions apply in full.`;

  return (
    <section aria-labelledby="phase-out-meter" className="w-full min-w-0">
      <h3 id="phase-out-meter" style={{ fontSize: "var(--text-step-0)" }}>
        Phase-out meter — tips and overtime, {joint ? "joint" : "single"} threshold{" "}
        <span className="num">{usd(thresholdCents)}</span>
      </h3>

      <p
        className={`mt-1 ${over ? "flex items-baseline gap-1.5 text-flag" : "text-dim"}`}
        style={{
          fontSize: "var(--text-step--1)",
          fontWeight: over ? 500 : 400,
          maxWidth: "var(--measure)",
        }}
      >
        {/* Icon AND word, the same pair the paystub uses for the same fact. */}
        {over ? <LeakMark /> : null}
        <span>
          {over ? <span className="micro-label text-flag">Money left behind — </span> : null}
          {sentence}
        </span>
      </p>

      <div
        aria-hidden="true"
        className="rounded-atlas hairline-all relative mt-3 w-full overflow-hidden"
        style={{ height: "22px", borderRadius: "var(--radius-atlas)" }}
      >
        <div className="flex h-full w-full">
          <div
            style={{
              width: `${thresholdPct}%`,
              background: "color-mix(in srgb, var(--signal) 12%, var(--paper))",
            }}
          />
          {/* The phase-out zone goes amber only once this household is IN it.
              Amber marks money actually being left behind; a band the reader is
              nowhere near is decoration, and decoration is what makes the
              colour stop meaning anything. */}
          <div
            style={{
              flex: 1,
              background: over
                ? "color-mix(in srgb, var(--flag) 12%, var(--paper))"
                : "color-mix(in srgb, var(--ink) 6%, var(--paper))",
            }}
          />
        </div>
        {/* the threshold itself */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${thresholdPct}%`,
            width: "1px",
            background: over ? "var(--flag)" : "var(--dim)",
          }}
        />
        {/* this household */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: `clamp(0px, ${magiPct}%, 100%)`,
            width: "3px",
            marginLeft: "-1.5px",
            background: "var(--ink)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="num mt-1 flex justify-between gap-2 text-dim"
        style={{ fontSize: "var(--text-step--2)" }}
      >
        <span>$0</span>
        <span>{usd(thresholdCents)}</span>
        <span>{usd(furthest)}</span>
      </div>
      <div
        aria-hidden="true"
        className="micro-label flex justify-between gap-2"
        style={{ textTransform: "none", letterSpacing: 0 }}
      >
        {/* The axis labels stay in --dim at every state. Amber on the word
            "threshold" was the one place in the portfolio where the flag
            colour carried no icon and named no fact — it labelled a tick on a
            scale. The three cues that DO say "you are over" are the amber
            band, the marker's position in it, and the sentence above stating
            the distance in dollars; a fourth, weaker one only dilutes them. */}
        <span>full deductions</span>
        <span>threshold</span>
        <span>fully phased out</span>
      </div>

      {/* Every signature visual ships a screen-reader table equivalent. */}
      <table className="sr-only-table">
        <caption>Household MAGI against the tips and overtime phase-out</caption>
        <tbody>
          <tr>
            <th scope="row">Your MAGI</th>
            <td>{usd(magiCents)}</td>
          </tr>
          <tr>
            <th scope="row">Phase-out threshold</th>
            <td>{usd(thresholdCents)}</td>
          </tr>
          <tr>
            <th scope="row">{over ? "Amount over threshold" : "Room before the threshold"}</th>
            <td>{usd(Math.abs(distanceToThresholdCents))}</td>
          </tr>
          <tr>
            <th scope="row">Fully phased out at</th>
            <td>{usd(furthest)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
