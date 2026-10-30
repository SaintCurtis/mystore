import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { failure, json } from "@/lib/receipts/http";
import { writeClient } from "@/sanity/lib/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProductHit {
  _id: string;
  name: string;
  price: number | null;
  condition: string | null;
  stock: number | null;
}

// GET /api/admin/receipts/products?q=xps 13
// Catalogue lookup so a receipt line can be filled in (name, price, condition)
// from the store's own products. Typing a free-text item still works.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const q = (new URL(req.url).searchParams.get("q") ?? "").toLowerCase();
    const tokens = q
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .slice(0, 5)
      .map((token) => `${token}*`);
    if (!tokens.length) return json({ products: [] });

    const hits = await writeClient.fetch<ProductHit[]>(
      `*[_type == "product" && !(_id in path("drafts.**")) && name match $tokens]
        | order(name asc) [0...8] {
          _id,
          name,
          price,
          "condition": condition->title,
          stock
        }`,
      { tokens },
    );

    return json({
      products: hits.map((hit) => ({
        id: hit._id,
        name: hit.name,
        price: typeof hit.price === "number" ? Math.round(hit.price) : null,
        condition: hit.condition,
        stock: hit.stock,
      })),
    });
  } catch (err) {
    return failure(err, "products");
  }
}
