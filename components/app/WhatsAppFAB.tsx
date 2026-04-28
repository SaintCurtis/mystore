"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_NUMBER = "2349060898951";

export function WhatsAppFAB() {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 200);
      setScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setScrolling(false), 1000);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const chatUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi! I'm browsing The Saint's TechNet and need some help."
  )}`;

  // On mobile: always visible (bottom-[72px] clears the MobileBottomBar which is ~56px tall)
  // On desktop: only visible after scrolling 200px
  return (
    <div
      className={`
        fixed z-50 flex flex-col items-end gap-2
        right-4
        bottom-[72px] md:bottom-6
        transition-all duration-300
        md:opacity-0 md:translate-y-4 md:pointer-events-none
        ${scrolled ? "md:!opacity-100! md:!translate-y-0! md:!pointer-events-auto!" : ""}
        opacity-100 translate-y-0 pointer-events-auto
      `}
    >
      {/* Expanded quick-reply bubble */}
      {expanded && (
        <div className="mb-1 rounded-2xl rounded-br-sm border border-[#25D366]/20 bg-white dark:bg-[#111111] shadow-xl dark:shadow-black/50 p-4 w-56 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-zinc-900 dark:text-[#f1f1f1]">Chat with us</p>
            <button
              onClick={() => setExpanded(false)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#a3a3a3] mb-3 leading-relaxed">
            We&apos;re online! Ask about any product, pricing, or your order.
          </p>
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white hover:bg-[#20b858] transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Start Chat
          </a>
        </div>
      )}

      {/* FAB button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label="Chat on WhatsApp"
        className={`
          relative flex items-center justify-center rounded-full
          bg-[#25D366] shadow-lg shadow-[#25D366]/40
          hover:bg-[#20b858] active:scale-95
          transition-all duration-300 ease-in-out
          ${scrolling
            ? "h-10 w-10 opacity-70"
            : "h-14 w-14 opacity-100"
          }
        `}
      >
        {expanded
          ? <X className={`text-white transition-all duration-300 ${scrolling ? "h-4 w-4" : "h-6 w-6"}`} />
          : <MessageCircle className={`text-white transition-all duration-300 ${scrolling ? "h-4 w-4" : "h-6 w-6"}`} />
        }
        {!expanded && !scrolling && (
          <span className="absolute h-14 w-14 rounded-full animate-ping bg-[#25D366] opacity-20" />
        )}
      </button>
    </div>
  );
}