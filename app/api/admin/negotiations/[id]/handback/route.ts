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

// ── HAND BACK ─────────────────────────────────────────────────────────────
export async function POST_handback(
  _req: NextRequest,
  sessionId: string
): Promise<NextResponse> {
  const session = await getSessionDoc(sessionId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
 
  await writeClient.patch(session._id)
    .set({ status: "ai_active", lastActivityAt: new Date().toISOString() })
    .commit();
 
  return NextResponse.json({ success: true });
}