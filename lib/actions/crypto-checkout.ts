"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { getOrCreatePaystackCustomer } from "@/lib/actions/customer";

if (!process.env.NOWPAYMENTS_API_KEY) {
  throw new Error("NOWPAYMENTS_API_KEY is not defined");
}

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_BASE = "https://api.nowpayments.io/v1";

// ── Types ──────────────────────────────────────────────────────────────────

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  paymentId?: string;
  error?: string;
}

interface NOWPaymentsInvoiceResponse {
  id: string;
  invoice_url: string;
  status: string;
}

// ── Create Crypto Checkout ─────────────────────────────────────────────────

/**
 * Creates a NOWPayments invoice from cart items.
 * NOWPayments handles the crypto → fiat conversion automatically.
 * Supported coins: BTC, ETH, USDT (TRC20/ERC20), BNB, SOL, and 300+ more.
 *
 * Flow:
 * 1. Validate cart items against Sanity
 * 2. Create NOWPayments invoice (priced in USD — NOWPayments converts)
 * 3. Redirect user to invoice payment page
 * 4. NOWPayments sends IPN webhook on payment confirmation
 * 5. Webhook creates order in Sanity + decrements stock
 */
export async function createCryptoCheckoutSession(
  items: CartItem[],
  shippingAddress: ShippingAddress
): Promise<CheckoutResult> {
  try {
    // 1. Auth check
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    // 2. Validate products against Sanity
    const productIds = items.map((i) => i.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    const validationErrors: string[] = [];
    const validatedItems: { product: (typeof products)[number]; quantity: number }[] = [];

    for (const item of items) {
      const product = products.find((p: { _id: string }) => p._id === item.productId);
      if (!product) {
        validationErrors.push(`"${item.name}" is no longer available`);
        continue;
      }
      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }
      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(`Only ${product.stock} of "${product.name}" available`);
        continue;
      }
      validatedItems.push({ product, quantity: item.quantity });
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    // 3. Calculate total in NGN
    const totalNGN = validatedItems.reduce(
      (sum, { product, quantity }) => sum + (product.price ?? 0) * quantity,
      0
    );

    // Convert NGN → USD for NOWPayments
    // NOWPayments requires USD pricing — we fetch live rate
    // Fallback: 1 USD ≈ 1600 NGN (update this or use a live rate API)
    let usdRate = 1600;
    try {
      const rateRes = await fetch(
        "https://api.exchangerate-api.com/v4/latest/NGN",
        { next: { revalidate: 3600 } } // cache 1 hour
      );
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        usdRate = 1 / (rateData?.rates?.USD ?? 0.000625);
      }
    } catch {
      // use fallback rate
    }

    const totalUSD = totalNGN / usdRate;

    // 4. Get or create customer
    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;
    const { sanityCustomerId } = await getOrCreatePaystackCustomer(userEmail, userName, userId);

    // 5. Build URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    // 6. Build order description
    const orderDescription = validatedItems
      .map(({ product, quantity }) => `${quantity}x ${product.name}`)
      .join(", ");

    // 7. Metadata to pass through IPN webhook
    const orderMetadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId: sanityCustomerId ?? "",
      productIds: validatedItems.map((i) => i.product._id).join(","),
      quantities: validatedItems.map((i) => i.quantity).join(","),
      prices: validatedItems.map((i) => Math.round((i.product.price ?? 0) * 100)).join(","),
      totalNGN: totalNGN.toString(),
      shippingAddress: JSON.stringify(shippingAddress),
    };

    // 8. Create NOWPayments invoice
    const invoiceRes = await fetch(`${NOWPAYMENTS_BASE}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: parseFloat(totalUSD.toFixed(2)),
        price_currency: "usd",
        // order_id is what comes back in the IPN webhook
        order_id: `CRYPTO-${Date.now().toString(36).toUpperCase()}`,
        order_description: orderDescription,
        ipn_callback_url: `${baseUrl}/api/webhooks/nowpayments`,
        success_url: `${baseUrl}/checkout/success?crypto=true`,
        cancel_url: `${baseUrl}/checkout`,
        // Pass metadata as stringified JSON in order_description field
        // NOWPayments doesn't have a metadata field — we use order_id to tag
        // and pass full metadata via a separate mechanism (see webhook handler)
        is_fixed_rate: false,
        is_fee_paid_by_user: false,
      }),
    });

    if (!invoiceRes.ok) {
      const errText = await invoiceRes.text();
      console.error("NOWPayments invoice error:", errText);
      return { success: false, error: "Could not create crypto payment" };
    }

    const invoiceData = (await invoiceRes.json()) as NOWPaymentsInvoiceResponse;

    if (!invoiceData.invoice_url) {
      return { success: false, error: "No payment URL returned" };
    }

    // 9. Store metadata in a temp Sanity doc so webhook can retrieve it
    // (NOWPayments doesn't support custom metadata — we use order_id as key)
    await storePendingCryptoOrder(invoiceData.id, orderMetadata);

    return {
      success: true,
      url: invoiceData.invoice_url,
      paymentId: invoiceData.id,
    };
  } catch (error) {
    console.error("Crypto checkout error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ── Store pending order metadata in Sanity ─────────────────────────────────
// Since NOWPayments doesn't support metadata passthrough like Paystack/Stripe,
// we store the pending order data temporarily in Sanity.
// The webhook retrieves this by NOWPayments payment ID, then deletes it.

import { writeClient } from "@/sanity/lib/client";

async function storePendingCryptoOrder(
  nowpaymentsId: string,
  metadata: Record<string, string>
) {
  await writeClient.createOrReplace({
    _type: "pendingCryptoOrder",
    _id: `pending-crypto-${nowpaymentsId}`,
    nowpaymentsId,
    metadata,
    createdAt: new Date().toISOString(),
  });
}