"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🚨 Prevent hydration mismatch
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-16 items-center rounded-full border p-1 transition-all duration-300"
    >
      <span
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
          isDark ? "translate-x-7 bg-zinc-950" : "translate-x-0 bg-white"
        }`}
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