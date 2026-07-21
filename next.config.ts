import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/**
 * Content-Security-Policy.
 *
 * Lighthouse reported "No CSP found in enforcement mode". The directives below
 * are the ones that actually blunt injection — `object-src 'none'` kills plugin
 * vectors, `base-uri 'self'` stops base-tag hijacking of every relative script
 * URL, and `frame-ancestors 'none'` is the modern replacement for the
 * X-Frame-Options header kept alongside it for older engines.
 *
 * Two deliberate omissions, both because they would break this app rather than
 * secure it:
 *
 * - `script-src` keeps 'unsafe-inline'. Removing it requires a per-request
 *   nonce, and the nonce has to reach the renderer through the *request*
 *   headers. Routing here goes through next-intl's middleware, which builds its
 *   own NextResponse internally, so there is no seam to inject those headers
 *   without reimplementing its rewrite handling. Worth doing, but it is a
 *   refactor of proxy.ts rather than a config change.
 * - No `require-trusted-types-for 'script'`. WelcomeSection renders CMS copy
 *   through dangerouslySetInnerHTML and the admin editor is TipTap; both assign
 *   to innerHTML, which Trusted Types blocks outright.
 *
 * Both of those Lighthouse rows are unscored diagnostics, so neither holds the
 * Best Practices score down.
 */
const isDev = process.env.NODE_ENV !== "production";

/*
  React's development build calls eval() for debugging features — reconstructing
  callstacks across environments, hot reload — and hard-fails under a CSP that
  omits 'unsafe-eval'. Its production build never does, so the allowance is
  scoped to dev and never reaches a deployed response. Dev also needs ws: for
  the HMR socket, which would otherwise be blocked by connect-src.

  NODE_ENV is "development" under `next dev` and "production" under
  `next build` / `next start`, so this switches on its own.
*/
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
  "https://www.google.com",
  "https://www.gstatic.com",
];

const connectSrc = [
  "'self'",
  ...(isDev ? ["ws:", "wss:"] : []),
  "https://res.cloudinary.com",
  "https://api.cloudinary.com",
  "https://maps.googleapis.com",
];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  // Tailwind, styled-jsx and next/image all emit inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://res.cloudinary.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com https://lh3.googleusercontent.com",
  // Fonts are self-hosted by next/font, so no third-party font origin is needed.
  "font-src 'self' data:",
  // The Maps embed and any YouTube notices render in child frames.
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com",
  `connect-src ${connectSrc.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  // Google sign-in posts back to accounts.google.com.
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  // Would rewrite http://localhost subresource requests to https in dev.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  /*
    Severs the opener relationship with any window that navigates here, so a
    malicious opener cannot reach into this document. Safe for the OAuth flow
    because next-auth signs in via full-page redirect, not a popup.

    Cross-Origin-Embedder-Policy is intentionally NOT set: `require-corp` blocks
    every subresource that does not opt in with CORP, which would take out the
    Cloudinary images and the Google Maps frame on the first page load.
  */
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // CMS-managed assets are replaced by publishing a new Cloudinary public_id,
    // so a long TTL never serves a stale image.
    minimumCacheTTL: 2678400, // 31 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  experimental: {
    optimizePackageImports: ["react-icons", "lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  /* You can add other Next.js config options here */
};

export default withNextIntl(nextConfig);
