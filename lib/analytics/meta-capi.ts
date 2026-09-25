// lib/analytics/meta-capi.ts
//
// Server-side counterpart to the browser Meta Pixel. This is what actually
// answers "did the conversion really happen" — it's called from the
// Paystack webhook, which only fires after Paystack's signature-verified
// confirmation that money was actually captured. The browser pixel (fired
// from the success page) can be missed by ad blockers, Safari's tracking
// prevention, or a closed tab right after payment; this can't be, because
// it never depends on the customer's browser at all.
//
// Meta de-duplicates the two automatically as long as both send the same
// event_id for the same purchase — see trackPurchase() in track.ts, which
// is called with the same Paystack reference used here.
//
// Server-only: uses Node's crypto module and a secret access token. Never
// import this from a "use client" file.

import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
const GRAPH_API_VERSION = "v26.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface MetaPurchaseEvent {
  /** Same value the client pixel used as its eventID — the Paystack
   *  transaction reference is what we use throughout this codebase. */
  eventId: string;
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  sourceUrl?: string;
}

/**
 * Fire-and-forget by design: analytics must never block or fail an actual
 * order. Every failure path logs and returns rather than throwing, so a
 * Meta outage or a missing/bad access token can never take down checkout.
 */
export async function sendMetaPurchaseEvent(event: MetaPurchaseEvent): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return; // Not configured yet — silent no-op, not an error.

  const userData: Record<string, unknown> = {};
  if (event.email) userData.em = [sha256(event.email)];
  if (event.phone) {
    // Meta expects digits only, no leading +, no punctuation.
    const digits = event.phone.replace(/\D/g, "");
    if (digits) userData.ph = [sha256(digits)];
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.sourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: {
          currency: event.currency ?? "NGN",
          value: event.value,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error("Meta CAPI purchase event rejected:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Meta CAPI purchase event request failed:", err);
  }
}
