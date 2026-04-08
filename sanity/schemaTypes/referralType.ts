import { defineField, defineType } from "sanity";

export const referralType = defineType({
  name: "referral",
  title: "Referral Codes",
  type: "document",
  fields: [
    defineField({ name: "clerkUserId",    title: "Clerk User ID",    type: "string" }),
    defineField({ name: "email",          title: "Referrer Email",   type: "string" }),
    defineField({ name: "name",           title: "Referrer Name",    type: "string" }),
    defineField({ name: "code",           title: "Referral Code",    type: "string" }),
    defineField({ name: "clicks",         title: "Link Clicks",      type: "number", initialValue: 0 }),
    defineField({ name: "conversions",    title: "Conversions",      type: "number", initialValue: 0 }),
    defineField({ name: "totalEarned",    title: "Total Discount Earned (NGN)", type: "number", initialValue: 0 }),
    defineField({ name: "createdAt",      title: "Created At",       type: "datetime" }),
  ],
  preview: {
    select: { title: "code", subtitle: "email" },
  },
});

export const referralClickType = defineType({
  name: "referralClick",
  title: "Referral Clicks",
  type: "document",
  fields: [
    defineField({ name: "code",        title: "Referral Code",  type: "string" }),
    defineField({ name: "referrerId",  title: "Referrer ID",    type: "string" }),
    defineField({ name: "convertedOrderId", title: "Converted Order ID", type: "string" }),
    defineField({ name: "converted",   title: "Converted?",     type: "boolean", initialValue: false }),
    defineField({ name: "clickedAt",   title: "Clicked At",     type: "datetime" }),
  ],
});