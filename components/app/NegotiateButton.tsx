"use client";

import { useState, useEffect } from "react";
import { HandshakeIcon } from "lucide-react";
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

export function NegotiateButton({
  product,
  selectedVariants = [],
}: NegotiateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR mismatch for the portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:border-amber-400 hover:text-amber-600 dark:hover:border-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-all duration-200 active:scale-[0.98]"
      >
        <HandshakeIcon className="w-4 h-4 shrink-0" />
        Negotiate Price
      </button>

      {/* ── Bottom sheet portal ── */}
      {mounted && isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="
              relative z-10 w-full
              bg-white dark:bg-zinc-950
              rounded-t-2xl
              shadow-2xl
              flex flex-col
              max-h-[90dvh]
              animate-in slide-in-from-bottom duration-300
            "
            role="dialog"
            aria-modal="true"
            aria-label="Price negotiation"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Chat fills the rest */}
            <NegotiationChat
              product={product}
              selectedVariants={selectedVariants}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}