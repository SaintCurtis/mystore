"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { LAYAWAY_PLAN_BY_ID_QUERY } from "@/lib/sanity/queries/profile";
import { getOrCreatePaystackCustomer } from "@/lib/actions/customer";
import { SITE_URL } from "@/lib/constants/site";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

interface LayawayPaymentInput {
  /** Provide to start a brand-new plan */
  productId?: string;
  /** Provide to top up an existing plan instead of starting a new one */
  planId?: string;
  /** NGN, whole naira */
  amount: number;
  /** Only used when creating a new plan — illustrative, stored for display */
  paceMonths?: number;
}

interface LayawayPaymentResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
}

export async function initializeLayawayPayment(
  input: LayawayPaymentInput
): Promise<LayawayPaymentResult> {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return { success: false, error: "Please sign in to continue" };
    }

    const amount = Math.round(input.amount);
    if (!amount || amount <= 0) {
      return { success: false, error: "Enter a valid amount" };
    }

    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;
    const { sanityCustomerId } = await getOrCreatePaystackCustomer(
      userEmail,
      userName,
      userId
    );

    let productId = input.productId;

    if (input.planId) {
      // ── Top-up an existing plan ─────────────────────────────────────────
      const plan = await client.fetch(LAYAWAY_PLAN_BY_ID_QUERY, {
        id: input.planId,
        clerkUserId: userId,
      });
      if (!plan) return { success: false, error: "Layaway plan not found" };
      if (plan.status === "completed" || plan.status === "cancelled") {
        return { success: false, error: "This plan is no longer accepting payments" };
      }
      const remaining = (plan.totalAmount ?? 0) - (plan.amountPaid ?? 0);
      if (amount > remaining) {
        return {
          success: false,
          error: `That's more than the remaining balance of ₦${remaining.toLocaleString()}`,
        };
      }
      productId = plan.productId ?? undefined;
    } else if (input.productId) {
      // ── New plan — validate the product and cap the deposit ────────────
      const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
        ids: [input.productId],
      });
      const product = products?.[0];
      if (!product) return { success: false, error: "Product not found" };
      if ((product.stock ?? 0) === 0) {
        return { success: false, error: "This product is out of stock" };
      }
      if (amount > (product.price ?? 0)) {
        return { success: false, error: "A layaway deposit can't exceed the item price" };
      }
    } else {
      return { success: false, error: "Missing product or plan reference" };
    }

    const metadata = {
      isLayawayDeposit: "true",
      clerkUserId: userId,
      userEmail,
      sanityCustomerId: sanityCustomerId ?? "",
      buyerName: userName,
      productId: productId ?? "",
      layawayPlanId: input.planId ?? "",
      paceMonths: input.paceMonths ? String(input.paceMonths) : "",
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: amount * 100,
        currency: "NGN",
        callback_url: `${SITE_URL}/profile?tab=layaway&layaway=success`,
        metadata,
      }),
    });

    const data = (await response.json()) as PaystackInitResponse;

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack layaway init failed:", data.message);
      return { success: false, error: "Could not start payment" };
    }

    return { success: true, url: data.data.authorization_url };
  } catch (error) {
    console.error("Layaway payment error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
