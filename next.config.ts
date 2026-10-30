import type { NextConfig } from "next";

// Sent with every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

// Private areas (admin screens, admin APIs, push) must never be stored by a
// browser, the service worker's HTTP cache, or a CDN.
const neverCache = { key: "Cache-Control", value: "no-store, max-age=0" };

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/sanity/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // The receipt PDF renderer reads its fonts from disk at request time. This
  // makes sure those files are bundled into the serverless functions that
  // need them (otherwise they can be left out of the deployment).
  outputFileTracingIncludes: {
    "/api/admin/receipts/**": ["./lib/receipts/assets/**/*"],
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },

      // Admin area: private, never cached, never framed, never indexed.
      {
        source: "/admin/:path*",
        headers: [
          neverCache,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      { source: "/api/admin/:path*", headers: [neverCache] },
      { source: "/api/push/:path*", headers: [neverCache] },
      { source: "/push/:path*", headers: [neverCache] },

      // The service worker must always be re-checked so updates reach people.
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
