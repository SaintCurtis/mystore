"use client";

// components/analytics/AnalyticsScripts.tsx
//
// Loads GA4 and Meta Pixel — only the ones that have an ID configured, so
// this is safe to leave mounted permanently even before either account
// exists. Also fires a page_view/PageView on every client-side route
// change: Next.js App Router navigation never triggers a real browser page
// load after the first one, so without this, only the very first page a
// visitor lands on would ever get tracked — every product page, category
// browse, and checkout step after that would be invisible.

import { useEffect, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/analytics/track";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    pageview(query ? `${pathname}?${query}` : pathname);
    // Re-fires on every path/query change — each is a distinct page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsScripts() {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false });
              window.gtag = gtag;
            `}
          </Script>
        </>
      )}

      {META_PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {(GA_ID || META_PIXEL_ID) && (
        // useSearchParams() requires a Suspense boundary in the App Router.
        <Suspense fallback={null}>
          <RouteChangeTracker />
        </Suspense>
      )}
    </>
  );
}
