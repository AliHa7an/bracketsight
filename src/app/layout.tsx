import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Public_Sans } from "next/font/google";

import "@/styles/globals.css";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/*
 * Three faces, three roles. `next/font/google` downloads at BUILD time and
 * serves the files from our own origin — there is no runtime request to
 * Google, which is what the "never a font CDN" rule protects (Core Web Vitals
 * and privacy at once). Each face declares only the weights the system
 * actually uses; an unused weight is bytes on the critical path.
 *
 * The `variable` names are the contract with globals.css, which maps them onto
 * --font-display, --font-body and --font-data. Renaming one here silently
 * drops the whole site to a system fallback.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"], // display: h1/h2 only
  variable: "--font-bricolage",
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
      className={`${bricolage.variable} ${publicSans.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
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
