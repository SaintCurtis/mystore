import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SITE_URL } from "@/lib/constants/site";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

function ChunkErrorHandler() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            window.addEventListener('error', function(e) {
              var msg = e.message || '';
              if (
                msg.indexOf('Loading chunk') !== -1 ||
                msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
                msg.indexOf('ChunkLoadError') !== -1
              ) {
                if (!sessionStorage.getItem('chunk_reload')) {
                  sessionStorage.setItem('chunk_reload', '1');
                  window.location.reload();
                }
              }
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
    "Premium brand-new and foreign-used laptops, MacBooks, gaming PCs, monitors, accessories and content creation gear. CAC-registered. Warranty on every product. Worldwide shipping since 2019.",
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
        <meta name="theme-color" content="#f59e0b" />
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