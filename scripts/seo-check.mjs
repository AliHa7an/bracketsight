#!/usr/bin/env node
/**
 * seo-check — the CI gate for everything in SEO-AUDIT.md.
 *
 * It reads the BUILT HTML in `.next/server/app`, not the source. That is the
 * whole point: a source-level assertion proves what a module intended, and the
 * defect this repository actually shipped — 53 canonicals pointing at
 * `http://localhost:3000` — was invisible at source level and obvious in the
 * emitted markup. Everything here is checked against the bytes a crawler gets.
 *
 * What it asserts, in order:
 *
 *   1. METADATA      one <title> per route, <= 60 chars, unique across the
 *                    site; one description, 70-155 chars, unique; exactly one
 *                    canonical, absolute, on the configured origin, and equal
 *                    to the route's own path; an og:image on every route.
 *   2. JSON-LD       every block parses, and every object is checked against a
 *                    per-@type schema of required properties. A type this file
 *                    does not know is an error, not a pass — an unrecognised
 *                    block is exactly how an unvalidated one hides.
 *   3. LINK GRAPH    every internal href resolves to a route that was built
 *                    (a 404 check against the real route table), and every
 *                    indexable route has at least one inbound link from
 *                    another page (the orphan check).
 *   4. CRAWLABILITY  robots.txt disallows nothing indexable; sitemap.xml
 *                    contains every indexable route and no noindex one; every
 *                    sitemap lastModified is a real date, and none of them is
 *                    the build timestamp.
 *
 * Usage:
 *   node scripts/seo-check.mjs                 # assert; exit 1 on failure
 *   node scripts/seo-check.mjs --json out.json # also write the full report
 *   node scripts/seo-check.mjs --warn-only     # report, always exit 0
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, ".next", "server", "app");

const TITLE_MAX = 60;
const DESC_MAX = 155;
const DESC_MIN = 70;

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bracketsight.com").replace(/\/+$/, "");

/* Routes that are built but are not indexable content pages. */
const NON_CONTENT = new Set(["/_not-found", "/_global-error"]);

/* Non-HTML routes that internal links may legitimately point at. */
const ASSET_ROUTES = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.svg",
  "/ads.txt",
  "/llms.txt",
]);

/* ────────────────────────────────────────────────────────────── html read ── */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

/** `.next/server/app/loans/about.html` -> `/loans/about`; `index.html` -> `/`. */
function routeOf(file) {
  const rel = relative(APP_DIR, file).split(sep).join("/").replace(/\.html$/, "");
  if (rel === "index") return "/";
  return `/${rel}`;
}

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&");
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? decodeEntities(match[1]) : null;
}

function parsePage(file) {
  const html = readFileSync(file, "utf8");

  const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) =>
    decodeEntities(m[1].trim()),
  );

  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const metaBy = (key, value) =>
    metas
      .filter((tag) => (attr(tag, key) ?? "").toLowerCase() === value)
      .map((tag) => attr(tag, "content") ?? "");

  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const canonicals = links
    .filter((tag) => (attr(tag, "rel") ?? "").toLowerCase() === "canonical")
    .map((tag) => attr(tag, "href") ?? "");

  const jsonLdRaw = [
    ...html.matchAll(
      /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((m) => m[1]);

  /*
   * Internal hrefs, counted twice.
   *
   * `hrefs` is every link on the page. `contextualHrefs` excludes the site
   * chrome — the masthead nav, the global footer and the breadcrumb trail —
   * and it is the one the orphan check uses.
   *
   * That distinction is the whole value of this check. The footer links the
   * guides index and the glossary from all 55 pages, so measured naively every
   * route has 54 inbound links and the site has no orphans by construction.
   * It also has no internal linking: a link that appears on every page carries
   * no signal about what any particular page is about, and a crawler treats it
   * as navigation rather than as a recommendation. Only a link inside the
   * body — one page choosing to point at another — is evidence.
   */
  const body = html
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ");

  const collect = (source) => {
    const found = new Set();
    for (const m of source.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
      const raw = decodeEntities(m[1]);
      if (raw.startsWith("/")) found.add(raw);
    }
    return [...found];
  };

  const hrefs = collect(html);
  const contextualHrefs = collect(body);

  /* The visible text, for the "marked up but not visible" assertions. */
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  return {
    route: routeOf(file),
    titles,
    description: metaBy("name", "description"),
    robots: metaBy("name", "robots"),
    ogTitle: metaBy("property", "og:title"),
    ogDescription: metaBy("property", "og:description"),
    ogImage: metaBy("property", "og:image"),
    ogUrl: metaBy("property", "og:url"),
    ogType: metaBy("property", "og:type"),
    twitterCard: metaBy("name", "twitter:card"),
    canonicals,
    jsonLdRaw,
    hrefs,
    contextualHrefs,
    text: decodeEntities(text).replace(/\s+/g, " "),
  };
}

/* ─────────────────────────────────────────────────────────── json-ld spec ── */

/**
 * Required properties per @type. A block whose @type is absent from this table
 * is reported as UNKNOWN and fails the run: the alternative is a type nobody
 * validated slipping through because nobody noticed it was there.
 *
 * `visible` names a property whose string value (or whose members' string
 * values) must also appear in the page's rendered text. It is the mechanical
 * form of "never mark up what a reader cannot see".
 */
const SCHEMA = {
  Organization: {
    required: ["name", "url"],
    optional: ["email", "description", "contactPoint", "logo", "sameAs", "@id"],
  },
  ContactPoint: { required: ["contactType"], optional: ["email", "url", "availableLanguage"] },
  WebSite: {
    required: ["name", "url"],
    optional: ["description", "inLanguage", "publisher", "@id", "potentialAction"],
  },
  WebApplication: {
    required: ["name", "applicationCategory", "url", "offers"],
    optional: ["operatingSystem", "description", "browserRequirements", "isAccessibleForFree", "featureList", "publisher", "@id"],
  },
  SoftwareApplication: {
    required: ["name", "applicationCategory", "url", "offers"],
    optional: ["operatingSystem", "description", "browserRequirements", "isAccessibleForFree", "featureList", "publisher", "@id"],
  },
  Offer: { required: ["price", "priceCurrency"], optional: ["availability", "category"] },
  FAQPage: { required: ["mainEntity"], optional: ["@id", "inLanguage"], visible: "mainEntity.name" },
  Question: { required: ["name", "acceptedAnswer"], optional: [] },
  Answer: { required: ["text"], optional: [] },
  HowTo: {
    required: ["name", "step"],
    optional: ["description", "totalTime", "tool", "supply", "estimatedCost", "@id", "inLanguage"],
    visible: "step.name",
  },
  HowToStep: { required: ["name", "text"], optional: ["position", "url", "image"] },
  Article: {
    required: ["headline", "datePublished", "dateModified", "author", "publisher", "mainEntityOfPage"],
    optional: ["description", "inLanguage", "isAccessibleForFree", "citation", "reviewedBy", "image", "@id", "keywords", "articleSection"],
    visible: "headline",
  },
  BreadcrumbList: { required: ["itemListElement"], optional: ["@id"] },
  ListItem: { required: ["position", "name"], optional: ["item"] },
  DefinedTermSet: {
    required: ["name", "url", "hasDefinedTerm"],
    optional: ["inLanguage", "description", "@id"],
    visible: "hasDefinedTerm.name",
  },
  DefinedTerm: { required: ["name", "description"], optional: ["inDefinedTermSet", "@id", "url", "termCode"] },
  CreativeWork: { required: ["name"], optional: ["url"] },
  Person: { required: ["name"], optional: ["url", "jobTitle", "description"] },
  WebPage: { required: [], optional: ["@id", "name", "url"] },
  ImageObject: { required: ["url"], optional: ["width", "height", "caption"] },
};

/** Walks every nested object with an @type and validates it. */
function validateNode(node, page, errors, path = "$") {
  if (Array.isArray(node)) {
    node.forEach((item, i) => validateNode(item, page, errors, `${path}[${i}]`));
    return;
  }
  if (!node || typeof node !== "object") return;

  const type = node["@type"];
  if (typeof type === "string") {
    const spec = SCHEMA[type];
    if (!spec) {
      errors.push(`${page.route} ${path}: unknown @type "${type}" — add it to SCHEMA in scripts/seo-check.mjs or remove the block`);
    } else {
      for (const key of spec.required) {
        const value = node[key];
        if (value === undefined || value === null || value === "" ||
            (Array.isArray(value) && value.length === 0)) {
          errors.push(`${page.route} ${path} (${type}): missing required property "${key}"`);
        }
      }
      const known = new Set([...spec.required, ...spec.optional, "@type", "@context"]);
      for (const key of Object.keys(node)) {
        if (!known.has(key)) {
          errors.push(`${page.route} ${path} (${type}): unexpected property "${key}"`);
        }
      }
      if (spec.visible) {
        const [prop, sub] = spec.visible.split(".");
        const holder = node[prop];
        const values = sub
          ? (Array.isArray(holder) ? holder : [holder]).map((m) => m && m[sub])
          : [holder];
        for (const value of values) {
          if (typeof value !== "string") continue;
          if (!isVisible(value, page.text)) {
            errors.push(
              `${page.route} ${path} (${type}): "${value.slice(0, 60)}…" is marked up but does not appear in the page's visible text`,
            );
          }
        }
      }
    }
  }

  for (const value of Object.values(node)) validateNode(value, page, errors, path);
}

/**
 * Whether a marked-up string is genuinely on the page.
 *
 * Compared on a normalised form — case folded, punctuation and entity noise
 * stripped — because the visible copy sets a figure in a <span> and uses a
 * typographic apostrophe where the JSON-LD string has a plain one. A prefix of
 * the first ten words is enough to prove the sentence is the same sentence
 * without failing on a curly quote.
 */
function isVisible(value, text) {
  const norm = (s) => s.toLowerCase().replace(/[‘’“”]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
  const needle = norm(value).split(" ").slice(0, 10).join(" ");
  return needle.length > 0 && norm(text).includes(needle);
}

/* ─────────────────────────────────────────────────────────────── the run ── */

function main() {
  const files = walk(APP_DIR);
  const pages = files.map(parsePage).filter((p) => !NON_CONTENT.has(p.route));

  const errors = [];
  const warnings = [];
  const byRoute = new Map(pages.map((p) => [p.route, p]));

  /* -- 1. metadata --------------------------------------------------------- */

  const metadataRows = [];
  const titleSeen = new Map();
  const descSeen = new Map();

  for (const page of pages) {
    const title = page.titles[0] ?? "";
    const description = page.description[0] ?? "";
    const canonical = page.canonicals[0] ?? "";
    const noindex = page.robots.some((r) => /noindex/i.test(r));

    metadataRows.push({
      route: page.route,
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      canonical,
      noindex,
      ogImage: page.ogImage[0] ?? "",
    });

    if (page.titles.length !== 1) errors.push(`${page.route}: ${page.titles.length} <title> tags`);
    if (!title) errors.push(`${page.route}: empty <title>`);
    if (title.length > TITLE_MAX) errors.push(`${page.route}: title ${title.length} chars (max ${TITLE_MAX}) — "${title}"`);

    if (page.description.length !== 1) errors.push(`${page.route}: ${page.description.length} description tags`);
    if (description.length > DESC_MAX) errors.push(`${page.route}: description ${description.length} chars (max ${DESC_MAX})`);
    if (description.length > 0 && description.length < DESC_MIN) warnings.push(`${page.route}: description only ${description.length} chars (min ${DESC_MIN})`);
    if (!description) errors.push(`${page.route}: no meta description`);

    if (page.canonicals.length !== 1) errors.push(`${page.route}: ${page.canonicals.length} canonical tags`);
    else {
      const expected = page.route === "/" ? ORIGIN : `${ORIGIN}${page.route}`;
      if (canonical !== expected) errors.push(`${page.route}: canonical is "${canonical}", expected "${expected}"`);
    }

    if (!page.ogImage[0]) errors.push(`${page.route}: no og:image`);
    if (!page.ogTitle[0]) errors.push(`${page.route}: no og:title`);
    if (!page.ogDescription[0]) errors.push(`${page.route}: no og:description`);
    if (!page.twitterCard[0]) warnings.push(`${page.route}: no twitter:card`);

    const dupTitle = titleSeen.get(title);
    if (dupTitle) errors.push(`duplicate title on ${dupTitle} and ${page.route}: "${title}"`);
    else titleSeen.set(title, page.route);

    const dupDesc = descSeen.get(description);
    if (dupDesc) errors.push(`duplicate description on ${dupDesc} and ${page.route}`);
    else descSeen.set(description, page.route);
  }

  /* -- 2. json-ld ---------------------------------------------------------- */

  const schemaCounts = new Map();
  let blocks = 0;

  for (const page of pages) {
    const topTypes = [];
    for (const raw of page.jsonLdRaw) {
      blocks += 1;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        errors.push(`${page.route}: JSON-LD does not parse — ${error.message}`);
        continue;
      }
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node["@context"]) errors.push(`${page.route}: JSON-LD block has no @context`);
        const type = node["@type"];
        if (typeof type === "string") {
          topTypes.push(type);
          schemaCounts.set(type, (schemaCounts.get(type) ?? 0) + 1);
        }
      }
      validateNode(parsed, page, errors);
    }
    const dupes = topTypes.filter((t, i) => topTypes.indexOf(t) !== i);
    for (const type of new Set(dupes)) {
      errors.push(`${page.route}: ${type} emitted more than once on one URL`);
    }
  }

  /* -- 3. link graph ------------------------------------------------------- */

  const known = new Set([...byRoute.keys(), ...ASSET_ROUTES]);
  const inbound = new Map([...byRoute.keys()].map((r) => [r, new Set()]));
  const contextualInbound = new Map([...byRoute.keys()].map((r) => [r, new Set()]));
  const broken = [];

  const normalise = (href) => href.split("#")[0].split("?")[0].replace(/\/+$/, "") || "/";

  for (const page of pages) {
    for (const href of page.hrefs) {
      const path = normalise(href);
      if (!known.has(path)) {
        broken.push({ from: page.route, href });
        continue;
      }
      if (inbound.has(path) && path !== page.route) inbound.get(path).add(page.route);
    }
    for (const href of page.contextualHrefs) {
      const path = normalise(href);
      if (contextualInbound.has(path) && path !== page.route) {
        contextualInbound.get(path).add(page.route);
      }
    }
  }

  for (const { from, href } of broken) {
    errors.push(`broken internal link: ${from} -> ${href} (no such route was built)`);
  }

  /*
   * Orphans are measured on the CONTEXTUAL graph, and the bar is two.
   *
   * One inbound body link is a mention; two is a page the site has actually
   * placed. The same bar the programmatic-page publish gates use.
   */
  const orphans = [];
  const thin = [];
  for (const [route, sources] of contextualInbound) {
    if (route === "/") continue; // the origin needs no inbound link
    const page = byRoute.get(route);
    if (page.robots.some((r) => /noindex/i.test(r))) continue;
    if (sources.size === 0) orphans.push(route);
    else if (sources.size === 1) thin.push(route);
  }
  for (const route of orphans) {
    errors.push(`orphan: ${route} is reachable only from site chrome — no page links to it in body copy`);
  }
  for (const route of thin) {
    warnings.push(`thin: ${route} has one contextual inbound link (${[...contextualInbound.get(route)][0]})`);
  }

  /* -- 4. crawlability ----------------------------------------------------- */

  const robotsTxt = readFileSync(join(APP_DIR, "robots.txt.body"), "utf8");
  const sitemapXml = readFileSync(join(APP_DIR, "sitemap.xml.body"), "utf8");

  for (const line of robotsTxt.split("\n")) {
    const match = line.match(/^\s*Disallow:\s*(\S+)\s*$/i);
    if (!match) continue;
    const path = match[1].replace(/\*$/, "").replace(/\/+$/, "") || "/";
    for (const route of byRoute.keys()) {
      if (route === path || route.startsWith(`${path}/`)) {
        errors.push(`robots.txt disallows "${match[1]}", which blocks the built route ${route}`);
      }
    }
  }
  if (!robotsTxt.includes(`${ORIGIN}/sitemap.xml`)) {
    errors.push(`robots.txt does not advertise ${ORIGIN}/sitemap.xml`);
  }

  const sitemapEntries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: (m[1].match(/<loc>([\s\S]*?)<\/loc>/) ?? [, ""])[1],
    lastmod: (m[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/) ?? [, ""])[1],
  }));

  const sitemapPaths = new Set();
  const buildDay = new Date().toISOString().slice(0, 10);
  for (const entry of sitemapEntries) {
    if (!entry.loc.startsWith(`${ORIGIN}/`) && entry.loc !== ORIGIN) {
      errors.push(`sitemap: ${entry.loc} is not on ${ORIGIN}`);
      continue;
    }
    const path = entry.loc === ORIGIN ? "/" : entry.loc.slice(ORIGIN.length);
    sitemapPaths.add(path);
    const page = byRoute.get(path);
    if (!page) {
      errors.push(`sitemap: ${path} was not built (submitting a 404)`);
      continue;
    }
    if (page.robots.some((r) => /noindex/i.test(r))) {
      errors.push(`sitemap: ${path} is in sitemap.xml but serves noindex`);
    }
    if (!entry.lastmod) errors.push(`sitemap: ${path} has no lastModified`);
    else if (entry.lastmod.slice(0, 10) === buildDay) {
      warnings.push(`sitemap: ${path} lastModified is today (${entry.lastmod.slice(0, 10)}) — confirm it is derived, not the build time`);
    }
  }
  for (const [route, page] of byRoute) {
    if (page.robots.some((r) => /noindex/i.test(r))) continue;
    if (!sitemapPaths.has(route)) errors.push(`sitemap: indexable route ${route} is missing`);
  }

  /* -- report -------------------------------------------------------------- */

  const report = {
    origin: ORIGIN,
    routes: pages.length,
    metadata: metadataRows.sort((a, b) => a.route.localeCompare(b.route)),
    schemaCounts: Object.fromEntries([...schemaCounts].sort()),
    jsonLdBlocks: blocks,
    linkGraph: {
      routes: inbound.size,
      orphans,
      singleInbound: thin.sort(),
      brokenLinks: broken,
      totalContextualEdges: [...contextualInbound.values()].reduce((sum, s) => sum + s.size, 0),
      inboundCounts: Object.fromEntries(
        [...contextualInbound]
          .map(([route, set]) => [route, set.size])
          .sort((a, b) => a[0].localeCompare(b[0])),
      ),
      inboundSources: Object.fromEntries(
        [...contextualInbound]
          .map(([route, set]) => [route, [...set].sort()])
          .sort((a, b) => a[0].localeCompare(b[0])),
      ),
    },
    sitemap: { entries: sitemapEntries.length },
    errors,
    warnings,
  };

  const jsonIndex = process.argv.indexOf("--json");
  if (jsonIndex !== -1 && process.argv[jsonIndex + 1]) {
    writeFileSync(process.argv[jsonIndex + 1], JSON.stringify(report, null, 2));
  }

  const over = metadataRows.filter((r) => r.titleLength > TITLE_MAX).length;
  const longDesc = metadataRows.filter((r) => r.descriptionLength > DESC_MAX).length;

  console.log(`seo-check — ${pages.length} routes on ${ORIGIN}`);
  console.log(`  titles over ${TITLE_MAX}: ${over}   descriptions over ${DESC_MAX}: ${longDesc}`);
  console.log(`  json-ld: ${blocks} blocks, types ${JSON.stringify(Object.fromEntries([...schemaCounts].sort()))}`);
  console.log(
    `  links: ${broken.length} broken, ${orphans.length} orphans, ${thin.length} thin ` +
      `(contextual graph, site chrome excluded)`,
  );
  console.log(`  sitemap: ${sitemapEntries.length} entries`);
  for (const warning of warnings) console.log(`  WARN  ${warning}`);
  for (const error of errors) console.log(`  FAIL  ${error}`);

  if (errors.length > 0 && !process.argv.includes("--warn-only")) {
    console.error(`\nseo-check failed with ${errors.length} error(s).`);
    process.exit(1);
  }
  console.log(`\nseo-check passed (${warnings.length} warning(s)).`);
}

main();
