"use client";

import { cn } from "@/lib/utils";
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
      // Clicking same option deselects — back to base price
      onChange(selected.filter((s) => s.type !== group.type));
    } else {
      const exists = selected.find((s) => s.type === group.type);
      if (exists) {
        onChange(
          selected.map((s) =>
            s.type === group.type
              ? { type: group.type, label: option.label, priceAdjustment: option.priceAdjustment }
              : s
          )
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
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const sel = getSelected(group.type);

        // ── Touchscreen — toggle ───────────────────────────────
        if (group.type === "touchscreen") {
          const onOpt = group.options.find(
            (o) => o.label.toLowerCase() !== "no" && o.label !== "false"
          );
          const isOn = sel?.label === onOpt?.label;

          return (
            <div key={group.type} className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
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
                  "flex w-fit items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150",
                  isOn
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-500 dark:text-zinc-400 hover:border-zinc-400",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200",
                    isOn
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200",
                      isOn ? "translate-x-4" : "translate-x-0.5",
                    )}
                  />
                </span>
                <span>
                  {isOn
                    ? `Touchscreen included${onOpt && onOpt.priceAdjustment !== 0 ? ` (+₦${onOpt.priceAdjustment.toLocaleString()})` : ""}`
                    : `Add touchscreen${onOpt && onOpt.priceAdjustment !== 0 ? ` (+₦${onOpt.priceAdjustment.toLocaleString()})` : ""}`}
                </span>
              </button>
            </div>
          );
        }

        // ── Color — dot chips ──────────────────────────────────
        if (group.type === "color") {
          return (
            <div key={group.type} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {group.label}
                </p>
                {sel ? (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    — {sel.label}
                    {sel.priceAdjustment !== 0 && ` (+₦${sel.priceAdjustment.toLocaleString()})`}
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 dark:text-amber-400">— choose a color</span>
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
                        "relative h-7 w-7 rounded-full border-2 transition-all duration-150",
                        isSelected
                          ? "border-amber-500 scale-110 shadow-md"
                          : "border-transparent hover:border-zinc-400 dark:hover:border-zinc-500",
                        !opt.inStock && "opacity-30 cursor-not-allowed",
                      )}
                      style={{ background: opt.hexColor ?? "#888" }}
                      aria-label={opt.label}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="h-2 w-2 rounded-full bg-white/80 shadow-sm" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        // ── Default — radio chips (RAM, SSD, GPU) ──────────────
        return (
          <div key={group.type} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {group.label}
              </p>
              {!sel && (
                <span className="text-xs text-amber-500 dark:text-amber-400">
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
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-150",
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 bg-transparent",
                      !opt.inStock && "opacity-30 cursor-not-allowed line-through",
                    )}
                  >
                    {/* Radio indicator */}
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
                        isSelected
                          ? "border-amber-500 bg-amber-500"
                          : "border-zinc-300 dark:border-zinc-600 bg-transparent",
                      )}
                    >
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>

                    {opt.label}

                    {delta !== 0 && (
                      <span
                        className={cn(
                          "text-xs ml-0.5",
                          isSelected
                            ? "text-amber-500"
                            : "text-zinc-400 dark:text-zinc-500",
                        )}
                      >
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