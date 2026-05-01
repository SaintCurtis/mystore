"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
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

  // Blink only when no filters are active — draws attention to the button
  const shouldBlink = activeFilterCount === 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Blink keyframe injection */}
      <style>{`
        @keyframes filterPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
        }
        .filter-btn-pulse {
          animation: filterPulse 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-[#a3a3a3]">
          <span className="font-semibold text-zinc-800 dark:text-[#f1f1f1]">
            {products.length}
          </span>{" "}
          {products.length === 1 ? "product" : "products"}
          {searchQuery && (
            <span>
              {" "}for &ldquo;
              <span className="font-medium text-zinc-800 dark:text-[#f1f1f1]">
                {searchQuery}
              </span>
              &rdquo;
            </span>
          )}
        </p>

        <div className="flex items-center gap-2">

          {/* ── Mobile filter button — bold + blinking ── */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className={`
              lg:hidden relative flex items-center gap-2 h-10 px-4 rounded-xl
              font-bold text-sm transition-all duration-150
              ${activeFilterCount > 0
                ? "bg-amber-500 text-zinc-950 border border-amber-500 shadow-md shadow-amber-500/30"
                : "bg-amber-500 text-zinc-950 border-2 border-amber-400 shadow-lg shadow-amber-500/40"
              }
              ${shouldBlink ? "filter-btn-pulse" : ""}
              active:scale-95
            `}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span>
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
            </span>
            {/* Blinking dot indicator when no filters active */}
            {shouldBlink && (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-950 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-950" />
              </span>
            )}
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-black text-amber-400">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* ── Desktop filter toggle ── */}
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
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
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
        <aside className={`hidden lg:block shrink-0 transition-all duration-300 ${
          filtersOpen ? "w-72" : "w-0 overflow-hidden opacity-0"
        }`}>
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