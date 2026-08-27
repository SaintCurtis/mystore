// app/api/cron/birthday-greetings/route.ts
//
// Triggered by Vercel Cron (see vercel.json) once a day. Protected by
// CRON_SECRET so it can't be hit by anyone who finds the URL.
//
// GROQ has no reliable built-in month()/day() extraction, so this pulls
// every customer with a birthday set (a lean projection — just the fields
// needed here) and does the "is it their birthday" check in JS against
// the stored "YYYY-MM-DD" string. Fine for a once-a-day job.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { client, writeClient } from "@/sanity/lib/client";
import { sendSms } from "@/lib/sms/termii";
import { deriveGadgetGoal, type GadgetGoal } from "@/lib/gadget-goal";
import { monthDayKey, todayMonthDayKey } from "@/lib/birthday";
import { SITE_URL } from "@/lib/constants/site";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL || "The Saint's TechNet <notifications@buyfromsaint.com>";

interface CustomerBirthdayRow {
  _id: string;
  clerkUserId?: string;
  name?: string;
  email?: string;
  phones?: string[];
  birthday: string;
  birthdayReminders?: string;
  birthdaySmsOptIn?: string;
  lastBirthdayGreetingSentYear?: number;
  wishlist?: { _id: string; name: string; price: number | null; image?: string | null; slug: string; categoryTitle?: string | null }[];
  searchHistory?: { searchTerm: string }[];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayKey = todayMonthDayKey();
  const currentYear = new Date().getFullYear();

  const customers = await client.fetch<CustomerBirthdayRow[]>(
    `*[_type == "customer" && defined(birthday)]{
      _id, clerkUserId, name, email, phones, birthday,
      birthdayReminders, birthdaySmsOptIn, lastBirthdayGreetingSentYear,
      "wishlist": wishlist[]->{
        _id, name, price, "image": images[0].asset->url, "slug": slug.current, "categoryTitle": category->title
      },
      searchHistory
    }`
  );

  const dueToday = customers.filter(
    (c) =>
      monthDayKey(c.birthday) === todayKey &&
      c.lastBirthdayGreetingSentYear !== currentYear
  );

  const results = { checked: customers.length, due: dueToday.length, emailsSent: 0, smsSent: 0, failed: 0 };

  for (const customer of dueToday) {
    try {
      const goal = deriveGadgetGoal({
        wishlist: customer.wishlist ?? [],
        searchHistory: customer.searchHistory ?? [],
      });

      if (customer.birthdayReminders !== "disabled" && customer.email) {
        await resend.emails.send({
          from: RESEND_FROM,
          to: customer.email,
          subject: `🎉 Happy Birthday from The Saint's TechNet, ${firstName(customer.name)}!`,
          html: birthdayEmailHtml(firstName(customer.name), goal),
        });
        results.emailsSent++;
      }

      if (customer.birthdaySmsOptIn === "enabled" && customer.phones?.[0]) {
        const smsResult = await sendSms(
          customer.phones[0],
          `Happy Birthday ${firstName(customer.name)}! From all of us at The Saint's TechNet. Visit ${SITE_URL} for a birthday surprise.`
        );
        if (smsResult.success) results.smsSent++;
      }

      await writeClient
        .patch(customer._id)
        .set({ lastBirthdayGreetingSentYear: currentYear })
        .commit();
    } catch (err) {
      console.error(`[birthday-cron] Failed for customer ${customer._id}:`, err);
      results.failed++;
    }
  }

  return NextResponse.json(results);
}

function firstName(name?: string): string {
  return name?.trim().split(" ")[0] || "there";
}

function birthdayEmailHtml(name: string, goal: GadgetGoal | null): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  const goalBlock = (() => {
    if (!goal) return "";
    if (goal.kind === "wishlist") {
      return `
        <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#71717a;margin:0 0 8px 0;">Still on your list</p>
          <p style="font-size:15px;font-weight:700;color:#18181b;margin:0 0 4px 0;">${goal.product.name}</p>
          <p style="font-size:13px;color:#3f3f46;margin:0 0 12px 0;">${fmt(goal.product.price ?? 0)}</p>
          <a href="${SITE_URL}/products/${goal.product.slug}" style="display:inline-block;background:#1a56db;color:white;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;text-decoration:none;">View it →</a>
        </div>`;
    }
    return `
      <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="font-size:13px;color:#3f3f46;margin:0;">
          We noticed you've been searching for <strong>${escapeHtml(goal.term)}</strong> —
          want a hand finding the right one? Just reply to this email.
        </p>
      </div>`;
  })();

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#09090b;padding:28px;text-align:center;">
      <p style="font-size:32px;margin:0 0 8px 0;">🎉</p>
      <p style="color:#1a56db;font-weight:800;font-size:20px;margin:0;">Happy Birthday, ${escapeHtml(name)}!</p>
    </div>
    <div style="padding:28px;">
      <p style="font-size:14px;color:#3f3f46;line-height:1.7;margin:0;">
        Everyone at The Saint's TechNet is wishing you a fantastic day. Thank you for being
        part of our community — we hope this year brings you closer to every gadget on your list.
      </p>
      ${goalBlock}
      <p style="font-size:12px;color:#a1a1aa;margin:20px 0 0 0;">
        Engineer-Verified. Community-Trusted. — The Saint's TechNet
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
