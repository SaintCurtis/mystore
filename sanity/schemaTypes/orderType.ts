// sanity/schemaTypes/orderType.ts
// CHANGES: added paystackReference, buyerName, shippingFee, shippingMethod,
// state, lga, countryCode fields. Added isNegotiatedDeal, agreedPrice,
// originalPrice, savedAmount for negotiated orders.

import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

const ORDER_STATUS_SANITY_LIST = [
  { title: "Paid",        value: "paid"        },
  { title: "Processing",  value: "processing"  },
  { title: "Shipped",     value: "shipped"     },
  { title: "Delivered",   value: "delivered"   },
  { title: "Cancelled",   value: "cancelled"   },
];

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  groups: [
    { name: "details",     title: "Order Details",  default: true },
    { name: "customer",    title: "Customer"                       },
    { name: "shipping",    title: "Shipping"                       },
    { name: "payment",     title: "Payment"                        },
    { name: "negotiation", title: "Negotiation"                    },
  ],
  fields: [
    // ── Order Details ─────────────────────────────────────────────────────
    defineField({
      name: "orderNumber",
      type: "string",
      group: "details",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      group: "details",
      initialValue: "paid",
      options: { list: ORDER_STATUS_SANITY_LIST, layout: "radio" },
    }),
    defineField({
      name: "items",
      type: "array",
      group: "details",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "product", type: "reference", to: [{ type: "product" }], validation: (r) => r.required() }),
            defineField({ name: "quantity", type: "number", initialValue: 1, validation: (r) => r.required().min(1) }),
            defineField({ name: "priceAtPurchase", type: "number", description: "Price at time of purchase in NGN", validation: (r) => r.required() }),
          ],
          preview: {
            select: { title: "product.name", quantity: "quantity", price: "priceAtPurchase", media: "product.images.0" },
            prepare({ title, quantity, price, media }) {
              return { title: title ?? "Product", subtitle: `Qty: ${quantity} • ₦${(price ?? 0).toLocaleString()}`, media };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "total",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Total amount paid (including shipping) in NGN",
    }),
    defineField({
      name: "subtotal",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Items subtotal (excluding shipping) in NGN",
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),

    // ── Customer ──────────────────────────────────────────────────────────
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
      group: "customer",
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "customer",
      readOnly: true,
    }),
    defineField({
      name: "email",
      type: "string",
      group: "customer",
      readOnly: true,
    }),
    defineField({
      name: "buyerName",
      title: "Buyer Name",
      type: "string",
      group: "customer",
      readOnly: true,
    }),

    // ── Shipping ──────────────────────────────────────────────────────────
    defineField({
      name: "shippingFee",
      title: "Shipping Fee (₦)",
      type: "number",
      group: "shipping",
      readOnly: true,
    }),
    defineField({
      name: "shippingMethod",
      title: "Shipping Method",
      type: "string",
      group: "shipping",
      readOnly: true,
    }),
    defineField({
      name: "address",
      type: "object",
      group: "shipping",
      fields: [
        defineField({ name: "name",        type: "string", title: "Full Name"         }),
        defineField({ name: "line1",       type: "string", title: "Address Line 1"    }),
        defineField({ name: "line2",       type: "string", title: "Address Line 2"    }),
        defineField({ name: "city",        type: "string", title: "City"              }),
        defineField({ name: "state",       type: "string", title: "State / Region"    }),
        defineField({ name: "lga",         type: "string", title: "LGA"               }),
        defineField({ name: "postcode",    type: "string", title: "Postcode"          }),
        defineField({ name: "country",     type: "string", title: "Country"           }),
        defineField({ name: "countryCode", type: "string", title: "Country Code"      }),
      ],
    }),

    // ── Payment ───────────────────────────────────────────────────────────
    defineField({
      name: "paystackReference",
      title: "Paystack Reference",
      type: "string",
      group: "payment",
      readOnly: true,
    }),

    // ── Negotiation ───────────────────────────────────────────────────────
    defineField({
      name: "isNegotiatedDeal",
      title: "Negotiated Deal?",
      type: "boolean",
      group: "negotiation",
      initialValue: false,
    }),
    defineField({
      name: "agreedPrice",
      title: "Agreed Price (₦)",
      type: "number",
      group: "negotiation",
      hidden: ({ document }) => !document?.isNegotiatedDeal,
      readOnly: true,
    }),
    defineField({
      name: "originalPrice",
      title: "Original Listed Price (₦)",
      type: "number",
      group: "negotiation",
      hidden: ({ document }) => !document?.isNegotiatedDeal,
      readOnly: true,
    }),
    defineField({
      name: "savedAmount",
      title: "Amount Saved (₦)",
      type: "number",
      group: "negotiation",
      hidden: ({ document }) => !document?.isNegotiatedDeal,
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      orderNumber: "orderNumber",
      email:       "email",
      buyerName:   "buyerName",
      total:       "total",
      status:      "status",
      negotiated:  "isNegotiatedDeal",
    },
    prepare({ orderNumber, email, buyerName, total, status, negotiated }) {
      const name = buyerName || email || "Unknown";
      return {
        title:    `${negotiated ? "🤝 " : ""}Order ${orderNumber ?? "N/A"}`,
        subtitle: `${name} • ₦${(total ?? 0).toLocaleString()} • ${status ?? "paid"}`,
      };
    },
  },

  orderings: [{
    title: "Newest First",
    name: "createdAtDesc",
    by: [{ field: "createdAt", direction: "desc" }],
  }],
});