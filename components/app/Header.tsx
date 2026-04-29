"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Sparkles, Cpu, Heart, Search, X, User } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useCartActions, useTotalItems } from "@/lib/store/cart-store-provider";
import { useChatActions, useIsChatOpen } from "@/lib/store/chat-store-provider";
import { useWishlistCount, useWishlistActions } from "@/lib/store/wishlist-store-provider";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { InstantSearch } from "@/components/app/InstantSearch";
import { CurrencyToggle } from "@/components/app/CurrencyToggle";
import { MobileNav } from "@/components/app/MobileNav";
import { Package, Wand2 } from "lucide-react";

export function Header() {
  const { openCart } = useCartActions();
  const { openChat } = useChatActions();
  const isChatOpen = useIsChatOpen();
  const totalItems = useTotalItems();
  const wishlistCount = useWishlistCount();
  const { openWishlist } = useWishlistActions();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-[#1f1f1f] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md transition-colors duration-300">
      {/*
        ── Mobile header math at 382px (Fold 4 front screen) ──────────────
        Hamburger:      36px
        Logo block:    ~120px  (icon 32 + gap 8 + "Saint's TechNet" ~80px)
        flex-1 spacer: absorbs slack
        Right side:     CurrencyToggle(36) + Search(36) + Cart(36) + Avatar(32) + gaps(~12) = ~152px
        Total fixed:   ~308px → spacer gets ~74px → comfortable on 382px
        Ask AI is MOVED to bottom bar only on mobile — removes 44px from header
        ────────────────────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-14 max-w-7xl items-center px-3 sm:px-6 lg:px-8 gap-2">

        {/* Hamburger — mobile only */}
        <MobileNav />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 shadow-sm shadow-amber-500/20 transition-all group-hover:bg-amber-400 shrink-0">
            <Cpu className="h-4 w-4 text-zinc-950" />
          </div>
          {/* Desktop: full name */}
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-[#f1f1f1]">
              The Saint's TechNet
            </span>
            <span className="text-[10px] font-medium text-amber-500 tracking-wider uppercase">
              Built by an Engineer.
            </span>
          </div>
          {/* Mobile: short name — constrained so it never pushes right side off */}
          <span className="sm:hidden text-sm font-extrabold text-zinc-900 dark:text-[#f1f1f1] truncate max-w-[110px]">
            Saint's TechNet
          </span>
        </Link>

        {/* Desktop search */}
        <div className="flex-1 max-w-sm hidden md:block mx-3">
          <InstantSearch />
        </div>

        {/* Mobile spacer */}
        <div className="flex-1 md:hidden" />

        {/* ── Desktop right actions ─────────────────────────── */}
        <div className="hidden md:flex items-center gap-1">
          <CurrencyToggle />

          <Button asChild variant="ghost" size="sm"
            className="hidden lg:flex items-center gap-1.5 text-zinc-600 hover:text-amber-600 hover:bg-amber-50 dark:text-[#a3a3a3] dark:hover:text-amber-400 dark:hover:bg-amber-500/8 transition-colors">
            <Link href="/build-my-setup">
              <Wand2 className="h-4 w-4" />
              <span className="text-sm font-medium">Build My Setup</span>
            </Link>
          </Button>

          <SignedIn>
            <Button asChild variant="ghost" size="sm"
              className="hidden lg:flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a] transition-colors">
              <Link href="/orders">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">My Orders</span>
              </Link>
            </Button>
          </SignedIn>

          {!isChatOpen && (
            <Button onClick={openChat} size="sm"
              className="gap-1.5 bg-linear-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-sm hover:from-amber-400 hover:to-orange-400 transition-all duration-200 h-8 px-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Ask AI</span>
            </Button>
          )}

          <Button variant="ghost" size="icon"
            className="relative h-9 w-9 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:text-[#a3a3a3] dark:hover:text-red-400 dark:hover:bg-red-500/10"
            onClick={openWishlist}>
            <Heart className={`h-[18px] w-[18px] ${wishlistCount > 0 ? "fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400" : ""}`} />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Button>

          <Button variant="ghost" size="icon"
            className="relative h-9 w-9 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a]"
            onClick={openCart}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Button>

          <ThemeToggle />

          <SignedIn>
            <UserButton afterSwitchSessionUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }}>
              <UserButton.MenuItems>
                <UserButton.Link label="My Orders" labelIcon={<Package className="h-4 w-4" />} href="/orders" />
                <UserButton.Link label="Build My Setup" labelIcon={<Wand2 className="h-4 w-4" />} href="/build-my-setup" />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="icon"
                className="h-9 w-9 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a] transition-colors"
                title="Sign in">
                <User className="h-[18px] w-[18px]" />
              </Button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* ── Mobile right — stripped to essentials for 382px ──────────────
            Slots:  CurrencyToggle(36) + Search(36) + Cart(36) + Avatar/SignIn(32) + gaps
            Ask AI is NOT here — it lives in the bottom bar as the hero center tab.
            This keeps the header tight and uncluttered on every phone.
            ────────────────────────────────────────────────────────────── */}
        <div className="flex md:hidden items-center gap-1 shrink-0">

          {/* ₦/$ currency toggle */}
          <CurrencyToggle />

          {/* Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-zinc-500 dark:text-[#a3a3a3]"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Close search" : "Open search"}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-zinc-500 dark:text-[#a3a3a3]"
            onClick={openCart}
            aria-label="Open cart"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Button>

          {/* User avatar — SignedIn only, always visible and never pushed off */}
          <SignedIn>
            <UserButton
              afterSwitchSessionUrl="/"
              appearance={{ elements: { avatarBox: "h-8 w-8" } }}
            />
          </SignedIn>

          {/* Sign in button — compact on mobile */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a] transition-colors"
                title="Sign in"
              >
                <User className="h-[18px] w-[18px]" />
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile search slide-down */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${
        searchOpen
          ? "max-h-14 border-t border-zinc-100 dark:border-[#1a1a1a] px-3 py-2"
          : "max-h-0"
      }`}>
        <InstantSearch />
      </div>
    </header>
  );
}