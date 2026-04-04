import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { client, writeClient } from "@/sanity/lib/client";
import { ORDER_BY_PAYSTACK_REFERENCE_QUERY } from "@/lib/sanity/queries/orders";

export const dynamic = "force-dynamic";

if (!process.env.NOWPAYMENTS_IPN_SECRET) {
  throw new Error("NOWPAYMENTS_IPN_SECRET is not defined");
}

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// NOWPayments IPN statuses that mean "payment confirmed"
const CONFIRMED_STATUSES = ["finished", "confirmed", "partially_paid"];

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();

  // ── Verify NOWPayments signature ─────────────────────────────
  const signature = headersList.get("x-nowpayments-sig");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // NOWPayments signs with HMAC SHA-512 of the sorted JSON body
  let parsedBody: Record<string, unknown>;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Sort keys alphabetically and re-stringify for signature verification
  const sortedBody = JSON.stringify(
    Object.keys(parsedBody)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: parsedBody[key] }), {})
  );

  const expectedSig = crypto
    .createHmac("sha512", IPN_SECRET)
    .update(sortedBody)
    .digest("hex");

  if (expectedSig !== signature) {
    console.error("NOWPayments signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Process the IPN ──────────────────────────────────────────
  const {
    payment_id,
    payment_status,
    order_id,
    price_amount,
    price_currency,
    actually_paid,
    pay_currency,
  } = parsedBody as {
    payment_id: string;
    payment_status: string;
    order_id: string;
    price_amount: number;
    price_currency: string;
    actually_paid: number;
    pay_currency: string;
  };

  console.log(`NOWPayments IPN: payment_id=${payment_id} status=${payment_status}`);

  if (!CONFIRMED_STATUSES.includes(payment_status)) {
    // Not yet confirmed — acknowledge receipt but don't create order
    console.log(`Payment ${payment_id} status=${payment_status}, waiting for confirmation`);
    return NextResponse.json({ received: true });
  }

  try {
    await handleCryptoPaymentConfirmed({
      paymentId: payment_id,
      orderId: order_id,
      priceAmount: price_amount,
      priceCurrency: price_currency,
      actuallyPaid: actually_paid,
      payCurrency: pay_currency,
      status: payment_status,
    });
  } catch (error) {
    console.error("Error handling NOWPayments IPN:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ── Handle confirmed payment ───────────────────────────────────────────────

async function handleCryptoPaymentConfirmed({
  paymentId,
  orderId,
  priceAmount,
  priceCurrency,
  actuallyPaid,
  payCurrency,
  status,
}: {
  paymentId: string;
  orderId: string;
  priceAmount: number;
  priceCurrency: string;
  actuallyPaid: number;
  payCurrency: string;
  status: string;
}) {
  // 1. Idempotency — check if order already created for this payment
  const cryptoRef = `CRYPTO-${paymentId}`;
  const existingOrder = await client.fetch(ORDER_BY_PAYSTACK_REFERENCE_QUERY, {
    paystackReference: cryptoRef,
  });

  if (existingOrder) {
    console.log(`Crypto order already created for payment ${paymentId}, skipping`);
    return;
  }

  // 2. Retrieve pending order metadata from Sanity
  const pendingDoc = await client.fetch(
    `*[_type == "pendingCryptoOrder" && nowpaymentsId == $id][0]`,
    { id: paymentId }
  );

  if (!pendingDoc) {
    // Try by order_id pattern (CRYPTO-XXXXX)
    const pendingByOrderId = await client.fetch(
      `*[_type == "pendingCryptoOrder"][0]`,
      {}
    );
    if (!pendingByOrderId) {
      console.error(`No pending crypto order found for payment ${paymentId}`);
      return;
    }
  }

  const metadata = (pendingDoc?.metadata ?? {}) as Record<string, string>;
  const {
    clerkUserId,
    userEmail,
    sanityCustomerId,
    productIds: productIdsStr,
    quantities: quantitiesStr,
    prices: pricesStr,
    totalNGN,
    shippingAddress: shippingAddressStr,
  } = metadata;

  if (!clerkUserId || !productIdsStr) {
    console.error("Missing metadata for crypto order", paymentId);
    return;
  }

  const productIds = productIdsStr.split(",");
  const quantities = quantitiesStr.split(",").map(Number);
  const prices = pricesStr.split(",").map(Number);

  // 3. Build order items
  const orderItems = productIds.map((productId, i) => ({
    _key: `item-${i}`,
    product: { _type: "reference" as const, _ref: productId },
    quantity: quantities[i],
    priceAtPurchase: prices[i] ? prices[i] / 100 : 0,
  }));

  // 4. Parse shipping address
  let address;
  try {
    address = shippingAddressStr ? JSON.parse(shippingAddressStr) : undefined;
  } catch {
    address = undefined;
  }

  // 5. Generate order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  // 6. Create order in Sanity
  const order = await writeClient.create({
    _type: "order",
    orderNumber,
    ...(sanityCustomerId && {
      customer: { _type: "reference", _ref: sanityCustomerId },
    }),
    clerkUserId,
    email: userEmail ?? "",
    items: orderItems,
    total: totalNGN ? parseFloat(totalNGN) : priceAmount,
    status: "paid",
    // Reuse paystackReference field — prefixed with CRYPTO- to distinguish
    paystackReference: cryptoRef,
    address: address
      ? {
          name: address.name ?? "",
          line1: address.line1 ?? "",
          line2: address.line2 ?? "",
          city: address.city ?? "",
          postcode: address.postcode ?? "",
          country: address.country ?? "",
        }
      : undefined,
    // Extra crypto payment info
    cryptoPayment: {
      paymentId,
      payCurrency,
      actuallyPaid,
      priceCurrency,
      priceAmount,
      status,
    },
    createdAt: new Date().toISOString(),
  });

  console.log(`Crypto order created: ${order._id} (${orderNumber})`);

  // 7. Decrement stock
  await productIds
    .reduce(
      (tx, productId, i) =>
        tx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
      writeClient.transaction()
    )
    .commit();

  console.log(`Stock updated for ${productIds.length} products`);

  // 8. Clean up pending doc
  try {
    await writeClient.delete(`pending-crypto-${paymentId}`);
  } catch {
    // Non-critical
  }
}