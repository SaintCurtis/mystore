"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import type {
  ALL_CATEGORIES_QUERYResult,
  FILTER_PRODUCTS_BY_NAME_QUERYResult,
} from "@/sanity.types";

interface ProductSectionProps {
  categories: ALL_CATEGORIES_QUERYResult;
  products: FILTER_PRODUCTS_BY_NAME_QUERYResult;
  searchQuery: string;
  brands?: { title: string; slug: string }[];
  models?: { title: string; slug: string }[];
}

export function ProductSection({
  categories,
  products,
  searchQuery,
  brands = [],
  models = [],
}: ProductSectionProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);

  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? undefined;
  const hasActiveFilters =
    !!activeCategory ||
    !!searchQuery ||
    !!searchParams.get("condition") ||
    !!searchParams.get("brand") ||
    !!searchParams.get("color") ||
    !!searchParams.get("material") ||
    !!searchParams.get("minPrice") ||
    !!searchParams.get("maxPrice");

  // Only limit on the homepage (no filters, no search)
  const limitOnHomepage = !hasActiveFilters;

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-[#a3a3a3]">
          {products.length}{" "}
          {products.length === 1 ? "product" : "products"} found
          {searchQuery && (
            <span>
              {" "}for &quot;
              <span className="font-medium text-zinc-800 dark:text-[#f1f1f1]">
                {searchQuery}
              </span>
              &quot;
            </span>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`
            flex items-center gap-2 transition-all duration-200
            border-zinc-200 dark:border-[#2a2a2a]
            bg-white dark:bg-[#111111]
            text-zinc-600 dark:text-[#a3a3a3]
            hover:border-zinc-400 dark:hover:border-[#3a3a3a]
            hover:bg-zinc-50 dark:hover:bg-[#1a1a1a]
            hover:text-zinc-900 dark:hover:text-[#f1f1f1]
          `}
        >
          {filtersOpen ? (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="hidden sm:inline">Hide Filters</span>
              <span className="sm:hidden">Hide</span>
            </>
          ) : (
            <>
              <PanelLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Show Filters</span>
              <span className="sm:hidden">Filters</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out ${
            filtersOpen ? "w-full lg:w-72" : "hidden"
          }`}
        >
          <ProductFilters categories={categories} brands={brands} models={models} />
        </aside>
        <main className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            activeCategory={activeCategory}
            limitOnHomepage={limitOnHomepage}
          />
        </main>
      </div>
    </div>
  );
}