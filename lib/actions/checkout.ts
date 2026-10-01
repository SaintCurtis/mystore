"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { ORDER_BY_PAYSTACK_REFERENCE_DETAIL_QUERY } from "@/lib/sanity/queries/orders";
import { getOrCreatePaystackCustomer } from "@/lib/actions/customer";
import { SITE_URL } from "@/lib/constants/site";

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
    amount: number;
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

export async function createCheckoutSession(
  items: CartItem[],
  shippingAddress: ShippingAddress,
  shippingFee: number = 0,
  shippingMethod: string = ""
): Promise<CheckoutResult> {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, { ids: productIds });

    const validationErrors: string[] = [];
    const validatedItems: { product: (typeof products)[number]; quantity: number }[] = [];

    for (const item of items) {
      const product = products.find((p: { _id: string }) => p._id === item.productId);
      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
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

    const totalNGN = validatedItems.reduce(
      (sum, { product, quantity }) => sum + (product.price ?? 0) * quantity,
      0
    );
    const totalNGNWithShipping = totalNGN + shippingFee;
    const totalKobo = Math.round(totalNGNWithShipping * 100);

    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

    const { sanityCustomerId } = await getOrCreatePaystackCustomer(userEmail, userName, userId);

    const baseUrl = SITE_URL;

    const metadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId: sanityCustomerId ?? "",
      productIds: validatedItems.map((i) => i.product._id).join(","),
      quantities: validatedItems.map((i) => i.quantity).join(","),
      prices: validatedItems.map((i) => Math.round((i.product.price ?? 0) * 100)).join(","),
      shippingFee: shippingFee.toString(),
      shippingMethod,
      shippingAddress: JSON.stringify(shippingAddress),
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
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
    });

    const data = (await response.json()) as PaystackInitResponse;

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack init failed:", data.message);
      return { success: false, error: "Could not initialize payment" };
    }

    return { success: true, url: data.data.authorization_url };
  } catch (error) {
    console.error("Checkout error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ── Verify Payment ─────────────────────────────────────────────────────────

export async function getCheckoutSession(reference: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" } as const;
    }

    // ── Primary source of truth: the order the Paystack webhook already
    //    created. The webhook is server-to-server and only runs after
    //    Paystack's own signature-verified payment confirmation, so an
    //    order existing here is a stronger signal than re-verifying live
    //    against Paystack from this page — and it's the only source that
    //    gives us real line items, since Paystack's verify response only
    //    knows the amount charged, not your product catalog.
    //
    //    The webhook is normally near-instant but isn't guaranteed to have
    //    landed the moment the browser reaches this page after redirect,
    //    so retry briefly (webhooks here have never taken more than a
    //    couple of seconds in testing) before falling back.
    let order = await client.fetch(ORDER_BY_PAYSTACK_REFERENCE_DETAIL_QUERY, {
      paystackReference: reference,
    });
    for (let attempt = 0; !order && attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      order = await client.fetch(ORDER_BY_PAYSTACK_REFERENCE_DETAIL_QUERY, {
        paystackReference: reference,
      });
    }

    if (order) {
      if (order.clerkUserId !== userId) {
        // The order exists — payment definitely succeeded — it just
        // doesn't belong to whoever's browser session is loading this
        // page right now. Still not "payment failed."
        return {
          success: false,
          error: "This order belongs to a different account",
          paymentConfirmed: true,
        } as const;
      }

      const lineItems = (order.items ?? []).map(
        (item: { product?: { name?: string }; quantity?: number; priceAtPurchase?: number }) => ({
          name: item.product?.name ?? "Item",
          quantity: item.quantity ?? 1,
          // kobo, line total (quantity × unit price) — matches the shape
          // the live-Paystack fallback below would have produced.
          amount: Math.round((item.priceAtPurchase ?? 0) * (item.quantity ?? 1) * 100),
        })
      );

      return {
        success: true,
        session: {
          id: order.paystackReference ?? reference,
          customerEmail: order.email,
          customerName: order.buyerName,
          amountTotal: Math.round((order.total ?? 0) * 100), // NGN → kobo
          paymentStatus: "success",
          shippingFee: order.shippingFee ?? 0,
          shippingMethod: order.shippingMethod ?? "",
          shippingAddress: order.address
            ? {
                line1: order.address.line1,
                line2: order.address.line2,
                city: order.address.city,
                state: order.address.state ?? null,
                postal_code: order.address.postcode,
                country: order.address.country,
              }
            : null,
          lineItems,
          metadata: {
            isNegotiatedDeal: order.isNegotiatedDeal ? "true" : "false",
            agreedPrice: order.agreedPrice ? String(order.agreedPrice) : "",
          },
        },
      } as const;
    }

    // ── Fallback: live Paystack verification ───────────────────────────────
    // No order yet after retrying — ask Paystack directly, same check as
    // before this fix.
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const data = (await response.json()) as PaystackVerifyResponse;

    if (!data.status || data.data.status !== "success") {
      // The one case where "payment failed" is actually the honest message.
      return { success: false, error: "Payment not successful" } as const;
    }

    const tx = data.data;

    if (tx.metadata?.clerkUserId !== userId) {
      // Paystack confirms the charge succeeded — don't tell the customer
      // it failed just because this page can't match it to the current
      // session. The webhook will still create the order shortly.
      return {
        success: false,
        error: "Payment confirmed — order is still being finalized",
        paymentConfirmed: true,
      } as const;
    }

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
          [tx.customer?.first_name, tx.customer?.last_name].filter(Boolean).join(" ") ||
          tx.customer?.email,
        amountTotal: tx.amount,
        paymentStatus: tx.status,
        shippingFee: tx.metadata?.shippingFee ? Number(tx.metadata.shippingFee) : 0,
        shippingMethod: tx.metadata?.shippingMethod ?? "",
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
        // Paystack's verify response doesn't carry catalog detail — the
        // order path above (once the webhook lands) is the only source
        // for real line items.
        lineItems: [],
        metadata: tx.metadata ?? {},
      },
    } as const;
  } catch (error) {
    console.error("Verify payment error:", error);
    return { success: false, error: "Could not retrieve order details" } as const;
  }
}