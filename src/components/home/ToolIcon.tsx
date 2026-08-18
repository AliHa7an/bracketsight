import type { SectionSlug } from "@/lib/site";

/**
 * Five hand-drawn marks, one per tool. No icon library, no emoji, no clip art.
 *
 * Each is the tool's own argument in 40 units, drawn twice: a soft 3.4-width
 * underlay at 22% and a crisp 1.7-width line a hair out of register with it, so
 * the mark reads as something that was drawn rather than something that was
 * downloaded. Both strokes are `currentColor`, and the card sets that to its
 * section's `--signal`, so a mark re-themes with its card and works in either
 * theme with no second copy.
 *
 * They are decorative — the question beside each one already says what the tool
 * does — so every one is `aria-hidden`.
 *
 *   loans     a fork in a road: one way in, two ways out, and only one of the
 *             two can be walked back. RAP is the door that does not reopen.
 *   paycheck  a pay stub with one line singled out: the deduction that is
 *             either on your W-2 or is not.
 *   aca       the cliff itself: a gentle taper, then a vertical drop to a
 *             baseline. The only mark here that is a plot of its own subject.
 *   property  a plat: the parcel you own, and the neighbouring assessment your
 *             case is measured against.
 *   trades    a framing square over a measured run — a takeoff, which is what
 *             an estimate actually is before it is a price.
 */

const PATHS: Record<SectionSlug, { soft: string; line: string; dot?: [number, number] }> = {
  loans: {
    soft: "M20.5 37V22.5M20.5 22.5C20 16 16.5 12 8.5 9.5M20.5 22.5c.5-6.5 4.5-10.5 12-13",
    line: "M20 36.5V22M20 22c-.6-6.2-4-10-11.5-12.6M20 22c.4-6.3 4.2-10.2 11.5-12.8",
    dot: [32, 8.6],
  },
  paycheck: {
    soft: "M6.5 8.5h27v23h-27zM11 15.5h11M11 21h17M11 26.5h8",
    line: "M6 8h27v23H6zM10.5 15h11M10.5 20.5h17M10.5 26h8",
    dot: [30.5, 26],
  },
  aca: {
    soft: "M5.5 12.5c6 .5 10.5 3.5 15 9.5M20.5 22v11.5M20.5 33.5h14",
    line: "M5 12c6.2.6 10.8 3.7 15 9.8M20 21.8V33M20 33h14.5",
    dot: [20, 21.8],
  },
  property: {
    soft: "M5.5 30.5V13l9-5.5 9 5.5v17.5zM24 20.5h11v10H24",
    line: "M5 30V12.5L14 7l9 5.5V30zM23.5 20h11.5v10H23.5",
    dot: [14, 19],
  },
  trades: {
    soft: "M6.5 6.5v27h27M6.5 33.5 33 7M13 33.5v-4M20 33.5v-4M27 33.5v-4",
    line: "M6 6v27.5h27.5M6 33.5 33.5 6.5M12.5 33.5v-4.5M19.5 33.5v-4.5M26.5 33.5v-4.5",
  },
};

export function ToolIcon({ slug, size = 40 }: { slug: SectionSlug; size?: number }) {
  const mark = PATHS[slug];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={mark.soft}
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={mark.line}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {mark.dot ? <circle cx={mark.dot[0]} cy={mark.dot[1]} r="2.6" fill="currentColor" /> : null}
    </svg>
  );
}

/**
 * The four trust marks. Same drawing rules, one register smaller (28 units),
 * and they sit on the ink band so they take `--panel-teal` from the card.
 *
 *   cited          a document with a link stroke leaving it — the citation.
 *   no-ai          an equals sign in a box: arithmetic, closed, with nothing
 *                  entering it from outside.
 *   nothing-stored a browser window with the wire out of it cut.
 *   estimates      a bracket around a range, with the edge marked.
 */
const CLAIM_PATHS: Record<string, string> = {
  cited: "M6 3.5h11l5 5v16H6zM17 3.5V9h5M10 14h8M10 18.5h8",
  "no-ai": "M3.5 3.5h21v21h-21zM9 11h10M9 17h10",
  "nothing-stored": "M3.5 5.5h21v17h-21zM3.5 10.5h21M6.5 22.5l15-17",
  estimates: "M8 4.5H4.5v19H8M20 4.5h3.5v19H20M14 8v12M11 8h6M11 20h6",
};

export function ClaimIcon({ id, size = 26 }: { id: string; size?: number }) {
  const d = CLAIM_PATHS[id];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
