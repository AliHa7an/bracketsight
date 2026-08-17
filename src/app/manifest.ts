import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * manifest.webmanifest.
 *
 * Modest on purpose. This is a set of documents and calculators, not an app to
 * install, so the manifest exists to name the site correctly when a browser
 * pins it and to stop a mobile browser inventing a background colour behind the
 * splash. `display: "browser"` because a tool whose whole value is a citable
 * URL should keep its address bar.
 *
 * The icon is the same `src/app/icon.svg` Next already serves as the favicon —
 * one mark, one file, no raster variants to drift out of sync. It is declared
 * `purpose: "any"` and not `maskable`: claiming maskable without a designed
 * safe zone gets the mark cropped on the platforms that honour it.
 *
 * Colours are the light palette's paper and ink from globals.css, written out
 * because a manifest is static JSON and cannot read a custom property.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — decision engines for US money rules`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#f5f7fa",
    theme_color: "#14213a",
    lang: "en-US",
    dir: "ltr",
    categories: ["finance", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
