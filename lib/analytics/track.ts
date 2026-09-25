// lib/analytics/track.ts
//
// One place to call for every marketing-relevant event. Fires both GA4 and
// Meta Pixel from the same call so no event tracking logic is duplicated
// across components, and no future event is added to one platform but
// forgotten on the other.
//
// Safe to call from anywhere, any time — every function no-ops quietly if
// window isn't available (SSR) or the relevant script hasn't loaded yet
// (ID not configured, ad blocker, still loading). Never throws, never
// blocks the caller.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export interface TrackedProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
}

const CURRENCY = "NGN";

function ga(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

// eventId, when passed, is what lets Meta de-duplicate this browser-side
// event against the server-side Conversions API event for the same
// purchase (see lib/analytics/meta-capi.ts) — both must send the exact
// same id for the same real-world event.
function meta(eventName: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (eventId) {
      window.fbq("track", eventName, params, { eventID: eventId });
    } else {
      window.fbq("track", eventName, params);
    }
  }
}

/** Fire on every client-side route change — the base GA4/Meta scripts only
 *  catch the first hard page load, not Next.js App Router soft navigation. */
export function pageview(url: string) {
  ga("event", "page_view", { page_path: url });
  meta("PageView");
}

/** A product detail page was viewed. */
export function trackViewProduct(product: TrackedProduct) {
  ga("event", "view_item", {
    currency: CURRENCY,
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      },
    ],
  });
  meta("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
    value: product.price,
    currency: CURRENCY,
  });
}

/** Something was added to the cart, from any entry point (product page,
 *  sticky bar, quick-add, bundle suggester — anywhere addItem() is called). */
export function trackAddToCart(product: TrackedProduct) {
  const quantity = product.quantity ?? 1;
  ga("event", "add_to_cart", {
    currency: CURRENCY,
    value: product.price * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity,
      },
    ],
  });
  meta("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price * quantity,
    currency: CURRENCY,
  });
}

/** The checkout page was reached with items in the cart. */
export function trackBeginCheckout(items: TrackedProduct[], value: number) {
  ga("event", "begin_checkout", {
    currency: CURRENCY,
    value,
    items: items.map((p) => ({
      item_id: p.id,
      item_name: p.name,
      item_category: p.category,
      price: p.price,
      quantity: p.quantity ?? 1,
    })),
  });
  meta("InitiateCheckout", {
    content_ids: items.map((p) => p.id),
    num_items: items.length,
    value,
    currency: CURRENCY,
  });
}

/** An order was successfully paid for. The single most important event —
 *  this is what lets Meta/Google actually optimize ad spend toward buyers
 *  rather than just clickers.
 *
 *  order.id is the Paystack transaction reference — used both as GA4's
 *  transaction_id AND as Meta's eventID. That second part matters: the
 *  Paystack webhook fires the exact same purchase to Meta's Conversions
 *  API server-side, with this same id, specifically so Meta treats the
 *  browser event and the server event as one verified conversion instead
 *  of two. Don't change what's passed as order.id without checking
 *  lib/analytics/meta-capi.ts and the webhook handler stay in sync. */
export function trackPurchase(order: {
  id: string;
  value: number;
  items: TrackedProduct[];
}) {
  ga("event", "purchase", {
    transaction_id: order.id,
    currency: CURRENCY,
    value: order.value,
    items: order.items.map((p) => ({
      item_id: p.id,
      item_name: p.name,
      price: p.price,
      quantity: p.quantity ?? 1,
    })),
  });
  meta(
    "Purchase",
    {
      content_ids: order.items.map((p) => p.id),
      num_items: order.items.length,
      value: order.value,
      currency: CURRENCY,
    },
    order.id,
  );
}

/** A high-intent, non-purchase conversion — a corporate/bulk quotation was
 *  actually sent, not just generated. This is the B2B lead-gen signal. */
export function trackLead(params: { value?: number; source: string }) {
  ga("event", "generate_lead", {
    currency: CURRENCY,
    value: params.value,
    lead_source: params.source,
  });
  meta("Lead", {
    value: params.value,
    currency: CURRENCY,
    content_name: params.source,
  });
}
