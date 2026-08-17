import { formatDate } from "@/components/ui/format";
import type { ArticleSource } from "@/lib/content/schema";

/**
 * Sources — the article's primary sources, each with the day it was last read.
 *
 * Rendered from frontmatter, so the list on the page and the list a reviewer
 * checks are the same list. The schema already refuses anything that is not
 * https, and refuses a `lastVerified` later than the article's own
 * `updatedAt` — re-verifying a source is a change to the article, and an
 * article claiming a source was checked after the article was last touched is
 * describing something that did not happen.
 *
 * The date is the useful part. "Cited" tells a reader the claim came from
 * somewhere; "read on 15 Aug 2026" tells them how stale the reading might be,
 * which on a site about rules that change annually is the whole question.
 */

export interface SourcesProps {
  sources: readonly ArticleSource[];
  heading?: string;
}

export function Sources({ sources, heading = "Sources" }: SourcesProps) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="sources" className="my-8">
      <h2 id="sources">{heading}</h2>

      <ol className="mt-4 list-none space-y-3 p-0">
        {sources.map((source, index) => (
          <li key={source.url} className="flex gap-3">
            <span className="num shrink-0 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              {index + 1}.
            </span>
            <span>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
              >
                {source.label}
              </a>
              <span className="block text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                Last read{" "}
                <time className="num" dateTime={source.lastVerified}>
                  {formatDate(source.lastVerified)}
                </time>
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
