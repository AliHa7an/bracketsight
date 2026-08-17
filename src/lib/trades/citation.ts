/**
 * Rendering a citation whose source does not exist yet.
 *
 * The three trades pricing rulesets carry
 * `https://example.invalid/pricing-methodology` as their citation URL. That is
 * deliberate and correct in the data: `.invalid` is a reserved TLD, it can
 * never resolve, and using it makes the placeholder impossible to mistake for a
 * real source (GAP-031 — closing it needs a commercial cost-data licence, not a
 * code change).
 *
 * What was not correct was rendering it as a live link. Every citation marker
 * on the trades tool and its pricing page pointed at a hostname that fails DNS,
 * on a site whose central claim is that every rule is cited — so the one thing
 * a sceptical reader would definitely click was the one thing guaranteed to
 * break.
 *
 * This maps an unresolvable citation onto something honest: the label says
 * there is no published source, and the link goes to the on-site page that
 * explains what the placeholder pricing actually rests on. A reader following
 * it lands on an explanation rather than a DNS error, and nothing claims a
 * source that does not exist.
 *
 * Purely presentational. No rule file is touched, and the day a licensed source
 * lands the citation stops matching and renders as an ordinary outbound link
 * with no change here.
 */

/** Where an unresolvable pricing citation points instead. */
export const PRICING_BASIS_PATH = "/trades/pricing-methodology";

export type RenderableCitation = { label: string; url: string; lastVerified: string };

/**
 * True for a URL that can never resolve: the reserved TLDs from RFC 2606 and
 * RFC 6761, plus anything that will not parse as a URL at all.
 */
export function isUnresolvableCitationUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return /(^|\.)(invalid|example|test|localhost)$/i.test(hostname);
  } catch {
    return true;
  }
}

/**
 * The citation as it should be shown to a reader. Unchanged when the source is
 * real, which is every citation on the site outside trades pricing.
 */
export function renderableCitation(citation: RenderableCitation): RenderableCitation {
  if (!isUnresolvableCitationUrl(citation.url)) return citation;
  return {
    ...citation,
    label: `${citation.label} — no published source URL yet`,
    url: PRICING_BASIS_PATH,
  };
}
