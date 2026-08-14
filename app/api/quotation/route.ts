// app/api/quotation/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const VAT_RATE = 0.075; // 7.5% Nigerian VAT

export async function POST(req: NextRequest) {
  try {
    const { items, customerName, customerAddress, customerPhone, notes } =
      await req.json() as {
        items: { name: string; quantity: number; unitPrice: number }[];
        customerName?: string;
        customerAddress?: string;
        customerPhone?: string;
        notes?: string;
      };

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 7);

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });

    const quoteNumber = "Q-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    // Pre-compute totals so AI doesn't need to calculate
    const computedItems = items.map((item) => ({
      ...item,
      lineTotal: item.unitPrice * item.quantity,
    }));
    const subtotal = computedItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const vatAmount = Math.round(subtotal * VAT_RATE);
    const grandTotal = subtotal + vatAmount;

    const prompt = `You are a quotation assistant for The Saint's TechNet, a premium tech retailer in Lagos, Nigeria (CAC BN: 9245886, Est. 2019).

Generate a professional sales quotation as a JSON object ONLY. No markdown, no code fences, no preamble — just raw JSON.

Customer name: ${customerName || "Valued Customer"}
Customer address: ${customerAddress || "Not provided"}
Customer phone: ${customerPhone || "Not provided"}
Items: ${JSON.stringify(computedItems)}
Notes: ${notes || "none"}
Quote number: ${quoteNumber}
Quote date: ${fmt(today)}
Valid until: ${fmt(validUntil)}
Subtotal (pre-computed): ${subtotal}
VAT (7.5% Nigerian VAT, pre-computed): ${vatAmount}
Grand total (pre-computed): ${grandTotal}

Return ONLY this exact JSON (no extra fields, use the pre-computed numbers exactly):
{
  "quoteNumber": "${quoteNumber}",
  "customerName": string,
  "customerAddress": "${customerAddress || ""}",
  "customerPhone": "${customerPhone || ""}",
  "quoteDate": "${fmt(today)}",
  "validUntil": "${fmt(validUntil)}",
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number,
      "notes": string (brief spec note or empty string)
    }
  ],
  "subtotal": ${subtotal},
  "vatAmount": ${vatAmount},
  "vatNote": "VAT 7.5% (FIRS)",
  "grandTotal": ${grandTotal},
  "terms": [
    "Warranty included on all products",
    "7-day no-questions-asked return policy",
    "Payment accepted via Paystack (card/bank transfer) or cryptocurrency",
    "Quote valid for 7 days from issue date",
    "Subject to stock availability at time of order",
    "Free delivery within Lagos for orders above ₦500,000"
  ],
  "engineerNote": string (1-2 sentences — confirm items are excellent choices, give brief technical insight, sign off warmly. Must sound genuine, not generic.)
}

Rules:
- Use the pre-computed subtotal, vatAmount, and grandTotal exactly — do not recalculate
- lineTotal = unitPrice × quantity for each item
- engineerNote must be specific to the actual products listed`;

    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const quote = JSON.parse(cleaned);

    return NextResponse.json({ success: true, quote });
  } catch (err) {
    console.error("[quotation POST]", err);
    return NextResponse.json({ error: "Failed to generate quotation, retry" }, { status: 500 });
  }
}