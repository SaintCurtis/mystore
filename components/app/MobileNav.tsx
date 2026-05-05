"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X, Menu, Wand2, Package, Monitor, Cpu, Headphones,
  Zap, Satellite, Video, ShoppingBag, Gamepad2, Home,
  Heart, Gift, LayoutDashboard,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { useTotalItems, useCartActions } from "@/lib/store/cart-store-provider";
import { useWishlistCount, useWishlistActions } from "@/lib/store/wishlist-store-provider";

const NAV_ITEMS = [
  { label: "Build My Setup ✨",        href: "/build-my-setup",                   icon: Wand2,       highlight: true  },
  { label: "All Products",              href: "/",                                 icon: ShoppingBag, highlight: false },
  { label: "Computers",                 href: "/?category=computers",              icon: Cpu,         highlight: false },
  { label: "Accessories",               href: "/?category=accessories",            icon: Headphones,  highlight: false },
  { label: "Monitors",                  href: "/?category=monitors",               icon: Monitor,     highlight: false },
  { label: "Gaming Laptops",            href: "/?category=gaming-laptops",         icon: Gamepad2,    highlight: false },
  { label: "Content Creation",          href: "/?category=content-creation-tools", icon: Video,       highlight: false },
  { label: "Tech Setup Gears",          href: "/?category=tech-setup-gears",       icon: Home,        highlight: false },
  { label: "EcoFlow",                   href: "/?category=ecoflow",                icon: Zap,         highlight: false },
  { label: "Starlink",                  href: "/?category=starlink",               icon: Satellite,   highlight: false },
  { label: "ACASIS",                    href: "/?category=acasis",                 icon: Zap,         highlight: false },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const totalItems = useTotalItems();
  const wishlistCount = useWishlistCount();
  const { openCart } = useCartActions();
  const { openWishlist } = useWishlistActions();
  const { user } = useUser();
  const scrollYRef = useRef(0);

  const isOwner =
    !!user?.id &&
    !!process.env.NEXT_PUBLIC_ADMIN_CLERK_USER_ID &&
    user.id === process.env.NEXT_PUBLIC_ADMIN_CLERK_USER_ID;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollYRef.current = window.scrollY;
    function handleScroll() {
      if (Math.abs(window.scrollY - scrollYRef.current) > 40) setOpen(false);
    }
    function handleTouchMove() { setOpen(false); }
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  function close() { setOpen(false); }

  return (
    <>
      {/* Hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-zinc-600 dark:text-[#a3a3a3] hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop — tap anywhere outside to close */}
      <div
        className={`
          fixed inset-0 z-60 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300 ease-in-out
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className={`
        fixed left-0 top-0 z-70 h-full w-[82vw] max-w-[310px]
        flex flex-col bg-white dark:bg-[#0d0d0d] shadow-2xl
        transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-zinc-100 dark:border-[#1c1c1c]">
          <div>
            <p className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight">
              The Saint's TechNet
            </p>
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest mt-0.5">
              Built by an Engineer
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1c1c1c] text-zinc-500 dark:text-[#a3a3a3] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] transition-colors active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overscroll-contain py-2">

          {/* Admin Dashboard — owner only */}
          {isOwner && (
            <>
              <Link
                href="/admin"
                onClick={close}
                className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold border-l-2 border-zinc-900 dark:border-white bg-zinc-50 dark:bg-white/5 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white shrink-0">
                  <LayoutDashboard className="h-3.5 w-3.5 text-white dark:text-zinc-900" />
                </div>
                Admin Dashboard
                <span className="ml-auto text-[9px] font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Owner
                </span>
              </Link>
              <div className="mx-5 my-1.5 border-t border-zinc-100 dark:border-[#1c1c1c]" />
            </>
          )}

          {/* Main nav */}
          {NAV_ITEMS.map(({ label, href, icon: Icon, highlight }) => (
            <Link
              key={href + label}
              href={href}
              onClick={close}
              className={`
                flex items-center gap-3 px-5 py-3.5 text-sm font-medium
                border-l-2 transition-colors
                ${highlight
                  ? "border-amber-500 bg-amber-50/70 dark:bg-amber-500/8 text-amber-700 dark:text-amber-400"
                  : "border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a]"
                }
              `}
            >
              <Icon className={`h-4 w-4 shrink-0 ${highlight ? "text-amber-500" : "text-zinc-400 dark:text-zinc-500"}`} />
              {label}
            </Link>
          ))}

          <div className="mx-5 my-1.5 border-t border-zinc-100 dark:border-[#1c1c1c]" />

          <SignedIn>
            <Link href="/orders" onClick={close}
              className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium border-l-2 border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
              <Package className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              My Orders
            </Link>
            <Link href="/referral" onClick={close}
              className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium border-l-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 transition-colors">
              <Gift className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              Refer & Earn 🎁
              <span className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wide">New</span>
            </Link>
          </SignedIn>

          <button type="button" onClick={() => { openWishlist(); close(); }}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium border-l-2 border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <Heart className={`h-4 w-4 shrink-0 ${wishlistCount > 0 ? "fill-red-500 text-red-500" : "text-zinc-400 dark:text-zinc-500"}`} />
            Wishlist
            {wishlistCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{wishlistCount}</span>
            )}
          </button>

          <button type="button" onClick={() => { openCart(); close(); }}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium border-l-2 border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <ShoppingBag className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            Cart
            {totalItems > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">{totalItems}</span>
            )}
          </button>
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-100 dark:border-[#1c1c1c] px-5 py-4 space-y-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Account</span>
            <SignedIn>
              <UserButton afterSwitchSessionUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 active:scale-95 transition-all">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center pt-1">
            CAC Registered · Since 2019 · Ships Worldwide
          </p>
        </div>
      </div>
    </>
  );
}