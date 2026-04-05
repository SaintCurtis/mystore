import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Fetch available products from Sanity filtered by budget
const PRODUCTS_FOR_SETUP_QUERY = defineQuery(`
  *[
    _type == "product"
    && stock > 0
    && price >= $minPrice
    && price <= $maxPrice
  ] | order(price asc) [0...60] {
    _id,
    name,
    "slug": slug.current,
    price,
    description,
    "image": images[0].asset->url,
    "categoryTitle": category->title,
    "categorySlug": category->slug.current,
    "parentCategory": category->parentCategory->title,
    brand->{ title },
    material,
    color,
  }
`);

// Budget ranges in NGN
const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  "under-300k":   { min: 0,         max: 300000 },
  "300k-700k":    { min: 0,         max: 700000 },
  "700k-1.5m":    { min: 0,         max: 1500000 },
  "1.5m-plus":    { min: 0,         max: 99999999 },
};

const USE_CASE_LABELS: Record<string, string> = {
  gaming: "Gaming",
  work: "Work / Business / Productivity",
  "content-creation": "Content Creation (Video, Photo, Streaming)",
  student: "Student (Study, Assignments, Portability)",
};

export async function POST(req: Request) {
  try {
    const { useCase, budget, preferences } = await req.json();

    if (!useCase || !budget) {
      return NextResponse.json({ error: "Missing useCase or budget" }, { status: 400 });
    }

    const range = BUDGET_RANGES[budget] ?? { min: 0, max: 99999999 };

    // Fetch products from Sanity
    const products = await client.fetch(PRODUCTS_FOR_SETUP_QUERY, {
      minPrice: range.min,
      maxPrice: range.max,
    });

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found in this budget range" },
        { status: 404 }
      );
    }

    // Build product catalog for AI
    const catalog = products
      .map((p: any) => `ID:${p._id} | ${p.categoryTitle ?? p.parentCategory ?? "General"} | ${p.name} | ₦${p.price?.toLocaleString()} | ${p.description?.slice(0, 120) ?? ""}`)
      .join("\n");

    const budgetLabel = budget.replace(/-/g, " ").replace("k", ",000").replace("m", "M");
    const useCaseLabel = USE_CASE_LABELS[useCase] ?? useCase;

    // Call Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are an expert tech advisor for The Saint's TechNet, a premium Nigerian tech store. 
A customer wants to build a complete ${useCaseLabel} setup with a budget of ${budgetLabel} NGN.
${preferences ? `Additional preferences: ${preferences}` : ""}

Here are the available products (ID | Category | Name | Price | Description):
${catalog}

Select 2-5 products that together make the BEST complete setup for this customer's use case and budget.
- Prioritize the most important item (e.g. laptop/computer for work/gaming)
- Add complementary items that genuinely add value (monitor, accessories, peripherals)
- Don't exceed the budget if possible, but mention if necessary
- Each item must be from the catalog above
- Give a brief reason why each item was chosen (1-2 sentences)

Respond ONLY with valid JSON in this exact format:
{
  "title": "Short catchy setup name (e.g. 'The Ultimate Gaming Rig')",
  "summary": "2-3 sentence explanation of why this setup is perfect for the customer",
  "items": [
    {
      "_id": "product_id_from_catalog",
      "reason": "Why this specific product was chosen for this setup"
    }
  ]
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    let aiResponse: { title: string; summary: string; items: { _id: string; reason: string }[] };
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      aiResponse = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI response parsing failed" }, { status: 500 });
    }

    // Enrich items with full product data
    const enrichedItems = aiResponse.items
      .map((aiItem) => {
        const product = products.find((p: any) => p._id === aiItem._id);
        if (!product) return null;
        return {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          categoryTitle: product.categoryTitle ?? product.parentCategory,
          reason: aiItem.reason,
        };
      })
      .filter(Boolean);

    const totalPrice = enrichedItems.reduce((sum: number, item: any) => sum + (item.price ?? 0), 0);

    return NextResponse.json({
      title: aiResponse.title,
      summary: aiResponse.summary,
      items: enrichedItems,
      totalPrice,
    });

  } catch (error) {
    console.error("Build setup error:", error);
    return NextResponse.json({ error: "Failed to generate setup" }, { status: 500 });
  }
}