import { PackageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { SpecExtractor } from "../components/SpecExtractor";

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

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "details",        title: "Details",        default: true },
    { name: "classification", title: "Classification" },
    { name: "specs",          title: "Tech Specs ✨"  },
    { name: "media",          title: "Media"          },
    { name: "inventory",      title: "Inventory"      },
    { name: "variants",       title: "Variants"       },
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
        "Base price in NGN — price of the lowest spec. All variant adjustments are added on top of this.",
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
        "Only set if NOT already encoded in the category.",
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
      description: "e.g. XPS 13 9350, MacBook Air M3",
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

    // ── Tech Specs ─────────────────────────────────────────────
    // The SpecExtractor button at the top of this group reads the
    // description field and auto-fills all spec fields below via AI.
    // You never need to type these manually.
    defineField({
      name: "specExtractorUI",
      title: "Auto-Extract Specs",
      type: "object",
      group: "specs",
      // This field is purely a UI container — it holds no data.
      // The SpecExtractor component patches sibling fields directly.
      components: { input: SpecExtractor },
      fields: [
        // Dummy field so Sanity accepts the object type
        defineField({ name: "_placeholder", type: "string", hidden: true }),
      ],
    }),
    defineField({
      name: "specDisplay",
      title: "Display",
      type: "string",
      group: "specs",
      description: 'e.g. "13.4\\" 3K OLED" or "27\\" QHD IPS 180Hz"',
    }),
    defineField({
      name: "specProcessor",
      title: "Processor",
      type: "string",
      group: "specs",
      description: 'e.g. "Intel Core Ultra 7 265H" or "Apple M3"',
    }),
    defineField({
      name: "specRAM",
      title: "RAM",
      type: "string",
      group: "specs",
      description: 'e.g. "16GB LPDDR5x" or "32GB DDR5"',
    }),
    defineField({
      name: "specStorage",
      title: "Storage",
      type: "string",
      group: "specs",
      description: 'e.g. "1TB NVMe SSD" or "2TB PCIe Gen 4"',
    }),
    defineField({
      name: "specGPU",
      title: "GPU",
      type: "string",
      group: "specs",
      description: 'e.g. "NVIDIA RTX 4080 Super" or "Intel Arc Graphics"',
    }),
    defineField({
      name: "specBattery",
      title: "Battery / Power",
      type: "string",
      group: "specs",
      description: 'e.g. "55Wh · up to 18 hrs" or "1024Wh LFP"',
    }),
    defineField({
      name: "specOS",
      title: "Operating System",
      type: "string",
      group: "specs",
      description: 'e.g. "Windows 11 Pro" or "macOS Sequoia"',
    }),
    defineField({
      name: "specConnectivity",
      title: "Connectivity",
      type: "string",
      group: "specs",
      description: 'e.g. "2× Thunderbolt 4, Wi-Fi 7, Bluetooth 5.3"',
    }),
    defineField({
      name: "specRefreshRate",
      title: "Refresh Rate",
      type: "string",
      group: "specs",
      description: 'e.g. "240Hz" — for monitors and gaming laptops',
    }),
    defineField({
      name: "specWeight",
      title: "Weight",
      type: "string",
      group: "specs",
      description: 'e.g. "1.18kg"',
    }),
    defineField({
      name: "specExtras",
      title: "Extra Specs",
      type: "array",
      group: "specs",
      description: "Any additional specs not covered above — auto-filled by AI or add manually",
      of: [
        {
          type: "object",
          name: "specRow",
          fields: [
            defineField({ name: "label", type: "string", title: "Label", description: 'e.g. "Panel Type"' }),
            defineField({ name: "value", type: "string", title: "Value", description: 'e.g. "Mini LED"' }),
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
          },
        },
      ],
    }),

    // ── Media ──────────────────────────────────────────────────
    defineField({
      name: "images",
      type: "array",
      group: "media",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (rule) => rule.min(1).error("At least one image is required"),
    }),
    defineField({
      name: "videos",
      title: "Videos",
      type: "array",
      group: "media",
      description: "Upload product demo or unboxing videos",
      of: [{ type: "file", options: { accept: "video/*" } }],
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

    // ── Negotiation ────────────────────────────────────────────
    defineField({
      name: "isNegotiable",
      title: "Price is Negotiable?",
      type: "boolean",
      group: "inventory",
      initialValue: false,
      description: "Show a 'Negotiate Price' button on this product page",
    }),
    defineField({
      name: "floorPrice",
      title: "Floor Price (₦) — NEVER shown publicly",
      type: "number",
      group: "inventory",
      description: "The absolute lowest price you will accept. Only read server-side.",
      hidden: ({ document }) => !document?.isNegotiable,
      validation: (rule) =>
        rule.custom((val, ctx) => {
          if (!ctx.document?.isNegotiable) return true;
          if (!val) return "Floor price is required when product is negotiable";
          if ((val as number) >= (ctx.document?.price as number))
            return "Floor price must be less than the listed price";
          return true;
        }),
    }),
    defineField({
      name: "negotiationNotes",
      title: "AI Negotiation Instructions (optional)",
      type: "text",
      group: "inventory",
      rows: 3,
      description: 'Private tactics for the AI. e.g. "Can bundle with a bag if they push hard"',
      hidden: ({ document }) => !document?.isNegotiable,
    }),

    // ── Variants ───────────────────────────────────────────────
    defineField({
      name: "variantGroups",
      title: "Variant groups",
      type: "array",
      group: "variants",
      description:
        "Add one group per spec axis. Base price = lowest spec. Each adjustment = delta from the tier below.",
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
              description: 'e.g. "RAM (DDR4)", "Storage", "Processor"',
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
                    select: { title: "label", subtitle: "priceAdjustment" },
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
                      description: 'e.g. "Core i5", "16GB DDR4", "512GB"',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "hint",
                      title: "Upgrade hint (optional)",
                      type: "string",
                      description: 'e.g. "+256GB from base", "Recommended"',
                    }),
                    defineField({
                      name: "priceAdjustment",
                      title: "Price adjustment (NGN) — DELTA only",
                      type: "number",
                      initialValue: 0,
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "isDefault",
                      title: "Default selection?",
                      type: "boolean",
                      initialValue: false,
                    }),
                    defineField({
                      name: "inStock",
                      title: "In stock?",
                      type: "boolean",
                      initialValue: true,
                    }),
                    defineField({
                      name: "hexColor",
                      title: "Hex colour code",
                      type: "string",
                      description: 'Only for Color variants — e.g. "#1a1a1a".',
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
      title:     "name",
      subtitle:  "category.title",
      condition: "condition.title",
      brand:     "brand.title",
      media:     "images.0",
      price:     "price",
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