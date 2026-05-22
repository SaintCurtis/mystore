// app/api/negotiate/typing/route.ts
// Ephemeral in-memory typing indicator.
// Owner POSTs { sessionId, isTyping: true } every 2s while typing.
// Customer polls GET ?sessionId=xxx every 3s to check.
// Auto-expires after 5s of no heartbeat.

import { NextRequest, NextResponse } from "next/server";

const typingState = new Map<string, { isTyping: boolean; updatedAt: number }>();
const TYPING_TIMEOUT_MS = 5_000;

// Owner → POST { sessionId, isTyping: boolean }
export async function POST(req: NextRequest) {
  try {
    const { sessionId, isTyping } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    if (isTyping) {
      typingState.set(sessionId, { isTyping: true, updatedAt: Date.now() });
    } else {
      typingState.delete(sessionId);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Customer → GET ?sessionId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const state = typingState.get(sessionId);
  if (state && Date.now() - state.updatedAt > TYPING_TIMEOUT_MS) {
    typingState.delete(sessionId);
    return NextResponse.json({ isTyping: false });
  }
  return NextResponse.json({ isTyping: state?.isTyping ?? false });
}