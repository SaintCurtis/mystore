"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShoppingBag,
  AlertTriangle,
  Loader2,
  Bitcoin,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/app/CheckoutButton";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/app/PaymentMethodSelector";
import { formatPrice } from "@/lib/utils";
import {
  useCartItems,
  useTotalPrice,
  useTotalItems,
  useCartActions,
} from "@/lib/store/cart-store-provider";
import { useCartStock } from "@/lib/hooks/useCartStock";
import { createCryptoCheckoutSession } from "@/lib/actions/crypto-checkout";
import { toast } from "sonner";

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-colors";

const labelClass =
  "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function CheckoutClient() {
  const items = useCartItems();
  const totalPrice = useTotalPrice();
  const totalItems = useTotalItems();
  const { clearCart } = useCartActions();
  const { stockMap, isLoading, hasStockIssues } = useCartStock(items);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [isCryptoLoading, setIsCryptoLoading] = useState(false);

  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    country: "Nigeria",
  });

  const isAddressComplete =
    address.name.trim() !== "" &&
    address.line1.trim() !== "" &&
    address.city.trim() !== "" &&
    address.postcode.trim() !== "" &&
    address.country.trim() !== "";

  async function handleCryptoCheckout() {
    if (!isAddressComplete || hasStockIssues || isLoading) return;
    setIsCryptoLoading(true);
    try {
      const result = await createCryptoCheckoutSession(items, address);
      if (result.success && result.url) {
        clearCart();
        window.location.href = result.url;
      } else {
        toast.error(result.error ?? "Could not start crypto payment");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCryptoLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
            Your cart is empty
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-[#a3a3a3]">
            Add some items to your cart before checking out.
          </p>
          <Button asChild className="mt-8 bg-amber-500 text-zinc-950 hover:bg-amber-400">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-[#a3a3a3] dark:hover:text-[#f1f1f1] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
          Checkout
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left */}
        <div className="space-y-6 lg:col-span-3">

          {/* Cart Items */}
          <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-[#1a1a1a] px-6 py-4">
              <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                Order Summary ({totalItems} items)
              </h2>
            </div>

            {hasStockIssues && !isLoading && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Some items have stock issues. Please update your cart.</span>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <span className="ml-2 text-sm text-zinc-500 dark:text-[#a3a3a3]">
                  Verifying stock...
                </span>
              </div>
            )}

            <div className="divide-y divide-zinc-100 dark:divide-[#1a1a1a]">
              {items.map((item) => {
                const stockInfo = stockMap.get(item.productId);
                const hasIssue = stockInfo?.isOutOfStock || stockInfo?.exceedsStock;

                return (
                  <div
                    key={item.productId}
                    className={`flex gap-4 px-6 py-4 ${hasIssue ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-400">No image</div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-zinc-900 dark:text-[#f1f1f1]">{item.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-[#a3a3a3]">Qty: {item.quantity}</p>
                        {stockInfo?.isOutOfStock && (
                          <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">Out of stock</p>
                        )}
                        {stockInfo?.exceedsStock && !stockInfo.isOutOfStock && (
                          <p className="mt-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                            Only {stockInfo.currentStock} available
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-zinc-900 dark:text-amber-400">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">
                          {formatPrice(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-[#1a1a1a] px-6 py-4">
              <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Shipping Address</h2>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={address.name} onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))} placeholder="John Doe" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address Line 1 <span className="text-red-500">*</span></label>
                <input type="text" value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="12 Lagos Street" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address Line 2 <span className="text-zinc-400">(optional)</span></label>
                <input type="text" value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} placeholder="Apartment, suite, etc." className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City <span className="text-red-500">*</span></label>
                  <input type="text" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="Lagos" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Postcode <span className="text-red-500">*</span></label>
                  <input type="text" value={address.postcode} onChange={(e) => setAddress((a) => ({ ...a, postcode: e.target.value }))} placeholder="100001" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Country <span className="text-red-500">*</span></label>
                <input type="text" value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} placeholder="Nigeria" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4 rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Payment Summary</h2>

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-[#a3a3a3]">Subtotal</span>
                <span className="text-zinc-900 dark:text-[#f1f1f1]">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-[#a3a3a3]">Shipping</span>
                <span className="text-zinc-500 dark:text-[#a3a3a3]">Calculated at checkout</span>
              </div>
              <div className="border-t border-zinc-200 dark:border-[#1a1a1a] pt-3">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-[#f1f1f1]">Total</span>
                  <span className="text-zinc-900 dark:text-amber-400 text-lg">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="border-t border-zinc-100 dark:border-[#1a1a1a] pt-4">
              <PaymentMethodSelector
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {/* Pay Button */}
            <div className="pt-2">
              {paymentMethod === "paystack" ? (
                <CheckoutButton
                  disabled={hasStockIssues || isLoading || !isAddressComplete}
                  shippingAddress={address}
                />
              ) : (
                <Button
                  className="w-full h-12 gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white font-bold hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={hasStockIssues || isLoading || !isAddressComplete || isCryptoLoading}
                  onClick={handleCryptoCheckout}
                >
                  {isCryptoLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing crypto payment...
                    </>
                  ) : (
                    <>
                      <Bitcoin className="h-4 w-4" />
                      Pay with Crypto
                    </>
                  )}
                </Button>
              )}
            </div>

            {!isAddressComplete && (
              <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                Please fill in your shipping address to continue.
              </p>
            )}

            <p className="text-center text-xs text-zinc-400 dark:text-[#555]">
              {paymentMethod === "paystack"
                ? "Redirected to Paystack's secure checkout"
                : "Redirected to NOWPayments — choose your crypto coin there"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}