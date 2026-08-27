// lib/sms/termii.ts
//
// SMS provider for birthday alerts (and anything else transactional-SMS
// later needs). Defaults to Termii — best NGN-billed deliverability on
// Nigerian networks and no separate number-verification step.
//
// This was previously flagged as an open decision (Termii/Africa's Talking
// vs Twilio) — Termii is the pick here. To switch providers, only the
// inside of sendSms() needs to change; every caller stays the same.
//
// Requires two env vars:
//   TERMII_API_KEY   — from termii.com dashboard
//   TERMII_SENDER_ID — a Sender ID registered & approved with Termii
//                       (max 11 chars, e.g. "SaintTech"); falls back to
//                       "SaintTech" if unset, but that fallback will only
//                       work once it's actually registered with Termii.

export interface SendSmsResult {
  success: boolean;
  error?: string;
}

export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  if (!process.env.TERMII_API_KEY) {
    console.warn("[sms] TERMII_API_KEY not set — skipping SMS send");
    return { success: false, error: "SMS provider not configured" };
  }

  const normalized = normalizeNigerianNumber(to);
  if (!normalized) {
    return { success: false, error: "Invalid phone number" };
  }

  try {
    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: normalized,
        from: process.env.TERMII_SENDER_ID || "SaintTech",
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMII_API_KEY,
      }),
    });

    const data = (await res.json()) as { message_id?: string; message?: string };

    if (res.ok && data.message_id) {
      return { success: true };
    }
    console.error("[sms] Termii send failed:", data);
    return { success: false, error: data.message || "SMS send failed" };
  } catch (err) {
    console.error("[sms] Termii request error:", err);
    return { success: false, error: "Network error sending SMS" };
  }
}

/** Termii wants digits only, country code, no leading "+". */
function normalizeNigerianNumber(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}
