import { defineQuery } from "next-sanity";

export const TOP_LEVEL_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
  && !defined(parentCategory)
] | order(order asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  order,
  "image": image{
    asset->{ _id, url },
    hotspot
  }
}`);

export const ALL_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
] | order(order asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  condition,
  order,
  "parentSlug": parentCategory->slug.current,
  "parentTitle": parentCategory->title,
  "image": image{
    asset->{ _id, url },
    hotspot
  },
  "parent": parentCategory->{
    _id,
    title,
    "slug": slug.current,
    condition,
    order,
    "parent": parentCategory->{
      _id,
      title,
      "slug": slug.current,
      condition,
      order,
      "parent": parentCategory->{
        _id,
        title,
        "slug": slug.current,
        condition,
        order
      }
    }
  }
}`);

export const CATEGORY_BY_SLUG_QUERY = defineQuery(`*[
  _type == "category"
  && slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  condition,
  order,
  "parentSlug": parentCategory->slug.current,
  "parentTitle": parentCategory->title,
  "image": image{
    asset->{ _id, url },
    hotspot
  }
}`);

export const SUBCATEGORIES_BY_PARENT_QUERY = defineQuery(`*[
  _type == "category"
  && parentCategory->slug.current == $parentSlug
] | order(order asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  condition,
  order,
  "image": image{
    asset->{ _id, url },
    hotspot
  }
}`);

export const BRANDS_BY_CATEGORY_QUERY = defineQuery(`array::unique(*[
  _type == "product"
  && defined(brand)
  && (
    category->slug.current == $categorySlug
    || category->parentCategory->slug.current == $categorySlug
  )
  && ($condition == "" || brand->condition == $condition || condition->slug.current == $condition)
].brand->{ _id, title, "slug": slug.current }) | order(title asc)`);

export const ALL_BRANDS_BY_CATEGORY_QUERY = defineQuery(`*[
  _type == "brand"
  && $categorySlug in categories[]->slug.current
] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}`);

export const MODELS_BY_BRAND_QUERY = defineQuery(`*[
  _type == "model"
  && brand->slug.current == $brandSlug
] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}`);

// ─────────────────────────────────────────────────────────────────────────────
// Client-side tree helpers
// ─────────────────────────────────────────────────────────────────────────────

export type SanityCategory = {
  _id: string;
  title: string | null;
  slug: string | null;
  condition?: string | null;
  order?: number | null;
  parentSlug?: string | null;
  parentTitle?: string | null;
  image?: { asset?: { url?: string | null } | null } | null;
  parent?: SanityCategory | null;
};

export type CategoryNode = SanityCategory & { children: CategoryNode[] };

/**
 * Build a nested tree from the flat ALL_CATEGORIES_QUERY result,
 * scoped to a specific root slug.
 *
 * FIX: Previously used `parent?._id` which wasn't reliable after
 * TypeGen serialization. Now uses `parentSlug` (flat string from GROQ)
 * which is always present and reliable.
 *
 * Example for rootSlug="monitors":
 * [
 *   { slug: "monitors-gaming", children: [
 *     { slug: "monitors-gaming-brand-new", children: [
 *       { slug: "monitors-gaming-qdoled" },
 *       { slug: "monitors-fast-ips" },
 *       ...
 *     ]},
 *     { slug: "monitors-gaming-foreign-used", children: [] }
 *   ]},
 *   { slug: "monitors-professional", children: [...] }
 * ]
 */
export function buildCategoryTree(
  allCategories: SanityCategory[],
  rootSlug: string,
): CategoryNode[] {
  // Confirm root exists and is truly top-level
  const root = allCategories.find(
    (c) => c.slug === rootSlug && !c.parentSlug,
  );
  if (!root) return [];

  // Recursively get children using parentSlug string matching
  // This is reliable because parentSlug is always set by GROQ
  function getChildren(slug: string): CategoryNode[] {
    return allCategories
      .filter((c) => c.parentSlug === slug)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((c) => ({ ...c, children: getChildren(c.slug ?? "") }));
  }

  return getChildren(rootSlug);
}