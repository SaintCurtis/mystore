"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { getOrCreatePaystackCustomer } from "@/lib/actions/customer";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// ── Types ──────────────────────────────────────────────────────────────────

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    amount: number; // in kobo
    currency: string;
    customer: {
      email: string;
      first_name?: string;
      last_name?: string;
    };
    metadata: Record<string, string>;
  };
}

// ── Create Checkout ────────────────────────────────────────────────────────

/**
 * Initializes a Paystack transaction from cart items.
 * Validates stock and prices against Sanity before initializing.
 */
export async function createCheckoutSession(
  items: CartItem[],
  shippingAddress: ShippingAddress
): Promise<CheckoutResult> {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    // 2. Validate cart is not empty
    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    // 3. Fetch current product data from Sanity to validate prices/stock
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    // 4. Validate each item
    const validationErrors: string[] = [];
    const validatedItems: {
      product: (typeof products)[number];
      quantity: number;
    }[] = [];

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId
      );

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
        continue;
      }

      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }

      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`
        );
        continue;
      }

      validatedItems.push({ product, quantity: item.quantity });
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    // 5. Calculate total in kobo (₦1 = 100 kobo)
    const totalKobo = validatedItems.reduce(
      (sum, { product, quantity }) =>
        sum + Math.round((product.price ?? 0) * 100) * quantity,
      0
    );

    // 6. Get or create customer in Sanity
    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

    const { sanityCustomerId } = await getOrCreatePaystackCustomer(
      userEmail,
      userName,
      userId
    );

    // 7. Build base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    // 8. Prepare metadata — passed through to webhook
    const metadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId: sanityCustomerId ?? "",
      productIds: validatedItems.map((i) => i.product._id).join(","),
      quantities: validatedItems.map((i) => i.quantity).join(","),
      prices: validatedItems
        .map((i) => Math.round((i.product.price ?? 0) * 100))
        .join(","),
      // Shipping address stored in metadata since Paystack doesn't collect it
      shippingAddress: JSON.stringify(shippingAddress),
    };

    // 9. Initialize Paystack transaction
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          amount: totalKobo,
          currency: "NGN",
          callback_url: `${baseUrl}/checkout/success`,
          metadata,
        }),
      }
    );

    const data = (await response.json()) as PaystackInitResponse;

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack init failed:", data.message);
      return { success: false, error: "Could not initialize payment" };
    }

    return { success: true, url: data.data.authorization_url };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

// ── Verify Payment (for success page) ─────────────────────────────────────

/**
 * Verifies a Paystack transaction by reference.
 * Paystack redirects to callback_url with ?reference=xxx after payment.
 */
export async function getCheckoutSession(reference: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = (await response.json()) as PaystackVerifyResponse;

    if (!data.status || data.data.status !== "success") {
      return { success: false, error: "Payment not successful" };
    }

    const tx = data.data;

    // Verify this transaction belongs to the current user
    if (tx.metadata?.clerkUserId !== userId) {
      return { success: false, error: "Transaction not found" };
    }

    // Parse shipping address from metadata if available
    let shippingAddress = null;
    if (tx.metadata?.shippingAddress) {
      try {
        shippingAddress = JSON.parse(tx.metadata.shippingAddress) as {
          name?: string;
          line1?: string;
          line2?: string;
          city?: string;
          postcode?: string;
          country?: string;
        };
      } catch {
        // ignore parse errors
      }
    }

    return {
      success: true,
      session: {
        id: tx.reference,
        customerEmail: tx.customer?.email,
        customerName:
          [tx.customer?.first_name, tx.customer?.last_name]
            .filter(Boolean)
            .join(" ") || tx.customer?.email,
        amountTotal: tx.amount, // in kobo
        paymentStatus: tx.status,
        shippingAddress: shippingAddress
          ? {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2,
              city: shippingAddress.city,
              state: null,
              postal_code: shippingAddress.postcode,
              country: shippingAddress.country,
            }
          : null,
        lineItems: [],
      },
    };
  } catch (error) {
    console.error("Verify payment error:", error);
    return { success: false, error: "Could not retrieve order details" };
  }
}
