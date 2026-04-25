"use client";

import { useEffect, useState, useRef } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartActions, useCartItem } from "@/lib/store/cart-store-provider";
import { toast } from "sonner";
import { useCurrency } from "@/lib/store/currency-store-provider";
import type { SelectedVariant } from "@/types/variants";

interface StickyAddToCartProps {
  productId: string;
  name: string;
  price: number;           // computed price (base + variants)
  image?: string;
  stock: number;
  selectedVariants?: SelectedVariant[];
  // Ref to the main AddToCartButton — we hide sticky bar when it's visible
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

export function StickyAddToCart({
  productId,
  name,
  price,
  image,
  stock,
  selectedVariants = [],
  triggerRef,
}: StickyAddToCartProps) {
  const [show, setShow] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCartActions();
  const { formatInCurrency } = useCurrency();

  const variantKey =
    selectedVariants.length > 0
      ? selectedVariants.map((v) => `${v.type}:${v.label}`).join("|")
      : "";
  const cartItemId = variantKey ? `${productId}__${variantKey}` : productId;
  const cartItem = useCartItem(cartItemId);
  const quantityInCart = cartItem?.quantity ?? 0;
  const isOutOfStock = stock <= 0;

  // Show sticky bar only when the main AddToCartButton has scrolled out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the main button is NOT intersecting — show sticky bar
        setShow(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [triggerRef]);

  const handleAdd = () => {
    if (isOutOfStock || quantityInCart >= stock) return;
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
  };

  if (isOutOfStock) return null;

  return (
    <div
      className={cn(
        // Only on mobile, above the bottom nav (bottom-16 = 64px = nav height)
        "fixed bottom-16 left-0 right-0 z-40 sm:hidden",
        "transition-all duration-300",
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none",
      )}
    >
      <div className="mx-3 mb-2 overflow-hidden rounded-2xl border border-amber-500/30 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Product name + price */}
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {name}
            </p>
            <p className="text-sm font-bold text-amber-500 dark:text-amber-400">
              {formatInCurrency(price)}
            </p>
          </div>

          {/* Add to cart button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95",
              justAdded
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30 hover:bg-amber-400",
            )}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4 shrink-0" />
                Added!
              </>
            ) : quantityInCart > 0 ? (
              <>
                <ShoppingBag className="h-4 w-4 shrink-0" />
                Add More ({quantityInCart} in cart)
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 shrink-0" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}