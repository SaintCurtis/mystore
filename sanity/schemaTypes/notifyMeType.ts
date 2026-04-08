import { defineField, defineType } from "sanity";

export const notifyMeType = defineType({
  name: "notifyMe",
  title: "Notify Me Subscribers",
  type: "document",
  fields: [
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
    }),
    defineField({ name: "productName", title: "Product Name (cached)", type: "string" }),
    defineField({ name: "notified", title: "Notified?", type: "boolean", initialValue: false }),
    defineField({ name: "createdAt", title: "Subscribed At", type: "datetime" }),
    defineField({ name: "notifiedAt", title: "Notified At", type: "datetime" }),
  ],
  preview: {
    select: { title: "email", subtitle: "productName" },
  },
});