import { defineField, defineType } from "sanity";

export const negotiationSessionType = defineType({
  name: "negotiationSession",
  title: "Negotiation Sessions",
  type: "document",
  fields: [
    defineField({
      name: "sessionId",
      title: "Session ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "productSlug",
      title: "Product Slug",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "productName",
      title: "Product Name",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "listedPrice",
      title: "Listed Price (₦)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "floorPrice",
      title: "Floor Price (₦)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "🤖 AI Active",      value: "ai_active"     },
          { title: "👤 Owner Active",   value: "owner_active"  },
          { title: "🤝 Deal Struck",    value: "deal_struck"   },
          { title: "❌ Closed",         value: "closed"        },
        ],
        layout: "radio",
      },
      initialValue: "ai_active",
    }),
    defineField({
      name: "agreedPrice",
      title: "Agreed Price (₦) — set when deal struck",
      type: "number",
    }),
    defineField({
      name: "closeBidAlert",
      title: "Close Bid Alert",
      type: "boolean",
      description: "True when customer bid within 15% of floor — needs your attention",
      initialValue: false,
    }),
    defineField({
      name: "customerBid",
      title: "Closest Customer Bid (₦)",
      type: "number",
      description: "The bid that triggered the alert",
    }),
    defineField({
      name: "messages",
      title: "Messages",
      type: "array",
      of: [
        {
          type: "object",
          name: "message",
          fields: [
            defineField({ name: "role",      type: "string", title: "Role" }),
            defineField({ name: "content",   type: "text",   title: "Content" }),
            defineField({ name: "sender",    type: "string", title: "Sender", description: "ai | owner | customer" }),
            defineField({ name: "timestamp", type: "datetime", title: "Timestamp" }),
          ],
          preview: {
            select: { title: "role", subtitle: "content" },
            prepare: ({ title, subtitle }) => ({
              title: `[${title}]`,
              subtitle: (subtitle ?? "").slice(0, 80),
            }),
          },
        },
      ],
    }),
    defineField({
      name: "startedAt",
      title: "Started At",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "lastActivityAt",
      title: "Last Activity",
      type: "datetime",
    }),
  ],

  preview: {
    select: {
      title:    "productName",
      subtitle: "status",
      alert:    "closeBidAlert",
      bid:      "customerBid",
    },
    prepare({ title, subtitle, alert, bid }) {
      return {
        title: `${alert ? "🔔 " : ""}${title ?? "Unknown product"}`,
        subtitle: `${subtitle ?? "ai_active"}${bid ? ` · Bid ₦${Number(bid).toLocaleString()}` : ""}`,
      };
    },
  },
});