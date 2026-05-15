"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, Loader2, HandshakeIcon, BadgePercent, Zap } from "lucide-react";
import { useCurrency } from "@/lib/store/currency-store-provider";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  fromOwner?: boolean;
}

interface StoredSession {
  sessionId: string;
  messages: Message[];
  lastOwnerTimestamp: string | null;
}

interface DealState {
  struck: boolean;
  agreedPrice: number | null;
  loading: boolean;
}

interface NegotiationChatProps {
  product: {
    _id: string;
    slug: string;
    name: string;
    price: number;
    images?: { asset?: { url?: string } }[];
  };
  selectedVariants?: { type: string; label: string }[];
  onClose: () => void;
}

function stripDealSignal(text: string): string {
  return text.replace(/DEAL:₦[\d,]+/g, "").trim();
}

// ── localStorage helpers ──────────────────────────────────────────────────
function storageKey(slug: string) {
  return `neg_session_${slug}`;
}

function loadSession(slug: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    // Reject corrupted sessions — bad sessionId causes 400s on /api/negotiate
    if (!parsed.sessionId || typeof parsed.sessionId !== "string") {
      localStorage.removeItem(storageKey(slug));
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(storageKey(slug));
    return null;
  }
}

function saveSession(slug: string, data: StoredSession) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

function clearSession(slug: string) {
  try {
    localStorage.removeItem(storageKey(slug));
  } catch {}
}

// ── Component ──────────────────────────────────────────────────────────────
export function NegotiationChat({
  product,
  selectedVariants = [],
  onClose,
}: NegotiationChatProps) {
  const { formatInCurrency } = useCurrency();

  const defaultWelcome: Message = {
    role: "assistant",
    content: `Hi! I'm Segun from The Saint's TechNet. You're looking at the ${product.name}, listed at ${formatInCurrency(product.price)}. What price did you have in mind?`,
  };

  // ── Restore from localStorage on mount ───────────────────────────────
  const stored = loadSession(product.slug);

  const [messages, setMessages] = useState<Message[]>(
    stored?.messages?.length ? stored.messages : [defaultWelcome]
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [ownerTyping, setOwnerTyping] = useState(false);
  const [deal, setDeal] = useState<DealState>({ struck: false, agreedPrice: null, loading: false });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Refs — never cause stale closures inside callbacks
  const sessionIdRef = useRef<string | null>(stored?.sessionId ?? null);
  const lastOwnerTimestampRef = useRef<string | null>(stored?.lastOwnerTimestamp ?? null);
  const ownerActiveRef = useRef(false);
  const dealStruckRef = useRef(false);
  const messagesRef = useRef<Message[]>(messages);

  // Keep messagesRef in sync so we can persist without closure issues
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Persist session to localStorage whenever messages or sessionId change
  const persistSession = useCallback(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    saveSession(product.slug, {
      sessionId: sid,
      messages: messagesRef.current.filter((m) => !m.streaming), // never persist mid-stream
      lastOwnerTimestamp: lastOwnerTimestampRef.current,
    });
  }, [product.slug]);

  useEffect(() => {
    persistSession();
  }, [messages, persistSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ownerTyping]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Poll owner messages + typing indicator every 3s ───────────────────
  const pollOwnerMessages = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid || dealStruckRef.current) return;

    try {
      // 1. Check owner messages
      const params = new URLSearchParams({ sessionId: sid });
      if (lastOwnerTimestampRef.current) {
        params.set("after", lastOwnerTimestampRef.current);
      }
      const res = await fetch(`/api/negotiate/owner-messages?${params}`);
      if (res.ok) {
        const data = await res.json();

        if (data.status === "owner_active") ownerActiveRef.current = true;
        else if (data.status === "ai_active") ownerActiveRef.current = false;

        if (data.messages?.length > 0) {
          const sorted = [...data.messages].sort(
            (a: { timestamp: string }, b: { timestamp: string }) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setMessages((prev) => [
            ...prev,
            ...sorted.map((m: { content: string }) => ({
              role: "assistant" as const,
              content: m.content,
              fromOwner: true,
            })),
          ]);
          lastOwnerTimestampRef.current = sorted[sorted.length - 1].timestamp;
        }
      }

      // 2. Check typing indicator (only when owner is active)
      if (ownerActiveRef.current) {
        const typingRes = await fetch(`/api/negotiate/typing?sessionId=${sid}`);
        if (typingRes.ok) {
          const { isTyping } = await typingRes.json();
          setOwnerTyping(isTyping);
        }
      } else {
        setOwnerTyping(false);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // Start polling immediately on mount — safe before sessionId exists (exits early)
  useEffect(() => {
    const interval = setInterval(pollOwnerMessages, 3_000);
    return () => clearInterval(interval);
  }, [pollOwnerMessages]);

  // ── Send message ──────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming || deal.struck) return;

    if (ownerActiveRef.current) {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
      return;
    }

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          sessionId: sessionIdRef.current ?? undefined,
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? "Network error");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);

            if (parsed.sessionId && !sessionIdRef.current) {
              sessionIdRef.current = parsed.sessionId;
            }

            if (parsed.text) {
              fullText += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: stripDealSignal(fullText),
                  streaming: true,
                };
                return updated;
              });
            }

            if (parsed.deal && parsed.agreedPrice) {
              dealStruckRef.current = true;
              clearSession(product.slug); // clear history on deal
              setDeal({ struck: true, agreedPrice: parsed.agreedPrice, loading: false });
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: stripDealSignal(fullText),
          streaming: false,
        };
        return updated;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Sorry, something went wrong. Please try again. (${errorMsg})`,
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleProceedToPayment = async () => {
    if (!deal.agreedPrice) return;
    setDeal((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch("/api/negotiate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          agreedPrice: deal.agreedPrice,
          selectedVariants,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Could not initialize payment");
      toast.success(
        `Deal locked! You saved ${formatInCurrency(data.summary.savedAmount)} (${data.summary.savedPercent}% off)`,
        { duration: 3000 }
      );
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setDeal((prev) => ({ ...prev, loading: false }));
    }
  };

  const messageCount = messages.filter((m) => m.role === "user").length;
  const roundsLeft = Math.max(0, 10 - messageCount);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
            <HandshakeIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              Segun — The Saint's TechNet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
              {product.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!deal.struck && roundsLeft <= 5 && roundsLeft > 0 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {roundsLeft} round{roundsLeft !== 1 ? "s" : ""} left
            </span>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close negotiation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Price summary strip ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <BadgePercent className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Listed at{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {formatInCurrency(product.price)}
          </span>
          {deal.struck && deal.agreedPrice && (
            <>
              {" "}→ deal at{" "}
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatInCurrency(deal.agreedPrice)}
              </span>
            </>
          )}
        </p>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-500 text-zinc-950 rounded-br-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm"
              }`}
            >
              {msg.content}
              {msg.streaming && (
                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        ))}

        {/* ── Typing indicator ── */}
        {ownerTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
                The Saint's TechNet is typing…
              </p>
              <span className="inline-flex gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {deal.struck && deal.agreedPrice && (
          <div className="mx-auto max-w-xs rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-2">
              <HandshakeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-0.5">Deal agreed!</p>
            <p className="text-xs text-green-600 dark:text-green-500 mb-3">
              {formatInCurrency(deal.agreedPrice)} · You save{" "}
              {formatInCurrency(product.price - deal.agreedPrice)}
            </p>
            <button
              onClick={handleProceedToPayment}
              disabled={deal.loading}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-bold transition-all duration-150 shadow-lg shadow-green-500/20"
            >
              {deal.loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Setting up payment…</>
              ) : (
                <><Zap className="w-4 h-4" /> Pay {formatInCurrency(deal.agreedPrice)} now</>
              )}
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      {!deal.struck && (
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          {roundsLeft === 0 ? (
            <p className="text-xs text-center text-zinc-400 py-2">
              Negotiation session ended.{" "}
              <button onClick={onClose} className="text-amber-500 underline underline-offset-2">Close</button>
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Make your offer…"
                rows={1}
                disabled={isStreaming}
                className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 disabled:opacity-50 transition-colors leading-relaxed max-h-28 overflow-y-auto"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all duration-150 shadow-md shadow-amber-500/20"
                aria-label="Send message"
              >
                {isStreaming
                  ? <Loader2 className="w-4 h-4 text-zinc-950 animate-spin" />
                  : <Send className="w-4 h-4 text-zinc-950" />
                }
              </button>
            </div>
          )}
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}