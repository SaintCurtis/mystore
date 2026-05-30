// app/api/quotation/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Inline formatter — avoids any module resolution issues with @/lib/utils
function fmt(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface QuoteItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string;
}

interface Quote {
  quoteNumber: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  quoteDate: string;
  validUntil: string;
  items: QuoteItem[];
  subtotal: number;
  vatAmount?: number;
  vatNote: string;
  grandTotal: number;
  terms: string[];
  engineerNote: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, quote } = (await req.json()) as { email: string; quote: Quote };

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!quote) {
      return NextResponse.json({ error: "Quote data required" }, { status: 400 });
    }

    const itemRows = quote.items
      .map(
        (item) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f4f4f5;">
          <strong style="font-size:13px;">${item.name}</strong>
          ${item.notes ? `<br/><span style="font-size:11px;color:#71717a;">${item.notes}</span>` : ""}
        </td>
        <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f4f4f5;color:#52525b;">${item.quantity}</td>
        <td style="padding:12px;text-align:right;border-bottom:1px solid #f4f4f5;color:#3f3f46;">${fmt(item.unitPrice)}</td>
        <td style="padding:12px;text-align:right;border-bottom:1px solid #f4f4f5;font-weight:600;">${fmt(item.lineTotal)}</td>
      </tr>`
      )
      .join("");

    const termsList = quote.terms
      .map((t) => `<li style="margin-bottom:4px;color:#52525b;">${t}</li>`)
      .join("");

    const waText = encodeURIComponent(
      `Hi! I'd like to accept quotation ${quote.quoteNumber}. Grand total: ${fmt(quote.grandTotal)}`
    );

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <div style="background:#09090b;padding:24px 28px;">
      <table style="width:100%;"><tr>
        <td>
          <p style="color:#f59e0b;font-weight:800;font-size:20px;margin:0;">The Saint's TechNet</p>
          <p style="color:#71717a;font-size:11px;margin:8px 0 0 0;line-height:1.6;">
            Built by an Engineer · CAC Registered · Lagos, Nigeria<br>
            BN: 9245886 · iamsaintcurtis@gmail.com · +234 906 089 8951
          </p>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <p style="color:#a1a1aa;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Quotation</p>
          <p style="color:#f59e0b;font-family:monospace;font-size:16px;font-weight:700;margin:4px 0 0 0;">${quote.quoteNumber}</p>
        </td>
      </tr></table>
    </div>

    <div style="padding:28px;">

      <table style="width:100%;margin-bottom:24px;"><tr>
        <td>
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;margin:0 0 4px 0;">Prepared for</p>
          <p style="font-weight:700;font-size:17px;margin:0;">${quote.customerName}</p>
          ${quote.customerPhone ? `<p style="font-size:12px;color:#52525b;margin:3px 0 0 0;">${quote.customerPhone}</p>` : ""}
          ${quote.customerAddress ? `<p style="font-size:12px;color:#52525b;margin:2px 0 0 0;">${quote.customerAddress}</p>` : ""}
        </td>
        <td style="text-align:right;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;margin:0 0 4px 0;">Validity</p>
          <p style="font-weight:600;margin:0;">Until ${quote.validUntil}</p>
          <p style="font-size:11px;color:#71717a;margin:2px 0 0 0;">Issued ${quote.quoteDate}</p>
        </td>
      </tr></table>

      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e4e4e7;border-radius:10px;margin-bottom:20px;">
        <thead>
          <tr style="background:#f4f4f5;">
            <th style="text-align:left;padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;">Item</th>
            <th style="text-align:center;padding:10px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;width:60px;">Qty</th>
            <th style="text-align:right;padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;width:130px;">Unit Price</th>
            <th style="text-align:right;padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;width:130px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:20px;">
        <div style="width:280px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#52525b;">
            <span>Subtotal</span><span>${fmt(quote.subtotal)}</span>
          </div>
          ${quote.vatAmount ? `<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:#52525b;"><span>${quote.vatNote} (7.5%)</span><span>${fmt(quote.vatAmount)}</span></div>` : ""}
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;padding:10px 0 0 0;border-top:2px solid #e4e4e7;margin-top:6px;">
            <span>Grand Total</span>
            <span style="color:#d97706;">${fmt(quote.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#b45309;margin:0 0 8px 0;">Note from the Engineer</p>
        <p style="font-size:13px;color:#92400e;margin:0;line-height:1.6;">${quote.engineerNote}</p>
      </div>

      <div style="margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;margin:0 0 10px 0;">Terms &amp; Conditions</p>
        <ul style="margin:0;padding-left:16px;font-size:12px;">${termsList}</ul>
      </div>

      <div style="border-top:1px solid #f4f4f5;padding-top:20px;text-align:center;">
        <p style="font-size:12px;color:#71717a;margin:0 0 14px 0;">
          To accept this quotation, WhatsApp us with your quote number
          <strong style="font-family:monospace;">${quote.quoteNumber}</strong>
        </p>
        <a href="https://wa.me/2349060898951?text=${waText}"
          style="display:inline-block;background:#25D366;color:white;font-weight:700;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;margin-right:8px;">
          Accept on WhatsApp
        </a>
        <a href="https://mystore-drab-nine.vercel.app/"
          style="display:inline-block;background:#f59e0b;color:#0a0a0a;font-weight:700;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;">
          Shop Now
        </a>
      </div>
    </div>

    <div style="background:#f4f4f5;padding:16px 28px;text-align:center;">
      <p style="font-size:11px;color:#a1a1aa;margin:0;">
        The Saint's TechNet · Lagos, Nigeria · CAC BN: 9245886<br>
        This quotation is valid for 7 days from the date of issue.
      </p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: "The Saint's TechNet <onboarding@resend.dev>",
      to: email,
      subject: `Quotation ${quote.quoteNumber} — ${fmt(quote.grandTotal)} — The Saint's TechNet`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[quotation/email]", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}