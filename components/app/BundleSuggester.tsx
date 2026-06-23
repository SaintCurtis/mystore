"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, X, ShoppingBag, Plus, Loader2, ArrowRight } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useBundleTrigger, useCartActions } from "@/lib/store/cart-store-provider";
import { useCurrency } from "@/lib/store/currency-store-provider";
import { toast } from "sonner";

interface BundleProduct {
  _id: string;
  name: string;
  price: number;
  slug: string;
  categoryTitle: string;
  image?: string;
  reason: string;
}

export function BundleSuggester() {
  const trigger = useBundleTrigger();         // { productName, productPrice, categorySlug } | null
  const { addItem, clearBundleTrigger } = useCartActions();
  const { formatInCurrency } = useCurrency();

  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [bundles, setBundles] = useState<BundleProduct[]>([]);
  const [added, setAdded]     = useState<Set<string>>(new Set());

  // Fire when trigger changes (new laptop added to cart)
  useEffect(() => {
    if (!trigger) return;

    const isComputer =
      trigger.categorySlug?.includes("laptop") ||
      trigger.categorySlug?.includes("computer") ||
      trigger.categorySlug?.includes("gaming") ||
      trigger.categorySlug?.includes("mac");

    if (!isComputer) return;

    setOpen(true);
    setLoading(true);
    setBundles([]);
    setAdded(new Set());

    fetch("/api/bundle-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trigger),
    })
      .then((r) => r.json())
      .then((data) => setBundles(data.bundles ?? []))
      .catch(() => setBundles([]))
      .finally(() => setLoading(false));
  }, [trigger]);

  const handleClose = useCallback(() => {
    setOpen(false);
    clearBundleTrigger();
  }, [clearBundleTrigger]);

  const handleAddOne = (product: BundleProduct) => {
    addItem(
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      1,
    );
    setAdded((prev) => new Set(prev).add(product._id));
    toast.success(`${product.name} added to cart`);
  };

  const handleAddAll = () => {
    const toAdd = bundles.filter((b) => !added.has(b._id));
    toAdd.forEach((b) =>
      addItem({ productId: b._id, name: b.name, price: b.price, image: b.image }, 1)
    );
    setAdded(new Set(bundles.map((b) => b._id)));
    toast.success(`${toAdd.length} items added to cart!`);
  };

  const allAdded   = bundles.length > 0 && bundles.every((b) => added.has(b._id));
  const totalExtra = bundles
    .filter((b) => !added.has(b._id))
    .reduce((sum, b) => sum + b.price, 0);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-0 pb-0 max-h-[88dvh] flex flex-col gap-0 sm:max-w-lg sm:mx-auto sm:rounded-2xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Complete Your Setup
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AI-picked accessories for {trigger?.productName?.split(" ").slice(0, 3).join(" ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <p className="text-sm text-zinc-500">Finding the best pairings…</p>
            </div>
          ) : bundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <ShoppingBag className="h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">No suggestions available right now</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bundles.map((product) => {
                const isAdded = added.has(product._id);
                return (
                  <div
                    key={product._id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-all duration-200 ${
                      isAdded
                        ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-zinc-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={handleClose}
                        className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 italic">
                        {product.reason}
                      </p>
                      <p className="text-sm font-bold text-amber-500 dark:text-amber-400 mt-1">
                        {formatInCurrency(product.price)}
                      </p>
                    </div>

                    {/* Add button */}
                    <button
                      type="button"
                      onClick={() => !isAdded && handleAddOne(product)}
                      disabled={isAdded}
                      className={`flex shrink-0 h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
                        isAdded
                          ? "bg-emerald-500 text-white cursor-default"
                          : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/25"
                      }`}
                    >
                      {isAdded ? (
                        <ShoppingBag className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && bundles.length > 0 && (
          <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 space-y-2">
            {!allAdded && (
              <button
                type="button"
                onClick={handleAddAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-12 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <ShoppingBag className="h-4 w-4" />
                Add All · {formatInCurrency(totalExtra)} more
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 h-11 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              {allAdded ? (
                <>
                  Continue Shopping
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                "No thanks, continue"
              )}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}