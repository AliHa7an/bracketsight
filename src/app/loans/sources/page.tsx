import type { Metadata } from "next";
import Link from "next/link";
import { listRuleCitations } from "@/engines/repayment";

export const metadata: Metadata = {
  title: "Student Loan Rule Sources — Every Citation Dated",
  description:
    "The primary sources behind every rate, bracket, and threshold in the student loan repayment engine, with the date each was last verified.",
  alternates: { canonical: "/loans/sources" },
};

export default function SourcesPage() {
  const groups = listRuleCitations(new Date().toISOString().slice(0, 10));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 text-[0.98rem] leading-relaxed">
      <header>
        <h1 className="leading-tight">Sources</h1>
        <p className="text-dim mt-1">
          Every parameter in the engine lives in a versioned rule file citing a primary source
          — regulation, statute, or agency guidance, never a blog. This table renders directly
          from those files, so it cannot drift from what the engine actually computes.
        </p>
      </header>

      <div className="overflow-x-auto border border-rule rounded-atlas bg-white">
        <table className="w-full text-[0.9rem] border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-rule text-left text-[0.75rem] uppercase tracking-wide text-dim">
              <th scope="col" className="px-3 py-2 font-medium">Rule set</th>
              <th scope="col" className="px-3 py-2 font-medium">Primary sources</th>
              <th scope="col" className="px-3 py-2 font-medium">Last verified</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) =>
              g.citations.map((c, i) => (
                <tr key={`${g.ruleSet}-${c.label}`} className="border-b border-rule align-top">
                  {i === 0 && (
                    <th
                      scope="rowgroup"
                      rowSpan={g.citations.length}
                      className="px-3 py-2.5 text-left font-data font-normal"
                    >
                      {g.ruleSet}
                    </th>
                  )}
                  <td className="px-3 py-2.5">
                    <a href={c.url} rel="noopener noreferrer" className="underline underline-offset-4 hover:text-signal">
                      {c.label}
                    </a>
                    {/* A Federal Register cite is an identifier, and the system
                        puts codes and IDs in the data face alongside numbers. */}
                    {c.fedRegCite ? (
                      <span className="text-dim">
                        {" · "}
                        <span className="num">{c.fedRegCite}</span>
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 font-data">{c.lastVerified}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      <p>
        Figures we have encoded from the product specification but not yet re-verified against
        a live primary source — the 2026 HHS poverty guidelines, the exact Tiered Standard
        brackets, and the RAP bracket behaviour at exact $10,000 multiples — are flagged in
        the rule files themselves and tracked for verification before launch. How we correct
        errors is covered in the{" "}
        <Link href="/loans/editorial-policy" className="underline underline-offset-4">
          editorial policy
        </Link>
        ; rule changes appear in the{" "}
        <Link href="/loans/changelog" className="underline underline-offset-4">
          changelog
        </Link>{" "}
        within 48 hours.
      </p>
    </div>
  );
}
