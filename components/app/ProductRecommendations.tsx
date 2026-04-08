"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface RecommendedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  categoryTitle?: string;
}

interface ProductRecommendationsProps {
  productId: string;
  productName: string;
  categorySlug?: string;
  parentSlug?: string;
  description?: string;
  price?: number;
}

export function ProductRecommendations({
  productId,
  productName,
  categorySlug,
  parentSlug,
  description,
  price,
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, productName, categorySlug, parentSlug, description, price }),
    })
      .then((r) => r.json())
      .then((d) => setProducts(d.recommendations ?? []))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [productId, productName, categorySlug, parentSlug, description, price]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="border-t border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] py-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-[#f1f1f1]">
                You May Also Like
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">
                AI-picked based on what you're viewing
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-zinc-100 dark:bg-[#111111]">
                <div className="aspect-square rounded-t-2xl bg-zinc-200 dark:bg-[#1a1a1a]" />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded bg-zinc-200 dark:bg-[#1a1a1a] w-3/4" />
                  <div className="h-4 rounded bg-zinc-200 dark:bg-[#1a1a1a] w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-amber-500/20 hover:shadow-lg dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-[#0d0d0d]">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                      <ArrowRight className="h-8 w-8 opacity-20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 p-4">
                  {product.categoryTitle && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                      {product.categoryTitle}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1] line-clamp-2 leading-snug">
                    {product.name}
                  </p>
                  <p className="mt-1 text-base font-bold text-zinc-900 dark:text-amber-400">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}