"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, RotateCcw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    label: "Warranty Included",
    sub: "On every product",
  },
  {
    icon: RotateCcw,
    label: "7-Day Returns",
    sub: "No questions asked",
  },
  {
    icon: Globe,
    label: "Worldwide Shipping",
    sub: "We deliver anywhere",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950">
      {/* ── Ambient background grid ───────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Amber glow blobs ──────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, #f97316 0%, transparent 70%)",
        }}
      />

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8 lg:pt-32 lg:pb-24">
        <div className="max-w-3xl">
          {/* CAC badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              CAC Registered Business · Est. 2019
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Tech You Can{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-amber-400">
                Actually Trust
              </span>
              {/* underline accent */}
              <svg
                aria-hidden
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8.5C60 3.5 150 2 298 8.5"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="block mt-1">— Sold by Someone Who</span>
            <span className="block text-zinc-400">
              Actually Understands It.
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-6 text-lg font-medium text-amber-400 sm:text-xl">
            Built by an Engineer. Trusted by Thousands.
          </p>

          {/* Sub-copy */}
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Not a random reseller. I repaired computers before I studied
            Computer Engineering at FUTA — Nigeria's #1 tech university. Every
            gadget I sell has passed through my hands and my knowledge. Brand
            new. Foreign used. All verified. All shipped worldwide.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="group h-12 bg-amber-500 px-8 text-base font-semibold text-zinc-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 hover:shadow-amber-400/30"
            >
              <Link href="/">
                Shop All Products
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 border border-zinc-700 px-8 text-base font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-white"
            >
              <Link href="/?category=gaming-laptops">
                Browse Gaming Laptops
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Trust badges ─────────────────────────────────────── */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Icon className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-zinc-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom fade into page ─────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-zinc-50 to-transparent dark:from-zinc-900"
      />
    </section>
  );
}