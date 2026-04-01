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

function pluralize(word: string): string {
  if (word.toLowerCase().endsWith("y")) return word.slice(0, -1) + "ies";
  return word + "s";
}

// Root categories that use cascading subcategory selects
const DRILLDOWN_ROOTS = [
  "monitors",
  "content-creation-tools",
  "computers",
  "accessories",
  "tech-setup-gears"
] as const;
type DrilldownRoot = (typeof DRILLDOWN_ROOTS)[number];

function isDrilldownRoot(slug: string): slug is DrilldownRoot {
  return (DRILLDOWN_ROOTS as readonly string[]).includes(slug);
}

// Labels for each drilldown level per root category
const DRILLDOWN_LABELS: Record<DrilldownRoot, string[]> = {
  monitors: ["Type", "Condition", "Panel Type"],
  "content-creation-tools": ["Category", "Sub-category"],
  // computers: Type → Condition only via drilldown.
  // Brand + Model appear separately below via existing CATEGORIES_WITH_BRANDS logic
  // once the user lands on a condition-level slug (e.g. gaming-laptops-brand-new)
  computers: ["Type", "Condition"],
  accessories: ["Type"],
  "tech-setup-gears": ["Category"],
};

interface ProductFiltersProps {
  categories: ALL_CATEGORIES_QUERYResult;
  brands?: { title: string; slug: string }[];
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
  const currentModel = searchParams.get("model") ?? "";

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

  // ── Drilldown logic ────────────────────────────────────────────
  type FlatCat = ALL_CATEGORIES_QUERYResult[number] & {
    parentSlug?: string | null;
  };

  function findDrilldownRoot(catSlug: string): DrilldownRoot | null {
    if (!catSlug) return null;
    if (isDrilldownRoot(catSlug)) return catSlug;
    let current = (categories as FlatCat[]).find((c) => c.slug === catSlug);
    while (current) {
      const parentSlug = (current as FlatCat).parentSlug;
      if (!parentSlug) break;
      if (isDrilldownRoot(parentSlug)) return parentSlug;
      current = (categories as FlatCat[]).find((c) => c.slug === parentSlug);
    }
    return null;
  }

  function getSelectionChain(catSlug: string, rootSlug: string): string[] {
    if (!catSlug || catSlug === rootSlug) return [];
    const chain: string[] = [];
    let current = (categories as FlatCat[]).find((c) => c.slug === catSlug);
    while (current && current.slug !== rootSlug) {
      chain.unshift(current.slug ?? "");
      const parentSlug = (current as FlatCat).parentSlug;
      if (!parentSlug) break;
      current = (categories as FlatCat[]).find((c) => c.slug === parentSlug);
    }
    return chain.filter(Boolean);
  }

  function getChildren(parentSlug: string) {
    return (categories as FlatCat[])
      .filter((c) => (c as FlatCat).parentSlug === parentSlug)
      .sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0));
  }

  const drilldownRoot = findDrilldownRoot(currentCategory);
  const selectionChain = drilldownRoot
    ? getSelectionChain(currentCategory, drilldownRoot)
    : [];

  function getDrilldownLevels(): {
    parentSlug: string;
    selectedSlug: string;
    label: string;
  }[] {
    if (!drilldownRoot) return [];
    const labels = DRILLDOWN_LABELS[drilldownRoot];
    const levels: {
      parentSlug: string;
      selectedSlug: string;
      label: string;
    }[] = [];

    levels.push({
      parentSlug: drilldownRoot,
      selectedSlug: selectionChain[0] ?? "",
      label: labels[0] ?? "Type",
    });

    for (let i = 0; i < selectionChain.length; i++) {
      const selected = selectionChain[i];
      if (!selected) break;
      const children = getChildren(selected);
      if (children.length === 0) break;
      // For computers: stop drilldown after condition level (depth 2).
      // Brand/Model are handled separately below via CATEGORIES_WITH_BRANDS.
      if (drilldownRoot === "computers" && i >= labels.length - 1) break;
      levels.push({
        parentSlug: selected,
        selectedSlug: selectionChain[i + 1] ?? "",
        label: labels[i + 1] ?? `Level ${i + 2}`,
      });
    }

    return levels;
  }

  const drilldownLevels = getDrilldownLevels();

  function handleDrilldownChange(levelIndex: number, newSlug: string) {
    const target = newSlug || drilldownRoot || "";
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", target);
    params.delete("condition");
    params.delete("brand");
    params.delete("model");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  // ── Brand / Model logic ────────────────────────────────────────
  // For non-drilldown categories AND for computers once a condition-
  // level slug is active (e.g. gaming-laptops-brand-new which is in
  // CATEGORIES_WITH_BRANDS).
  const showCondition =
    !drilldownRoot &&
    (CATEGORIES_WITH_CONDITIONS as readonly string[]).includes(currentCategory);

  // Show brand when:
  // a) old flow: condition is selected for a non-drilldown category, OR
  // b) computers drilldown: the current category slug itself is in CATEGORIES_WITH_BRANDS
  //    (meaning user has drilled down to e.g. "gaming-laptops-brand-new")
  // For computers drilldown: check if the current slug OR any of its ancestors
// is in CATEGORIES_WITH_BRANDS (e.g. gaming-laptops-brand-new → parent is gaming-laptops)
function isAncestorInBrands(catSlug: string): boolean {
  let current = (categories as FlatCat[]).find((c) => c.slug === catSlug);
  while (current) {
    if ((CATEGORIES_WITH_BRANDS as readonly string[]).includes(current.slug ?? "")) return true;
    const parentSlug = (current as FlatCat).parentSlug;
    if (!parentSlug) break;
    current = (categories as FlatCat[]).find((c) => c.slug === parentSlug);
  }
  return false;
}

const showBrand =
  brands.length > 0 &&
  (
    (showCondition && (CATEGORIES_WITH_BRANDS as readonly string[]).includes(currentCategory)) ||
    (drilldownRoot === "computers" && isAncestorInBrands(currentCategory))
  );

  const showModel = showBrand && !!currentBrand && models.length > 0;

  // ── Active states ──────────────────────────────────────────────
  const isSearchActive = !!currentSearch;
  const isCategoryActive = !!currentCategory;
  const isConditionActive = !!currentCondition;
  const isBrandActive = !!currentBrand;
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
    } else if (key === "drilldown") {
      updateParams({ category: drilldownRoot ?? null });
    } else {
      updateParams({ [key]: null });
    }
  };

  const topLevelCategories = (categories as FlatCat[]).filter(
    (c) => !c.parentSlug,
  );

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
          <Button
            type="submit"
            size="sm"
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
          >
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
          value={drilldownRoot ?? (currentCategory || "all")}
          onValueChange={(value) =>
            updateParams({
              category: value === "all" ? null : value,
              condition: null,
              brand: null,
              model: null,
            })
          }
        >
          <SelectTrigger
            className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${
              isCategoryActive ? "border-amber-500 ring-1 ring-amber-500" : ""
            }`}
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">
              All Categories
            </SelectItem>
            {topLevelCategories.map((cat) => (
              <SelectItem
                key={cat._id}
                value={cat.slug ?? ""}
                className="text-zinc-100"
              >
                {cat.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Drilldown selects ──────────────────────────────────── */}
      {drilldownRoot &&
        drilldownLevels.map((level, i) => {
          const options = getChildren(level.parentSlug);
          if (options.length === 0) return null;
          const isActive = !!level.selectedSlug;

          return (
            <div key={level.parentSlug}>
              <FilterLabel
                isActive={isActive && i === drilldownLevels.length - 1}
                filterKey="drilldown"
              >
                {level.label}
              </FilterLabel>
              <Select
                value={level.selectedSlug || "all"}
                onValueChange={(value) =>
                  handleDrilldownChange(i, value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${
                    isActive ? "border-amber-500 ring-1 ring-amber-500" : ""
                  }`}
                >
                  <SelectValue placeholder={`All ${pluralize(level.label)}`} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-100">
                    All {pluralize(level.label)}
                  </SelectItem>
                  {options.map((opt) => (
                    <SelectItem
                      key={opt._id}
                      value={opt.slug ?? ""}
                      className="text-zinc-100"
                    >
                      {opt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}

      {/* Condition — only for non-drilldown categories (e.g. standalone gaming-laptops tile) */}
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
            <SelectTrigger
              className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${
                isConditionActive
                  ? "border-amber-500 ring-1 ring-amber-500"
                  : ""
              }`}
            >
              <SelectValue placeholder="Any Condition" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-zinc-100">
                Any Condition
              </SelectItem>
              {CONDITIONS.map((cond) => (
                <SelectItem
                  key={cond.value}
                  value={cond.value}
                  className="text-zinc-100"
                >
                  {cond.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Brand — shown for both old flow and computers drilldown */}
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
            <SelectTrigger
              className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${
                isBrandActive ? "border-amber-500 ring-1 ring-amber-500" : ""
              }`}
            >
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-zinc-100">
                All Brands
              </SelectItem>
              {brands.map((brand) => (
                <SelectItem
                  key={brand.slug}
                  value={brand.slug}
                  className="text-zinc-100"
                >
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
            <SelectTrigger
              className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${
                isModelActive ? "border-amber-500 ring-1 ring-amber-500" : ""
              }`}
            >
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-zinc-100">
                All Models
              </SelectItem>
              {models.map((model) => (
                <SelectItem
                  key={model.slug}
                  value={model.slug}
                  className="text-zinc-100"
                >
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
          <SelectTrigger
            className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${
              isColorActive ? "border-amber-500 ring-1 ring-amber-500" : ""
            }`}
          >
            <SelectValue placeholder="All Colors" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">
              All Colors
            </SelectItem>
            {COLORS.map((color) => (
              <SelectItem
                key={color.value}
                value={color.value}
                className="text-zinc-100"
              >
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
          <SelectTrigger
            className={`bg-zinc-800 border-zinc-700 text-zinc-100 ${
              isMaterialActive ? "border-amber-500 ring-1 ring-amber-500" : ""
            }`}
          >
            <SelectValue placeholder="All Materials" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">
              All Materials
            </SelectItem>
            {MATERIALS.map((mat) => (
              <SelectItem
                key={mat.value}
                value={mat.value}
                className="text-zinc-100"
              >
                {mat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <FilterLabel isActive={isPriceActive} filterKey="price">
          Price: ₦{priceRange[0].toLocaleString()} — ₦
          {priceRange[1].toLocaleString()}
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
          <span
            className={`text-sm font-medium ${
              isInStockActive ? "text-zinc-100" : "text-zinc-300"
            }`}
          >
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
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-zinc-100"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}