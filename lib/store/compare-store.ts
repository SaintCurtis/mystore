import { createStore } from "zustand/vanilla";

export interface CompareProduct {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
  categoryTitle?: string;
  specs?: {
    material?: string;
    color?: string;
    dimensions?: string;
  };
}

export interface CompareState {
  items: CompareProduct[];
  isOpen: boolean;
}

export interface CompareActions {
  addItem: (item: CompareProduct) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: CompareProduct) => void;
  clearAll: () => void;
  hasItem: (productId: string) => boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export type CompareStore = CompareState & CompareActions;

export const MAX_COMPARE = 3;

export const createCompareStore = () =>
  createStore<CompareStore>()((set, get) => ({
    items: [],
    isOpen: false,

    addItem: (item) =>
      set((state) => {
        if (state.items.length >= MAX_COMPARE) return state;
        if (state.items.some((i) => i.productId === item.productId)) return state;
        return { items: [...state.items, item] };
      }),

    removeItem: (productId) =>
      set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

    toggleItem: (item) => {
      const exists = get().items.some((i) => i.productId === item.productId);
      if (exists) {
        set((state) => ({ items: state.items.filter((i) => i.productId !== item.productId) }));
      } else if (get().items.length < MAX_COMPARE) {
        set((state) => ({ items: [...state.items, item] }));
      }
    },

    clearAll: () => set({ items: [], isOpen: false }),
    hasItem: (productId) => get().items.some((i) => i.productId === productId),
    openDrawer: () => set({ isOpen: true }),
    closeDrawer: () => set({ isOpen: false }),
  }));