"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, RotateCcw, Globe, Wand2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Warranty Included", sub: "On every product" },
  { icon: RotateCcw,   label: "7-Day Returns",    sub: "No questions asked" },
  { icon: Globe,       label: "Worldwide Shipping",sub: "We deliver anywhere" },
];

const ROTATING_WORDS = ["Laptops", "MacBooks", "Gaming PCs", "Accessories", "Tech"];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setWordIndex((i) => (i + 1) % ROTATING_WORDS.length); setVisible(true); }, 350);
    }, 2800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-300">

      {/* Dot grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 dark:hidden"
        style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Glows */}
      <div aria-hidden className="pointer-events-none absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 60%)" }} />
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full hidden dark:block"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)" }} />

      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-0 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:gap-20">

          {/* Left */}
          <div className="flex-1 pb-10 lg:pb-16">

            {/* CAC pill */}
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1.5 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 sm:hidden">
                Since 2019 · CAC Registered
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 hidden sm:inline">
                BN: 9245886 · Est. 2019 · Computer Sales & Engineering
              </span>
            </div>

            {/* Headline */}
            <h1 className={`font-display font-extrabold leading-[1.05] tracking-tight text-zinc-900 dark:text-[#f1f1f1] text-[2.2rem] sm:text-5xl lg:text-6xl xl:text-7xl transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              Premium{" "}
              <span className="relative inline-block">
                <span className={`text-amber-500 dark:text-amber-400 transition-all duration-350 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`} style={{ display: "inline-block" }}>
                  {ROTATING_WORDS[wordIndex]}
                </span>
              </span>
              <br />
              <span className="text-zinc-500 dark:text-[#a3a3a3] sm:hidden">By Someone Who Gets It.</span>
              <span className="text-zinc-500 dark:text-[#a3a3a3] hidden sm:inline">Sold by Someone Who</span>
              <br className="hidden sm:block" />
              <span className="hidden sm:inline relative">
                Actually Understands Them
                <svg aria-hidden className="absolute -bottom-2 left-0 w-full overflow-visible" viewBox="0 0 500 10" fill="none" preserveAspectRatio="none">
                  <path d="M0 8 Q125 2 250 6 Q375 10 500 4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <span className="hidden sm:inline">.</span>
            </h1>

            {/* Tagline */}
            <p className={`mt-5 text-sm font-semibold text-amber-600 dark:text-amber-400 sm:text-lg transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Built with engineering insight. Delivered with care.
            </p>

            {/* Sub-copy desktop */}
            <p className={`mt-3 max-w-lg text-sm leading-7 text-zinc-500 dark:text-[#a3a3a3] sm:text-base hidden sm:block transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              My journey with technology started with repairing computers many years ago.
              Today, I personally inspect every device we offer — whether brand new or carefully
              selected foreign-used. All products are stored in our dedicated warehouse and
              come with warranty. We ship worldwide.
            </p>

            {/* Sub-copy mobile */}
            <p className={`mt-2 text-sm leading-6 text-zinc-500 dark:text-[#a3a3a3] sm:hidden transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              CAC-registered. Engineer-verified. Warranty on everything. Ships worldwide.
            </p>

            {/* ── CTA block ────────────────────────────────── */}
            <div className={`mt-7 space-y-3 transition-all duration-700 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

              {/* Row 1 — primary buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg"
                  className="group h-12 bg-amber-500 px-6 sm:px-8 font-display text-sm font-bold tracking-wide text-zinc-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-all duration-200">
                  <Link href="/">
                    Shop All Products
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg"
                  className="h-12 border border-zinc-300 dark:border-[#2a2a2a] px-6 text-sm font-medium text-zinc-700 dark:text-[#a3a3a3] hover:bg-zinc-100 dark:hover:bg-[#111111] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-all">
                  <Link href="/?category=gaming-laptops">Gaming Laptops</Link>
                </Button>
              </div>

              {/* Row 2 — action cards (Build My Setup + ACASIS) */}
              <div className="flex flex-col sm:flex-row gap-3">

                {/* Build My Setup card */}
                <Link href="/build-my-setup"
                  className="group flex items-center gap-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-500/8 dark:to-orange-500/5 px-4 py-3.5 transition-all duration-200 hover:border-amber-400 dark:hover:border-amber-500/40 hover:shadow-md hover:shadow-amber-500/10 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-500/10 group-hover:bg-amber-500/25 transition-colors">
                    <Wand2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-[#f1f1f1] flex items-center gap-1.5">
                      Build My Setup
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        <Sparkles className="h-2.5 w-2.5" /> AI
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mt-0.5 line-clamp-1">
                      Tell our AI your budget & needs
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* ACASIS promo card */}
                <Link href="/?category=acasis"
                  className="group flex items-center gap-4 rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-500/8 dark:to-indigo-500/5 px-4 py-3.5 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/10 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 dark:bg-blue-500/10 group-hover:bg-blue-500/25 transition-colors">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-[#f1f1f1] flex items-center gap-1.5">
                      ACASIS Now In Stock
                      <span className="inline-flex items-center rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                        NEW
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mt-0.5 line-clamp-1">
                      Docks, hubs & accessories
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400 transition-transform group-hover:translate-x-1" />
                </Link>

              </div>
            </div>
          </div>

          {/* Right — trust badges desktop */}
          <div className={`hidden lg:flex flex-col gap-3 pb-16 w-64 shrink-0 transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] px-4 py-3.5 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1]">{label}</p>
                  <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile trust badges */}
        <div className="flex gap-3 overflow-x-auto pb-8 lg:hidden scrollbar-hide">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex shrink-0 items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] px-3.5 py-3 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-[#f1f1f1]">{label}</p>
                <p className="text-[10px] text-zinc-500 dark:text-[#a3a3a3]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blend */}
      <div aria-hidden className="pointer-events-none h-16 w-full dark:hidden"
        style={{ background: "linear-gradient(to bottom, transparent 0%, rgb(244,244,245) 100%)" }} />
      <div aria-hidden className="pointer-events-none h-16 w-full hidden dark:block"
        style={{ background: "linear-gradient(to bottom, transparent 0%, #0a0a0a 100%)" }} />
    </section>
  );
}