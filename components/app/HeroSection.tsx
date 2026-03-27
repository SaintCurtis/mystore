"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, RotateCcw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Warranty Included", sub: "On every product" },
  { icon: RotateCcw, label: "7-Day Returns", sub: "No questions asked" },
  { icon: Globe, label: "Worldwide Shipping", sub: "We deliver anywhere" },
];

const ROTATING_WORDS = ["Laptops", "MacBooks", "Gaming PCs", "Accessories", "Tech"];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Word rotation
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-zinc-950">

      {/* ── Subtle dot-grid texture ───────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Amber radial glow — top left ─────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)",
        }}
      />

      {/* ── Orange radial glow — bottom right ────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)",
        }}
      />

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-0 sm:px-6 lg:px-8 lg:pt-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:gap-20">

          {/* Left — headline + copy + CTAs */}
          <div className="flex-1 pb-12 lg:pb-16">

            {/* CAC pill */}
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/8 px-4 py-1.5 transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                BN: 9245886 · Est. 2019 · Computer Sales & Engineering
              </span>
            </div>

            {/* Main headline */}
            <h1
              className={`font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl transition-all duration-700 delay-100 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Premium{" "}
              <span className="relative inline-block">
                <span
                  className={`text-amber-400 transition-all duration-350 ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
                  }`}
                  style={{ display: "inline-block" }}
                >
                  {ROTATING_WORDS[wordIndex]}
                </span>
              </span>
              <br />
              <span className="text-zinc-300">Sold by Someone Who</span>
              <br />
              <span className="relative">
                Actually Understands Them
                {/* SVG underline */}
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full overflow-visible"
                  viewBox="0 0 500 10"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 8 Q125 2 250 6 Q375 10 500 4"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
              .
            </h1>

            {/* Tagline */}
            <p
              className={`mt-6 text-base font-semibold text-amber-400 sm:text-lg transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Built with engineering insight. Delivered with care.
            </p>

            {/* Updated Sub-copy — humble & sophisticated */}
            <p
              className={`mt-3 max-w-lg text-sm leading-7 text-zinc-400 sm:text-base transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              My journey with technology started with repairing computers many years ago. 
              Today, I personally inspect every device we offer — whether brand new or carefully selected foreign-used. 
              All products are stored in our dedicated warehouse and come with warranty. 
              We ship worldwide.
            </p>

            {/* CTAs */}
            <div
              className={`mt-8 flex flex-wrap items-center gap-3 transition-all duration-700 delay-400 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Button
                asChild
                size="lg"
                className="group h-12 bg-amber-500 px-8 font-display text-sm font-bold tracking-wide text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 hover:shadow-amber-400/30 transition-all duration-200"
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
                className="h-12 border border-zinc-700/80 px-8 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-white transition-all duration-200"
              >
                <Link href="/?category=gaming-laptops">
                  Browse Gaming Laptops
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — trust badges */}
          <div
            className={`hidden lg:flex flex-col gap-3 pb-16 w-64 shrink-0 transition-all duration-700 delay-500 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3.5 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
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

        {/* Mobile trust badges — horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-10 lg:hidden scrollbar-hide">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex shrink-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 backdrop-blur-sm"
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

      {/* ── Seamless blend into next section ─────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none h-24 w-full"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgb(9,9,11) 100%)",
        }}
      />
    </section>
  );
}