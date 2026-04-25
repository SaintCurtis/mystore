"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Drop this in your root layout (inside a Suspense boundary).
 * It silently fires a click tracking event when someone arrives
 * via a referral link (?ref=CODE) and stores the code in sessionStorage
 * so the checkout flow can attribute the conversion.
 */
export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    // Store for checkout attribution
    sessionStorage.setItem("referralCode", ref);

    // Fire click tracking (fire and forget)
    fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    }).catch(() => {});
  }, [searchParams]);

  return null;
}