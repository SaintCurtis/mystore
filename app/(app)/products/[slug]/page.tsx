import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { client } from "@/sanity/lib/client";          // ← plain client, no live
import { sanityFetch } from "@/sanity/lib/live";        // ← live only for page render
import { PRODUCT_BY_SLUG_QUERY } from "@/lib/sanity/queries/products";
import { ProductGallery } from "@/components/app/ProductGallery";
import { ProductInfo } from "@/components/app/ProductInfo";
import { RecentlyViewed } from "@/components/app/RecentlyViewed";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// ── Metadata — uses plain client (no SanityLive, no $slug param issue) ────
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return { title: "The Saint's TechNet" };

  const product = await client.fetch(PRODUCT_BY_SLUG_QUERY, { slug });
  if (!product) return { title: "Product Not Found | The Saint's TechNet" };

  const p = product as any;
  const imageUrl = p.images?.[0]?.asset?.url;
  const title = `${p.name} | The Saint's TechNet`;
  const description =
    p.description?.slice(0, 160) ??
    `Buy ${p.name} at The Saint's TechNet — CAC registered. Warranty included. Ships worldwide.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "The Saint's TechNet",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: p.name ?? "" }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Guard: if slug is somehow empty, 404 immediately
  if (!slug) notFound();

  const { data: product } = await sanityFetch({
    query: PRODUCT_BY_SLUG_QUERY,
    params: { slug },
  });

  if (!product) notFound();

  const p = product as any;
  const imageUrl = p.images?.[0]?.asset?.url;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    ...(imageUrl && { image: imageUrl }),
    brand: { "@type": "Brand", name: "The Saint's TechNet" },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: p.price?.toString() ?? "0",
      availability:
        (p.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "The Saint's TechNet",
        url: "https://mystore-drab-nine.vercel.app",
      },
      url: `https://mystore-drab-nine.vercel.app/products/${p.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="border-b border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Shop
          </Link>
        </div>
      </div>

      {/* Main product area */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={product.images} productName={product.name} />
          </div>
          <div className="flex flex-col gap-8">
            <ProductInfo product={product} />
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-t border-zinc-200 dark:border-[#1a1a1a] bg-zinc-100 dark:bg-[#0f0f0f] transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: "Warranty Included", sub: "Every product comes with warranty" },
              { title: "7-Day Returns", sub: "Not satisfied? Return it, no questions" },
              { title: "Worldwide Shipping", sub: "We ship to any country" },
            ].map(({ title, sub }) => (
              <div key={title} className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
                <p className="text-xs text-zinc-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RecentlyViewed excludeId={product._id} />
    </div>
  );
}