// app/api/customer/addresses/route.ts
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

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

function nanoid() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ addresses: [], phones: [] });

    const customer = await serverClient.fetch<{
      savedAddresses?: object[];
      phones?: string[];
    } | null>(
      `*[_type == "customer" && clerkUserId == $userId][0]{
        savedAddresses[]{ _key, label, isDefault, name, line1, line2, city, state, lga, postcode, country, countryCode },
        phones
      }`,
      { userId }
    );

    return NextResponse.json({
      addresses: customer?.savedAddresses ?? [],
      phones: customer?.phones ?? [],
    });
  } catch (err) {
    console.error("[customer/addresses GET]", err);
    return NextResponse.json({ addresses: [], phones: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      address?: {
        name?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        lga?: string;
        postcode?: string;
        country?: string;
        countryCode?: string;
      };
      phone?: string;
      saveAddress?: boolean;
    };

    const { address = {}, phone, saveAddress = true } = body;

    // Fetch existing customer record
    const existing = await serverClient.fetch<{
      _id: string;
      savedAddresses?: { _key: string }[];
      phones?: string[];
    } | null>(
      `*[_type == "customer" && clerkUserId == $userId][0]{ _id, savedAddresses, phones }`,
      { userId }
    );

    if (!existing) {
      // No customer record yet — nothing to patch, return gracefully
      return NextResponse.json({ success: true, skipped: true });
    }

    const patch = writeClient.patch(existing._id);
    let didSomething = false;

    // Save address if requested and we have enough data
    if (saveAddress && address.line1 && address.city) {
      const newAddress = {
        _key: nanoid(),
        label: `${address.city}${address.state ? `, ${address.state}` : ""} — ${address.line1}`.slice(0, 60),
        isDefault: !(existing.savedAddresses?.length),
        name: address.name ?? "",
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        state: address.state ?? "",
        lga: address.lga ?? "",
        postcode: address.postcode ?? "",
        country: address.country ?? "",
        countryCode: address.countryCode ?? "",
      };
      patch.setIfMissing({ savedAddresses: [] }).append("savedAddresses", [newAddress]);
      didSomething = true;
    }

    // Save phone number if new
    const phoneNumber = phone ?? address.phone;
    const existingPhones: string[] = existing.phones ?? [];
    if (phoneNumber && !existingPhones.includes(phoneNumber)) {
      patch.set({ phones: [...existingPhones, phoneNumber] });
      didSomething = true;
    }

    if (didSomething) await patch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[customer/addresses POST]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key } = await req.json() as { key: string };

    const existing = await serverClient.fetch<{ _id: string } | null>(
      `*[_type == "customer" && clerkUserId == $userId][0]{ _id }`,
      { userId }
    );
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await writeClient.patch(existing._id)
      .unset([`savedAddresses[_key == "${key}"]`])
      .commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[customer/addresses DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}