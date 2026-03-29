import { defineQuery } from "next-sanity";

/**
 * Get all top-level categories (no parent)
 * Used for navigation tiles
 */
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

/**
 * Get all categories (flat list, includes parent info)
 * Used for filter sidebar and admin
 */
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
  }
}`);

/**
 * Get category by slug (with parent info)
 */
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

/**
 * Get condition subcategories for a given parent category slug
 * e.g. "Brand New" and "Foreign Used" under "gaming-laptops"
 */
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

/**
 * Get distinct brands for a given top-level category + optional condition
 * Brands come from the brand reference on products
 * Used to populate brand dropdown after condition is selected
 */
export const BRANDS_BY_CATEGORY_QUERY = defineQuery(`array::unique(*[
  _type == "product"
  && defined(brand)
  && (
    category->slug.current == $categorySlug
    || category->parentCategory->slug.current == $categorySlug
  )
  && ($condition == "" || brand->condition == $condition || condition->slug.current == $condition)
].brand->{ _id, title, "slug": slug.current }) | order(title asc)`);

/**
 * Get distinct brands for a category regardless of condition
 * Simpler version used for hover dropdowns
 */
export const ALL_BRANDS_BY_CATEGORY_QUERY = defineQuery(`*[
  _type == "brand"
  && $categorySlug in categories[]->slug.current
] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}`);

/**
 * Get distinct models for a given brand (filtered by category)
 * Used to populate model dropdown after brand is selected
 */
export const MODELS_BY_BRAND_QUERY = defineQuery(`*[
  _type == "model"
  && brand->slug.current == $brandSlug
] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}`);