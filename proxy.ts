import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ── Protected routes — require sign-in at the EDGE ─────────────────────────
//
// IMPORTANT: We only protect /orders here.
//
// /checkout is intentionally NOT protected here because:
// 1. Unsigned users should see the friendly AuthGate UI (Sign In / Create Account)
//    rather than a raw Clerk redirect to /sign-in which 404s
// 2. /checkout/success must stay open so Paystack's redirect lands cleanly
//
// The CheckoutClient component handles auth itself — if the user isn't
// signed in, it shows the AuthGate with Sign In / Create Account buttons.
//
const isProtectedRoute = createRouteMatcher([
  "/orders(.*)",   // /orders and /orders/[id] — must be signed in
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};