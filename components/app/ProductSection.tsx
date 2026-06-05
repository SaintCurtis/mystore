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
  // Controls CSS transition: we mount the sheet immediately but animate it in
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

  const shouldBlink = activeFilterCount === 0;

  // Animate the bottom sheet in after mount, out before unmount
  const openMobileFilters = () => {
    setMobileFiltersOpen(true);
    // Defer so the DOM node exists before we trigger the CSS transition
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setSheetVisible(true))
    );
  };

  const closeMobileFilters = () => {
    setSheetVisible(false);
    // Wait for the slide-down animation to finish before unmounting
    setTimeout(() => setMobileFiltersOpen(false), 320);
  };

  // Lock body scroll while sheet is open
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

          {/* ── Mobile filter button ── */}
          <button
            type="button"
            onClick={openMobileFilters}
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

      {/* ── Mobile filter bottom sheet ─────────────────────────────────────
          Bottom sheet is far more thumb-friendly than a side drawer:
          — The thumb's natural resting zone is the bottom 40% of the screen
          — Users don't have to stretch to reach filter controls
          — Swipe-down / tap-backdrop to dismiss feels natural on touch devices

          Architecture:
          • Backdrop + sheet are mounted together (mobileFiltersOpen)
          • CSS transition on `translate-y` gives the slide-up / slide-down animation
          • sheetVisible controls the CSS class; we toggle it with a
            requestAnimationFrame delay on open and a setTimeout delay on close
            so the transition actually fires instead of jumping instantly
          • Body scroll is locked while the sheet is open (useEffect above)
          • "Done" button closes the sheet — clear primary action for mobile users
            who aren't used to tapping outside to dismiss
      ─────────────────────────────────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity duration-300 ${
              sheetVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMobileFilters}
          />

          {/* Bottom sheet */}
          <div
            className={`
              fixed inset-x-0 bottom-0 z-50 lg:hidden
              flex flex-col
              bg-white dark:bg-[#0f0f0f]
              rounded-t-2xl shadow-2xl
              /* Cap the sheet at 85% of viewport height so it never covers the full screen */
              max-h-[85dvh]
              transition-transform duration-300 ease-out
              ${sheetVisible ? "translate-y-0" : "translate-y-full"}
            `}
          >
            {/* Drag handle + header */}
            <div className="shrink-0">
              {/* Visual drag handle pill */}
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

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto p-4 pb-2">
              <ProductFilters categories={categories} brands={brands} models={models} />
            </div>

            {/* Sticky "Done" button — the most important UX addition.
                On mobile, users naturally look at the bottom of a sheet for
                the primary action. Without this, many users don't know how
                to dismiss the sheet after selecting filters. */}
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