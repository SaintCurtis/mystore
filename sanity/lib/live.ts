import { defineLive } from "next-sanity/live";
import { client } from "./client";

// ── Both tokens required to prevent redirect to sanity.io/login ──────────
// Without serverToken + browserToken, SanityLive redirects any visitor
// (including your admin dashboard) to Sanity's own login page.
const token = process.env.SANITY_API_READ_TOKEN;

if (!token) {
  throw new Error(
    "Missing SANITY_API_READ_TOKEN — add it to .env.local and Vercel environment variables"
  );
}

const {
  sanityFetch: _sanityFetch,
  SanityLive,
} = defineLive({
  client: client.withConfig({ useCdn: false, stega: false }),
  serverToken: token,
  browserToken: token,
});

// Every $param that appears in any defineQuery() across the codebase.
// Next.js tag-sync dry-runs ALL registered queries with zero params —
// this ensures every $param has a safe falsy value so the client
// validation passes without touching the actual query logic.
const PARAM_DEFAULTS: Record<string, unknown> = {
  slug: "",
  searchQuery: "",
  categorySlug: "",
  condition: "",
  brandSlug: "",
  modelSlug: "",
  color: "",
  material: "",
  minPrice: 0,
  maxPrice: 0,
  inStock: false,
  ids: [],
};

export { SanityLive };

export function sanityFetch(
  args: Parameters<typeof _sanityFetch>[0],
): ReturnType<typeof _sanityFetch> {
  return _sanityFetch({
    ...args,
    params: { ...PARAM_DEFAULTS, ...(args.params ?? {}) },
  } as Parameters<typeof _sanityFetch>[0]);
}