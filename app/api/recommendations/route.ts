import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { client } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Fetch candidate products from same/related categories
const CANDIDATES_QUERY = defineQuery(`
  *[
    _type == "product"
    && _id != $excludeId
    && stock > 0
    && (
      category->slug.current == $categorySlug
      || category->parentCategory->slug.current == $parentSlug
    )
  ] | order(_createdAt desc) [0...20] {
    _id,
    name,
    "slug": slug.current,
    price,
    description,
    "image": images[0].asset->url,
    "categoryTitle": category->title,
  }
`);

// Fallback — if not enough in category, grab recent products
const FALLBACK_QUERY = defineQuery(`
  *[
    _type == "product"
    && _id != $excludeId
    && stock > 0
  ] | order(_createdAt desc) [0...30] {
    _id,
    name,
    "slug": slug.current,
    price,
    description,
    "image": images[0].asset->url,
    "categoryTitle": category->title,
  }
`);

export async function POST(req: Request) {
  try {
    const { productId, productName, categorySlug, parentSlug, description, price } =
      await req.json();

    if (!productId || !productName) {
      return NextResponse.json({ recommendations: [] });
    }

    // Fetch candidates
    let candidates = await client.fetch(CANDIDATES_QUERY, {
      excludeId: productId,
      categorySlug: categorySlug ?? "",
      parentSlug: parentSlug ?? "",
    });

    // If fewer than 6 candidates, use fallback
    if (!candidates || candidates.length < 6) {
      const fallback = await client.fetch(FALLBACK_QUERY, { excludeId: productId });
      candidates = fallback;
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Build catalog string for Claude
    const catalog = candidates
      .map(
        (p: any) =>
          `ID:${p._id} | ${p.categoryTitle ?? "General"} | ${p.name} | ₦${p.price?.toLocaleString()} | ${p.description?.slice(0, 80) ?? ""}`
      )
      .join("\n");

    // Ask Claude to pick the best 4
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `A customer is viewing: "${productName}" (₦${price?.toLocaleString()}, ${categorySlug})
${description ? `Description: ${description.slice(0, 120)}` : ""}

From these available products, pick exactly 4 that a customer viewing this product would most likely also want to buy. Consider complementary use, similar category, or natural upgrades.

Available products:
${catalog}

Respond ONLY with a JSON array of 4 product IDs, nothing else. Example: ["id1","id2","id3","id4"]`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text.trim() : "[]";

    let pickedIds: string[] = [];
    try {
      pickedIds = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      // fallback to first 4
      pickedIds = candidates.slice(0, 4).map((p: any) => p._id);
    }

    // Enrich with full product data
    const recommendations = pickedIds
      .map((id: string) => candidates.find((p: any) => p._id === id))
      .filter(Boolean)
      .slice(0, 4);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json({ recommendations: [] });
  }
}