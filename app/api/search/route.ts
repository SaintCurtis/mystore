import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 10);

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await client.fetch(INSTANT_SEARCH_QUERY, { q, limit });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}