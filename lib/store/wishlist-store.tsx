import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
  categoryTitle?: string;
  addedAt: number; // timestamp for sorting
}

export interface WishlistState {
  items: WishlistItem[];
  isOpen: boolean;
}

export interface WishlistActions {
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: Omit<WishlistItem, "addedAt">) => void;
  clearWishlist: () => void;
  hasItem: (productId: string) => boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlist: () => void;
}

export type WishlistStore = WishlistState & WishlistActions;

export const defaultWishlistState: WishlistState = {
  items: [],
  isOpen: false,
};

// ── Store factory ─────────────────────────────────────────────────

export const createWishlistStore = (
  initState: WishlistState = defaultWishlistState
) => {
  return createStore<WishlistStore>()(
    persist(
      (set, get) => ({
        ...initState,

        addItem: (item) =>
          set((state) => {
            const exists = state.items.some(
              (i) => i.productId === item.productId
            );
            if (exists) return state; // already in wishlist
            return {
              items: [{ ...item, addedAt: Date.now() }, ...state.items],
            };
          }),

        removeItem: (productId) =>
          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          })),

        toggleItem: (item) => {
          const exists = get().items.some((i) => i.productId === item.productId);
          if (exists) {
            set((state) => ({
              items: state.items.filter((i) => i.productId !== item.productId),
            }));
          } else {
            set((state) => ({
              items: [{ ...item, addedAt: Date.now() }, ...state.items],
            }));
          }
        },

        clearWishlist: () => set({ items: [] }),

        hasItem: (productId) =>
          get().items.some((i) => i.productId === productId),

        openWishlist: () => set({ isOpen: true }),
        closeWishlist: () => set({ isOpen: false }),
        toggleWishlist: () => set((state) => ({ isOpen: !state.isOpen })),
      }),
      {
        name: "wishlist-storage",
        skipHydration: true,
        partialize: (state) => ({ items: state.items }),
      }
    )
  );
};