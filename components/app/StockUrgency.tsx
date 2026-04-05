"use client";

import { useEffect, useState } from "react";
import { Flame, Users } from "lucide-react";

interface StockUrgencyProps {
  stock: number;
  productId: string;
}

const LOW_STOCK_THRESHOLD = 5;

// Simulated "viewers" — random between 2–12, stable per product per session
function getViewerCount(productId: string): number {
  // Use productId to seed a consistent number per product
  const seed = productId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (seed % 11) + 2; // 2–12
}

export function StockUrgency({ stock, productId }: StockUrgencyProps) {
  const [viewers, setViewers] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setViewers(getViewerCount(productId));
    setMounted(true);
  }, [productId]);

  if (!mounted) return null;

  const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = stock <= 0;

  if (isOutOfStock) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Low stock warning */}
      {isLow && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/8 px-3 py-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Only {stock} left in stock — order soon!
            </p>
          </div>
        </div>
      )}

      {/* Viewers count */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#a3a3a3]">
        <Users className="h-3.5 w-3.5" />
        <span>
          <span className="font-semibold text-zinc-700 dark:text-[#f1f1f1]">{viewers}</span>
          {" "}people viewing this right now
        </span>
      </div>
    </div>
  );
}