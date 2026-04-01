import { PackageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { MATERIALS_SANITY_LIST, COLORS_SANITY_LIST } from "@/lib/constants/filters";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "classification", title: "Classification" },
    { name: "media", title: "Media" },
    { name: "inventory", title: "Inventory" },
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
      description: "Price in NGN (e.g., 1950000)",
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
        // Hide if the selected category already encodes condition in its slug
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
        // We can't resolve slug from _ref here, so always show but clarify in description
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