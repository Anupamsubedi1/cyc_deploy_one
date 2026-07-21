import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * There was no robots.txt, so the request fell through to the app's HTML 404 —
 * which is what Lighthouse reported as "robots.txt is not valid".
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/en/api/",
          "/ne/api/",
          "/en/admin/",
          "/ne/admin/",
          "/en/dashboard/",
          "/ne/dashboard/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
