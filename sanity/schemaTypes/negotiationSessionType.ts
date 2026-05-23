import { defineField, defineType } from "sanity";

export const negotiationSessionType = defineType({
  name: "negotiationSession",
  title: "Negotiation Sessions",
  type: "document",
  // ── Newest first in Studio ──────────────────────────────────────────────
  orderings: [
    {
      title: "Newest First",
      name: "startedAtDesc",
      by: [{ field: "startedAt", direction: "desc" }],
    },
    {
      title: "Last Activity",
      name: "lastActivityDesc",
      by: [{ field: "lastActivityAt", direction: "desc" }],
    },
  ],
  fields: [
    defineField({
      name: "sessionId",
      title: "Session ID",
      type: "string",
      readOnly: true,
    }),
    // ── NEW: Clerk user linkage ─────────────────────────────────────────
    // Populated when a signed-in user starts a negotiation.
    // Allows fetching all sessions for a user → "My Negotiations" history.
    defineField({
      name: "userId",
      title: "Clerk User ID",
      type: "string",
      readOnly: true,
      description: "Clerk user ID — set when a signed-in customer negotiates",
    }),
    defineField({
      name: "userEmail",
      title: "Customer Email",
      type: "string",
      readOnly: true,
      description: "For admin reference — populated from Clerk when available",
    }),
    defineField({
      name: "productId",
      title: "Product ID",
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
          { title: "🤖 AI Active",    value: "ai_active"    },
          { title: "👤 Owner Active", value: "owner_active" },
          { title: "🤝 Deal Struck",  value: "deal_struck"  },
          { title: "❌ Closed",       value: "closed"       },
        ],
        layout: "radio",
      },
      initialValue: "ai_active",
    }),
    defineField({
      name: "agreedPrice",
      title: "Agreed Price (₦)",
      type: "number",
    }),
    defineField({
      name: "closeBidAlert",
      title: "Close Bid Alert",
      type: "boolean",
      description: "True when customer bid is within 10% of floor — needs attention",
      initialValue: false,
    }),
    defineField({
      name: "customerBid",
      title: "Closest Customer Bid (₦)",
      type: "number",
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
            defineField({ name: "role",      type: "string",   title: "Role" }),
            defineField({ name: "content",   type: "text",     title: "Content" }),
            defineField({ name: "sender",    type: "string",   title: "Sender", description: "ai | owner | customer" }),
            defineField({ name: "timestamp", type: "datetime", title: "Timestamp" }),
          ],
          preview: {
            select: { title: "sender", subtitle: "content" },
            prepare: ({ title, subtitle }) => ({
              title: `[${title ?? "?"}]`,
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
      agreed:   "agreedPrice",
      started:  "startedAt",
    },
    prepare({ title, subtitle, alert, bid, agreed, started }) {
      const date = started ? new Date(started).toLocaleDateString("en-NG") : "";
      const priceInfo = agreed
        ? `✅ ₦${Number(agreed).toLocaleString()}`
        : bid
        ? `Bid ₦${Number(bid).toLocaleString()}`
        : "";
      return {
        title: `${alert ? "🔔 " : ""}${title ?? "Unknown product"}`,
        subtitle: [subtitle ?? "ai_active", priceInfo, date].filter(Boolean).join(" · "),
      };
    },
  },
});