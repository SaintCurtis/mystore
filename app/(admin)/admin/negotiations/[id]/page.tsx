"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, HandshakeIcon, User, Bot, Send,
  Loader2, CheckCircle, XCircle, Bell, RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  role: string;
  content: string;
  sender: "ai" | "owner" | "customer";
  timestamp: string;
}

interface Session {
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
  messages: Message[];
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
export default function NegotiationSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerInput, setOwnerInput] = useState("");
  const [sending, setSending] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    // Poll every 5 seconds for new messages when owner is watching
    const interval = setInterval(fetchSession, 5_000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  async function handleTakeover() {
    setTakingOver(true);
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/takeover`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("You've taken over this negotiation. The AI is now silent.");
        await fetchSession();
        setTimeout(() => inputRef.current?.focus(), 200);
      } else {
        toast.error("Could not take over. Try again.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setTakingOver(false);
    }
  }

  async function handleHandBack() {
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/handback`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("AI is back in control.");
        await fetchSession();
      }
    } catch {
      toast.error("Something went wrong.");
    }
  }

  async function sendOwnerMessage() {
    const text = ownerInput.trim();
    if (!text || sending) return;
    setSending(true);
    setOwnerInput("");
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        await fetchSession();
      } else {
        toast.error("Failed to send message.");
        setOwnerInput(text);
      }
    } catch {
      toast.error("Failed to send message.");
      setOwnerInput(text);
    } finally {
      setSending(false);
    }
  }

  async function closeSession() {
    try {
      await fetch(`/api/admin/negotiations/${sessionId}/close`, { method: "POST" });
      toast.success("Session closed.");
      router.push("/admin/negotiations");
    } catch {
      toast.error("Could not close session.");
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendOwnerMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-24">
        <p className="text-zinc-500">Session not found.</p>
        <Link href="/admin/negotiations" className="mt-4 inline-block text-sm text-amber-600 hover:underline">
          ← Back to Negotiations
        </Link>
      </div>
    );
  }

  const isOwnerActive = session.status === "owner_active";
  const isClosed = session.status === "deal_struck" || session.status === "closed";
  const savings = session.agreedPrice
    ? session.listedPrice - session.agreedPrice
    : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/negotiations"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Negotiations
      </Link>

      {/* Session header card */}
      <div className={cn(
        "rounded-2xl border p-5",
        session.closeBidAlert && session.status === "ai_active"
          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      )}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {session.closeBidAlert && session.status === "ai_active" && (
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Customer bid is close to your floor — consider taking over!
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {session.productName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <span>Listed <strong className="text-zinc-900 dark:text-zinc-100">₦{session.listedPrice?.toLocaleString()}</strong></span>
              <span>Floor <strong className="text-zinc-900 dark:text-zinc-100">₦{session.floorPrice?.toLocaleString()}</strong></span>
              {session.customerBid && (
                <span>Closest bid <strong className="text-amber-600 dark:text-amber-400">₦{session.customerBid.toLocaleString()}</strong></span>
              )}
              {session.agreedPrice && (
                <span>Agreed <strong className="text-green-600 dark:text-green-400">₦{session.agreedPrice.toLocaleString()}</strong></span>
              )}
              {savings && savings > 0 && (
                <span>You gave ₦{savings.toLocaleString()} discount</span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Started {timeAgo(session.startedAt)} · {session.messages?.length ?? 0} messages
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSession}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>

            {session.status === "ai_active" && (
              <Button
                size="sm"
                onClick={handleTakeover}
                disabled={takingOver}
                className="gap-1.5 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold"
              >
                {takingOver
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Taking over…</>
                  : <><User className="h-3.5 w-3.5" /> Take Over</>
                }
              </Button>
            )}

            {isOwnerActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleHandBack}
                className="gap-1.5"
              >
                <Bot className="h-3.5 w-3.5" />
                Hand Back to AI
              </Button>
            )}

            {!isClosed && (
              <Button
                size="sm"
                variant="outline"
                onClick={closeSession}
                className="gap-1.5 text-zinc-500 hover:text-red-600 hover:border-red-300"
              >
                <XCircle className="h-3.5 w-3.5" />
                Close Session
              </Button>
            )}
          </div>
        </div>

        {/* Status pill */}
        <div className="mt-3 flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            session.status === "ai_active"    && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            session.status === "owner_active" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
            session.status === "deal_struck"  && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            session.status === "closed"       && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          )}>
            {session.status === "ai_active"    && <><Bot className="h-3 w-3" /> AI is negotiating</>}
            {session.status === "owner_active" && <><User className="h-3 w-3" /> You are live</>}
            {session.status === "deal_struck"  && <><CheckCircle className="h-3 w-3" /> Deal struck</>}
            {session.status === "closed"       && <><XCircle className="h-3 w-3" /> Closed</>}
          </span>
          <Link
            href={`/products/${session.productSlug}`}
            target="_blank"
            className="text-xs text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 underline underline-offset-2 transition-colors"
          >
            View product →
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-3 flex items-center gap-2">
          <HandshakeIcon className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Conversation</h2>
        </div>

        <div className="px-4 py-4 space-y-3 max-h-[480px] overflow-y-auto">
          {!session.messages || session.messages.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-8">No messages yet.</p>
          ) : (
            session.messages.map((msg, i) => {
              const isCustomer = msg.sender === "customer";
              const isOwner    = msg.sender === "owner";
              const isAI       = msg.sender === "ai";

              return (
                <div key={i} className={cn("flex", isCustomer ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    isCustomer && "bg-amber-500 text-zinc-950 rounded-br-sm",
                    isAI       && "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm",
                    isOwner    && "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-bl-sm",
                  )}>
                    {/* Sender label for non-customer */}
                    {!isCustomer && (
                      <p className={cn(
                        "text-[10px] font-semibold mb-1 uppercase tracking-wide",
                        isAI    && "text-zinc-400 dark:text-zinc-500",
                        isOwner && "text-zinc-300 dark:text-zinc-600",
                      )}>
                        {isAI ? "Segun (AI)" : "You (Owner)"}
                      </p>
                    )}
                    {msg.content}
                    <p className={cn(
                      "text-[10px] mt-1 opacity-60",
                      isCustomer ? "text-right" : "text-left"
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString("en-NG", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Owner message input — only when owner_active */}
        {isOwnerActive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                You are live — customer sees your messages as "The Saint's TechNet"
              </p>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message to the customer…"
                rows={2}
                disabled={sending}
                className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 disabled:opacity-50 transition-colors"
              />
              <button
                onClick={sendOwnerMessage}
                disabled={!ownerInput.trim() || sending}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all"
              >
                {sending
                  ? <Loader2 className="w-4 h-4 text-zinc-950 animate-spin" />
                  : <Send className="w-4 h-4 text-zinc-950" />
                }
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}

        {/* Deal struck banner */}
        {session.status === "deal_struck" && session.agreedPrice && (
          <div className="border-t border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-5 py-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Deal struck at ₦{session.agreedPrice.toLocaleString()}
              </p>
              {savings && (
                <p className="text-xs text-green-600 dark:text-green-500">
                  ₦{savings.toLocaleString()} discount off ₦{session.listedPrice.toLocaleString()} listed price
                </p>
              )}
            </div>
            <Zap className="h-4 w-4 text-green-500 ml-auto shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}