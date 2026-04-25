"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Wand2 } from "lucide-react";

export function BuildMySetupFAB() {
  const [visible, setVisible] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Show after 400px scroll
      setVisible(scrollY > 400);

      // Hide when within 300px of the bottom of the page (footer area)
      const distanceFromBottom = docHeight - scrollY - windowHeight;
      setNearFooter(distanceFromBottom < 300);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // run once on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldShow = visible && !nearFooter;

  return (
    <div
      className={`
        fixed left-4 z-40 md:hidden transition-all duration-500
        bottom-20
        ${shouldShow
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
        }
      `}
    >
      <Link
        href="/build-my-setup"
        className="flex items-center gap-2 rounded-full bg-zinc-900 dark:bg-white px-4 py-2.5 shadow-lg shadow-black/20 border border-zinc-700 dark:border-zinc-200 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Wand2 className="h-4 w-4 text-amber-400 dark:text-amber-500 shrink-0" />
        <span className="text-xs font-bold text-white dark:text-zinc-900 whitespace-nowrap">
          Build My Setup
        </span>
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950">
          AI
        </span>
      </Link>
    </div>
  );
}