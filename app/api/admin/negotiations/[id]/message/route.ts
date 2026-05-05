import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
 
const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
 
async function getSessionDoc(sessionId: string) {
  return writeClient.fetch(
    `*[_type == "negotiationSession" && sessionId == $sessionId][0]{ _id, status }`,
    { sessionId }
  );
}
// ── OWNER MESSAGE ─────────────────────────────────────────────────────────
export async function POST_message(
  req: NextRequest,
  sessionId: string
): Promise<NextResponse> {
  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }
 
  const session = await getSessionDoc(sessionId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.status !== "owner_active") {
    return NextResponse.json({ error: "You must take over first" }, { status: 403 });
  }
 
  const newMessage = {
    _key: `owner_${Date.now()}`,
    role: "assistant",
    content: content.trim(),
    sender: "owner",
    timestamp: new Date().toISOString(),
  };
 
  await writeClient.patch(session._id)
    .setIfMissing({ messages: [] })
    .append("messages", [newMessage])
    .set({ lastActivityAt: new Date().toISOString() })
    .commit();
 
  return NextResponse.json({ success: true });
}