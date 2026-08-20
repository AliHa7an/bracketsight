import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Instrument_Serif,
  Public_Sans,
} from "next/font/google";

import "@/styles/globals.css";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/*
 * Four faces, four roles. `next/font/google` downloads at BUILD time and
 * serves the files from our own origin — there is no runtime request to
 * Google, which is what the "never a font CDN" rule protects (Core Web Vitals
 * and privacy at once). Each face declares only the weights the system
 * actually uses; an unused weight is bytes on the critical path.
 *
 * The `variable` names are the contract with globals.css, which maps them onto
 * --font-display, --font-serif, --font-body and --font-data. Renaming one here
 * silently drops the whole site to a system fallback.
 */
/*
 * The section display face: h1 and h2 inside a tool, and nowhere else.
 *
 * ONE WEIGHT, NOT PRELOADED, and both of those are deliberate. globals.css sets
 * `h1, h2 { font-weight: 600 }` and nothing on the site asks Bricolage for 500
 * or 700, so shipping them was two files nobody rendered. And it is used on no
 * home-page element at all — the redesigned hub sets its headings in the serif
 * and the body face — so preloading it put three requests on the critical path
 * of the page that needs none of them. It now loads when a glyph actually needs
 * it, behind `display: swap`, which costs a tool page's h1 a late swap and buys
 * every page a shorter critical path.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
});

/*
 * The rationed face. It appears three times on the home page — the headline,
 * the section titles, the card question — and once at the top of each policy
 * page. It is never set below 20px, where a display serif stops being legible
 * and starts being decoration.
 *
 * BOTH CUTS, 400 ONLY. Instrument Serif ships one weight, so the home page's
 * headline cannot be made heavier — the second line of it is set in the real
 * italic instead, which is a genuine second cut rather than a synthesised
 * oblique. `font-style: italic` against a family with no italic file makes the
 * browser shear the roman, and a sheared display serif at 49px is the single
 * most obvious way to look cheap. Loading the file is what buys the right to
 * use it.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: true,
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"], // body: prose and every piece of UI chrome
  variable: "--font-public-sans",
  display: "swap",
  preload: true,
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"], // data: every number, date, rule version and ID
  variable: "--font-plex-mono",
  display: "swap",
  preload: true,
});

/*
 * `metadataBase` is read from configuration, never written as a literal. It is
 * what Next resolves every relative canonical, Open Graph URL and image
 * against, so a hardcoded production domain here would make preview
 * deployments advertise themselves as production — the exact defect the old
 * repos shipped. See src/lib/site.ts.
 *
 * `metadata.icons` is deliberately absent: Next's file convention serves
 * src/app/icon.svg and emits the <link> itself. Declaring it here would
 * produce a duplicate tag pointing at a path that no longer content-hashes.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — decision engines for US money rules`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: `${SITE_NAME} — decision engines for US money rules`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

/**
 * Site-level Organization markup. Only claims things a visitor can verify on
 * the page: the name, the origin, and an email address that is rendered as
 * visible text in the footer and on /contact.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  email: CONTACT_EMAIL,
  description:
    "Independent decision engines for US federal and local money rules. Every rule is cited to its primary source and dated. Nothing a visitor enters is stored.",
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "corrections and support",
      email: CONTACT_EMAIL,
      url: absoluteUrl("/contact"),
      availableLanguage: ["en"],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
      `en-US` rather than `en`: every rule on this site is a US federal, state
      or county rule, every figure is USD and every date is read in the US
      calendar. The regional subtag is what tells a browser, a screen reader
      and a translation layer which English this is.
    */
    <html
      lang="en-US"
      className={`${bricolage.variable} ${instrumentSerif.variable} ${publicSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        {/*
          THE THEME, BEFORE THE FIRST PAINT.

          Two lines of blocking script, first thing in the body, so the ground
          colour is decided before anything is drawn. Without it a reader who
          has chosen dark gets a white flash on every navigation that is not a
          client-side one — the single most visible bug a theme toggle can
          have, and one that cannot be fixed after hydration because by then the
          wrong paint has already happened.

          It only ever stamps `data-theme` when the reader has made an explicit
          choice. With no choice stored the attribute stays absent and the
          `prefers-color-scheme` rules in globals.css decide, which is what
          "respect the system by default" has to mean. `suppressHydrationWarning`
          on <html> is required because this attribute is, by design, present in
          the DOM and absent from the server's markup.
        */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("bracketsight-theme");' +
              'if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}',
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

        {/*
          The skip link is the first focusable thing on every page. Off-screen
          until focused, then it lands in the top-left over the header — no
          layout shift, because it is positioned, not inserted.
        */}
        <a
          href="#main"
          className="sr-only rounded-atlas focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>

        <SiteHeader />

        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <Breadcrumbs />
          {children}
        </main>

        <SiteFooter />

        {/*
          The consent banner is fixed to the bottom of the viewport and is
          therefore outside the layout flow: it cannot move a pixel of the page,
          whatever it decides to render. It also renders nothing at all on the
          server and nothing on the first client paint — see the component.
        */}
        <ConsentBanner />
      </body>
    </html>
  );
}
