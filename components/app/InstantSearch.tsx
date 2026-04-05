"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SearchResult {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  categoryTitle?: string | null;
}

export function InstantSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Fetch results from API route
  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
        setIsOpen(true);
        setActiveIndex(-1);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(() => fetchResults(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchResults]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        navigate(results[activeIndex].slug);
      } else if (query.trim()) {
        navigateSearch();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function navigate(slug: string) {
    setIsOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  }

  function navigateSearch() {
    setIsOpen(false);
    router.push(`/?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-400 dark:text-[#555]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Search products..."
          className="h-9 w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-zinc-50 dark:bg-[#111111] pl-9 pr-8 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
        />
        {/* Loading / Clear */}
        <div className="absolute right-2.5 flex items-center">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
          ) : query ? (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[320px] overflow-hidden rounded-xl border border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] shadow-2xl dark:shadow-black/60">

          {results.length === 0 && !isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-[#a3a3a3]">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <>
              <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-100 dark:divide-[#1a1a1a]">
                {results.map((item, index) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => navigate(item.slug)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                      activeIndex === index
                        ? "bg-amber-50 dark:bg-amber-500/8"
                        : "hover:bg-zinc-50 dark:hover:bg-[#1a1a1a]"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-600">
                          <Search className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {item.categoryTitle && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                          {item.categoryTitle}
                        </p>
                      )}
                      <p className="text-sm font-medium text-zinc-900 dark:text-[#f1f1f1] line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-amber-400">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-[#555]" />
                  </button>
                ))}
              </div>

              {/* View all results */}
              <button
                type="button"
                onClick={navigateSearch}
                className="flex w-full items-center justify-between border-t border-zinc-100 dark:border-[#1a1a1a] px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors"
              >
                <span>See all results for &quot;{query}&quot;</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}