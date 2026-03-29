"use client";

import { useState } from "react";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">
          {products.length} {products.length === 1 ? "product" : "products"} found
          {searchQuery && (
            <span>
              {" "}for &quot;<span className="font-medium text-zinc-200">{searchQuery}</span>&quot;
            </span>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
        <main className="flex-1">
          <ProductGrid products={products} />
        </main>
      </div>
    </div>
  );
}