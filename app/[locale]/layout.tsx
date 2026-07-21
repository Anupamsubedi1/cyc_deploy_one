import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Noto_Sans_Devanagari } from "next/font/google";
import { TopContactBar } from "@/components/TopContactBar";
import "../globals.css";
import BottomMarquee from "@/components/BottomMarquee";
import GoToTopButton from "@/components/GoToTopButton";
import LoadingBarProvider from "@/components/LoadingBar";

// next-intl imports
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SessionProvider } from "next-auth/react";
import { getSiteUrl } from "@/lib/site-url";

/**
 * These three were previously pulled in with `@import url(fonts.googleapis.com)`
 * from inside three separate component <style> blocks. An @import in a stylesheet
 * is render-blocking and can only be discovered *after* the stylesheet itself has
 * downloaded, which is what built the 2.5s critical path in Lighthouse:
 * html -> css chunk -> googleapis css -> 5 gstatic woff2 files.
 *
 * next/font self-hosts the files at build time, so they are same-origin, get a
 * <link rel="preload"> in the initial HTML, and cost no extra DNS/TLS handshake.
 */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Only renders Nepali copy, so preloading it on every English page is dead
// weight — let it load on demand when a Devanagari glyph is actually painted.
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  preload: false,
});

const SITE_NAME = "CYC Nepal Laghubitta Bittiya Sanstha Ltd.";

const DESCRIPTIONS: Record<string, string> = {
  en: "CYC Nepal Laghubitta Bittiya Sanstha Ltd. is a Nepal Rastra Bank licensed microfinance institution based in Pokhara, offering savings, deposit and microcredit services across all seven provinces of Nepal.",
  ne: "सीवाईसी नेपाल लघुवित्त वित्तीय संस्था लिमिटेड नेपाल राष्ट्र बैंकबाट इजाजतपत्र प्राप्त लघुवित्त संस्था हो, जसले पोखरालाई केन्द्र बनाई नेपालका सातै प्रदेशमा बचत, निक्षेप र लघुकर्जा सेवा प्रदान गर्दछ।",
};

/**
 * Per-locale metadata. The previous static export gave both locales the same
 * English title/description and emitted no canonical, no hreflang pair and no
 * social card, so the en/ne versions competed as duplicates in search results.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = getSiteUrl();
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.en;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_NAME,
      // Child pages set only their own title; the brand is appended here.
      template: `%s | ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        ne: `${siteUrl}/ne`,
        "x-default": `${siteUrl}/en`,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      url: `${siteUrl}/${locale}`,
      locale: locale === "ne" ? "ne_NP" : "en_US",
      images: [
        {
          url: "/cyc-logo.jpg",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: ["/cyc-logo.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const locales = ['en', 'ne'];
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const siteUrl = getSiteUrl();

  /*
    Organization + LocalBusiness graph. Gives search engines (and the LLM
    crawlers the Agentic Browsing category cares about) an unambiguous record
    of who operates the site, where the head office is and how to reach it,
    rather than leaving them to infer it from the footer markup.
  */
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "FinancialService"],
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        alternateName: "CYC Nepal Laghubitta",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/cyc-logo.jpg`,
          width: 220,
          height: 85,
        },
        description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
        areaServed: { "@type": "Country", name: "Nepal" },
        address: {
          "@type": "PostalAddress",
          streetAddress: "Sabhagriha Chowk, Pokhara Metropolitan City-8",
          addressLocality: "Pokhara",
          addressRegion: "Gandaki Province",
          addressCountry: "NP",
        },
        geo: { "@type": "GeoCoordinates", latitude: 28.2104261, longitude: 83.9456964 },
        telephone: ["+977-61-590894", "+977-61-590895"],
        email: "info@cycnlbsl.org.np",
        sameAs: ["https://www.facebook.com/cycnlbsl"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: "+977-61-590894",
            email: "info@cycnlbsl.org.np",
            areaServed: "NP",
            availableLanguage: ["en", "ne"],
          },
          {
            "@type": "ContactPoint",
            contactType: "complaints",
            name: "Grievance Handling Officer",
            telephone: "+977-9857646225",
            areaServed: "NP",
            availableLanguage: ["en", "ne"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: locale === "ne" ? "ne-NP" : "en-US",
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${dmSerifDisplay.variable} ${notoSansDevanagari.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* The hero image is served from Cloudinary; opening the connection
            during HTML parse takes the DNS + TLS handshake off the LCP path. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script
          type="application/ld+json"
          // Serialised from an object literal built above — no user input
          // reaches it, so there is nothing to escape.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SessionProvider>
           <NextIntlClientProvider messages={messages}>
              <LoadingBarProvider>
                <TopContactBar />
                {children}
                <GoToTopButton />
                <BottomMarquee />
              </LoadingBarProvider>
            </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
