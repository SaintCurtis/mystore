// ============================================
// Product Attribute Constants
// ============================================

export const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "silver", label: "Silver" },
  { value: "grey", label: "Grey" },
  { value: "blue", label: "Blue" },
  { value: "space-black", label: "Space Black" },
  { value: "midnight", label: "Midnight" },
  { value: "starlight", label: "Starlight" },
  { value: "graphite", label: "Graphite" },
] as const;

export const MATERIALS = [
  { value: "metal", label: "Metal" },
  { value: "plastic", label: "Plastic" },
  { value: "aluminum", label: "Aluminum" },
  { value: "glass", label: "Glass" },
] as const;

export const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Relevance" },
] as const;

// ============================================
// Condition Constants
// ============================================

export const CONDITIONS = [
  { value: "brand-new", label: "Brand New" },
  { value: "foreign-used", label: "Foreign Used (UK/US)" },
] as const;

// ============================================
// Categories that support condition drill-down
// These show "Brand New" / "Foreign Used" on hover
// ============================================

/** Has condition → brand → model drill-down */
export const CATEGORIES_WITH_BRANDS = [
  "gaming-laptops",
  "regular-laptops",
] as const;

/** Has condition → model drill-down (no brand step — Apple only) */
export const CATEGORIES_WITHOUT_BRANDS = ["macbook"] as const;

/** All categories that support condition drill-down */
export const CATEGORIES_WITH_CONDITIONS = [
  ...CATEGORIES_WITH_BRANDS,
  ...CATEGORIES_WITHOUT_BRANDS,
] as const;

// ============================================
// Type exports
// ============================================

export type ColorValue = (typeof COLORS)[number]["value"];
export type MaterialValue = (typeof MATERIALS)[number]["value"];
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
export type ConditionValue = (typeof CONDITIONS)[number]["value"];

// ============================================
// Sanity Schema Format Exports
// ============================================

export const COLORS_SANITY_LIST = COLORS.map(({ value, label }) => ({
  title: label,
  value,
}));

export const MATERIALS_SANITY_LIST = MATERIALS.map(({ value, label }) => ({
  title: label,
  value,
}));

export const COLOR_VALUES = COLORS.map((c) => c.value) as [
  ColorValue,
  ...ColorValue[],
];

export const MATERIAL_VALUES = MATERIALS.map((m) => m.value) as [
  MaterialValue,
  ...MaterialValue[],
];