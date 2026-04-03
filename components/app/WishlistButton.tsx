"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useIsWishlisted,
  useWishlistActions,
} from "@/lib/store/wishlist-store-provider";

interface WishlistButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
  categoryTitle?: string;
  /** "overlay" = floating on image corner, "inline" = standalone button */
  variant?: "overlay" | "inline";
  className?: string;
}

export function WishlistButton({
  productId,
  name,
  price,
  image,
  slug,
  categoryTitle,
  variant = "overlay",
  className,
}: WishlistButtonProps) {
  const isWishlisted = useIsWishlisted(productId);
  const { toggleItem } = useWishlistActions();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // prevent Link navigation when inside a card
    e.stopPropagation();
    toggleItem({ productId, name, price, image, slug, categoryTitle });
  }

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={cn(
          "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full",
          "transition-all duration-200",
          // Light
          "bg-white/80 hover:bg-white shadow-sm",
          // Dark
          "dark:bg-black/60 dark:hover:bg-black/80 dark:shadow-none",
          // Wishlisted state
          isWishlisted
            ? "text-red-500 dark:text-red-400"
            : "text-zinc-400 dark:text-zinc-500 hover:text-red-400 dark:hover:text-red-400",
          className
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-all duration-200",
            isWishlisted ? "fill-current scale-110" : "scale-100"
          )}
        />
      </button>
    );
  }

  // Inline variant — used on wishlist page or product detail
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
        isWishlisted
          ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20"
          : "border border-zinc-200 dark:border-[#2a2a2a] text-zinc-600 dark:text-[#a3a3a3] hover:border-red-300 dark:hover:border-red-500/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all duration-200",
          isWishlisted ? "fill-current" : ""
        )}
      />
      {isWishlisted ? "Saved" : "Save to Wishlist"}
    </button>
  );
}