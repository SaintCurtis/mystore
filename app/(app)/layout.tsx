import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { WishlistStoreProvider } from "@/lib/store/wishlist-store-provider";
import { CompareStoreProvider } from "@/lib/store/compare-store-provider";
import { CurrencyProvider } from "@/lib/store/currency-store-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app/Header";
import { CartSheet } from "@/components/app/CartSheet";
import { ChatSheet } from "@/components/app/ChatSheet";
import { WishlistSheet } from "@/components/app/WishlistSheet";
import { CompareBar } from "@/components/app/CompareBar";
import { PWAInstall } from "@/components/app/PWAInstall";
import { WhatsAppFAB } from "@/components/app/WhatsAppFAB";
import { WelcomePopup } from "@/components/app/WelcomePopup";
import { AppShell } from "@/components/app/AppShell";
import { Footer } from "@/components/app/Footer";
import { MobileBottomBar } from "@/components/app/MobileBottomBar";
import { MobileCategoryPills } from "@/components/app/MobileCategoryPills";
import { BuildMySetupFAB } from "@/components/app/BuildMySetupFAB";
import { ReferralTracker } from "@/components/app/ReferralTracker";
import { Suspense } from "react";

// ── SanityLive removed ────────────────────────────────────────────────────
// SanityLive is only needed for Sanity's Presentation Tool / visual editing
// preview workflow. We don't use that — we use webhook-based revalidation
// instead. SanityLive was causing a redirect to sanity.io/login for all
// visitors on the deployed site regardless of token configuration.
// Content freshness is handled by app/api/revalidate/route.ts + webhooks.

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <CartStoreProvider>
        <WishlistStoreProvider>
          <CompareStoreProvider>
            <CurrencyProvider>
              <ChatStoreProvider>
                <AppShell>
                  <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-200">
                    <Header />
                    <Suspense fallback={<div className="h-10 md:hidden" />}>
                      <MobileCategoryPills />
                    </Suspense>
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </AppShell>
                <MobileBottomBar />
                <BuildMySetupFAB />
                <CartSheet />
                <WishlistSheet />
                <ChatSheet />
                <CompareBar />
                <PWAInstall />
                <WhatsAppFAB />
                <WelcomePopup />
                <Toaster position="bottom-center" />
                <Suspense fallback={null}>
                  <ReferralTracker />
                </Suspense>
              </ChatStoreProvider>
            </CurrencyProvider>
          </CompareStoreProvider>
        </WishlistStoreProvider>
      </CartStoreProvider>
    </ClerkProvider>
  );
}

export default AppLayout;