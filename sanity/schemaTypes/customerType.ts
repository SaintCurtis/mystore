// sanity/schemaTypes/customerType.ts
import { UserIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  icon: UserIcon,
  groups: [
    { name: "details",    title: "Customer Details",     default: true },
    { name: "engagement", title: "Birthday & Engagement"                },
    { name: "addresses",  title: "Saved Addresses"                      },
    { name: "payment",    title: "Payment"                              },
  ],
  fields: [
    defineField({
      name: "email",
      type: "string",
      group: "details",
      validation: (rule) => rule.required().error("Email is required"),
    }),
    defineField({
      name: "name",
      type: "string",
      group: "details",
      description: "Customer full name",
    }),
    defineField({
      name: "phone",
      type: "string",
      group: "details",
      description: "Primary phone number (legacy single field)",
    }),
    // ── Multiple phone numbers ────────────────────────────────────────────
    // Populated from checkout and profile page. First entry = primary.
    defineField({
      name: "phones",
      title: "Phone Numbers",
      type: "array",
      group: "details",
      description: "All phone numbers saved by this customer — first is primary",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "details",
      description: "Clerk user ID",
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),

    // ── Birthday & Engagement ────────────────────────────────────────────
    defineField({
      name: "birthday",
      type: "date",
      group: "engagement",
      description:
        "Collected from the customer's Profile page (Clerk does not provide this). Powers the birthday countdown and automated greeting.",
      options: { dateFormat: "YYYY-MM-DD" },
    }),
    defineField({
      name: "birthdayReminders",
      title: "Birthday Email",
      type: "string",
      group: "engagement",
      initialValue: "enabled",
      options: {
        list: [
          { title: "Send birthday email", value: "enabled" },
          { title: "Don't send",          value: "disabled" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "birthdaySmsOptIn",
      title: "Birthday SMS",
      type: "string",
      group: "engagement",
      initialValue: "disabled",
      description: "Only takes effect if a phone number is on file.",
      options: {
        list: [
          { title: "Send birthday SMS", value: "enabled" },
          { title: "Don't send",        value: "disabled" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "lastBirthdayGreetingSentYear",
      title: "Last Greeting Sent (Year)",
      type: "number",
      group: "engagement",
      readOnly: true,
      description: "Set automatically by the birthday cron job — prevents duplicate sends in the same year.",
    }),
    defineField({
      name: "wishlist",
      type: "array",
      group: "engagement",
      description:
        "Synced automatically from the customer's on-site wishlist. Source of truth for the Profile page and the Gadget Goal recommendation — don't edit by hand.",
      of: [{ type: "reference", to: [{ type: "product" }] }],
    }),
    defineField({
      name: "searchHistory",
      title: "Search History",
      type: "array",
      group: "engagement",
      description: "Auto-logged from the site search bar (most recent 40). Powers the Gadget Goal recommendation — not shown to the customer verbatim.",
      of: [
        {
          type: "object",
          name: "searchLogEntry",
          fields: [
            defineField({ name: "searchTerm", type: "string", validation: (r) => r.required() }),
            defineField({ name: "searchedAt", type: "datetime", validation: (r) => r.required() }),
          ],
          preview: {
            select: { term: "searchTerm", at: "searchedAt" },
            prepare({ term, at }) {
              return { title: term ?? "Search", subtitle: at ? new Date(at).toLocaleString() : "" };
            },
          },
        },
      ],
    }),

    // ── Saved Addresses ───────────────────────────────────────────────────
    defineField({
      name: "savedAddresses",
      title: "Saved Addresses",
      type: "array",
      group: "addresses",
      description: "Addresses saved from past orders — pre-fill checkout on return visits",
      of: [
        {
          type: "object",
          name: "savedAddress",
          fields: [
            defineField({ name: "label",       type: "string",  title: "Label",           description: "Auto-generated from city + line1" }),
            defineField({ name: "isDefault",   type: "boolean", title: "Default Address", initialValue: false }),
            defineField({ name: "name",        type: "string",  title: "Full Name"        }),
            defineField({ name: "line1",       type: "string",  title: "Address Line 1"   }),
            defineField({ name: "line2",       type: "string",  title: "Address Line 2"   }),
            defineField({ name: "city",        type: "string",  title: "City"             }),
            defineField({ name: "state",       type: "string",  title: "State / Region"   }),
            defineField({ name: "lga",         type: "string",  title: "LGA"              }),
            defineField({ name: "postcode",    type: "string",  title: "Postcode"         }),
            defineField({ name: "country",     type: "string",  title: "Country"          }),
            defineField({ name: "countryCode", type: "string",  title: "Country Code"     }),
          ],
          preview: {
            select: { title: "label", subtitle: "line1", isDefault: "isDefault" },
            prepare(selection: Record<string, any>) {
              const { title, subtitle, isDefault } = selection;
              return {
                title: `${isDefault ? "⭐ " : ""}${title ?? "Address"}`,
                subtitle: subtitle ?? "",
              };
            },
          },
        },
      ],
    }),

    // ── Payment ───────────────────────────────────────────────────────────
    defineField({
      name: "stripeCustomerId",
      title: "Paystack Customer ID",
      type: "string",
      group: "payment",
      readOnly: true,
      description: "Paystack customer ID (field named stripeCustomerId for backward compat)",
    }),
  ],

  preview: {
    select: { email: "email", name: "name" },
    prepare(selection: Record<string, any>) {
      const { email, name } = selection;
      return {
        title:    name ?? email ?? "Unknown Customer",
        subtitle: email ?? "",
      };
    },
  },

  orderings: [
    { title: "Newest First", name: "createdAtDesc", by: [{ field: "createdAt", direction: "desc" }] },
    { title: "Email A-Z",    name: "emailAsc",      by: [{ field: "email",     direction: "asc"  }] },
  ],
});
