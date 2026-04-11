"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { X, ShoppingBag, Heart } from "lucide-react";
import { useWishlistActions } from "@/lib/store/wishlist-store-provider";

const POPUP_KEY = "welcome-popup-last-shown";
const SHOW_AGAIN_AFTER_HOURS = 24; // Show once per 24 hours

const GREETINGS = [
  { emoji: "👋", text: "Welcome back" },
  { emoji: "🔥", text: "Great to see you" },
  { emoji: "⚡", text: "Hey there" },
];

const WISHLIST_NUDGES = [
  "Your wishlist won't buy itself! 😅🛒",
  "Those saved items are calling your name! 💸✨",
  "Time to stop window shopping 😂 — let's get it! 🛍️",
  "Your wishlist is getting lonely 🥺 — show it some love! ❤️",
  "We hope you clear your wishlist today! 🎯🔥",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function WelcomePopup() {
  const { user, isLoaded } = useUser();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const { openWishlist } = useWishlistActions();

  const greeting = getRandomItem(GREETINGS);
  const nudge = getRandomItem(WISHLIST_NUDGES);

  useEffect(() => {
    if (!isLoaded) return;

    // Check if shown recently
    const lastShown = localStorage.getItem(POPUP_KEY);
    if (lastShown) {
      const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
      if (hoursSince < SHOW_AGAIN_AFTER_HOURS) return;
    }

    // Show after a small delay — feels more natural
    const t1 = setTimeout(() => {
      setVisible(true);
      const t2 = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(t2);
    }, 1800);

    return () => clearTimeout(t1);
  }, [isLoaded]);

  function dismiss() {
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(POPUP_KEY, Date.now().toString());
    }, 300);
  }

  function handleWishlistClick() {
    dismiss();
    setTimeout(() => openWishlist(), 350);
  }

  if (!visible) return null;

  const firstName = user?.firstName;
  const isSignedIn = !!user;

  return (
    <div className={`
      fixed bottom-6 left-4 right-4 z-50
      sm:left-auto sm:right-6 sm:w-80
      transition-all duration-300 ease-out
      ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
    `}>
      <div className="relative rounded-2xl border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] shadow-2xl dark:shadow-black/60 overflow-hidden">

        {/* Amber accent top bar */}
        <div className="h-1 w-full bg-linear-to-r from-amber-400 via-orange-500 to-amber-400" />

        <div className="p-5">
          {/* Dismiss */}
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Greeting */}
          <div className="flex items-start gap-3 pr-6">
            <span className="text-2xl">{greeting.emoji}</span>
            <div>
              <p className="font-display text-base font-bold text-zinc-900 dark:text-[#f1f1f1] leading-snug">
                {greeting.text},{" "}
                <span className="text-amber-600 dark:text-amber-400">
                  {isSignedIn && firstName ? firstName : "Stranger"}
                </span>
                !
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-[#a3a3a3] leading-snug">
                {nudge}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleWishlistClick}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm shadow-amber-500/20"
            >
              <Heart className="h-4 w-4" />
              View Wishlist
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-[#a3a3a3] hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Keep Shopping
            </button>
          </div>

          {/* Subtext */}
          <p className="mt-3 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            Engineer-verified tech · Warranty on everything · Ships worldwide 🌍
          </p>
        </div>
      </div>
    </div>
  );
}