// app/api/quotation/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { items, customerName, notes } = await req.json() as {
      items: { name: string; quantity: number; unitPrice: number }[];
      customerName?: string;
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

    // Build a random 6-char alphanumeric quote number
    const quoteNumber = "Q-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const prompt = `You are a quotation assistant for The Saint's TechNet, a premium tech retailer in Lagos, Nigeria (CAC BN: 9245886, Est. 2019, built and run by a seasoned computer engineer).

Generate a professional sales quotation as a JSON object ONLY. No markdown, no code fences, no preamble, no trailing text — just raw JSON.

Customer name: ${customerName || "Valued Customer"}
Items requested: ${JSON.stringify(items)}
Additional notes: ${notes || "none"}
Quote number: ${quoteNumber}
Quote date: ${fmt(today)}
Valid until: ${fmt(validUntil)}

Return ONLY this exact JSON structure (no extra fields):
{
  "quoteNumber": "${quoteNumber}",
  "customerName": string,
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
  "subtotal": number,
  "vatNote": "VAT not applicable" or "Prices inclusive of all charges",
  "grandTotal": number,
  "terms": [
    "Warranty included on all products",
    "7-day no-questions-asked return policy",
    "Payment accepted via Paystack (card/bank transfer) or cryptocurrency",
    "Quote valid for 7 days from issue date",
    "Subject to stock availability at time of order",
    "Free delivery within Lagos for orders above ₦500,000"
  ],
  "engineerNote": string (1-2 sentence personal note from the engineer — confirm the items are good choices, mention any relevant advice, sign off warmly)
}

Rules:
- lineTotal = unitPrice × quantity (compute exactly)
- subtotal = sum of all lineTotals
- grandTotal = subtotal (no VAT for Nigerian tech retail)
- engineerNote must sound genuine, warm, and technically credible — not generic`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const quote = JSON.parse(cleaned);

    return NextResponse.json({ success: true, quote });
  } catch (err) {
    console.error("[quotation POST]", err);
    return NextResponse.json({ error: "Failed to generate quotation" }, { status: 500 });
  }
}