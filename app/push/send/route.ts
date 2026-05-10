import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import webpush from "web-push";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

webpush.setVapidDetails(
  `mailto:${process.env.OWNER_EMAIL ?? "admin@saintstechnet.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { title, body, url } = await req.json();

    // Fetch all stored push subscriptions
    const subs = await serverClient.fetch<{ subscription: string }[]>(
      `*[_type == "pushSubscription"]{ subscription }`
    );

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions registered" });
    }

    const payload = JSON.stringify({ title, body, url });
    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          const parsed = JSON.parse(sub.subscription);
          await webpush.sendNotification(parsed, payload);
          sent++;
        } catch (err) {
          console.error("[push-send] Failed to send to subscription:", err);
          failed++;
        }
      })
    );

    console.log(`[push-send] Sent: ${sent}, Failed: ${failed}`);
    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("[push-send]", err);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}