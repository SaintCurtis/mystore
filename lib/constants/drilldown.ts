/**
 * Drilldown root categories.
 * Defined here (not in a "use client" file) so this can be safely
 * imported in both server components (page.tsx) and client components
 * (CategoryTiles, CategoryDrilldown) without crossing the client boundary.
 *
 * To add a new drilldown category:
 * 1. Add its slug here
 * 2. Add its labels to DRILLDOWN_LABELS in ProductFilters.tsx
 * 3. Add its labels to LEVEL_LABELS in CategoryDrilldown.tsx
 */
export const DRILLDOWN_ROOTS = [
  "monitors",
  "content-creation-tools",
  "computers",
  "accessories",
] as const;

export type DrilldownRoot = (typeof DRILLDOWN_ROOTS)[number];

export function isDrilldownCategory(slug: string): slug is DrilldownRoot {
  return (DRILLDOWN_ROOTS as readonly string[]).includes(slug);
}