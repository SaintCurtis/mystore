"use client";

// This bar shows SOCIAL PROOF & PROCESS info — different from the hero trust badges
// Hero badges: Warranty Included · 7-Day Returns · Worldwide Shipping
// This bar: ratings, stock count, engineer story, response time, location — complementary not duplicate

export function MobileTrustBar() {
  return (
    <div className="md:hidden overflow-x-auto scrollbar-hide border-b border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a]">
      <div className="flex items-center gap-0 whitespace-nowrap text-[11px] font-semibold text-zinc-500 dark:text-[#888]">
        {[
          { emoji: "🔧", text: "Engineer-Inspected" },
          { emoji: "⚡", text: "Fast Response" },
          { emoji: "🇳🇬", text: "Lagos-Based" },
          { emoji: "💬", text: "WhatsApp Support" },
          { emoji: "🔒", text: "Secure Checkout" },
          { emoji: "🏆", text: "1000+ Happy Buyers" },
        ].map(({ emoji, text }) => (
          <div
            key={text}
            className="flex items-center gap-1.5 px-4 py-2.5 border-r border-zinc-100 dark:border-[#1a1a1a] last:border-r-0 shrink-0"
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}