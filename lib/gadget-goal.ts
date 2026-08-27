// lib/gadget-goal.ts
//
// Turns a customer's wishlist + search history into a single friendly
// "gadget goal" nudge — used on the Profile page and in the birthday email.
// Deliberately simple and deterministic (no ML): it's meant to be
// explainable, not clever.

export interface GadgetGoalWishlistItem {
  _id: string;
  name: string;
  price: number | null;
  image?: string | null;
  slug: string;
  categoryTitle?: string | null;
}

export interface GadgetGoalSearchEntry {
  searchTerm: string;
}

export interface GadgetGoalInput {
  wishlist: GadgetGoalWishlistItem[];
  searchHistory: GadgetGoalSearchEntry[];
}

export type GadgetGoal =
  | {
      kind: "wishlist";
      product: GadgetGoalWishlistItem;
      /** How many times search terms matched this product's name/category */
      matchStrength: number;
    }
  | {
      kind: "search";
      term: string;
      occurrences: number;
    };

/** Minimum repeats before a search term alone counts as a "goal". */
const SEARCH_ONLY_THRESHOLD = 2;

export function deriveGadgetGoal({ wishlist, searchHistory }: GadgetGoalInput): GadgetGoal | null {
  const termCounts = buildTermFrequency(searchHistory);

  if (wishlist.length > 0) {
    let best: { item: GadgetGoalWishlistItem; score: number; index: number } | null = null;

    wishlist.forEach((item, index) => {
      const score = scoreWishlistItem(item, termCounts);
      // Prefer higher score; break ties by most-recently-added (lower index,
      // since the wishlist store prepends new items to the front).
      if (!best || score > best.score || (score === best.score && index < best.index)) {
        best = { item, score, index };
      }
    });

    if (best) {
      return { kind: "wishlist", product: best.item, matchStrength: best.score };
    }
  }

  // No wishlist — fall back to a repeated search term, if any.
  const topTerm = [...termCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTerm && topTerm[1] >= SEARCH_ONLY_THRESHOLD) {
    return { kind: "search", term: topTerm[0], occurrences: topTerm[1] };
  }

  return null;
}

function buildTermFrequency(searchHistory: GadgetGoalSearchEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of searchHistory) {
    const term = entry.searchTerm?.trim().toLowerCase();
    if (!term || term.length < 2) continue;
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return counts;
}

function scoreWishlistItem(item: GadgetGoalWishlistItem, termCounts: Map<string, number>): number {
  const name = item.name?.toLowerCase() ?? "";
  const category = item.categoryTitle?.toLowerCase() ?? "";
  let score = 0;
  for (const [term, count] of termCounts) {
    if (name.includes(term) || category.includes(term)) {
      score += count;
    }
  }
  return score;
}
