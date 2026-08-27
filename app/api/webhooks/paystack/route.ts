// app/api/webhooks/paystack/route.ts
//
// Handles two kinds of charge.success events, split by metadata.isLayawayDeposit:
//  - normal checkout   → handleChargeSuccess()   (unchanged from before)
//  - layaway deposit   → handleLayawayDeposit()  (new)
//
// KEY FIXES (normal checkout, kept from before):
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
import { Resend } from "resend";
import { client, writeClient } from "@/sanity/lib/client";
import { ORDER_BY_PAYSTACK_REFERENCE_QUERY } from "@/lib/sanity/queries/orders";
import {
  LAYAWAY_PLAN_BY_PAYSTACK_REFERENCE_QUERY,
} from "@/lib/sanity/queries/profile";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";

export const dynamic = "force-dynamic";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
const resend = new Resend(process.env.RESEND_API_KEY);
// NOTE: confirm this sender is actually verified in your Resend dashboard —
// the codebase had two different from-addresses in use (onboarding@resend.dev
// in one route, notifications@sainttechnet.com — the old domain — in another).
// Set RESEND_FROM_EMAIL to override without touching this file.
const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL || "The Saint's TechNet <notifications@buyfromsaint.com>";

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
    const isLayawayDeposit = str(event.data.metadata?.isLayawayDeposit) === "true";
    if (isLayawayDeposit) {
      await handleLayawayDeposit(event.data);
    } else {
      await handleChargeSuccess(event.data);
    }
  }

  return NextResponse.json({ received: true });
}

// ── Normal checkout ──────────────────────────────────────────────────────

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

// ── Layaway deposit ──────────────────────────────────────────────────────

async function handleLayawayDeposit(data: PaystackChargeData) {
  const paystackReference = data.reference;

  try {
    // Idempotency — skip if this reference is already recorded on any plan
    const existing = await client.fetch(LAYAWAY_PLAN_BY_PAYSTACK_REFERENCE_QUERY, { reference: paystackReference });
    if (existing) {
      console.log(`Layaway payment ${paystackReference} already processed, skipping`);
      return;
    }

    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    const clerkUserId      = str(meta.clerkUserId);
    const userEmail        = str(meta.userEmail) || str(data.customer?.email);
    const sanityCustomerId = str(meta.sanityCustomerId);
    const buyerName        = str(meta.buyerName);
    const productId        = str(meta.productId);
    const layawayPlanId    = str(meta.layawayPlanId);
    const paceMonths       = meta.paceMonths ? Number(meta.paceMonths) : undefined;

    if (!clerkUserId || !productId) {
      console.error("Layaway webhook missing required metadata:", { clerkUserId, productId });
      return;
    }

    const amount = (data.amount ?? 0) / 100;
    const paidAt = new Date().toISOString();

    let planId = layawayPlanId;
    let totalAmount: number;
    let amountPaidBefore: number;

    if (planId) {
      // ── Top-up an existing plan ─────────────────────────────────────────
      const plan = await client.fetch<{ totalAmount?: number; amountPaid?: number } | null>(
        `*[_type == "layawayPlan" && _id == $id][0]{ totalAmount, amountPaid }`,
        { id: planId }
      );
      if (!plan) {
        console.error(`Layaway plan ${planId} not found for top-up`);
        return;
      }
      totalAmount = plan.totalAmount ?? 0;
      amountPaidBefore = plan.amountPaid ?? 0;

      await writeClient
        .patch(planId)
        .setIfMissing({ payments: [] })
        .append("payments", [{ _key: `pmt-${Date.now()}`, amount, paidAt, paystackReference }])
        .set({ amountPaid: amountPaidBefore + amount })
        .commit();
    } else {
      // ── Create a new plan ────────────────────────────────────────────────
      const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, { ids: [productId] });
      const product = products?.[0];
      totalAmount = product?.price ?? amount;
      amountPaidBefore = 0;

      const planNumber = `LWY-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36).substring(2, 6).toUpperCase()}`;

      const startedAt = new Date();
      const priceLockExpiresAt = new Date(startedAt.getTime() + 90 * 24 * 60 * 60 * 1000);

      const newPlan = await writeClient.create({
        _type: "layawayPlan",
        planNumber,
        status: amount / totalAmount >= 0.5 ? "reserved" : "active",
        product: { _type: "reference", _ref: productId },
        productNameSnapshot: product?.name ?? "",
        totalAmount,
        amountPaid: amount,
        paceMonths,
        startedAt: startedAt.toISOString(),
        priceLockExpiresAt: priceLockExpiresAt.toISOString(),
        ...(sanityCustomerId && { customer: { _type: "reference", _ref: sanityCustomerId } }),
        clerkUserId,
        payments: [{ _key: `pmt-${Date.now()}`, amount, paidAt, paystackReference }],
      });
      planId = newPlan._id;

      console.log(`✅ Layaway plan created: ${planId} (${planNumber})`);
    }

    const amountPaidAfter = amountPaidBefore + amount;
    const isNowComplete = amountPaidAfter >= totalAmount;

    if (isNowComplete) {
      await completeLayawayPlan({
        planId,
        productId,
        clerkUserId,
        userEmail,
        sanityCustomerId,
        buyerName,
        totalAmount,
        paystackReference,
      });
    } else {
      const newStatus = amountPaidAfter / totalAmount >= 0.5 ? "reserved" : "active";
      await writeClient.patch(planId).set({ status: newStatus }).commit();
    }

    // ── Deposit-received email (non-fatal if it fails) ─────────────────────
    if (userEmail) {
      try {
        const remaining = Math.max(totalAmount - amountPaidAfter, 0);
        await resend.emails.send({
          from: RESEND_FROM,
          to: userEmail,
          subject: isNowComplete
            ? "🎉 Layaway plan fully paid — we're preparing your order"
            : "✅ Layaway payment received",
          html: layawayReceiptHtml({
            name: buyerName || "there",
            amount,
            amountPaidAfter,
            totalAmount,
            remaining,
            isNowComplete,
          }),
        });
      } catch (emailErr) {
        console.error("Layaway receipt email failed to send:", emailErr);
      }
    }
  } catch (error) {
    console.error("Error handling layaway deposit:", error);
    throw error;
  }
}

async function completeLayawayPlan(opts: {
  planId: string;
  productId: string;
  clerkUserId: string;
  userEmail: string;
  sanityCustomerId: string;
  buyerName: string;
  totalAmount: number;
  paystackReference: string;
}) {
  const { planId, productId, clerkUserId, userEmail, sanityCustomerId, buyerName, totalAmount, paystackReference } = opts;

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36).substring(2, 6).toUpperCase()}`;

  const order = await writeClient.create({
    _type: "order",
    orderNumber,
    paystackReference: `layaway:${paystackReference}`,
    ...(sanityCustomerId && { customer: { _type: "reference", _ref: sanityCustomerId } }),
    clerkUserId,
    email: userEmail ?? "",
    buyerName,
    items: [
      {
        _key: "item-0",
        product: { _type: "reference", _ref: productId },
        quantity: 1,
        priceAtPurchase: totalAmount,
      },
    ],
    total: totalAmount,
    subtotal: totalAmount,
    shippingFee: 0,
    shippingMethod: "",
    status: "paid",
    createdAt: new Date().toISOString(),
    address: null,
  });

  await writeClient
    .patch(planId)
    .set({ status: "completed", resultingOrder: { _type: "reference", _ref: order._id } })
    .commit();

  await writeClient.patch(productId).dec({ stock: 1 }).commit();

  console.log(`🎉 Layaway plan ${planId} completed → order ${order._id}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function findCustomerIdByClerkId(clerkUserId: string): Promise<string | null> {
  try {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_type == "customer" && clerkUserId == $clerkUserId][0]{ _id }`,
      { clerkUserId }
    );
    return doc?._id ?? null;
  } catch { return null; }
}

async function saveAddressToProfile(customerId: string, address: ParsedAddress) {
  try {
    const customer = await client.fetch<{ savedAddresses?: SavedAddress[] } | null>(
      `*[_type == "customer" && _id == $id][0]{ savedAddresses }`,
      { id: customerId }
    );

    const existing = customer?.savedAddresses ?? [];

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

function layawayReceiptHtml(opts: {
  name: string;
  amount: number;
  amountPaidAfter: number;
  totalAmount: number;
  remaining: number;
  isNowComplete: boolean;
}): string {
  const { name, amount, amountPaidAfter, totalAmount, remaining, isNowComplete } = opts;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
  const pct = totalAmount ? Math.min(Math.round((amountPaidAfter / totalAmount) * 100), 100) : 0;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#09090b;padding:24px 28px;">
      <p style="color:#1a56db;font-weight:800;font-size:20px;margin:0;">The Saint's TechNet</p>
      <p style="color:#71717a;font-size:11px;margin:8px 0 0 0;">Layaway Plan Update</p>
    </div>
    <div style="padding:28px;">
      <p style="font-size:15px;color:#18181b;margin:0 0 16px 0;">Hi ${name},</p>
      <p style="font-size:14px;color:#3f3f46;line-height:1.7;margin:0 0 20px 0;">
        We've received your payment of <strong>${fmt(amount)}</strong>.
        ${isNowComplete
          ? "That completes your layaway plan — your item is now fully paid and moving into processing for shipment. 🎉"
          : "Thanks for keeping it going — here's where your plan stands."}
      </p>
      <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin-bottom:16px;">
        <div style="height:8px;background:#e4e4e7;border-radius:999px;overflow:hidden;margin-bottom:10px;">
          <div style="height:100%;width:${pct}%;background:#16a34a;"></div>
        </div>
        <table style="width:100%;font-size:13px;color:#52525b;">
          <tr><td>Paid so far</td><td style="text-align:right;font-weight:700;color:#18181b;">${fmt(amountPaidAfter)}</td></tr>
          <tr><td>Total price (locked)</td><td style="text-align:right;">${fmt(totalAmount)}</td></tr>
          ${!isNowComplete ? `<tr><td>Remaining</td><td style="text-align:right;font-weight:700;color:#1a56db;">${fmt(remaining)}</td></tr>` : ""}
        </table>
      </div>
      <p style="font-size:12px;color:#a1a1aa;margin:0;">
        No interest, ever. Pay the rest anytime, any amount, from your profile page.
      </p>
    </div>
  </div>
</body>
</html>`;
}

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
