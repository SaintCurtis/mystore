// app/api/recommendations/route.ts  — PATCHED
// Handles SmartWelcome recommendation requests.
// Takes an array of query terms (from referrer + localStorage history),
// searches Sanity for matching products, and returns the top matches.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: true,
  token: process.env.SANITY_API_READ_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { queries, source } = await req.json() as {
      queries: string[];
      categories?: string[];
      source?: string;
    };

    if (!queries?.length) {
      return NextResponse.json({ products: [] });
    }

    // Build a GROQ search that looks across name, description, and category
    // for any of the query terms (OR logic — generous matching)
    const searchTerms = queries
      .flatMap((q: string) => q.toLowerCase().split(/\s+/))
      .filter((t: string) => t.length > 2) // skip short words
      .slice(0, 12); // cap at 12 terms

    if (searchTerms.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Build GROQ filter: match if any term appears in name or category
    const termFilters = searchTerms
      .map((_: string, i: number) => `(pt::text(name) match $term${i} || pt::text(category->title) match $term${i})`)
      .join(" || ");

    const params: Record<string, string | number> = { stock: 0 };
    searchTerms.forEach((term: string, i: number) => {
      params[`term${i}`] = `*${term}*`;
    });

    const products = await serverClient.fetch(
      `*[_type == "product" && stock > $stock && (${termFilters})] | order(featured desc, stock desc) [0...8] {
        _id,
        name,
        "slug": slug.current,
        price,
        "imageUrl": images[0].asset->url,
        "category": category->title,
      }`,
      params
    );

    // Add a reason label for each product based on which query matched
    const withReasons = (products as Array<{
      _id: string;
      name: string;
      slug: string;
      price: number;
      imageUrl?: string;
      category?: string;
    }>).map((p) => {
      const nameLower = p.name?.toLowerCase() ?? "";
      const catLower = p.category?.toLowerCase() ?? "";
      const matchedQuery = queries.find((q: string) =>
        q.toLowerCase().split(/\s+/).some((t: string) => nameLower.includes(t) || catLower.includes(t))
      );
      return {
        ...p,
        reason: matchedQuery ? `Matches "${matchedQuery}"` : "Based on your history",
      };
    });

    return NextResponse.json({ products: withReasons });
  } catch (err) {
    console.error("[recommendations]", err);
    return NextResponse.json({ products: [] });
  }
}