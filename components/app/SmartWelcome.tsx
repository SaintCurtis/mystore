"use client";
// components/app/SmartWelcome.tsx
// FIX 6: Smart recommendation widget
//
// How it works:
//  1. Reads document.referrer to detect if the user came from Jiji, Jumia,
//     Google, or other sites — extracts search terms from the referrer URL
//  2. Reads our own localStorage search/view history (stored by InstantSearch
//     and RecentlyViewed components)
//  3. Sends both signals to /api/recommendations to get personalized products
//  4. Shows a non-intrusive welcome banner with product suggestions
//
// Privacy: reads only the current session's referrer (the browser provides
// this automatically) and our own first-party localStorage data.
// We NEVER read other sites' cookies, history, or data — that's impossible
// and would be a privacy violation.

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { XMarkIcon, SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useCurrency } from "@/lib/store/currency-store-provider";

interface RecommendedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  category?: string;
  reason?: string;
}

interface SmartWelcomeProps {
  /** Pass all available products/categories for recommendation context */
  allCategorySlugs?: string[];
}

// ── Extract search query from referrer URL ──────────────────────────────
function extractReferrerContext(): { source: string; query: string } | null {
  if (typeof window === "undefined") return null;
  const ref = document.referrer;
  if (!ref) return null;

  try {
    const url = new URL(ref);
    const hostname = url.hostname.toLowerCase();

    // Jiji Nigeria
    if (hostname.includes("jiji.ng")) {
      const path = url.pathname; // e.g. /lagos/laptops
      const query = url.searchParams.get("query") ?? path.split("/").pop() ?? "";
      return { source: "Jiji", query: decodeURIComponent(query.replace(/-/g, " ")) };
    }

    // Jumia Nigeria
    if (hostname.includes("jumia.com")) {
      const query = url.searchParams.get("q") ?? url.searchParams.get("search") ?? "";
      return { source: "Jumia", query: decodeURIComponent(query) };
    }

    // Konga
    if (hostname.includes("konga.com")) {
      const query = url.searchParams.get("q") ?? url.searchParams.get("search") ?? "";
      return { source: "Konga", query: decodeURIComponent(query) };
    }

    // Google / Bing / DuckDuckGo
    if (hostname.includes("google") || hostname.includes("bing") || hostname.includes("duckduckgo")) {
      const query = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
      return { source: "search", query: decodeURIComponent(query) };
    }

    // Generic — extract any q/query/search param
    const query =
      url.searchParams.get("q") ??
      url.searchParams.get("query") ??
      url.searchParams.get("search") ?? "";
    if (query) {
      return { source: url.hostname, query: decodeURIComponent(query) };
    }
  } catch {
    // Ignore malformed referrer
  }

  return null;
}

// ── Read our own first-party search/view history ──────────────────────
function readOwnHistory(): string[] {
  if (typeof window === "undefined") return [];
  const terms: string[] = [];

  try {
    // Recent searches from InstantSearch component
    const searches = localStorage.getItem("recent_searches");
    if (searches) {
      const parsed = JSON.parse(searches) as string[];
      terms.push(...parsed.slice(0, 5));
    }
  } catch {}

  try {
    // Recently viewed product slugs → convert to readable terms
    const viewed = localStorage.getItem("recently_viewed");
    if (viewed) {
      const parsed = JSON.parse(viewed) as string[];
      const readable = parsed
        .slice(0, 5)
        .map((slug: string) => slug.replace(/-/g, " "));
      terms.push(...readable);
    }
  } catch {}

  return [...new Set(terms)]; // dedupe
}

// ── Component ────────────────────────────────────────────────────────────
export function SmartWelcome({ allCategorySlugs = [] }: SmartWelcomeProps) {
  const { formatInCurrency } = useCurrency();
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [context, setContext] = useState<{ source: string; query: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only show once per session
    const sessionKey = "smart_welcome_shown";
    if (sessionStorage.getItem(sessionKey)) return;
    if (hasFetched.current) return;
    hasFetched.current = true;

    const referrer = extractReferrerContext();
    const ownHistory = readOwnHistory();

    // Only show if we have something to recommend
    if (!referrer && ownHistory.length === 0) return;

    const queryTerms = [
      ...(referrer ? [referrer.query] : []),
      ...ownHistory,
    ].filter(Boolean).slice(0, 6);

    if (queryTerms.length === 0) return;

    setContext(referrer);

    // Fetch recommendations
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: queryTerms,
        categories: allCategorySlugs,
        source: "smart_welcome",
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.products?.length > 0) {
          setProducts(data.products.slice(0, 4));
          setVisible(true);
          sessionStorage.setItem(sessionKey, "1");
        }
      })
      .catch(() => {});
  }, [allCategorySlugs]);

  if (!visible || dismissed || products.length === 0) return null;

  const sourceLabel = context
    ? context.source === "search"
      ? "your recent search"
      : `your Jiji/Jumia search`
    : "your browsing history";

  const queryLabel = context?.query
    ? `"${context.query}"`
    : "your recent searches";

  return (
    <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4">
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                Welcome back — we found matches for you
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Based on {sourceLabel} for {queryLabel}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product.slug}`}
              className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 hover:shadow-md hover:shadow-amber-500/10"
            >
              <div className="relative aspect-square bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-600 text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                  {product.name}
                </p>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {formatInCurrency(product.price)}
                </p>
                {product.reason && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
                    {product.reason}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Footer link */}
        <div className="mt-3 flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline underline-offset-2 font-medium"
          >
            Browse all products
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}