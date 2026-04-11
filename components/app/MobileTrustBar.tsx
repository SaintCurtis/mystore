"use client";

export function MobileTrustBar() {
  return (
    <div className="md:hidden overflow-x-auto scrollbar-hide border-b border-zinc-200 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#0f0f0f]">
      <div className="flex items-center gap-0 whitespace-nowrap text-[11px] font-semibold text-zinc-600 dark:text-[#a3a3a3]">
        {[
          { emoji: "✅", text: "Engineer Verified" },
          { emoji: "🛡️", text: "CAC Registered" },
          { emoji: "↩️", text: "7-Day Returns" },
          { emoji: "📦", text: "Warranty on All" },
          { emoji: "🌍", text: "Ships Worldwide" },
          { emoji: "⭐", text: "Since 2019" },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-1 px-3 py-2 border-r border-zinc-200 dark:border-[#1a1a1a] last:border-r-0 shrink-0">
            <span>{emoji}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}