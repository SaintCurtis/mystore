import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { WishlistStoreProvider } from "@/lib/store/wishlist-store-provider";
import { CompareStoreProvider } from "@/lib/store/compare-store-provider";
import { CurrencyProvider } from "@/lib/store/currency-store-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { SanityLive } from "@/sanity/lib/live";
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
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </AppShell>

                {/* Mobile sticky bottom navigation bar */}
                <MobileBottomBar />

                <CartSheet />
                <WishlistSheet />
                <ChatSheet />
                <CompareBar />
                <PWAInstall />
                <WhatsAppFAB />
                <WelcomePopup />
                <Toaster position="bottom-center" />
                <SanityLive />
              </ChatStoreProvider>
            </CurrencyProvider>
          </CompareStoreProvider>
        </WishlistStoreProvider>
      </CartStoreProvider>
    </ClerkProvider>
  );
}

export default AppLayout;