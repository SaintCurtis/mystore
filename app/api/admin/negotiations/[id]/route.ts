import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await serverClient.fetch(
      `*[_type == "negotiationSession" && sessionId == $sessionId][0]{
        _id, sessionId, productName, productSlug,
        listedPrice, floorPrice, customerBid, agreedPrice,
        status, closeBidAlert, startedAt, lastActivityAt,
        messages[]{ role, content, sender, timestamp }
      }`,
      { sessionId: id }
    );
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    console.error("[admin/negotiations/[id]] fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}