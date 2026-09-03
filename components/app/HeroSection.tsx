"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, RotateCcw, Globe, Wand2, Sparkles, Zap, FileText } from "lucide-react";
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
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 350);
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


      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-0 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:gap-20">

          {/* Left */}
          <div className="flex-1 pb-8 lg:pb-16">

            {/* CAC pill */}
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/8 px-3 py-1.5 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400 sm:hidden">
                BN: 9245886 · Est. 2019
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400 hidden sm:inline">
                BN: 9245886 · Est. 2019 · Computer Sales & Engineering
              </span>
            </div>

            {/* ── Headline ── */}
            <h1 className={`font-display leading-[1.08] tracking-tight text-zinc-900 dark:text-[#f1f1f1]
              transition-all duration-700 delay-100
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

              {/* Mobile headline */}
              <span className="block sm:hidden">
                <span className="text-[2rem] font-extrabold leading-tight">
                  The Smartest Way
                  <br />
                  to Buy{" "}
                  <span
                    className={`text-brand-500 dark:text-brand-400 transition-all duration-350 inline-block ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    }`}
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </span>
                  <br />
                  <span className="relative">
                    in Nigeria
                    <svg aria-hidden className="absolute -bottom-1.5 left-0 w-full overflow-visible" viewBox="0 0 300 10" fill="none" preserveAspectRatio="none">
                      <path d="M0 8 Q75 2 150 6 Q225 10 300 4" stroke="#1a56db" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </svg>
                  </span>
                  .
                </span>
              </span>

              {/* Desktop headline */}
              <span className="hidden sm:block text-5xl lg:text-6xl xl:text-7xl">
                <span className="font-extrabold">The Smartest Way</span>
                <br />
                <span className="font-extrabold">to Buy </span>
                <span className="relative inline-block">
                  <span
                    className={`font-bold text-brand-500 dark:text-brand-400 transition-all duration-350 inline-block ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
                    }`}
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </span>
                </span>
                <br />
                <span className="font-semibold text-zinc-500 dark:text-[#a3a3a3]">in </span>
                <span className="relative font-semibold text-zinc-700 dark:text-[#d4d4d4]">
                  Nigeria
                  <svg aria-hidden className="absolute -bottom-2 left-0 w-full overflow-visible" viewBox="0 0 500 10" fill="none" preserveAspectRatio="none">
                    <path d="M0 8 Q125 2 250 6 Q375 10 500 4" stroke="#1a56db" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
                <span className="font-semibold text-zinc-500 dark:text-[#a3a3a3]">.</span>
              </span>
            </h1>

            {/* Tagline */}
            <p className={`mt-4 text-sm font-semibold italic text-brand-600 dark:text-brand-400 sm:text-lg transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Engineer-verified. Warranty on everything. Since 2019.
            </p>

            {/* Sub-copy desktop */}
            <p className={`mt-3 max-w-lg text-sm leading-7 text-zinc-500 dark:text-[#a3a3a3] sm:text-base hidden sm:block transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Every device we offer — brand new or carefully selected foreign-used — is inspected
              by our engineering team before it reaches you. Warranty on everything. Shipped worldwide.
            </p>

            {/* Sub-copy mobile — short */}
            <p className={`mt-2 text-sm leading-6 text-zinc-500 dark:text-[#a3a3a3] sm:hidden transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Engineer-verified. CAC-registered. Ships worldwide.
            </p>

            {/* CTAs */}
            <div className={`mt-6 space-y-3 transition-all duration-700 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

              {/* Row 1 — primary buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg"
                  className="group h-12 bg-brand-500 px-6 sm:px-8 font-display text-sm font-bold tracking-wide text-white shadow-lg shadow-brand-500/25 hover:bg-brand-400 transition-all duration-200">
                  <Link href="/">
                    Shop All Products
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg"
                  className="h-12 border border-zinc-300 dark:border-[#2a2a2a] px-6 text-sm font-medium text-zinc-700 dark:text-[#a3a3a3] hover:bg-zinc-100 dark:hover:bg-[#111111] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-all">
                  <Link href="/?category=gaming-laptops">Gaming Laptops</Link>
                </Button>
                {/* Quotation CTA — desktop only inline with Row 1 buttons */}
                <Button asChild variant="ghost" size="lg"
                  className="hidden sm:flex h-12 border border-violet-200 dark:border-violet-500/20 px-5 text-sm font-medium text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-500/5 hover:bg-violet-100 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-500/40 transition-all gap-2">
                  <Link href="/quotation">
                    <FileText className="h-4 w-4" />
                    Get a Quote
                  </Link>
                </Button>
              </div>

              {/* ACASIS announcement strip — slim, clearly a "browse" nudge, not a feature */}
              <Link
                href="/?category=acasis"
                className="group flex items-center gap-2.5 rounded-xl border border-brand-200/70 dark:border-brand-500/15 bg-brand-50/60 dark:bg-brand-500/5 px-4 py-2.5 transition-all duration-200 hover:border-brand-300 dark:hover:border-brand-500/30 hover:bg-brand-50 dark:hover:bg-brand-500/8 w-fit"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-400" />
                <span className="text-xs font-semibold text-brand-700 dark:text-brand-400">
                  ACASIS docks & hubs now in stock
                </span>
                <span className="inline-flex items-center rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-400">
                  NEW
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-brand-400 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Row 2 — AI action cards */}
              <div className="flex flex-col sm:flex-row gap-3">

                {/* Build My Setup */}
                <Link href="/build-my-setup"
                  className="group flex items-center gap-4 rounded-2xl border border-brand-200 dark:border-brand-500/20 bg-linear-to-r from-brand-50 to-brand-50 dark:from-brand-500/8 dark:to-brand-500/5 px-4 py-3.5 transition-all duration-200 hover:border-brand-400 dark:hover:border-brand-500/40 hover:shadow-md hover:shadow-brand-500/10 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 dark:bg-brand-500/10 group-hover:bg-brand-500/25 transition-colors">
                    <Wand2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-[#f1f1f1] flex items-center gap-1.5">
                      Build My Setup
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-400">
                        <Sparkles className="h-2.5 w-2.5" /> AI
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mt-0.5 line-clamp-1">
                      Tell our AI your budget & needs
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Get a Quotation — mobile card */}
                <Link href="/quotation"
                  className="sm:hidden group flex items-center gap-4 rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-linear-to-r from-violet-50 to-violet-50 dark:from-violet-500/8 dark:to-violet-500/5 px-4 py-3.5 transition-all duration-200 hover:border-violet-400 dark:hover:border-violet-500/40 hover:shadow-md hover:shadow-black/5 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 dark:bg-violet-500/10 group-hover:bg-violet-500/25 transition-colors">
                    <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-[#f1f1f1] flex items-center gap-1.5">
                      Get a Quotation
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-400">
                        <Sparkles className="h-2.5 w-2.5" /> AI
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mt-0.5 line-clamp-1">
                      Formal quote for bulk & corporate
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-violet-500 dark:text-violet-400 transition-transform group-hover:translate-x-1" />
                </Link>

              </div>

              {/* WhatsApp CTA — mobile only */}
              <a
                href={`https://wa.me/2349060898951?text=${encodeURIComponent("Hi! I need help choosing a product on The Saint's TechNet.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:hidden flex items-center justify-center gap-2 w-full rounded-xl border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-3 text-sm font-bold text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Chat with an Engineer on WhatsApp
              </a>
            </div>
          </div>

          {/* Right — trust badges + Get a Quote — desktop only */}
          <div className={`hidden lg:flex flex-col gap-3 pb-16 w-64 shrink-0 transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] px-4 py-3.5 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                  <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1]">{label}</p>
                  <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">{sub}</p>
                </div>
              </div>
            ))}

            {/* Get a Quote — highlighted 4th card */}
            <Link href="/quotation"
              className="group flex items-center gap-3 rounded-xl border-2 border-violet-300 dark:border-violet-500/40 bg-linear-to-br from-violet-50 to-violet-50 dark:from-violet-500/10 dark:to-violet-500/8 px-4 py-3.5 transition-all duration-200 hover:border-violet-400 dark:hover:border-violet-500/60 hover:shadow-md hover:shadow-black/5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 group-hover:bg-violet-500/25 transition-colors">
                <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  Get a Quote
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
                <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">Bulk & corporate orders</p>
              </div>
            </Link>
          </div>

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