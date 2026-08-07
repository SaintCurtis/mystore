/**
 * Single source of truth for the site's public base URL.
 *
 * Set NEXT_PUBLIC_SITE_URL in your environment (.env.local for dev,
 * Vercel Project Settings → Environment Variables for production) to your
 * real domain, e.g. https://saintstechnet.com — every part of the app
 * (metadata, sitemap, robots.txt, JSON-LD, share links, checkout/payment
 * callback URLs, transactional emails) reads from here instead of a
 * hardcoded string or Vercel's internal VERCEL_URL.
 *
 * If NEXT_PUBLIC_SITE_URL is missing:
 *   - in production, falls back to the last-known live URL (fails safe —
 *     never leaks Vercel's internal, auth-walled deployment URL to a
 *     customer mid-checkout)
 *   - in development, falls back to localhost, so callback URLs (Paystack,
 *     negotiate, referral) round-trip correctly on your own machine
 */
const PRODUCTION_FALLBACK = "https://mystore-drab-nine.vercel.app";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_FALLBACK : "http://localhost:3000");
