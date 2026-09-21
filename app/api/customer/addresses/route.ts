// app/api/customer/addresses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

// Every customer gets at most this many saved addresses. Enforced here
// (not just in the UI) since the checkout success page also writes to
// this endpoint via a fire-and-forget call.
const MAX_SAVED_ADDRESSES = 2;

function nanoid() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

interface AddressFields {
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
}

interface SavedAddress extends AddressFields {
  _key: string;
  label: string;
  isDefault: boolean;
}

/** Loose match so re-checking out with the same address never creates a duplicate entry. */
function isSameAddress(a: AddressFields, b: AddressFields): boolean {
  const norm = (v?: string) => (v ?? "").trim().toLowerCase();
  return (
    norm(a.line1) === norm(b.line1) &&
    norm(a.city) === norm(b.city) &&
    norm(a.state) === norm(b.state) &&
    norm(a.postcode) === norm(b.postcode) &&
    norm(a.countryCode || a.country) === norm(b.countryCode || b.country)
  );
}

function buildLabel(address: AddressFields): string {
  return `${address.city ?? ""}${address.state ? `, ${address.state}` : ""} — ${address.line1 ?? ""}`.slice(0, 60);
}

async function getCustomer(userId: string) {
  return serverClient.fetch<{
    _id: string;
    savedAddresses?: SavedAddress[];
    phones?: string[];
  } | null>(
    `*[_type == "customer" && clerkUserId == $userId][0]{
      _id,
      "savedAddresses": savedAddresses[]{ _key, label, isDefault, name, line1, line2, city, state, lga, postcode, country, countryCode },
      phones
    }`,
    { userId }
  );
}

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ addresses: [], phones: [] });

    const customer = await getCustomer(userId);

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

    const body = (await req.json()) as {
      address?: AddressFields;
      phone?: string;
      saveAddress?: boolean;
      // "checkout" = fire-and-forget auto-save after an order; the caller
      // never reads the response, so being skipped is never an error.
      // "profile" (default) = an explicit add from the profile page, where
      // hitting the cap should be surfaced to the user.
      source?: "checkout" | "profile";
    };

    const { address = {}, phone, saveAddress = true, source = "profile" } = body;

    const existing = await getCustomer(userId);
    if (!existing) {
      // No customer record yet — nothing to patch, return gracefully
      return NextResponse.json({ success: true, skipped: true, reason: "no_customer" });
    }

    const currentAddresses = existing.savedAddresses ?? [];
    const patchData: Record<string, unknown> = {};
    let addressResult: { skipped: boolean; reason?: string } | null = null;

    if (saveAddress && address.line1 && address.city) {
      const duplicate = currentAddresses.some((a) => isSameAddress(a, address));

      if (duplicate) {
        addressResult = { skipped: true, reason: "duplicate" };
      } else if (currentAddresses.length >= MAX_SAVED_ADDRESSES) {
        addressResult = { skipped: true, reason: "cap_reached" };
      } else {
        const newAddress: SavedAddress = {
          _key: nanoid(),
          label: buildLabel(address),
          isDefault: currentAddresses.length === 0,
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
        patchData.savedAddresses = [...currentAddresses, newAddress];
        addressResult = { skipped: false };
      }
    }

    // Save phone number if new
    const phoneNumber = phone ?? address.phone;
    const existingPhones: string[] = existing.phones ?? [];
    if (phoneNumber && !existingPhones.includes(phoneNumber)) {
      patchData.phones = [...existingPhones, phoneNumber];
    }

    if (Object.keys(patchData).length > 0) {
      await writeClient.patch(existing._id).set(patchData).commit();
      // Same reasoning as the profile route: the Server Component at
      // /profile reads this customer doc through a cached live fetch, so a
      // write here needs an explicit nudge or a reload can still show the
      // pre-write state.
      revalidatePath("/profile");
    }

    return NextResponse.json({
      success: true,
      ...(addressResult?.skipped ? { skipped: true, reason: addressResult.reason } : {}),
      source,
    });
  } catch (err) {
    console.error("[customer/addresses POST]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

/** Edit an existing saved address, or set one as the default. */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      key?: string;
      address?: AddressFields;
      setDefault?: boolean;
    };
    const { key, address, setDefault } = body;
    if (!key) return NextResponse.json({ error: "Missing address key" }, { status: 400 });

    const existing = await getCustomer(userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const currentAddresses = existing.savedAddresses ?? [];
    const targetIndex = currentAddresses.findIndex((a) => a._key === key);
    if (targetIndex === -1) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    const updated = currentAddresses.map((a, i) => {
      if (i !== targetIndex) {
        // If we're setting a new default, every other address loses it.
        return setDefault ? { ...a, isDefault: false } : a;
      }
      const merged: SavedAddress = {
        ...a,
        ...(address ?? {}),
        _key: a._key,
        isDefault: setDefault ? true : a.isDefault,
      };
      if (address) merged.label = buildLabel(merged);
      return merged;
    });

    await writeClient.patch(existing._id).set({ savedAddresses: updated }).commit();
    revalidatePath("/profile");

    return NextResponse.json({ success: true, address: updated[targetIndex] });
  } catch (err) {
    console.error("[customer/addresses PATCH]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key } = (await req.json()) as { key: string };

    const existing = await serverClient.fetch<{ _id: string } | null>(
      `*[_type == "customer" && clerkUserId == $userId][0]{ _id }`,
      { userId }
    );
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await writeClient.patch(existing._id)
      .unset([`savedAddresses[_key == "${key}"]`])
      .commit();
    revalidatePath("/profile");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[customer/addresses DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}