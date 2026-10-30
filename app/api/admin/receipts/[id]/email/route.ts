import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendReceiptEmail } from "@/lib/receipts/email";
import { failure, json, parseReceiptNumber } from "@/lib/receipts/http";
import { emailReceiptSchema, firstIssueMessage } from "@/lib/receipts/schema";
import { getReceipt } from "@/lib/receipts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/receipts/STN-2026-0001/email   body: { to?: "customer@example.com" }
// Sends (or re-sends) the receipt PDF. Without "to" it uses the email on the receipt.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const receiptNumber = parseReceiptNumber((await params).id);
  if (!receiptNumber) return json({ error: "Receipt not found" }, 404);

  let body: unknown = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const parsed = emailReceiptSchema.safeParse(body);
  if (!parsed.success)
    return json({ error: firstIssueMessage(parsed.error) }, 400);

  try {
    const receipt = await getReceipt(receiptNumber);
    if (!receipt) return json({ error: "Receipt not found" }, 404);
    if (receipt.status === "void") {
      return json(
        { error: "This receipt is void, so it can't be emailed." },
        409,
      );
    }

    const to = parsed.data.to ?? receipt.customer.email;
    if (!to) {
      return json(
        {
          error:
            "There's no email address on this receipt. Enter one to send it.",
        },
        400,
      );
    }

    const result = await sendReceiptEmail(receipt, to);
    const fresh = (await getReceipt(receiptNumber)) ?? receipt;

    if (!result.ok) {
      return json(
        { error: `Email not sent: ${result.error}`, receipt: fresh },
        502,
      );
    }
    return json({ ok: true, to: result.to, receipt: fresh });
  } catch (err) {
    return failure(err, "email");
  }
}
