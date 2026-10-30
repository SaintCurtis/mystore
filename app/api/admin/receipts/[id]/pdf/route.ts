import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { failure, json, parseReceiptNumber } from "@/lib/receipts/http";
import { receiptFileName, renderReceiptPdf } from "@/lib/receipts/pdf";
import { getReceipt } from "@/lib/receipts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/receipts/STN-2026-0001/pdf            → shown in the browser
// GET /api/admin/receipts/STN-2026-0001/pdf?download=1 → saved as a file
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

    const bytes = await renderReceiptPdf(receipt);
    const download = new URL(req.url).searchParams.get("download") === "1";
    const filename = receiptFileName(receipt);

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        // Receipts hold customer details: never cache them in the browser or on a CDN.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return failure(err, "pdf");
  }
}
