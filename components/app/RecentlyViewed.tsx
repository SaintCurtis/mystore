"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useRecentlyViewed } from "@/lib/hooks/useRecentlyViewed";
import { useCurrency } from "@/lib/store/currency-store-provider";

interface RecentlyViewedProps {
  excludeId?: string;
}

export function RecentlyViewed({ excludeId }: RecentlyViewedProps) {
  const items = useRecentlyViewed(excludeId);
  const { formatInCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Placeholder prevents layout shift before hydration
  if (!mounted) return <div className="min-h-[180px]" />;
  if (items.length === 0) return null;

  return (
    <section className="border-t border-zinc-200 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#0a0a0a] py-10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-[#f1f1f1]">
            Recently Viewed
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item) => (
            <Link key={item.productId} href={`/products/${item.slug}`}
              className="group shrink-0 w-44 flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-amber-500/20 hover:shadow-lg dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
              <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-[#0d0d0d]">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="176px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                    <svg className="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                {item.categoryTitle && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                    {item.categoryTitle}
                  </span>
                )}
                <p className="text-xs font-semibold leading-tight text-zinc-900 dark:text-[#f1f1f1] line-clamp-2">{item.name}</p>
                <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-amber-400">
                  {formatInCurrency(item.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}