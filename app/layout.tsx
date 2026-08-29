import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SITE_URL } from "@/lib/constants/site";

// Self-hosted (no longer fetched from Google Fonts at build time — that
// fetch was failing intermittently and taking the whole build down with
// it). Files are the exact same DM Sans / Plus Jakarta Sans releases,
// copied from @fontsource into ./fonts so the build never needs network
// access to render text.
const jakarta = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans/plus-jakarta-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plus-jakarta-sans/plus-jakarta-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plus-jakarta-sans/plus-jakarta-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans/plus-jakarta-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/plus-jakarta-sans/plus-jakarta-sans-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const dmSans = localFont({
  src: [
    { path: "./fonts/dm-sans/dm-sans-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/dm-sans/dm-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/dm-sans/dm-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/dm-sans/dm-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/dm-sans/dm-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

function ChunkErrorHandler() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function isChunkError(msg) {
              msg = msg || '';
              return (
                msg.indexOf('Loading chunk') !== -1 ||
                msg.indexOf('Failed to load chunk') !== -1 ||
                msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
                msg.indexOf('ChunkLoadError') !== -1
              );
            }
            function reloadOnce() {
              if (!sessionStorage.getItem('chunk_reload')) {
                sessionStorage.setItem('chunk_reload', '1');
                window.location.reload();
              }
            }
            window.addEventListener('error', function(e) {
              if (isChunkError(e.message)) reloadOnce();
            });
            // Turbopack/webpack failed dynamic imports surface as a
            // rejected promise, not a window 'error' event — this was
            // previously unhandled entirely.
            window.addEventListener('unhandledrejection', function(e) {
              var msg = (e.reason && e.reason.message) || String(e.reason || '');
              if (isChunkError(msg)) reloadOnce();
            });
            window.addEventListener('load', function() {
              sessionStorage.removeItem('chunk_reload');
            });
          })();
        `,
      }}
    />
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Saint's TechNet — Engineer-Verified. Community-Trusted.",
    template: "%s | The Saint's TechNet",
  },
  description:
    "The smartest way to buy premium brand-new and foreign-used tech — engineer-verified, warranted, and shipped worldwide. Registered and recognized, serving thousands since 2019.",
  keywords: [
    "laptops Nigeria", "MacBook Nigeria", "gaming laptops Lagos",
    "foreign used laptops", "brand new laptops Nigeria", "The Saint's TechNet",
    "tech store Lagos", "buy laptop Lagos", "ACASIS Nigeria",
    "monitors Lagos", "gaming PC Nigeria", "EcoFlow Nigeria", "Starlink Nigeria",
  ],
  authors: [{ name: "The Saint's TechNet", url: SITE_URL }],
  creator: "The Saint's TechNet",
  publisher: "The Saint's Technology Networks",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    siteName: "The Saint's TechNet",
    title: "The Saint's TechNet — Engineer-Verified. Community-Trusted.",
    description:
      "Premium brand-new and foreign-used tech — engineer-verified, warranted, and shipped worldwide. CAC-registered since 2019.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "The Saint's TechNet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Saint's TechNet — Engineer-Verified. Community-Trusted.",
    description: "Premium brand-new and foreign-used tech — engineer-verified, warranted, and shipped worldwide.",
    images: [`${SITE_URL}/og-image.jpg`],
    creator: "@Saint_Curtis_",
    site: "@Saint_Curtis_",
  },
  alternates: { canonical: SITE_URL },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saint's TechNet",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ChunkErrorHandler />
        <meta name="theme-color" content="#1a56db" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){document.documentElement.classList.remove('dark')}})();`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} ${dmSans.variable} font-body antialiased transition-colors duration-300`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}