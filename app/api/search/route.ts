import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { client, writeClient } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";

// ── FIX: score() must WRAP the filter, not be piped after it.
// Incorrect: *[...filter...] | score(...) | order(_score desc)
// Correct:   *[ _type == "product" ] | score(...) [filter inside score conditions]
//
// Simplest reliable approach: filter first with match, order by score manually
// using a separate scoring field — OR just use plain match without score().
//
// Sanity's score() only works reliably when the entire query is wrapped.
// The safest cross-version approach is to drop score() and use match + order by name.

const INSTANT_SEARCH_QUERY = defineQuery(`
  *[
    _type == "product"
    && stock > 0
    && (
      name match $q + "*"
      || pt::text(description) match $q + "*"
      || category->title match $q + "*"
      || brand->title match $q + "*"
    )
  ] | order(name asc) [0...$limit] {
    _id,
    name,
    "slug": slug.current,
    price,
    "image": images[0].asset->url,
    "categoryTitle": category->title,
  }
`);

// Most recent N search entries kept per customer — enough for the Gadget
// Goal engine to spot a repeated term without the array growing forever.
const SEARCH_HISTORY_LIMIT = 40;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 10);

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await client.fetch(INSTANT_SEARCH_QUERY, { q, limit });

    // Best-effort, fire-and-forget — a logging failure should never break
    // search results for the person searching.
    logSearchTerm(q).catch((err) => console.error("[search] logSearchTerm failed:", err));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

// Debounced instant-search means one typed phrase produces several calls
// here ("mac" → "macbo" → "macbook" as the person keeps typing). If the new
// term is just the previous one extended (or shortened, on backspace) within
// this window, treat it as the same search and overwrite the last entry
// instead of logging every intermediate fragment.
const COALESCE_WINDOW_MS = 60_000;

async function logSearchTerm(term: string) {
  const { userId } = await auth();
  if (!userId) return; // only logged-in customers build a Gadget Goal history

  const existing = await client.fetch<
    { _id: string; searchHistory?: { _key: string; searchTerm: string; searchedAt: string }[] } | null
  >(
    `*[_type == "customer" && clerkUserId == $userId][0]{ _id, searchHistory }`,
    { userId }
  );
  if (!existing) return; // no customer doc yet (hasn't checked out or synced anything) — skip

  const history = existing.searchHistory ?? [];
  const last = history[history.length - 1];
  const lowerTerm = term.toLowerCase();

  const isSameTypingBurst =
    last &&
    Date.now() - new Date(last.searchedAt).getTime() < COALESCE_WINDOW_MS &&
    (lowerTerm.startsWith(last.searchTerm.toLowerCase()) || last.searchTerm.toLowerCase().startsWith(lowerTerm));

  const entry = { _key: `search-${Date.now()}`, searchTerm: term, searchedAt: new Date().toISOString() };
  const nextHistory = isSameTypingBurst
    ? [...history.slice(0, -1), entry]
    : [...history, entry];

  await writeClient.patch(existing._id).set({ searchHistory: nextHistory.slice(-SEARCH_HISTORY_LIMIT) }).commit();
}
