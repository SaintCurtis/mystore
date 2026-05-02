"use client";

import { useState } from "react";
import {
  Copy, Check, Share2, Trophy, Users, MousePointerClick,
  Banknote, Gift, ChevronRight, Crown, Medal, Award,
  Zap, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferralClick {
  _id: string;
  code: string | null;        // ← was `string` — now matches SANITY generated type
  converted: boolean | null;  // ← was `boolean` — sanity generates boolean | null
  convertedOrderId?: string | null;
  clickedAt: string | null;
}

interface LeaderboardEntry {
  _id: string;
  name: string | null;
  code: string | null;
  conversions: number | null;
  totalEarned: number | null;
}

interface ReferralDoc {
  _id: string;
  code: string | null;
  clicks: number | null;
  conversions: number | null;
  totalEarned: number | null;
  createdAt: string | null;
  name: string | null;
  email: string | null;
}

interface ReferralDashboardProps {
  referral: ReferralDoc | null;
  referralUrl: string | null;
  clicks: ReferralClick[];
  leaderboard: LeaderboardEntry[];
  userName: string;
}

export function ReferralDashboard({
  referral,
  referralUrl,
  clicks,
  leaderboard,
  userName,
}: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "leaderboard">("overview");

  const stats = {
    clicks: referral?.clicks ?? 0,
    conversions: referral?.conversions ?? 0,
    earned: referral?.totalEarned ?? 0,
    conversionRate: referral?.clicks
      ? Math.round(((referral.conversions ?? 0) / referral.clicks) * 100)
      : 0,
  };

  function handleCopy() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (!referralUrl) return;
    const text = `🛒 Get the best tech deals at The Saint's TechNet — verified by a Computer Engineer, warranty on everything!\n\n${referralUrl}`;
    if (navigator.share) {
      navigator.share({ title: "The Saint's TechNet", text, url: referralUrl });
    } else {
      const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(wa, "_blank");
    }
  }

  function handleWhatsApp() {
    if (!referralUrl) return;
    const text = `🛒 Shop premium tech at The Saint's TechNet — CAC registered, warranty included, engineer-verified!\n\n${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTwitter() {
    if (!referralUrl) return;
    const text = `Just found the best place to buy tech in Nigeria 🇳🇬 — engineer-verified gadgets, warranty on everything 🔥`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
      "_blank"
    );
  }

  const leaderboardIcons = [Crown, Medal, Award];
  const leaderboardColors = [
    "text-amber-400",
    "text-zinc-400",
    "text-amber-700",
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a]">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-zinc-900 dark:bg-[#0f0f0f] border-b border-zinc-800">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%)`,
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Gift className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Refer & Earn
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Share the love,<br />
            <span className="text-amber-400">earn rewards</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-md">
            Every friend you refer who places an order earns you rewards.
            The more you share, the more you earn. No cap.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* ── Referral link card ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Your Referral Link
              </p>
            </div>

            {referralUrl ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d0d0d] p-3 mb-4">
                  <code className="flex-1 text-xs text-zinc-600 dark:text-zinc-300 truncate font-mono">
                    {referralUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                      copied
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-95",
                    )}
                  >
                    {copied ? (
                      <><Check className="h-3.5 w-3.5" /> Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy</>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Your code:</span>
                  <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-sm font-black tracking-widest text-amber-600 dark:text-amber-400">
                    {referral?.code}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={handleShare}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d0d0d] px-3 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all active:scale-95">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  <button type="button" onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-3 py-2.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all active:scale-95">
                    <span className="text-sm">💬</span>
                    WhatsApp
                  </button>
                  <button type="button" onClick={handleTwitter}
                    className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-900/20 px-3 py-2.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all active:scale-95">
                    <span className="text-sm">𝕏</span>
                    Post
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500">Generating your referral link...</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: MousePointerClick, label: "Link Clicks",
              value: stats.clicks.toLocaleString(),
              color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20",
              border: "border-blue-100 dark:border-blue-900/30",
            },
            {
              icon: Users, label: "Conversions",
              value: stats.conversions.toLocaleString(),
              color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20",
              border: "border-emerald-100 dark:border-emerald-900/30",
            },
            {
              icon: Banknote, label: "Total Earned",
              value: `₦${stats.earned.toLocaleString()}`,
              color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20",
              border: "border-amber-100 dark:border-amber-900/30",
            },
            {
              icon: Zap, label: "Conv. Rate",
              value: `${stats.conversionRate}%`,
              color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20",
              border: "border-purple-100 dark:border-purple-900/30",
            },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className={cn("rounded-2xl border p-4 bg-white dark:bg-[#111111]", border)}>
              <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", bg)}>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1">
          {(["overview", "history", "leaderboard"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all duration-200",
                activeTab === tab
                  ? "bg-white dark:bg-[#111111] text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview tab ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] p-5 sm:p-6">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">How it works</h2>
              <div className="space-y-4">
                {[
                  { step: "01", title: "Copy your link", desc: "Share your unique referral link with friends, family, or on social media.", icon: Copy },
                  { step: "02", title: "Friend shops", desc: "When someone clicks your link and places an order, it counts as a conversion.", icon: ExternalLink },
                  { step: "03", title: "You earn", desc: "Earn rewards for every successful order. The more you refer, the more you earn.", icon: Banknote },
                ].map(({ step, title, desc, icon: Icon }) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black tracking-widest text-amber-500/60">STEP {step}</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
                💡 Pro tips to maximise earnings
              </p>
              <ul className="space-y-2">
                {[
                  "Post your link under Starlink or gaming laptop posts on Twitter/X",
                  "Share in WhatsApp groups for tech enthusiasts and students",
                  "Tell friends about the Engineer-verified guarantee — it converts well",
                  "Post before festive seasons — Christmas, UTME period, new academic year",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── History tab ──────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
            <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Recent activity</p>
              <p className="text-xs text-zinc-500 mt-0.5">Last 20 clicks on your referral link</p>
            </div>
            {clicks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No clicks yet</p>
                <p className="text-xs text-zinc-400">Share your link to start seeing activity here</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {clicks.map((click) => (
                  <div key={click._id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        click.converted ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600",
                      )} />
                      <div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {click.converted ? "✅ Converted to order" : "Link visited"}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {click.clickedAt
                            ? new Date(click.clickedAt).toLocaleDateString("en-NG", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {click.converted && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+Reward</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard tab ──────────────────────────────────────────── */}
        {activeTab === "leaderboard" && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
            <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Top Referrers</p>
            </div>
            {leaderboard.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Leaderboard is empty</p>
                <p className="text-xs text-zinc-400">Be the first to make a conversion!</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {leaderboard.map((entry, i) => {
                  const Icon = leaderboardIcons[i] ?? Award;
                  const iconColor = leaderboardColors[i] ?? "text-zinc-400";
                  const isCurrentUser = entry.code === referral?.code;

                  return (
                    <div key={entry._id}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 transition-colors",
                        isCurrentUser && "bg-amber-50 dark:bg-amber-900/10",
                      )}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                        {i < 3 ? (
                          <Icon className={cn("h-5 w-5", iconColor)} />
                        ) : (
                          <span className="text-sm font-bold text-zinc-400">#{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {isCurrentUser ? "You 🎉" : (entry.name ?? "Anonymous")}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {entry.conversions ?? 0} conversion{(entry.conversions ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-amber-500">
                          ₦{(entry.totalEarned ?? 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-zinc-400">earned</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}