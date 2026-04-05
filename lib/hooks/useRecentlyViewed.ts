"use client";

import { useEffect, useState } from "react";

export interface RecentlyViewedProduct {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  categoryTitle?: string;
  viewedAt: number;
}

const KEY = "recently-viewed";
const MAX_ITEMS = 8;

function getStored(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Call this on the product detail page to record a view */
export function recordView(product: Omit<RecentlyViewedProduct, "viewedAt">) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStored().filter((p) => p.productId !== product.productId);
    const updated = [{ ...product, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(updated));
    // Dispatch custom event so other components re-render
    window.dispatchEvent(new Event("recently-viewed-updated"));
  } catch {}
}

/** Returns recently viewed products, excluding the given productId (current page) */
export function useRecentlyViewed(excludeId?: string) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    function load() {
      const stored = getStored().filter((p) => p.productId !== excludeId);
      setItems(stored);
    }
    load();
    window.addEventListener("recently-viewed-updated", load);
    return () => window.removeEventListener("recently-viewed-updated", load);
  }, [excludeId]);

  return items;
}