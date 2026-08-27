// app/api/customer/wishlist/route.ts
//
// The wishlist itself still lives client-side (Zustand + localStorage) for
// instant add/remove UX — this route is what turns it into something the
// server can see, so it can appear on the Profile page and feed the
// Gadget Goal engine and birthday email. WishlistSync.tsx POSTs here
// whenever the local store changes.

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { client, writeClient } from "@/sanity/lib/client";
import { getOrCreatePaystackCustomer } from "@/lib/actions/customer";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ productIds: [] });

    const customer = await client.fetch<{ wishlist?: { _ref: string }[] } | null>(
      `*[_type == "customer" && clerkUserId == $userId][0]{ "wishlist": wishlist[]._ref }`,
      { userId }
    );

    return NextResponse.json({ productIds: customer?.wishlist ?? [] });
  } catch (err) {
    console.error("[customer/wishlist GET]", err);
    return NextResponse.json({ productIds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productIds } = (await req.json()) as { productIds?: string[] };
    if (!Array.isArray(productIds)) {
      return NextResponse.json({ error: "productIds must be an array" }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress ?? "";
    const name = user?.fullName ?? user?.firstName ?? "";

    // Ensures a customer doc exists even for someone who hasn't checked out yet.
    const { sanityCustomerId } = await getOrCreatePaystackCustomer(email, name, userId);

    const refs = [...new Set(productIds)].map((id) => ({
      _type: "reference" as const,
      _ref: id,
      _key: id,
    }));

    await writeClient.patch(sanityCustomerId).set({ wishlist: refs }).commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[customer/wishlist POST]", err);
    return NextResponse.json({ error: "Failed to sync wishlist" }, { status: 500 });
  }
}
