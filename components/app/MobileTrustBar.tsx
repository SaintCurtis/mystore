"use client";

const ITEMS = [
  { emoji: "🔧", text: "Engineer-Inspected",         color: "text-blue-600 dark:text-blue-400"       },
  { emoji: "⚡", text: "Fast Response",               color: "text-amber-500 dark:text-amber-400"     },
  { emoji: "🇳🇬", text: "Lagos-Based",                color: "text-green-600 dark:text-green-400"     },
  { emoji: "💬", text: "WhatsApp Support",            color: "text-emerald-600 dark:text-emerald-400" },
  { emoji: "🔒", text: "Secure Checkout",             color: "text-violet-600 dark:text-violet-400"   },
  { emoji: "🏆", text: "1,000+ Happy Buyers",         color: "text-orange-500 dark:text-orange-400"   },
  { emoji: "📦", text: "Worldwide Delivery",          color: "text-sky-600 dark:text-sky-400"         },
  { emoji: "✅", text: "CAC Registered · BN 9245886", color: "text-teal-600 dark:text-teal-400"       },
  { emoji: "🛡️", text: "Warranty On Everything",      color: "text-indigo-600 dark:text-indigo-400"   },
  { emoji: "↩️", text: "7-Day Returns",               color: "text-rose-500 dark:text-rose-400"       },
];

const SEP = (
  <span aria-hidden className="mx-4 text-zinc-300 dark:text-zinc-600 select-none text-xs">
    ◆
  </span>
);

export function MobileTrustBar() {
  return (
    <div className="md:hidden overflow-x-auto scrollbar-hide border-b border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a]">
      <div className="trust-track py-2.5">
        {[0, 1].map((copy) =>
          ITEMS.map(({ emoji, text, color }) => (
            <span
              key={`${text}-${copy}`}
              aria-hidden={copy === 1}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold shrink-0 ${color}`}
            >
              <span className="text-sm leading-none">{emoji}</span>
              <span>{text}</span>
              {SEP}
            </span>
          ))
        )}
      </div>
    </div>
  );
}