"use client";

import { useRef } from "react";
import { Download, ShieldCheck, Wallet, Boxes, Undo2, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const POLICY_PDF_URL = "/policies/layaway-deposit-policy.pdf";
const POLICY_FILENAME = "The Saints TechNet - Layaway Deposit Policy.pdf";
const WHATSAPP_NUMBER = "2349060898951";

interface LayawayTermsSheetProps {
  triggerLabel?: string;
  triggerClassName?: string;
}

export function LayawayTermsSheet({
  triggerLabel = "View full Layaway terms",
  triggerClassName,
}: LayawayTermsSheetProps) {
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // Fires the PDF download the moment the sheet opens, so the customer
  // reads the short version here while the full policy lands in their downloads.
  function handleTriggerClick() {
    downloadRef.current?.click();
  }

  return (
    <Sheet>
      {/* Hidden anchor used purely to trigger the silent download */}
      <a
        ref={downloadRef}
        href={POLICY_PDF_URL}
        download={POLICY_FILENAME}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <SheetTrigger
        onClick={handleTriggerClick}
        className={
          triggerClassName ??
          "text-xs font-semibold text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:text-brand-700 dark:hover:text-brand-300"
        }
      >
        {triggerLabel}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-0 pb-0 max-h-[88dvh] flex flex-col gap-0 sm:max-w-lg sm:mx-auto sm:rounded-2xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-2.5 px-5 pt-2 pb-4 shrink-0 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 shrink-0">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Layaway / Deposit Plan
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The short version — the full PDF is downloading now
            </p>
          </div>
        </div>

        {/* Body: brief / excerpt version */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <ul className="space-y-3">
            <li className="flex gap-3">
              <Wallet className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong className="font-semibold">Zero interest, always.</strong>{" "}
                You pay only the item&apos;s price — never more, no matter how long it takes.
              </span>
            </li>
            <li className="flex gap-3">
              <Boxes className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong className="font-semibold">Pay any amount, any time.</strong>{" "}
                No fixed schedule. The item ships only once you&apos;ve paid in full.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong className="font-semibold">Your unit is reserved at 50% paid.</strong>{" "}
                Before that, we hold your spot on a best-effort basis.
              </span>
            </li>
            <li className="flex gap-3">
              <Undo2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong className="font-semibold">Price moves, you&apos;re protected.</strong>{" "}
                Price drops — you get the lower price automatically. Price rises — we notify
                you first; top up or cancel for a full refund, your call. Your locked price is
                valid for 90 days from your start date — plans still open after that get
                re-checked the same way.
              </span>
            </li>
            <li className="flex gap-3">
              <Wallet className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong className="font-semibold">Change your mind anytime.</strong>{" "}
                Cancel and get a refund minus a small 0.85% processing fee (covers what our
                payment provider charges us). Refunds typically reach you in 5–10 business
                days depending on your bank.
              </span>
            </li>
          </ul>

          <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            This is a savings arrangement, not a loan or credit facility. The full policy
            (already on its way to your device) covers every detail, including what happens
            if a plan goes inactive.
          </p>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
          <a
            href={POLICY_PDF_URL}
            download={POLICY_FILENAME}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
          >
            <Download className="h-4 w-4 shrink-0" />
            Download full policy (PDF)
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              "Hi! I have a question about the Layaway / Deposit Plan."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-2.5 text-sm font-semibold text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            Ask a question on WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}