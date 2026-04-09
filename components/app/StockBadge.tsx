"use client";

import { Badge } from "@/components/ui/badge";
import { useCartItem } from "@/lib/store/cart-store-provider";
import { cn } from "@/lib/utils";
import { isLowStock as checkLowStock } from "@/lib/constants/stock";

interface StockBadgeProps {
  productId: string;
  stock: number;
  className?: string;
}

export function StockBadge({ productId, stock, className }: StockBadgeProps) {
  const cartItem = useCartItem(productId);

  const quantityInCart = cartItem?.quantity ?? 0;
  const isAtMax = quantityInCart >= stock && stock > 0;
  const lowStock = checkLowStock(stock);

  if (isAtMax) {
    return (
      <Badge
        variant="secondary"
        className={cn("w-fit shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400", className)}
      >
        Max in cart
      </Badge>
    );
  }

  if (lowStock) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "w-fit shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
          className
        )}
      >
        {/* Short text on mobile, full text on sm+ */}
        <span className="sm:hidden">Only {stock} left</span>
        <span className="hidden sm:inline">Only {stock} left in stock</span>
      </Badge>
    );
  }

  return null;
}