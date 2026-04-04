import { defineField, defineType } from "sanity";

/**
 * Temporary document used to pass order metadata through the NOWPayments flow.
 *
 * WHY: Unlike Paystack/Stripe, NOWPayments invoices don't support arbitrary
 * metadata passthrough. So we store the pending order data here when the
 * invoice is created, and the IPN webhook retrieves + deletes it on confirmation.
 *
 * Documents are auto-deleted by the webhook after order creation.
 * They should also be cleaned up by a scheduled job if payment never completes.
 */
export const pendingCryptoOrderType = defineType({
  name: "pendingCryptoOrder",
  title: "Pending Crypto Order",
  type: "document",
  fields: [
    defineField({
      name: "nowpaymentsId",
      title: "NOWPayments Invoice ID",
      type: "string",
    }),
    defineField({
      name: "metadata",
      title: "Order Metadata",
      type: "object",
      fields: [
        { name: "clerkUserId",      type: "string", title: "Clerk User ID" },
        { name: "userEmail",        type: "string", title: "User Email" },
        { name: "sanityCustomerId", type: "string", title: "Sanity Customer ID" },
        { name: "productIds",       type: "string", title: "Product IDs (comma-separated)" },
        { name: "quantities",       type: "string", title: "Quantities (comma-separated)" },
        { name: "prices",           type: "string", title: "Prices in kobo (comma-separated)" },
        { name: "totalNGN",         type: "string", title: "Total in NGN" },
        { name: "shippingAddress",  type: "text",   title: "Shipping Address (JSON)" },
      ],
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "nowpaymentsId",
      subtitle: "metadata.userEmail",
    },
  },
});