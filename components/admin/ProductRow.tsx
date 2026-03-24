"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { isLowStock, isOutOfStock } from "@/lib/constants/stock";
import { StockInput } from "./StockInput";
import { PriceInput } from "./PriceInput";
import { FeaturedToggle } from "./FeaturedToggle";

interface ProductRowProps {
  documentId: string;
  initialData: any;        // Full product object from fetch
}

export function ProductRow({ documentId, initialData }: ProductRowProps) {
  const p = initialData;   // Short alias for readability

  const lowStock = isLowStock(p.stock);
  const outOfStock = isOutOfStock(p.stock);

  return (
    <TableRow className="group">
      {/* Image - Desktop only */}
      <TableCell className="hidden py-3 sm:table-cell">
        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
          {p.images?.[0]?.asset?.url ? (
            <Image
              src={p.images[0].asset.url}
              alt={p.name || ""}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              ?
            </div>
          )}
        </div>
      </TableCell>

      {/* Name + Mobile view */}
      <TableCell className="py-3 sm:py-4">
        <Link
          href={`/admin/inventory/${documentId}`}
          className="flex items-start gap-3 sm:block"
        >
          {/* Mobile image */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 sm:hidden">
            {p.images?.[0]?.asset?.url ? (
              <Image
                src={p.images[0].asset.url}
                alt={p.name || ""}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                ?
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
                {p.name || "Untitled Product"}
              </span>

              {p.featured && (
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400 sm:hidden" />
              )}

              {p.slug?.current && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`/products/${p.slug.current}`, "_blank");
                  }}
                  className="hidden shrink-0 opacity-0 transition-opacity group-hover:opacity-100 sm:block"
                  aria-label="View product on store"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600" />
                </button>
              )}
            </div>

            {p.category?.title && (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {p.category.title}
              </p>
            )}

            {/* Mobile price & stock */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs sm:hidden">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatPrice(p.price)}
              </span>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {p.stock} in stock
              </span>
              {outOfStock && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Out</Badge>}
              {lowStock && (
                <Badge variant="secondary" className="h-5 bg-amber-100 px-1.5 text-[10px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Low
                </Badge>
              )}
            </div>
          </div>
        </Link>
      </TableCell>

      {/* Price - Desktop */}
      <TableCell className="hidden py-4 md:table-cell">
        <PriceInput documentId={documentId} initialPrice={p.price ?? 0} />
      </TableCell>

      {/* Stock - Desktop */}
      <TableCell className="hidden py-4 md:table-cell">
        <div className="flex items-center gap-2">
          <StockInput documentId={documentId} initialStock={p.stock ?? 0} />
          {outOfStock && <Badge variant="destructive" className="text-xs">Out</Badge>}
          {lowStock && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Low
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Featured - Desktop */}
      <TableCell className="hidden py-4 lg:table-cell">
        <FeaturedToggle documentId={documentId} initialFeatured={p.featured ?? false} />
      </TableCell>

      {/* Actions */}
      <TableCell className="hidden py-4 sm:table-cell">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/inventory/${documentId}`}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Edit
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProductRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="hidden py-3 sm:table-cell">
        <Skeleton className="h-12 w-12 rounded-md" />
      </TableCell>
      <TableCell className="py-3 sm:py-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-md sm:hidden" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden py-4 md:table-cell">
        <Skeleton className="h-8 w-24" />
      </TableCell>
      <TableCell className="hidden py-4 md:table-cell">
        <Skeleton className="h-8 w-20" />
      </TableCell>
      <TableCell className="hidden py-4 lg:table-cell">
        <Skeleton className="h-8 w-8" />
      </TableCell>
      <TableCell className="hidden py-4 sm:table-cell">
        <Skeleton className="h-8 w-20" />
      </TableCell>
    </TableRow>
  );
}