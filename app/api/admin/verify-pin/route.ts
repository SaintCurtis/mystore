import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  adminCookieOptions,
  createAdminSessionToken,
} from "@/lib/admin-auth";
import { reserveAttempt, resetAttempts } from "@/lib/admin-lockout";

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
//    In a local .env.local file, escape every "$" in the hash as "\$"
//    (otherwise the file loader treats $2a, $12 ... as variables and mangles
//    the hash). In Vercel's Environment Variables screen paste it as-is.
//
// 3. Never store the raw PIN anywhere — only the hash.
//
// 4. Optional: set ADMIN_SESSION_SECRET (any long random string) to sign the
//    session cookie with its own secret. If you leave it out, the cookie is
//    signed with ADMIN_PIN_HASH, so changing the PIN signs everyone out.
//
// What happens on a correct PIN: the response sets an httpOnly cookie that
// every /api/admin/* route now requires (see lib/admin-auth.ts).
//
// ──────────────────────────────────────────────────────────────────────────

const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH ?? "";

// Per-IP limiter held in memory. It resets on a cold start, so it is only the
// first line of defence; the durable limit in lib/admin-lockout.ts is the
// one that actually stops guessing at scale.
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 1000 * 60 * 15; // 15 minutes

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  if (!ADMIN_PIN_HASH) {
    console.error("[verify-pin] ADMIN_PIN_HASH is not set in .env");
    return NextResponse.json(
      { error: "Admin PIN not configured" },
      { status: 500, headers: NO_STORE }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Per-IP lockout
  const record = attempts.get(ip);
  if (record && Date.now() < record.lockedUntil) {
    const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.` },
      { status: 429, headers: NO_STORE }
    );
  }

  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: NO_STORE });
  }

  const { pin } = body;

  if (!pin || typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN must be exactly 6 digits" },
      { status: 400, headers: NO_STORE }
    );
  }

  // Durable limit: counted before the PIN is compared, so parallel guesses
  // can't all slip through while the counter catches up.
  const reservation = await reserveAttempt();
  if (!reservation.allowed) {
    const minutes = Math.max(1, Math.ceil(reservation.retryAfterSeconds / 60));
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.` },
      {
        status: 429,
        headers: { ...NO_STORE, "Retry-After": String(reservation.retryAfterSeconds) },
      }
    );
  }

  const valid = await bcrypt.compare(pin, ADMIN_PIN_HASH);

  if (!valid) {
    const current = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
    const newCount = current.count + 1;

    if (newCount >= MAX_ATTEMPTS) {
      attempts.set(ip, { count: newCount, lockedUntil: Date.now() + LOCKOUT_MS });
    } else {
      attempts.set(ip, { count: newCount, lockedUntil: 0 });
    }

    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401, headers: NO_STORE });
  }

  // Success — clear counters and start the session
  attempts.delete(ip);
  await resetAttempts();

  const token = createAdminSessionToken();
  if (!token) {
    console.error("[verify-pin] No signing secret available for the session cookie");
    return NextResponse.json(
      { error: "Admin session not configured" },
      { status: 500, headers: NO_STORE }
    );
  }

  const res = NextResponse.json(
    { success: true, expiresInSeconds: ADMIN_SESSION_TTL_SECONDS },
    { headers: NO_STORE }
  );
  res.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions());
  return res;
}
