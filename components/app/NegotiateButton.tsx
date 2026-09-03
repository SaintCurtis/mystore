"use client";
// components/app/NegotiateButton.tsx
//
// CHANGES:
//  - Desktop: floating chat bubble (380px wide, bottom-right corner)
//    like a world-class live support widget (Intercom/Crisp style)
//  - Mobile: bottom sheet (unchanged — already good)
//  - Minimise button so user can hide without losing the session
//  - Shows "Resume chat" badge if a saved session exists for this product

import { useState, useEffect } from "react";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import {
  ChatBubbleLeftRightIcon,
  MinusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NegotiationChat } from "@/components/app/NegotiationChat";

interface NegotiateButtonProps {
  product: {
    _id: string;
    slug: string;
    name: string;
    price: number;
    images?: { asset?: { url?: string } }[];
  };
  selectedVariants?: { type: string; label: string }[];
}

function hasExistingSession(slug: string): boolean {
  try {
    const raw = localStorage.getItem(`neg_session_${slug}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.sessionId && parsed?.messages?.length > 1;
  } catch {
    return false;
  }
}

export function NegotiateButton({
  product,
  selectedVariants = [],
}: NegotiateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasSession(hasExistingSession(product.slug));
  }, [product.slug]);

  // Refresh hasSession when chat opens/closes
  useEffect(() => {
    if (!isOpen) {
      setHasSession(hasExistingSession(product.slug));
    }
  }, [isOpen, product.slug]);

  // Lock body scroll on mobile only when sheet is open
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isOpen && !isMinimised && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, isMinimised]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMinimised(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimised(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimised(false);
  };

  return (
    <>
      {/* ── Trigger button ────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all duration-200 active:scale-[0.98] relative"
      >
        <CheckBadgeIcon className="w-4 h-4 shrink-0" />
        {hasSession ? "Resume Negotiation" : "Negotiate Price"}
        {hasSession && (
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-brand-500 ring-2 ring-white dark:ring-zinc-900" />
        )}
      </button>

      {/* ── Chat UI ───────────────────────────────────────────────────── */}
      {mounted && isOpen && (
        <>
          {/* ── MOBILE: Bottom sheet ──────────────────────────────────── */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
              aria-hidden="true"
            />
            <div
              className="relative z-10 w-full bg-white dark:bg-zinc-950 rounded-t-2xl shadow-2xl flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom duration-300"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>
              <NegotiationChat
                product={product}
                selectedVariants={selectedVariants}
                onClose={handleClose}
              />
            </div>
          </div>

          {/* ── DESKTOP: Floating chat widget ─────────────────────────── */}
          <div className="hidden md:block fixed bottom-6 right-6 z-50">
            {isMinimised ? (
              /* Minimised pill — click to restore */
              <button
                onClick={() => setIsMinimised(false)}
                className="flex items-center gap-2.5 h-12 pl-3 pr-4 rounded-full bg-zinc-900 dark:bg-white shadow-2xl shadow-black/30 hover:shadow-black/50 transition-all duration-200 hover:scale-105 active:scale-95 group"
                aria-label="Open negotiation chat"
              >
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                  <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white dark:text-zinc-900 leading-tight">
                    Negotiate Price
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                    Chat is paused — tap to resume
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse ml-1 shrink-0" />
              </button>
            ) : (
              /* Full chat widget */
              <div
                className="
                  w-[380px] bg-white dark:bg-zinc-950
                  rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60
                  border border-zinc-200 dark:border-zinc-800
                  flex flex-col overflow-hidden
                  animate-in slide-in-from-bottom-4 fade-in duration-300
                "
                style={{ height: "560px" }}
                role="dialog"
                aria-modal="true"
                aria-label="Price negotiation"
              >
                {/* Custom header with minimise + close */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-500/15 flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                        Negotiate with Segun
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        The Saint's TechNet · Usually responds instantly
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsMinimised(true)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="Minimise"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="Close"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chat body — hide the default NegotiationChat header since we built our own */}
                <div className="flex-1 min-h-0 overflow-hidden [&>div>div:first-child]:hidden">
                  <NegotiationChat
                    product={product}
                    selectedVariants={selectedVariants}
                    onClose={handleClose}
                    hideHeader
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}