// app/api/customer/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { client, writeClient } from "@/sanity/lib/client";
import { getOrCreatePaystackCustomer } from "@/lib/actions/customer";
import { CUSTOMER_PROFILE_QUERY } from "@/lib/sanity/queries/profile";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ profile: null });

    const profile = await client.fetch(CUSTOMER_PROFILE_QUERY, { clerkUserId: userId });
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[customer/profile GET]", err);
    return NextResponse.json({ profile: null });
  }
}

interface ProfilePatchBody {
  birthday?: string; // "YYYY-MM-DD"
  birthdayReminders?: "enabled" | "disabled";
  birthdaySmsOptIn?: "enabled" | "disabled";
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as ProfilePatchBody;
    const patch: Record<string, unknown> = {};

    if (body.birthday !== undefined) {
      if (!DATE_RE.test(body.birthday)) {
        return NextResponse.json({ error: "Invalid birthday format" }, { status: 400 });
      }
      const [year] = body.birthday.split("-").map(Number);
      const currentYear = new Date().getFullYear();
      if (year < currentYear - 120 || year > currentYear) {
        return NextResponse.json({ error: "Invalid birthday" }, { status: 400 });
      }
      patch.birthday = body.birthday;
    }

    if (body.birthdayReminders !== undefined) {
      if (!["enabled", "disabled"].includes(body.birthdayReminders)) {
        return NextResponse.json({ error: "Invalid value" }, { status: 400 });
      }
      patch.birthdayReminders = body.birthdayReminders;
    }

    if (body.birthdaySmsOptIn !== undefined) {
      if (!["enabled", "disabled"].includes(body.birthdaySmsOptIn)) {
        return NextResponse.json({ error: "Invalid value" }, { status: 400 });
      }
      patch.birthdaySmsOptIn = body.birthdaySmsOptIn;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Ensure a customer doc exists (covers a brand-new user who hasn't checked out)
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress ?? "";
    const name = user?.fullName ?? user?.firstName ?? "";
    const { sanityCustomerId } = await getOrCreatePaystackCustomer(email, name, userId);

    await writeClient.patch(sanityCustomerId).set(patch).commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[customer/profile PATCH]", err);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
