"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Check } from "lucide-react";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

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

  const openMobileFilters = () => {
    setMobileFiltersOpen(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setSheetVisible(true))
    );
  };

  const closeMobileFilters = () => {
    setSheetVisible(false);
    setTimeout(() => setMobileFiltersOpen(false), 320);
  };

  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileFiltersOpen]);

  return (
    <div className="flex flex-col gap-4">

      <style>{`
        @keyframes filterPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.55); }
          50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
        }
        .filter-cta-pulse { animation: filterPulse 2s ease-in-out infinite; }

        @keyframes filterShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .filter-cta-shimmer {
          background-size: 200% auto;
          animation: filterShimmer 3s linear infinite;
        }
      `}</style>

      {/* ── Product count ── */}
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

      {/* ── Mobile filter CTA — full width, centered ──────────────────────
          Two states:
          IDLE   → amber gradient shimmer + pulse ring + "Find Your Perfect Product"
          ACTIVE → solid amber + filter count badge + X quick-clear button

          Height 56px (h-14), rounded-2xl, bold 16px text — commands attention
          without being aggressive. The shimmer and pulse stop the moment a
          filter is applied so the animation only runs when it's actually useful.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {activeFilterCount === 0 ? (
          <button
            type="button"
            onClick={openMobileFilters}
            className="filter-cta-pulse filter-cta-shimmer relative w-full h-14 rounded-2xl font-bold text-base text-zinc-950 active:scale-[0.98] transition-transform duration-150 overflow-hidden"
            style={{
              background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 40%, #f97316 60%, #f59e0b 100%)",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2.5} />
              <span className="tracking-wide">Find Your Perfect Product</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-950 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-zinc-950 opacity-60" />
              </span>
            </span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openMobileFilters}
              className="relative flex-1 h-14 rounded-2xl bg-amber-500 font-bold text-base text-zinc-950 shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-transform duration-150"
            >
              <span className="flex items-center justify-center gap-3">
                <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                <span className="tracking-wide">
                  {activeFilterCount === 1
                    ? "1 Filter Active"
                    : `${activeFilterCount} Filters Active`}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-black text-amber-400">
                  {activeFilterCount}
                </span>
              </span>
            </button>

            {/* Quick-clear — appears only when filters are active */}
            <button
              type="button"
              onClick={() => { window.location.href = "/"; }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 active:scale-95 transition-transform duration-150"
              aria-label="Clear all filters"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* ── Desktop top bar ── */}
      <div className="hidden lg:flex items-center justify-between gap-3">
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 h-9 px-3
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

      {/* ── Mobile filter bottom sheet ── */}
      {mobileFiltersOpen && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity duration-300 ${
              sheetVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMobileFilters}
          />

          <div
            className={`
              fixed inset-x-0 bottom-0 z-50 lg:hidden
              flex flex-col
              bg-white dark:bg-[#0f0f0f]
              rounded-t-2xl shadow-2xl
              max-h-[85dvh]
              transition-transform duration-300 ease-out
              ${sheetVisible ? "translate-y-0" : "translate-y-full"}
            `}
          >
            <div className="shrink-0">
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#1a1a1a] px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Filters</p>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeMobileFilters}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-500 dark:text-[#a3a3a3]"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-2">
              <ProductFilters categories={categories} brands={brands} models={models} />
            </div>

            <div className="shrink-0 border-t border-zinc-100 dark:border-[#1a1a1a] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={closeMobileFilters}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:bg-amber-400 active:scale-[0.98] transition-all duration-150"
              >
                <Check className="h-4 w-4" />
                {activeFilterCount > 0
                  ? `Show ${products.length} ${products.length === 1 ? "product" : "products"}`
                  : "Done"
                }
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Desktop layout ── */}
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