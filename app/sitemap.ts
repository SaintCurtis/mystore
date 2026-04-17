import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

const BASE_URL = "https://mystore-drab-nine.vercel.app";

const PRODUCTS_FOR_SITEMAP = groq`*[_type == "product" && defined(slug.current)] {
  "slug": slug.current,
  _updatedAt,
}`;

const CATEGORIES_FOR_SITEMAP = groq`*[_type == "category" && defined(slug.current)] {
  "slug": slug.current,
  _updatedAt,
}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ─────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/build-my-setup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/policies/warranty`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/policies/returns`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/policies/shipping`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/policies/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // ── Category pages ────────────────────────────────────────────────────────
  const TOP_LEVEL_CATEGORY_SLUGS = [
    "computers",
    "accessories",
    "tech-setup-gears",
    "monitors",
    "content-creation-tools",
    "acasis",
    "custom-pcs",
    "ecoflow",
    "starlink",
  ];

  const categoryPages: MetadataRoute.Sitemap = TOP_LEVEL_CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/?category=${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Product pages ─────────────────────────────────────────────────────────
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await client.fetch<{ slug: string; _updatedAt: string }[]>(
      PRODUCTS_FOR_SITEMAP
    );
    productPages = products.map((product) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: new Date(product._updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Sitemap: failed to fetch products", error);
  }

  return [...staticPages, ...categoryPages, ...productPages];
}