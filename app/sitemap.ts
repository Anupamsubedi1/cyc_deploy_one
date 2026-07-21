import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const LOCALES = ["en", "ne"] as const;

/** Public, indexable routes. Admin, dashboard and API paths are excluded. */
const ROUTES = [
  "",
  "/about-us",
  "/about-us/chairman-message",
  "/about-us/board-of-directors",
  "/about-us/management-team",
  "/message-from-ceo",
  "/loans",
  "/loans/loan-categories",
  "/loans/emi-calculator",
  "/loans/loan-interest-calculator",
  "/savings",
  "/financial-highlights",
  "/financial-highlights/annual-reports",
  "/financial-highlights/quarterly-reports",
  "/financial-highlights/base-rate",
  "/branches/koshi",
  "/branches/madesh",
  "/branches/bagmati",
  "/branches/gandaki",
  "/branches/lumbini",
  "/branches/karnali",
  "/branches/sudurpashchim",
  "/news",
  "/notices",
  "/news-notices",
  "/contact",
  "/gunaso",
  "/vacancies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return ROUTES.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: `${siteUrl}/${locale}${route}`,
      lastModified,
      changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
      priority: route === "" ? 1 : 0.7,
      // Declares the en/ne pair to search engines so the two locales are
      // treated as translations rather than duplicate content.
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${siteUrl}/${l}${route}`]),
        ),
      },
    })),
  );
}
