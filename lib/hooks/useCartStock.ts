"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import type { CartItem } from "@/lib/store/cart-store";

export interface StockInfo {
  productId: string;
  currentStock: number;
  isOutOfStock: boolean;
  exceedsStock: boolean;
  availableQuantity: number;
}

export type StockMap = Map<string, StockInfo>;

interface UseCartStockReturn {
  stockMap: StockMap;
  isLoading: boolean;
  hasStockIssues: boolean;
  refetch: () => void;
}

/**
 * Fetches current stock levels for cart items.
 * Handles variant composite IDs (e.g. "productId__ram:16GB|ssd:512GB")
 * by stripping the variant suffix before querying Sanity.
 * Also checks variant-level inStock boolean from Sanity schema.
 */
export function useCartStock(items: CartItem[]): UseCartStockReturn {
  const [stockMap, setStockMap] = useState<StockMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Strip variant suffix and deduplicate product IDs for Sanity query
  const productIds = useMemo(
    () => [...new Set(items.map((item) => item.productId.split("__")[0]))],
    [items]
  );

  const fetchStock = useCallback(async () => {
    if (items.length === 0) {
      setStockMap(new Map());
      return;
    }

    setIsLoading(true);

    try {
      const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
        ids: productIds,
      });

      const newStockMap = new Map<string, StockInfo>();

      for (const item of items) {
        // Strip variant suffix to get raw Sanity product _id
        const rawProductId = item.productId.split("__")[0];
        const product = products.find(
          (p: { _id: string }) => p._id === rawProductId
        );

        const currentStock = product?.stock ?? 0;

        // Check variant-level inStock if this cart item has selected variants
        let variantOutOfStock = false;
        if (
          item.selectedVariants &&
          item.selectedVariants.length > 0 &&
          product?.variantGroups
        ) {
          for (const selected of item.selectedVariants) {
            const group = product.variantGroups.find(
              (g: { type: string }) => g.type === selected.type
            );
            const option = group?.options?.find(
              (o: { label: string }) => o.label === selected.label
            );
            // If option explicitly set to inStock: false, mark as out of stock
            if (option && option.inStock === false) {
              variantOutOfStock = true;
              break;
            }
          }
        }

        newStockMap.set(item.productId, {
          productId: item.productId,
          currentStock,
          isOutOfStock: currentStock === 0 || variantOutOfStock,
          exceedsStock: item.quantity > currentStock,
          availableQuantity: Math.min(item.quantity, currentStock),
        });
      }

      setStockMap(newStockMap);
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    } finally {
      setIsLoading(false);
    }
  }, [items, productIds]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const hasStockIssues = Array.from(stockMap.values()).some(
    (info) => info.isOutOfStock || info.exceedsStock
  );

  return {
    stockMap,
    isLoading,
    hasStockIssues,
    refetch: fetchStock,
  };
}