"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  COLORS,
  MATERIALS,
  SORT_OPTIONS,
  CONDITIONS,
  CATEGORIES_WITH_CONDITIONS,
  CATEGORIES_WITH_BRANDS,
} from "@/lib/constants/filters";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.types";

const PRICE_MIN = 50000;
const PRICE_MAX = 8000000;

interface ProductFiltersProps {
  categories: ALL_CATEGORIES_QUERYResult;
  /** Server-fetched brands for current category */
  brands?: { title: string; slug: string }[];
  /** Server-fetched models for selected brand */
  models?: { title: string; slug: string }[];
}

export function ProductFilters({
  categories,
  brands = [],
  models = [],
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentCondition = searchParams.get("condition") ?? "";
  const currentBrand = searchParams.get("brand") ?? "";
  const currentColor = searchParams.get("color") ?? "";
  const currentMaterial = searchParams.get("material") ?? "";
  const currentSort = searchParams.get("sort") ?? "name";

  const urlMinPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : PRICE_MIN;
  const urlMaxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : PRICE_MAX;
  const currentInStock = searchParams.get("inStock") === "true";

  const [priceRange, setPriceRange] = useState<[number, number]>([
    urlMinPrice,
    urlMaxPrice,
  ]);

  useEffect(() => {
    setPriceRange([urlMinPrice, urlMaxPrice]);
  }, [urlMinPrice, urlMaxPrice]);

  // ── Show/hide logic ────────────────────────────────────────────
  const showCondition = (
    CATEGORIES_WITH_CONDITIONS as readonly string[]
  ).includes(currentCategory);

  const showBrand =
    showCondition &&
    (CATEGORIES_WITH_BRANDS as readonly string[]).includes(currentCategory) &&
    brands.length > 0;

  const showModel = showBrand && !!currentBrand && models.length > 0;

  // ── Active states ──────────────────────────────────────────────
  const isSearchActive = !!currentSearch;
  const isCategoryActive = !!currentCategory;
  const isConditionActive = !!currentCondition;
  const isBrandActive = !!currentBrand;
  const currentModel = searchParams.get("model") ?? "";
  const isModelActive = !!currentModel;
  const isColorActive = !!currentColor;
  const isMaterialActive = !!currentMaterial;
  const isPriceActive =
    searchParams.has("minPrice") || searchParams.has("maxPrice");
  const isInStockActive = currentInStock;

  const activeFilters = [
    isSearchActive,
    isCategoryActive,
    isConditionActive,
    isBrandActive,
    isModelActive,
    isColorActive,
    isMaterialActive,
    isPriceActive,
    isInStockActive,
  ].filter(Boolean);

  const hasActiveFilters = activeFilters.length > 0;

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateParams({ q: (formData.get("search") as string) || null });
  };

  const handleClearFilters = () => router.push("/", { scroll: false });

  const clearSingleFilter = (key: string) => {
    if (key === "price") {
      updateParams({ minPrice: null, maxPrice: null });
    } else if (key === "brand") {
      updateParams({ brand: null, model: null });
    } else if (key === "condition") {
      updateParams({ condition: null, brand: null });
    } else {
      updateParams({ [key]: null });
    }
  };

  // Top-level only
  const topLevelCategories = categories.filter((c) => !(c as any).parentSlug);

  const FilterLabel = ({
    children,
    isActive,
    filterKey,
  }: {
    children: React.ReactNode;
    isActive: boolean;
    filterKey: string;
  }) => (
    <div className="mb-2 flex items-center justify-between">
      <span
        className={`block text-sm font-medium ${
          isActive ? "text-zinc-100" : "text-zinc-300"
        }`}
      >
        {children}
        {isActive && (
          <Badge className="ml-2 h-5 bg-amber-500 px-1.5 text-xs text-white hover:bg-amber-500">
            Active
          </Badge>
        )}
      </span>
      {isActive && (
        <button
          type="button"
          onClick={() => clearSingleFilter(filterKey)}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-500/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-amber-300">
              {activeFilters.length}{" "}
              {activeFilters.length === 1 ? "filter" : "filters"} applied
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleClearFilters}
            className="w-full bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400"
          >
            <X className="mr-2 h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Search */}
      <div>
        <FilterLabel isActive={isSearchActive} filterKey="q">
          Search
        </FilterLabel>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            name="search"
            placeholder="Search products..."
            defaultValue={currentSearch}
            className={`flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 ${
              isSearchActive ? "border-amber-500 ring-1 ring-amber-500" : ""
            }`}
          />
          <Button type="submit" size="sm" className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
            Go
          </Button>
        </form>
      </div>

      {/* Category */}
      <div>
        <FilterLabel isActive={isCategoryActive} filterKey="category">
          Category
        </FilterLabel>
        <Select
          value={currentCategory || "all"}
          onValueChange={(value) =>
            updateParams({
              category: value === "all" ? null : value,
              condition: null,
              brand: null,
            })
          }
        >
          <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${isCategoryActive ? "border-amber-500 ring-1 ring-amber-500" : ""}`}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">All Categories</SelectItem>
            {topLevelCategories.map((cat) => (
              <SelectItem key={cat._id} value={cat.slug ?? ""} className="text-zinc-100">
                {cat.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition — only for laptop/MacBook categories */}
      {showCondition && (
        <div>
          <FilterLabel isActive={isConditionActive} filterKey="condition">
            Condition
          </FilterLabel>
          <Select
            value={currentCondition || "all"}
            onValueChange={(value) =>
              updateParams({
                condition: value === "all" ? null : value,
                brand: null,
              })
            }
          >
            <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${isConditionActive ? "border-amber-500 ring-1 ring-amber-500" : ""}`}>
              <SelectValue placeholder="Any Condition" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-zinc-100">Any Condition</SelectItem>
              {CONDITIONS.map((cond) => (
                <SelectItem key={cond.value} value={cond.value} className="text-zinc-100">
                  {cond.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Brand — only when brands available */}
      {showBrand && (
        <div>
          <FilterLabel isActive={isBrandActive} filterKey="brand">
            Brand
          </FilterLabel>
          <Select
            value={currentBrand || "all"}
            onValueChange={(value) =>
              updateParams({ brand: value === "all" ? null : value })
            }
          >
            <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${isBrandActive ? "border-amber-500 ring-1 ring-amber-500" : ""}`}>
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-zinc-100">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.slug} value={brand.slug} className="text-zinc-100">
                  {brand.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Model */}
      {showModel && (
        <div>
          <FilterLabel isActive={isModelActive} filterKey="model">
            Model
          </FilterLabel>
          <Select
            value={currentModel || "all"}
            onValueChange={(value) =>
              updateParams({ model: value === "all" ? null : value })
            }
          >
            <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${isModelActive ? "border-amber-500 ring-1 ring-amber-500" : ""}`}>
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-zinc-100">All Models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.slug} value={model.slug} className="text-zinc-100">
                  {model.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Color */}
      <div>
        <FilterLabel isActive={isColorActive} filterKey="color">
          Color
        </FilterLabel>
        <Select
          value={currentColor || "all"}
          onValueChange={(value) =>
            updateParams({ color: value === "all" ? null : value })
          }
        >
          <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${isColorActive ? "border-amber-500 ring-1 ring-amber-500" : ""}`}>
            <SelectValue placeholder="All Colors" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">All Colors</SelectItem>
            {COLORS.map((color) => (
              <SelectItem key={color.value} value={color.value} className="text-zinc-100">
                {color.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Material */}
      <div>
        <FilterLabel isActive={isMaterialActive} filterKey="material">
          Material
        </FilterLabel>
        <Select
          value={currentMaterial || "all"}
          onValueChange={(value) =>
            updateParams({ material: value === "all" ? null : value })
          }
        >
          <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${isMaterialActive ? "border-amber-500 ring-1 ring-amber-500" : ""}`}>
            <SelectValue placeholder="All Materials" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">All Materials</SelectItem>
            {MATERIALS.map((mat) => (
              <SelectItem key={mat.value} value={mat.value} className="text-zinc-100">
                {mat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <FilterLabel isActive={isPriceActive} filterKey="price">
          Price: ₦{priceRange[0].toLocaleString()} — ₦{priceRange[1].toLocaleString()}
        </FilterLabel>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={10000}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          onValueCommit={([min, max]) =>
            updateParams({
              minPrice: min > PRICE_MIN ? min : null,
              maxPrice: max < PRICE_MAX ? max : null,
            })
          }
          className="mt-4"
        />
      </div>

      {/* In Stock */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) =>
              updateParams({ inStock: e.target.checked ? "true" : null })
            }
            className="h-5 w-5 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
          />
          <span className={`text-sm font-medium ${isInStockActive ? "text-zinc-100" : "text-zinc-300"}`}>
            In stock only
            {isInStockActive && (
              <Badge className="ml-2 h-5 bg-amber-500 px-1.5 text-xs text-white hover:bg-amber-500">
                Active
              </Badge>
            )}
          </span>
        </label>
      </div>

      {/* Sort */}
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-300">
          Sort By
        </span>
        <Select
          value={currentSort}
          onValueChange={(value) => updateParams({ sort: value })}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-zinc-100">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}