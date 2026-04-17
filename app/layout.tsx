import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

/**
 * Display / heading font — Plus Jakarta Sans
 * Premium, geometric, confident. Used by Framer, Linear, Vercel-era startups.
 * Replaces Syne which feels too "AI template" in 2026.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/**
 * Body font — DM Sans
 * Cleaner than Inter, more humanist, less overused.
 * Excellent readability at small sizes for product cards and descriptions.
 */
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Saint's TechNet — Built by an Engineer. Trusted by Thousands.",
  description:
    "Premium brand-new and foreign-used laptops, MacBooks, gaming PCs and accessories. CAC-registered. Warranty on every product. Worldwide shipping.",
  keywords: [
    "laptops Nigeria",
    "MacBook Nigeria",
    "gaming laptops Lagos",
    "foreign used laptops",
    "brand new laptops Nigeria",
    "The Saint's TechNet",
  ],
  openGraph: {
    title: "The Saint's TechNet",
    description: "Built by an Engineer. Trusted by Thousands.",
    siteName: "The Saint's TechNet",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Runs BEFORE React hydrates — zero flash guaranteed.
          - If user previously chose dark → apply dark
          - First visit → light mode (no system check)
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body
        className={`${jakarta.variable} ${dmSans.variable} font-body antialiased bg-white text-zinc-900 dark:bg-[#0a0a0a] dark:text-[#f1f1f1]`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}