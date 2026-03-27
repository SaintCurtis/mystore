import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";

/** Display / heading font — bold, architectural, distinctive */
const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/** Body font — clean, legible, premium */
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
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${syne.variable} ${inter.variable} font-body antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}