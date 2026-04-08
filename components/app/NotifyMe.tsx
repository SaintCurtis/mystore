"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotifyMeProps {
  productId: string;
  productName: string;
}

export function NotifyMe({ productId, productName }: NotifyMeProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), productId, productName }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(
          data.alreadySubscribed
            ? "You're already on the waitlist for this product!"
            : "You're on the waitlist! We'll email you when it's back."
        );
      } else {
        throw new Error(data.error);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            You're on the waitlist!
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-[#1f1f1f] bg-zinc-50 dark:bg-[#0f0f0f] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-500 dark:text-amber-400" />
        <p className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1]">
          Notify me when available
        </p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">
        This product is out of stock. Enter your email and we'll notify you the moment it's back.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
        />
        <Button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="shrink-0 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Notify Me"
          )}
        </Button>
      </form>

      {status === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
      )}
    </div>
  );
}