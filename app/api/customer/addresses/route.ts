// app/api/customer/addresses/route.ts
// Returns saved addresses for the current signed-in user.
// Called by CheckoutClient on mount to pre-fill the address form.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "next-sanity";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ addresses: [] });

    const customer = await serverClient.fetch<{
      savedAddresses?: {
        _key: string;
        label: string;
        isDefault: boolean;
        name: string;
        line1: string;
        line2: string;
        city: string;
        state: string;
        lga: string;
        postcode: string;
        country: string;
        countryCode: string;
      }[];
    } | null>(
      `*[_type == "customer" && clerkUserId == $userId][0]{
        savedAddresses[]{ _key, label, isDefault, name, line1, line2, city, state, lga, postcode, country, countryCode }
      }`,
      { userId }
    );

    return NextResponse.json({
      addresses: customer?.savedAddresses ?? [],
    });
  } catch (err) {
    console.error("[customer/addresses]", err);
    return NextResponse.json({ addresses: [] });
  }
}