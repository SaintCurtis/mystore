"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, X, ShoppingCart, Trash2, PackageSearch } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartActions } from "@/lib/store/cart-store-provider";
import {
  useWishlistItems,
  useWishlistIsOpen,
  useWishlistActions,
} from "@/lib/store/wishlist-store-provider";

export function WishlistSheet() {
  const isOpen = useWishlistIsOpen();
  const items = useWishlistItems();
  const { closeWishlist, removeItem, clearWishlist } = useWishlistActions();
  const { addItem: addToCart, openCart } = useCartActions();

  function handleMoveToCart(item: (typeof items)[number]) {
    addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
    });
    removeItem(item.productId);
    closeWishlist();
    openCart();
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeWishlist}
        />
      )}

      {/* Sheet */}
      <div
        className={`
          fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col
          bg-white dark:bg-[#0f0f0f]
          border-l border-zinc-200 dark:border-[#1a1a1a]
          shadow-2xl dark:shadow-black/60
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#1a1a1a] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10">
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                Wishlist
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearWishlist}
                className="text-xs text-zinc-400 dark:text-[#555] hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
            <Button variant="ghost" size="icon" onClick={closeWishlist}
              className="text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a]">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-[#1a1a1a]">
                <PackageSearch className="h-7 w-7 text-zinc-400 dark:text-[#555]" />
              </div>
              <div>
                <p className="font-semibold text-zinc-700 dark:text-[#f1f1f1]">
                  Your wishlist is empty
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-[#a3a3a3]">
                  Save products you love and come back to them later
                </p>
              </div>
              <Button
                onClick={closeWishlist}
                className="mt-2 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold"
              >
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="group flex gap-4 rounded-xl border border-zinc-100 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#111111] p-3 transition-colors hover:border-zinc-200 dark:hover:border-[#2a2a2a]"
                >
                  {/* Image */}
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeWishlist}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d]"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <PackageSearch className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeWishlist}
                      className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1] hover:text-amber-600 dark:hover:text-amber-400 transition-colors leading-snug"
                    >
                      {item.name}
                    </Link>
                    {item.categoryTitle && (
                      <span className="text-xs text-zinc-400 dark:text-[#555]">
                        {item.categoryTitle}
                      </span>
                    )}
                    <p className="text-base font-bold text-zinc-900 dark:text-amber-400">
                      {formatPrice(item.price)}
                    </p>

                    {/* Actions */}
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 dark:text-[#555] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — only when items exist */}
        {items.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-[#1a1a1a] px-5 py-4 space-y-2">
            <Button
              className="w-full bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 h-11"
              onClick={() => {
                items.forEach((item) =>
                  addToCart({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                  })
                );
                clearWishlist();
                closeWishlist();
                openCart();
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add All to Cart ({items.length})
            </Button>
            <Button
              variant="ghost"
              className="w-full dark:text-[#a3a3a3] dark:hover:bg-[#1a1a1a] dark:hover:text-[#f1f1f1]"
              onClick={closeWishlist}
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </>
  );
}