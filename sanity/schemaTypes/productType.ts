import { PackageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

const COLORS_SANITY_LIST = [
  { title: "Black",       value: "black"       },
  { title: "White",       value: "white"       },
  { title: "Silver",      value: "silver"      },
  { title: "Grey",        value: "grey"        },
  { title: "Blue",        value: "blue"        },
  { title: "Space Black", value: "space-black" },
  { title: "Midnight",    value: "midnight"    },
  { title: "Starlight",   value: "starlight"   },
  { title: "Graphite",    value: "graphite"    },
];

const MATERIALS_SANITY_LIST = [
  { title: "Metal",    value: "metal"    },
  { title: "Plastic",  value: "plastic"  },
  { title: "Aluminum", value: "aluminum" },
  { title: "Glass",    value: "glass"    },
];

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT PRICE ADJUSTMENT REFERENCE
// (All adjustments are DELTAS — what the buyer pays ON TOP of the base price)
// Base spec = Core i5 / 8GB RAM / 256GB SSD
//
// PROCESSOR (base = Core i5, ₦0):
//   Core i5  →  +₦0       (included in base)
//   Core i7  →  +₦35,000  (cost of i7 − cost of i5)
//   Core i9  →  +₦55,000  (cost of i9 − cost of i5)
//
// RAM — DDR4 (base = 8GB, ₦0):
//   8GB DDR4   →  +₦0        (base)
//   16GB DDR4  →  +₦85,000   (full cost ₦85k − 8GB base ₦0)
//   32GB DDR4  →  +₦85,000   (full cost ₦170k − 16GB cost ₦85k)
//
// RAM — DDR5 (base = 8GB, ₦0):
//   8GB DDR5   →  +₦0        (base — if applicable)
//   16GB DDR5  →  +₦250,000  (full cost ₦250k − 8GB base ₦0)
//   32GB DDR5  →  +₦230,000  (full cost ₦480k − 16GB DDR5 cost ₦250k)
//
// SSD (base = 256GB, ₦0 — already priced into base):
//   256GB  →  +₦0        (base, already included)
//   512GB  →  +₦45,000   (full cost ₦45k − 256GB base ₦0)
//   1TB    →  +₦60,000   (full cost ₦105k − 512GB cost ₦45k)
//   2TB    →  +₦105,000  (full cost ₦210k − 1TB cost ₦105k)
//
// GPU: enter adjustment manually per product
// ─────────────────────────────────────────────────────────────────────────────

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
    { name: "variants",       title: "Variants" },
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
      description:
        "Base price in NGN — price of the lowest spec: Core i5 / 8GB RAM / 256GB SSD. All variant adjustments are added on top of this.",
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
        "Only set if NOT already encoded in the category. Leave empty if category name already includes condition (e.g. 'Gaming Laptops — Brand New').",
      hidden: () => false,
    }),
    defineField({
      name: "brand",
      title: "Brand",
      type: "reference",
      to: [{ type: "brand" }],
      group: "classification",
      description: "e.g. Dell, HP, MSI, ASUS ROG",
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
    //
    // IMPORTANT — HOW ADJUSTMENTS WORK:
    // The buyer selects ONE option per group. The frontend adds all selected
    // priceAdjustment values to the base price to get the final price.
    // Each adjustment = (full component cost) − (cost of component already in base).
    //
    // QUICK REFERENCE (copy-paste when adding options):
    //
    //  PROCESSOR group  (type: processor)
    //   "Core i5"  priceAdjustment: 0
    //   "Core i7"  priceAdjustment: 35000
    //   "Core i9"  priceAdjustment: 55000
    //
    //  RAM group — DDR4  (type: ram, label: "RAM (DDR4)")
    //   "8GB DDR4"   priceAdjustment: 0
    //   "16GB DDR4"  priceAdjustment: 85000
    //   "32GB DDR4"  priceAdjustment: 85000   ← delta: 170k − 85k
    //
    //  RAM group — DDR5  (type: ram, label: "RAM (DDR5)")
    //   "8GB DDR5"   priceAdjustment: 0
    //   "16GB DDR5"  priceAdjustment: 250000
    //   "32GB DDR5"  priceAdjustment: 230000  ← delta: 480k − 250k
    //
    //  SSD group  (type: ssd, label: "Storage")
    //   "256GB"  priceAdjustment: 0           ← base, already in price
    //   "512GB"  priceAdjustment: 45000       ← delta: 45k − 0
    //   "1TB"    priceAdjustment: 60000       ← delta: 105k − 45k
    //   "2TB"    priceAdjustment: 105000      ← delta: 210k − 105k
    //
    defineField({
      name: "variantGroups",
      title: "Variant groups",
      type: "array",
      group: "variants",
      description:
        "Add one group per spec axis. Base price = Core i5 / 8GB / 256GB SSD. Each adjustment = component cost delta from the tier below it. See quick reference in schema comments.",
      of: [
        {
          type: "object",
          name: "variantGroup",
          title: "Variant group",
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
                  { title: "Processor",   value: "processor"   },
                  { title: "RAM",         value: "ram"         },
                  { title: "SSD Storage", value: "ssd"         },
                  { title: "GPU",         value: "gpu"         },
                  { title: "Color",       value: "color"       },
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
              description:
                'Shown above the option chips on the product page. Be specific: "RAM (DDR4)", "RAM (DDR5)", "Storage", "Processor"',
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
                          ? "Included in base price"
                          : subtitle > 0
                          ? `+₦${Number(subtitle).toLocaleString()}`
                          : `-₦${Math.abs(Number(subtitle)).toLocaleString()}`,
                    }),
                  },
                  fields: [
                    defineField({
                      name: "label",
                      title: "Label",
                      type: "string",
                      description:
                        'What the buyer sees on the chip. e.g. "Core i5", "Core i7", "16GB DDR4", "512GB", "1TB"',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "hint",
                      title: "Upgrade hint (optional)",
                      type: "string",
                      description:
                        'Small subtext under the chip. e.g. "+256GB from base", "Faster memory", "Recommended"',
                    }),
                    defineField({
                      name: "priceAdjustment",
                      title: "Price adjustment (NGN) — DELTA only",
                      type: "number",
                      description:
                        "Enter the DELTA from the tier below — NOT the full component price. See quick reference above. e.g. 1TB = +60,000 (because 105k − 45k = 60k).",
                      initialValue: 0,
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "isDefault",
                      title: "Default selection?",
                      type: "boolean",
                      description:
                        "Pre-selected on page load. Set this on the base/lowest spec option (Core i5, 8GB, 256GB). Only ONE per group.",
                      initialValue: false,
                    }),
                    defineField({
                      name: "inStock",
                      title: "In stock?",
                      type: "boolean",
                      description:
                        "Uncheck to grey out this option. Buyer can see it exists but cannot select it.",
                      initialValue: true,
                    }),
                    defineField({
                      name: "hexColor",
                      title: "Hex colour code",
                      type: "string",
                      description:
                        'Only for Color variants — e.g. "#1a1a1a". Leave empty for all other types.',
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