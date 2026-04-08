import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { client, writeClient } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";

const REFERRAL_BY_USER_QUERY = defineQuery(
  `*[_type == "referral" && clerkUserId == $clerkUserId][0]`
);
const REFERRAL_BY_CODE_QUERY = defineQuery(
  `*[_type == "referral" && code == $code][0]`
);

// Generate a unique 8-char code from user ID
function generateCode(userId: string, name: string): string {
  const base = (name.split(" ")[0] ?? "REF").toUpperCase().slice(0, 4);
  const hash = userId.slice(-4).toUpperCase();
  return `${base}${hash}`;
}

// GET /api/referral — get or create referral code for current user
export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check existing
  const existing = await client.fetch(REFERRAL_BY_USER_QUERY, { clerkUserId: userId });
  if (existing) {
    return NextResponse.json({ referral: existing });
  }

  // Create new
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User";
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const code = generateCode(userId, name);

  const referral = await writeClient.create({
    _type: "referral",
    clerkUserId: userId,
    email,
    name,
    code,
    clicks: 0,
    conversions: 0,
    totalEarned: 0,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ referral });
}

// POST /api/referral — track a click when someone visits via referral link
export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

    const referral = await client.fetch(REFERRAL_BY_CODE_QUERY, { code });
    if (!referral) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

    // Increment clicks
    await writeClient.patch(referral._id).inc({ clicks: 1 }).commit();

    // Log click doc
    await writeClient.create({
      _type: "referralClick",
      code,
      referrerId: referral.clerkUserId,
      converted: false,
      clickedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, referrerName: referral.name });
  } catch (error) {
    console.error("Referral click error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}