import { formatDate } from "@/components/ui/format";
import { UNREVIEWED } from "@/lib/content/schema";

/**
 * LastReviewed — who stands behind this page, and when they last looked.
 *
 * Driven entirely by frontmatter. `updatedAt` is the review date, and it moves
 * when the page changed, never to look fresh: a date that advances while the
 * content sits still is detected by readers and by search engines, and costs
 * more than the staleness it was hiding.
 *
 * The reviewer line is the part that has to stay honest. `src/lib/site.ts`
 * types the site maintainer as `Maintainer | null` and refuses to fill it with
 * a plausible-looking placeholder, because a fabricated name on a YMYL finance
 * page is worse than an empty field. The same rule applies here: an article
 * may ship unreviewed, and it says so in plain words when it has, but it never
 * prints a reviewer who did not review it. `reviewedBy: UNREVIEWED` renders
 * the disclosure below and suppresses the `reviewedBy` property in the Article
 * JSON-LD entirely — see `src/app/guides/[slug]/page.tsx`.
 */

export interface LastReviewedProps {
  publishedAt: string;
  updatedAt: string;
  author: string;
  reviewedBy: string;
}

export function LastReviewed({ publishedAt, updatedAt, author, reviewedBy }: LastReviewedProps) {
  const reviewed = reviewedBy !== UNREVIEWED;

  return (
    <div className="hairline-t hairline-b py-3">
      <p
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-dim"
        style={{ fontSize: "var(--text-step--1)", margin: 0 }}
      >
        <span>
          Last reviewed{" "}
          <time className="num text-ink" dateTime={updatedAt}>
            {formatDate(updatedAt)}
          </time>
        </span>

        <Separator />

        <span>
          Published{" "}
          <time className="num" dateTime={publishedAt}>
            {formatDate(publishedAt)}
          </time>
        </span>

        <Separator />

        <span>
          Written by <span className="text-ink">{author}</span>
        </span>

        {reviewed ? (
          <>
            <Separator />
            <span>
              Reviewed by <span className="text-ink">{reviewedBy}</span>
            </span>
          </>
        ) : null}
      </p>

      {reviewed ? null : (
        <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)", margin: "8px 0 0" }}>
          No named reviewer has checked this page. Every figure on it is read from a cited rule
          file and every source is linked, so you can check it yourself — but a second pair of
          eyes has not been over the reasoning.
        </p>
      )}
    </div>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className="text-rule">
      ·
    </span>
  );
}
