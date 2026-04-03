"use client";

import { useState } from "react";
import { PackageSearch, ChevronDown } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { FILTER_PRODUCTS_BY_NAME_QUERYResult } from "@/sanity.types";

interface ProductGridProps {
  products: FILTER_PRODUCTS_BY_NAME_QUERYResult;
  activeCategory?: string;
  /**
   * When true (homepage with no filters), limits initial display to
   * INITIAL_LIMIT and shows a "Load More" button.
   * When false (category/search page), shows all products.
   */
  limitOnHomepage?: boolean;
}

const INITIAL_LIMIT = 12;
const LOAD_MORE_COUNT = 12;

export function ProductGrid({ products, activeCategory, limitOnHomepage = false }: ProductGridProps) {
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT);

  if (products.length === 0) {
    return (
      <div className="min-h-[400px] rounded-2xl border border-dashed border-zinc-200 dark:border-[#1f1f1f] bg-zinc-50 dark:bg-[#0d0d0d]">
        <EmptyState
          icon={PackageSearch}
          title="No products found"
          description="Try adjusting your search or filters to find what you're looking for"
          size="lg"
        />
      </div>
    );
  }

  // Apply limit only on homepage with no active filters
  const shouldLimit = limitOnHomepage;
  const visibleProducts = shouldLimit ? products.slice(0, displayLimit) : products;
  const hasMore = shouldLimit && displayLimit < products.length;
  const remaining = products.length - displayLimit;

  return (
    <div className="flex flex-col gap-8">
      <div className="@container">
        <div className="grid grid-cols-1 gap-5 @md:grid-cols-2 @xl:grid-cols-3 @6xl:grid-cols-4 @md:gap-6 @xl:gap-7">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              activeCategory={activeCategory}
            />
          ))}
        </div>
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setDisplayLimit((prev) => prev + LOAD_MORE_COUNT)}
            className={`
              group h-12 min-w-[200px] gap-2 font-semibold transition-all duration-200
              border-zinc-300 dark:border-[#2a2a2a]
              bg-white dark:bg-[#111111]
              text-zinc-700 dark:text-[#a3a3a3]
              hover:border-amber-500/50 dark:hover:border-amber-500/40
              hover:bg-amber-50 dark:hover:bg-[#1a1a1a]
              hover:text-amber-700 dark:hover:text-amber-400
              hover:shadow-md dark:hover:shadow-amber-500/5
            `}
          >
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
            Load More
            <span className="rounded-full bg-zinc-100 dark:bg-[#1a1a1a] px-2 py-0.5 text-xs font-medium text-zinc-500 dark:text-[#a3a3a3]">
              {remaining} more
            </span>
          </Button>
          <p className="text-xs text-zinc-400 dark:text-[#555]">
            Showing {Math.min(displayLimit, products.length)} of {products.length} products
          </p>
        </div>
      )}

      {/* All loaded indicator */}
      {shouldLimit && !hasMore && products.length > INITIAL_LIMIT && (
        <p className="text-center text-xs text-zinc-400 dark:text-[#555]">
          All {products.length} products shown
        </p>
      )}
    </div>
  );
}