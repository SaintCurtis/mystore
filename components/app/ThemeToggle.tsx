"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative flex h-9 w-16 items-center rounded-full border p-1
        transition-all duration-300 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
        ${isDark
          ? "border-zinc-700 bg-zinc-800 focus-visible:ring-offset-zinc-950"
          : "border-zinc-200 bg-zinc-100 focus-visible:ring-offset-white"
        }
      `}
    >
      {/* Track label icons */}
      <span className="absolute left-2 flex items-center justify-center">
        <Sun
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isDark ? "text-zinc-600" : "text-amber-500 opacity-0"
          }`}
        />
      </span>
      <span className="absolute right-2 flex items-center justify-center">
        <Moon
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isDark ? "text-amber-400 opacity-0" : "text-zinc-400"
          }`}
        />
      </span>

      {/* Sliding thumb */}
      <span
        className={`
          relative z-10 flex h-7 w-7 items-center justify-center rounded-full
          shadow-sm transition-all duration-300 ease-in-out
          ${isDark
            ? "translate-x-7 bg-zinc-950 shadow-zinc-900"
            : "translate-x-0 bg-white shadow-zinc-200"
          }
        `}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}