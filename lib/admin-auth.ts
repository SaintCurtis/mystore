/**
 * Server-side admin session.
 *
 * Why this exists: the PIN screen used to live entirely in the browser
 * (a sessionStorage flag), and /api/admin/* never checked anything, so the
 * PIN protected the *screen* but not the *data or actions behind it*. Now,
 * when /api/admin/verify-pin accepts the PIN it also hands the browser a
 * signed, httpOnly cookie. Every admin API route calls requireAdmin() and
 * refuses to run without a valid one. JavaScript on the page can't read or
 * forge the cookie, and it can't be created without the PIN.
 *
 * Token format:  v1.<expiresAtEpochSeconds>.<nonce>.<hmac-sha256 signature>
 *
 * Signing secret: ADMIN_SESSION_SECRET if you set it, otherwise it falls back
 * to ADMIN_PIN_HASH (already in your environment). The fallback has a nice
 * side effect: changing the PIN changes the hash, which signs out every
 * existing session at once.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours, same as before

const TOKEN_VERSION = "v1";
const CLOCK_SKEW_SECONDS = 60;

function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PIN_HASH;
  return secret && secret.length >= 16 ? secret : null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Mint a fresh session token. Returns null if no signing secret is configured. */
export function createAdminSessionToken(
  nowMs: number = Date.now(),
): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const expiresAt = Math.floor(nowMs / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const nonce = randomBytes(12).toString("base64url");
  const payload = `${TOKEN_VERSION}.${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** True only for an untampered, unexpired token signed with our secret. */
export function verifyAdminSessionToken(
  token: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, expiresAtRaw, nonce, signature] = parts;
  if (version !== TOKEN_VERSION) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isInteger(expiresAt)) return false;
  const nowSeconds = Math.floor(nowMs / 1000);
  if (expiresAt < nowSeconds) return false; // expired
  if (expiresAt > nowSeconds + ADMIN_SESSION_TTL_SECONDS + CLOCK_SKEW_SECONDS)
    return false; // implausible

  const expected = sign(`${version}.${expiresAtRaw}.${nonce}`, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

export function isAdminRequest(req: Request): boolean {
  return verifyAdminSessionToken(readCookie(req, ADMIN_COOKIE_NAME));
}

/**
 * Put this at the top of every admin-only route handler:
 *
 *   const denied = requireAdmin(req);
 *   if (denied) return denied;
 *
 * Returns a ready-made 401/403 response when the caller isn't the signed-in
 * admin, or null when it's fine to continue.
 */
export function requireAdmin(req: Request): NextResponse | null {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Belt and braces on top of SameSite=Strict: a state-changing request that
  // names a different site as its origin is never ours.
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json(
            { error: "Forbidden" },
            { status: 403, headers: { "Cache-Control": "no-store" } },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
  }

  return null;
}

/**
 * For server-to-server calls (for example the negotiation route asking
 * /push/send to notify you). Accepts either the admin cookie or
 * "Authorization: Bearer <CRON_SECRET>".
 */
export function requireAdminOrInternal(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (cronSecret && header) {
    const expected = Buffer.from(`Bearer ${cronSecret}`);
    const given = Buffer.from(header);
    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      return null;
    }
  }
  return requireAdmin(req);
}

export function adminCookieOptions(
  maxAgeSeconds: number = ADMIN_SESSION_TTL_SECONDS,
) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * For server-rendered admin PAGES (not API routes). A page that fetches data
 * on the server sends that data to the browser inside the page payload even
 * if the client-side PIN screen is still showing, so these pages check the
 * session cookie before they query anything:
 *
 *   if (!(await isAdminSession())) return null;
 *
 * The admin layout refreshes the page right after a correct PIN so the data
 * appears without a manual reload.
 */
export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
}
