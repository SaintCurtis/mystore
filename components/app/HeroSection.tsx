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
      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-8 sm:px-6 lg:px-8 lg:pt-10 lg:pb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

          {/* Left — text content */}
          <div className="flex-1">
            {/* CAC badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                CAC Registered Business · Est. 2019
              </span>
            </div>

            {/* Headline — single line flow, smaller sizes */}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Tech You Can{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-amber-400">Actually Trust</span>
                <svg
                  aria-hidden
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 300 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 7C60 2.5 150 1.5 298 7"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {" "}— Sold by Someone Who{" "}
              <span className="text-zinc-400">Actually Understands It.</span>
            </h1>

            {/* Tagline */}
            <p className="mt-3 text-sm font-semibold text-amber-400 sm:text-base">
              Built by an Engineer. Trusted by Thousands.
            </p>

            {/* Sub-copy */}
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Not a random reseller. I repaired computers before studying
              Computer Engineering at FUTA — Nigeria's #1 tech university.
              Every gadget verified. Brand new & foreign used. Shipped worldwide.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="sm"
                className="group bg-amber-500 px-6 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400"
              >
                <Link href="/">
                  Shop All Products
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="border border-zinc-700 px-6 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-white"
              >
                <Link href="/?category=gaming-laptops">
                  Browse Gaming Laptops
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — Trust badges (vertical stack on desktop, horizontal on mobile) */}
          <div className="mt-8 flex flex-row gap-3 overflow-x-auto pb-1 lg:mt-0 lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0 lg:w-72 lg:shrink-0">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 backdrop-blur-sm lg:w-full"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-zinc-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Bottom fade into page ─────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-50 to-transparent dark:from-zinc-900"
      />
    </section>
  );
}