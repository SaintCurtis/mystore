"use client";

import { useCurrency } from "@/lib/store/currency-store-provider";

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <button
      type="button"
      onClick={toggleCurrency}
      title={currency === "NGN" ? "Switch to USD" : "Switch to NGN"}
      className="flex items-center gap-0.5 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-zinc-50 dark:bg-[#111111] px-2.5 py-1.5 transition-all duration-200 hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-500/8"
    >
      <span className={`text-xs font-bold transition-all duration-200 ${currency === "NGN" ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-[#555]"}`}>
        ₦
      </span>
      <span className="mx-0.5 text-zinc-300 dark:text-[#333] text-xs">/</span>
      <span className={`text-xs font-bold transition-all duration-200 ${currency === "USD" ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-[#555]"}`}>
        $
      </span>
    </button>
  );
}