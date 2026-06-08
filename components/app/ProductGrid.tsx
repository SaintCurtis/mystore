"use client";

import { useState, useMemo } from "react";
import { PackageSearch, ChevronDown } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { FILTER_PRODUCTS_BY_NAME_QUERY_RESULT } from "@/sanity.types";

interface ProductGridProps {
  products: FILTER_PRODUCTS_BY_NAME_QUERY_RESULT;
  activeCategory?: string;
  limitOnHomepage?: boolean;
}

const INITIAL_LIMIT = 12;
const LOAD_MORE_COUNT = 12;

// Category slugs that are considered "laptop/computer priority"
// These always float to the top of the homepage grid
const LAPTOP_SLUGS = [
  "gaming-laptops",
  "regular-laptops",
  "computers",
  "mac",
  "desktops",
  "workstations",
  "custom-pcs",
];

function isLaptopProduct(product: FILTER_PRODUCTS_BY_NAME_QUERY_RESULT[number]): boolean {
  const slug       = (product.category as any)?.slug ?? "";
  const parentSlug = (product.category as any)?.parentSlug ?? "";
  return LAPTOP_SLUGS.includes(slug) || LAPTOP_SLUGS.includes(parentSlug);
}

// Seeded shuffle — same seed per page load, different every visit.
// We use Math.random() once at module load as the seed so the order
// is stable while the user scrolls / loads more, but changes on refresh.
const PAGE_SEED = Math.random();

function seededShuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  // Mulberry32 PRNG — fast, good distribution
  let s = (PAGE_SEED * 0xffffffff) >>> 0;
  const rand = () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ProductGrid({
  products,
  activeCategory,
  limitOnHomepage = false,
}: ProductGridProps) {
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT);

  // ── Sort logic — only applied on homepage (limitOnHomepage = true) ──────
  // When a filter/category is active, respect the query's natural order.
  // On the unfiltered homepage: laptops first (shuffled among themselves),
  // then everything else (also shuffled). Result is stable per page load
  // but different on every refresh — feels alive, laptops always lead.
  const orderedProducts = useMemo(() => {
    if (!limitOnHomepage) return products;

    const laptops = seededShuffle(products.filter(isLaptopProduct));
    const others  = seededShuffle(products.filter((p) => !isLaptopProduct(p)));
    return [...laptops, ...others];
  }, [products, limitOnHomepage]);

  if (orderedProducts.length === 0) {
    return (
      <div className="min-h-[400px] rounded-2xl border border-dashed border-zinc-200 dark:border-[#1f1f1f] bg-zinc-50 dark:bg-[#0d0d0d]">
        <EmptyState
          icon={PackageSearch}
          title="No products found"
          description="Try adjusting your search or filters"
          size="lg"
        />
      </div>
    );
  }

  const visibleProducts = limitOnHomepage
    ? orderedProducts.slice(0, displayLimit)
    : orderedProducts;

  const hasMore    = limitOnHomepage && displayLimit < orderedProducts.length;
  const remaining  = orderedProducts.length - displayLimit;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            activeCategory={activeCategory}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setDisplayLimit((prev) => prev + LOAD_MORE_COUNT)}
            className="
              group h-12 min-w-[200px] gap-2 font-semibold transition-all duration-200
              border-zinc-300 dark:border-[#2a2a2a]
              bg-white dark:bg-[#111111]
              text-zinc-700 dark:text-[#a3a3a3]
              hover:border-amber-500/50 dark:hover:border-amber-500/40
              hover:bg-amber-50 dark:hover:bg-[#1a1a1a]
              hover:text-amber-700 dark:hover:text-amber-400
            "
          >
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            Load More
            <span className="rounded-full bg-zinc-100 dark:bg-[#1a1a1a] px-2 py-0.5 text-xs font-medium">
              {remaining} more
            </span>
          </Button>
          <p className="text-xs text-zinc-400 dark:text-[#555]">
            Showing {Math.min(displayLimit, orderedProducts.length)} of {orderedProducts.length} products
          </p>
        </div>
      )}

      {limitOnHomepage && !hasMore && orderedProducts.length > INITIAL_LIMIT && (
        <p className="text-center text-xs text-zinc-400 dark:text-[#555]">
          All {orderedProducts.length} products shown
        </p>
      )}
    </div>
  );
}