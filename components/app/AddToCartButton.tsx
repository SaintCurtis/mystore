"use client";

import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartActions, useCartItem } from "@/lib/store/cart-store-provider";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  name,
  price,
  image,
  stock,
  className,
}: AddToCartButtonProps) {
  const { addItem, updateQuantity } = useCartActions();
  const cartItem = useCartItem(productId);
  const [justAdded, setJustAdded] = useState(false);

  const quantityInCart = cartItem?.quantity ?? 0;
  const isOutOfStock = stock <= 0;
  const isAtMax = quantityInCart >= stock;

  const handleAdd = () => {
    if (quantityInCart < stock) {
      addItem({ productId, name, price, image }, 1);
      toast.success(`${name} added to cart`);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const handleDecrement = () => {
    if (quantityInCart > 0) {
      updateQuantity(productId, quantityInCart - 1);
    }
  };

  // Out of stock
  if (isOutOfStock) {
    return (
      <Button
        disabled
        className={cn(
          "h-11 w-full rounded-lg bg-zinc-800 text-sm font-medium text-zinc-500 cursor-not-allowed border border-zinc-700",
          className,
        )}
      >
        Out of Stock
      </Button>
    );
  }

  // Not in cart
  if (quantityInCart === 0) {
    return (
      <Button
        onClick={handleAdd}
        className={cn(
          "h-11 w-full rounded-lg font-display text-sm font-bold tracking-wide transition-all duration-200",
          justAdded
            ? "bg-emerald-500 text-white hover:bg-emerald-500"
            : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/25",
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
            Add to Cart
          </>
        )}
      </Button>
    );
  }

  // In cart — quantity controls
  return (
    <div
      className={cn(
        "flex h-11 w-full items-center overflow-hidden rounded-lg border border-amber-500/40 bg-amber-500/5",
        className,
      )}
    >
      <button
        type="button"
        className="flex h-full flex-1 items-center justify-center text-zinc-400 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
        onClick={handleDecrement}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="flex h-full flex-1 items-center justify-center border-x border-amber-500/20">
        <span className="font-display text-sm font-bold text-amber-400 tabular-nums">
          {quantityInCart}
        </span>
      </div>
      <button
        type="button"
        className="flex h-full flex-1 items-center justify-center text-zinc-400 transition-colors hover:bg-amber-500/10 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={handleAdd}
        disabled={isAtMax}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}