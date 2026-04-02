"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * Wraps next-themes ThemeProvider.
 * - defaultTheme: "dark" — our brand is dark-first
 * - enableSystem: true — respects OS preference on first visit
 * - disableTransitionOnChange: false — smooth color transitions
 * - attribute: "class" — applies .dark class to <html>
 *
 * next-themes handles:
 * ✅ No flash on load (injects blocking script automatically)
 * ✅ localStorage persistence
 * ✅ System preference detection
 * ✅ Correct SSR hydration
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}