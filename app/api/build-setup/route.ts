// app/api/build-setup/route.ts
// KEY FIX: The AI was skipping laptops because the catalog string didn't
// clearly label which products ARE laptops/computers. When it sees
// "Gaming Laptops | ASUS ROG Strix" it might not connect that to "laptop".
// Fix: tag each product with a [TYPE] label and split catalog into
// COMPUTERS/LAPTOPS section vs ACCESSORIES section, then mandate item #1
// must come from the computers section with explicit, hard language.

import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Fetch ALL in-stock products — no price filter at DB level.
// The AI receives the full catalog and the budget, and it picks
// the best combination that fits. This ensures laptops at any price
// point are visible, and the AI won't suggest a ₦3M laptop for a
// ₦600k budget — the budget constraint is enforced in the prompt.
const PRODUCTS_FOR_SETUP_QUERY = `*[
  _type == "product"
  && stock > 0
] | order(price asc) [0...150] {
  _id,
  name,
  "slug": slug.current,
  price,
  description,
  "image": images[0].asset->url,
  "categoryTitle": category->title,
  "categorySlug": category->slug.current,
  "parentCategorySlug": category->parentCategory->slug.current,
  "parentCategoryTitle": category->parentCategory->title,
  brand->{ title },
}`;

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  "under-600k": { min: 0, max: 600_000    },
  "600k-1.2m":  { min: 0, max: 1_200_000  },
  "1.2m-2.5m":  { min: 0, max: 2_500_000  },
  "2.5m-plus":  { min: 0, max: 99_999_999 },
};

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

// ── Category slug patterns that indicate a computer/laptop ────────────────
const COMPUTER_SLUGS = [
  "computers", "laptops", "gaming-laptops", "regular-laptops",
  "macbooks", "custom-pcs", "sff-computers", "desktops",
  "refurbished-laptops", "brand-new-laptops", "foreign-used-laptops",
];

function isComputer(p: any): boolean {
  const slugs = [
    p.categorySlug,
    p.parentCategorySlug,
  ].filter(Boolean).map((s: string) => s.toLowerCase());

  const name = (p.name ?? "").toLowerCase();
  const cat = (p.categoryTitle ?? "").toLowerCase();

  return (
    slugs.some((s) => COMPUTER_SLUGS.some((c) => s.includes(c))) ||
    cat.includes("laptop") ||
    cat.includes("computer") ||
    cat.includes("macbook") ||
    cat.includes("pc") ||
    name.includes("macbook") ||
    name.includes("laptop") ||
    name.includes("macmini") ||
    name.includes("mac mini") ||
    name.includes("imac")
  );
}

export async function POST(req: Request) {
  try {
    const { useCase, budget, preferences } = await req.json();

    if (!useCase || !budget) {
      return NextResponse.json({ error: "Missing useCase or budget" }, { status: 400 });
    }

    const range = BUDGET_RANGES[budget] ?? { min: 0, max: 99_999_999 };

    const products = await client.fetch(PRODUCTS_FOR_SETUP_QUERY, {});

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No products found in this budget range" }, { status: 404 });
    }

    // ── Split catalog into computers and accessories ───────────────────────
    const computers = products.filter(isComputer);
    const accessories = products.filter((p: any) => !isComputer(p));

    // Format a product line for the AI
    const fmt = (p: any, type: string) =>
      `ID:${p._id} | [${type}] | ${p.categoryTitle ?? p.parentCategoryTitle ?? "General"} | ${p.name} | ₦${p.price?.toLocaleString()} | ${p.description?.slice(0, 100) ?? ""}`;

    const computerCatalog = computers
      .map((p: any) => fmt(p, "LAPTOP/COMPUTER"))
      .join("\n");

    const accessoryCatalog = accessories
      .map((p: any) => fmt(p, "ACCESSORY"))
      .join("\n");

    const budgetLabel = BUDGET_LABELS[budget] ?? budget;
    const useCaseLabel = USE_CASE_LABELS[useCase] ?? useCase;

    // Use-case specific laptop guidance
    const useCaseGuidance: Record<string, string> = {
      gaming: "For gaming, item #1 MUST be a gaming laptop (look for ASUS ROG, MSI, Lenovo Legion, HP Omen, or any laptop described as 'gaming'). A gaming laptop is the centerpiece — everything else is secondary.",
      work: "For work/business, item #1 MUST be a laptop or MacBook. Choose something with good processing power and battery life. Dell XPS, MacBook, ThinkPad, and HP EliteBook are ideal.",
      "content-creation": "For content creation, item #1 MUST be a high-performance laptop or MacBook (MacBook Pro, ASUS ProArt, or any laptop with dedicated GPU). The laptop drives everything else.",
      student: "For a student, item #1 MUST be a laptop — portable, reliable, and affordable. A good mid-range laptop like Dell Inspiron, HP or Lenovo IdeaPad is the right choice.",
    };

    const guidance = useCaseGuidance[useCase] ?? "Item #1 MUST be a laptop or computer from the LAPTOPS/COMPUTERS section.";

    const noComputerWarning = computers.length === 0
      ? "\n⚠️ NOTE: No laptops/computers are in stock within this budget. In this case, recommend the best available products for the use case."
      : `\n✅ ${computers.length} laptop(s)/computer(s) available in budget — you MUST pick one as item #1.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are an expert tech advisor for The Saint's TechNet, a premium Nigerian tech store.
A customer wants to build a ${useCaseLabel} setup with a budget of ${budgetLabel}.
${preferences ? `Customer preferences: ${preferences}` : ""}
${noComputerWarning}

RULE #1 — MANDATORY: ${guidance}
RULE #2: Item #1 in your response MUST have type [LAPTOP/COMPUTER]. No exceptions.
RULE #3: Only add accessories that genuinely complement the main laptop.
RULE #4: The COMBINED total of ALL selected items MUST NOT EXCEED ${budgetLabel}. 
  Do NOT recommend any individual item whose price alone exceeds the total budget.
  If budget is ₦600,000 — do not pick anything over ₦600,000 individually.
  If budget is ₦1,200,000 — the laptop + all accessories combined must be ≤ ₦1,200,000.
  If budget is ₦1,200,000 — do NOT recommend an Alienware, RTX 4090/5090 laptop, or any flagship over ₦1,200,000.
RULE #5: Every product ID must exist exactly in the catalog below.

━━━ LAPTOPS & COMPUTERS (PICK ITEM #1 FROM HERE) ━━━
${computerCatalog || "None available in this budget range"}

━━━ ACCESSORIES & PERIPHERALS ━━━
${accessoryCatalog}

Format: ID | [TYPE] | Category | Name | Price | Description

Select 2-5 products. Respond ONLY with valid JSON (no markdown, no backticks):
{
  "title": "Short catchy setup name (e.g. 'The Lagos Gaming Beast')",
  "summary": "2-3 sentence explanation of why this is perfect for this customer",
  "items": [
    {
      "_id": "product_id_from_catalog",
      "reason": "Why this specific product was chosen"
    }
  ]
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    let aiResponse: { title: string; summary: string; items: { _id: string; reason: string }[] };

    try {
      aiResponse = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json({ error: "AI response parsing failed" }, { status: 500 });
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
          categoryTitle: product.categoryTitle ?? product.parentCategoryTitle,
          reason:        aiItem.reason,
          isComputer:    isComputer(product),
        };
      })
      .filter(Boolean);

    const totalPrice = enrichedItems.reduce((sum: number, item: any) => sum + (item.price ?? 0), 0);

    return NextResponse.json({
      title:      aiResponse.title,
      summary:    aiResponse.summary,
      items:      enrichedItems,
      totalPrice,
    });

  } catch (error) {
    console.error("Build setup error:", error);
    return NextResponse.json({ error: "Failed to generate setup" }, { status: 500 });
  }
}