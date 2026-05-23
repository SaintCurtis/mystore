// app/api/negotiate/history/route.ts
// Returns the most recent open negotiation session for the current signed-in
// user + product slug combo. Used by NegotiationChat to resume a session
// on a new device or after clearing localStorage.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { auth } from "@clerk/nextjs/server";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ session: null });
  }

  // Only works for signed-in users
  let userId: string | null = null;
  try {
    const { userId: id } = await auth();
    userId = id;
  } catch {}

  if (!userId) {
    return NextResponse.json({ session: null });
  }

  try {
    const session = await serverClient.fetch<{
      sessionId: string;
      status: string;
      messages: { role: string; content: string; sender: string; timestamp: string }[];
    } | null>(
      `*[
        _type == "negotiationSession" &&
        userId == $userId &&
        productSlug == $slug &&
        status in ["ai_active", "owner_active"]
      ] | order(lastActivityAt desc) [0] {
        sessionId,
        status,
        messages[]{ role, content, sender, timestamp }
      }`,
      { userId, slug }
    );

    if (!session || !session.messages?.length) {
      return NextResponse.json({ session: null });
    }

    const lastOwnerMsg = [...(session.messages ?? [])]
      .reverse()
      .find((m) => m.sender === "owner");

    return NextResponse.json({
      sessionId: session.sessionId,
      messages: session.messages,
      lastOwnerTimestamp: lastOwnerMsg?.timestamp ?? null,
    });
  } catch (err) {
    console.error("[negotiate/history]", err);
    return NextResponse.json({ session: null });
  }
}