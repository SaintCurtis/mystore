// app/(app)/profile/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/live";
import { ORDERS_BY_USER_QUERY } from "@/lib/sanity/queries/orders";
import {
  CUSTOMER_PROFILE_QUERY,
  LAYAWAY_PLANS_BY_USER_QUERY,
} from "@/lib/sanity/queries/profile";
import { getOrCreatePaystackCustomer } from "@/lib/actions/customer";
import { deriveGadgetGoal } from "@/lib/gadget-goal";
import type { ORDERS_BY_USER_QUERY_RESULT } from "@/sanity.types";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "My Profile | The Saint's TechNet",
  description: "Your orders, wishlist, layaway plans, and account details — all in one place.",
};

// ── Local types for the two new queries (no generated sanity.types entry yet) ──

export interface ProfileWishlistItem {
  _id: string;
  name: string;
  slug: string;
  price: number | null;
  image?: string | null;
  categoryTitle?: string | null;
  stock: number | null;
}

interface CustomerProfileResult {
  _id: string;
  name?: string | null;
  email?: string | null;
  phones?: string[] | null;
  birthday?: string | null;
  birthdayReminders?: string | null;
  birthdaySmsOptIn?: string | null;
  wishlist?: ProfileWishlistItem[] | null;
  searchHistory?: { searchTerm: string; searchedAt: string }[] | null;
}

export interface LayawayPlanResult {
  _id: string;
  planNumber: string;
  status: "active" | "reserved" | "completed" | "cancelled";
  totalAmount: number;
  amountPaid: number;
  paceMonths?: number | null;
  startedAt: string;
  priceLockExpiresAt?: string | null;
  nextPaymentReminderAt?: string | null;
  product: { _id: string; name: string; slug: string; image?: string | null } | null;
  resultingOrderId?: string | null;
  payments: { amount: number; paidAt: string; paystackReference?: string | null }[];
}

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const name = user?.fullName ?? user?.firstName ?? "";

  // Ensures a Sanity customer doc exists even for someone who has never
  // checked out — birthday, wishlist, and layaway all hang off this doc.
  await getOrCreatePaystackCustomer(email, name, userId);

  const [profileResult, layawayResult, ordersResult] = await Promise.all([
    sanityFetch({ query: CUSTOMER_PROFILE_QUERY, params: { clerkUserId: userId } }) as Promise<{
      data: CustomerProfileResult | null;
    }>,
    sanityFetch({ query: LAYAWAY_PLANS_BY_USER_QUERY, params: { clerkUserId: userId } }) as Promise<{
      data: LayawayPlanResult[];
    }>,
    sanityFetch({ query: ORDERS_BY_USER_QUERY, params: { clerkUserId: userId } }) as Promise<{
      data: ORDERS_BY_USER_QUERY_RESULT;
    }>,
  ]);

  const profile = profileResult.data;
  const layawayPlans = layawayResult.data ?? [];
  const orders = ordersResult.data ?? [];

  const gadgetGoal = deriveGadgetGoal({
    wishlist: (profile?.wishlist ?? []).map((w) => ({
      _id: w._id,
      name: w.name,
      price: w.price,
      image: w.image,
      slug: w.slug,
      categoryTitle: w.categoryTitle,
    })),
    searchHistory: profile?.searchHistory ?? [],
  });

  return (
    <ProfileClient
      clerkUser={{ email, name }}
      profile={{
        birthday: profile?.birthday ?? null,
        birthdayReminders: (profile?.birthdayReminders as "enabled" | "disabled" | undefined) ?? "enabled",
        birthdaySmsOptIn: (profile?.birthdaySmsOptIn as "enabled" | "disabled" | undefined) ?? "disabled",
        hasPhone: (profile?.phones?.length ?? 0) > 0,
      }}
      wishlist={profile?.wishlist ?? []}
      layawayPlans={layawayPlans}
      orders={orders}
      gadgetGoal={gadgetGoal}
    />
  );
}
