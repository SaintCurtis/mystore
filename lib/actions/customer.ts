"use server";

import { client, writeClient } from "@/sanity/lib/client";
import { CUSTOMER_BY_EMAIL_QUERY } from "@/lib/sanity/queries/customers";

/**
 * Gets or creates a customer by email and syncs to Sanity.
 * No Stripe dependency — Paystack does not require pre-created customers.
 */
export async function getOrCreatePaystackCustomer(
  email: string,
  name: string,
  clerkUserId: string
): Promise<{ sanityCustomerId: string }> {
  const existingCustomer = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, {
    email,
  });

  if (existingCustomer) {
    await writeClient
      .patch(existingCustomer._id)
      .set({ name, clerkUserId })
      .commit();
    return { sanityCustomerId: existingCustomer._id };
  }

  const newCustomer = await writeClient.create({
    _type: "customer",
    email,
    name,
    clerkUserId,
    createdAt: new Date().toISOString(),
  });

  return { sanityCustomerId: newCustomer._id };
}