import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// ── PIN verification ───────────────────────────────────────────────────────
//
// Setup instructions:
//
// 1. Generate your bcrypt hash once by running this in your terminal:
//      node -e "const b=require('bcryptjs');b.hash('123456',12).then(h=>console.log(h))"
//    Replace '123456' with your actual 6-digit PIN.
//
// 2. Copy the output hash and add it to your .env:
//      ADMIN_PIN_HASH=$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
// 3. Never store the raw PIN anywhere — only the hash.
//
// ──────────────────────────────────────────────────────────────────────────

const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH ?? "";

// Simple in-memory brute-force protection
// (resets on cold start — good enough for a personal admin)
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 1000 * 60 * 15; // 15 minutes

export async function POST(req: NextRequest) {
  if (!ADMIN_PIN_HASH) {
    console.error("[verify-pin] ADMIN_PIN_HASH is not set in .env");
    return NextResponse.json(
      { error: "Admin PIN not configured" },
      { status: 500 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Check lockout
  const record = attempts.get(ip);
  if (record && Date.now() < record.lockedUntil) {
    const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.` },
      { status: 429 }
    );
  }

  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { pin } = body;

  if (!pin || !/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN must be exactly 6 digits" },
      { status: 400 }
    );
  }

  const valid = await bcrypt.compare(pin, ADMIN_PIN_HASH);

  if (!valid) {
    // Track failed attempt
    const current = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
    const newCount = current.count + 1;

    if (newCount >= MAX_ATTEMPTS) {
      attempts.set(ip, { count: newCount, lockedUntil: Date.now() + LOCKOUT_MS });
    } else {
      attempts.set(ip, { count: newCount, lockedUntil: 0 });
    }

    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  // Success — clear attempts
  attempts.delete(ip);

  return NextResponse.json({ success: true });
}