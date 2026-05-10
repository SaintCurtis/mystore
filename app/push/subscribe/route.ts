import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

// Customer polls this every 3s to check if owner has sent a message
// Query param: ?after=<ISO timestamp of last message seen>
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
      messages: { role: string; content: string; sender: string; timestamp: string }[];
    } | null>(
      `*[_type == "negotiationSession" && sessionId == $sessionId][0]{
        status,
        messages[]{ role, content, sender, timestamp }
      }`,
      { sessionId }
    );

    if (!session) {
      return NextResponse.json({ messages: [], status: "not_found" });
    }

    // Return new owner messages since `after` timestamp
    const newOwnerMessages = (session.messages ?? []).filter((m) => {
      if (m.sender !== "owner") return false;
      if (!after) return true;
      return m.timestamp > after;
    });

    return NextResponse.json({
      status: session.status,
      messages: newOwnerMessages,
    });
  } catch (err) {
    console.error("[poll-owner-messages]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}