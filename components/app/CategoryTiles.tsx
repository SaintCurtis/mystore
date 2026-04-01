"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { Grid2x2, ChevronRight } from "lucide-react";
import {
  CONDITIONS,
  CATEGORIES_WITH_BRANDS,
  CATEGORIES_WITH_CONDITIONS,
  CATEGORIES_WITH_SUBCATEGORY_DROPDOWN,
} from "@/lib/constants/filters";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.types";

interface CategoryTilesProps {
  categories: ALL_CATEGORIES_QUERYResult;
  activeCategory?: string;
  activeCondition?: string;
  activeBrand?: string;
  brandsMap?: Record<string, { title: string; slug: string }[]>;
}

function buildHref(params: {
  category?: string;
  condition?: string;
  brand?: string;
}) {
  const p = new URLSearchParams();
  if (params.category) p.set("category", params.category);
  if (params.condition) p.set("condition", params.condition);
  if (params.brand) p.set("brand", params.brand);
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

function categoryHasConditions(slug: string): boolean {
  return (CATEGORIES_WITH_CONDITIONS as readonly string[]).includes(slug);
}

function categoryHasBrands(slug: string): boolean {
  return (CATEGORIES_WITH_BRANDS as readonly string[]).includes(slug);
}

function categoryHasSubcategoryDropdown(slug: string): boolean {
  return (CATEGORIES_WITH_SUBCATEGORY_DROPDOWN as readonly string[]).includes(slug);
}

// ── Subcategory list dropdown (Computers, Accessories, Tech Setup Gears etc) ─

function SubcategoryDropdown({
  parentSlug,
  allCategories,
  activeCategory,
}: {
  parentSlug: string;
  allCategories: ALL_CATEGORIES_QUERYResult;
  activeCategory?: string;
}) {
  const children = allCategories.filter(
    (c) => (c as any).parentSlug === parentSlug,
  );

  if (children.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-1 w-56 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-zinc-950/60">
      {children.map((child) => {
        const isActive = activeCategory === child.slug;
        return (
          <Link
            key={child._id}
            href={`/?category=${child.slug}`}
            className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
              isActive
                ? "bg-amber-500/15 text-amber-400"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <span className="font-medium">{child.title}</span>
            {/* Show chevron hint if this child also has conditions */}
            {categoryHasConditions(child.slug ?? "") && (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            )}
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ── Condition dropdown (Gaming Laptops, Regular Laptops, MacBook, Monitors) ──

function ConditionDropdown({
  categorySlug,
  activeCondition,
  activeBrand,
  brands = [],
}: {
  categorySlug: string;
  activeCondition?: string;
  activeBrand?: string;
  brands?: { title: string; slug: string }[];
}) {
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);
  const hasBrands = categoryHasBrands(categorySlug);

  return (
    <div className="absolute bottom-full left-0 z-50 mb-1 w-52 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-zinc-950/60">
      {CONDITIONS.map((cond) => {
        const isActive = activeCondition === cond.value;
        const showBrandSub =
          hasBrands && hoveredCondition === cond.value && (brands?.length ?? 0) > 0;

        return (
          <div
            key={cond.value}
            className="relative"
            onMouseEnter={() => setHoveredCondition(cond.value)}
            onMouseLeave={() => setHoveredCondition(null)}
          >
            <Link
              href={buildHref({ category: categorySlug, condition: cond.value })}
              className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span className="font-medium">{cond.label}</span>
              {hasBrands && (brands?.length ?? 0) > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
              )}
            </Link>

            {/* Brand sub-dropdown */}
            {showBrandSub && (
              <div className="absolute bottom-0 left-full z-50 ml-1 w-44 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-zinc-950/60">
                {brands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={buildHref({
                      category: categorySlug,
                      condition: cond.value,
                      brand: brand.slug,
                    })}
                    className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    {brand.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Single Tile ─────────────────────────────────────────────────────────────

function CategoryTile({
  category,
  isActive,
  activeCategory,
  activeCondition,
  activeBrand,
  brands = [],
  allCategories,
}: {
  category: ALL_CATEGORIES_QUERYResult[number];
  isActive: boolean;
  activeCategory?: string;
  activeCondition?: string;
  activeBrand?: string;
  brands?: { title: string; slug: string }[];
  allCategories: ALL_CATEGORIES_QUERYResult;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageUrl = category.image?.asset?.url;
  const slug = category.slug ?? "";

  const showsConditionDropdown = categoryHasConditions(slug);
  const showsSubcategoryDropdown = !showsConditionDropdown && categoryHasSubcategoryDropdown(slug);
  const showDropdown = showsConditionDropdown || showsSubcategoryDropdown;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={`/?category=${slug}`}
        className={`group relative block overflow-hidden rounded-xl transition-all duration-300 ${
          isActive
            ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950"
            : "hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950"
        }`}
      >
        <div className="relative h-32 w-44 sm:h-48 sm:w-64">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={category.title ?? "Category"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-amber-500 to-orange-600" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white drop-shadow-md">
                {category.title}
              </span>
              {showDropdown && (
                <ChevronRight
                  className={`h-3.5 w-3.5 text-white/70 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-90" : ""
                  }`}
                />
              )}
            </div>
          </div>
          {isActive && (
            <div className="absolute top-2 right-2">
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Condition dropdown — Gaming Laptops, Regular Laptops, MacBook, Monitors */}
      {showsConditionDropdown && dropdownOpen && (
        <ConditionDropdown
          categorySlug={slug}
          activeCondition={activeCondition}
          activeBrand={activeBrand}
          brands={brands}
        />
      )}

      {/* Subcategory list — Computers, Accessories, Tech Setup Gears, Monitors, Content Creation */}
      {showsSubcategoryDropdown && dropdownOpen && (
        <SubcategoryDropdown
          parentSlug={slug}
          allCategories={allCategories}
          activeCategory={activeCategory}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function CategoryTiles({
  categories,
  activeCategory,
  activeCondition,
  activeBrand,
  brandsMap = {},
}: CategoryTilesProps) {
  // Only show top-level categories (no parent) in the tile row
  const topLevel = categories.filter((c) => !(c as any).parentSlug);

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto py-4 pl-8 pr-4 sm:pl-12 sm:pr-6 lg:pl-10 lg:pr-8 scrollbar-hide">
        {/* All Products tile */}
        <Link
          href="/"
          className={`group relative shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
            !activeCategory
              ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950"
              : "hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950"
          }`}
        >
          <div className="relative h-32 w-44 sm:h-48 sm:w-64">
            <div className="absolute inset-0 bg-linear-to-br from-zinc-800 to-zinc-900" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Grid2x2 className="h-10 w-10 text-white/50 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <span className="text-sm font-semibold text-white">
                All Products
              </span>
            </div>
          </div>
        </Link>

        {/* Category tiles — top level only */}
        {topLevel.map((category) => (
          <CategoryTile
            key={category._id}
            category={category}
            isActive={activeCategory === category.slug}
            activeCategory={activeCategory}
            activeCondition={activeCondition}
            activeBrand={activeBrand}
            brands={brandsMap[category.slug ?? ""] ?? []}
            allCategories={categories}
          />
        ))}
      </div>
    </div>
  );
}