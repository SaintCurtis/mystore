"use client";

import { CreditCard, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethod = "paystack" | "crypto";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const CRYPTO_COINS = ["BTC", "ETH", "USDT", "BNB", "SOL", "LTC"];

export function PaymentMethodSelector({
  selected,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Payment Method
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Paystack */}
        <button
          type="button"
          onClick={() => onChange("paystack")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
            selected === "paystack"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/8"
              : "border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] hover:border-zinc-300 dark:hover:border-[#3a3a3a]"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              selected === "paystack"
                ? "bg-blue-500/15"
                : "bg-zinc-100 dark:bg-[#1a1a1a]"
            )}
          >
            <CreditCard
              className={cn(
                "h-5 w-5",
                selected === "paystack"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-[#a3a3a3]"
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                selected === "paystack"
                  ? "text-blue-700 dark:text-blue-400"
                  : "text-zinc-700 dark:text-[#f1f1f1]"
              )}
            >
              Card / Bank
            </p>
            <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mt-0.5">
              via Paystack
            </p>
          </div>
          {selected === "paystack" && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </button>

        {/* Crypto */}
        <button
          type="button"
          onClick={() => onChange("crypto")}
          className={cn(
            "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
            selected === "crypto"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/8"
              : "border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] hover:border-zinc-300 dark:hover:border-[#3a3a3a]"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              selected === "crypto"
                ? "bg-blue-500/15"
                : "bg-zinc-100 dark:bg-[#1a1a1a]"
            )}
          >
            <Bitcoin
              className={cn(
                "h-5 w-5",
                selected === "crypto"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-[#a3a3a3]"
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                selected === "crypto"
                  ? "text-blue-700 dark:text-blue-400"
                  : "text-zinc-700 dark:text-[#f1f1f1]"
              )}
            >
              Crypto
            </p>
            <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mt-0.5">
              BTC, ETH, USDT+
            </p>
          </div>
          {selected === "crypto" && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </button>
      </div>

      {/* Crypto coin badges */}
      {selected === "crypto" && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {CRYPTO_COINS.map((coin) => (
              <span
                key={coin}
                className="rounded-full bg-white dark:bg-[#1a1a1a] border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400"
              >
                {coin}
              </span>
            ))}
            <span className="rounded-full bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-[#2a2a2a] px-2.5 py-1 text-xs text-zinc-500 dark:text-[#a3a3a3]">
              +300 more
            </span>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
              ✓ Price locked in USD — pay in any supported crypto
            </p>
            <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">
              Powered by NOWPayments · Secure · No account needed
            </p>
          </div>
        </div>
      )}

      {selected === "paystack" && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-3">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
            ✓ Cards, bank transfer, USSD & mobile money
          </p>
          <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mt-1">
            Powered by Paystack · 256-bit SSL encrypted
          </p>
        </div>
      )}
    </div>
  );
}