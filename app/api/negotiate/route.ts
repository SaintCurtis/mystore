import { NextRequest, NextResponse } from "next/server";

// In-memory typing state — no DB needed, ephemeral is fine
const typingState = new Map<string, { isTyping: boolean; updatedAt: number }>();
const TYPING_TIMEOUT_MS = 5_000;

// Owner calls POST { sessionId, isTyping: true/false } while typing
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

// Customer polls GET ?sessionId=xxx to check if owner is typing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const state = typingState.get(sessionId);
  // Auto-expire if owner stopped sending heartbeats
  if (state && Date.now() - state.updatedAt > TYPING_TIMEOUT_MS) {
    typingState.delete(sessionId);
    return NextResponse.json({ isTyping: false });
  }
  return NextResponse.json({ isTyping: state?.isTyping ?? false });
}