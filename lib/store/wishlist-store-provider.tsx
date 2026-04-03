"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  createWishlistStore,
  type WishlistStore,
  type WishlistState,
  defaultWishlistState,
} from "./wishlist-store";

// ── Store API type ────────────────────────────────────────────────
export type WishlistStoreApi = ReturnType<typeof createWishlistStore>;

// ── Context ───────────────────────────────────────────────────────
const WishlistStoreContext = createContext<WishlistStoreApi | undefined>(
  undefined
);

// ── Provider ──────────────────────────────────────────────────────
interface WishlistStoreProviderProps {
  children: ReactNode;
  initialState?: WishlistState;
}

export const WishlistStoreProvider = ({
  children,
  initialState,
}: WishlistStoreProviderProps) => {
  const storeRef = useRef<WishlistStoreApi | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createWishlistStore(
      initialState ?? defaultWishlistState
    );
  }

  // Manually rehydrate from localStorage on client mount
  useEffect(() => {
    storeRef.current?.persist.rehydrate();
  }, []);

  return (
    <WishlistStoreContext.Provider value={storeRef.current}>
      {children}
    </WishlistStoreContext.Provider>
  );
};

// ── Base hook ─────────────────────────────────────────────────────
export const useWishlistStore = <T,>(
  selector: (store: WishlistStore) => T
): T => {
  const ctx = useContext(WishlistStoreContext);
  if (!ctx) {
    throw new Error(
      "useWishlistStore must be used within WishlistStoreProvider"
    );
  }
  return useStore(ctx, selector);
};

// ── Convenience hooks ─────────────────────────────────────────────

export const useWishlistItems = () =>
  useWishlistStore((s) => s.items);

export const useWishlistCount = () =>
  useWishlistStore((s) => s.items.length);

export const useIsWishlisted = (productId: string) =>
  useWishlistStore((s) => s.items.some((i) => i.productId === productId));

export const useWishlistIsOpen = () =>
  useWishlistStore((s) => s.isOpen);

export const useWishlistActions = () => {
  const addItem     = useWishlistStore((s) => s.addItem);
  const removeItem  = useWishlistStore((s) => s.removeItem);
  const toggleItem  = useWishlistStore((s) => s.toggleItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const openWishlist  = useWishlistStore((s) => s.openWishlist);
  const closeWishlist = useWishlistStore((s) => s.closeWishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  return {
    addItem,
    removeItem,
    toggleItem,
    clearWishlist,
    openWishlist,
    closeWishlist,
    toggleWishlist,
  };
};