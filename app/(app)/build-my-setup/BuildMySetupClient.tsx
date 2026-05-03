"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wand2, Gamepad2, Briefcase, Video, GraduationCap,
  ChevronRight, Loader2, ShoppingCart, ArrowLeft, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartActions } from "@/lib/store/cart-store-provider";

// ── Types ────────────────────────────────────────────────────────

type UseCase = "gaming" | "work" | "content-creation" | "student";
type Budget = "under-600k" | "600k-1.2m" | "1.2m-2.5m" | "2.5m-plus";
type Step = "use-case" | "budget" | "preferences" | "result";

interface SetupItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  categoryTitle?: string;
  reason: string;
}

interface SetupResult {
  title: string;
  summary: string;
  items: SetupItem[];
  totalPrice: number;
}

// ── Config ───────────────────────────────────────────────────────

const USE_CASES = [
  { id: "gaming" as UseCase,            label: "Gaming",           icon: Gamepad2,      desc: "High-performance gaming setup"       },
  { id: "work" as UseCase,              label: "Work / Business",  icon: Briefcase,     desc: "Productivity & professional use"     },
  { id: "content-creation" as UseCase,  label: "Content Creation", icon: Video,         desc: "Video, photo, streaming"             },
  { id: "student" as UseCase,           label: "Student",          icon: GraduationCap, desc: "Study, assignments, portability"     },
];

const BUDGETS = [
  { id: "under-600k" as Budget,  label: "Under ₦600,000",    sub: "Entry level"        },
  { id: "600k-1.2m" as Budget,   label: "₦600k – ₦1.2M",    sub: "Mid range"          },
  { id: "1.2m-2.5m" as Budget,   label: "₦1.2M – ₦2.5M",   sub: "High performance"   },
  { id: "2.5m-plus" as Budget,   label: "₦2.5M+",            sub: "Premium / flagship" },
];

// ── Main Component ────────────────────────────────────────────────

export function BuildMySetupClient() {
  const [step, setStep] = useState<Step>("use-case");
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [preferences, setPreferences] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCartActions();

  async function generateSetup() {
    if (!useCase || !budget) return;
    setIsLoading(true);
    setError(null);
    setStep("result");

    try {
      const res = await fetch("/api/build-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCase, budget, preferences }),
      });

      if (!res.ok) throw new Error("Failed to generate setup");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function addAllToCart() {
    if (!result) return;
    result.items.forEach((item) => {
      addItem({
        productId: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
      });
    });
  }

  function reset() {
    setStep("use-case");
    setUseCase(null);
    setBudget(null);
    setPreferences("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300">

      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors mb-4">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Shop
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/8">
              <Wand2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-zinc-900 dark:text-[#f1f1f1]">
                Build My Setup
              </h1>
              <p className="text-sm text-zinc-500 dark:text-[#a3a3a3]">
                Tell us your needs — our AI engineer builds your perfect setup
              </p>
            </div>
          </div>

          {/* Progress */}
          {step !== "result" && (
            <div className="mt-5 flex items-center gap-2">
              {(["use-case", "budget", "preferences"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step === s
                      ? "bg-amber-500 text-zinc-950"
                      : (["use-case", "budget", "preferences"] as Step[]).indexOf(step) > i
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-zinc-200 dark:bg-[#1a1a1a] text-zinc-500 dark:text-[#555]"
                  }`}>
                    {i + 1}
                  </div>
                  {i < 2 && <div className="h-px w-8 bg-zinc-200 dark:bg-[#1a1a1a]" />}
                </div>
              ))}
              <span className="ml-2 text-xs text-zinc-500 dark:text-[#a3a3a3]">
                Step {["use-case", "budget", "preferences"].indexOf(step) + 1} of 3
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Step 1 — Use Case */}
        {step === "use-case" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
              What will you mainly use it for?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {USE_CASES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUseCase(id)}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    useCase === id
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-500/8"
                      : "border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] hover:border-zinc-300 dark:hover:border-[#2a2a2a]"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    useCase === id ? "bg-amber-500/15" : "bg-zinc-100 dark:bg-[#1a1a1a]"
                  }`}>
                    <Icon className={`h-5 w-5 ${useCase === id ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-[#a3a3a3]"}`} />
                  </div>
                  <div>
                    <p className={`font-bold ${useCase === id ? "text-amber-700 dark:text-amber-400" : "text-zinc-900 dark:text-[#f1f1f1]"}`}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-[#a3a3a3]">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button
              disabled={!useCase}
              onClick={() => setStep("budget")}
              className="w-full h-12 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 disabled:opacity-40"
            >
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2 — Budget */}
        {step === "budget" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
              What's your budget?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {BUDGETS.map(({ id, label, sub }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBudget(id)}
                  className={`flex flex-col gap-1 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    budget === id
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-500/8"
                      : "border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] hover:border-zinc-300 dark:hover:border-[#2a2a2a]"
                  }`}
                >
                  <p className={`font-bold text-sm ${budget === id ? "text-amber-700 dark:text-amber-400" : "text-zinc-900 dark:text-[#f1f1f1]"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">{sub}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("use-case")}
                className="flex-1 border-zinc-200 dark:border-[#2a2a2a] dark:text-[#a3a3a3] dark:hover:bg-[#1a1a1a]">
                Back
              </Button>
              <Button disabled={!budget} onClick={() => setStep("preferences")}
                className="flex-1 h-12 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 disabled:opacity-40">
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Preferences */}
        {step === "preferences" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
              Any specific preferences? <span className="text-zinc-400 font-normal text-base">(optional)</span>
            </h2>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder={`e.g. "I need something portable, prefer ASUS or Lenovo, already have a monitor, need something that can handle video editing..."`}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-4 py-3 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none transition-colors"
            />
            <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">
              The more you tell us, the better the recommendation. Leave blank for a general recommendation.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("budget")}
                className="flex-1 border-zinc-200 dark:border-[#2a2a2a] dark:text-[#a3a3a3] dark:hover:bg-[#1a1a1a]">
                Back
              </Button>
              <Button onClick={generateSetup}
                className="flex-1 h-12 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 gap-2">
                <Sparkles className="h-4 w-4" />
                Build My Setup
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Result */}
        {step === "result" && (
          <div className="space-y-6">
            {isLoading && (
              <div className="flex flex-col items-center gap-4 py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                    Building your perfect setup...
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-[#a3a3a3]">
                    Our AI engineer is analyzing your needs
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/8 p-6 text-center">
                <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                <Button onClick={reset} className="mt-4 bg-amber-500 text-zinc-950 hover:bg-amber-400">
                  Try Again
                </Button>
              </div>
            )}

            {result && !isLoading && (
              <>
                {/* Result header */}
                <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h2 className="font-display text-xl font-bold text-amber-800 dark:text-amber-400">
                      {result.title}
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-[#a3a3a3] leading-relaxed">
                    {result.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-[#555]">Total bundle price</p>
                      <p className="text-2xl font-extrabold text-zinc-900 dark:text-amber-400">
                        {formatPrice(result.totalPrice)}
                      </p>
                    </div>
                    <Button onClick={addAllToCart}
                      className="gap-2 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/20">
                      <ShoppingCart className="h-4 w-4" />
                      Add All to Cart
                    </Button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {result.items.map((item, index) => (
                    <div key={item._id}
                      className="flex gap-4 rounded-xl border border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-4 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/8 text-sm font-bold text-amber-600 dark:text-amber-400">
                        {index + 1}
                      </div>
                      {item.image && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d]">
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {item.categoryTitle && (
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {item.categoryTitle}
                          </p>
                        )}
                        <Link href={`/products/${item.slug}`}
                          className="font-semibold text-zinc-900 dark:text-[#f1f1f1] hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm line-clamp-1">
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-[#a3a3a3] line-clamp-2">
                          {item.reason}
                        </p>
                        <p className="mt-1.5 font-bold text-zinc-900 dark:text-amber-400">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addItem({ productId: item._id, name: item.name, price: item.price, image: item.image })}
                        className="shrink-0 self-center bg-amber-500 text-zinc-950 hover:bg-amber-400 text-xs font-bold"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={reset}
                    className="flex-1 border-zinc-200 dark:border-[#2a2a2a] dark:text-[#a3a3a3] dark:hover:bg-[#1a1a1a]">
                    Start Over
                  </Button>
                  <Button onClick={addAllToCart}
                    className="flex-1 h-12 gap-2 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400">
                    <ShoppingCart className="h-4 w-4" />
                    Add All to Cart ({result.items.length} items)
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}