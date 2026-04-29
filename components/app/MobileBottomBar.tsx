"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Sparkles, X, Heart } from "lucide-react";
import { useState } from "react";
import { useCartActions, useTotalItems } from "@/lib/store/cart-store-provider";
import { useChatActions, useIsChatOpen } from "@/lib/store/chat-store-provider";
import { useWishlistCount, useWishlistActions } from "@/lib/store/wishlist-store-provider";
import { InstantSearch } from "@/components/app/InstantSearch";

export function MobileBottomBar() {
  const { openCart } = useCartActions();
  const { openChat } = useChatActions();
  const { openWishlist } = useWishlistActions();
  const isChatOpen = useIsChatOpen();
  const totalItems = useTotalItems();
  const wishlistCount = useWishlistCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <>
      {/* Search slide-up panel */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSearchOpen(false)}
          />
          <div className="fixed bottom-[68px] left-0 right-0 z-50 md:hidden border-t border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0f0f0f] px-4 py-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <InstantSearch />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/*
        ── Bottom bar — Fold 4 safe (382px) ───────────────────────────────
        CRITICAL FIX: switched from  flex justify-around  to  CSS grid 5×1fr.
        flex justify-around on 382px distributes leftover space unevenly and
        clips the 5th tab off-screen on narrow viewports.
        grid 5×1fr gives every slot exactly 382÷5 = 76.4px — guaranteed,
        regardless of screen width. Nothing overflows, nothing clips.
        ────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-zinc-200 dark:border-[#1a1a1a] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md">
        <div
          className="grid pb-safe-area-inset-bottom"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
        >

          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
              isHome
                ? "text-amber-500 dark:text-amber-400"
                : "text-zinc-500 dark:text-[#a3a3a3] active:text-amber-500"
            }`}
          >
            <Home className="h-5 w-5" strokeWidth={isHome ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>

          {/* Search */}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
              searchOpen
                ? "text-amber-500 dark:text-amber-400"
                : "text-zinc-500 dark:text-[#a3a3a3]"
            }`}
          >
            <Search className="h-5 w-5" strokeWidth={searchOpen ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold">Search</span>
          </button>

          {/* Ask AI — center hero, floats above bar */}
          {!isChatOpen ? (
            <button
              type="button"
              onClick={openChat}
              className="flex flex-col items-center justify-center gap-0.5 py-1 -mt-4"
              aria-label="Ask AI"
            >
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/40 ring-2 ring-white dark:ring-[#0a0a0a]">
                <Sparkles className="h-[22px] w-[22px] text-white" />
              </div>
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400">Ask AI</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5 py-1 -mt-4 opacity-40">
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-zinc-200 dark:bg-[#1a1a1a] ring-2 ring-white dark:ring-[#0a0a0a]">
                <Sparkles className="h-[22px] w-[22px] text-zinc-400" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400">Ask AI</span>
            </div>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={openWishlist}
            className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-zinc-500 dark:text-[#a3a3a3] transition-colors active:text-red-500"
            aria-label="Wishlist"
          >
            <Heart
              className="h-5 w-5"
              strokeWidth={1.8}
              fill={wishlistCount > 0 ? "currentColor" : "none"}
              style={{ color: wishlistCount > 0 ? "#ef4444" : undefined }}
            />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
            <span className="text-[10px] font-semibold">Wishlist</span>
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={openCart}
            className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-zinc-500 dark:text-[#a3a3a3] transition-colors active:text-amber-500"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
            <span className="text-[10px] font-semibold">Cart</span>
          </button>

        </div>
      </div>

      {/* Spacer — keeps page content above the fixed bar */}
      <div className="h-[68px] md:hidden" />
    </>
  );
}