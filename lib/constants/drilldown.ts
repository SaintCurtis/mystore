/**
 * Drilldown root categories.
 * Defined here (not in a "use client" file) so this can be safely
 * imported in both server components (page.tsx) and client components
 * (CategoryTiles, CategoryDrilldown) without crossing the client boundary.
 */
export const DRILLDOWN_ROOTS = [
  "monitors",
  "content-creation-tools",
  "computers",
] as const;

export type DrilldownRoot = (typeof DRILLDOWN_ROOTS)[number];

export function isDrilldownCategory(slug: string): slug is DrilldownRoot {
  return (DRILLDOWN_ROOTS as readonly string[]).includes(slug);
}