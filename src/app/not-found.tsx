import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, SECTIONS, sectionHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * The 404.
 *
 * Next's built-in not-found renders inside the root layout, so the header,
 * footer and every trust link are already present — but its body is six words,
 * which for a crawler that lands on a stale URL is a dead end. This one names
 * the five tools and the way back, which is both the useful thing for a reader
 * and the thing that keeps a mistyped link from wasting the crawl.
 *
 * `noindex, follow`: never index the error page, but do follow the links out
 * of it.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="micro-label">Error 404</p>

      <h1 className="mt-2 max-w-[22ch]">That page is not here</h1>

      <p className="mt-4 max-w-[68ch] text-step-1 text-dim">
        The address is wrong, or the page moved. Nothing was lost — no tool on this site stores
        anything, so there is no saved work behind a broken link. Pick the tool you were after:
      </p>

      <ul className="mt-6 max-w-[68ch] list-disc space-y-2 pl-5 text-dim">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <Link
              href={sectionHref(section)}
              className="rounded-atlas text-ink underline underline-offset-4"
            >
              {section.name}
            </Link>{" "}
            — {section.tagline}
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-[68ch] text-dim">
        If you followed a link from somewhere else and it broke, tell us where it was:{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="num rounded-atlas text-ink underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>
        . Otherwise, start from the{" "}
        <Link href="/" className="rounded-atlas text-ink underline underline-offset-4">
          five tools
        </Link>{" "}
        or read{" "}
        <Link href="/about" className="rounded-atlas text-ink underline underline-offset-4">
          how the rules behind them are verified
        </Link>
        .
      </p>
    </div>
  );
}
