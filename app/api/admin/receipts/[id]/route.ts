import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { failure, json, parseReceiptNumber } from "@/lib/receipts/http";
import { getReceipt } from "@/lib/receipts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/receipts/STN-2026-0001
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const receiptNumber = parseReceiptNumber((await params).id);
  if (!receiptNumber) return json({ error: "Receipt not found" }, 404);

  try {
    const receipt = await getReceipt(receiptNumber);
    if (!receipt) return json({ error: "Receipt not found" }, 404);
    return json({ receipt });
  } catch (err) {
    return failure(err, "get");
  }
}
