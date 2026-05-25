// app/api/negotiate/owner-messages/route.ts
// Customer polls this every 3s.
// CHANGE: now returns agreedPrice when status === "deal_struck"
// so the customer's chat immediately shows the Pay button when
// the owner strikes the deal from the admin dashboard.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const after = searchParams.get("after");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const session = await serverClient.fetch<{
      status: string;
      agreedPrice?: number;
      messages: { role: string; content: string; sender: string; timestamp: string }[];
    } | null>(
      `*[_type == "negotiationSession" && sessionId == $sessionId][0]{
        status,
        agreedPrice,
        messages[]{ role, content, sender, timestamp }
      }`,
      { sessionId }
    );

    if (!session) {
      return NextResponse.json({ messages: [], status: "not_found" });
    }

    const newOwnerMessages = (session.messages ?? []).filter((m) => {
      if (m.sender !== "owner") return false;
      if (!after) return true;
      return m.timestamp > after;
    });

    return NextResponse.json({
      status: session.status,
      messages: newOwnerMessages,
      // Return agreedPrice when deal is struck so customer sees Pay button
      ...(session.status === "deal_struck" && session.agreedPrice
        ? { agreedPrice: session.agreedPrice }
        : {}),
    });
  } catch (err) {
    console.error("[poll-owner-messages]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}