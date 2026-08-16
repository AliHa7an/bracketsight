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
      <h1>About Fineprint</h1>
      <p className="text-ink">
        Fineprint is a planning tool for the households the 2026 ACA subsidy
        cliff actually hits: self-employed people, early retirees, and gig
        workers whose income sits near 400% of the federal poverty line. Other
        calculators tell you the number. Fineprint tells you the move — how
        far you are from the edge, what crossing costs, and which legal levers
        pull you back, ranked by dollars recovered per dollar committed.
      </p>
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
            <strong>No insurance sales.</strong> Fineprint never recommends a
            specific plan and earns nothing from enrollment.
          </li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2>Status</h2>
        <p className="text-ink">
          This is a pre-launch build. Benchmark premiums are sample data, a
          handful of 2026 indexed figures await verification against their
          primary sources, and the named EA/CPA reviewer will appear on the{" "}
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
