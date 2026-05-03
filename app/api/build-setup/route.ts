import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const PRODUCTS_FOR_SETUP_QUERY = `*[
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
}`;

// ── Realistic 2026 Nigerian market budget ranges ───────────────────────────
//
//  under-600k  →  Entry level: budget laptops, student essentials
//  600k-1.2m   →  Mid range:   solid work laptops, entry-level gaming
//  1.2m-2.5m   →  High perf:   real gaming rigs, content creation builds
//  2.5m-plus   →  Premium:     flagship laptops, MacBooks, full pro setups
//
//  NOTE: min is always 0 so the AI can mix high-value anchors (e.g. a
//  ₦550k laptop) with lower-priced accessories and still stay in budget.
// ──────────────────────────────────────────────────────────────────────────
const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  "under-600k":  { min: 0, max: 600_000   },
  "600k-1.2m":   { min: 0, max: 1_200_000 },
  "1.2m-2.5m":   { min: 0, max: 2_500_000 },
  "2.5m-plus":   { min: 0, max: 99_999_999 },
};

// Human-readable labels sent to the AI prompt
const BUDGET_LABELS: Record<string, string> = {
  "under-600k": "Under ₦600,000",
  "600k-1.2m":  "₦600,000 – ₦1,200,000",
  "1.2m-2.5m":  "₦1,200,000 – ₦2,500,000",
  "2.5m-plus":  "₦2,500,000+",
};

const USE_CASE_LABELS: Record<string, string> = {
  gaming:             "Gaming",
  work:               "Work / Business / Productivity",
  "content-creation": "Content Creation (Video, Photo, Streaming)",
  student:            "Student (Study, Assignments, Portability)",
};

export async function POST(req: Request) {
  try {
    const { useCase, budget, preferences } = await req.json();

    if (!useCase || !budget) {
      return NextResponse.json({ error: "Missing useCase or budget" }, { status: 400 });
    }

    const range = BUDGET_RANGES[budget] ?? { min: 0, max: 99_999_999 };

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

    const catalog = products
      .map((p: any) =>
        `ID:${p._id} | ${p.categoryTitle ?? p.parentCategory ?? "General"} | ${p.name} | ₦${p.price?.toLocaleString()} | ${p.description?.slice(0, 120) ?? ""}`
      )
      .join("\n");

    const budgetLabel = BUDGET_LABELS[budget] ?? budget;
    const useCaseLabel = USE_CASE_LABELS[useCase] ?? useCase;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are an expert tech advisor for The Saint's TechNet, a premium Nigerian tech store run by a Computer Engineer.
A customer wants to build a complete ${useCaseLabel} setup with a budget of ${budgetLabel} NGN.
${preferences ? `Additional preferences: ${preferences}` : ""}

Here are the available products (ID | Category | Name | Price | Description):
${catalog}

Select 2-5 products that together make the BEST complete setup for this customer's use case and budget.
- The most important item (laptop/PC/monitor) must come first
- Add only accessories that genuinely complement the main item
- The combined total should stay within or close to the stated budget
- Every item must exist in the catalog above — never invent products
- Give a brief, specific reason why each item suits this customer (1-2 sentences)

Respond ONLY with valid JSON in this exact format (no markdown, no backticks):
{
  "title": "Short catchy setup name (e.g. 'The Lagos Gaming Beast')",
  "summary": "2-3 sentence explanation of why this setup is perfect for the customer's needs and budget",
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

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let aiResponse: {
      title: string;
      summary: string;
      items: { _id: string; reason: string }[];
    };

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      aiResponse = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI response parsing failed" },
        { status: 500 }
      );
    }

    const enrichedItems = aiResponse.items
      .map((aiItem) => {
        const product = products.find((p: any) => p._id === aiItem._id);
        if (!product) return null;
        return {
          _id:           product._id,
          name:          product.name,
          slug:          product.slug,
          price:         product.price,
          image:         product.image,
          categoryTitle: product.categoryTitle ?? product.parentCategory,
          reason:        aiItem.reason,
        };
      })
      .filter(Boolean);

    const totalPrice = enrichedItems.reduce(
      (sum: number, item: any) => sum + (item.price ?? 0),
      0
    );

    return NextResponse.json({
      title:      aiResponse.title,
      summary:    aiResponse.summary,
      items:      enrichedItems,
      totalPrice,
    });
  } catch (error) {
    console.error("Build setup error:", error);
    return NextResponse.json(
      { error: "Failed to generate setup" },
      { status: 500 }
    );
  }
}