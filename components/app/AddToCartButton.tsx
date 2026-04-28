"use client";

import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartActions, useCartItem } from "@/lib/store/cart-store-provider";
import { cn } from "@/lib/utils";
import type { SelectedVariant } from "@/types/variants";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  className?: string;
  selectedVariants?: SelectedVariant[];
  /** When true, shows full "Add to Cart" label (for product detail page) */
  showLabel?: boolean;
}

export function AddToCartButton({
  productId,
  name,
  price,
  image,
  stock,
  className,
  selectedVariants = [],
  showLabel = false,
}: AddToCartButtonProps) {
  const { addItem, updateQuantity } = useCartActions();

  const variantKey =
    selectedVariants.length > 0
      ? selectedVariants.map((v) => `${v.type}:${v.label}`).join("|")
      : "";
  const cartItemId = variantKey ? `${productId}__${variantKey}` : productId;

  const cartItem = useCartItem(cartItemId);
  const [justAdded, setJustAdded] = useState(false);

  const quantityInCart = cartItem?.quantity ?? 0;
  const isOutOfStock = stock <= 0;
  const isAtMax = quantityInCart >= stock;

  const handleAdd = () => {
    if (quantityInCart < stock) {
      addItem(
        {
          productId: cartItemId,
          name,
          price,
          image,
          ...(selectedVariants.length > 0 && { selectedVariants }),
        },
        1,
      );
      const specSummary =
        selectedVariants.length > 0
          ? ` (${selectedVariants.map((v) => v.label).join(" / ")})`
          : "";
      toast.success(`${name}${specSummary} added to cart`);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const handleDecrement = () => {
    if (quantityInCart > 0) {
      updateQuantity(cartItemId, quantityInCart - 1);
    }
  };

  // Out of stock
  if (isOutOfStock) {
    return (
      <Button
        disabled
        className={cn(
          "min-h-11 h-11 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-zinc-200 dark:border-zinc-700",
          className,
        )}
      >
        Out of Stock
      </Button>
    );
  }

  // Not yet in cart
  if (quantityInCart === 0) {
    return (
      <Button
        onClick={handleAdd}
        className={cn(
          "min-h-11 h-11 w-full rounded-lg font-display font-bold tracking-wide transition-all duration-200 active:scale-[0.98]",
          justAdded
            ? "bg-emerald-500 text-white hover:bg-emerald-500"
            : "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] border border-zinc-700 dark:border-zinc-600",
          className,
        )}
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4 shrink-0" />
            {showLabel && <span className="ml-1.5 text-sm">Added!</span>}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4 shrink-0" />
            {showLabel && <span className="ml-1.5 text-sm">Add to Cart</span>}
          </>
        )}
      </Button>
    );
  }

  // In cart — quantity stepper
  return (
    <div
      className={cn(
        "flex min-h-11 h-11 w-full items-stretch overflow-hidden rounded-lg border border-amber-500/50 bg-amber-500/8 dark:border-amber-500/40 dark:bg-amber-500/5",
        className,
      )}
    >
      <button
        type="button"
        className="flex flex-1 items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold text-lg transition-colors hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 active:bg-amber-500/25"
        onClick={handleDecrement}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="flex flex-1 items-center justify-center border-x border-amber-500/25 bg-amber-500/5">
        <span className="font-display text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
          {quantityInCart}
        </span>
      </div>

      <button
        type="button"
        className="flex flex-1 items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold text-lg transition-colors hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 active:bg-amber-500/25 disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={handleAdd}
        disabled={isAtMax}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}