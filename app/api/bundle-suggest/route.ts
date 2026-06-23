import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@sanity/client";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn:    true,
});

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { productName, productPrice, categorySlug } = await req.json();

    // Fetch accessories, monitors, docks, setup gear — anything that's NOT a laptop/computer
    const accessories = await sanity.fetch(`
      *[
        _type == "product"
        && stock > 0
        && !(
          category->slug.current in ["computers", "laptops", "gaming-laptops"]
          || category->parentCategory->slug.current in ["computers", "laptops", "gaming-laptops"]
        )
      ] | order(price asc) [0...60] {
        _id,
        name,
        price,
        "slug": slug.current,
        "categorySlug": category->slug.current,
        "categoryTitle": category->title,
        "image": images[0].asset->url
      }
    `);

    if (!accessories.length) {
      return NextResponse.json({ bundles: [] });
    }

    const catalogText = accessories
      .map((p: any) => `- ${p.name} | ₦${p.price.toLocaleString()} | category: ${p.categoryTitle} | id: ${p._id}`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `A customer just added this to their cart:
Product: ${productName}
Price: ₦${productPrice.toLocaleString()}
Category: ${categorySlug}

From the catalog below, pick the 3 best complementary accessories to bundle with this product.
Choose items that genuinely enhance the product — e.g. a monitor, a dock, a chair, a bag, a mouse.
Do NOT suggest another laptop or computer.
Prioritise variety — don't pick 3 of the same category.

Return ONLY valid JSON, no markdown, no explanation:
{
  "bundles": [
    { "id": "<product _id>", "reason": "<one punchy sentence why this pairs well, max 10 words>" },
    { "id": "<product _id>", "reason": "..." },
    { "id": "<product _id>", "reason": "..." }
  ]
}

Catalog:
${catalogText}`
      }]
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Hydrate with full product data
    const bundleMap = new Map(accessories.map((p: any) => [p._id, p]));
    const hydrated = parsed.bundles
      .map((b: { id: string; reason: string }) => {
        const product = bundleMap.get(b.id);
        if (!product) return null;
        return { ...product, reason: b.reason };
      })
      .filter(Boolean);

    return NextResponse.json({ bundles: hydrated });
  } catch (err) {
    console.error("[bundle-suggest]", err);
    return NextResponse.json({ bundles: [] });
  }
}