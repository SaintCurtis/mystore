import { NextResponse } from "next/server";

let cachedRate: number | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const FALLBACK_RATE = 1600; // NGN per 1 USD

export async function GET() {
  const now = Date.now();

  // Return cached rate if fresh
  if (cachedRate && now - cacheTime < CACHE_DURATION) {
    return NextResponse.json({ rate: cachedRate, cached: true });
  }

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const ngnRate = data?.rates?.NGN;
      if (ngnRate && ngnRate > 0) {
        cachedRate = ngnRate;
        cacheTime = now;
        return NextResponse.json({ rate: ngnRate, cached: false });
      }
    }
  } catch {
    // Fall through to fallback
  }

  return NextResponse.json({ rate: cachedRate ?? FALLBACK_RATE, cached: true, fallback: true });
}