"use client";

import { useState } from "react";
import { Calculator, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { useCurrency } from "@/lib/store/currency-store-provider";

interface PaymentPlanCalculatorProps {
  price: number; // always NGN
  productName: string;
  productUrl: string;
}

const PLANS = [
  { months: 2,  label: "2 months",  interestRate: 0     },
  { months: 3,  label: "3 months",  interestRate: 0     },
  { months: 6,  label: "6 months",  interestRate: 0.05  }, // 5% total
  { months: 12, label: "12 months", interestRate: 0.10  }, // 10% total
] as const;

const WHATSAPP_NUMBER = "2349060898951";

export function PaymentPlanCalculator({ price, productName, productUrl }: PaymentPlanCalculatorProps) {
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState<number>(3);
  const { formatInCurrency }    = useCurrency();

  const plan = PLANS.find((p) => p.months === selected) ?? PLANS[1];
  const total         = price * (1 + plan.interestRate);
  const monthly       = total / plan.months;
  const hasInterest   = plan.interestRate > 0;
  const interestNGN   = total - price;

  const waMessage = encodeURIComponent(
    `Hi! I'm interested in a payment plan for this product:\n\n` +
      `*${productName}*\n` +
      `Price: ₦${price.toLocaleString()}\n` +
      `${productUrl}\n\n` +
      `Plan: ${plan.months} months\n` +
      `Monthly: ₦${Math.round(monthly).toLocaleString()}` +
      (hasInterest
        ? `\nTotal (incl. ${(plan.interestRate * 100).toFixed(0)}% fee): ₦${Math.round(total).toLocaleString()}`
        : "") +
      `\n\nCan we discuss this?`
  );
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Calculator className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Payment Plan Calculator
          </span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Instalment options
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
        )}
      </button>

      {/* Expandable body */}
      {open && (
        <div className="px-4 py-4 space-y-4 border-t border-zinc-200 dark:border-zinc-800">

          {/* Plan selector */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Choose a duration
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.months}
                  type="button"
                  onClick={() => setSelected(p.months)}
                  className={`flex flex-col items-center rounded-xl border py-2.5 px-1 text-center transition-all duration-150 ${
                    selected === p.months
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="text-sm font-bold">{p.months}mo</span>
                  {p.interestRate > 0 && (
                    <span className="text-[9px] font-semibold mt-0.5 opacity-70">
                      +{(p.interestRate * 100).toFixed(0)}%
                    </span>
                  )}
                  {p.interestRate === 0 && (
                    <span className="text-[9px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400">
                      0% fee
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Product price</span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {formatInCurrency(price)}
              </span>
            </div>

            {hasInterest && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Instalment fee ({(plan.interestRate * 100).toFixed(0)}%)
                </span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  +{formatInCurrency(interestNGN)}
                </span>
              </div>
            )}

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Monthly payment
              </span>
              <span className="text-lg font-extrabold text-blue-500 dark:text-blue-400">
                {formatInCurrency(monthly)}
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                  /mo
                </span>
              </span>
            </div>

            {hasInterest && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">Total payable</span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {formatInCurrency(total)}
                </span>
              </div>
            )}
          </div>

          {/* Disclaimer + WhatsApp CTA */}
          <div className="space-y-2.5">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              * These are illustrative estimates. Actual terms are agreed directly with us.
              0% fee plans are available for 2–3 month arrangements.
            </p>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-3 text-sm font-bold text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              Discuss payment plan on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}