"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PRESETS = [
  { label: "Under ₦200K",  min: null,     max: 200000   },
  { label: "₦200K–₦500K",  min: 200000,   max: 500000   },
  { label: "₦500K–₦2M",    min: 500000,   max: 2000000  },
  { label: "₦2M–₦5M",      min: 2000000,  max: 5000000  },
  { label: "₦5M–₦8M",      min: 5000000,  max: 8000000  },
];

export function MobilePricePresets() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMin = searchParams.get("minPrice");
  const currentMax = searchParams.get("maxPrice");

  function isActive(min: number | null, max: number | null) {
    const activeMin = currentMin ? Number(currentMin) : null;
    const activeMax = currentMax ? Number(currentMax) : null;
    return activeMin === min && activeMax === max;
  }

  function handlePreset(min: number | null, max: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive(min, max)) {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      if (min !== null) params.set("minPrice", String(min));
      else params.delete("minPrice");
      if (max !== null) params.set("maxPrice", String(max));
      else params.delete("maxPrice");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="md:hidden mb-5">
      {/* Bold visible label */}
      <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-100 mb-2.5">
        💰 Budget
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {PRESETS.map(({ label, min, max }) => {
          const active = isActive(min, max);
          return (
            <button
              key={label}
              type="button"
              onClick={() => handlePreset(min, max)}
              className={`
                flex shrink-0 items-center gap-1 rounded-full px-4 py-2
                text-[13px] font-bold whitespace-nowrap transition-all duration-150 border
                ${active
                  ? "bg-amber-500 border-amber-500 text-zinc-950 shadow-md shadow-amber-500/30 scale-105"
                  : "bg-white dark:bg-[#111111] border-zinc-300 dark:border-[#2a2a2a] text-zinc-700 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400"
                }
              `}
            >
              {active && <span className="text-zinc-950">✓</span>}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}