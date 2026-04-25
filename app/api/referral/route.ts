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

type ReferralDoc = {
  _id: string;
  clerkUserId?: string;
  email?: string;
  name?: string;
  code?: string;
  clicks?: number;
  conversions?: number;
  totalEarned?: number;
  createdAt?: string;
};

function generateCode(userId: string, name: string): string {
  const base = (name.split(" ")[0] ?? "REF").toUpperCase().slice(0, 4);
  const hash = userId.slice(-4).toUpperCase();
  return `${base}${hash}`;
}

// GET — get or create referral for current user
export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await client.fetch(REFERRAL_BY_USER_QUERY, { clerkUserId: userId });
  if (existing) return NextResponse.json({ referral: existing });

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

// POST — track a click
export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

    const referral = await client.fetch(REFERRAL_BY_CODE_QUERY, { code }) as ReferralDoc | null;
    if (!referral) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

    await writeClient.patch(referral._id).inc({ clicks: 1 }).commit();
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

// PATCH — mark conversion after order (call this from your payment webhook)
export async function PATCH(req: Request) {
  try {
    const { code, orderId, rewardAmount } = await req.json();
    if (!code || !orderId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const referral = await client.fetch(REFERRAL_BY_CODE_QUERY, { code }) as ReferralDoc | null;
    if (!referral) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

    await writeClient.patch(referral._id)
      .inc({ conversions: 1, totalEarned: rewardAmount ?? 0 })
      .commit();

    // Mark most recent unconverted click as converted
    const click = await client.fetch(
      `*[_type == "referralClick" && code == $code && converted == false] | order(clickedAt desc) [0]`,
      { code }
    ) as { _id: string } | null;

    if (click?._id) {
      await writeClient.patch(click._id)
        .set({ converted: true, convertedOrderId: orderId })
        .commit();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral conversion error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}