import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Student Loan Rule Changelog — Dated and Cited",
  description:
    "Dated record of every rule change, verification and correction in the federal repayment engine, each entry carrying its own primary citation.",
  alternates: { canonical: "/loans/changelog" },
};

interface Entry {
  date: string;
  title: string;
  body: React.ReactNode;
}

const entries: Entry[] = [
  {
    date: "2026-08-08",
    title: "Initial rule set encoded — RAP era, v1 engine",
    body: (
      <>
        <p>
          Engine v1.0.0 ships with rule sets{" "}
          <span className="font-data">rap-2026-07-01</span>,{" "}
          <span className="font-data">plan-terms-2026-07-01</span>,{" "}
          <span className="font-data">tiered-standard-2026-07-01</span>,{" "}
          <span className="font-data">poverty-guidelines-2026</span>, and{" "}
          <span className="font-data">tax-2026</span>. RAP encoded from 34 C.F.R. § 685.209 as
          amended by the RISE final rule (91 Fed. Reg. 23768), cross-checked against CRS
          IF13075, with all eight published worked examples encoded as golden tests. PAYE/ICR
          sunset (1 Jul 2028) and the post-1 Jul 2026 plan restriction encoded from P.L.
          119-21.
        </p>
        <p className="mt-2">
          Awaiting verification against live primary sources: 2026 HHS poverty guidelines
          (2025 values carried forward), exact Tiered Standard brackets, and RAP bracket
          behaviour at exact $10,000 multiples. Each is flagged in its rule file and on the{" "}
          <Link href="/loans/sources" className="underline underline-offset-4">sources page</Link>.
        </p>
      </>
    ),
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">Changelog</h1>
        <p className="text-dim mt-1">
          Repayment rules change — repeatedly, through 2028. Every change lands here within 48
          hours, dated and cited, and every affected page updates from the same rule files.
        </p>
      </header>
      <ol className="space-y-6">
        {entries.map((e) => (
          <li key={e.date + e.title} className="border border-rule rounded-atlas bg-white p-4">
            <h2>
              <time dateTime={e.date} className="font-data text-[0.85rem] text-dim block">
                {e.date}
              </time>
              {e.title}
            </h2>
            <div className="mt-2">{e.body}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
