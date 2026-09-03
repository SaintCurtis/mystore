// app/(admin)/admin/negotiations/page.tsx
// FIX: sorted by lastActivityAt desc so newest sessions appear at the top

import { createClient } from "next-sanity";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RefreshCw, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

async function getSessions() {
  return serverClient.fetch<{
    _id: string;
    sessionId: string;
    productName: string;
    productSlug: string;
    listedPrice: number;
    floorPrice: number;
    customerBid?: number;
    agreedPrice?: number;
    status: string;
    closeBidAlert: boolean;
    startedAt: string;
    lastActivityAt: string;
    userEmail?: string;
    messages: { content: string; sender: string }[];
  }[]>(
    // ── KEY FIX: order by lastActivityAt desc ──────────────────────────
    `*[_type == "negotiationSession"] | order(lastActivityAt desc) {
      _id, sessionId, productName, productSlug,
      listedPrice, floorPrice, customerBid, agreedPrice,
      status, closeBidAlert, startedAt, lastActivityAt,
      userEmail,
      messages[]{ content, sender }
    }`
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusBadge(status: string, alert: boolean) {
  if (alert && status === "ai_active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
        <Bell className="h-3 w-3" /> Needs Attention
      </span>
    );
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
      status === "ai_active"    && "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
      status === "owner_active" && "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
      status === "deal_struck"  && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      status === "closed"       && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    )}>
      {status === "ai_active"    && "🤖 AI Active"}
      {status === "owner_active" && "👤 You're Live"}
      {status === "deal_struck"  && "🤝 Deal Struck"}
      {status === "closed"       && "❌ Closed"}
    </span>
  );
}

export const revalidate = 0; // Always fresh

export default async function NegotiationsPage() {
  const sessions = await getSessions();

  const needsAttention = sessions.filter((s) => s.closeBidAlert && s.status === "ai_active");
  const active = sessions.filter((s) => s.status === "ai_active" || s.status === "owner_active");
  const total = sessions.length;

  // Last message preview
  function lastMsg(session: typeof sessions[number]) {
    const msgs = session.messages ?? [];
    const last = [...msgs].reverse().find((m) => m.content);
    if (!last) return null;
    const prefix = last.sender === "ai" ? "AI:" : last.sender === "owner" ? "You:" : "Customer:";
    return `${prefix} ${last.content.slice(0, 60)}${last.content.length > 60 ? "…" : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Negotiations</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitor live customer negotiations. Take over when a serious bid comes in.
          </p>
        </div>
        <form action="">
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Needs Attention", value: needsAttention.length, accent: needsAttention.length > 0 },
          { label: "Active Sessions", value: active.length, accent: false },
          { label: "Total Sessions",  value: total, accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} className={cn(
            "rounded-2xl border p-5",
            accent
              ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          )}>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
            <p className={cn("text-3xl font-bold", accent ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100")}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
        {sessions.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-16">No negotiations yet.</p>
        ) : (
          sessions.map((s) => (
            <Link
              key={s._id}
              href={`/admin/negotiations/${s.sessionId}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {s.closeBidAlert && s.status === "ai_active" ? "🔔 " : ""}{s.productName}
                  </p>
                  {statusBadge(s.status, s.closeBidAlert)}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>Listed <strong className="text-zinc-700 dark:text-zinc-300">₦{s.listedPrice?.toLocaleString()}</strong></span>
                  {s.customerBid && (
                    <span>Bid <strong className="text-brand-600 dark:text-brand-400">₦{s.customerBid.toLocaleString()}</strong></span>
                  )}
                  {s.agreedPrice && (
                    <span>Agreed <strong className="text-green-600 dark:text-green-400">₦{s.agreedPrice.toLocaleString()}</strong></span>
                  )}
                  {s.userEmail && <span>· {s.userEmail}</span>}
                  <span>· {timeAgo(s.lastActivityAt)}</span>
                  <span>· {s.messages?.length ?? 0} msgs</span>
                </div>
                {lastMsg(s) && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{lastMsg(s)}</p>
                )}
              </div>
              <div className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0">
                →
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}