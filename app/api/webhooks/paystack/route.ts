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
    return NextResponse.json(
      { error: "Missing x-paystack-signature header" },
      { status: 400 }
    );
  }

  // Verify webhook signature using HMAC SHA-512
  const hash = crypto
    .createHmac("sha512", paystackSecretKey)
    .update(body)
    .digest("hex");

  if (hash !== paystackSignature) {
    console.error("Webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  let event: PaystackEvent;

  try {
    event = JSON.parse(body) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Handle the event
  switch (event.event) {
    case "charge.success": {
      await handleChargeSuccess(event.data);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}

async function handleChargeSuccess(data: PaystackChargeData) {
  const paystackReference = data.reference;

  try {
    // Idempotency check: prevent duplicate processing on webhook retries
    const existingOrder = await client.fetch(
      ORDER_BY_PAYSTACK_REFERENCE_QUERY,
      { paystackReference }
    );

    if (existingOrder) {
      console.log(
        `Webhook already processed for reference ${paystackReference}, skipping`
      );
      return;
    }

    // Extract metadata passed during payment initialization
    const metadata = data.metadata ?? {};
    const {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString,
    } = metadata as PaystackMetadata;

    if (!clerkUserId || !productIdsString || !quantitiesString) {
      console.error("Missing metadata in Paystack charge data");
      return;
    }

    const productIds = productIdsString.split(",");
    const quantities = quantitiesString.split(",").map(Number);

    // Build order items — prices passed via metadata as comma-separated kobo values
    const pricesString = (metadata as PaystackMetadata).prices ?? "";
    const prices = pricesString.split(",").map(Number);

    const orderItems = productIds.map((productId, index) => ({
      _key: `item-${index}`,
      product: {
        _type: "reference" as const,
        _ref: productId,
      },
      quantity: quantities[index],
      priceAtPurchase: prices[index] ? prices[index] / 100 : 0,
    }));

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    // Extract shipping address from metadata if provided
    const shippingAddress = (metadata as PaystackMetadata).shippingAddress;
    const address = shippingAddress
      ? {
          name: shippingAddress.name ?? "",
          line1: shippingAddress.line1 ?? "",
          line2: shippingAddress.line2 ?? "",
          city: shippingAddress.city ?? "",
          postcode: shippingAddress.postcode ?? "",
          country: shippingAddress.country ?? "",
        }
      : undefined;

    // Create order in Sanity
    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      ...(sanityCustomerId && {
        customer: {
          _type: "reference",
          _ref: sanityCustomerId,
        },
      }),
      clerkUserId,
      email: userEmail ?? data.customer?.email ?? "",
      items: orderItems,
      total: (data.amount ?? 0) / 100, // convert kobo to naira
      status: "paid",
      paystackReference,
      address,
      createdAt: new Date().toISOString(),
    });

    console.log(`Order created: ${order._id} (${orderNumber})`);

    // Decrease stock for all products
    await productIds
      .reduce(
        (tx, productId, i) =>
          tx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
        writeClient.transaction()
      )
      .commit();

    console.log(`Stock updated for ${productIds.length} products`);
  } catch (error) {
    console.error("Error handling charge.success:", error);
    throw error; // Re-throw to return 500 and trigger Paystack retry
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

interface PaystackEvent {
  event: string;
  data: PaystackChargeData;
}

interface PaystackChargeData {
  reference: string;
  amount: number; // in kobo
  status: string;
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  metadata?: Record<string, unknown>;
}

interface PaystackMetadata {
  clerkUserId?: string;
  userEmail?: string;
  sanityCustomerId?: string;
  productIds?: string;
  quantities?: string;
  prices?: string; // comma-separated prices in kobo
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}