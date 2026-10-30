/**
 * Emails a receipt to the customer with the PDF attached, and records every
 * attempt (sent or failed) on the receipt so the History tab can show it.
 *
 * Uses the same Resend account and verified sender as the rest of the store.
 * This function never throws: it always returns { ok, ... } so a mail problem
 * can't break issuing the receipt itself.
 */

import { Resend } from "resend";
import {
  RECEIPT_BUSINESS,
  receiptBccEmail,
  receiptFromEmail,
  receiptReplyTo,
} from "./config";
import { formatReceiptDate } from "./dates";
import { formatNaira } from "./money";
import { receiptFileName, renderReceiptPdf } from "./pdf";
import { appendEmailAttempt } from "./store";
import { PAYMENT_METHOD_LABELS, type StoredReceipt } from "./types";

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function firstName(full: string): string {
  const first = full.trim().split(/\s+/)[0];
  return first || "there";
}

export function receiptEmailSubject(receipt: StoredReceipt): string {
  return `Your receipt ${receipt.receiptNumber} from ${RECEIPT_BUSINESS.brandName}`;
}

function buildHtml(receipt: StoredReceipt): string {
  const brand = "#ba4b00";
  const lines = receipt.items.slice(0, 6);
  const more = receipt.items.length - lines.length;
  const itemRows = lines
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee9e2;font-size:14px;color:#1d1b19;">
            ${esc(item.description)}${item.quantity > 1 ? ` <span style="color:#6b665f;">× ${item.quantity}</span>` : ""}
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #eee9e2;font-size:14px;color:#1d1b19;white-space:nowrap;">
            ${esc(formatNaira(item.lineTotal))}
          </td>
        </tr>`,
    )
    .join("");
  const moreRow =
    more > 0
      ? `<tr><td colspan="2" style="padding:8px 0;font-size:13px;color:#6b665f;">+ ${more} more item${more === 1 ? "" : "s"} (see the attached PDF)</td></tr>`
      : "";

  const balanceRow =
    receipt.balance > 0
      ? `<tr>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:${brand};">Balance due</td>
          <td align="right" style="padding:6px 0;font-size:14px;font-weight:700;color:${brand};">${esc(formatNaira(receipt.balance))}</td>
        </tr>`
      : "";

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr><td style="height:5px;background:${brand};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 28px 8px 28px;">
          <div style="font-size:20px;font-weight:800;color:#1d1b19;">${esc(RECEIPT_BUSINESS.brandName)}</div>
          <div style="font-size:12px;color:#6b665f;margin-top:2px;">${esc(RECEIPT_BUSINESS.tagline)}</div>
        </td></tr>
        <tr><td style="padding:12px 28px 4px 28px;">
          <p style="margin:0 0 12px 0;font-size:15px;color:#1d1b19;">Hi ${esc(firstName(receipt.customer.name))},</p>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1d1b19;">
            Thank you for your purchase. Your receipt <strong>${esc(receipt.receiptNumber)}</strong> is attached to this email as a PDF.
            Please keep it as your proof of purchase for any warranty claim.
          </p>
        </td></tr>
        <tr><td style="padding:0 28px 8px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f4;border-radius:8px;padding:6px 16px;">
            <tr><td style="padding:10px 16px 0 16px;font-size:12px;color:#6b665f;">
              ${esc(formatReceiptDate(receipt.issuedAt))} &nbsp;·&nbsp; ${esc(PAYMENT_METHOD_LABELS[receipt.paymentMethod])}
            </td></tr>
            <tr><td style="padding:0 16px 10px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}${moreRow}
                <tr>
                  <td style="padding:12px 0 6px 0;font-size:16px;font-weight:800;color:#1d1b19;">Total</td>
                  <td align="right" style="padding:12px 0 6px 0;font-size:16px;font-weight:800;color:#1d1b19;">${esc(formatNaira(receipt.total))}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;font-size:14px;color:#6b665f;">Amount paid</td>
                  <td align="right" style="padding:2px 0;font-size:14px;color:#6b665f;">${esc(formatNaira(receipt.amountPaid))}</td>
                </tr>
                ${balanceRow}
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px 8px 28px;">
          <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#1d1b19;">
            Anything look wrong, or need help with your purchase? Just reply to this email or message us on WhatsApp.
          </p>
          <a href="https://wa.me/${RECEIPT_BUSINESS.whatsappDigits}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:11px 20px;border-radius:8px;">Chat on WhatsApp</a>
        </td></tr>
        <tr><td style="padding:22px 28px 26px 28px;font-size:11px;line-height:1.6;color:#8a847c;">
          ${esc(RECEIPT_BUSINESS.legalName)} · CAC BN ${esc(RECEIPT_BUSINESS.cacNumber)}<br>
          ${esc(RECEIPT_BUSINESS.address)} · ${esc(RECEIPT_BUSINESS.phone)} · ${esc(RECEIPT_BUSINESS.website)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(receipt: StoredReceipt): string {
  const lines = [
    `Hi ${firstName(receipt.customer.name)},`,
    "",
    `Thank you for your purchase. Your receipt ${receipt.receiptNumber} is attached as a PDF.`,
    "Please keep it as your proof of purchase for any warranty claim.",
    "",
    `Date: ${formatReceiptDate(receipt.issuedAt)}`,
    `Payment: ${PAYMENT_METHOD_LABELS[receipt.paymentMethod]}`,
    "",
    ...receipt.items.map(
      (item) =>
        `- ${item.description}${item.quantity > 1 ? ` x ${item.quantity}` : ""}: ${formatNaira(item.lineTotal)}`,
    ),
    "",
    `Total: ${formatNaira(receipt.total)}`,
    `Amount paid: ${formatNaira(receipt.amountPaid)}`,
    ...(receipt.balance > 0
      ? [`Balance due: ${formatNaira(receipt.balance)}`]
      : []),
    "",
    `Questions? Reply to this email or WhatsApp ${RECEIPT_BUSINESS.phone}.`,
    "",
    `${RECEIPT_BUSINESS.legalName} · CAC BN ${RECEIPT_BUSINESS.cacNumber}`,
  ];
  return lines.join("\n");
}

export type SendReceiptResult =
  | { ok: true; to: string; providerId?: string }
  | { ok: false; to: string; error: string };

export async function sendReceiptEmail(
  receipt: StoredReceipt,
  to: string,
  pdf?: Uint8Array,
): Promise<SendReceiptResult> {
  const record = async (
    status: "sent" | "failed",
    providerId?: string,
    error?: string,
  ) => {
    try {
      await appendEmailAttempt(receipt.receiptNumber, {
        at: new Date().toISOString(),
        to,
        status,
        ...(providerId ? { providerId } : {}),
        ...(error ? { error: error.slice(0, 300) } : {}),
      });
    } catch (err) {
      console.error("[receipts/email] could not log the email attempt:", err);
    }
  };

  if (!process.env.RESEND_API_KEY) {
    const error = "Email is not configured (RESEND_API_KEY is missing).";
    await record("failed", undefined, error);
    return { ok: false, to, error };
  }

  try {
    const bytes = pdf ?? (await renderReceiptPdf(receipt));
    const resend = new Resend(process.env.RESEND_API_KEY);
    const bcc = receiptBccEmail();

    const { data, error } = await resend.emails.send({
      from: receiptFromEmail(),
      to,
      replyTo: receiptReplyTo(),
      ...(bcc ? { bcc } : {}),
      subject: receiptEmailSubject(receipt),
      html: buildHtml(receipt),
      text: buildText(receipt),
      attachments: [
        { filename: receiptFileName(receipt), content: Buffer.from(bytes) },
      ],
    });

    if (error) {
      const message =
        error.message || "The email service rejected the message.";
      await record("failed", undefined, message);
      return { ok: false, to, error: message };
    }

    await record("sent", data?.id);
    return { ok: true, to, providerId: data?.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error while sending.";
    await record("failed", undefined, message);
    return { ok: false, to, error: message };
  }
}
