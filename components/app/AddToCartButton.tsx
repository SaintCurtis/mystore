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
  price: number;                        // already computed (base + variant deltas)
  image?: string;
  stock: number;
  className?: string;
  selectedVariants?: SelectedVariant[]; // ← NEW (optional — non-variant products pass nothing)
}

export function AddToCartButton({
  productId,
  name,
  price,
  image,
  stock,
  className,
  selectedVariants = [],
}: AddToCartButtonProps) {
  const { addItem, updateQuantity } = useCartActions();

  // Cart key = productId + variant combo so that e.g. 16GB and 32GB versions
  // sit as separate line items in the cart.
  const variantKey =
    selectedVariants.length > 0
      ? selectedVariants.map((v) => `${v.type}:${v.label}`).join("|")
      : "";
  const cartItemId = variantKey ? `${productId}__${variantKey}` : productId;

  const cartItem        = useCartItem(cartItemId);
  const [justAdded, setJustAdded] = useState(false);

  const quantityInCart = cartItem?.quantity ?? 0;
  const isOutOfStock   = stock <= 0;
  const isAtMax        = quantityInCart >= stock;

  const handleAdd = () => {
    if (quantityInCart < stock) {
      addItem(
        {
          productId: cartItemId,   // unique per variant combo
          name,
          price,                   // computed price
          image,
          ...(selectedVariants.length > 0 && { selectedVariants }),
        },
        1,
      );

      // Human-readable toast — shows which specs were added
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

  // ── Out of stock ───────────────────────────────────────────
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

  // ── Not in cart ────────────────────────────────────────────
  if (quantityInCart === 0) {
    return (
      <Button
        onClick={handleAdd}
        className={cn(
          "min-h-11 h-11 w-full rounded-lg font-display text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.98]",
          justAdded
            ? "bg-emerald-500 text-white hover:bg-emerald-500"
            : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/25 dark:shadow-amber-500/10",
          className,
        )}
      >
        {justAdded ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Added!
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Add to Cart — ₦{price.toLocaleString()}
          </>
        )}
      </Button>
    );
  }

  // ── In cart — quantity controls ────────────────────────────
  return (
    <div
      className={cn(
        "flex min-h-11 h-11 w-full items-center overflow-hidden rounded-lg border border-amber-500/50 bg-amber-500/8 dark:border-amber-500/40 dark:bg-amber-500/5",
        className,
      )}
    >
      <button
        type="button"
        className="flex h-full min-w-48px flex-1 items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400 active:bg-amber-500/15"
        onClick={handleDecrement}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <div className="flex h-full min-w-40px flex-1 items-center justify-center border-x border-amber-500/20">
        <span className="font-display text-sm font-bold text-amber-500 dark:text-amber-400 tabular-nums">
          {quantityInCart}
        </span>
      </div>

      <button
        type="button"
        className="flex h-full min-w-48px flex-1 items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400 active:bg-amber-500/15 disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={handleAdd}
        disabled={isAtMax}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}