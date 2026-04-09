import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, MessageCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { getCheckoutSession } from "@/lib/actions/checkout";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Confirmed | The Saint's TechNet",
  description: "Your order has been placed successfully",
};

interface SuccessPageProps {
  searchParams: Promise<{ reference?: string; crypto?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const reference = params.reference;
  const isCrypto = params.crypto === "true";

  // For crypto payments — show confirmation without verifying (webhook handles order)
  if (isCrypto) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4 transition-colors">
        <div className="mx-auto max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10">
              <CheckCircle2 className="h-10 w-10 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-[#f1f1f1]">
              Payment Submitted!
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-[#a3a3a3]">
              Your crypto payment is being confirmed on the blockchain. Your order will appear in My Orders once the payment is verified (usually within 10–30 minutes).
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5 text-left space-y-3">
            <p className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1]">What happens next?</p>
            {[
              "NOWPayments confirms your crypto transaction",
              "Your order is automatically created",
              "We prepare and ship your items",
              "You'll receive updates via WhatsApp",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-600 dark:text-[#a3a3a3]">{step}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 h-11">
              <Link href="/orders">
                <Package className="mr-2 h-4 w-4" /> Track My Orders
              </Link>
            </Button>
            <a
              href="https://wa.me/2349060898951?text=Hi%2C%20I%20just%20made%20a%20crypto%20payment%20and%20want%20to%20confirm%20my%20order."
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/15 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              Confirm via WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!reference) redirect("/");

  const result = await getCheckoutSession(reference);

  if (!result.success || !result.session) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-[#f1f1f1]">Payment Verification Failed</h1>
          <p className="text-zinc-500 dark:text-[#a3a3a3]">We couldn't verify your payment. If money was deducted, please contact us on WhatsApp.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline"><Link href="/">Go Home</Link></Button>
            <a href="https://wa.me/2349060898951" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:bg-[#20b858] transition-colors">
              <MessageCircle className="h-4 w-4" /> WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { session } = result;
  const whatsappMsg = encodeURIComponent(
    `Hi! I just placed an order on The Saint's TechNet.\n\nReference: ${reference}\nAmount: ${session.amountTotal ? formatPrice(session.amountTotal / 100) : "—"}\n\nPlease confirm my order. Thank you!`
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4 py-12 transition-colors">
      <div className="mx-auto max-w-md w-full space-y-6">

        {/* Success icon */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              <span className="absolute -inset-1 rounded-2xl animate-ping opacity-20 bg-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-[#f1f1f1]">
              Order Confirmed! 🎉
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-[#a3a3a3]">
              Thank you{session.customerName ? `, ${session.customerName.split(" ")[0]}` : ""}! Your order has been placed successfully.
            </p>
          </div>
        </div>

        {/* Order details card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
          <div className="border-b border-zinc-100 dark:border-[#1a1a1a] bg-amber-50 dark:bg-amber-500/5 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Payment Reference
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-zinc-900 dark:text-[#f1f1f1] break-all">
              {reference}
            </p>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-[#1a1a1a] px-5">
            {session.customerEmail && (
              <div className="flex justify-between py-3 text-sm">
                <span className="text-zinc-500 dark:text-[#a3a3a3]">Email</span>
                <span className="font-medium text-zinc-900 dark:text-[#f1f1f1] truncate max-w-[200px]">{session.customerEmail}</span>
              </div>
            )}
            {session.amountTotal && (
              <div className="flex justify-between py-3 text-sm">
                <span className="text-zinc-500 dark:text-[#a3a3a3]">Amount Paid</span>
                <span className="font-bold text-zinc-900 dark:text-amber-400">{formatPrice(session.amountTotal / 100)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 text-sm">
              <span className="text-zinc-500 dark:text-[#a3a3a3]">Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Paid</span>
            </div>
          </div>
        </div>

        {/* What's next */}
        <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5 space-y-3">
          <p className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1]">What happens next?</p>
          {[
            "We verify your payment and prepare your items",
            "You'll receive a WhatsApp update when it ships",
            "Track your order anytime in My Orders",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-600 dark:text-amber-400">
                {i + 1}
              </span>
              <p className="text-sm text-zinc-600 dark:text-[#a3a3a3]">{step}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full h-11 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400">
            <Link href="/orders">
              <Package className="mr-2 h-4 w-4" /> Track My Order
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <a href={`https://wa.me/2349060898951?text=${whatsappMsg}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/8 px-3 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/15 transition-all">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Button asChild variant="outline"
              className="border-zinc-200 dark:border-[#2a2a2a] dark:text-[#a3a3a3] dark:hover:bg-[#1a1a1a]">
              <Link href="/">
                <ShoppingBag className="mr-1.5 h-4 w-4" /> Shop More
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}