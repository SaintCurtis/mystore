import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";

const INSTANT_SEARCH_QUERY = defineQuery(`
  *[
    _type == "product"
    && (
      name match $q + "*"
      || description match $q + "*"
      || category->title match $q + "*"
      || brand->title match $q + "*"
    )
    && stock > 0
  ] | score(
    boost(name match $q + "*", 4),
    boost(brand->title match $q + "*", 2),
    boost(category->title match $q + "*", 1)
  ) | order(_score desc) [0...$limit] {
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