"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-9 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 opacity-50" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative flex h-9 w-16 shrink-0 items-center rounded-full border p-1
        transition-all duration-300 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
        ${isDark
          ? "border-amber-500/25 bg-[#111111] hover:border-amber-500/50"
          : "border-zinc-300 bg-zinc-100 hover:border-zinc-400"
        }
      `}
    >
      {/* Background track icons */}
      <Sun
        className={`absolute left-1.5 h-3.5 w-3.5 transition-all duration-300
          ${isDark ? "text-zinc-700 scale-75 opacity-60" : "text-amber-500 scale-100 opacity-100"}`}
      />
      <Moon
        className={`absolute right-1.5 h-3.5 w-3.5 transition-all duration-300
          ${isDark ? "text-amber-400 scale-100 opacity-100" : "text-zinc-400 scale-75 opacity-60"}`}
      />

      {/* Sliding thumb */}
      <span
        className={`
          relative z-10 flex h-7 w-7 items-center justify-center rounded-full
          transition-all duration-300 ease-in-out
          ${isDark
            ? "translate-x-7 bg-[#1a1a1a] ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10"
            : "translate-x-0 bg-white ring-1 ring-zinc-200 shadow-md shadow-zinc-300/50"
          }
        `}
      >
        {isDark
          ? <Moon className="h-3.5 w-3.5 text-amber-400" />
          : <Sun className="h-3.5 w-3.5 text-amber-500" />
        }
      </span>
    </button>
  );
}