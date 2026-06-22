// lib/ai/tools/search-products.ts  — PATCHED
// KEY CHANGE: The category description now lists ALL actual store categories
// so the AI knows what to search for instead of guessing.

import { tool } from "ai";
import { z } from "zod";
import { sanityFetch } from "@/sanity/lib/live";
import { AI_SEARCH_PRODUCTS_QUERY } from "@/lib/sanity/queries/products";
import { formatPrice } from "@/lib/utils";
import { getStockStatus, getStockMessage } from "@/lib/constants/stock";
import { MATERIAL_VALUES, COLOR_VALUES } from "@/lib/constants/filters";
import type { AI_SEARCH_PRODUCTS_QUERY_RESULT } from "@/sanity.types";
import type { SearchProduct } from "@/lib/ai/types";

const productSearchSchema = z.object({
  query: z
    .string()
    .optional()
    .default("")
    .describe(
      "Search term to find products by name, description, or category. Examples: 'gaming laptop', 'Mac mini', 'wireless keyboard', 'Starlink', 'EcoFlow', 'monitor', 'webcam', 'power station', 'dock', 'SSD'"
    ),
  category: z
    .string()
    .optional()
    .default("")
    .describe(
      `Filter by category slug. Available categories in this store:
      - "computers" → Laptops, MacBooks, desktops, Mac mini, SFF PCs
      - "gaming-laptops" → Gaming laptops (ASUS ROG, MSI, Lenovo Legion, etc.)
      - "accessories" → Keyboards, mice, docking stations, USB hubs, cables
      - "tech-setup-gears" → Desks, chairs, LED strips, monitor arms, desk mats
      - "monitors" → Gaming monitors, professional displays, ultrawide screens
      - "content-creation-tools" → Cameras, microphones, lights, capture cards, webcams
      - "acasis" → ACASIS brand docks, hubs, NVMe enclosures, SSD enclosures
      - "ecoflow" → EcoFlow portable power stations and solar panels
      - "starlink" → Starlink satellite internet kits
      - "handheld-and-gaming-console" → Steam Deck, Nintendo Switch, PlayStation, Xbox
      - "networking-tools" → Routers, switches, network adapters, Ethernet tools
      - "storage" → External SSDs, hard drives, NVMe enclosures, memory cards
      - "custom-pcs" → Custom-built gaming and workstation PCs
      - "speaker-and-audio-equipments" → Speakers, headsets, soundbars, speakerphones
      - "webcams" → Webcams for streaming and video calls
      - "va-monitors" → VA panel monitors
      - "fast-ips-monitors" → IPS fast gaming monitors
      - "oled-monitors" → OLED display monitors
      - "sff-computers" → Small form factor computers (Mac mini, NUC, etc.)
      - "tables" → Sit-stand desks and computer tables
      Leave empty to search across all categories.`
    ),
  material: z
    .enum(["", ...MATERIAL_VALUES])
    .optional()
    .default("")
    .describe("Filter by material type"),
  color: z
    .enum(["", ...COLOR_VALUES])
    .optional()
    .default("")
    .describe("Filter by color"),
  minPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Minimum price in NGN (e.g., 50000 for ₦50,000). Use 0 for no minimum."),
  maxPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Maximum price in NGN (e.g., 2000000 for ₦2,000,000). Use 0 for no maximum."),
});

export const searchProductsTool = tool({
  description: `Search for products in The Saint's TechNet store — a premium Nigerian tech retailer.
  
  The store sells:
  • Laptops & computers (brand new + foreign used) — Dell, HP, Lenovo, ASUS ROG, Apple MacBooks, Mac mini
  • Gaming setups — gaming laptops, monitors, custom PCs, gaming consoles
  • Accessories — keyboards, mice, webcams, docking stations, USB hubs
  • Tech setup gear — ergonomic desks, chairs, monitor arms, LED lighting
  • Monitors — gaming, professional, ultrawide, OLED, VA, IPS panels
  • Content creation — cameras, microphones, lights, capture cards
  • ACASIS brand — professional-grade docks, enclosures, hubs
  • EcoFlow — portable power stations and solar kits (great for Nigerian power outages)
  • Starlink — satellite internet kits
  • Storage — external SSDs, hard drives, NVMe enclosures
  • Networking — routers, switches, adapters
  • Handheld consoles — Steam Deck, Switch, PlayStation portables
  • Audio — speakers, headsets, speakerphones

  All products include warranty. Prices in Nigerian Naira (NGN/₦). Ships worldwide.
  
  Use this tool to find products matching the customer's needs, budget, or specifications.`,
  inputSchema: productSearchSchema,
  execute: async ({ query, category, material, color, minPrice, maxPrice }) => {
    console.log("[SearchProducts] Query received:", {
      query,
      category,
      material,
      color,
      minPrice,
      maxPrice,
    });

    try {
      const { data: products } = await sanityFetch({
        query: AI_SEARCH_PRODUCTS_QUERY,
        params: {
          searchQuery: query || "",
          categorySlug: category || "",
          material: material || "",
          color: color || "",
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        },
      });

      console.log("[SearchProducts] Products found:", products.length);

      if (products.length === 0) {
        return {
          found: false,
          message:
            "No products found matching your criteria. Try different search terms or a broader category.",
          products: [],
          suggestion: "Try searching without a category filter, or use a simpler query term.",
          filters: { query, category, material, color, minPrice, maxPrice },
        };
      }

      const formattedProducts: SearchProduct[] = (
        products as AI_SEARCH_PRODUCTS_QUERY_RESULT
      ).map((product) => ({
        id: product._id,
        name: product.name ?? null,
        slug: product.slug ?? null,
        description: product.description ?? null,
        price: product.price ?? null,
        priceFormatted: product.price ? formatPrice(product.price) : null,
        category: product.category?.title ?? null,
        categorySlug: product.category?.slug ?? null,
        material: product.material ?? null,
        color: product.color ?? null,
        dimensions: product.dimensions ?? null,
        stockCount: product.stock ?? 0,
        stockStatus: getStockStatus(product.stock),
        stockMessage: getStockMessage(product.stock),
        featured: product.featured ?? false,
        assemblyRequired: product.assemblyRequired ?? false,
        imageUrl: product.image?.asset?.url ?? null,
        productUrl: product.slug ? `/products/${product.slug}` : null,
      }));

      return {
        found: true,
        message: `Found ${products.length} product${products.length === 1 ? "" : "s"} matching your search.`,
        totalResults: products.length,
        products: formattedProducts,
        filters: { query, category, material, color, minPrice, maxPrice },
      };
    } catch (error) {
      console.error("[SearchProducts] Error:", error);
      return {
        found: false,
        message: "An error occurred while searching for products.",
        products: [],
        error: error instanceof Error ? error.message : "Unknown error",
        filters: { query, category, material, color, minPrice, maxPrice },
      };
    }
  },
});