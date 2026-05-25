// app/api/admin/negotiations/[id]/deal/route.ts
// Owner manually strikes a deal at an agreed price.
// Sets status to "deal_struck" and agreedPrice on the session.
// The customer's polling loop will pick this up within 3 seconds
// and show the green "Deal agreed! Pay now" card.

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { agreedPrice } = await req.json();

    if (!agreedPrice || typeof agreedPrice !== "number" || agreedPrice <= 0) {
      return NextResponse.json({ error: "Valid agreedPrice required" }, { status: 400 });
    }

    // Find the session document
    const session = await writeClient.fetch<{
      _id: string;
      floorPrice: number;
      listedPrice: number;
      status: string;
    } | null>(
      `*[_type == "negotiationSession" && sessionId == $sessionId][0]{
        _id, floorPrice, listedPrice, status
      }`,
      { sessionId: id }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "deal_struck" || session.status === "closed") {
      return NextResponse.json({ error: "Session already closed" }, { status: 400 });
    }

    // Note: Owner can deliberately go below floor (emotional/strategic decision).
    // We just log it for awareness but don't block it.
    if (session.floorPrice && agreedPrice < session.floorPrice) {
      console.warn(`[deal] Owner went below floor: agreed ₦${agreedPrice} vs floor ₦${session.floorPrice}`);
    }

    // Append a deal confirmation message to the conversation
    const dealMessage = {
      _key: `deal_${Date.now()}`,
      role: "assistant",
      content: `We have a deal! ₦${agreedPrice.toLocaleString()} — pleasure doing business with you. Proceed to payment below.`,
      sender: "owner",
      timestamp: new Date().toISOString(),
    };

    await writeClient
      .patch(session._id)
      .set({
        status: "deal_struck",
        agreedPrice,
        lastActivityAt: new Date().toISOString(),
      })
      .setIfMissing({ messages: [] })
      .append("messages", [dealMessage])
      .commit();

    return NextResponse.json({ success: true, agreedPrice });
  } catch (err) {
    console.error("[deal]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}