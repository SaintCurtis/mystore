import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { requireAdmin } from "@/lib/admin-auth";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const sessions = await serverClient.fetch(`
      *[_type == "negotiationSession"]
      | order(closeBidAlert desc, lastActivityAt desc) {
        _id, sessionId, productName, productSlug,
        listedPrice, floorPrice, customerBid, agreedPrice,
        status, closeBidAlert, startedAt, lastActivityAt,
        "messageCount": count(messages),
        "lastMessage": messages[-1]{ role, content, sender, timestamp }
      }
    `);
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[admin/negotiations] fetch error:", err);
    return NextResponse.json({ sessions: [] });
  }
}