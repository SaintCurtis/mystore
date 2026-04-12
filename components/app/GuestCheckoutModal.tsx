"use client";

import { useEffect } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ShoppingBag, X, LogIn, UserPlus, ShieldCheck } from "lucide-react";

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
}

export function GuestCheckoutModal({
  isOpen,
  onClose,
  itemCount,
}: GuestCheckoutModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] shadow-2xl">

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto">
            <ShoppingBag className="h-7 w-7 text-amber-500" />
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-[#f1f1f1]">
              Sign in to Checkout
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-[#a3a3a3]">
              You have{" "}
              <span className="font-semibold text-zinc-800 dark:text-[#f1f1f1]">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>{" "}
              in your cart. Create an account or sign in to complete your purchase.
            </p>
          </div>

          {/* Trust points */}
          <div className="mb-5 space-y-2">
            {[
              "Your cart is saved after signing in",
              "Track your orders anytime",
              "Faster checkout next time",
            ].map((point) => (
              <div key={point} className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs text-zinc-600 dark:text-[#a3a3a3]">{point}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-2.5">
            <SignInButton mode="modal">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 h-11 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-all duration-200 shadow-lg shadow-amber-500/20"
              >
                <LogIn className="h-4 w-4" />
                Sign In to Continue
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-[#2a2a2a] h-11 text-sm font-semibold text-zinc-700 dark:text-[#a3a3a3] hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-all duration-200"
              >
                <UserPlus className="h-4 w-4" />
                Create Account — It's Free
              </button>
            </SignUpButton>
          </div>

          <p className="mt-4 text-center text-[11px] text-zinc-400 dark:text-[#555]">
            By continuing, you agree to our terms of service.
          </p>
        </div>
      </div>
    </>
  );
}