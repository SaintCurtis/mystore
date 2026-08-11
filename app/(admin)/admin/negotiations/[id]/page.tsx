"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  UserIcon,
  CpuChipIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  ArrowPathIcon,
  BoltIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon as SpinnerIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Spinner({ className }: { className?: string }) {
  return <SpinnerIcon className={`animate-spin ${className ?? "h-4 w-4"}`} />;
}

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

// ── Agree on Price Modal ───────────────────────────────────────────────────
function AgreeDealModal({
  session,
  onConfirm,
  onClose,
}: {
  session: Session;
  onConfirm: (price: number) => Promise<void>;
  onClose: () => void;
}) {
  const suggested = session.customerBid ?? Math.round(session.listedPrice * 0.9);
  const [price, setPrice] = useState(suggested.toString());
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const parsed = Number(price.replace(/,/g, ""));
  const isValid = !isNaN(parsed) && parsed > 0;
  const isBelowFloor = isValid && parsed < session.floorPrice;
  const savings = isValid ? session.listedPrice - parsed : 0;
  const savingsPct = isValid ? Math.round((savings / session.listedPrice) * 100) : 0;

  async function handleConfirm() {
    if (!isValid) return; // Owner can go below floor — their call
    setLoading(true);
    try {
      await onConfirm(parsed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckBadgeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Strike a Deal</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-12">
            Set the final agreed price. The customer will see a Pay button immediately.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Price context */}
          <div className="flex gap-3 text-sm">
            <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-center">
              <p className="text-xs text-zinc-400 mb-0.5">Listed</p>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">₦{session.listedPrice.toLocaleString()}</p>
            </div>
            <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-center">
              <p className="text-xs text-zinc-400 mb-0.5">Floor</p>
              <p className="font-bold text-red-600 dark:text-red-400">₦{session.floorPrice.toLocaleString()}</p>
            </div>
            {session.customerBid && (
              <div className="flex-1 rounded-xl bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 text-center">
                <p className="text-xs text-blue-500 mb-0.5">Customer bid</p>
                <p className="font-bold text-blue-700 dark:text-blue-400">₦{session.customerBid.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Price input */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Agreed Price (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">₦</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d,]/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition-colors"
                placeholder="685000"
              />
            </div>

            {/* Validation feedback */}
            {isBelowFloor && (
              <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                ⚠️ Below your floor price of ₦{session.floorPrice.toLocaleString()} — you can still confirm
              </p>
            )}
            {isValid && !isBelowFloor && savings > 0 && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Customer saves <span className="font-semibold text-green-600 dark:text-green-400">
                  ₦{savings.toLocaleString()}
                </span> ({savingsPct}% off listed price)
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold gap-2 disabled:opacity-50"
          >
            {loading
              ? <><Spinner className="h-4 w-4" /> Striking deal…</>
              : <><CheckBadgeIcon className="h-4 w-4" /> Confirm Deal</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Decline Confirmation ───────────────────────────────────────────────────
function DeclineModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Decline & Close</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          This will close the negotiation session. The customer will be notified that no deal was reached and can try again later.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold gap-2"
          >
            {loading
              ? <><Spinner className="h-4 w-4" /> Declining…</>
              : <><XCircleIcon className="h-4 w-4" /> Decline Deal</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function NegotiationSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerInput, setOwnerInput] = useState("");
  const [sending, setSending] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [showAgreeModal, setShowAgreeModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);

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
    const interval = setInterval(fetchSession, 5_000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const sendTypingSignal = useCallback(async (typing: boolean) => {
    try {
      await fetch("/api/negotiate/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, isTyping: typing }),
      });
    } catch {}
  }, [sessionId]);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (typingHeartbeatRef.current) {
        clearInterval(typingHeartbeatRef.current);
        typingHeartbeatRef.current = null;
      }
      sendTypingSignal(false);
    }
  }, [sendTypingSignal]);

  useEffect(() => { return () => stopTyping(); }, [stopTyping]);

  function handleOwnerInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setOwnerInput(e.target.value);
    if (e.target.value.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        sendTypingSignal(true);
        typingHeartbeatRef.current = setInterval(() => sendTypingSignal(true), 2_000);
      }
    } else {
      stopTyping();
    }
  }

  async function handleTakeover() {
    setTakingOver(true);
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/takeover`, { method: "POST" });
      if (res.ok) {
        toast.success("You've taken over. The AI is now silent.");
        await fetchSession();
        setTimeout(() => inputRef.current?.focus(), 200);
      } else {
        toast.error("Could not take over. Try again.");
      }
    } catch { toast.error("Something went wrong."); }
    finally { setTakingOver(false); }
  }

  async function handleHandBack() {
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/handback`, { method: "POST" });
      if (res.ok) { toast.success("AI is back in control."); await fetchSession(); }
      else toast.error("Something went wrong.");
    } catch { toast.error("Something went wrong."); }
  }

  async function sendOwnerMessage() {
    const text = ownerInput.trim();
    if (!text || sending) return;
    stopTyping();
    setSending(true);
    setOwnerInput("");
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) { await fetchSession(); }
      else { toast.error("Failed to send message."); setOwnerInput(text); }
    } catch { toast.error("Failed to send message."); setOwnerInput(text); }
    finally { setSending(false); }
  }

  // ── Strike deal ───────────────────────────────────────────────────────
  async function handleAgreeDeal(agreedPrice: number) {
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/deal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreedPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`🤝 Deal struck at ₦${agreedPrice.toLocaleString()}! Customer will see Pay button now.`);
      setShowAgreeModal(false);
      await fetchSession();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to strike deal");
      throw err;
    }
  }

  // ── Decline ───────────────────────────────────────────────────────────
  async function handleDecline() {
    try {
      const res = await fetch(`/api/admin/negotiations/${sessionId}/close`, { method: "POST" });
      if (res.ok) {
        toast.success("Negotiation closed.");
        setShowDeclineModal(false);
        router.push("/admin/negotiations");
      } else {
        toast.error("Could not close session.");
      }
    } catch { toast.error("Something went wrong."); }
  }

  async function closeSession() {
    try {
      await fetch(`/api/admin/negotiations/${sessionId}/close`, { method: "POST" });
      toast.success("Session closed.");
      router.push("/admin/negotiations");
    } catch { toast.error("Could not close session."); }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendOwnerMessage(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6 text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-24">
        <p className="text-zinc-500">Session not found.</p>
        <Link href="/admin/negotiations" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to Negotiations
        </Link>
      </div>
    );
  }

  const isOwnerActive = session.status === "owner_active";
  const isClosed = session.status === "deal_struck" || session.status === "closed";
  const savings = session.agreedPrice ? session.listedPrice - session.agreedPrice : null;

  return (
    <>
      {/* Modals */}
      {showAgreeModal && (
        <AgreeDealModal
          session={session}
          onConfirm={handleAgreeDeal}
          onClose={() => setShowAgreeModal(false)}
        />
      )}
      {showDeclineModal && (
        <DeclineModal
          onConfirm={handleDecline}
          onClose={() => setShowDeclineModal(false)}
        />
      )}

      <div className="space-y-6 max-w-3xl mx-auto">
        <Link
          href="/admin/negotiations"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          All Negotiations
        </Link>

        {/* Session header */}
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
                  <BellIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Customer bid is close to your floor — consider taking over!
                  </span>
                </div>
              )}
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{session.productName}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                <span>Listed <strong className="text-zinc-900 dark:text-zinc-100">₦{session.listedPrice?.toLocaleString()}</strong></span>
                <span>Floor <strong className="text-red-600 dark:text-red-400">₦{session.floorPrice?.toLocaleString()}</strong></span>
                {session.customerBid && (
                  <span>Customer bid <strong className="text-blue-600 dark:text-blue-400">₦{session.customerBid.toLocaleString()}</strong></span>
                )}
                {session.agreedPrice && (
                  <span>Agreed <strong className="text-green-600 dark:text-green-400">₦{session.agreedPrice.toLocaleString()}</strong></span>
                )}
                {savings && savings > 0 && (
                  <span className="text-zinc-400">Discount ₦{savings.toLocaleString()}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Started {timeAgo(session.startedAt)} · {session.messages?.length ?? 0} messages
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap shrink-0">
              <Button variant="outline" size="sm" onClick={fetchSession} className="gap-1.5">
                <ArrowPathIcon className="h-3.5 w-3.5" /> Refresh
              </Button>

              {session.status === "ai_active" && (
                <Button size="sm" onClick={handleTakeover} disabled={takingOver}
                  className="gap-1.5 bg-blue-500 text-white hover:bg-blue-400 font-bold">
                  {takingOver
                    ? <><Spinner className="h-3.5 w-3.5" /> Taking over…</>
                    : <><UserIcon className="h-3.5 w-3.5" /> Take Over</>
                  }
                </Button>
              )}

              {isOwnerActive && (
                <Button size="sm" variant="outline" onClick={handleHandBack} className="gap-1.5">
                  <CpuChipIcon className="h-3.5 w-3.5" /> Hand Back to AI
                </Button>
              )}

              {/* ── AGREE / DECLINE — shown when owner is live ─────────── */}
              {isOwnerActive && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setShowAgreeModal(true)}
                    className="gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold shadow-sm shadow-green-500/20"
                  >
                    <HandThumbUpIcon className="h-3.5 w-3.5" /> Agree on Price
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeclineModal(true)}
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    <HandThumbDownIcon className="h-3.5 w-3.5" /> Decline
                  </Button>
                </>
              )}

              {!isClosed && !isOwnerActive && (
                <Button size="sm" variant="outline" onClick={closeSession}
                  className="gap-1.5 text-zinc-500 hover:text-red-600 hover:border-red-300">
                  <XCircleIcon className="h-3.5 w-3.5" /> Close Session
                </Button>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              session.status === "ai_active"    && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
              session.status === "owner_active" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
              session.status === "deal_struck"  && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
              session.status === "closed"       && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
            )}>
              {session.status === "ai_active"    && <><CpuChipIcon className="h-3 w-3" /> AI is negotiating</>}
              {session.status === "owner_active" && <><UserIcon className="h-3 w-3" /> You are live</>}
              {session.status === "deal_struck"  && <><CheckCircleIcon className="h-3 w-3" /> Deal struck</>}
              {session.status === "closed"       && <><XCircleIcon className="h-3 w-3" /> Closed</>}
            </span>
            <Link href={`/products/${session.productSlug}`} target="_blank"
              className="text-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2 transition-colors">
              View product →
            </Link>
          </div>
        </div>

        {/* Conversation */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-3 flex items-center gap-2">
            <CheckBadgeIcon className="h-4 w-4 text-zinc-400" />
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
                      isCustomer && "bg-blue-500 text-white rounded-br-sm",
                      isAI       && "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm",
                      isOwner    && "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-bl-sm",
                    )}>
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
                      <p className={cn("text-[10px] mt-1 opacity-60", isCustomer ? "text-right" : "text-left")}>
                        {new Date(msg.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Owner input area */}
          {isOwnerActive && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    You are live — customer sees your messages as "The Saint's TechNet"
                  </p>
                </div>
                {/* Quick action hint */}
                <p className="text-[10px] text-zinc-400 hidden sm:block">
                  Ready to deal? Use the buttons above ↑
                </p>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={ownerInput}
                  onChange={handleOwnerInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={stopTyping}
                  placeholder="Type your message to the customer…"
                  rows={2}
                  disabled={sending}
                  className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={sendOwnerMessage}
                  disabled={!ownerInput.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-blue-500 hover:bg-blue-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all"
                >
                  {sending
                    ? <Spinner className="w-4 h-4 text-white" />
                    : <PaperAirplaneIcon className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
            </div>
          )}

          {/* Deal struck banner */}
          {session.status === "deal_struck" && session.agreedPrice && (
            <div className="border-t border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-5 py-4 flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Deal struck at ₦{session.agreedPrice.toLocaleString()}
                </p>
                {savings && (
                  <p className="text-xs text-green-600 dark:text-green-500">
                    ₦{savings.toLocaleString()} discount · Customer is proceeding to payment
                  </p>
                )}
              </div>
              <BoltIcon className="h-4 w-4 text-green-500 ml-auto shrink-0" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}