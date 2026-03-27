"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { StockBadge } from "@/components/app/StockBadge";
import type { FILTER_PRODUCTS_BY_NAME_QUERYResult } from "@/sanity.types";

type Product = FILTER_PRODUCTS_BY_NAME_QUERYResult[number];

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);

  const images = product.images ?? [];
  const mainImageUrl = images[0]?.asset?.url;
  const displayedImageUrl =
    hoveredImageIndex !== null ? images[hoveredImageIndex]?.asset?.url : mainImageUrl;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const hasMultipleImages = images.length > 1;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 transition-all duration-300 hover:-translate-y-1 hover:ring-zinc-700 hover:shadow-2xl hover:shadow-zinc-950/60">

      {/* ── Image area ───────────────────────────────────────── */}
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-zinc-800",
            hasMultipleImages ? "aspect-square" : "aspect-4/5",
          )}
        >
          {displayedImageUrl ? (
            <Image
              src={displayedImageUrl}
              alt={product.name ?? "Product image"}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600">
              <svg className="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Quick view button — appears on hover */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
              <Eye className="h-3 w-3" />
              View Details
            </span>
          </div>

          {/* Badges */}
          {isOutOfStock && (
            <div className="absolute right-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Out of Stock
            </div>
          )}
          {product.category && (
            <span className="absolute left-3 top-3 rounded-full bg-zinc-950/70 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm border border-zinc-700/50">
              {product.category.title}
            </span>
          )}
        </div>
      </Link>

      {/* Thumbnail strip */}
      {hasMultipleImages && (
        <div className="flex gap-2 border-t border-zinc-800 bg-zinc-900/80 p-3">
          {images.map((image, index) => (
            <button
              key={image._key ?? index}
              type="button"
              className={cn(
                "relative h-12 flex-1 overflow-hidden rounded-lg transition-all duration-200",
                hoveredImageIndex === index
                  ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-zinc-900"
                  : "opacity-40 hover:opacity-80",
              )}
              onMouseEnter={() => setHoveredImageIndex(index)}
              onMouseLeave={() => setHoveredImageIndex(null)}
            >
              {image.asset?.url && (
                <Image
                  src={image.asset.url}
                  alt={`${product.name} - view ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Product info ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-display line-clamp-2 text-base font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-white">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-xl font-bold tracking-tight text-white">
              {formatPrice(product.price)}
            </p>
            <StockBadge productId={product._id} stock={stock} />
          </div>
        </div>

        {/* ── Sophisticated CTA area ────────────────────────── */}
        <div className="mt-auto flex flex-col gap-2">
          <AddToCartButton
            productId={product._id}
            name={product.name ?? "Unknown Product"}
            price={product.price ?? 0}
            image={mainImageUrl ?? undefined}
            stock={stock}
          />
          <Link
            href={`/products/${product.slug}`}
            className="flex h-9 w-full items-center justify-center rounded-lg border border-zinc-700/80 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          >
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
}