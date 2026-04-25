"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PRESETS = [
  { label: "Under ₦100K",  min: null,    max: 100000  },
  { label: "₦100K–₦300K",  min: 100000,  max: 300000  },
  { label: "₦300K–₦600K",  min: 300000,  max: 600000  },
  { label: "₦600K–₦1M",    min: 600000,  max: 1000000 },
  { label: "Above ₦1M",    min: 1000000, max: null     },
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
    <div className="md:hidden mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
        Budget
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
                flex shrink-0 items-center rounded-full px-3.5 py-1.5
                text-xs font-semibold whitespace-nowrap transition-all duration-150 border
                ${active
                  ? "bg-amber-500 border-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20"
                  : "bg-white dark:bg-[#111111] border-zinc-200 dark:border-[#2a2a2a] text-zinc-600 dark:text-[#a3a3a3] hover:border-zinc-300 dark:hover:border-[#3a3a3a]"
                }
              `}
            >
              {active && <span className="mr-1">✓</span>}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}