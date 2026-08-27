"use client";

// components/app/WishlistSync.tsx
//
// Drop this in the root app layout (alongside ReferralTracker). It watches
// the local wishlist store and pushes the product ID list to
// /api/customer/wishlist whenever it changes, debounced so rapid
// add/remove clicks don't fire a request per click. Signed-out visitors
// are skipped — their wishlist stays local-only until they sign in.

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useWishlistItems } from "@/lib/store/wishlist-store-provider";

const SYNC_DEBOUNCE_MS = 1500;

export function WishlistSync() {
  const { isSignedIn } = useUser();
  const items = useWishlistItems();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!isSignedIn) return;

    // Preserve store order (most-recently-added first) — the Gadget Goal
    // engine uses position as a recency signal. Sort only for the cheap
    // "did the set actually change" comparison below.
    const productIds = items.map((i) => i.productId);
    const signature = [...productIds].sort().join(",");
    if (signature === lastSyncedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetch("/api/customer/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      })
        .then((res) => {
          if (res.ok) lastSyncedRef.current = signature;
        })
        .catch(() => {
          // Best-effort — local store is still the source of truth for the
          // current session even if a sync attempt fails.
        });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [items, isSignedIn]);

  return null;
}
