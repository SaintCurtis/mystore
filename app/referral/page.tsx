import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import {
  REFERRAL_BY_USER_QUERY,
  REFERRAL_CLICKS_BY_CODE_QUERY,
  REFERRAL_LEADERBOARD_QUERY,
} from "@/lib/sanity/queries/referral";
import { ReferralDashboard } from "@/components/app/ReferralDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn | The Saint's TechNet",
  description: "Share your referral link and earn rewards for every friend who shops with us.",
};

export default async function ReferralPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Fetch or create referral doc via API
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystore-drab-nine.vercel.app";

  // Try to get existing referral
  let referral = await client.fetch(REFERRAL_BY_USER_QUERY, { clerkUserId: userId });

  // If none exists, create via the API
  if (!referral) {
    try {
      const res = await fetch(`${baseUrl}/api/referral`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        referral = data.referral;
      }
    } catch {
      // proceed with null referral
    }
  }

  // Fetch click history and leaderboard in parallel
  const [clicks, leaderboard] = await Promise.all([
    referral?.code
      ? client.fetch(REFERRAL_CLICKS_BY_CODE_QUERY, { code: referral.code })
      : Promise.resolve([]),
    client.fetch(REFERRAL_LEADERBOARD_QUERY),
  ]);

  const referralUrl = referral?.code
    ? `${baseUrl}/?ref=${referral.code}`
    : null;

  return (
    <ReferralDashboard
      referral={referral}
      referralUrl={referralUrl}
      clicks={clicks ?? []}
      leaderboard={leaderboard ?? []}
      userName={user.firstName ?? user.emailAddresses[0]?.emailAddress ?? ""}
    />
  );
}