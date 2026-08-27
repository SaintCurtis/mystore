"use client";

// components/app/LayawayPayButton.tsx
//
// Handles both entry points into the Paystack layaway flow:
//  - mode="new"   — from a product page, starts a fresh plan
//  - mode="topup" — from the Profile page, adds a payment to an existing plan
//
// Either way: pick/confirm an amount → initializeLayawayPayment() → redirect
// to Paystack's hosted checkout. Paystack redirects back to /profile after;
// the webhook (not this component) is what actually records the payment.

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useCurrency } from "@/lib/store/currency-store-provider";
import { initializeLayawayPayment } from "@/lib/actions/layaway";
import { toast } from "sonner";

interface LayawayPayButtonProps {
  mode: "new" | "topup";
  productId?: string;
  planId?: string;
  paceMonths?: number;
  /** Prefilled quick-pay amount (e.g. the 50% reservation amount, or the full remaining balance) */
  suggestedAmount: number;
  /** Upper bound the input will accept — item price for a new plan, remaining balance for a top-up */
  maxAmount: number;
  className?: string;
  buttonLabel?: string;
}

export function LayawayPayButton({
  mode,
  productId,
  planId,
  paceMonths,
  suggestedAmount,
  maxAmount,
  className,
  buttonLabel,
}: LayawayPayButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(Math.round(suggestedAmount));
  const [loading, setLoading] = useState(false);
  const { formatInCurrency } = useCurrency();

  async function pay() {
    if (amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    if (amount > maxAmount) {
      toast.error(`That's more than ${formatInCurrency(maxAmount)}`);
      return;
    }

    setLoading(true);
    try {
      const result = await initializeLayawayPayment({
        productId: mode === "new" ? productId : undefined,
        planId: mode === "topup" ? planId : undefined,
        amount,
        paceMonths,
      });

      if (result.success && result.url) {
        window.location.href = result.url;
        return; // navigating away
      }
      toast.error(result.error || "Could not start payment");
      setLoading(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 px-4 py-3 text-sm font-bold text-white transition-colors"
        }
      >
        <CreditCard className="h-4 w-4 shrink-0" />
        {buttonLabel ?? `Pay ${formatInCurrency(suggestedAmount)} now with Paystack`}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] p-4 space-y-3">
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        How much would you like to pay now?
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">₦</span>
        <input
          type="number"
          min={1}
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0d0d0d] px-3 py-2.5 text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
        />
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Up to {formatInCurrency(maxAmount)}. No interest, no fixed schedule.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={pay}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {loading ? "Starting..." : "Continue to Paystack"}
        </button>
      </div>
    </div>
  );
}
