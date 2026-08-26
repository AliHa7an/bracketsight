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
 * (`bracketsight.app`), and drops any trailing slash so callers can always
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
 *
 * In development a missing value falls back to localhost, which is correct.
 *
 * In production it FAILS THE BUILD, and that is not defensive programming —
 * it is a fix for something that actually happened. `NEXT_PUBLIC_*` is inlined
 * by the bundler at build time, not read at runtime, so setting this only on
 * the running server does nothing at all. When the first deploy went out
 * without it, the build succeeded and the site served every canonical, every
 * `og:url`, the `robots.txt` sitemap line and all 53 sitemap entries as
 * `http://localhost:3000`. Search Console reported 53 errors out of 53 URLs,
 * and every page was quietly telling Google that its real address was one no
 * crawler can reach.
 *
 * A silent wrong origin is worse than a failed build, because the build looks
 * fine and the damage only surfaces days later in someone else's dashboard.
 * So: fail here, at the only moment the value can still be corrected.
 */
function resolveSiteUrl(): string {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set, so canonicals, og:url, robots.txt and " +
        "sitemap.xml would all be emitted as " +
        DEV_ORIGIN +
        ". It is inlined at BUILD time — setting it on the running server has " +
        "no effect. Set it in the build environment (on Vercel: Project " +
        "Settings > Environment Variables, Production, then redeploy) as " +
        "e.g. https://bracketsight.com",
    );
  }

  return DEV_ORIGIN;
}

export const SITE_URL: string = resolveSiteUrl();

/** Absolute URL for a root-relative path. `absoluteUrl("/contact")`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "Bracketsight";

/** ≤160 characters. Used as the site-level fallback description. */
export const SITE_DESCRIPTION =
  "Five decision engines for the US money rules that move real dollars: loan repayment, OBBBA deductions, ACA subsidies, property tax, trade contracts. Rules cited.";

/**
 * The one reachable contact address. Rendered as visible text and as a
 * `mailto:` link on /contact and in the footer — a working contact method is
 * an AdSense requirement and the route a correction arrives by.
 */
export const CONTACT_EMAIL = "info@bracketsight.com";

/* ---- Attribution --------------------------------------------------------
 * WHO IS BEHIND THIS SITE. Currently unset, and that is the single largest
 * unmet requirement before this site is submitted to an ad network or offered
 * to a reader as a source on money.
 *
 * Google's publisher policies, and the E-E-A-T signals that decide whether a
 * YMYL finance page ranks at all, both ask the same question: who wrote this,
 * and what qualifies them? A site that computes a household's subsidy cliff
 * and a borrower's 30-year repayment cost while naming nobody answers it with
 * silence. The site currently names no human anywhere.
 *
 * This is deliberately typed as `Maintainer | null` rather than filled with a
 * placeholder: a fabricated name, a stock photo or an invented credential on a
 * YMYL finance site is a worse failure than an empty field, and the empty
 * field is at least honest. `/about` renders the attribution block only when
 * this is set, so filling it in is the whole change.
 *
 * TO FILL IN — the owner must supply, and only the owner can:
 *   name          the legal or professional name that stands behind the
 *                 figures. A person, or a registered entity with a person
 *                 named as its editor.
 *   role          "Editor and maintainer", "Founder", etc.
 *   background    2–4 sentences of relevant, checkable experience. What makes
 *                 this person able to read 34 C.F.R. § 685.209 correctly.
 *                 Not a bio — the specific basis for the reader's trust.
 *   profileUrl    optional: a LinkedIn, a personal site, a GitHub. A page a
 *                 reviewer can open to confirm the person exists.
 *   entity        optional: registered business name, and the jurisdiction it
 *                 is registered in, if the site trades as one.
 *
 * A postal address is NOT required by AdSense and is not modelled here; the
 * reachable email in CONTACT_EMAIL is the contact requirement.
 * ---------------------------------------------------------------------- */

export type Maintainer = {
  readonly name: string;
  readonly role: string;
  readonly background: string;
  readonly profileUrl?: string;
  readonly entity?: string;
};

/** Unset. See the block above for exactly what has to go here, and why. */
export const MAINTAINER: Maintainer | null = null;

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

/**
 * Site-level pages that exist outside any section.
 *
 * Every one of these is rendered in the footer on EVERY page, section pages
 * included. That is not decoration: a privacy notice and a "this is not
 * advice" disclaimer that a reader can only reach from one other page is, for
 * a YMYL site, the same as not having one. `/privacy` and `/terms` were
 * previously in this list and in the sitemap but rendered in no nav at all —
 * `/terms` was four clicks from the hub and reachable only via `/privacy`.
 */
export const TRUST_PAGES: readonly StaticPage[] = [
  { href: "/about", label: "About" },
  { href: "/authors", label: "Who writes and checks this" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy and cookies" },
  { href: "/terms", label: "Terms and disclaimer" },
] as const;

/**
 * The reading surface: written explainers and the term index, as opposed to
 * the tools and the policy pages.
 *
 * Kept separate from `TRUST_PAGES` on purpose. Both render in the footer on
 * every page, but only `TRUST_PAGES` feeds `sitemap.ts` — the guides tree
 * enumerates its own URLs there, from the same functions its
 * `generateStaticParams` reads, so listing it here as well would emit each URL
 * twice.
 *
 * These exist in the footer because they were otherwise reachable from nothing:
 * a glossary and a guides index that no page links to are, to a crawler, two
 * more orphans, and orphaned reference pages are exactly what "low value
 * content" is usually attached to.
 */
export const LIBRARY_PAGES: readonly StaticPage[] = [
  { href: "/guides", label: "Guides" },
  { href: "/glossary", label: "Glossary" },
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
  "Bracketsight is an independent estimate engine. It is not financial, tax or legal advice, and it is not your servicer, your employer, your insurer or your county. Every figure is an estimate under current rules — confirm anything irreversible before you act on it.";

/* ---- Breadcrumbs --------------------------------------------------------
 * One derived trail, used for both the visible breadcrumb nav and the
 * BreadcrumbList markup, so the two can never disagree — which is the whole
 * reason structured data gets flagged as misleading.
 *
 * The trail is built by walking the path's prefixes and keeping only the ones
 * that are real routes. A segment that is not a page of its own (`/trades/
 * contracts`, `/property/counties/il`) is dropped rather than rendered as a
 * dead crumb: an intermediate breadcrumb that 404s is worse than a shorter
 * trail, and Google's guidance expects every non-final crumb to resolve.
 * ---------------------------------------------------------------------- */

/**
 * Labels for routes the config cannot name on its own — the two prerendered
 * dynamic families. SECTION OWNERS: add an entry when you ship a county or a
 * state, or its breadcrumb falls back to the raw URL segment.
 */
const DYNAMIC_PAGE_LABELS: Readonly<Record<string, string>> = {
  // The guides tree. `/guides/[slug]` serves two shapes — a tool index and an
  // article — so the five tool slugs are named here and an article falls
  // through to the humanised-segment path. Without these entries an article's
  // trail collapses to "Home / Rap can cost more than standard", skipping both
  // the guides index and the tool the article belongs to.
  "/guides": "Guides",
  "/guides/loans": "Student loans",
  "/guides/paycheck": "Paycheck",
  "/guides/aca": "Health cover",
  "/guides/property": "Property tax",
  "/guides/trades": "Trades",
  "/glossary": "Glossary",
  "/property/counties/il/cook": "Cook County, Illinois",
  "/property/counties/nj/bergen": "Bergen County, New Jersey",
  "/trades/contracts/CA": "California",
  "/trades/contracts/FL": "Florida",
  "/trades/contracts/NY": "New York",
  "/trades/contracts/PA": "Pennsylvania",
  "/trades/contracts/TX": "Texas",
};

/** Every static route the shell knows about, path → label. */
function knownRoutes(): Map<string, string> {
  const map = new Map<string, string>([["/", "Home"]]);
  for (const page of TRUST_PAGES) map.set(page.href, page.label);
  for (const page of LIBRARY_PAGES) map.set(page.href, page.label);
  for (const section of SECTIONS) {
    map.set(sectionHref(section), section.name);
    for (const page of SECTION_PAGES[section.slug]) {
      map.set(sectionPageHref(section, page), page.label);
    }
  }
  for (const [href, label] of Object.entries(DYNAMIC_PAGE_LABELS)) map.set(href, label);
  return map;
}

export type Crumb = { readonly href: string; readonly label: string };

/**
 * The breadcrumb trail for a path, starting at Home and ending at the page
 * itself. Returns an empty array for the hub, which is its own root and gets
 * no breadcrumbs.
 *
 * Unknown leaf paths (a route added without a config entry) still get a trail:
 * the last segment is humanised rather than dropped, so a new page is never
 * silently left without navigation.
 */
export function breadcrumbTrail(pathname: string): readonly Crumb[] {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "" || clean === "/") return [];

  const routes = knownRoutes();
  const segments = clean.split("/").filter(Boolean);

  const trail: Crumb[] = [{ href: "/", label: "Home" }];
  let prefix = "";
  for (const segment of segments) {
    prefix += `/${segment}`;
    const label = routes.get(prefix);
    if (label) trail.push({ href: prefix, label });
  }

  // A leaf with no config entry: name it from its own last segment rather than
  // leaving the reader on a page the trail does not reach.
  const last = trail[trail.length - 1];
  if (!last || last.href !== clean) {
    const tail = segments[segments.length - 1] ?? "";
    trail.push({ href: clean, label: humaniseSegment(tail) });
  }

  return trail;
}

/** `pricing-methodology` → `Pricing methodology`; `CA` → `CA`. */
function humaniseSegment(segment: string): string {
  const spaced = segment.replace(/-/g, " ");
  if (/^[a-z]{2}$/.test(segment)) return segment.toUpperCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
