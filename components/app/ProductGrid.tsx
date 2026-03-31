"use client";

import { PackageSearch } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import type { FILTER_PRODUCTS_BY_NAME_QUERYResult } from "@/sanity.types";

interface ProductGridProps {
  products: FILTER_PRODUCTS_BY_NAME_QUERYResult;
  /**
   * The active category slug from the URL — passed down so ProductCard
   * can show the correct ancestor label on the badge instead of always
   * showing the deepest leaf category title.
   */
  activeCategory?: string;
}

export function ProductGrid({ products, activeCategory }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="min-h-[400px] rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
        <EmptyState
          icon={PackageSearch}
          title="No products found"
          description="Try adjusting your search or filters to find what you're looking for"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-5 @md:grid-cols-2 @xl:grid-cols-3 @6xl:grid-cols-4 @md:gap-6 @xl:gap-7">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            activeCategory={activeCategory}
          />
        ))}
      </div>
    </div>
  );
}