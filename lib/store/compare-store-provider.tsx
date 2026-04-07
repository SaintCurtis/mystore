"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { createCompareStore, type CompareStore, type CompareProduct } from "./compare-store";

type CompareStoreApi = ReturnType<typeof createCompareStore>;
const CompareStoreContext = createContext<CompareStoreApi | undefined>(undefined);

export function CompareStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<CompareStoreApi | null>(null);
  if (!storeRef.current) storeRef.current = createCompareStore();
  return (
    <CompareStoreContext.Provider value={storeRef.current}>
      {children}
    </CompareStoreContext.Provider>
  );
}

function useCompareStore<T>(selector: (store: CompareStore) => T): T {
  const ctx = useContext(CompareStoreContext);
  if (!ctx) throw new Error("useCompareStore must be used within CompareStoreProvider");
  return useStore(ctx, selector);
}

export const useCompareItems   = () => useCompareStore((s) => s.items);
export const useCompareCount   = () => useCompareStore((s) => s.items.length);
export const useIsCompared     = (id: string) => useCompareStore((s) => s.items.some((i) => i.productId === id));
export const useCompareIsOpen  = () => useCompareStore((s) => s.isOpen);
export const useCompareActions = () => {
  const addItem    = useCompareStore((s) => s.addItem);
  const removeItem = useCompareStore((s) => s.removeItem);
  const toggleItem = useCompareStore((s) => s.toggleItem);
  const clearAll   = useCompareStore((s) => s.clearAll);
  const openDrawer = useCompareStore((s) => s.openDrawer);
  const closeDrawer= useCompareStore((s) => s.closeDrawer);
  return { addItem, removeItem, toggleItem, clearAll, openDrawer, closeDrawer };
};