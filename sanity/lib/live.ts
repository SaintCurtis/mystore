import { client } from "./client";

// ── SanityLive / defineLive completely removed ────────────────────────────
// defineLive's SanityLive component causes a redirect to sanity.io/login
// on production for all visitors regardless of token configuration.
// We use webhook-based revalidation (app/api/revalidate/route.ts) instead,
// which keeps content fresh without any client-side Sanity session requirement.

// Every $param that appears in any defineQuery() across the codebase.
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

// Drop-in replacement — same signature as the defineLive version
export async function sanityFetch<T>({
  query,
  params,
}: {
  query: string;
  params?: Record<string, unknown>;
}): Promise<{ data: T }> {
  const data = await client.fetch<T>(query, {
    ...PARAM_DEFAULTS,
    ...(params ?? {}),
  });
  return { data };
}

// No-op SanityLive component — keeps existing imports from breaking
export function SanityLive() {
  return null;
}