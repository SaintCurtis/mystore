import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";
import { PRODUCT_BY_SLUG_QUERY } from "@/lib/sanity/queries/products";
import { ProductGallery } from "@/components/app/ProductGallery";
import { ProductInfo } from "@/components/app/ProductInfo";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const { data: product } = await sanityFetch({
    query: PRODUCT_BY_SLUG_QUERY,
    params: { slug },
  });

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="border-b border-zinc-800/60 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Shop
          </Link>
        </div>
      </div>

      {/* ── Main product area ─────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">

          {/* Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-8">
            <ProductInfo product={product} />
          </div>
        </div>
      </div>

      {/* ── Trust bar ─────────────────────────────────────────── */}
      <div className="border-t border-zinc-800/60 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: "Warranty Included", sub: "Every product comes with warranty" },
              { title: "7-Day Returns", sub: "Not satisfied? Return it, no questions" },
              { title: "Worldwide Shipping", sub: "We ship to any country" },
            ].map(({ title, sub }) => (
              <div key={title} className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-sm font-semibold text-zinc-200">{title}</p>
                <p className="text-xs text-zinc-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}