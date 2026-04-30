"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Zap, ShoppingBag, Check, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockBadge } from "@/components/app/StockBadge";
import { WishlistButton } from "@/components/app/WishlistButton";
import { CompareButton } from "@/components/app/CompareButton";
import { useCurrency } from "@/lib/store/currency-store-provider";
import { useCartActions, useCartItem } from "@/lib/store/cart-store-provider";
import { toast } from "sonner";
import type { FILTER_PRODUCTS_BY_NAME_QUERY_RESULT } from "@/sanity.types";

type Product = FILTER_PRODUCTS_BY_NAME_QUERY_RESULT[number];

interface ProductCardProps {
  product: Product;
  activeCategory?: string;
}

function getCategoryLabel(
  category: Product["category"],
  activeCategory: string | undefined,
): string {
  if (!category) return "";
  if (!activeCategory) return category.title ?? "";
  const cat = category as typeof category & {
    parentSlug?: string | null;
    parentTitle?: string | null;
  };
  if (cat.slug === activeCategory) return cat.title ?? "";
  if (cat.parentSlug === activeCategory) return cat.parentTitle ?? cat.title ?? "";
  return cat.title ?? "";
}

export function ProductCard({ product, activeCategory }: ProductCardProps) {
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const { formatInCurrency } = useCurrency();
  const { addItem, updateQuantity } = useCartActions();

  const images = product.images ?? [];
  const mainImageUrl = images[0]?.asset?.url;
  const displayedImageUrl =
    hoveredImageIndex !== null ? images[hoveredImageIndex]?.asset?.url : mainImageUrl;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const hasMultipleImages = images.length > 1;
  const categoryLabel = getCategoryLabel(product.category, activeCategory);

  const cartItem = useCartItem(product._id);
  const quantityInCart = cartItem?.quantity ?? 0;
  const isInCart = quantityInCart > 0;
  const isAtMax = quantityInCart >= stock;

  const handleAddToCart = () => {
    if (quantityInCart < stock) {
      addItem(
        {
          productId: product._id,
          name: product.name ?? "",
          price: product.price ?? 0,
          image: mainImageUrl ?? undefined,
        },
        1,
      );
      toast.success(`${product.name} added to cart`);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const handleIncrement = () => {
    if (quantityInCart < stock) {
      addItem(
        {
          productId: product._id,
          name: product.name ?? "",
          price: product.price ?? 0,
          image: mainImageUrl ?? undefined,
        },
        1,
      );
    }
  };

  const handleDecrement = () => {
    if (quantityInCart > 0) updateQuantity(product._id, quantityInCart - 1);
  };

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl",
        "transition-all duration-300 ease-out",
        "bg-white ring-1 ring-zinc-200",
        "hover:-translate-y-1 hover:ring-zinc-300 hover:shadow-xl hover:shadow-zinc-200/80",
        "dark:bg-[#111111] dark:ring-1 dark:ring-[#1f1f1f]",
        "dark:hover:-translate-y-1.5 dark:hover:ring-cyan-500/30",
        "dark:hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2),0_8px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.08)]",
      )}
    >
      {/* ── Image ── */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-[#0d0d0d]">
          {displayedImageUrl ? (
            <Image
              src={displayedImageUrl}
              alt={product.name ?? "Product image"}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/10">
              <Eye className="h-2.5 w-2.5" /> View Details
            </span>
          </div>

          {isOutOfStock && (
            <div className="absolute left-2 top-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              Out of Stock
            </div>
          )}

          {categoryLabel && !isOutOfStock && (
            <span className="absolute left-2 top-2 max-w-[65%] truncate rounded-full bg-white/85 dark:bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 backdrop-blur-sm border border-zinc-200/50 dark:border-white/8">
              {categoryLabel}
            </span>
          )}

          <WishlistButton
            productId={product._id}
            name={product.name ?? ""}
            price={product.price ?? 0}
            image={mainImageUrl ?? undefined}
            slug={product.slug ?? ""}
            categoryTitle={product.category?.title ?? undefined}
            variant="overlay"
          />
        </div>
      </Link>

      {/* ── Thumbnail strip — desktop only ── */}
      {hasMultipleImages ? (
        <div className="hidden sm:flex gap-1.5 border-t border-zinc-100 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#0d0d0d] p-2 sm:p-3">
          {images.map((image, index) => (
            <button
              key={image._key ?? index}
              type="button"
              className={cn(
                "relative h-10 sm:h-12 flex-1 overflow-hidden rounded-md sm:rounded-lg transition-all duration-200",
                hoveredImageIndex === index
                  ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-white dark:ring-offset-[#111111]"
                  : "opacity-40 hover:opacity-75",
              )}
              onMouseEnter={() => setHoveredImageIndex(index)}
              onMouseLeave={() => setHoveredImageIndex(null)}
            >
              {image.asset?.url && (
                <Image src={image.asset.url} alt={`${product.name} - view ${index + 1}`}
                  fill className="object-cover" sizes="80px" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="hidden sm:block h-px bg-zinc-100 dark:bg-[#1a1a1a]" />
      )}

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">

        {/*
          Name — min-h-[2.5em] keeps the grid row aligned even when
          a product name is only one line vs two lines on the card next to it.
        */}
        <Link href={`/products/${product.slug}`} className="block mb-2">
          <h3 className="font-display line-clamp-2 text-[12px] sm:text-sm font-semibold leading-snug text-zinc-900 dark:text-[#f1f1f1] group-hover:text-zinc-700 dark:group-hover:text-white transition-colors min-h-[2.5em]">
            {product.name}
          </h3>
        </Link>

        {/*
          Price row — left-aligned reads premium, not marketplace.
          StockBadge lives on the right so it costs zero extra vertical space.
        */}
        <div className="flex items-baseline justify-between gap-1 mb-3">
          <p className="font-display text-base sm:text-xl font-extrabold tracking-tight leading-none text-zinc-900 dark:text-amber-400">
            {formatInCurrency(product.price)}
          </p>
          <StockBadge productId={product._id} stock={stock} />
        </div>

        {/* ── CTAs ── */}
        <div className="mt-auto space-y-1.5">

          {isOutOfStock ? (

            /* Out of stock — full width, no confusion */
            <button
              disabled
              className="w-full h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
            >
              Out of Stock
            </button>

          ) : isInCart ? (

            <>
              {/*
                ── IN CART STATE ──────────────────────────────────────────────
                Customer already committed. Buy Now stays as the dominant CTA
                — clicking it takes them to the product page where checkout is
                one step away. Stepper sits below, smaller, purely functional.
                ─────────────────────────────────────────────────────────────── */}
              <Link
                href={`/products/${product.slug}`}
                className={cn(
                  "flex w-full h-11 items-center justify-center gap-1.5 rounded-lg",
                  "bg-amber-500 text-zinc-950 font-display text-xs sm:text-sm font-bold tracking-wide",
                  "shadow-md shadow-amber-500/25 hover:bg-amber-400 transition-all duration-200 active:scale-[0.98]",
                )}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                Buy Now
              </Link>

              {/* Compact quantity stepper — secondary, below Buy Now */}
              <div className="flex h-8 w-full items-stretch overflow-hidden rounded-lg border border-amber-500/40 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/8">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="flex flex-1 items-center justify-center text-amber-700 dark:text-amber-400 font-black transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/15 active:bg-amber-200 dark:active:bg-amber-500/25"
                  aria-label="Remove one"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-1 items-center justify-center border-x border-amber-500/25 bg-white dark:bg-[#111]">
                  <span className="font-display text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    {quantityInCart}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={isAtMax}
                  className="flex flex-1 items-center justify-center text-amber-700 dark:text-amber-400 font-black transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/15 active:bg-amber-200 dark:active:bg-amber-500/25 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Add one more"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </>

          ) : (

            <>
              {/*
                ── DEFAULT STATE — the impulse trigger ───────────────────────
                One dominant button. Full width. Amber. Tall. Unmissable.
                "Buy Now" = zero friction between desire and purchase.

                The cart icon is embedded as a recessed pill on the right edge
                of the Buy Now button. It's reachable but visually secondary —
                the eye lands on "Buy Now" first, every single time.

                On a 185px-wide card (Fold 4), the button fills the entire
                card width. The embedded cart pill is 32px — still a
                comfortable tap target without ever competing for attention.
                ─────────────────────────────────────────────────────────────── */}
              <div className="relative">
                <Link
                  href={`/products/${product.slug}`}
                  className={cn(
                    "flex w-full h-11 items-center justify-center gap-1.5 rounded-lg",
                    "bg-amber-500 text-zinc-950 font-display text-xs sm:text-sm font-bold tracking-wide",
                    "shadow-md shadow-amber-500/25 hover:bg-amber-400 transition-all duration-200 active:scale-[0.98]",
                    "pr-11", // breathing room for the embedded cart pill
                  )}
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" />
                  Buy Now
                </Link>

                {/* Cart pill — lives inside Buy Now, right edge, visually recessed */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  aria-label="Add to cart"
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2",
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    "transition-all duration-200 active:scale-95",
                    justAdded
                      ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-black/15 dark:bg-black/30 text-zinc-950 hover:bg-black/25 dark:hover:bg-black/45",
                  )}
                >
                  {justAdded
                    ? <Check className="h-3.5 w-3.5" />
                    : <ShoppingBag className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            </>

          )}

          {/* Compare — desktop only */}
          <div className="hidden sm:flex justify-center pt-0.5">
            <CompareButton
              product={{
                productId: product._id,
                name: product.name ?? "",
                price: product.price ?? 0,
                image: mainImageUrl ?? undefined,
                slug: product.slug ?? "",
                categoryTitle: product.category?.title ?? undefined,
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}