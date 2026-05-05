import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await writeClient.fetch<{ _id: string } | null>(
      `*[_type == "negotiationSession" && sessionId == $sessionId][0]{ _id }`,
      { sessionId: id }
    );
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await writeClient.patch(session._id)
      .set({ status: "owner_active", lastActivityAt: new Date().toISOString() })
      .commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[takeover]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}