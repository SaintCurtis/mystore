// app/api/push/subscribe/route.ts
//
// Saves (POST) or removes (DELETE) this device's push subscription so
// /push/send can reach it. The admin "Enable push alerts" button calls this
// path (/api/push/subscribe).
//
// Admin only: otherwise anyone could register their own phone and receive
// your negotiation alerts, floor prices included.

import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { writeClient } from "@/sanity/lib/client";

// A dot in the id keeps the document private (not readable without a token).
function docIdFor(endpoint: string) {
  return `pushSubscription.${createHash("sha256").update(endpoint).digest("hex").slice(0, 40)}`;
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const subscription = await req.json();
    const endpoint: unknown = subscription?.endpoint;

    if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 },
      );
    }

    await writeClient.createOrReplace({
      _id: docIdFor(endpoint),
      _type: "pushSubscription",
      endpoint,
      // /push/send reads this as a JSON string and JSON.parse()s it.
      subscription: JSON.stringify(subscription),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[push/subscribe] POST", err);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { endpoint } = await req.json();
    if (typeof endpoint !== "string") {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }
    await writeClient.delete(docIdFor(endpoint));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[push/subscribe] DELETE", err);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 },
    );
  }
}
