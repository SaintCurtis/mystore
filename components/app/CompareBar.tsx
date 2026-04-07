"use client";

import Image from "next/image";
import Link from "next/link";
import { X, GitCompare, ChevronUp, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartActions } from "@/lib/store/cart-store-provider";
import {
  useCompareItems, useCompareCount, useCompareIsOpen, useCompareActions,
} from "@/lib/store/compare-store-provider";
import { MAX_COMPARE } from "@/lib/store/compare-store";

// Spec rows for side-by-side comparison
const SPEC_ROWS = [
  { key: "price",        label: "Price" },
  { key: "category",     label: "Category" },
  { key: "material",     label: "Material" },
  { key: "color",        label: "Color" },
  { key: "dimensions",   label: "Dimensions" },
];

export function CompareBar() {
  const items = useCompareItems();
  const count = useCompareCount();
  const isOpen = useCompareIsOpen();
  const { removeItem, clearAll, openDrawer, closeDrawer } = useCompareActions();
  const { addItem: addToCart } = useCartActions();

  if (count === 0) return null;

  return (
    <>
      {/* ── Floating bar ─────────────────────────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-4 py-3 shadow-2xl dark:shadow-black/60">
            {/* Thumbnails */}
            <div className="flex items-center gap-1.5">
              {items.map((item) => (
                <div key={item.productId} className="relative group">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d] ring-1 ring-zinc-200 dark:ring-[#2a2a2a]">
                    {item.image
                      ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                      : <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-600 text-xs">?</div>}
                  </div>
                  <button onClick={() => removeItem(item.productId)}
                    className="absolute -right-1 -top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: MAX_COMPARE - count }).map((_, i) => (
                <div key={i} className="h-10 w-10 rounded-lg border-2 border-dashed border-zinc-200 dark:border-[#2a2a2a] flex items-center justify-center text-zinc-300 dark:text-[#444] text-xs">
                  +
                </div>
              ))}
            </div>

            <div className="h-8 w-px bg-zinc-200 dark:bg-[#2a2a2a]" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-[#a3a3a3]">
                <span className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">{count}</span>/{MAX_COMPARE} selected
              </span>
              <Button size="sm"
                disabled={count < 2}
                onClick={openDrawer}
                className="gap-1.5 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 disabled:opacity-40 shadow-sm shadow-amber-500/20">
                <GitCompare className="h-3.5 w-3.5" />
                Compare
              </Button>
              <button onClick={clearAll} className="text-xs text-zinc-400 dark:text-[#555] hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compare drawer (full-width slide-up) ─────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeDrawer} />

          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0f0f0f] shadow-2xl">

            {/* Drawer header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0f0f0f] px-6 py-4 z-10">
              <div className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-[#f1f1f1]">
                  Comparing {count} Products
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={closeDrawer}
                  className="flex items-center gap-1 text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors">
                  <ChevronUp className="h-4 w-4" /> Collapse
                </button>
                <Button variant="ghost" size="icon" onClick={closeDrawer}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">

                {/* Product headers */}
                <thead>
                  <tr>
                    <th className="w-32 pb-4 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-[#555]">
                      Feature
                    </th>
                    {items.map((item) => (
                      <th key={item.productId} className="pb-4 px-3 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {/* Remove */}
                          <button onClick={() => removeItem(item.productId)}
                            className="self-end -mb-1 text-zinc-300 dark:text-[#444] hover:text-red-500 dark:hover:text-red-400 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {/* Image */}
                          <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-zinc-100 dark:bg-[#0d0d0d]">
                            {item.image
                              ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                              : null}
                          </div>
                          {/* Name */}
                          <Link href={`/products/${item.slug}`}
                            className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1] hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2 text-center max-w-40">
                            {item.name}
                          </Link>
                        </div>
                      </th>
                    ))}
                    {/* Empty slots */}
                    {Array.from({ length: MAX_COMPARE - count }).map((_, i) => (
                      <th key={i} className="pb-4 px-3 text-center">
                        <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 dark:border-[#2a2a2a] text-zinc-300 dark:text-[#444] text-xs">
                          Add product
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Spec rows */}
                <tbody>
                  {SPEC_ROWS.map((row, rowIdx) => (
                    <tr key={row.key} className={rowIdx % 2 === 0 ? "bg-zinc-50 dark:bg-[#111111]" : "bg-white dark:bg-transparent"}>
                      <td className="rounded-l-lg px-3 py-3 text-xs font-semibold text-zinc-500 dark:text-[#a3a3a3]">
                        {row.label}
                      </td>
                      {items.map((item) => {
                        let value: string = "—";
                        if (row.key === "price") value = formatPrice(item.price);
                        else if (row.key === "category") value = item.categoryTitle ?? "—";
                        else if (row.key === "material") value = item.specs?.material ?? "—";
                        else if (row.key === "color") value = item.specs?.color ?? "—";
                        else if (row.key === "dimensions") value = item.specs?.dimensions ?? "—";
                        return (
                          <td key={item.productId} className="px-3 py-3 text-center text-sm text-zinc-800 dark:text-[#f1f1f1]">
                            {row.key === "price"
                              ? <span className="font-bold text-zinc-900 dark:text-amber-400">{value}</span>
                              : value}
                          </td>
                        );
                      })}
                      {Array.from({ length: MAX_COMPARE - count }).map((_, i) => (
                        <td key={i} className="px-3 py-3 text-center text-sm text-zinc-300 dark:text-[#333]">—</td>
                      ))}
                    </tr>
                  ))}

                  {/* Add to cart row */}
                  <tr>
                    <td className="px-3 py-4 text-xs font-semibold text-zinc-500 dark:text-[#a3a3a3]">Action</td>
                    {items.map((item) => (
                      <td key={item.productId} className="px-3 py-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => addToCart({ productId: item.productId, name: item.name, price: item.price, image: item.image })}
                          className="gap-1.5 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 text-xs">
                          <ShoppingCart className="h-3 w-3" />
                          Add to Cart
                        </Button>
                      </td>
                    ))}
                    {Array.from({ length: MAX_COMPARE - count }).map((_, i) => <td key={i} />)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}