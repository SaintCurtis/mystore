// ─────────────────────────────────────────────────────────────────────────────
// Variant types — shared across schema, queries, components, and cart store
// ─────────────────────────────────────────────────────────────────────────────

export type VariantType = "ram" | "ssd" | "gpu" | "color" | "touchscreen";

export interface VariantOption {
  label: string;
  priceAdjustment: number;
  isDefault: boolean;
  inStock: boolean;
  hexColor?: string | null; // only for color type
}

export interface VariantGroup {
  type: VariantType;
  label: string;
  options: VariantOption[];
}

/**
 * A single selected variant — stored in the cart item alongside the product.
 * e.g. { type: "ram", label: "32GB", priceAdjustment: 0 }
 */
export interface SelectedVariant {
  type: VariantType;
  label: string;
  priceAdjustment: number;
}

/**
 * Compute the final price from the base price and all selected variant adjustments.
 */
export function computeVariantPrice(
  basePrice: number,
  selected: SelectedVariant[],
): number {
  return selected.reduce((acc, v) => acc + v.priceAdjustment, basePrice);
}

/**
 * Build the default selection from a list of variant groups.
 * Picks isDefault === true option per group, or the first option if none marked.
 */
export function buildDefaultSelections(groups: VariantGroup[]): SelectedVariant[] {
  return groups.map((group) => {
    const def =
      group.options.find((o) => o.isDefault && o.inStock) ??
      group.options.find((o) => o.inStock) ??
      group.options[0];

    return {
      type: group.type,
      label: def?.label ?? "",
      priceAdjustment: def?.priceAdjustment ?? 0,
    };
  });
}