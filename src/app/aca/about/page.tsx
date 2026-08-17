import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/aca/about" },
  title: "About the ACA Cliff Planner — Independent, Cited",
  description:
    "Who builds the subsidy cliff planner, what it refuses to do, and the credentialed review it will not launch without. No insurance sales, ever.",
};

export default function AboutPage() {
  return (
    <article className="density-reading mx-auto px-4 py-10">
      <h1>About the ACA cliff planner</h1>
      <p className="text-ink">
        Bracketsight is a planning tool for the households the{" "}
        <span className="num">2026</span> ACA subsidy cliff actually hits:
        self-employed people, early retirees, and gig workers whose income sits
        near <span className="num">400%</span> of the federal poverty line.
        Other calculators tell you the number. Bracketsight tells you the move —
        how far you are from the edge, what crossing costs, and which legal
        levers pull you back, ranked by dollars recovered per dollar committed.
      </p>

      <section className="space-y-2">
        <h2>What does this engine decide that a premium calculator does not?</h2>
        <p className="text-ink">
          A calculator answers &ldquo;what is my credit at this income.&rdquo;
          This engine answers &ldquo;how far can my income move before the
          credit disappears, and which legal moves pull it back.&rdquo; For{" "}
          <span className="num">2026</span> the premium tax credit ends at a
          hard edge rather than tapering: Rev. Proc. <span className="num">2025-25</span>{" "}
          §<span className="num">3.01</span> publishes an applicable-percentage
          table whose top row reads &ldquo;at least <span className="num">300%</span>{" "}
          but not more than <span className="num">400%</span>,&rdquo; and there
          is no row above it. A table that terminates is a table with a cliff,
          so the useful output is a distance and a ranked set of levers, not a
          monthly figure.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Where exactly does the cliff fall?</h2>
        <p className="text-ink">
          At exactly <span className="num">4.0</span> × the federal poverty line
          for your family size, and not a dollar higher. Form{" "}
          <span className="num">8962</span> Worksheet <span className="num">2</span>{" "}
          asks first whether household income is more than{" "}
          <span className="num">4.0</span> × FPL; if it is, you enter{" "}
          <span className="num">401</span> on line <span className="num">5</span>{" "}
          and line <span className="num">6</span> tells you that you are not
          eligible. Truncation to a whole percent is reached only in the
          &ldquo;no&rdquo; branch, so <span className="num">400.9%</span> is{" "}
          <span className="num">401</span>, not <span className="num">400</span>.
          Applying the <span className="num">2025</span> HHS poverty guidelines
          that govern <span className="num">2026</span> coverage —{" "}
          <span className="num">$15,650</span> for one person in the contiguous{" "}
          <span className="num">48</span> states and DC, plus{" "}
          <span className="num">$5,500</span> for each additional person, at{" "}
          <span className="num">90</span> Fed. Reg. <span className="num">5917</span>{" "}
          — the last eligible income is <span className="num">$62,600</span> for
          a single filer and <span className="num">$128,600</span> for a family
          of four. Both are engine output pinned by tests, not typed into a page.
        </p>
      </section>

      <section className="space-y-2">
        <h2>Which rules does the engine encode?</h2>
        <p className="text-ink">
          The IRC §<span className="num">36B</span> credit and its six
          applicable-percentage bands; the cost-sharing reduction ledges of{" "}
          <span className="num">94%</span>, <span className="num">87%</span> and{" "}
          <span className="num">73%</span> actuarial value from{" "}
          <span className="num">42</span> U.S.C. §<span className="num">18071</span>(c)(2);
          Medicaid expansion status for all <span className="num">51</span>{" "}
          jurisdictions; the <span className="num">2026</span> retirement and
          HSA contribution limits; and the reconciliation rule. It also encodes
          a repeal: Pub. L. <span className="num">119-21</span> §<span className="num">71305</span>{" "}
          struck IRC §<span className="num">36B</span>(f)(2)(B) for tax years
          beginning after <span className="num">31 December 2025</span>, so for{" "}
          <span className="num">2026</span> there is no cap on repaying excess
          advance credit at any income. A household at{" "}
          <span className="num">250%</span> of the poverty line repays every
          excess dollar. Each of those figures traces to a primary source on{" "}
          <Link href="/aca/sources" className="underline underline-offset-4">
            /sources
          </Link>
          , with its verification date, and each formula is set out on{" "}
          <Link href="/aca/methodology" className="underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2>Which rules does it deliberately leave out?</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>The age <span className="num">60</span>–<span className="num">63</span> catch-up.</strong>{" "}
            IRC §<span className="num">414</span>(v)(2)(E)(i) allows{" "}
            <span className="num">$11,250</span> for{" "}
            <span className="num">2026</span> instead of the{" "}
            <span className="num">$8,000</span> age-<span className="num">50</span>{" "}
            catch-up, confirmed in IRS Notice <span className="num">2025-67</span>.
            It is not modelled, which understates the room available to exactly
            the pre-Medicare enrollees most likely to be near the cliff.
          </li>
          <li>
            <strong>The HDHP eligibility gate.</strong> The engine offers the
            HSA lever without checking the <span className="num">2026</span>{" "}
            high-deductible plan definition (minimum deductible{" "}
            <span className="num">$1,700</span> self-only /{" "}
            <span className="num">$3,400</span> family; out-of-pocket maximum{" "}
            <span className="num">$8,500</span> / <span className="num">$17,000</span>).
            Confirm your plan qualifies before you contribute.
          </li>
          <li>
            <strong>Income timing.</strong> It is listed advisory-only and never
            carries a computed recommendation, because shifting income across
            tax years changes more than a subsidy.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>What is real data today, and what is placeholder?</h2>
        <p className="text-ink">
          Benchmark premiums are the placeholder. The six counties in the sample
          file — Travis TX, Los Angeles CA, Cook IL, Maricopa AZ, Miami-Dade FL
          and Denver CO — carry invented age-<span className="num">21</span> base
          premiums, written so the engine and interface could be built and
          tested. There is nothing in them to verify; they must be replaced from
          the CMS Marketplace public use files for plan year{" "}
          <span className="num">2026</span>. Any dollar figure that depends on a
          premium is therefore illustrative, and the sample-data labelling stays
          until real premiums land.
        </p>
        <p className="text-ink">
          The age-rating curve beside them is real and was checked exactly: all{" "}
          <span className="num">65</span> factors match Appendix I of CMS&apos;s{" "}
          <span className="num">2016</span> age-curve guidance with zero
          mismatches, and <span className="num">45</span> C.F.R. §<span className="num">147.102</span>{" "}
          caps age variation at <span className="num">3:1</span>. That curve is
          only a federal default: CMS&apos;s state-variation table, stamped{" "}
          <span className="num">December 2021</span>, shows New York and Vermont
          with no age rating at all. The <span className="num">2026</span> Form{" "}
          <span className="num">8962</span> is also unpublished until roughly{" "}
          <span className="num">January 2027</span>, so the cliff convention
          above rests on the <span className="num">2025</span> and{" "}
          <span className="num">2020</span> editions, which agree word for word.
        </p>
      </section>

      <section className="space-y-2">
        <h2>How should you use this, and how should you not?</h2>
        <p className="text-ink">
          Use it to see how far your household sits from the edge and to compare
          levers while the tax year is still open — that comparison is the
          product. Do not use it as a filing position or as a premium quote:
          confirm your benchmark premium with the marketplace and confirm any
          contribution or deduction with a tax professional before you act. No
          enrolled agent or CPA has reviewed this section. That review is a
          launch gate and it has not happened yet.
        </p>
      </section>

      <section className="space-y-2">
        <h2>The promises</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Deterministic math.</strong> Every figure comes from an
            open, tested formula — no AI computes anything. See{" "}
            <Link href="/aca/methodology" className="underline underline-offset-4">
              methodology
            </Link>
            .
          </li>
          <li>
            <strong>Cited rules.</strong> Every threshold traces to a primary
            source on{" "}
            <Link href="/aca/sources" className="underline underline-offset-4">
              /sources
            </Link>
            , with its verification date.
          </li>
          <li>
            <strong>Your data stays yours.</strong> Everything runs in your
            browser; nothing is uploaded, stored server-side, or tied to an
            account.
          </li>
          <li>
            <strong>No insurance sales.</strong> Bracketsight never recommends a
            specific plan and earns nothing from enrollment.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>Status</h2>
        <p className="text-ink">
          This is a pre-launch build. Benchmark premiums are sample data, a
          handful of <span className="num">2026</span> indexed figures await
          verification against their primary sources, and the named EA/CPA
          reviewer will appear on the{" "}
          <Link href="/aca/editorial-policy" className="underline underline-offset-4">
            editorial policy
          </Link>{" "}
          page before launch. The{" "}
          <Link href="/aca/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          tracks every rules change, including the pending enhanced-credit
          restoration bill.
        </p>
      </section>
    </article>
  );
}
