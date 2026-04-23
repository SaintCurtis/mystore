"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import type {
  ALL_CATEGORIES_QUERY_RESULT,
  FILTER_PRODUCTS_BY_NAME_QUERY_RESULT,
} from "@/sanity.types";

interface ProductSectionProps {
  categories: ALL_CATEGORIES_QUERY_RESULT;
  products: FILTER_PRODUCTS_BY_NAME_QUERY_RESULT;
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
  // Desktop: filters open by default
  // Mobile: filters hidden by default (drawer style)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  const limitOnHomepage = !hasActiveFilters;

  const activeFilterCount = [
    activeCategory,
    searchParams.get("condition"),
    searchParams.get("brand"),
    searchParams.get("color"),
    searchParams.get("material"),
    searchParams.get("minPrice"),
    searchParams.get("maxPrice"),
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Top bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-[#a3a3a3]">
          <span className="font-semibold text-zinc-800 dark:text-[#f1f1f1]">
            {products.length}
          </span>{" "}
          {products.length === 1 ? "product" : "products"}
          {searchQuery && (
            <span> for &ldquo;<span className="font-medium text-zinc-800 dark:text-[#f1f1f1]">{searchQuery}</span>&rdquo;</span>
          )}
        </p>

        <div className="flex items-center gap-2">
          {/* Mobile filter button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden relative flex items-center gap-2 h-9 px-3
              border-zinc-200 dark:border-[#2a2a2a]
              bg-white dark:bg-[#111111]
              text-zinc-600 dark:text-[#a3a3a3]
              hover:border-zinc-400 dark:hover:border-[#3a3a3a]
              hover:bg-zinc-50 dark:hover:bg-[#1a1a1a]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Desktop filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="hidden lg:flex items-center gap-2 h-9 px-3
              border-zinc-200 dark:border-[#2a2a2a]
              bg-white dark:bg-[#111111]
              text-zinc-600 dark:text-[#a3a3a3]
              hover:border-zinc-400 dark:hover:border-[#3a3a3a]
              hover:bg-zinc-50 dark:hover:bg-[#1a1a1a]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">
              {filtersOpen ? "Hide Filters" : "Show Filters"}
            </span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── Mobile filter drawer ───────────────────────────────── */}
      {mobileFiltersOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm flex flex-col bg-white dark:bg-[#0f0f0f] shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#1a1a1a] px-4 py-3 shrink-0">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Filters</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-500 dark:text-[#a3a3a3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ProductFilters categories={categories} brands={brands} models={models} />
            </div>
          </div>
        </>
      )}

      {/* ── Desktop layout ─────────────────────────────────────── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Sidebar — desktop only */}
        <aside className={`hidden lg:block shrink-0 transition-all duration-300 ${
          filtersOpen ? "w-72" : "w-0 overflow-hidden opacity-0"
        }`}>
          <ProductFilters categories={categories} brands={brands} models={models} />
        </aside>

        {/* Grid — full width on mobile, flex-1 on desktop */}
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