/**
 * THE PLACEMENT MAP — encoded, not documented.
 *
 * Every position on this site where an advertisement may appear is in the
 * `AD_PLACEMENTS` table below, and a position that is not in the table cannot
 * be rendered: `<AdPlacement>` takes a placement id, not a height, so there is
 * no way to put a slot somewhere by passing different props. A prose map in a
 * markdown file drifts from the code within a month. This one cannot, because
 * it IS the code, and the invariants at the foot of this file are asserted at
 * module load — a placement that breaks one fails the build.
 *
 * MONETISATION.md renders the same table for a human reader, with the
 * reasoning. If the two ever disagree, this file is right.
 *
 * ── The five rules the map obeys ───────────────────────────────────────────
 *
 * 1. NEVER INSIDE OR OVERLAPPING THE INPUT → RESULT FLOW.
 *    A reader must never have an ad between the field they are editing and the
 *    number that changes. This is the "disguised ads" policy risk (an ad
 *    inside a calculator panel reads as part of the computed answer) and it is
 *    also just the product working: the whole engagement thesis of these tools
 *    is that the answer moves faster than you can type, and an ad in that gap
 *    breaks the causal link the design exists to make legible.
 *
 *    Enforced twice. Structurally: `ToolShell` wraps the workbench in
 *    `<ToolBoundary>`, and an `AdSlot` inside one throws in development
 *    (see AdSlot.tsx). Declaratively: no placement in this table may name
 *    `tool-input` or `tool-output` as a neighbour, and `assertPlacementMap()`
 *    below rejects one that does.
 *
 * 2. BELOW THE FOLD ON TOOL PAGES, AFTER THE ANSWER AND ITS TRACE.
 *    Never above. The masthead and the workbench occupy the first screen and
 *    then some on every viewport the site is designed for; both tool
 *    placements sit after the closing edge of the workbench.
 *
 * 3. IN-ARTICLE SLOTS ON GUIDES ONLY AFTER THE FIRST H2, AND NEVER ADJACENT
 *    TO THE FAQ OR SOURCES BLOCKS. `article-mid` is placed at the END of the
 *    first section — immediately before the second H2 — so it is after the
 *    first H2 by construction, and it is refused entirely on an article with
 *    too few sections to leave room below it (see `article.tsx`).
 *
 * 4. NEVER ON /contact, /privacy, /terms OR THE CONSENT SURFACES.
 *    `adsPermittedOn()` is the denylist, and `<AdPlacement>` calls it on every
 *    render: a slot that finds itself on a denied path throws in development
 *    and renders nothing in production. The banner and the gate carry no
 *    placement at all — an ad on the page that asks permission to serve ads is
 *    self-refuting.
 *
 * 5. NEVER ADJACENT TO A `--flag` WARNING. Oxide red marks a decision the
 *    reader cannot undo. An ad beside "switching to RAP forfeits your payment
 *    credit permanently" or "this deadline is in nine days" is the worst
 *    adjacency on the site — it puts a commercial message in the same visual
 *    breath as an irreversible one, and it is the placement a policy reviewer
 *    would screenshot. `flag-warning` is a forbidden neighbour.
 *
 * ── What the neighbour declarations are for ────────────────────────────────
 * Rules 1, 3 and 5 are all statements about what sits immediately above and
 * below a slot, which is exactly the thing a prose map cannot check. So every
 * placement declares its own neighbours, and the assertion rejects any that
 * names a forbidden one. The declaration is a claim about the wiring, and
 * `wiredIn` names the file where that claim can be checked in one read.
 */

/* ─────────────────────────────────────────────────────────────── page types */

export const AD_PAGE_TYPES = [
  /** `/` — the hub. */
  "hub",
  /** The five instruments: /loans /paycheck /aca /property /trades. */
  "tool",
  /** `/guides/[slug]` — a written guide. */
  "article",
  /** A list page: /guides, /glossary, /paycheck/occupations. */
  "index",
  /** A programmatic reference page: a county, a state's contract rules. */
  "reference",
  /** Methodology, sources, changelog, editorial policy, about, authors. */
  "trust",
  /** Privacy, terms, contact, and the consent surfaces. */
  "policy",
] as const;

export type AdPageType = (typeof AD_PAGE_TYPES)[number];

/**
 * Page types that carry no placement, ever, and the reason.
 *
 * TRUST pages are a deliberate refusal rather than an oversight. A methodology
 * page, a sources ledger and a changelog are the evidence the rest of the site
 * rests on; they are what a reviewer reads to decide whether this is a
 * publication or a landing page. Selling space beside a citation table
 * discounts the one asset the site has. They are also short-dwell pages a
 * reader arrives at to check one fact, which is the worst inventory on the
 * site anyway — so the principled answer and the commercial answer agree.
 *
 * POLICY pages are non-negotiable: /privacy, /terms, /contact and anything the
 * consent flow renders.
 */
export const AD_FREE_PAGE_TYPES: readonly AdPageType[] = ["trust", "policy"];

/* ────────────────────────────────────────────────────────────── neighbours */

/**
 * The things that can sit immediately above or below a slot. Naming them is
 * what makes rules 1, 3 and 5 checkable instead of aspirational.
 */
export const AD_NEIGHBOURS = [
  "page-masthead",
  "tool-input",
  "tool-output",
  "tool-workbench-edge",
  "reading-band",
  "reading-band-edge",
  "section-footer",
  "article-heading",
  "article-body",
  "article-kicker",
  "faq",
  "sources",
  "related-articles",
  "flag-warning",
  "index-list",
  "reference-body",
  "hub-colophon",
  "policy-body",
  "consent-surface",
  "site-footer",
  "page-start",
  "page-end",
] as const;

export type AdNeighbour = (typeof AD_NEIGHBOURS)[number];

/**
 * A slot may not touch any of these. Each entry is one of the five rules.
 *
 *   tool-input / tool-output  → rule 1, the input→result flow
 *   flag-warning              → rule 5, irreversible-decision adjacency
 *   faq / sources             → rule 3, an ad must not frame the evidence
 *   policy-body               → rule 4
 *   consent-surface           → rule 4
 */
export const FORBIDDEN_NEIGHBOURS: readonly AdNeighbour[] = [
  "tool-input",
  "tool-output",
  "flag-warning",
  "faq",
  "sources",
  "policy-body",
  "consent-surface",
];

/* ────────────────────────────────────────────────────── reserved geometry */

/**
 * Reserved dimensions.
 *
 * `AdSlot` reserves a FIXED height — not a minimum — and clips. So the reserve
 * is chosen to hold the tallest creative the slot is allowed to request, and
 * the creative sizes below are the contract with the ad unit: a unit
 * configured in the AdSense console for a size not in this list will be
 * clipped, and clipped is the correct failure. A layout shift costs more in
 * rankings than the extra pixels earn.
 *
 * 20px of the reserve is the permanent "Advertisement" label, which is a
 * disclosure requirement and part of the box, not an addition to it.
 */
const LABEL_LINE = 20;

export interface AdReservation {
  /** Always fluid: the slot fills its column and the creative centres in it. */
  readonly width: "fluid";
  /** Exact reserved height in CSS pixels, label included. Never a minimum. */
  readonly height: number;
  /** The creative sizes this slot may request. Anything taller is clipped. */
  readonly creatives: readonly `${number}x${number}`[];
  /**
   * The `data-ad-format` the unit asks for. Never "auto": an auto unit sizes
   * itself from the container and can come back taller than the reserve, which
   * `AdSlot` then clips. Asking for the shape we reserved is the honest
   * version of the same guarantee.
   */
  readonly format: "rectangle" | "horizontal";
}

/** In-content rectangle. Holds a 300×250 or a 336×280. */
export const RESERVE_RECTANGLE: AdReservation = {
  width: "fluid",
  height: 280 + LABEL_LINE + 4,
  creatives: ["300x250", "336x280"],
  format: "rectangle",
};

/** Horizontal band. Holds a 320×100 or a 728×90. */
export const RESERVE_BANNER: AdReservation = {
  width: "fluid",
  height: 100 + LABEL_LINE + 4,
  creatives: ["320x100", "728x90"],
  format: "horizontal",
};

/** Height available to the creative once the disclosure label is taken out. */
export function creativeHeight(reservation: AdReservation): number {
  return Math.max(0, reservation.height - LABEL_LINE);
}

/* ─────────────────────────────────────────────────────────────── the table */

export const AD_PLACEMENT_IDS = [
  "tool-below-answer",
  "tool-foot",
  "article-mid",
  "article-foot",
  "index-foot",
  "reference-mid",
  "hub-foot",
] as const;

export type AdPlacementId = (typeof AD_PLACEMENT_IDS)[number];

export interface AdPlacement {
  readonly id: AdPlacementId;
  readonly pageType: AdPageType;
  /** Where it sits, in the terms the page is built from. */
  readonly position: string;
  /** The file that renders it. One read verifies the neighbour claims. */
  readonly wiredIn: string;
  readonly reserved: AdReservation;
  /** What is immediately above it in the document. */
  readonly above: readonly AdNeighbour[];
  /** What is immediately below it. */
  readonly below: readonly AdNeighbour[];
  /** The permanent disclosure label. Always says the word. */
  readonly label: string;
  /** Why this position and not another. Reproduced in MONETISATION.md. */
  readonly why: string;
  /**
   * The AdSense `data-ad-slot` id, once the units exist in the console.
   * `null` until then — an `<ins>` with no slot id is a configuration error,
   * so `AD_MODE=on` with a null id fails loudly rather than serving a blank.
   */
  readonly adUnitId: string | null;
}

export const AD_PLACEMENTS: { readonly [K in AdPlacementId]: AdPlacement } = {
  /* ─────────────────────────────────────────────────────────────── tool ── */

  "tool-below-answer": {
    id: "tool-below-answer",
    pageType: "tool",
    position: "between the closing edge of the workbench and the reading band",
    wiredIn: "src/components/tool/ToolShell.tsx",
    reserved: RESERVE_RECTANGLE,
    above: ["tool-workbench-edge"],
    below: ["reading-band-edge"],
    label: "Advertisement",
    why:
      "The first placement a reader can reach, and it is on the far side of a " +
      "hard boundary: the workbench closes, the reading band opens with its own " +
      "ruled head. Everything the tool computes — the verdict, the ledger, the " +
      "trace, the warnings — is above that line, inside <ToolBoundary>, where a " +
      "slot cannot be rendered at all. On every viewport the site targets the " +
      "masthead plus the instrument is more than one screen, so this is below " +
      "the fold without needing to be measured. The sticky answer bar is " +
      "position:sticky and stops at the end of the tool, so it never scrolls " +
      "over this box — no obscured-ad problem and no accidental clicks.",
    adUnitId: null,
  },

  "tool-foot": {
    id: "tool-foot",
    pageType: "tool",
    position: "after the reading band, before the section footer",
    wiredIn: "src/components/tool/ToolShell.tsx",
    reserved: RESERVE_BANNER,
    above: ["reading-band"],
    below: ["section-footer"],
    label: "Advertisement",
    why:
      "The end of the page's own words. A banner rather than a rectangle: the " +
      "section footer below it carries the disclaimer and the rule-verification " +
      "date, and a 280px block immediately above a disclaimer starts to read " +
      "like a wall between the reader and the small print.",
    adUnitId: null,
  },

  /* ──────────────────────────────────────────────────────────── article ── */

  "article-mid": {
    id: "article-mid",
    pageType: "article",
    position: "end of the first section — immediately before the second H2",
    wiredIn: "src/lib/ads/article.tsx",
    reserved: RESERVE_RECTANGLE,
    above: ["article-body"],
    below: ["article-heading"],
    label: "Advertisement",
    why:
      "After the first H2 by construction, and at a section boundary rather " +
      "than inside a thought — an ad between a heading and its first paragraph " +
      "is the placement readers describe as an ad they had to read past. It is " +
      "refused outright on an article with fewer than four H2s, which keeps it " +
      "structurally distant from the closing FAQ and from the Sources ledger.",
    adUnitId: null,
  },

  "article-foot": {
    id: "article-foot",
    pageType: "article",
    position: "after the closing tool kicker, at the end of the article",
    wiredIn: "src/app/guides/[slug]/ArticleView.tsx",
    reserved: RESERVE_RECTANGLE,
    above: ["article-kicker"],
    below: ["page-end"],
    label: "Advertisement",
    why:
      "Last thing on the page, with the Sources ledger, the related articles " +
      "and the kicker paragraph all between it and the evidence. A reader who " +
      "reaches it has finished; nothing is between them and something they " +
      "came for.",
    adUnitId: null,
  },

  /* ────────────────────────────────────────────────────────────── index ── */

  "index-foot": {
    id: "index-foot",
    pageType: "index",
    position: "end of the list page",
    wiredIn: "src/app/guides/page.tsx, src/app/glossary/page.tsx, src/app/paycheck/occupations/page.tsx",
    reserved: RESERVE_RECTANGLE,
    above: ["index-list"],
    below: ["page-end"],
    label: "Advertisement",
    why:
      "One slot, at the bottom, on a page whose entire job is to route someone " +
      "onward. An ad between a reader and the link they are scanning for is a " +
      "navigational obstruction, which is a policy problem before it is a " +
      "design one. /property/counties deliberately carries none: at ~604 words " +
      "it is the thinnest indexable page on the site, and ads wait for content.",
    adUnitId: null,
  },

  /* ────────────────────────────────────────────────────────── reference ── */

  "reference-mid": {
    id: "reference-mid",
    pageType: "reference",
    position: "after the first prose section, at a section boundary",
    wiredIn:
      "src/app/property/counties/[state]/[county]/page.tsx, src/app/trades/contracts/[state]/page.tsx",
    reserved: RESERVE_RECTANGLE,
    above: ["reference-body"],
    below: ["reference-body"],
    label: "Advertisement",
    why:
      "Mid-page rather than at the foot, because these pages END in a citation " +
      "ledger and a slot at the bottom would sit against it. Mid also keeps it " +
      "clear of the deadline WarningStack near the top of a county page, which " +
      "is a --flag block: the fact table and a full prose section stand between " +
      "them.",
    adUnitId: null,
  },

  /* ──────────────────────────────────────────────────────────────── hub ── */

  "hub-foot": {
    id: "hub-foot",
    pageType: "hub",
    position: "after the closing colophon band",
    wiredIn: "src/app/page.tsx",
    reserved: RESERVE_BANNER,
    above: ["hub-colophon"],
    below: ["site-footer"],
    label: "Advertisement",
    why:
      "The hub's first screen is a live ACA engine the reader can drag a " +
      "household across; it is the argument for the whole site and nothing goes " +
      "above it or beside it. One banner at the very end, after the tool cards, " +
      "the trust band and the colophon. A hub is a routing page, and a routing " +
      "page monetises badly no matter where the unit goes — better to keep it " +
      "clean than to earn a little and look like a portal.",
    adUnitId: null,
  },
};

export const AD_PLACEMENT_LIST: readonly AdPlacement[] = AD_PLACEMENT_IDS.map(
  (id) => AD_PLACEMENTS[id],
);

/** The placements a given page type may carry. Empty for trust and policy. */
export function placementsFor(pageType: AdPageType): readonly AdPlacement[] {
  return AD_PLACEMENT_LIST.filter((placement) => placement.pageType === pageType);
}

export function getPlacement(id: AdPlacementId): AdPlacement {
  return AD_PLACEMENTS[id];
}

/**
 * The DOM id an ad network would target. Prefixed so it can never collide with
 * an anchor a reader might land on from a table of contents.
 */
export function slotDomId(id: AdPlacementId): string {
  return `ad-${id}`;
}

/* ───────────────────────────────────────────────────────────── the denylist */

/**
 * The path denylist lives in `paths.ts`, not here.
 *
 * It is the one part of the map that has to run in the browser, and this file
 * must not: the registry above carries its reasoning in prose, minification
 * strips comments but not string literals, and importing it from a client
 * component shipped every word of it to every reader. Re-exported so that a
 * caller reading the map finds the gate where they expect it.
 */
export { AD_FREE_PATHS, AD_FREE_SUFFIXES, adsPermittedOn } from "./paths";

/* ───────────────────────────────────────────────── what the browser gets ── */

/**
 * A placement, reduced to the handful of values the browser actually renders.
 *
 * `AdPlacement` resolves this on the server and passes it down, so the client
 * never imports the registry. Everything the map exists to record — the
 * position, the neighbours, the reasoning, the enforcement — is a server-side
 * and build-time concern and stays there.
 */
export interface AdSlotSpec {
  readonly id: AdPlacementId;
  readonly domId: string;
  /** Exact reserved height in CSS pixels, disclosure label included. */
  readonly height: number;
  /** Height left for the creative once the label is taken out. */
  readonly creativeHeight: number;
  readonly label: string;
  readonly format: AdReservation["format"];
  readonly adUnitId: string | null;
}

export function toSlotSpec(placement: AdPlacement): AdSlotSpec {
  return {
    id: placement.id,
    domId: slotDomId(placement.id),
    height: placement.reserved.height,
    creativeHeight: creativeHeight(placement.reserved),
    label: placement.label,
    format: placement.reserved.format,
    adUnitId: placement.adUnitId,
  };
}

/* ──────────────────────────────────────────────────────────── the invariants */

/**
 * Asserted at module load, so a broken map fails `next build` rather than a
 * policy review. Every rule at the top of this file that CAN be checked
 * mechanically is checked here.
 */
function assertPlacementMap(): void {
  const seenDomIds = new Set<string>();

  for (const placement of AD_PLACEMENT_LIST) {
    const where = `Ad placement "${placement.id}"`;

    // Rule 4, and the trust-page refusal.
    if (AD_FREE_PAGE_TYPES.includes(placement.pageType)) {
      throw new Error(
        `${where} is declared on page type "${placement.pageType}", which carries no ` +
          `advertising. See AD_FREE_PAGE_TYPES.`,
      );
    }

    // Rules 1, 3 and 5.
    for (const neighbour of [...placement.above, ...placement.below]) {
      if (FORBIDDEN_NEIGHBOURS.includes(neighbour)) {
        throw new Error(
          `${where} declares "${neighbour}" as a neighbour. That adjacency is ` +
            `forbidden — see FORBIDDEN_NEIGHBOURS and the rule it encodes. ` +
            `Move the slot in ${placement.wiredIn}, do not relax the rule.`,
        );
      }
    }

    if (placement.above.length === 0 || placement.below.length === 0) {
      throw new Error(
        `${where} does not declare what sits above and below it. The neighbour ` +
          `declaration is what makes the adjacency rules checkable; a placement ` +
          `without one is unreviewable.`,
      );
    }

    // The reserve must actually hold at least one creative it may request.
    if (placement.reserved.creatives.length === 0) {
      throw new Error(`${where} reserves space for no creative size.`);
    }
    for (const size of placement.reserved.creatives) {
      const parts = size.split("x");
      const creativeHeight = Number(parts[1]);
      if (!Number.isFinite(creativeHeight) || creativeHeight <= 0) {
        throw new Error(`${where} declares an unreadable creative size "${size}".`);
      }
      if (creativeHeight + LABEL_LINE > placement.reserved.height) {
        throw new Error(
          `${where} reserves ${placement.reserved.height}px but may request a ` +
            `${size} creative, which needs ${creativeHeight + LABEL_LINE}px with the ` +
            `disclosure label. AdSlot clips rather than grows, so this creative ` +
            `would be cut off. Raise the reserve or drop the size.`,
        );
      }
    }

    // The disclosure. Non-negotiable, and checked rather than trusted.
    if (!/advertis/i.test(placement.label)) {
      throw new Error(
        `${where} is labelled "${placement.label}", which does not say the word. ` +
          `Every slot must be identifiable as advertising by a reader and by a ` +
          `screen reader.`,
      );
    }

    const domId = slotDomId(placement.id);
    if (seenDomIds.has(domId)) {
      throw new Error(`Two placements resolve to the DOM id "${domId}".`);
    }
    seenDomIds.add(domId);
  }
}

assertPlacementMap();
