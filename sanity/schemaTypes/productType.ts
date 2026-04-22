import { PackageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { MATERIALS_SANITY_LIST, COLORS_SANITY_LIST } from "@/lib/constants/filters";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "details",        title: "Details",        default: true },
    { name: "classification", title: "Classification" },
    { name: "media",          title: "Media" },
    { name: "inventory",      title: "Inventory" },
    { name: "variants",       title: "Variants" },   // ← NEW group
  ],
  fields: [
    // ── Core Details ───────────────────────────────────────────
    defineField({
      name: "name",
      type: "string",
      group: "details",
      validation: (rule) => rule.required().error("Product name is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
    defineField({
      name: "description",
      type: "text",
      group: "details",
      rows: 4,
    }),
    defineField({
      name: "price",
      type: "number",
      group: "details",
      description: "Base price in NGN — variants add/subtract from this",
      validation: (rule) => [
        rule.required().error("Price is required"),
        rule.positive().error("Price must be positive"),
      ],
    }),

    // ── Classification ─────────────────────────────────────────
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      group: "classification",
      description: "Select the subcategory (e.g. Regular Laptops — Brand New)",
      validation: (rule) => rule.required().error("Category is required"),
    }),
    defineField({
      name: "condition",
      title: "Condition",
      type: "reference",
      to: [{ type: "condition" }],
      group: "classification",
      description:
        "Only set if NOT already encoded in the category (e.g. if category is 'Gaming Laptops — Brand New', leave this empty — condition is implied). Use this only for products where the category doesn't specify condition.",
      hidden: ({ document }) => {
        const categorySlug = (document?.category as any)?._ref ?? "";
        const conditionEncodedSlugs = [
          "gaming-laptops-brand-new",
          "gaming-laptops-foreign-used",
          "regular-laptops-brand-new",
          "regular-laptops-foreign-used",
          "macbook-brand-new",
          "macbook-foreign-used",
          "monitors-professional-brand-new",
          "monitors-professional-foreign-used",
          "monitors-gaming-brand-new",
          "monitors-gaming-foreign-used",
        ];
        return false;
      },
    }),
    defineField({
      name: "brand",
      title: "Brand",
      type: "reference",
      to: [{ type: "brand" }],
      group: "classification",
      description: "e.g. Dell, HP, MSI, ASUS ROG — leave empty for MacBooks",
    }),
    defineField({
      name: "model",
      title: "Model",
      type: "reference",
      to: [{ type: "model" }],
      group: "classification",
      description: "e.g. XPS 13 9350, MacBook Air M3 — create in Models if not listed",
    }),
    defineField({
      name: "material",
      type: "string",
      group: "classification",
      options: { list: MATERIALS_SANITY_LIST, layout: "radio" },
    }),
    defineField({
      name: "color",
      type: "string",
      group: "classification",
      options: { list: COLORS_SANITY_LIST, layout: "radio" },
    }),
    defineField({
      name: "dimensions",
      type: "string",
      group: "classification",
      description: 'e.g. "29.6cm x 19.9cm x 1.5cm"',
    }),

    // ── Media ──────────────────────────────────────────────────
    defineField({
      name: "images",
      type: "array",
      group: "media",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (rule) => rule.min(1).error("At least one image is required"),
    }),

    // ── Inventory ──────────────────────────────────────────────
    defineField({
      name: "stock",
      type: "number",
      group: "inventory",
      initialValue: 0,
      description: "Number of items in stock",
      validation: (rule) => [
        rule.min(0).error("Stock cannot be negative"),
        rule.integer().error("Stock must be a whole number"),
      ],
    }),
    defineField({
      name: "featured",
      type: "boolean",
      group: "inventory",
      initialValue: false,
      description: "Show on homepage carousel",
    }),
    defineField({
      name: "assemblyRequired",
      type: "boolean",
      group: "inventory",
      initialValue: false,
    }),

    // ── Variants ───────────────────────────────────────────────
    // Each variant group = one spec axis (RAM, SSD, GPU, Color, Touchscreen).
    // Options within a group are presented as chips/toggles on the product page.
    // The displayed price = product.price + sum of all selected priceAdjustment values.
    defineField({
      name: "variantGroups",
      title: "Variant groups",
      type: "array",
      group: "variants",
      description:
        "Add spec axes that affect price (RAM, SSD, GPU, Color, Touchscreen). Leave empty for products with no variants.",
      of: [
        {
          type: "object",
          name: "variantGroup",
          title: "Variant group",
          // Sanity Studio preview for each group row
          preview: {
            select: { title: "label", subtitle: "type" },
            prepare: ({ title, subtitle }) => ({
              title: title ?? "Unnamed group",
              subtitle: subtitle ?? "",
            }),
          },
          fields: [
            defineField({
              name: "type",
              title: "Spec type",
              type: "string",
              description: "Machine-readable key — used in cart & order records",
              options: {
                list: [
                  { title: "RAM",         value: "ram" },
                  { title: "SSD Storage", value: "ssd" },
                  { title: "GPU",         value: "gpu" },
                  { title: "Color",       value: "color" },
                  { title: "Touchscreen", value: "touchscreen" },
                ],
                layout: "dropdown",
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              title: "Display label",
              type: "string",
              description: 'Shown above the chips, e.g. "RAM" or "Storage"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "options",
              title: "Options",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "variantOption",
                  title: "Option",
                  preview: {
                    select: {
                      title: "label",
                      subtitle: "priceAdjustment",
                    },
                    prepare: ({ title, subtitle }) => ({
                      title: title ?? "Unnamed",
                      subtitle:
                        subtitle === 0 || subtitle == null
                          ? "Base price"
                          : subtitle > 0
                          ? `+₦${subtitle.toLocaleString()}`
                          : `-₦${Math.abs(subtitle).toLocaleString()}`,
                    }),
                  },
                  fields: [
                    defineField({
                      name: "label",
                      title: "Label",
                      type: "string",
                      description: 'e.g. "16GB", "1TB", "RTX 5090", "Moonlight White"',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "priceAdjustment",
                      title: "Price adjustment (NGN)",
                      type: "number",
                      description:
                        "Positive = surcharge, negative = discount, 0 = included in base price",
                      initialValue: 0,
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "isDefault",
                      title: "Default selection?",
                      type: "boolean",
                      description:
                        "Pre-selected when the page loads. Only one option per group should be default.",
                      initialValue: false,
                    }),
                    defineField({
                      name: "inStock",
                      title: "In stock?",
                      type: "boolean",
                      description: "Uncheck to show this option as unavailable (greyed out)",
                      initialValue: true,
                    }),
                    // Only relevant for color type — hex code for the colour dot
                    defineField({
                      name: "hexColor",
                      title: "Hex colour code",
                      type: "string",
                      description:
                        'Only for Color variants — e.g. "#1a1a1a". Leave empty for other types.',
                      hidden: ({ parent }) => (parent as any)?.type !== "color",
                    }),
                  ],
                },
              ],
              validation: (rule) => rule.min(1).error("Add at least one option"),
            }),
          ],
        },
      ],
    }),
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "category.title",
      condition: "condition.title",
      brand: "brand.title",
      media: "images.0",
      price: "price",
    },
    prepare({ title, subtitle, condition, brand, media, price }) {
      const parts = [subtitle, condition, brand].filter(Boolean).join(" · ");
      return {
        title,
        subtitle: `${parts ? parts + "  " : ""}₦${(price ?? 0).toLocaleString()}`,
        media,
      };
    },
  },
});