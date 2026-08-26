import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/seo/og";
import { staticRoute } from "@/lib/seo/routes";

/**
 * The site's default Open Graph card.
 *
 * Next resolves `opengraph-image` from the route segment tree, so this one
 * covers every route that does not have a nearer one: the hub, the five
 * site-level trust pages, the glossary and the guides index. The five sections
 * and the guide articles each supply their own.
 *
 * `runtime` is left at the default. These routes are fully prerendered at
 * build — every page that uses them is static — so the card is a PNG on disk
 * before a request ever arrives, and pinning the edge runtime would only
 * constrain the renderer for no gain. There is nothing dynamic to serve.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Bracketsight — five decision engines for US money rules";

export default function OpengraphImage() {
  const route = staticRoute("/");

  return new ImageResponse(
    (
      <OgCard
        headline={route.ogHeadline}
        strap={route.ogStrap}
        section={null}
        kicker="Decision engines"
      />
    ),
    { ...OG_SIZE },
  );
}
