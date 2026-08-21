import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/trades/about" },
  title: "About the Trades Document Engine — Free, State-Aware",
  description:
    "Why a free estimate, invoice and contract engine exists for solo and small-crew contractors: no signup, state-aware clauses, every number traceable.",
};

export default function AboutPage() {
  return (
    <article className="density-reading mx-auto px-4 py-6">
      <h1>About the trades document engine</h1>
      <p>
        Bracketsight exists because solo and small-crew contractors quote jobs in text
        messages, underprice from guesswork, and sign contracts missing clauses their state
        requires. Field-service software solves this for $50–200 a month behind a signup
        wall; template sites hand out state-blind Word files. Bracketsight is the gap: free, no
        signup, state-aware — and it helps with the pricing, not just the paper.
      </p>
      <p>
        Quote it right. Paper it right. Get paid. The estimate you build on the takeoff
        sheet is the document your customer receives; the invoice matches it to the cent;
        the contract carries the clauses your state requires, each with its statute.
      </p>

      <h2>What does this engine decide?</h2>
      <p>
        Two things, and neither is a single number. First, what a job should cost: each job
        breaks into assemblies with a quantity formula, a waste factor, a material cost and
        a labor-hours figure, and the answer comes back as a band rather than a point — a
        deck quotes from <span className="num">10%</span> below the computed total to{" "}
        <span className="num">18%</span> above it. Second, which clauses the contract legally
        needs for the state the work is in, selected by evaluating a trigger expression
        against the job facts. A clause is either triggered by the facts or it is not; the
        engine throws on any trigger it does not recognise rather than guessing what was
        meant. The whole calculation path is dependency-free TypeScript with no AI and no
        network access, and every rule lives in a dated, cited JSON file listed on{" "}
        <Link href="/trades/sources" className="underline underline-offset-4">
          sources
        </Link>
        .
      </p>

      <h2>Why does it refuse to write a contract in four of five states?</h2>
      <p>
        Because four of the five launch states prescribe the exact wording of at least one
        notice, and that wording has not been transcribed from the statute. Nine such notices
        are outstanding — <span className="num">four</span> in California,{" "}
        <span className="num">three</span> in Texas, <span className="num">one</span> in
        Florida and <span className="num">one</span> in New York — so California, Texas,
        Florida and New York generate no contract at all. A paraphrase of prescribed wording
        is not a weaker clause; it is a non-compliant contract, and in several of these states
        the consequences run to lien invalidity, unenforceability, or a statutory cause of
        action for the homeowner. An empty field is recoverable. A plausible-looking notice
        that does not match the statute gets signed.
      </p>
      <p>
        The block is state-scoped rather than job-scoped on purpose: a state with any
        untranscribed required clause produces nothing at any job size, even for a job whose
        facts would not trigger that clause. A rule that only blocks the jobs it happens to
        fire on invites the workaround &ldquo;make the job smaller.&rdquo; Transcription
        alone will not unblock everything either. California and Texas prescribe minimum type
        sizes of <span className="num">12</span> and <span className="num">10</span> points in
        boldface, Florida requires the notice on the front page or a separate page signed and
        dated by the owner, and Texas requires a cancellation form in duplicate and easily
        detachable. Nothing downstream can render any of that yet.
      </p>

      <h2>Which state is live, and on what authority?</h2>
      <p>
        Pennsylvania — the one launch state where no provision prescribes wording, so its
        clauses may be drafted. It carries the <span className="num">$500</span> home
        improvement threshold from the definition at{" "}
        <span className="num">73</span> P.S. §<span className="num">517.2</span>, the
        three-business-day right of rescission at §<span className="num">517.7</span>(b), the
        deposit cap that applies to contracts over <span className="num">$5,000</span> —
        one-third of the price plus the cost of special-order materials, at
        §<span className="num">517.9</span> — and the registration number required among the
        contract contents at §<span className="num">517.7</span>(a)(1). Be aware of the
        weakness: Pennsylvania&apos;s statutory text could not be read from a state host, so
        every Pennsylvania rule rests on a secondary source until it is re-confirmed against
        the General Assembly&apos;s own text.
      </p>

      <h2>How honest is the pricing?</h2>
      <p>
        Every dollar figure is modelled, not measured. Base labor rates of{" "}
        <span className="num">$62</span> an hour for carpentry,{" "}
        <span className="num">$55</span> for painting and{" "}
        <span className="num">$68</span> for blended remodel trades are placeholders, as are
        every unit cost, labor-hour figure, waste factor and access multiplier. The regional
        multipliers run from <span className="num">90%</span> to{" "}
        <span className="num">125%</span> and are currently identical across all three trades,
        which is itself a tell that they are modelled: real regional cost spread differs by
        trade. The citation on those files points at a reserved domain that will never
        resolve, and each ruleset carries a <span className="num">120</span>-day staleness
        window from its <span className="num">1 August 2026</span> effective date, after
        which it flags every estimate it produces. A real basis means licensed cost data plus
        federal wage statistics — and even
        then those statistics report employee wages, not billable contractor rates, so the gap
        between them has to be documented rather than buried. Details are on{" "}
        <Link href="/trades/pricing-methodology" className="underline underline-offset-4">
          pricing methodology
        </Link>
        .
      </p>

      <h2>How should you use it?</h2>
      <p>
        Use the estimate to structure a quote and to see where the money in a job actually
        sits — not as a price to hand a customer unchecked. Every figure is an estimate, never
        a binding quote, and your own material prices and crew hours should override ours.
        Use the contract clause list as a checklist to take to a lawyer in your state, not as
        a signed document. No construction attorney has reviewed the clause language and no
        working contractors have checked the pricing; both reviews are launch gates, and
        neither has happened. Both flags are described in the{" "}
        <Link href="/trades/editorial-policy" className="underline underline-offset-4">
          editorial policy
        </Link>
        , and a named, credentialed reviewer will be published here before either comes off.
      </p>

      <h2>Privacy</h2>
      <p>
        v1 stores nothing on a server. Your estimates and job facts live in your
        browser&apos;s local storage and nowhere else. No accounts, no tracking of your job
        data.
      </p>
    </article>
  );
}
