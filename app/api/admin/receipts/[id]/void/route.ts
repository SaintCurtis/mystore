import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { failure, json, parseReceiptNumber } from "@/lib/receipts/http";
import { firstIssueMessage, voidReceiptSchema } from "@/lib/receipts/schema";
import { voidReceipt } from "@/lib/receipts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/receipts/STN-2026-0001/void   body: { reason: "Wrong item entered" }
// Receipts are never edited or deleted. A mistake is voided (it stays in the
// history, stamped VOID) and a corrected receipt is issued.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const receiptNumber = parseReceiptNumber((await params).id);
  if (!receiptNumber) return json({ error: "Receipt not found" }, 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const parsed = voidReceiptSchema.safeParse(body);
  if (!parsed.success)
    return json({ error: firstIssueMessage(parsed.error) }, 400);

  try {
    const receipt = await voidReceipt(receiptNumber, parsed.data.reason);
    return json({ receipt });
  } catch (err) {
    return failure(err, "void");
  }
}
