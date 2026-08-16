"use client";

import { useState } from "react";
import { Calculator, ChevronDown, ChevronUp, MessageCircle, ShieldCheck } from "lucide-react";
import { useCurrency } from "@/lib/store/currency-store-provider";
import { LayawayTermsSheet } from "@/components/app/LayawayTermsSheet";

interface LayawayCalculatorProps {
  price: number; // always NGN
  productName: string;
  productUrl: string;
}

// Pacing options are illustrative only — not a binding term.
// Zero interest applies no matter how fast or slow the customer pays.
const PACE_OPTIONS = [
  { months: 2, label: "2 months" },
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
] as const;

const WHATSAPP_NUMBER = "2349060898951";
const RESERVATION_THRESHOLD = 0.5; // 50% paid locks the unit

export function LayawayCalculator({ price, productName, productUrl }: LayawayCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number>(3);
  const { formatInCurrency } = useCurrency();

  const pace = PACE_OPTIONS.find((p) => p.months === selected) ?? PACE_OPTIONS[1];
  const monthly = price / pace.months;
  const reservationAmount = price * RESERVATION_THRESHOLD;

  const waMessage = encodeURIComponent(
    `Hi! I'd like to start a Layaway plan for this product:\n\n` +
      `*${productName}*\n` +
      `Price: ₦${price.toLocaleString()}\n` +
      `${productUrl}\n\n` +
      `Rough pace: ${pace.months} months (~₦${Math.round(monthly).toLocaleString()}/mo)\n` +
      `No interest, ships once fully paid.\n\n` +
      `Can we get started?`
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
            Layaway Calculator
          </span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Zero interest
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

          {/* Ships-after-full-payment banner — the one thing customers must not miss */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-500/8 border border-blue-500/20 px-3 py-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 leading-relaxed">
              This is a savings plan, not credit. We hold your payments and ship the item
              once it&apos;s fully paid — not before.
            </p>
          </div>

          {/* Pace selector */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Pick a rough pace (optional — pay any amount, any time)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PACE_OPTIONS.map((p) => (
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
                  <span className="text-[9px] font-semibold mt-0.5 opacity-70">
                    {formatInCurrency(price / p.months)}/mo
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Item price</span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {formatInCurrency(price)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Unit reserved once you&apos;ve paid
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {formatInCurrency(reservationAmount)}
                <span className="text-xs font-medium text-zinc-400"> (50%)</span>
              </span>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                At this pace
              </span>
              <span className="text-lg font-extrabold text-blue-500 dark:text-blue-400">
                {formatInCurrency(monthly)}
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                  /mo
                </span>
              </span>
            </div>
          </div>

          {/* Disclaimer + full policy sheet + WhatsApp CTA */}
          <div className="space-y-2.5">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              * Pace above is just a guide — pay faster, slower, or in irregular amounts.
              Zero interest either way. See the full{" "}
              <LayawayTermsSheet triggerLabel="Layaway Policy" triggerClassName="text-[11px] font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300" />{" "}
              for price-change, cancellation, and refund terms.
            </p>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-3 text-sm font-bold text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              Start a Layaway plan on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}