/**
 * The metadata bounds, and the assertion that enforces them at build time.
 *
 * These are not style preferences. A `<title>` past ~60 characters is replaced
 * in the result by whatever Google decides the page is about, which on a YMYL
 * finance page means losing control of the one line that has to say "this is
 * an estimate from cited rules" rather than "free money calculator". A
 * description past ~155 is truncated mid-clause, and the clause that gets cut
 * is always the last one — which on these pages is the qualification.
 *
 * They are asserted where the values are DECLARED, not where they are
 * rendered, so a title that is four characters too long fails `next build`
 * with the route named, rather than surfacing in Search Console six weeks
 * later next to a ranking that already moved.
 *
 * WHY THE TITLE IS THE FULL STRING AND NOT A TEMPLATE FRAGMENT.
 *
 * The root layout used to carry `template: "%s · Bracketsight"`, and three
 * section layouts carried a second one — `"%s · Health cover · Bracketsight"`.
 * A page author writing a 51-character title shipped an 82-character one and
 * had no way to see it: the suffix is applied by the framework, after the file
 * that chose the words. Forty-three of fifty-five routes were over the limit
 * that way, every one of them written by somebody who thought they were under
 * it. Titles are now declared whole and emitted with `title.absolute`, so the
 * string measured here is the string in the `<head>` — and the brand is
 * carried by `og:site_name`, `applicationName` and the `WebSite` node, which
 * is where a machine reads it from anyway.
 */

/** Google renders roughly 580px of title; 60 characters is the safe ceiling. */
export const TITLE_MAX = 60;

/** Past this the snippet is truncated, and the tail is where the caveat is. */
export const DESCRIPTION_MAX = 155;

/**
 * Under this the slot is being wasted. A warning rather than an error: a short
 * description is a missed opportunity, not a defect, and there are pages whose
 * honest summary is genuinely brief.
 */
export const DESCRIPTION_MIN = 70;

export interface Bounded {
  readonly path: string;
  readonly title: string;
  readonly description: string;
}

/**
 * Asserts the whole registry at once: every title within bounds, every
 * description within bounds, and both unique across every route on the site.
 *
 * Uniqueness matters as much as length. Two routes with the same title is how
 * Search Console reports "duplicate meta descriptions" and how a crawler
 * decides two URLs are the same page — and it is the failure mode a
 * templated-from-config approach introduces if a template is coarse enough to
 * collapse two routes onto one string. Checking it here means the config
 * cannot become coarse without the build saying so.
 *
 * Throws on the first failure with every offending route listed, because
 * fixing these one build at a time is how a forty-three-route problem takes
 * forty-three builds.
 */
export function assertMetadataBounds(routes: readonly Bounded[]): void {
  const problems: string[] = [];

  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();

  for (const route of routes) {
    if (route.title.length === 0) {
      problems.push(`${route.path}: title is empty`);
    } else if (route.title.length > TITLE_MAX) {
      problems.push(
        `${route.path}: title is ${String(route.title.length)} chars, max ${String(TITLE_MAX)} — "${route.title}"`,
      );
    }

    if (route.description.length === 0) {
      problems.push(`${route.path}: description is empty`);
    } else if (route.description.length > DESCRIPTION_MAX) {
      problems.push(
        `${route.path}: description is ${String(route.description.length)} chars, max ${String(DESCRIPTION_MAX)}`,
      );
    }

    const titleOwner = titles.get(route.title);
    if (titleOwner) problems.push(`duplicate title on ${titleOwner} and ${route.path}: "${route.title}"`);
    else titles.set(route.title, route.path);

    const descriptionOwner = descriptions.get(route.description);
    if (descriptionOwner) {
      problems.push(`duplicate description on ${descriptionOwner} and ${route.path}`);
    } else descriptions.set(route.description, route.path);
  }

  if (problems.length > 0) {
    throw new Error(
      `Metadata bounds failed for ${String(problems.length)} route(s):\n` +
        problems.map((problem) => `  • ${problem}`).join("\n") +
        `\n\nTitles are capped at ${String(TITLE_MAX)} characters and descriptions at ` +
        `${String(DESCRIPTION_MAX)}, and both must be unique per route. See ` +
        `src/lib/seo/constraints.ts for why, and src/lib/seo/routes.ts to fix. ` +
        `Do not relax the bound to get a build through.`,
    );
  }
}
