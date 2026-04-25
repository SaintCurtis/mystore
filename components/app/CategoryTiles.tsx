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

const CATEGORY_SUBTITLES: Record<string, string> = {
  "computers":              "Laptops, Desktops, Mac Mini",
  "gaming-laptops":         "RTX, High FPS, Budget Picks",
  "regular-laptops":        "Work, School & Everyday Use",
  "accessories":            "Keyboards, Mice, Docks & More",
  "monitors":               "Gaming, Pro & Ultrawide",
  "content-creation-tools": "Cameras, Lights, Microphones",
  "tech-setup-gears":       "Chairs, Desks, LED & Decor",
  "acasis":                 "Docks, Hubs & Enclosures",
  "ecoflow":                "Power Stations & Solar",
  "starlink":               "Satellite Internet Kits",
  "docks-and-hubs":         "USB-C, Thunderbolt, Multi-Port",
  "keyboards":              "Mechanical, Wireless, Gaming",
  "mice":                   "Gaming, Ergonomic, Wireless",
  "headsets":               "Gaming, Studio, Noise-Cancel",
  "webcams":                "HD, 4K & Streaming Cams",
};

interface LooseCategory {
  _id: string;
  title?: string | null;
  slug?: string | null;
  condition?: string | null;
  parentSlug?: string | null;
  image?: { asset?: { url?: string | null } | null } | null;
}

interface CategoryTilesProps {
  categories: LooseCategory[];
  activeCategory?: string;
  activeCondition?: string;
  activeBrand?: string;
  brandsMap?: Record<string, { title: string; slug: string }[]>;
}

function buildHref(params: { category?: string; condition?: string; brand?: string }) {
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

function SubcategoryDropdown({
  parentSlug, allCategories, activeCategory,
}: {
  parentSlug: string;
  allCategories: LooseCategory[];
  activeCategory?: string;
}) {
  const children = allCategories.filter((c) => c.parentSlug === parentSlug);
  if (children.length === 0) return null;
  return (
    <div className="w-56 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-zinc-950/60">
      {children.map((child) => {
        const isActive = activeCategory === child.slug;
        return (
          <Link key={child._id} href={`/?category=${child.slug}`}
            className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
              isActive ? "bg-amber-500/15 text-amber-400" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}>
            <span className="font-medium">{child.title}</span>
            {categoryHasConditions(child.slug ?? "") && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
          </Link>
        );
      })}
    </div>
  );
}

function ConditionDropdown({
  categorySlug, activeCondition, activeBrand, brands = [],
}: {
  categorySlug: string;
  activeCondition?: string;
  activeBrand?: string;
  brands?: { title: string; slug: string }[];
}) {
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);
  const hasBrands = categoryHasBrands(categorySlug);
  return (
    <div className="w-52 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-zinc-950/60">
      {CONDITIONS.map((cond) => {
        const isActive = activeCondition === cond.value;
        const showBrandSub = hasBrands && hoveredCondition === cond.value && brands.length > 0;
        return (
          <div key={cond.value} className="relative"
            onMouseEnter={() => setHoveredCondition(cond.value)}
            onMouseLeave={() => setHoveredCondition(null)}>
            <Link href={buildHref({ category: categorySlug, condition: cond.value })}
              className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                isActive ? "bg-amber-500/15 text-amber-400" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}>
              <span className="font-medium">{cond.label}</span>
              {hasBrands && brands.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />}
            </Link>
            {showBrandSub && (
              <div className="absolute top-0 left-full z-50 ml-1 w-44 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl">
                {brands.map((brand) => (
                  <Link key={brand.slug}
                    href={buildHref({ category: categorySlug, condition: cond.value, brand: brand.slug })}
                    className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white">
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

export function CategoryTiles({
  categories, activeCategory, activeCondition, activeBrand, brandsMap = {},
}: CategoryTilesProps) {
  const topLevel = categories.filter((c) => !c.parentSlug);
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto py-4 pl-8 pr-4 sm:pl-12 sm:pr-6 lg:pl-10 lg:pr-8 scrollbar-hide">
        {/* All Products tile */}
        <Link href="/"
          className={`group relative shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
            !activeCategory
              ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950"
              : "hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950"
          }`}>
          <div className="relative h-32 w-44 sm:h-48 sm:w-64">
            <div className="absolute inset-0 bg-linear-to-br from-zinc-800 to-zinc-900" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Grid2x2 className="h-10 w-10 text-white/50 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <span className="block text-sm font-semibold text-white">All Products</span>
              <span className="block text-[10px] text-white/50 mt-0.5">Browse everything</span>
            </div>
          </div>
        </Link>

        {topLevel.map((category) => (
          <CategoryTileWithPortal
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

function CategoryTileWithPortal({
  category, isActive, activeCategory, activeCondition, activeBrand, brands = [], allCategories,
}: {
  category: LooseCategory;
  isActive: boolean;
  activeCategory?: string;
  activeCondition?: string;
  activeBrand?: string;
  brands?: { title: string; slug: string }[];
  allCategories: LooseCategory[];
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const imageUrl = category.image?.asset?.url;
  const slug = category.slug ?? "";
  const subtitle = CATEGORY_SUBTITLES[slug];

  const showsConditionDropdown = categoryHasConditions(slug);
  const showsSubcategoryDropdown = !showsConditionDropdown && categoryHasSubcategoryDropdown(slug);
  const showDropdown = showsConditionDropdown || showsSubcategoryDropdown;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tileRef.current) {
      const rect = tileRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 200);
  };

  return (
    <div ref={tileRef} className="relative shrink-0"
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link href={`/?category=${slug}`}
        className={`group relative block overflow-hidden rounded-xl transition-all duration-300 ${
          isActive
            ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950"
            : "hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950"
        }`}>
        <div className="relative h-32 w-44 sm:h-48 sm:w-64">
          {imageUrl ? (
            <Image src={imageUrl} alt={category.title ?? "Category"} fill
              className="object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-amber-500 to-orange-600" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white drop-shadow-md leading-tight">
                  {category.title}
                </span>
                {subtitle && (
                  <span className="block text-[10px] text-white/60 mt-0.5 leading-tight">
                    {subtitle}
                  </span>
                )}
              </div>
              {showDropdown && (
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 mt-0.5 text-white/70 transition-transform duration-200 ${dropdownOpen ? "rotate-90" : ""}`} />
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

      {showDropdown && dropdownOpen && (
        <div className="fixed z-9999"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          onMouseLeave={handleMouseLeave}>
          {showsConditionDropdown && (
            <ConditionDropdown categorySlug={slug} activeCondition={activeCondition}
              activeBrand={activeBrand} brands={brands} />
          )}
          {showsSubcategoryDropdown && (
            <SubcategoryDropdown parentSlug={slug} allCategories={allCategories}
              activeCategory={activeCategory} />
          )}
        </div>
      )}
    </div>
  );
}