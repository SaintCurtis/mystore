import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  isAdminRequest,
} from "@/lib/admin-auth";

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/admin/session — the admin layout asks this on load to find out
// whether the browser holds a valid session cookie. The answer comes from the
// server, so editing sessionStorage in the browser console no longer works.
export async function GET(req: Request) {
  return NextResponse.json(
    { authed: isAdminRequest(req) },
    { headers: NO_STORE },
  );
}

// DELETE /api/admin/session — "Sign out": expire the cookie.
export async function DELETE() {
  const res = NextResponse.json({ success: true }, { headers: NO_STORE });
  res.cookies.set(ADMIN_COOKIE_NAME, "", adminCookieOptions(0));
  return res;
}
