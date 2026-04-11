"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X, Menu, Wand2, Package, Monitor, Cpu, Headphones,
  Zap, Satellite, Video, ShoppingBag, Gamepad2, Home, Heart,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { CurrencyToggle } from "@/components/app/CurrencyToggle";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { useTotalItems, useCartActions } from "@/lib/store/cart-store-provider";
import { useWishlistCount, useWishlistActions } from "@/lib/store/wishlist-store-provider";

const NAV_ITEMS = [
  { label: "Build My Setup ✨",       href: "/build-my-setup",                  icon: Wand2,       highlight: true  },
  { label: "All Products",             href: "/",                                icon: ShoppingBag, highlight: false },
  { label: "Computers",                href: "/?category=computers",             icon: Cpu,         highlight: false },
  { label: "Accessories",              href: "/?category=accessories",           icon: Headphones,  highlight: false },
  { label: "Monitors",                 href: "/?category=monitors",              icon: Monitor,     highlight: false },
  { label: "Gaming Laptops",           href: "/?category=gaming-laptops",        icon: Gamepad2,    highlight: false },
  { label: "Content Creation",         href: "/?category=content-creation-tools",icon: Video,       highlight: false },
  { label: "Tech Setup Gears",         href: "/?category=tech-setup-gears",      icon: Home,        highlight: false },
  { label: "EcoFlow",                  href: "/?category=ecoflow",               icon: Zap,         highlight: false },
  { label: "Starlink",                 href: "/?category=starlink",              icon: Satellite,   highlight: false },
  { label: "ACASIS",                   href: "/?category=acasis",                icon: Zap,         highlight: false },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const totalItems = useTotalItems();
  const wishlistCount = useWishlistCount();
  const { openCart } = useCartActions();
  const { openWishlist } = useWishlistActions();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function close() { setOpen(false); }

  return (
    <>
      {/* Hamburger trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-zinc-600 dark:text-[#a3a3a3] hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop — semi-transparent black */}
      {open && (
        <div
          className="fixed inset-0 z-60 bg-black/70"
          onClick={close}
          aria-hidden
        />
      )}

      {/* ── Drawer ────────────────────────────────────────────
          Key fix: solid background, NO backdrop-blur, NO opacity
          bg-white and dark:bg-[#0f0f0f] are 100% opaque
      ──────────────────────────────────────────────────────── */}
      <div
        className={`
          fixed left-0 top-0 z-70 h-full w-[80vw] max-w-[300px]
          flex flex-col
          bg-white dark:bg-[#0f0f0f]
          border-r border-zinc-200 dark:border-[#222]
          shadow-2xl
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between bg-white dark:bg-[#0f0f0f] border-b border-zinc-100 dark:border-[#1a1a1a] px-5 py-4">
          <div>
            <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
              The Saint's TechNet
            </p>
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
              Built by an Engineer
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-500 dark:text-[#a3a3a3] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items — scrollable */}
        <nav className="flex-1 overflow-y-auto bg-white dark:bg-[#0f0f0f]">
          {NAV_ITEMS.map(({ label, href, icon: Icon, highlight }) => (
            <Link
              key={href + label}
              href={href}
              onClick={close}
              className={`
                flex items-center gap-3 px-5 py-4 text-sm font-medium
                border-l-2 transition-colors
                ${highlight
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] hover:text-zinc-900 dark:hover:text-white"
                }
              `}
            >
              <Icon className={`h-4 w-4 shrink-0 ${highlight ? "text-amber-500 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"}`} />
              {label}
            </Link>
          ))}

          {/* Divider */}
          <div className="mx-5 my-2 border-t border-zinc-100 dark:border-[#1a1a1a]" />

          {/* My Orders */}
          <SignedIn>
            <Link href="/orders" onClick={close}
              className="flex items-center gap-3 px-5 py-4 text-sm font-medium border-l-2 border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] hover:text-zinc-900 dark:hover:text-white transition-colors">
              <Package className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              My Orders
            </Link>
          </SignedIn>

          {/* Wishlist */}
          <button type="button"
            onClick={() => { openWishlist(); close(); }}
            className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium border-l-2 border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <Heart className={`h-4 w-4 shrink-0 ${wishlistCount > 0 ? "fill-red-500 text-red-500" : "text-zinc-400 dark:text-zinc-500"}`} />
            Wishlist
            {wishlistCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button type="button"
            onClick={() => { openCart(); close(); }}
            className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium border-l-2 border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <ShoppingBag className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            Cart
            {totalItems > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                {totalItems}
              </span>
            )}
          </button>
        </nav>

        {/* Bottom controls — solid bg */}
        <div className="bg-white dark:bg-[#0f0f0f] border-t border-zinc-100 dark:border-[#1a1a1a] px-5 py-4 space-y-4">
          {/* Currency + Theme */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Display
            </span>
            <div className="flex items-center gap-2">
              <CurrencyToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Account */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Account
            </span>
            <SignedIn>
              <UserButton afterSwitchSessionUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center">
            CAC Registered · Since 2019 · Ships Worldwide
          </p>
        </div>
      </div>
    </>
  );
}