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
import { ProductSection } from "@/components/app/ProductSection";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import { CategoryDrilldown } from "@/components/app/CategoryDrilldown";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";
import { HeroSection } from "@/components/app/HeroSection";
import { TestimonialsCarousel } from "@/components/app/TestimonialsCarousel";
import { AboutSection } from "@/components/app/AboutSection";

// ── Drilldown roots — defined here (server-safe) AND in CategoryDrilldown ──
// These are the two top-level categories that get cascading dropdowns
// instead of the old hover condition dropdown.
const DRILLDOWN_ROOTS = ["monitors", "content-creation-tools"] as const;
type DrilldownRoot = (typeof DRILLDOWN_ROOTS)[number];

function isDrilldownRoot(slug: string): slug is DrilldownRoot {
  return (DRILLDOWN_ROOTS as readonly string[]).includes(slug);
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    condition?: string;
    brand?: string;
    model?: string;
    color?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    inStock?: string;
  }>;
}

interface BrandOption { title: string; slug: string }

function extractBrands(data: unknown): BrandOption[] {
  return Array.isArray(data)
    ? data
        .filter((b: any) => b?.title && b?.slug)
        .map((b: any) => ({ title: b.title as string, slug: b.slug as string }))
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

  // ── Parallel data fetching ────────────────────────────────────
  const [
    { data: products },
    { data: categories },
    { data: featuredProducts },
    { data: gamingBrandsData },
    { data: regularBrandsData },
    { data: monitorProBrandsData },
    { data: monitorGamingBrandsData },
  ] = await Promise.all([
    sanityFetch({
      query: getQuery(),
      params: {
        searchQuery,
        categorySlug,
        condition,
        brandSlug,
        modelSlug,
        color,
        material,
        minPrice,
        maxPrice,
        inStock,
      },
    }),
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
    sanityFetch({ query: FEATURED_PRODUCTS_QUERY }),
    sanityFetch({
      query: BRANDS_BY_CATEGORY_QUERY,
      params: { categorySlug: "gaming-laptops", condition: "" },
    }),
    sanityFetch({
      query: BRANDS_BY_CATEGORY_QUERY,
      params: { categorySlug: "regular-laptops", condition: "" },
    }),
    sanityFetch({
      query: BRANDS_BY_CATEGORY_QUERY,
      params: { categorySlug: "monitors-professional", condition: "" },
    }),
    sanityFetch({
      query: BRANDS_BY_CATEGORY_QUERY,
      params: { categorySlug: "monitors-gaming", condition: "" },
    }),
  ]);

  const brandsMap: Record<string, { title: string; slug: string }[]> = {
    "gaming-laptops": extractBrands(gamingBrandsData),
    "regular-laptops": extractBrands(regularBrandsData),
    "monitors-professional": extractBrands(monitorProBrandsData),
    "monitors-gaming": extractBrands(monitorGamingBrandsData),
  };

  const brands: { title: string; slug: string }[] = brandsMap[categorySlug] ?? [];

  const { data: modelsData } = brandSlug
    ? await sanityFetch({
        query: MODELS_BY_BRAND_QUERY,
        params: { brandSlug },
      })
    : { data: [] };

  const models: { title: string; slug: string }[] = Array.isArray(modelsData)
    ? modelsData
        .filter((m: any) => m?.title && m?.slug)
        .map((m: any) => ({ title: m.title as string, slug: m.slug as string }))
    : [];

  // ── Resolve drilldown context ─────────────────────────────────
  // Walk up the active category's ancestor chain to find if it belongs
  // to a drilldown root (monitors or content-creation-tools).
  // This means ?category=monitors-gaming-qdoled still activates the
  // Monitors drilldown UI with the correct root.
  type CatWithParent = {
    _id: string;
    slug: string | null;
    parentSlug?: string | null;
    parent?: CatWithParent | null;
    [key: string]: unknown;
  };

  function getDrilldownRoot(
    allCats: CatWithParent[],
    activeSlug: string,
  ): DrilldownRoot | null {
    if (!activeSlug) return null;
    if (isDrilldownRoot(activeSlug)) return activeSlug;

    let current = allCats.find((c) => c.slug === activeSlug);
    while (current) {
      const parentSlug = current.parentSlug ?? (current.parent as CatWithParent | null)?.slug;
      if (!parentSlug) break;
      if (isDrilldownRoot(parentSlug)) return parentSlug;
      current = allCats.find((c) => c.slug === parentSlug);
    }
    return null;
  }

  const drilldownRoot = getDrilldownRoot(
    categories as CatWithParent[],
    categorySlug,
  );

  // ── Page title ────────────────────────────────────────────────
  const getPageTitle = () => {
    if (brandSlug) return brandSlug;
    if (condition) {
      const label =
        condition === "brand-new" ? "Brand New" : "Foreign Used (UK/US)";
      const cat = categories.find(
        (c: { slug?: string | null }) => c.slug === categorySlug,
      );
      return cat ? `${cat.title} — ${label}` : label;
    }
    if (categorySlug) {
      return (
        categories.find(
          (c: { slug?: string | null; title?: string | null }) =>
            c.slug === categorySlug,
        )?.title ?? categorySlug
      );
    }
    return "All Products";
  };

  return (
    <div className="min-h-screen bg-zinc-950">

      {/* Hero — homepage only */}
      {isHomepage && <HeroSection />}

      {/* Featured Carousel — homepage only */}
      {isHomepage && featuredProducts.length > 0 && (
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedCarousel products={featuredProducts} />
        </Suspense>
      )}

      {/* Page Banner + Category Tiles */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            {getPageTitle()}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Premium tech — verified, warranted, shipped worldwide
          </p>
        </div>
        <div className="mt-6">
          <CategoryTiles
            categories={categories}
            activeCategory={drilldownRoot ?? (categorySlug || undefined)}
            activeCondition={condition || undefined}
            activeBrand={brandSlug || undefined}
            brandsMap={brandsMap}
          />
        </div>

        {/* Cascading Drilldown Dropdowns — Monitors & Content Creation only */}
        {drilldownRoot && (
          <CategoryDrilldown
            allCategories={categories as any}
            rootSlug={drilldownRoot}
            currentSlug={categorySlug}
          />
        )}
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductSection
          categories={categories}
          products={products}
          searchQuery={searchQuery}
          brands={brands}
          models={models}
        />
      </div>

      {/* Testimonials — homepage only */}
      {isHomepage && <TestimonialsCarousel />}

      {/* About — homepage only */}
      {isHomepage && <AboutSection />}

    </div>
  );
}