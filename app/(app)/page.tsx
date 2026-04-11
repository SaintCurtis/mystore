import { Suspense } from "react";
import { sanityFetch } from "@/sanity/lib/live";
import {
  FEATURED_PRODUCTS_QUERY,
  FILTER_PRODUCTS_BY_NAME_QUERY,
  FILTER_PRODUCTS_BY_PRICE_ASC_QUERY,
  FILTER_PRODUCTS_BY_PRICE_DESC_QUERY,
  FILTER_PRODUCTS_BY_RELEVANCE_QUERY,
} from "@/lib/sanity/queries/products";
import {
  ALL_CATEGORIES_QUERY,
  BRANDS_BY_CATEGORY_QUERY,
  MODELS_BY_BRAND_QUERY,
} from "@/lib/sanity/queries/categories";
import { CATEGORIES_WITH_BRANDS } from "@/lib/constants/filters";
import { ProductSection } from "@/components/app/ProductSection";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";
import { HeroSection } from "@/components/app/HeroSection";
import { MobileTrustBar } from "@/components/app/MobileTrustBar";
import { TestimonialsCarousel } from "@/components/app/TestimonialsCarousel";
import { AboutSection } from "@/components/app/AboutSection";

const DRILLDOWN_ROOTS = ["monitors", "content-creation-tools", "computers", "accessories"] as const;

function isDrilldownRoot(slug: string): boolean {
  return (DRILLDOWN_ROOTS as readonly string[]).includes(slug);
}

interface PageProps {
  searchParams: Promise<{
    q?: string; category?: string; condition?: string; brand?: string;
    model?: string; color?: string; material?: string; minPrice?: string;
    maxPrice?: string; sort?: string; inStock?: string;
  }>;
}

interface BrandOption { title: string; slug: string }

function extractBrands(data: unknown): BrandOption[] {
  return Array.isArray(data)
    ? data.filter((b: any) => b?.title && b?.slug).map((b: any) => ({ title: b.title as string, slug: b.slug as string }))
    : [];
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const searchQuery = params.q ?? "";
  const categorySlug = params.category ?? "";
  const condition = params.condition ?? "";
  const brandSlug = params.brand ?? "";
  const modelSlug = params.model ?? "";
  const color = params.color ?? "";
  const material = params.material ?? "";
  const minPrice = Number(params.minPrice) || 0;
  const maxPrice = Number(params.maxPrice) || 0;
  const sort = params.sort ?? "name";
  const inStock = params.inStock === "true";
  const isHomepage = !categorySlug && !searchQuery;

  const getQuery = () => {
    if (searchQuery && sort === "relevance") return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
    switch (sort) {
      case "price_asc": return FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
      case "price_desc": return FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
      case "relevance": return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
      default: return FILTER_PRODUCTS_BY_NAME_QUERY;
    }
  };

  const [
    { data: products }, { data: categories }, { data: featuredProducts },
    { data: gamingBrandsData }, { data: regularBrandsData },
    { data: monitorProBrandsData }, { data: monitorGamingBrandsData },
  ] = await Promise.all([
    sanityFetch({ query: getQuery(), params: { searchQuery, categorySlug, condition, brandSlug, modelSlug, color, material, minPrice, maxPrice, inStock } }),
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
    sanityFetch({ query: FEATURED_PRODUCTS_QUERY }),
    sanityFetch({ query: BRANDS_BY_CATEGORY_QUERY, params: { categorySlug: "gaming-laptops", condition: "" } }),
    sanityFetch({ query: BRANDS_BY_CATEGORY_QUERY, params: { categorySlug: "regular-laptops", condition: "" } }),
    sanityFetch({ query: BRANDS_BY_CATEGORY_QUERY, params: { categorySlug: "monitors-professional", condition: "" } }),
    sanityFetch({ query: BRANDS_BY_CATEGORY_QUERY, params: { categorySlug: "monitors-gaming", condition: "" } }),
  ]);

  const brandsMap: Record<string, BrandOption[]> = {
    "gaming-laptops": extractBrands(gamingBrandsData),
    "regular-laptops": extractBrands(regularBrandsData),
    "monitors-professional": extractBrands(monitorProBrandsData),
    "monitors-gaming": extractBrands(monitorGamingBrandsData),
  };

  type FlatCat = { slug?: string | null; parentSlug?: string | null };

  function findBrandSupportingAncestor(catSlug: string): string | null {
    if ((CATEGORIES_WITH_BRANDS as readonly string[]).includes(catSlug)) return catSlug;
    let current = (categories as FlatCat[]).find((c) => c.slug === catSlug);
    while (current) {
      const parentSlug = current.parentSlug;
      if (!parentSlug) break;
      if ((CATEGORIES_WITH_BRANDS as readonly string[]).includes(parentSlug)) return parentSlug;
      current = (categories as FlatCat[]).find((c) => c.slug === parentSlug);
    }
    return null;
  }

  const brandAncestorSlug = categorySlug ? findBrandSupportingAncestor(categorySlug) : null;
  if (brandAncestorSlug && !brandsMap[brandAncestorSlug]) {
    const { data: ancestorBrandsData } = await sanityFetch({ query: BRANDS_BY_CATEGORY_QUERY, params: { categorySlug: brandAncestorSlug, condition: "" } });
    brandsMap[brandAncestorSlug] = extractBrands(ancestorBrandsData);
  }

  const brands: BrandOption[] = brandsMap[categorySlug] ?? (brandAncestorSlug ? brandsMap[brandAncestorSlug] : undefined) ?? [];

  const { data: modelsData } = brandSlug
    ? await sanityFetch({ query: MODELS_BY_BRAND_QUERY, params: { brandSlug } })
    : { data: [] };

  const models: BrandOption[] = Array.isArray(modelsData)
    ? modelsData.filter((m: any) => m?.title && m?.slug).map((m: any) => ({ title: m.title as string, slug: m.slug as string }))
    : [];

  function getActiveTile(catSlug: string): string | undefined {
    if (!catSlug) return undefined;
    if (isDrilldownRoot(catSlug)) return catSlug;
    let current = (categories as FlatCat[]).find((c) => c.slug === catSlug);
    while (current) {
      const parentSlug = current.parentSlug;
      if (!parentSlug) break;
      if (isDrilldownRoot(parentSlug)) return parentSlug;
      current = (categories as FlatCat[]).find((c) => c.slug === parentSlug);
    }
    return catSlug;
  }

  const activeTile = getActiveTile(categorySlug);

  const getPageTitle = () => {
    if (brandSlug) return brandSlug;
    if (condition) {
      const label = condition === "brand-new" ? "Brand New" : "Foreign Used (UK/US)";
      const cat = categories.find((c: { slug?: string | null }) => c.slug === categorySlug);
      return cat ? `${cat.title} — ${label}` : label;
    }
    if (categorySlug) {
      return categories.find((c: { slug?: string | null; title?: string | null }) => c.slug === categorySlug)?.title ?? categorySlug;
    }
    return "All Products";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300">

      {isHomepage && <HeroSection />}

      {/* 📱 Mobile trust bar — shows right after hero on mobile only */}
      {isHomepage && <MobileTrustBar />}

      {isHomepage && featuredProducts.length > 0 && (
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedCarousel products={featuredProducts} />
        </Suspense>
      )}

      {/* Page Banner + Category Tiles */}
      <div className="border-b border-zinc-200 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:pt-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-[#f1f1f1]">
            {getPageTitle()}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-[#a3a3a3]">
            Premium tech — verified, warranted, shipped worldwide
          </p>
        </div>
        <div className="mt-4">
          <CategoryTiles
            categories={categories}
            activeCategory={activeTile}
            activeCondition={condition || undefined}
            activeBrand={brandSlug || undefined}
            brandsMap={brandsMap}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <ProductSection
          categories={categories}
          products={products}
          searchQuery={searchQuery}
          brands={brands}
          models={models}
        />
      </div>

      {isHomepage && <TestimonialsCarousel />}
      {isHomepage && <AboutSection />}
    </div>
  );
}