import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
          Logic:
          - If user previously chose dark → apply dark
          - If user previously chose light → stay light
          - First visit (nothing stored) → light mode, no system check
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
                  // light or nothing = no class = light mode (default)
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body
        className={`${syne.variable} ${inter.variable} font-body antialiased bg-white text-zinc-900 dark:bg-[#0a0a0a] dark:text-[#f1f1f1]`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}