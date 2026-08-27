// sanity/schemaTypes/layawayPlanType.ts
import { CreditCardIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

const LAYAWAY_STATUS_LIST = [
  { title: "Active",    value: "active"    }, // below 50% paid
  { title: "Reserved",  value: "reserved"  }, // 50%+ paid, unit held
  { title: "Completed", value: "completed" }, // fully paid, order created
  { title: "Cancelled", value: "cancelled" },
];

export const layawayPlanType = defineType({
  name: "layawayPlan",
  title: "Layaway Plan",
  type: "document",
  icon: CreditCardIcon,
  groups: [
    { name: "details",  title: "Plan Details", default: true },
    { name: "payments", title: "Payments" },
  ],
  fields: [
    // ── Plan Details ─────────────────────────────────────────────────────
    defineField({
      name: "planNumber",
      type: "string",
      group: "details",
      readOnly: true,
      validation: (rule) => rule.required().error("Plan number is required"),
    }),
    defineField({
      name: "status",
      type: "string",
      group: "details",
      initialValue: "active",
      options: { list: LAYAWAY_STATUS_LIST, layout: "radio" },
    }),
    defineField({
      name: "product",
      type: "reference",
      to: [{ type: "product" }],
      group: "details",
      validation: (rule) => rule.required().error("A layaway plan must be linked to one product"),
    }),
    defineField({
      name: "productNameSnapshot",
      title: "Product Name (at plan start)",
      type: "string",
      group: "details",
      readOnly: true,
      description: "Captured at plan creation in case the product listing changes later",
    }),
    defineField({
      name: "totalAmount",
      title: "Total Amount (₦)",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Price locked in at plan start — honoured for 90 days per Layaway policy",
    }),
    defineField({
      name: "amountPaid",
      title: "Amount Paid (₦)",
      type: "number",
      group: "details",
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: "paceMonths",
      title: "Chosen Pace (months)",
      type: "number",
      group: "details",
      description: "Illustrative only — the customer may pay faster, slower, or in irregular amounts",
    }),
    defineField({
      name: "startedAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "priceLockExpiresAt",
      title: "Price Lock Expires",
      type: "datetime",
      group: "details",
      readOnly: true,
      description: "90 days from plan start — plans still open after this are re-checked against the current price",
    }),
    defineField({
      name: "nextPaymentReminderAt",
      title: "Next Payment Reminder",
      type: "datetime",
      group: "details",
      description: "Optional — the customer's own estimate of their next top-up date, shown back to them on their profile",
    }),

    // ── Customer ──────────────────────────────────────────────────────────
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
      group: "details",
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "details",
      readOnly: true,
    }),

    // ── Payments ──────────────────────────────────────────────────────────
    defineField({
      name: "payments",
      title: "Payment History",
      type: "array",
      group: "payments",
      description: "Each successful Paystack charge against this plan, appended by the payments webhook",
      of: [
        defineArrayMember({
          type: "object",
          name: "layawayPayment",
          fields: [
            defineField({ name: "amount", type: "number", title: "Amount (₦)", validation: (r) => r.required() }),
            defineField({ name: "paidAt", type: "datetime", title: "Paid At", validation: (r) => r.required() }),
            defineField({ name: "paystackReference", type: "string", title: "Paystack Reference", readOnly: true }),
          ],
          preview: {
            select: { amount: "amount", paidAt: "paidAt" },
            prepare({ amount, paidAt }: { amount?: number; paidAt?: string }) {
              return {
                title: `₦${(amount ?? 0).toLocaleString()}`,
                subtitle: paidAt ? new Date(paidAt).toLocaleDateString() : "",
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "resultingOrder",
      title: "Resulting Order",
      type: "reference",
      to: [{ type: "order" }],
      group: "payments",
      readOnly: true,
      description: "Set automatically once the plan is fully paid and an order is created for shipping",
    }),
  ],

  preview: {
    select: {
      planNumber: "planNumber",
      product: "product.name",
      total: "totalAmount",
      paid: "amountPaid",
      status: "status",
    },
    prepare({ planNumber, product, total, paid, status }: { planNumber?: string; product?: string; total?: number; paid?: number; status?: string }) {
      const pct = total ? Math.round(((paid ?? 0) / total) * 100) : 0;
      return {
        title: `${product ?? "Layaway"} — ${planNumber ?? ""}`,
        subtitle: `₦${(paid ?? 0).toLocaleString()} / ₦${(total ?? 0).toLocaleString()} (${pct}%) • ${status ?? "active"}`,
      };
    },
  },

  orderings: [
    { title: "Newest First", name: "startedAtDesc", by: [{ field: "startedAt", direction: "desc" }] },
  ],
});
