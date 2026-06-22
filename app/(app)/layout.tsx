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
import { BuildMySetupFAB } from "@/components/app/BuildMySetupFAB";
import { ReferralTracker } from "@/components/app/ReferralTracker";
import { Suspense } from "react";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#f59e0b",
          colorBackground: "#ffffff",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-body)",
        },
        elements: {
          footer: "hidden",
          card: "shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl",
          headerTitle: "font-extrabold tracking-tight text-zinc-900",
          headerSubtitle: "text-zinc-500",
          formButtonPrimary:
            "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold shadow-sm shadow-amber-500/20 transition-all",
          formFieldInput:
            "border-zinc-200 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 rounded-xl",
          socialButtonsBlockButton:
            "border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl",
          dividerLine: "bg-zinc-100",
          identityPreviewText: "text-zinc-700",
          formResendCodeLink: "text-amber-600 hover:text-amber-500",
        },
      }}
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