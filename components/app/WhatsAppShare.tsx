"use client";

import { MessageCircle, Share2 } from "lucide-react";

interface WhatsAppShareProps {
  productName: string;
  productUrl: string;
  price: string;
  /** "share" = customer sharing with friends, "ask" = customer asking you about the product */
  variant?: "share" | "ask" | "both";
}

const WHATSAPP_NUMBER = "2349060898951"; // no + sign

export function WhatsAppShare({
  productName,
  productUrl,
  price,
  variant = "both",
}: WhatsAppShareProps) {
  function buildAskUrl() {
    const message = encodeURIComponent(
      `Hi, I'm interested in this product:\n\n*${productName}*\nPrice: ${price}\n${productUrl}\n\nCould you give me more details?`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  function buildShareUrl() {
    const message = encodeURIComponent(
      `Check out this product on The Saint's TechNet:\n\n*${productName}*\nPrice: ${price}\n${productUrl}`
    );
    return `https://wa.me/?text=${message}`;
  }

  if (variant === "ask") {
    return (
      <a
        href={buildAskUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-2.5 text-sm font-semibold text-[#25D366] transition-all duration-200 hover:bg-[#25D366]/15 hover:border-[#25D366]/50"
      >
        <MessageCircle className="h-4 w-4" />
        Ask about this product
      </a>
    );
  }

  if (variant === "share") {
    return (
      <a
        href={buildShareUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-[#a3a3a3] transition-all duration-200 hover:border-[#25D366]/40 hover:text-[#25D366] dark:hover:text-[#25D366]"
      >
        <Share2 className="h-4 w-4" />
        Share on WhatsApp
      </a>
    );
  }

  // Both
  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={buildAskUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/8 px-3 py-2.5 text-sm font-semibold text-[#25D366] transition-all duration-200 hover:bg-[#25D366]/15 hover:border-[#25D366]/50"
      >
        <MessageCircle className="h-4 w-4" />
        Ask about it
      </a>
      <a
        href={buildShareUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-[#a3a3a3] transition-all duration-200 hover:border-[#25D366]/40 hover:text-[#25D366]"
      >
        <Share2 className="h-4 w-4" />
        Share
      </a>
    </div>
  );
}