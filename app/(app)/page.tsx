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
} from "@/lib/sanity/queries/categories";
import { ProductSection } from "@/components/app/ProductSection";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";
import { HeroSection } from "@/components/app/HeroSection";
import { TestimonialsCarousel } from "@/components/app/TestimonialsCarousel";
import { AboutSection } from "@/components/app/AboutSection";
import { CATEGORIES_WITH_BRANDS } from "@/lib/constants/filters";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    condition?: string;
    brand?: string;
    color?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    inStock?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const searchQuery = params.q ?? "";
  const categorySlug = params.category ?? "";
  const condition = params.condition ?? "";
  const brandSlug = params.brand ?? "";
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
  ] = await Promise.all([
    sanityFetch({
      query: getQuery(),
      params: {
        searchQuery,
        categorySlug,
        condition,
        brandSlug,
        color,
        material,
        minPrice,
        maxPrice,
        inStock,
      },
    }),
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
    sanityFetch({ query: FEATURED_PRODUCTS_QUERY }),
  ]);

  // ── Fetch brands for categories that support brand drill-down ─
  const needsBrands = (CATEGORIES_WITH_BRANDS as readonly string[]).includes(
    categorySlug,
  );

  const { data: brandsData } = needsBrands
    ? await sanityFetch({
        query: BRANDS_BY_CATEGORY_QUERY,
        params: { categorySlug, condition },
      })
    : { data: [] };

  // Extract brand title strings
  const brands: string[] = Array.isArray(brandsData)
    ? brandsData
        .filter((b: any) => b?.title)
        .map((b: any) => b.title as string)
    : [];

  // ── Page title ────────────────────────────────────────────────
  const getPageTitle = () => {
    if (brandSlug) return brandSlug;
    if (condition) {
      const label =
        condition === "brand-new" ? "Brand New" : "Foreign Used (UK/US)";
      const cat = categories.find((c) => c.slug === categorySlug);
      return cat ? `${cat.title} — ${label}` : label;
    }
    if (categorySlug) {
      return (
        categories.find((c) => c.slug === categorySlug)?.title ?? categorySlug
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
            activeCategory={categorySlug || undefined}
            activeCondition={condition || undefined}
            activeBrand={brandSlug || undefined}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductSection
          categories={categories}
          products={products}
          searchQuery={searchQuery}
          brands={brands}
        />
      </div>

      {/* Testimonials — homepage only */}
      {isHomepage && <TestimonialsCarousel />}

      {/* About — homepage only */}
      {isHomepage && <AboutSection />}

    </div>
  );
}