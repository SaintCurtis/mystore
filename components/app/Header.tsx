"use client";

import Link from "next/link";
import { Package, ShoppingBag, Sparkles, User, Cpu, Heart, Wand2 } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useCartActions, useTotalItems } from "@/lib/store/cart-store-provider";
import { useChatActions, useIsChatOpen } from "@/lib/store/chat-store-provider";
import { useWishlistCount, useWishlistActions } from "@/lib/store/wishlist-store-provider";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { InstantSearch } from "@/components/app/InstantSearch";
import { CurrencyToggle } from "@/components/app/CurrencyToggle";

export function Header() {
  const { openCart } = useCartActions();
  const { openChat } = useChatActions();
  const isChatOpen = useIsChatOpen();
  const totalItems = useTotalItems();
  const wishlistCount = useWishlistCount();
  const { openWishlist } = useWishlistActions();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-[#1f1f1f] bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-3 sm:px-6 lg:px-8 gap-2">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 shadow-sm shadow-amber-500/30 dark:shadow-amber-500/15 transition-all duration-200 group-hover:bg-amber-400">
            <Cpu className="h-4 w-4 text-zinc-950" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-[#f1f1f1]">The Saint's TechNet</span>
            <span className="text-[10px] font-medium text-amber-500 tracking-wider uppercase">Built by an Engineer.</span>
          </div>
        </Link>

        {/* Instant Search — desktop only */}
        <div className="flex-1 max-w-xs hidden md:block mx-2">
          <InstantSearch />
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Actions — right side */}
        <div className="flex items-center gap-0.5 sm:gap-1">

          {/* Build My Setup — desktop only */}
          <Button asChild variant="ghost" size="sm"
            className="hidden lg:flex items-center gap-1.5 text-zinc-600 hover:text-amber-600 hover:bg-amber-50 dark:text-[#a3a3a3] dark:hover:text-amber-400 dark:hover:bg-amber-500/8 transition-colors">
            <Link href="/build-my-setup">
              <Wand2 className="h-4 w-4" />
              <span className="text-sm font-medium">Build My Setup</span>
            </Link>
          </Button>

          {/* My Orders — sm+ only */}
          <SignedIn>
            <Button asChild variant="ghost" size="sm"
              className="hidden sm:flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a] transition-colors">
              <Link href="/orders">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium hidden lg:inline">My Orders</span>
              </Link>
            </Button>
          </SignedIn>

          {/* AI — icon only on mobile */}
          {!isChatOpen && (
            <Button onClick={openChat} size="sm"
              className="gap-1.5 bg-linear-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400 transition-all duration-200 px-2.5 sm:px-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-sm font-medium">Ask AI</span>
            </Button>
          )}

          {/* Wishlist */}
          <Button variant="ghost" size="icon"
            className="relative text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:text-[#a3a3a3] dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors h-9 w-9"
            onClick={openWishlist}>
            <Heart className={`h-5 w-5 transition-all duration-200 ${wishlistCount > 0 ? "fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400" : ""}`} />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon"
            className="relative text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a] transition-colors h-9 w-9"
            onClick={openCart}>
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Button>

          {/* Currency — hidden on smallest screens */}
          <div className="hidden sm:block">
            <CurrencyToggle />
          </div>

          {/* Theme */}
          <ThemeToggle />

          {/* User */}
          <SignedIn>
            <UserButton afterSwitchSessionUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }}>
              <UserButton.MenuItems>
                <UserButton.Link label="My Orders" labelIcon={<Package className="h-4 w-4" />} href="/orders" />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] dark:hover:bg-[#1a1a1a] transition-colors">
                <User className="h-5 w-5" />
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="md:hidden border-t border-zinc-100 dark:border-[#1a1a1a] px-3 py-2">
        <InstantSearch />
      </div>
    </header>
  );
}