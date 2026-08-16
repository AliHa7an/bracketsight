/**
 * Site configuration — the single source of truth for the shell.
 *
 * Nav, footer, sitemap, robots and the hub page all read from here. A section
 * that is not in `SECTIONS` appears nowhere; a section that is added here
 * appears everywhere at once. That is the point: the five tools drifted apart
 * in five separate repos, and the shell is what stops it happening again.
 *
 * No secrets. Everything in this file is public by construction — it is
 * imported by client components as well as server ones.
 */

/* ---- Origin -------------------------------------------------------------
 * The origin is configuration, never a literal.
 *
 * A previous repo pinned `metadataBase` to `https://repaymentatlas.com`, which
 * meant every preview deployment emitted canonical tags and Open Graph URLs
 * pointing at production — so previews competed with, and sometimes
 * de-indexed, the pages they were previewing. The domain now lives in exactly
 * one place: the `NEXT_PUBLIC_SITE_URL` environment variable, documented in
 * `.env.example`. Nothing below hardcodes a production hostname.
 *
 * `NEXT_PUBLIC_` is required, not incidental: `SITE_URL` is inlined at build
 * time into both the server and the client bundle, so a client component that
 * builds a share link sees the same origin the sitemap did.
 * ---------------------------------------------------------------------- */

const DEV_ORIGIN = "http://localhost:3000";

/**
 * Trims whitespace, supplies `https://` when the value came in bare
 * (`fineprint.app`), and drops any trailing slash so callers can always
 * concatenate `${SITE_URL}/path` without producing a double slash.
 * Returns `null` for anything unusable, so a typo falls back to the dev
 * origin — obviously broken locally — rather than emitting a malformed
 * canonical URL to a crawler.
 */
function normalizeOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * The canonical origin, with no trailing slash: "https://example.com".
 * Falls back to localhost when unset, which is correct in development and
 * loudly wrong in production — the failure a missing env var should produce.
 */
export const SITE_URL: string =
  normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? DEV_ORIGIN;

/** Absolute URL for a root-relative path. `absoluteUrl("/contact")`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "Fineprint";

/** ≤160 characters. Used as the site-level fallback description. */
export const SITE_DESCRIPTION =
  "Five decision engines for the US money rules that move real dollars: loan repayment, OBBBA deductions, ACA subsidies, property tax, trade contracts. Rules cited.";

/**
 * The one reachable contact address. Rendered as visible text and as a
 * `mailto:` link on /contact and in the footer — a working contact method is
 * an AdSense requirement and the route a correction arrives by.
 */
export const CONTACT_EMAIL = "alihexan@gmail.com";

/* ---- The five sections -------------------------------------------------- */

/** Section slugs, in nav order. Also the `data-section` theme keys. */
export type SectionSlug = "loans" | "paycheck" | "aca" | "property" | "trades";

export type Section = {
  /** Stable identifier. Same string as the slug — one section, one name. */
  readonly id: SectionSlug;
  /** URL segment: the section lives at `/${slug}`. */
  readonly slug: SectionSlug;
  /** Short label. Used in nav, cards and breadcrumbs. */
  readonly name: string;
  /** The real question the tool answers, in the user's words. */
  readonly tagline: string;
  /**
   * Value for the `data-section` attribute on the section layout's wrapper.
   * That attribute is the entire theming mechanism: it redefines the six
   * semantic colour tokens for its subtree and nothing else moves.
   */
  readonly dataSection: SectionSlug;
};

export const SECTIONS: readonly Section[] = [
  {
    id: "loans",
    slug: "loans",
    name: "Student loans",
    tagline: "Which of the 9 federal repayment plans costs you least over 30 years?",
    dataSection: "loans",
  },
  {
    id: "paycheck",
    slug: "paycheck",
    name: "Paycheck",
    tagline: "Which OBBBA deductions is your pay owed — and does your W-2 show them?",
    dataSection: "paycheck",
  },
  {
    id: "aca",
    slug: "aca",
    name: "Health cover",
    tagline: "How close is your household to the 400% subsidy cliff?",
    dataSection: "aca",
  },
  {
    id: "property",
    slug: "property",
    name: "Property tax",
    tagline: "Is your home over-assessed enough to be worth appealing?",
    dataSection: "property",
  },
  {
    id: "trades",
    slug: "trades",
    name: "Trades",
    tagline: "What should this job cost, and what must the contract say in your state?",
    dataSection: "trades",
  },
] as const;

/** `/loans`, `/paycheck`, … — never build a section path by hand. */
export function sectionHref(section: Section): string {
  return `/${section.slug}`;
}

/* ---- Trust and policy pages ---------------------------------------------
 * The trust surface is SECTION-LOCAL, not site-level. Each tool answers to a
 * different rule-maker — the Department of Education, the IRS, HHS, a county
 * assessor, a state contractor board — so a single site-wide "methodology"
 * page would have to be five pages stapled together, and a citation on it
 * would belong to none of them. Every section therefore carries its own
 * methodology, sources, editorial policy, changelog and about.
 *
 * `/contact` is the one genuinely site-level trust page, because there is one
 * inbox.
 * ---------------------------------------------------------------------- */

export type StaticPage = { readonly href: string; readonly label: string };

/** Site-level pages that exist outside any section. */
export const TRUST_PAGES: readonly StaticPage[] = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export type SectionPage = {
  /** Path relative to the section root: "/methodology". */
  readonly href: string;
  readonly label: string;
  /**
   * True for the pages that carry the site's credibility — methodology,
   * sources, editorial policy, changelog, about. The footer surfaces exactly
   * these for whichever section the reader is in; the rest are tool routes and
   * appear in the sitemap only.
   */
  readonly trust: boolean;
};

/**
 * Every static route each section owns.
 *
 * This is the one place in the shell that is NOT derivable — the sections are
 * built by different owners and their sub-routes genuinely differ (trades has
 * `/pricing-methodology` where the others have `/methodology`, because pricing
 * is what its numbers rest on; only loans has a `/privacy` page, because only
 * loans ingests uploaded documents). Keeping the divergence explicit and
 * visible here is better than a convention that quietly emits 404s into the
 * sitemap, which is what a `SECTIONS × ["methodology", …]` product would do.
 *
 * SECTION OWNERS: add a route here when you add a page, or it is an orphan —
 * it will be in no sitemap and linked from no footer.
 */
export const SECTION_PAGES: Record<SectionSlug, readonly SectionPage[]> = {
  loans: [
    { href: "/methodology", label: "Methodology", trust: true },
    { href: "/sources", label: "Sources", trust: true },
    { href: "/editorial-policy", label: "Editorial policy", trust: true },
    { href: "/changelog", label: "Changelog", trust: true },
    { href: "/about", label: "About", trust: true },
    { href: "/privacy", label: "Privacy", trust: true },
  ],
  paycheck: [
    { href: "/methodology", label: "Methodology", trust: true },
    { href: "/sources", label: "Sources", trust: true },
    { href: "/editorial-policy", label: "Editorial policy", trust: true },
    { href: "/changelog", label: "Changelog", trust: true },
    { href: "/about", label: "About", trust: true },
    { href: "/occupations", label: "Tipped occupations", trust: false },
  ],
  aca: [
    { href: "/methodology", label: "Methodology", trust: true },
    { href: "/sources", label: "Sources", trust: true },
    { href: "/editorial-policy", label: "Editorial policy", trust: true },
    { href: "/changelog", label: "Changelog", trust: true },
    { href: "/about", label: "About", trust: true },
  ],
  property: [
    { href: "/methodology", label: "Methodology", trust: true },
    { href: "/sources", label: "Sources", trust: true },
    { href: "/editorial-policy", label: "Editorial policy", trust: true },
    { href: "/changelog", label: "Changelog", trust: true },
    { href: "/about", label: "About", trust: true },
    { href: "/check", label: "Check an assessment", trust: false },
    { href: "/counties", label: "Counties covered", trust: false },
  ],
  trades: [
    { href: "/pricing-methodology", label: "Pricing methodology", trust: true },
    { href: "/sources", label: "Sources", trust: true },
    { href: "/editorial-policy", label: "Editorial policy", trust: true },
    { href: "/changelog", label: "Changelog", trust: true },
    { href: "/about", label: "About", trust: true },
    { href: "/invoice", label: "Invoice", trust: false },
    { href: "/contract", label: "Contract", trust: false },
  ],
};

/** Absolute-from-root path for a page inside a section: `/trades/sources`. */
export function sectionPageHref(section: Section, page: SectionPage): string {
  return `/${section.slug}${page.href}`;
}

/** The section a root-relative path belongs to, or null on the hub/contact. */
export function sectionFromPath(pathname: string): Section | null {
  return (
    SECTIONS.find(
      (section) =>
        pathname === `/${section.slug}` || pathname.startsWith(`/${section.slug}/`),
    ) ?? null
  );
}

/**
 * One sentence, used verbatim in the footer and echoed on /contact. Says what
 * this is and — more importantly for a YMYL site — what it is not.
 */
export const DISCLAIMER =
  "Fineprint is an independent estimate engine. It is not financial, tax or legal advice, and it is not your servicer, your employer, your insurer or your county. Every figure is an estimate under current rules — confirm anything irreversible before you act on it.";
