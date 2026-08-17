import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { DIRECTIONS } from "./data";
import styles from "./review.module.css";

/**
 * Wrapper for the three design-direction mockups at /design/a|b|c.
 *
 * INTERNAL REVIEW ONLY. Every page under here is noindex, and nothing under
 * here is linked from the live site — these routes exist so the owner can look
 * at three committed design theses side by side and pick one.
 *
 * Two things this layout is responsible for, and nothing else:
 *
 * 1. FONTS. The three review faces are loaded here rather than in the root
 *    layout, so the live site's critical path is untouched: a visitor to `/`
 *    or `/loans` never downloads Instrument Serif or Geist. `next/font/google`
 *    downloads at build time and self-hosts, so there is still no runtime
 *    request to Google — the same rule the live faces follow.
 *
 * 2. HIDING THE LIVE CHROME. The root layout is the only root layout in the
 *    app, so its header and footer render above and below every page including
 *    these. Reviewing a redesign with the current site's header sitting on top
 *    of it is worse than useless — it makes every direction look like a patch
 *    on the existing design rather than a replacement for it. The <style>
 *    below folds that chrome away. It is global CSS, but it only ever reaches
 *    the DOM on a /design route, because that is the only place this layout
 *    renders. Nothing here can affect the live site.
 *
 * Each direction owns its own CSS module and its own custom properties, scoped
 * to a `data-direction` wrapper, so the three cannot bleed into each other
 * either.
 */

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"], // the only weight Instrument Serif ships
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export default function DesignReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${instrumentSerif.variable} ${geist.variable} ${geistMono.variable}`}>
      <style>{`
        body > header, body > footer { display: none !important; }
        body { background: #ffffff; }
      `}</style>

      {children}

      <nav className={styles.switcher} aria-label="Design directions">
        <p className={styles.switcherLabel}>Internal design review · pick one</p>
        <ul className={styles.switcherList}>
          {DIRECTIONS.map((direction) => (
            <li key={direction.slug}>
              <Link href={`/design/${direction.slug}`} className={styles.switcherLink}>
                {direction.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
