"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartItems, useTotalPrice } from "@/lib/store/cart-store-provider";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { toast } from "sonner";

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

interface CheckoutButtonProps {
  disabled?: boolean;
  shippingAddress: ShippingAddress;
  shippingFee?: number;
  shippingMethod?: string;
}

export function CheckoutButton({
  disabled,
  shippingAddress,
  shippingFee = 0,
  shippingMethod,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const items = useCartItems();
  const totalPrice = useTotalPrice();

  async function handleCheckout() {
    if (disabled || isLoading) return;
    setIsLoading(true);
    try {
      const result = await createCheckoutSession(
        items,
        shippingAddress,
        shippingFee,
        shippingMethod,
      );
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error ?? "Could not initialize payment");
        setIsLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  const grandTotal = totalPrice + shippingFee;

  return (
    <Button
      className="w-full h-12 gap-2 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      disabled={disabled || isLoading}
      onClick={handleCheckout}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting to Paystack...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Pay with Card / Bank
        </>
      )}
    </Button>
  );
}