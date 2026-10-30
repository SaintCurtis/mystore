import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendReceiptEmail } from "@/lib/receipts/email";
import { failure, json } from "@/lib/receipts/http";
import { createReceiptSchema, firstIssueMessage } from "@/lib/receipts/schema";
import {
  createReceipt,
  getReceipt,
  getSummary,
  listReceipts,
  type ReceiptFilter,
} from "@/lib/receipts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILTERS: ReceiptFilter[] = ["all", "paid", "part", "void", "not_emailed"];

// GET /api/admin/receipts?q=&filter=&cursor=   → history page (+ summary on the first page)
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").slice(0, 80);
    const filterParam = searchParams.get("filter") as ReceiptFilter | null;
    const filter =
      filterParam && FILTERS.includes(filterParam) ? filterParam : "all";
    const cursor = searchParams.get("cursor") || undefined;

    if (searchParams.get("summary") === "1") {
      return json({ summary: await getSummary() });
    }

    const [page, summary] = await Promise.all([
      listReceipts({ q, filter, cursor, limit: 20 }),
      cursor ? Promise.resolve(null) : getSummary(),
    ]);

    return json({ rows: page.rows, nextCursor: page.nextCursor, summary });
  } catch (err) {
    return failure(err, "list");
  }
}

// POST /api/admin/receipts  → issue a receipt (optionally emailing it straight away)
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const parsed = createReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: firstIssueMessage(parsed.error) }, 400);
  }

  try {
    const { receipt, duplicate } = await createReceipt(parsed.data);

    let email: { ok: boolean; to: string; error?: string } | null = null;
    if (!duplicate && parsed.data.sendEmail && receipt.customer.email) {
      const result = await sendReceiptEmail(receipt, receipt.customer.email);
      email = result.ok
        ? { ok: true, to: result.to }
        : { ok: false, to: result.to, error: result.error };
    }

    // Re-read so the response includes the email attempt we just logged.
    const fresh = (await getReceipt(receipt.receiptNumber)) ?? receipt;
    return json({ receipt: fresh, duplicate, email }, duplicate ? 200 : 201);
  } catch (err) {
    return failure(err, "create");
  }
}
