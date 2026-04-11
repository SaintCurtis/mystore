"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X, Menu, Wand2, Package, Monitor, Cpu, Headphones,
  Zap, Satellite, Video, ShoppingBag, Gamepad2, Home,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { CurrencyToggle } from "@/components/app/CurrencyToggle";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { useTotalItems, useCartActions } from "@/lib/store/cart-store-provider";

const NAV_ITEMS = [
  { label: "All Products",           href: "/",                              icon: ShoppingBag, highlight: false },
  { label: "Build My Setup ✨",       href: "/build-my-setup",               icon: Wand2,       highlight: true  },
  { label: "Computers",              href: "/?category=computers",           icon: Cpu,         highlight: false },
  { label: "Accessories",            href: "/?category=accessories",         icon: Headphones,  highlight: false },
  { label: "Monitors",               href: "/?category=monitors",            icon: Monitor,     highlight: false },
  { label: "Gaming",                 href: "/?category=gaming-laptops",      icon: Gamepad2,    highlight: false },
  { label: "Content Creation",       href: "/?category=content-creation-tools", icon: Video,   highlight: false },
  { label: "Tech Setup Gears",       href: "/?category=tech-setup-gears",   icon: Home,        highlight: false },
  { label: "EcoFlow",                href: "/?category=ecoflow",             icon: Zap,         highlight: false },
  { label: "Starlink",               href: "/?category=starlink",            icon: Satellite,   highlight: false },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const totalItems = useTotalItems();
  const { openCart } = useCartActions();

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on route change
  function handleNavClick() {
    setOpen(false);
  }

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-zinc-600 dark:text-[#a3a3a3] hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed left-0 top-0 z-50 h-full w-[80vw] max-w-[320px] flex flex-col
        bg-white dark:bg-[#0a0a0a]
        border-r border-zinc-200 dark:border-[#1a1a1a]
        shadow-2xl dark:shadow-black/80
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#1a1a1a] px-5 py-4">
          <div className="flex flex-col leading-none">
            <span className="text-sm font-extrabold text-zinc-900 dark:text-[#f1f1f1]">
              The Saint's TechNet
            </span>
            <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wider">
              Built by an Engineer
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-[#a3a3a3] hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map(({ label, href, icon: Icon, highlight }) => (
            <Link
              key={href + label}
              href={href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                highlight
                  ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border-l-2 border-amber-500"
                  : "text-zinc-700 dark:text-[#a3a3a3] hover:bg-zinc-50 dark:hover:bg-[#111111] hover:text-zinc-900 dark:hover:text-[#f1f1f1] border-l-2 border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${highlight ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-[#555]"}`} />
              {label}
            </Link>
          ))}

          <div className="my-2 mx-5 border-t border-zinc-100 dark:border-[#1a1a1a]" />

          {/* My Orders */}
          <SignedIn>
            <Link href="/orders" onClick={handleNavClick}
              className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-zinc-700 dark:text-[#a3a3a3] hover:bg-zinc-50 dark:hover:bg-[#111111] hover:text-zinc-900 dark:hover:text-[#f1f1f1] border-l-2 border-transparent transition-colors">
              <Package className="h-4 w-4 text-zinc-400 dark:text-[#555]" />
              My Orders
            </Link>
          </SignedIn>

          {/* Cart */}
          <button
            type="button"
            onClick={() => { openCart(); setOpen(false); }}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium text-zinc-700 dark:text-[#a3a3a3] hover:bg-zinc-50 dark:hover:bg-[#111111] border-l-2 border-transparent transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-zinc-400 dark:text-[#555]" />
            Cart
            {totalItems > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                {totalItems}
              </span>
            )}
          </button>
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-zinc-100 dark:border-[#1a1a1a] px-5 py-4 space-y-4">
          {/* Currency + Theme row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-[#555] uppercase tracking-wider">
              Display
            </span>
            <div className="flex items-center gap-2">
              <CurrencyToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Sign in / User */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-[#555] uppercase tracking-wider">
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

          {/* Trust line */}
          <p className="text-[10px] text-zinc-400 dark:text-[#555] text-center">
            CAC Registered • Since 2019 • Ships Worldwide
          </p>
        </div>
      </div>
    </>
  );
}