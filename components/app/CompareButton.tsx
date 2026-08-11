"use client";

import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsCompared, useCompareActions, useCompareCount } from "@/lib/store/compare-store-provider";
import { MAX_COMPARE } from "@/lib/store/compare-store";
import type { CompareProduct } from "@/lib/store/compare-store";

interface CompareButtonProps {
  product: CompareProduct;
  className?: string;
}

export function CompareButton({ product, className }: CompareButtonProps) {
  const isCompared = useIsCompared(product.productId);
  const count = useCompareCount();
  const { toggleItem } = useCompareActions();

  const isDisabled = !isCompared && count >= MAX_COMPARE;

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleItem(product); }}
      disabled={isDisabled}
      title={isDisabled ? `Max ${MAX_COMPARE} products` : isCompared ? "Remove from compare" : "Add to compare"}
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition-all duration-200",
        isCompared
          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
          : "bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-500 dark:text-[#a3a3a3] border border-zinc-200 dark:border-[#2a2a2a] hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400",
        isDisabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      <GitCompare className="h-3 w-3" />
      {isCompared ? "Comparing" : "Compare"}
    </button>
  );
}