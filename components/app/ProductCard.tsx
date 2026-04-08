"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { StockBadge } from "@/components/app/StockBadge";
import { WishlistButton } from "@/components/app/WishlistButton";
import { CompareButton } from "@/components/app/CompareButton";
import { useCurrency } from "@/lib/store/currency-store-provider";
import type { FILTER_PRODUCTS_BY_NAME_QUERYResult } from "@/sanity.types";

type Product = FILTER_PRODUCTS_BY_NAME_QUERYResult[number];

interface ProductCardProps {
  product: Product;
  activeCategory?: string;
}

function getCategoryLabel(category: Product["category"], activeCategory: string | undefined): string {
  if (!category) return "";
  if (!activeCategory) return category.title ?? "";
  const cat = category as typeof category & { parentSlug?: string | null; parentTitle?: string | null };
  if (cat.slug === activeCategory) return cat.title ?? "";
  if (cat.parentSlug === activeCategory) return cat.parentTitle ?? cat.title ?? "";
  return cat.title ?? "";
}

export function ProductCard({ product, activeCategory }: ProductCardProps) {
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const { formatInCurrency } = useCurrency();

  const images = product.images ?? [];
  const mainImageUrl = images[0]?.asset?.url;
  const displayedImageUrl = hoveredImageIndex !== null ? images[hoveredImageIndex]?.asset?.url : mainImageUrl;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const hasMultipleImages = images.length > 1;
  const categoryLabel = getCategoryLabel(product.category, activeCategory);

  return (
    <div className={cn(
      "group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300",
      "bg-white ring-1 ring-zinc-200 hover:ring-zinc-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/80",
      "dark:bg-[#111111] dark:ring-1 dark:ring-[#1f1f1f] dark:hover:ring-amber-500/20 dark:hover:-translate-y-1",
      "dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_0_1px_rgba(245,158,11,0.12)]",
    )}>

      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className={cn(
          "relative overflow-hidden bg-zinc-100 dark:bg-[#0d0d0d]",
          hasMultipleImages ? "aspect-square" : "aspect-4/5",
        )}>
          {displayedImageUrl ? (
            <Image
              src={displayedImageUrl} alt={product.name ?? "Product image"} fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-700">
              <svg className="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
              <Eye className="h-3 w-3" /> View Details
            </span>
          </div>

          {isOutOfStock && (
            <div className="absolute left-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm">
              Out of Stock
            </div>
          )}
          {categoryLabel && !isOutOfStock && (
            <span className="absolute left-3 top-3 rounded-full bg-white/85 dark:bg-black/70 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 backdrop-blur-sm border border-zinc-200/50 dark:border-white/8">
              {categoryLabel}
            </span>
          )}

          <WishlistButton
            productId={product._id} name={product.name ?? ""} price={product.price ?? 0}
            image={mainImageUrl ?? undefined} slug={product.slug ?? ""}
            categoryTitle={product.category?.title ?? undefined} variant="overlay"
          />
        </div>
      </Link>

      {/* Thumbnails */}
      {hasMultipleImages && (
        <div className="flex gap-2 border-t border-zinc-100 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#0d0d0d] p-3">
          {images.map((image, index) => (
            <button key={image._key ?? index} type="button"
              className={cn(
                "relative h-12 flex-1 overflow-hidden rounded-lg transition-all duration-200",
                hoveredImageIndex === index
                  ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-white dark:ring-offset-[#111111]"
                  : "opacity-40 hover:opacity-75",
              )}
              onMouseEnter={() => setHoveredImageIndex(index)}
              onMouseLeave={() => setHoveredImageIndex(null)}>
              {image.asset?.url && (
                <Image src={image.asset.url} alt={`${product.name} - view ${index + 1}`} fill className="object-cover" sizes="80px" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-display line-clamp-2 text-base font-semibold leading-snug text-zinc-900 dark:text-[#f1f1f1] transition-colors group-hover:text-zinc-700 dark:group-hover:text-white">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center justify-between gap-2">
            {/* ✅ Uses currency-aware formatting */}
            <p className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-amber-400">
              {formatInCurrency(product.price)}
            </p>
            <StockBadge productId={product._id} stock={stock} />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <AddToCartButton
            productId={product._id} name={product.name ?? "Unknown Product"}
            price={product.price ?? 0} image={mainImageUrl ?? undefined} stock={stock}
          />
          <Link href={`/products/${product.slug}`}
            className={cn(
              "flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium transition-all duration-200",
              "border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700",
              "dark:border-[#2a2a2a] dark:text-[#a3a3a3] dark:hover:border-[#3a3a3a] dark:hover:bg-[#1a1a1a] dark:hover:text-[#f1f1f1]",
            )}>
            View Full Details
          </Link>

          <div className="flex justify-center pt-1">
            <CompareButton product={{
              productId: product._id,
              name: product.name ?? "",
              price: product.price ?? 0,
              image: mainImageUrl ?? undefined,
              slug: product.slug ?? "",
              categoryTitle: product.category?.title ?? undefined,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}