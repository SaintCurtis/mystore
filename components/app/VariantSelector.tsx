"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { VariantGroup, SelectedVariant } from "@/types/variants";

interface VariantSelectorProps {
  groups: VariantGroup[];
  selected: SelectedVariant[];
  onChange: (updated: SelectedVariant[]) => void;
}

export function VariantSelector({ groups, selected, onChange }: VariantSelectorProps) {
  if (!groups || groups.length === 0) return null;

  const getSelected = (type: string) =>
    selected.find((s) => s.type === type);

  const handleSelect = (
    group: VariantGroup,
    option: { label: string; priceAdjustment: number; inStock: boolean },
  ) => {
    if (!option.inStock) return;

    const alreadySelected = getSelected(group.type)?.label === option.label;

    if (alreadySelected) {
      onChange(selected.filter((s) => s.type !== group.type));
    } else {
      const exists = selected.find((s) => s.type === group.type);
      if (exists) {
        onChange(
          selected.map((s) =>
            s.type === group.type
              ? { type: group.type, label: option.label, priceAdjustment: option.priceAdjustment }
              : s,
          ),
        );
      } else {
        onChange([
          ...selected,
          { type: group.type, label: option.label, priceAdjustment: option.priceAdjustment },
        ]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const sel = getSelected(group.type);

        // ── Touchscreen — premium toggle ───────────────────────
        if (group.type === "touchscreen") {
          const onOpt = group.options.find(
            (o) => o.label.toLowerCase() !== "no" && o.label !== "false",
          );
          const isOn = sel?.label === onOpt?.label;

          return (
            <div key={group.type} className="flex flex-col gap-2.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {group.label}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!onOpt) return;
                  if (isOn) {
                    onChange(selected.filter((s) => s.type !== group.type));
                  } else {
                    handleSelect(group, onOpt);
                  }
                }}
                className={cn(
                  "group flex w-fit items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isOn
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10"
                    : "border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] text-zinc-600 dark:text-[#a3a3a3] hover:border-zinc-300 dark:hover:border-[#3a3a3a]",
                )}
              >
                {/* Toggle pill */}
                <span
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-all duration-200",
                    isOn
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800",
                  )}
                >
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200",
                      isOn ? "translate-x-[18px]" : "translate-x-0.5",
                    )}
                  />
                </span>

                <span>
                  {isOn
                    ? `Touchscreen included${onOpt && onOpt.priceAdjustment !== 0 ? ` (+₦${onOpt.priceAdjustment.toLocaleString()})` : ""}`
                    : `Add Touchscreen${onOpt && onOpt.priceAdjustment !== 0 ? ` · +₦${onOpt.priceAdjustment.toLocaleString()}` : ""}`}
                </span>

                {isOn && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
            </div>
          );
        }

        // ── Color — premium dot chips ──────────────────────────
        if (group.type === "color") {
          return (
            <div key={group.type} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  {group.label}
                </p>
                {sel ? (
                  <span className="text-xs font-semibold text-zinc-600 dark:text-[#a3a3a3]">
                    — {sel.label}
                    {sel.priceAdjustment !== 0 && (
                      <span className="text-amber-500 dark:text-amber-400">
                        {" "}(+₦{sel.priceAdjustment.toLocaleString()})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                    — choose a color
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {group.options.map((opt) => {
                  const isSelected = sel?.label === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      title={opt.label}
                      disabled={!opt.inStock}
                      onClick={() => handleSelect(group, opt)}
                      className={cn(
                        "relative h-8 w-8 rounded-full transition-all duration-150",
                        isSelected
                          ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a] scale-110 shadow-md shadow-amber-500/20"
                          : "ring-1 ring-zinc-200 dark:ring-zinc-700 hover:ring-zinc-400 dark:hover:ring-zinc-500 hover:scale-105",
                        !opt.inStock && "opacity-30 cursor-not-allowed",
                      )}
                      style={{ background: opt.hexColor ?? "#888" }}
                      aria-label={opt.label}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-full">
                          <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />
                        </span>
                      )}
                      {!opt.inStock && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-full">
                          <span className="h-px w-full rotate-45 bg-zinc-400 dark:bg-zinc-600" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        // ── Default — premium pill chips (RAM, SSD, GPU) ───────
        return (
          <div key={group.type} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {group.label}
              </p>
              {sel ? (
                <span className="text-xs font-semibold text-zinc-500 dark:text-[#a3a3a3]">
                  — {sel.label}
                  {sel.priceAdjustment !== 0 && (
                    <span className="text-amber-500 dark:text-amber-400">
                      {" "}(+₦{sel.priceAdjustment.toLocaleString()})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                  — choose an option
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isSelected = sel?.label === opt.label;
                const delta = opt.priceAdjustment;

                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={!opt.inStock}
                    onClick={() => handleSelect(group, opt)}
                    className={cn(
                      "relative flex flex-col items-start gap-0.5 rounded-xl border-2 px-3.5 py-2.5 text-left transition-all duration-150",
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                        : "border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] hover:border-zinc-300 dark:hover:border-[#3a3a3a]",
                      !opt.inStock && "opacity-30 cursor-not-allowed",
                    )}
                  >
                    {/* Selected checkmark badge */}
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}

                    {/* Unavailable slash */}
                    {!opt.inStock && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden">
                        <span className="h-px w-[140%] rotate-12 bg-zinc-300 dark:bg-zinc-700" />
                      </span>
                    )}

                    {/* Label */}
                    <span className={cn(
                      "text-sm font-semibold leading-none",
                      isSelected
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-zinc-800 dark:text-[#f1f1f1]",
                    )}>
                      {opt.label}
                    </span>

                    {/* Price delta */}
                    {delta !== 0 && (
                      <span className={cn(
                        "text-[11px] font-medium leading-none",
                        isSelected
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-zinc-400 dark:text-zinc-500",
                      )}>
                        {delta > 0
                          ? `+₦${delta.toLocaleString()}`
                          : `-₦${Math.abs(delta).toLocaleString()}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}