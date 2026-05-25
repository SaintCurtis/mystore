// app/api/webhooks/paystack/route.ts
//
// KEY FIXES:
//  1. shippingAddress arrives as a JSON STRING from checkout metadata
//     (JSON.stringify was called in checkout) — now parsed correctly
//  2. All fields now saved: state, lga, countryCode, shippingFee, shippingMethod
//  3. paystackReference now saved on order document
//  4. buyerName saved from metadata
//  5. After order creation, address is saved to customer's savedAddresses array
//  6. Negotiated deal metadata (isNegotiatedDeal, agreedPrice, savedAmount) saved

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { client, writeClient } from "@/sanity/lib/client";
import { ORDER_BY_PAYSTACK_REFERENCE_QUERY } from "@/lib/sanity/queries/orders";

export const dynamic = "force-dynamic";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const paystackSignature = headersList.get("x-paystack-signature");

  if (!paystackSignature) {
    return NextResponse.json({ error: "Missing x-paystack-signature header" }, { status: 400 });
  }

  const hash = crypto.createHmac("sha512", paystackSecretKey).update(body).digest("hex");
  if (hash !== paystackSignature) {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(body) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    await handleChargeSuccess(event.data);
  }

  return NextResponse.json({ received: true });
}

async function handleChargeSuccess(data: PaystackChargeData) {
  const paystackReference = data.reference;

  try {
    // Idempotency — skip if already processed
    const existingOrder = await client.fetch(ORDER_BY_PAYSTACK_REFERENCE_QUERY, { paystackReference });
    if (existingOrder) {
      console.log(`Already processed ${paystackReference}, skipping`);
      return;
    }

    const meta = (data.metadata ?? {}) as Record<string, unknown>;

    const clerkUserId     = str(meta.clerkUserId);
    const userEmail       = str(meta.userEmail) || str(data.customer?.email);
    const sanityCustomerId = str(meta.sanityCustomerId);
    const productIdsStr   = str(meta.productIds);
    const quantitiesStr   = str(meta.quantities);
    const pricesStr       = str(meta.prices) ?? "";
    const shippingMethod  = str(meta.shippingMethod) ?? "";
    const buyerName       = str(meta.buyerName) ?? "";
    const isNegotiatedDeal = meta.isNegotiatedDeal === "true";

    if (!clerkUserId || !productIdsStr || !quantitiesStr) {
      console.error("Missing required metadata:", { clerkUserId, productIdsStr, quantitiesStr });
      return;
    }

    // ── FIX: Parse shippingAddress from JSON string ───────────────────────
    // checkout.ts does: shippingAddress: JSON.stringify(address)
    // So metadata.shippingAddress is a raw JSON string, not an object.
    // Old code read shippingAddress.name directly on the string → always undefined.
    let address: ParsedAddress | null = null;
    const rawAddr = meta.shippingAddress;
    if (rawAddr) {
      try {
        const parsed = typeof rawAddr === "string" ? JSON.parse(rawAddr) : rawAddr;
        address = {
          name:        str(parsed.name)        || buyerName,
          line1:       str(parsed.line1)        || "",
          line2:       str(parsed.line2)        || "",
          city:        str(parsed.city)         || "",
          state:       str(parsed.state)        || "",
          lga:         str(parsed.lga)          || "",
          postcode:    str(parsed.postcode)     || "",
          country:     str(parsed.country)      || "",
          countryCode: str(parsed.countryCode)  || "",
        };
      } catch (e) {
        console.error("Failed to parse shippingAddress:", e);
      }
    }

    const shippingFeeKobo = str(meta.shippingFee);
    const shippingFee = shippingFeeKobo ? Number(shippingFeeKobo) / 100 : 0;

    const productIds = productIdsStr.split(",");
    const quantities = quantitiesStr.split(",").map(Number);
    const prices     = pricesStr.split(",").map(Number);

    const orderItems = productIds.map((productId, i) => ({
      _key: `item-${i}`,
      product: { _type: "reference" as const, _ref: productId },
      quantity: quantities[i] ?? 1,
      priceAtPurchase: prices[i] ? prices[i] / 100 : 0,
    }));

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36).substring(2, 6).toUpperCase()}`;

    const totalNaira = (data.amount ?? 0) / 100;

    // ── Create Sanity order document ──────────────────────────────────────
    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      paystackReference,
      ...(sanityCustomerId && { customer: { _type: "reference", _ref: sanityCustomerId } }),
      clerkUserId,
      email:        userEmail ?? "",
      buyerName:    address?.name || buyerName,
      items:        orderItems,
      total:        totalNaira,
      subtotal:     totalNaira - shippingFee,
      shippingFee,
      shippingMethod,
      status:       "paid",
      createdAt:    new Date().toISOString(),
      address:      address ?? null,
      // Negotiated deal extras
      ...(isNegotiatedDeal && {
        isNegotiatedDeal: true,
        agreedPrice:   meta.agreedPrice   ? Number(meta.agreedPrice)   : undefined,
        originalPrice: meta.originalPrice ? Number(meta.originalPrice) : undefined,
        savedAmount:   meta.savedAmount   ? Number(meta.savedAmount)   : undefined,
      }),
    });

    console.log(`✅ Order created: ${order._id} (${orderNumber})`);

    // ── Decrease stock ────────────────────────────────────────────────────
    await productIds
      .reduce((tx, id, i) => tx.patch(id, (p) => p.dec({ stock: quantities[i] ?? 1 })), writeClient.transaction())
      .commit();

    console.log(`📦 Stock updated for ${productIds.length} products`);

    // ── Save address to customer profile ─────────────────────────────────
    if (address) {
      const customerId = sanityCustomerId || await findCustomerIdByClerkId(clerkUserId);
      if (customerId) {
        await saveAddressToProfile(customerId, address);
      }
    }

  } catch (error) {
    console.error("Error handling charge.success:", error);
    throw error;
  }
}

// ── Find customer by Clerk user ID ────────────────────────────────────────
async function findCustomerIdByClerkId(clerkUserId: string): Promise<string | null> {
  try {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_type == "customer" && clerkUserId == $clerkUserId][0]{ _id }`,
      { clerkUserId }
    );
    return doc?._id ?? null;
  } catch { return null; }
}

// ── Save address to customer's savedAddresses array ───────────────────────
async function saveAddressToProfile(customerId: string, address: ParsedAddress) {
  try {
    const customer = await client.fetch<{ savedAddresses?: SavedAddress[] } | null>(
      `*[_type == "customer" && _id == $id][0]{ savedAddresses }`,
      { id: customerId }
    );

    const existing = customer?.savedAddresses ?? [];

    // Deduplicate by line1 + city + postcode
    const alreadyExists = existing.some(
      (a) =>
        a.line1?.toLowerCase()    === address.line1?.toLowerCase() &&
        a.city?.toLowerCase()     === address.city?.toLowerCase() &&
        a.postcode?.toLowerCase() === address.postcode?.toLowerCase()
    );
    if (alreadyExists) return;

    const newAddr: SavedAddress = {
      _key:        `addr_${Date.now()}`,
      label:       [address.city, address.state].filter(Boolean).join(", ") || address.country,
      isDefault:   existing.length === 0,
      name:        address.name,
      line1:       address.line1,
      line2:       address.line2,
      city:        address.city,
      state:       address.state,
      lga:         address.lga,
      postcode:    address.postcode,
      country:     address.country,
      countryCode: address.countryCode,
    };

    await writeClient
      .patch(customerId)
      .setIfMissing({ savedAddresses: [] })
      .append("savedAddresses", [newAddr])
      .commit();

    console.log(`📍 Address saved to customer ${customerId}`);
  } catch (err) {
    console.error("Failed to save address to profile:", err);
    // Non-fatal — order was already created successfully
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ── Types ─────────────────────────────────────────────────────────────────
interface ParsedAddress {
  name: string; line1: string; line2: string; city: string;
  state: string; lga: string; postcode: string; country: string; countryCode: string;
}
interface SavedAddress extends ParsedAddress {
  _key: string; label: string; isDefault: boolean;
}
interface PaystackEvent { event: string; data: PaystackChargeData; }
interface PaystackChargeData {
  reference: string; amount: number; status: string;
  customer?: { email?: string; first_name?: string; last_name?: string };
  metadata?: Record<string, unknown>;
}