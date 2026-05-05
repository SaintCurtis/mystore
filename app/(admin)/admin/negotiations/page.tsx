"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HandshakeIcon, Bell, Clock, CheckCircle,
  XCircle, ArrowRight, RefreshCw, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface NegotiationSession {
  _id: string;
  sessionId: string;
  productName: string;
  productSlug: string;
  listedPrice: number;
  floorPrice: number;
  customerBid?: number;
  agreedPrice?: number;
  status: "ai_active" | "owner_active" | "deal_struck" | "closed";
  closeBidAlert: boolean;
  startedAt: string;
  lastActivityAt: string;
  messageCount: number;
  lastMessage?: {
    role: string;
    content: string;
    sender: string;
    timestamp: string;
  };
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: NegotiationSession["status"] }) {
  const map = {
    ai_active:    { label: "AI Active",     className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",       icon: <HandshakeIcon className="h-3 w-3" /> },
    owner_active: { label: "You're Live",   className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",   icon: <User className="h-3 w-3" />          },
    deal_struck:  { label: "Deal Struck",   className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",   icon: <CheckCircle className="h-3 w-3" />    },
    closed:       { label: "Closed",        className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",          icon: <XCircle className="h-3 w-3" />        },
  };
  const s = map[status] ?? map.ai_active;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", s.className)}>
      {s.icon}{s.label}
    </span>
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

// ── Page ───────────────────────────────────────────────────────────────────
export default function NegotiationsPage() {
  const [sessions, setSessions] = useState<NegotiationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "alert" | "active" | "closed">("all");

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/negotiations");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
    // Poll every 15 seconds for new activity
    const interval = setInterval(fetchSessions, 15_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = sessions.filter((s) => {
    if (filter === "alert")  return s.closeBidAlert && s.status === "ai_active";
    if (filter === "active") return s.status === "ai_active" || s.status === "owner_active";
    if (filter === "closed") return s.status === "deal_struck" || s.status === "closed";
    return true;
  });

  const alertCount  = sessions.filter((s) => s.closeBidAlert && s.status === "ai_active").length;
  const activeCount = sessions.filter((s) => s.status === "ai_active" || s.status === "owner_active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Negotiations
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Monitor live customer negotiations. Take over when a serious bid comes in.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Needs Attention", value: alertCount,  color: "text-red-600 dark:text-red-400",   bg: "bg-red-50 dark:bg-red-900/20",     icon: <Bell className="h-4 w-4" /> },
          { label: "Active Sessions", value: activeCount, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20",   icon: <Clock className="h-4 w-4" /> },
          { label: "Total Sessions",  value: sessions.length, color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800", icon: <HandshakeIcon className="h-4 w-4" /> },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
              <div className={cn("rounded-lg p-1.5", bg)}>
                <span className={color}>{icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "all",    label: "All" },
          { key: "alert",  label: `🔔 Needs Attention${alertCount > 0 ? ` (${alertCount})` : ""}` },
          { key: "active", label: "Active" },
          { key: "closed", label: "Closed" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading && sessions.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          {[1,2,3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <HandshakeIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {filter === "alert" ? "No sessions need attention right now." : "No negotiation sessions yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filtered.map((session) => (
            <Link
              key={session._id}
              href={`/admin/negotiations/${session.sessionId}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              {/* Alert indicator */}
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                session.closeBidAlert && session.status === "ai_active"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-zinc-100 dark:bg-zinc-800"
              )}>
                {session.closeBidAlert && session.status === "ai_active"
                  ? <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
                  : <HandshakeIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {session.productName}
                  </p>
                  {session.closeBidAlert && session.status === "ai_active" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                      BID CLOSE TO FLOOR
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Listed ₦{session.listedPrice?.toLocaleString()}
                  </span>
                  {session.customerBid && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Bid ₦{session.customerBid.toLocaleString()}
                    </span>
                  )}
                  {session.agreedPrice && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Agreed ₦{session.agreedPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {session.messageCount} messages · {timeAgo(session.lastActivityAt ?? session.startedAt)}
                  </span>
                </div>
                {session.lastMessage && (
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 truncate">
                    <span className="font-medium capitalize">{session.lastMessage.sender}:</span>{" "}
                    {session.lastMessage.content.slice(0, 80)}
                  </p>
                )}
              </div>

              {/* Status + arrow */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={session.status} />
                <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}