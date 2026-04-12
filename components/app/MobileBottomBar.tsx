"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useCartActions, useTotalItems } from "@/lib/store/cart-store-provider";
import { useChatActions, useIsChatOpen } from "@/lib/store/chat-store-provider";
import { InstantSearch } from "@/components/app/InstantSearch";

export function MobileBottomBar() {
  const { openCart } = useCartActions();
  const { openChat } = useChatActions();
  const isChatOpen = useIsChatOpen();
  const totalItems = useTotalItems();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Search slide-up panel */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSearchOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden border-t border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0f0f0f] px-4 py-3 shadow-2xl">
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

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-zinc-200 dark:border-[#1a1a1a] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md">
        {/* Safe area padding for iOS home indicator */}
        <div className="flex items-center justify-around px-2 pb-safe-area-inset-bottom">

          {/* Home */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-4 py-2.5 text-zinc-500 dark:text-[#a3a3a3] transition-colors active:text-amber-500"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>

          {/* Search */}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={`flex flex-col items-center gap-1 px-4 py-2.5 transition-colors ${
              searchOpen
                ? "text-amber-500 dark:text-amber-400"
                : "text-zinc-500 dark:text-[#a3a3a3]"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Search</span>
          </button>

          {/* Ask AI — center, prominent */}
          {!isChatOpen && (
            <button
              type="button"
              onClick={openChat}
              className="flex flex-col items-center gap-1 px-2 py-1.5 -mt-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400">Ask AI</span>
            </button>
          )}
          {isChatOpen && (
            <div className="flex flex-col items-center gap-1 px-2 py-1.5 -mt-3 opacity-40">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-[#1a1a1a]">
                <Sparkles className="h-5 w-5 text-zinc-400" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400">Ask AI</span>
            </div>
          )}

          {/* Cart */}
          <button
            type="button"
            onClick={openCart}
            className="relative flex flex-col items-center gap-1 px-4 py-2.5 text-zinc-500 dark:text-[#a3a3a3] transition-colors active:text-amber-500"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
            <span className="text-[10px] font-semibold">Cart</span>
          </button>

        </div>
      </div>

      {/* Spacer so content doesn't hide behind the bar */}
      <div className="h-16 md:hidden" />
    </>
  );
}