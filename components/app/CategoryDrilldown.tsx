"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  DRILLDOWN_ROOTS,
  type DrilldownRoot,
} from "@/lib/constants/drilldown";
import {
  buildCategoryTree,
  type CategoryNode,
  type SanityCategory,
} from "@/lib/sanity/queries/categories";

// Re-export so page.tsx can import from one place if needed
export { isDrilldownCategory } from "@/lib/constants/drilldown";
export type { DrilldownRoot } from "@/lib/constants/drilldown";

// Human-readable label for each depth level per root category
const LEVEL_LABELS: Record<DrilldownRoot, Record<number, string>> = {
  monitors: {
    0: "Type",        // Gaming Monitors / Professional Monitors
    1: "Condition",   // Brand New / Foreign Used
    2: "Panel Type",  // IPS / VA / OLED / QD-OLED etc.
  },
  "content-creation-tools": {
    0: "Category",     // Cameras / Microphones / Lighting etc.
    1: "Sub-category", // Digital Cameras / Lavalier Mics etc.
    2: "Type",
  },
  computers: {
    0: "Type",         // Gaming Laptops / Regular Laptops / SFF etc.
    1: "Condition",    // Brand New / Foreign Used
  },
  accessories: {
    0: "Type",         // Headsets / Keyboards / Mice / Webcams etc.
  },
};

interface CategoryDrilldownProps {
  allCategories: SanityCategory[];
  rootSlug: DrilldownRoot;
  currentSlug: string;
}

export function CategoryDrilldown({
  allCategories,
  rootSlug,
  currentSlug,
}: CategoryDrilldownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tree = buildCategoryTree(allCategories, rootSlug);

  const [selections, setSelections] = useState<string[]>([]);

  useEffect(() => {
    if (!currentSlug || currentSlug === rootSlug) {
      setSelections([]);
      return;
    }

    const cat = allCategories.find((c) => c.slug === currentSlug);
    if (!cat) {
      setSelections([]);
      return;
    }

    const chain: string[] = [];
    let current: SanityCategory | null | undefined = cat;
    while (current && current.slug !== rootSlug) {
      chain.unshift(current.slug ?? "");
      current = current.parent;
    }
    setSelections(chain.filter(Boolean));
  }, [currentSlug, rootSlug, allCategories]);

  function getOptionsAtLevel(level: number): CategoryNode[] {
    if (level === 0) return tree;
    let nodes: CategoryNode[] = tree;
    for (let i = 0; i < level; i++) {
      const chosen = selections[i];
      if (!chosen) return [];
      const found = nodes.find((n) => n.slug === chosen);
      if (!found) return [];
      nodes = found.children;
    }
    return nodes;
  }

  function handleChange(level: number, slug: string) {
    const next = [...selections.slice(0, level)];
    if (slug) next.push(slug);
    setSelections(next);

    const target = slug || rootSlug;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", target);
    params.delete("condition");
    params.delete("brand");
    router.push(`/?${params.toString()}`);
  }

  const labelMap = LEVEL_LABELS[rootSlug] ?? {};
  const maxDepth = Object.keys(labelMap).length;

  // Determine which depth levels to render
  const depthsToShow: number[] = [0];
  for (let i = 0; i < selections.length; i++) {
    if (i + 1 >= maxDepth) break; // don't exceed defined levels
    const childrenAtNext = getOptionsAtLevel(i + 1);
    if (childrenAtNext.length > 0) depthsToShow.push(i + 1);
    else break;
  }
  const lastShown = depthsToShow[depthsToShow.length - 1];
  if (
    lastShown + 1 < maxDepth &&
    selections[lastShown] &&
    getOptionsAtLevel(lastShown + 1).length > 0
  ) {
    depthsToShow.push(lastShown + 1);
  }

  if (tree.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-4 sm:px-6 lg:px-8">
      {depthsToShow.map((level) => {
        const options = getOptionsAtLevel(level);
        if (options.length === 0) return null;

        const label = labelMap[level] ?? `Level ${level + 1}`;
        const value = selections[level] ?? "";

        return (
          <div key={level} className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {label}
            </label>
            <div className="relative">
              <select
                value={value}
                onChange={(e) => handleChange(level, e.target.value)}
                className="
                  w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-900
                  px-3 py-2 pr-8 text-sm text-zinc-200
                  focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500
                  transition-colors cursor-pointer
                "
              >
                <option value="">All {label}s</option>
                {options.map((opt) => (
                  <option key={opt._id} value={opt.slug ?? ""}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-zinc-500" />
            </div>
          </div>
        );
      })}

      {selections.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setSelections([]);
            const params = new URLSearchParams(searchParams.toString());
            params.set("category", rootSlug);
            params.delete("condition");
            params.delete("brand");
            router.push(`/?${params.toString()}`);
          }}
          className="self-end pb-0.5 text-xs text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}